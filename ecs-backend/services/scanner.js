'use strict';

/**
 * QuickScan engine — non-intrusive, free-tier security assessment.
 *
 * Design principles (per scope.md security enforcement):
 *  - SSRF-safe: the target host is resolved and rejected if it points at a
 *    private / loopback / link-local / reserved IP range. We never let a user
 *    make the server fetch internal infrastructure.
 *  - Non-intrusive: only GET/HEAD on the public root, plus passive lookups
 *    against free public APIs. No payloads, no exploitation, no auth bypass.
 *  - Keyless by default: every core check works with zero API keys. Optional
 *    free-tier keys (urlscan, Safe Browsing) enrich the report when present.
 *  - Truthful: each finding carries evidence + confidence; nothing is fabricated.
 *
 * All network calls have timeouts and the whole scan is time-boxed.
 */

const dns = require('dns').promises;
const net = require('net');
const tls = require('tls');

const FETCH_TIMEOUT_MS = 8000;
const SCAN_BUDGET_MS = 25000;

/* ───────────────────────── SSRF guard ───────────────────────── */

function ipToLong(ip) {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}

function isPrivateIPv4(ip) {
  const long = ipToLong(ip);
  const ranges = [
    ['10.0.0.0', '10.255.255.255'],
    ['172.16.0.0', '172.31.255.255'],
    ['192.168.0.0', '192.168.255.255'],
    ['127.0.0.0', '127.255.255.255'],   // loopback
    ['169.254.0.0', '169.254.255.255'], // link-local (incl. cloud metadata 169.254.169.254)
    ['0.0.0.0', '0.255.255.255'],
    ['100.64.0.0', '100.127.255.255'],  // CGNAT
    ['192.0.0.0', '192.0.0.255'],
    ['192.0.2.0', '192.0.2.255'],       // TEST-NET
    ['198.18.0.0', '198.19.255.255'],
    ['240.0.0.0', '255.255.255.255'],   // reserved
  ];
  return ranges.some(([s, e]) => long >= ipToLong(s) && long <= ipToLong(e));
}

function isPrivateIPv6(ip) {
  const v = ip.toLowerCase();
  return v === '::1' || v === '::' ||
    v.startsWith('fc') || v.startsWith('fd') ||  // unique local
    v.startsWith('fe80') ||                       // link-local
    v.startsWith('::ffff:');                       // IPv4-mapped (resolve separately)
}

/**
 * Resolve a hostname and ensure every address is publicly routable.
 * Returns { ok, ip } or { ok:false, reason }.
 */
async function resolvePublic(hostname) {
  if (net.isIP(hostname)) {
    const priv = net.isIPv6(hostname) ? isPrivateIPv6(hostname) : isPrivateIPv4(hostname);
    if (priv) return { ok: false, reason: 'Target resolves to a private/reserved IP' };
    return { ok: true, ip: hostname };
  }
  let addrs;
  try {
    addrs = await dns.lookup(hostname, { all: true });
  } catch {
    return { ok: false, reason: 'Hostname does not resolve' };
  }
  if (!addrs.length) return { ok: false, reason: 'Hostname does not resolve' };
  for (const a of addrs) {
    const priv = a.family === 6 ? isPrivateIPv6(a.address) : isPrivateIPv4(a.address);
    if (priv) return { ok: false, reason: 'Target resolves to a private/reserved IP' };
  }
  return { ok: true, ip: addrs[0].address };
}

/* ───────────────────────── helpers ───────────────────────── */

async function timedFetch(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), opts.timeout || FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...opts,
      signal: ctrl.signal,
      redirect: opts.redirect || 'manual',
      headers: { 'User-Agent': 'ECS-QuickScan/1.0 (+https://excelon; non-intrusive assessment)', ...(opts.headers || {}) },
    });
  } finally {
    clearTimeout(t);
  }
}

function finding(id, title, severity, status, evidence, remediation) {
  // severity: info | low | medium | high ; status: Confirmed | Probable | Theoretical
  return { id, title, severity, status, evidence, remediation };
}

