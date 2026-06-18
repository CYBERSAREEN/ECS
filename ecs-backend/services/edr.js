const supabase = require('../config/supabase');
const { fakeMac } = require('../middleware/taunts');

// In-memory cache of blocked IPs, refreshed from DB on boot and on every
// admin block/unblock action — avoids a DB round-trip on every request.
const blockedIPs = new Set();

async function loadBlockedIPs() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from('blocked_ips').select('ip');
    if (error) { console.error('[edr] load blocked IPs failed:', error.message); return; }
    blockedIPs.clear();
    (data || []).forEach(r => blockedIPs.add(r.ip));
    console.log(`[edr] loaded ${blockedIPs.size} blocked IP(s)`);
  } catch (e) { console.error('[edr] load blocked IPs failed:', e.message); }
}

function isBlocked(ip) {
  return blockedIPs.has(ip);
}

// Must be awaited by callers, not fire-and-forget: on Vercel (and most
// serverless runtimes) the function instance can be frozen the instant the
// HTTP response is flushed, killing any unresolved background promise
// before it reaches the network. Awaiting adds a few ms of latency to the
// response but guarantees the event actually lands.
async function logEvent({ ip, rule, field, sample, method, path, userAgent }) {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('security_events').insert([{
      ip, fake_mac: fakeMac(ip), rule, field,
      sample: String(sample || '').slice(0, 300),
      method, path: String(path || '').slice(0, 300),
      user_agent: String(userAgent || '').slice(0, 300),
    }]);
    if (error) console.error('[edr] log event failed:', error.message);
  } catch (e) { console.error('[edr] log event failed:', e.message); }
}

async function blockIP(ip, reason) {
  if (!supabase) return { ok: false, error: 'Database not configured' };
  const { error } = await supabase.from('blocked_ips').upsert([{ ip, reason }]);
  if (error) return { ok: false, error: error.message };
  blockedIPs.add(ip);
  return { ok: true };
}

async function unblockIP(ip) {
  if (!supabase) return { ok: false, error: 'Database not configured' };
  const { error } = await supabase.from('blocked_ips').delete().eq('ip', ip);
  if (error) return { ok: false, error: error.message };
  blockedIPs.delete(ip);
  return { ok: true };
}

module.exports = { loadBlockedIPs, isBlocked, logEvent, blockIP, unblockIP };
