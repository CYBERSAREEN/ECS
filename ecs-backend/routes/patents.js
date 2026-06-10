const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Whitelist of writable columns — never insert/update raw req.body (mass assignment).
const PATENT_FIELDS = ['application_number', 'title', 'status', 'date', 'ref_no', 'patent_code', 'sdg', 'inventors'];
function pickPatentFields(body) {
  const out = {};
  for (const k of PATENT_FIELDS) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many submissions. Try again later.' },
});

// GET /api/patents — public (approved only)
router.get('/', async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from('patents')
    .select('id,application_number,title,status,date,ref_no,patent_code,sdg,inventors')
    .eq('status', 'Approved')
    .order('date', { ascending: false });
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.json(data);
});

// GET /api/patents/all — admin only (all statuses)
router.get('/all', requireAdmin, async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from('patents')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.json(data);
});

// POST /api/patents — admin create
router.post(
  '/',
  requireAdmin,
  [
    body('application_number').trim().notEmpty().isLength({ max: 50 }).escape(),
    body('title').trim().notEmpty().isLength({ max: 500 }).escape(),
    body('status').isIn(['Pending', 'Approved', 'Rejected']),
    body('date').isISO8601().toDate(),
    body('ref_no').trim().isLength({ max: 50 }).escape().optional({ nullable: true, checkFalsy: true }),
    body('patent_code').trim().isLength({ max: 100 }).escape().optional({ nullable: true, checkFalsy: true }),
    body('sdg').trim().isLength({ max: 300 }).escape().optional({ nullable: true, checkFalsy: true }),
    body('inventors').isArray().optional({ nullable: true }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!supabase) return res.status(503).json({ error: 'Database not configured' });
    const { data, error } = await supabase
      .from('patents')
      .insert([pickPatentFields(req.body)])
      .select()
      .single();

    if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
    return res.status(201).json(data);
  }
);

// PUT /api/patents/:id — admin
router.put('/:id', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { data, error } = await supabase
    .from('patents')
    .update({ ...pickPatentFields(req.body), updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  if (!data) return res.status(404).json({ error: 'Not found' });
  return res.json(data);
});

// DELETE /api/patents/:id — admin
router.delete('/:id', requireAdmin, async (req, res) => {
  const { error } = await supabase.from('patents').delete().eq('id', req.params.id);
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.status(204).send();
});

// POST /api/patents/submit — public (idea submission)
router.post(
  '/submit',
  submitLimiter,
  [
    body('submitter_name').trim().notEmpty().isLength({ max: 120 }).escape(),
    body('organization').trim().isLength({ max: 200 }).escape().optional({ nullable: true, checkFalsy: true }),
    body('patent_title').trim().notEmpty().isLength({ max: 500 }).escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { submitter_name, organization, patent_title } = req.body;
    if (!supabase) return res.status(202).json({ ok: true, note: 'received (DB pending)' });
    const { error } = await supabase
      .from('patent_submissions')
      .insert([{ submitter_name, organization, patent_title }]);

    if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
    return res.status(201).json({ ok: true });
  }
);

module.exports = router;