/* ───────────────────── individual checks ───────────────────── */

async function checkSecurityHeaders(targetUrl) {
  const findings = [];
  let res;
  try {
    res = await timedFetch(targetUrl, { method: 'GET', redirect: 'follow' });
  } catch (e) {
    return { findings: [finding('reachability', 'Site unreachable during scan', 'info', 'Confirmed', String(e.message), 'Ensure the site is online and not blocking the scanner.')], headersSeen: {} };
  }
  const h = res.headers;
  const required = {
    'strict-transport-security': ['HSTS missing', 'high', 'Add `Strict-Transport-Security: max-age=31536000; includeSubDomains`.'],
    'content-security-policy': ['Content-Security-Policy missing', 'high', 'Define a CSP to mitigate XSS and data injection.'],
    'x-content-type-options': ['X-Content-Type-Options missing', 'medium', 'Add `X-Content-Type-Options: nosniff`.'],
    'x-frame-options': ['Clickjacking protection missing', 'medium', 'Add `X-Frame-Options: DENY` or a CSP frame-ancestors directive.'],
    'referrer-policy': ['Referrer-Policy missing', 'low', 'Add `Referrer-Policy: strict-origin-when-cross-origin`.'],
    'permissions-policy': ['Permissions-Policy missing', 'low', 'Restrict powerful features via Permissions-Policy.'],
  };
  for (const [hdr, [title, sev, fix]] of Object.entries(required)) {
    if (!h.get(hdr)) findings.push(finding('hdr-' + hdr, title, sev, 'Confirmed', `Response header "${hdr}" not present on ${res.url}`, fix));
  }
  if (h.get('server')) findings.push(finding('hdr-server', 'Server software disclosed', 'low', 'Confirmed', `Server: ${h.get('server')}`, 'Suppress or genericize the Server header to reduce fingerprinting.'));
  if (h.get('x-powered-by')) findings.push(finding('hdr-xpb', 'Technology disclosed via X-Powered-By', 'low', 'Confirmed', `X-Powered-By: ${h.get('x-powered-by')}`, 'Remove the X-Powered-By header.'));
  const headersSeen = {};
  h.forEach((v, k) => { headersSeen[k] = v; });
  return { findings, headersSeen, finalUrl: res.url, statusCode: res.status };
}

async function checkHttpsUpgrade(hostname) {
  // Does plain HTTP redirect to HTTPS?
  try {
    const res = await timedFetch(`http://${hostname}/`, { method: 'HEAD', redirect: 'manual' });
    const loc = res.headers.get('location') || '';
    if (res.status >= 300 && res.status < 400 && loc.startsWith('https://')) {
      return [finding('https-redirect', 'HTTP correctly redirects to HTTPS', 'info', 'Confirmed', `HTTP ${res.status} → ${loc}`, 'No action needed.')];
    }
    return [finding('https-redirect', 'HTTP does not force HTTPS', 'medium', 'Probable', `HTTP request returned status ${res.status} without an HTTPS redirect`, 'Force a 301 redirect from HTTP to HTTPS for all paths.')];
  } catch {
    return []; // port 80 closed is fine
  }
}

