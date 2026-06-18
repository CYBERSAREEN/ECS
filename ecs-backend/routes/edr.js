const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');
const edr = require('../services/edr');

const router = express.Router();

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

// PATCH /api/edr/events/:id — admin: dismiss/ignore an event without blocking
router.patch('/events/:id', requireAdmin, [body('status').isIn(['ignored'])], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { data, error } = await supabase
    .from('security_events').update({ status: req.body.status }).eq('id', req.params.id).select().single();
  if (error) { console.error('DB error:', error.message); return res.status(500).json({ error: 'Database error' }); }
  if (!data) return res.status(404).json({ error: 'Not found' });
  return res.json(data);
});

module.exports = router;
