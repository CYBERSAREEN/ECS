const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const validateMember = [
  body('name').trim().notEmpty().isLength({ max: 120 }).escape(),
  body('role').trim().notEmpty().isLength({ max: 120 }).escape(),
  body('bio').trim().isLength({ max: 1000 }).escape(),
  body('photo_url').trim().isURL().optional({ nullable: true, checkFalsy: true }),
  body('initials').trim().isLength({ max: 4 }).escape().optional({ nullable: true, checkFalsy: true }),
];

// GET /api/team — public
router.get('/', async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.json(data);
});

// POST /api/team — admin
router.post('/', requireAdmin, validateMember, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, role, bio, photo_url, initials } = req.body;
  const { data, error } = await supabase
    .from('team_members')
    .insert([{ name, role, bio, photo_url, initials }])
    .select()
    .single();

  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.status(201).json(data);
});

// PUT /api/team/:id — admin
router.put('/:id', requireAdmin, validateMember, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, role, bio, photo_url, initials } = req.body;
  const { data, error } = await supabase
    .from('team_members')
    .update({ name, role, bio, photo_url, initials, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  if (!data) return res.status(404).json({ error: 'Not found' });
  return res.json(data);
});

// DELETE /api/team/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('team_members').delete().eq('id', req.params.id);
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.status(204).send();
});

module.exports = router;