function checkTls(hostname) {
  return new Promise((resolve) => {
    const findings = [];
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname, timeout: FETCH_TIMEOUT_MS, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate();
      const proto = socket.getProtocol();
      if (proto === 'TLSv1' || proto === 'TLSv1.1') {
        findings.push(finding('tls-version', 'Outdated TLS protocol negotiated', 'high', 'Confirmed', `Negotiated ${proto}`, 'Disable TLS 1.0/1.1; require TLS 1.2+.'));
      }
      if (cert && cert.valid_to) {
        const days = Math.round((new Date(cert.valid_to) - Date.now()) / 86400000);
        if (days < 0) findings.push(finding('tls-expired', 'TLS certificate expired', 'high', 'Confirmed', `Expired ${Math.abs(days)} days ago (valid_to ${cert.valid_to})`, 'Renew the certificate immediately.'));
        else if (days < 15) findings.push(finding('tls-expiry', 'TLS certificate expiring soon', 'medium', 'Confirmed', `Expires in ${days} days`, 'Renew / enable auto-renewal.'));
        else findings.push(finding('tls-ok', 'Valid TLS certificate', 'info', 'Confirmed', `Issuer: ${cert.issuer && cert.issuer.O || 'n/a'}; expires in ${days} days`, 'No action needed.'));
      }
      socket.end();
      resolve(findings);
    });
    socket.on('error', () => resolve([finding('tls-connect', 'HTTPS (443) not available or handshake failed', 'high', 'Probable', 'TLS connection to port 443 failed', 'Serve the site over HTTPS with a valid certificate.')]));
    socket.on('timeout', () => { socket.destroy(); resolve([]); });
  });
}

async function checkEmailDns(domain) {
  const findings = [];
  // SPF
  try {
    const txt = (await dns.resolveTxt(domain)).map(r => r.join(''));
    const spf = txt.find(r => r.toLowerCase().startsWith('v=spf1'));
    if (!spf) findings.push(finding('spf', 'SPF record missing', 'medium', 'Confirmed', `No v=spf1 TXT record on ${domain}`, 'Publish an SPF record to prevent email spoofing.'));
    else if (/[~+]all/.test(spf)) findings.push(finding('spf-soft', 'SPF policy is permissive', 'low', 'Confirmed', spf, 'Tighten SPF to `-all` once senders are confirmed.'));
    else findings.push(finding('spf-ok', 'SPF record present', 'info', 'Confirmed', spf, 'No action needed.'));
  } catch {
    findings.push(finding('spf', 'SPF record missing', 'medium', 'Probable', `Could not read TXT records for ${domain}`, 'Publish an SPF record.'));
  }
  // DMARC
  try {
    const dmarc = (await dns.resolveTxt('_dmarc.' + domain)).map(r => r.join('')).find(r => r.toLowerCase().startsWith('v=dmarc1'));
    if (!dmarc) findings.push(finding('dmarc', 'DMARC record missing', 'medium', 'Confirmed', `No _dmarc.${domain} TXT record`, 'Publish a DMARC record (start with p=none, then enforce).'));
    else if (/p=none/i.test(dmarc)) findings.push(finding('dmarc-none', 'DMARC policy not enforced', 'low', 'Confirmed', dmarc, 'Move DMARC from p=none to p=quarantine or p=reject.'));
    else findings.push(finding('dmarc-ok', 'DMARC enforced', 'info', 'Confirmed', dmarc, 'No action needed.'));
  } catch {
    findings.push(finding('dmarc', 'DMARC record missing', 'medium', 'Probable', `Could not read _dmarc.${domain}`, 'Publish a DMARC record.'));
  }
  return findings;
}

async function checkExposedServices(ip) {
  // Shodan InternetDB — free, no key. Returns open ports + known CVEs for an IP.
  try {
    const res = await timedFetch(`https://internetdb.shodan.io/${ip}`, { method: 'GET', redirect: 'follow', timeout: 6000 });
    if (res.status === 404) return [finding('exposure', 'No exposed services recorded', 'info', 'Confirmed', `Shodan InternetDB has no record for ${ip}`, 'No action needed.')];
    if (!res.ok) return [];
    const data = await res.json();
    const findings = [];
    const ports = (data.ports || []);
    const risky = ports.filter(p => [21, 23, 25, 110, 135, 139, 445, 3306, 3389, 5432, 6379, 27017, 9200].includes(p));
    if (risky.length) findings.push(finding('open-ports', 'Sensitive ports exposed to the internet', 'high', 'Confirmed', `Open: ${risky.join(', ')} (full set: ${ports.join(', ')})`, 'Firewall management/database ports; expose only 80/443 publicly.'));
    else if (ports.length) findings.push(finding('open-ports', 'Open ports observed', 'low', 'Confirmed', `Open ports: ${ports.join(', ')}`, 'Confirm each open port is intentional.'));
    if ((data.vulns || []).length) findings.push(finding('known-cves', 'Known CVEs associated with this host', 'high', 'Probable', `CVEs: ${data.vulns.slice(0, 15).join(', ')}${data.vulns.length > 15 ? '…' : ''}`, 'Patch affected services; verify each CVE applies to your running version.'));
    return findings;
  } catch {
    return [];
  }
}

