const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');
const { nameField } = require('../middleware/validators');

const router = express.Router();

const PHOTO_BUCKET = 'team-photos';

const validateMember = [
  nameField('name'),
  body('role').trim().notEmpty().isLength({ max: 120 }).escape(),
  body('bio').trim().isLength({ max: 1000 }).escape(),
  body('photo_url').trim().custom(v => /^\/[\w\-./]+$/.test(v) || /^https:\/\/[^\s]+$/.test(v)).withMessage('Use a site path (/img/team/x.jpeg) or https URL').optional({ nullable: true, checkFalsy: true }),
  body('initials').trim().isLength({ max: 4 }).escape().optional({ nullable: true, checkFalsy: true }),
];

// Memory storage + Supabase Storage upload — NOT disk storage. Vercel's
// filesystem is ephemeral/read-only outside /tmp, so writing into public/
// at request time silently fails to persist between invocations.
const teamPhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Images only: JPEG, PNG, WebP, GIF'), { code: 'NOT_IMAGE' }));
  }
});

// Defense in depth: verify real file signature, not just client-supplied MIME.
function sniffImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

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
}, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const sniffed = sniffImageType(req.file.buffer);
  if (!sniffed) return res.status(400).json({ error: 'File content does not match a supported image format' });

  const ext = sniffed.split('/')[1].replace('jpeg', 'jpg');
  const objectName = `upload-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(objectName, req.file.buffer, { contentType: sniffed, upsert: false });
  if (upErr) { console.error('Storage error:', upErr.message); return res.status(500).json({ error: 'File storage error' }); }

  const { data: pub } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(objectName);
  return res.json({ url: pub.publicUrl });
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
