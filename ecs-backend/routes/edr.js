const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');
const { buildPublicQuote } = require('../middleware/taunts');
const edr = require('../services/edr');

const router = express.Router();

// GET /api/edr/recent-public — public: "live attack" banner feed.
// Deliberately exposes nothing about the actual payload or which rule
// caught it — just that *something* happened, plus the (fake) IP/MAC, so
// other visitors see security working without learning what's filtered.
const PUBLIC_WINDOW_MS = 5 * 60 * 1000;
router.get('/recent-public', async (req, res) => {
  if (!supabase) return res.json({ active: false });
  const since = new Date(Date.now() - PUBLIC_WINDOW_MS).toISOString();
  const { data, error } = await supabase
    .from('security_events')
    .select('ip, fake_mac, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data || !data.length) return res.json({ active: false });
  const evt = data[0];
  return res.json({ active: true, message: buildPublicQuote(evt.ip), at: evt.created_at });
});

// GET /api/edr/events — admin: recent detected attack events
router.get('/events', requireAdmin, async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from('security_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) { console.error('DB error:', error.message); return res.status(500).json({ error: 'Database error' }); }
  return res.json(data);
});

// GET /api/edr/blocked — admin: currently blocked IPs
router.get('/blocked', requireAdmin, async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase.from('blocked_ips').select('*').order('blocked_at', { ascending: false });
  if (error) { console.error('DB error:', error.message); return res.status(500).json({ error: 'Database error' }); }
  return res.json(data);
});

// POST /api/edr/block — admin: block an IP (quarantine future requests)
router.post('/block', requireAdmin, [body('ip').trim().notEmpty().isLength({ max: 64 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const result = await edr.blockIP(req.body.ip, (req.body.reason || '').slice(0, 200));
  if (!result.ok) return res.status(500).json({ error: result.error });
  await supabase.from('security_events').update({ status: 'blocked' }).eq('ip', req.body.ip).eq('status', 'new');
  return res.json({ ok: true });
});

// POST /api/edr/unblock — admin
router.post('/unblock', requireAdmin, [body('ip').trim().notEmpty().isLength({ max: 64 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const result = await edr.unblockIP(req.body.ip);
  if (!result.ok) return res.status(500).json({ error: result.error });
  return res.json({ ok: true });
});

// DELETE /api/edr/events/:id — admin: dismiss/ignore an event — actually
// removed, not just status-flagged, since "ignored" means "this wasn't
// worth keeping," not "keep it around in a different state."
router.delete('/events/:id', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { error } = await supabase.from('security_events').delete().eq('id', req.params.id);
  if (error) { console.error('DB error:', error.message); return res.status(500).json({ error: 'Database error' }); }
  return res.status(204).send();
});

module.exports = router;
