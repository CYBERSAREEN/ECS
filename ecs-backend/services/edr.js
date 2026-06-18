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

// Fire-and-forget — never let logging slow down or fail the response to the
// (possibly hostile) caller.
function logEvent({ ip, rule, field, sample, method, path, userAgent }) {
  if (!supabase) return;
  supabase.from('security_events').insert([{
    ip, fake_mac: fakeMac(ip), rule, field,
    sample: String(sample || '').slice(0, 300),
    method, path: String(path || '').slice(0, 300),
    user_agent: String(userAgent || '').slice(0, 300),
  }]).then(() => {}, (e) => console.error('[edr] log event failed:', e.message));
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
