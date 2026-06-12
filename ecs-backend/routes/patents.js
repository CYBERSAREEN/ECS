const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ── Secure PDF upload for public idea submissions ──────────────
// PDF only: extension + MIME + %PDF magic bytes; 4 MB cap (Vercel body limit);
// stored in the PRIVATE 'patent-uploads' bucket — admin downloads via signed URL.
const SUBMISSION_BUCKET = 'patent-uploads';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const okExt = /\.pdf$/i.test(file.originalname || '');
    const okMime = file.mimetype === 'application/pdf';
    if (okExt && okMime) return cb(null, true);
    cb(Object.assign(new Error('Only PDF files are accepted'), { code: 'ONLY_PDF' }));
  },
});

// Whitelist of writable columns — never insert/update raw req.body (mass assignment).
const PATENT_FIELDS = ['application_number', 'title', 'status', 'date', 'ref_no', 'patent_code', 'sdg', 'inventors', 'pdf_url'];
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
    body('status').isIn(['Pending', 'Filed', 'Approved', 'Rejected']),
    body('date').isISO8601().toDate(),
    body('ref_no').trim().isLength({ max: 50 }).escape().optional({ nullable: true, checkFalsy: true }),
    body('patent_code').trim().isLength({ max: 100 }).escape().optional({ nullable: true, checkFalsy: true }),
    body('sdg').trim().isLength({ max: 300 }).escape().optional({ nullable: true, checkFalsy: true }),
    body('inventors').isArray().optional({ nullable: true }),
    body('pdf_url').trim().isLength({ max: 500 }).optional({ nullable: true, checkFalsy: true }),
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

// POST /api/patents/submit — public (idea submission, optional PDF attachment)
router.post(
  '/submit',
  submitLimiter,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        const msg = err.code === 'LIMIT_FILE_SIZE' ? 'PDF too large (max 4 MB)'
          : err.code === 'ONLY_PDF' ? 'Only PDF files are accepted'
          : 'Invalid file upload';
        return res.status(400).json({ error: msg });
      }
      next();
    });
  },
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

    let file_url = null;
    if (req.file) {
      // Defense in depth: verify PDF magic bytes, not just extension/MIME.
      if (!req.file.buffer || req.file.buffer.subarray(0, 5).toString() !== '%PDF-') {
        return res.status(400).json({ error: 'File is not a valid PDF' });
      }
      const objectName = `${Date.now()}-${crypto.randomUUID()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from(SUBMISSION_BUCKET)
        .upload(objectName, req.file.buffer, { contentType: 'application/pdf', upsert: false });
      if (upErr) { console.error('Storage error:', upErr.message); return res.status(500).json({ error: 'File storage error' }); }
      file_url = objectName;
    }

    const { error } = await supabase
      .from('patent_submissions')
      .insert([{ submitter_name, organization, patent_title, file_url }]);

    if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
    return res.status(201).json({ ok: true });
  }
);

// ── Admin: review public submissions ──────────────────────────
// GET /api/patents/submissions — list all
router.get('/submissions', requireAdmin, async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from('patent_submissions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.json(data);
});

// GET /api/patents/submissions/:id/file — signed download URL (private bucket)
router.get('/submissions/:id/file', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { data: sub, error } = await supabase
    .from('patent_submissions')
    .select('file_url')
    .eq('id', req.params.id)
    .single();
  if (error || !sub || !sub.file_url) return res.status(404).json({ error: 'No file for this submission' });
  const { data: signed, error: sErr } = await supabase.storage
    .from(SUBMISSION_BUCKET)
    .createSignedUrl(sub.file_url, 3600);
  if (sErr || !signed) { console.error('Storage error:', sErr && sErr.message); return res.status(500).json({ error: 'File storage error' }); }
  return res.redirect(signed.signedUrl);
});

// PATCH /api/patents/submissions/:id — update review status
router.patch(
  '/submissions/:id',
  requireAdmin,
  [body('status').isIn(['received', 'reviewing', 'filed', 'rejected'])],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    if (!supabase) return res.status(503).json({ error: 'Database not configured' });
    const { data, error } = await supabase
      .from('patent_submissions')
      .update({ status: req.body.status })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
    if (!data) return res.status(404).json({ error: 'Not found' });
    return res.json(data);
  }
);

// DELETE /api/patents/submissions/:id — remove submission (and stored file)
router.delete('/submissions/:id', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { data: sub } = await supabase
    .from('patent_submissions')
    .select('file_url')
    .eq('id', req.params.id)
    .single();
  if (sub && sub.file_url) {
    await supabase.storage.from(SUBMISSION_BUCKET).remove([sub.file_url]).catch(() => {});
  }
  const { error } = await supabase.from('patent_submissions').delete().eq('id', req.params.id);
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.status(204).send();
});

module.exports = router;
