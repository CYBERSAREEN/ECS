const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const validateService = [
  body('title').trim().notEmpty().isLength({ max: 200 }).escape(),
  body('category').trim().isIn(['web_dev', 'security', 'consultancy', 'ai']),
  body('description').trim().isLength({ max: 2000 }).escape(),
  body('badge').trim().isLength({ max: 50 }).escape().optional({ nullable: true, checkFalsy: true }),
];

// GET /api/services — public
router.get('/', async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.json(data);
});

// POST /api/services — admin
router.post('/', requireAdmin, validateService, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, category, description, badge } = req.body;
  const { data, error } = await supabase
    .from('services')
    .insert([{ title, category, description, badge }])
    .select()
    .single();

  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.status(201).json(data);
});

// PUT /api/services/:id — admin
router.put('/:id', requireAdmin, validateService, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, category, description, badge } = req.body;
  const { data, error } = await supabase
    .from('services')
    .update({ title, category, description, badge, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  if (!data) return res.status(404).json({ error: 'Not found' });
  return res.json(data);
});

// DELETE /api/services/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('services').delete().eq('id', req.params.id);
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.status(204).send();
});

module.exports = router;
