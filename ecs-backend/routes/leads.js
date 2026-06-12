const express = require('express');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/leads — admin only
router.get('/', requireAdmin, async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.json(data);
});

// PATCH /api/leads/:id — update status (admin only)
router.patch('/:id', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const allowed = ['new', 'contacted', 'qualified', 'closed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const { data, error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.json(data);
});

// DELETE /api/leads/:id — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { error } = await supabase.from('leads').delete().eq('id', req.params.id);
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.status(204).send();
});

module.exports = router;
