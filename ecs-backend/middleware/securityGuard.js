// ── Injection guard (defense in depth) ────────────────────────
// Route validators (express-validator) are the primary gate; this layer
// catches payloads that bypass client-side validation entirely (Burp/curl),
// logs a structured SECURITY ALERT + EDR event, and refuses the request
// with a taunt instead of a generic error.
// Patterns map to OWASP Top 10 / PortSwigger attack classes and are chosen
// to stay quiet on normal prose (CWE-79, CWE-89, CWE-22, CWE-94, CWE-93).
const jwt = require('jsonwebtoken');
const { buildTaunt } = require('./taunts');
const edr = require('../services/edr');

const PATTERNS = [
  { name: 'xss-script-tag',      re: /<\s*(script|iframe|object|embed)[\s>/]/i },
  { name: 'xss-js-uri',          re: /\bjavascript\s*:/i },
  { name: 'xss-event-handler',   re: /\bon(?:error|load|click|mouseover|focus|pointerover|animationend)\s*=/i },
  { name: 'path-traversal',      re: /(?:\.\.\/|\.\.\\){2,}/ },
  { name: 'sqli-union',          re: /\bunion\b[\s\S]{0,40}\bselect\b/i },
  { name: 'sqli-comment-attack', re: /\b(select|insert|update|delete|drop|alter)\b[\s\S]{0,60}\b(from|into|table|database|where)\b[\s\S]{0,200}(--|\/\*|#\s*$)/im },
  { name: 'sqli-tautology',      re: /['"]\s*(or|and)\s+['"\d][^=]{0,16}=/i },
  { name: 'template-injection',  re: /\$\{[^}]{0,120}\}|\{\{[^}]{0,120}\}\}/ },
  { name: 'crlf-header-inject',  re: /[\r\n](?:to|cc|bcc|content-type|location|set-cookie)\s*:/i },
  { name: 'null-byte',           re: /\x00|%00/ },
  { name: 'cmd-substitution',    re: /\$\((?:[^)]{1,120})\)|`[^`]{1,120}`/ },
  // Express already URL-decodes query/body once — seeing literal %XX
  // sequences survive into the parsed value means the payload was encoded
  // twice (or more), a classic filter-evasion technique (PortSwigger:
  // "bypassing WAFs via encoding").
  { name: 'url-encoding-evasion', re: /(?:%[0-9a-f]{2}.*?){3,}/i },
];

function scan(value, path, findings, depth) {
  if (depth > 6 || findings.length) return;
  if (typeof value === 'string') {
    for (const p of PATTERNS) {
      if (p.re.test(value)) { findings.push({ field: path, rule: p.name, sample: value.slice(0, 120) }); return; }
    }
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scan(v, `${path}[${i}]`, findings, depth + 1));
  } else if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) scan(value[k], path ? `${path}.${k}` : k, findings, depth + 1);
  }
}

function isVerifiedAdmin(req) {
  const token = req.cookies && req.cookies.ecs_admin_token;
  if (!token || !process.env.JWT_SECRET) return false;
  try { return jwt.verify(token, process.env.JWT_SECRET).role === 'admin'; } catch { return false; }
}

module.exports = function securityGuard(req, res, next) {
  const findings = [];
  scan(req.body, 'body', findings, 0);
  scan(req.query, 'query', findings, 0);
  scan(req.params, 'params', findings, 0);
  if (!findings.length) return next();

  const alert = {
    type: 'SECURITY ALERT',
    rule: findings[0].rule,
    field: findings[0].field,
    sample: findings[0].sample,
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
    ua: String(req.headers['user-agent'] || '').slice(0, 160),
    at: new Date().toISOString(),
  };

  // A verified admin may legitimately store security write-ups (PoCs etc.):
  // log the alert but allow. Everyone else is refused outright with a taunt.
  if (isVerifiedAdmin(req)) {
    console.warn('[SECURITY ALERT — allowed for verified admin]', JSON.stringify(alert));
    return next();
  }
  console.error('[SECURITY ALERT — request blocked]', JSON.stringify(alert));
  edr.logEvent({
    ip: req.ip, rule: findings[0].rule, field: findings[0].field, sample: findings[0].sample,
    method: req.method, path: req.originalUrl, userAgent: req.headers['user-agent'],
  });
  return res.status(400).json({ error: buildTaunt(req.ip) });
};
