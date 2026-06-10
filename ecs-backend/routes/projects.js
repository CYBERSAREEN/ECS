const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const validateProject = [
  body('type').isIn(['web_dev', 'security']),
  body('title').trim().notEmpty().isLength({ max: 200 }).escape(),
  body('link').trim().isURL().optional({ nullable: true, checkFalsy: true }),
  body('description').trim().isLength({ max: 3000 }).escape(),
  body('functionalities').trim().isLength({ max: 3000 }).escape().optional({ nullable: true, checkFalsy: true }),
  body('delivery_time').trim().isLength({ max: 100 }).escape().optional({ nullable: true, checkFalsy: true }),
  // Security-specific
  body('vulnerability_title').trim().isLength({ max: 300 }).escape().optional({ nullable: true, checkFalsy: true }),
  body('bounty_earned').trim().isLength({ max: 100 }).escape().optional({ nullable: true, checkFalsy: true }),
  body('bounty_description').trim().isLength({ max: 3000 }).escape().optional({ nullable: true, checkFalsy: true }),
  body('portswigger_links').trim().isLength({ max: 500 }).escape().optional({ nullable: true, checkFalsy: true }),
  body('poc').trim().isLength({ max: 5000 }).escape().optional({ nullable: true, checkFalsy: true }),
];

// GET /api/projects?type=web_dev|security — public
router.get('/', async (req, res) => {
  if (!supabase) return res.json([]);
  let query = supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (req.query.type && ['web_dev', 'security'].includes(req.query.type)) {
    query = query.eq('type', req.query.type);
  }
  const { data, error } = await query;
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.json(data);
});

// POST /api/projects — admin
// Whitelist of writable columns — never insert/update raw req.body (mass assignment).
const PROJECT_FIELDS = ['type', 'title', 'link', 'description', 'functionalities', 'delivery_time',
  'vulnerability_title', 'bounty_earned', 'bounty_description', 'portswigger_links', 'poc'];
function pickProjectFields(body) {
  const out = {};
  for (const k of PROJECT_FIELDS) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

router.post('/', requireAdmin, validateProject, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { data, error } = await supabase
    .from('projects')
    .insert([pickProjectFields(req.body)])
    .select()
    .single();

  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.status(201).json(data);
});

// PUT /api/projects/:id — admin
router.put('/:id', requireAdmin, validateProject, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { data, error } = await supabase
    .from('projects')
    .update({ ...pickProjectFields(req.body), updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  if (!data) return res.status(404).json({ error: 'Not found' });
  return res.json(data);
});

// DELETE /api/projects/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('projects').delete().eq('id', req.params.id);
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.status(204).send();
});

module.exports = router;