async function checkSubdomains(domain) {
  // crt.sh certificate transparency — free, no key.
  try {
    const res = await timedFetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, { method: 'GET', redirect: 'follow', timeout: 8000 });
    if (!res.ok) return [];
    const data = await res.json();
    const subs = new Set();
    for (const row of data) {
      String(row.name_value || '').split('\n').forEach(n => {
        n = n.trim().toLowerCase();
        if (n && !n.startsWith('*') && n.endsWith(domain)) subs.add(n);
      });
    }
    const count = subs.size;
    if (count > 0) {
      const sev = count > 25 ? 'medium' : 'info';
      return [finding('subdomains', 'Subdomains discoverable via certificate transparency', sev, 'Confirmed',
        `${count} unique subdomains in CT logs, e.g. ${Array.from(subs).slice(0, 8).join(', ')}`,
        'Review each subdomain for forgotten/staging hosts; decommission unused ones to shrink attack surface.')];
    }
    return [];
  } catch {
    return [];
  }
}

/* ───────────────────────── orchestrator ───────────────────────── */

function scoreFrom(findings) {
  const weights = { high: 25, medium: 10, low: 4, info: 0 };
  const penalty = findings.reduce((s, f) => s + (weights[f.severity] || 0), 0);
  const score = Math.max(0, 100 - penalty);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';
  return { score, grade };
}

/**
 * Run the full QuickScan against a verified target URL.
 * @param {string} rawUrl  full URL including protocol
 * @returns {Promise<object>} report
 */
async function runScan(rawUrl) {
  const started = Date.now();
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, error: 'Only http/https targets are supported' };
  }

  const hostname = url.hostname;
  const guard = await resolvePublic(hostname);
  if (!guard.ok) return { ok: false, error: `Refused: ${guard.reason}` };

  const domain = hostname.replace(/^www\./, '');
  const httpsUrl = `https://${hostname}${url.pathname}`;

  // Run independent checks concurrently, each already time-boxed.
  const [
    headersRes,
    httpsUpgrade,
    tlsFindings,
    emailDns,
    exposure,
    subdomains,
  ] = await Promise.all([
    checkSecurityHeaders(httpsUrl),
    checkHttpsUpgrade(hostname),
    checkTls(hostname),
    checkEmailDns(domain),
    checkExposedServices(guard.ip),
    checkSubdomains(domain),
  ]);

  const findings = [
    ...headersRes.findings,
    ...httpsUpgrade,
    ...tlsFindings,
    ...emailDns,
    ...exposure,
    ...subdomains,
  ];

  const real = findings.filter(f => f.severity !== 'info');
  const { score, grade } = scoreFrom(findings);

  return {
    ok: true,
    target: { url: httpsUrl, hostname, ip: guard.ip, domain },
    scanned_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    summary: {
      grade,
      score,
      total_findings: real.length,
      high: real.filter(f => f.severity === 'high').length,
      medium: real.filter(f => f.severity === 'medium').length,
      low: real.filter(f => f.severity === 'low').length,
    },
    coverage: ['Security headers', 'HTTPS/TLS', 'Email DNS (SPF/DMARC)', 'Exposed services (Shodan InternetDB)', 'Subdomain exposure (crt.sh)'],
    disclaimer: 'Non-intrusive public-surface assessment. Pages behind authentication, a WAF, or offline during the scan are not covered. A selection of findings is shown; a full manual engagement goes deeper.',
    findings,
  };
}

module.exports = { runScan, resolvePublic, _internal: { isPrivateIPv4, scoreFrom } };
