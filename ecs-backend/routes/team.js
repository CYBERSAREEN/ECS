const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const validateMember = [
  body('name').trim().notEmpty().isLength({ max: 120 }).escape(),
  body('role').trim().notEmpty().isLength({ max: 120 }).escape(),
  body('bio').trim().isLength({ max: 1000 }).escape(),
  body('photo_url').trim().custom(v => /^\/[\w\-./]+$/.test(v) || /^https:\/\/[^\s]+$/.test(v)).withMessage('Use a site path (/img/team/x.jpeg) or https URL').optional({ nullable: true, checkFalsy: true }),
  body('initials').trim().isLength({ max: 4 }).escape().optional({ nullable: true, checkFalsy: true }),
];

// Multer: disk storage for team photos in public/img/team/
const teamPhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/img/team'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safe = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    cb(null, `upload-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${safe}`);
  }
});
const teamPhotoUpload = multer({
  storage: teamPhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Images only: JPEG, PNG, WebP, GIF'), { code: 'NOT_IMAGE' }));
  }
});

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

// POST /api/team/upload-photo — admin: drag-and-drop image upload
router.post('/upload-photo', requireAdmin, (req, res, next) => {
  teamPhotoUpload.single('photo')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'NOT_IMAGE' ? 'Images only: JPEG, PNG, WebP'
        : err.code === 'LIMIT_FILE_SIZE' ? 'Image too large (max 5 MB)'
        : 'Upload error';
      return res.status(400).json({ error: msg });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  return res.json({ url: '/img/team/' + req.file.filename });
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
