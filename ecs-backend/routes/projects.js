const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const IMAGE_BUCKET = 'project-images';

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

// GET /api/projects?type=web_dev|security — public (includes images, sorted)
router.get('/', async (req, res) => {
  if (!supabase) return res.json([]);
  const typeFilter = req.query.type && ['web_dev', 'security'].includes(req.query.type) ? req.query.type : null;

  let query = supabase
    .from('projects')
    .select('*, project_images(id, image_url, sort_order)')
    .order('created_at', { ascending: false });
  if (typeFilter) query = query.eq('type', typeFilter);
  const { data, error } = await query;

  if (!error) {
    const out = (data || []).map(p => ({
      ...p,
      project_images: (p.project_images || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(img => ({ ...img, public_url: supabase.storage.from(IMAGE_BUCKET).getPublicUrl(img.image_url).data.publicUrl })),
    }));
    return res.json(out);
  }

  // project_images table may not exist yet (migration not applied) — degrade
  // gracefully so project text content still works, just without images.
  console.error('DB error (with images):', error.message, '— falling back to projects without images');
  let plainQuery = supabase.from('projects').select('*').order('created_at', { ascending: false });
  if (typeFilter) plainQuery = plainQuery.eq('type', typeFilter);
  const { data: plain, error: plainErr } = await plainQuery;
  if (plainErr) { console.error('DB error:', plainErr.message); return res.status(500).json({ error: 'Database error' }); }
  return res.json((plain || []).map(p => ({ ...p, project_images: [] })));
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

// DELETE /api/projects/:id — admin (storage objects cascade-cleaned below, DB rows cascade via FK)
router.delete('/:id', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const { data: imgs } = await supabase.from('project_images').select('image_url').eq('project_id', req.params.id);
  if (imgs && imgs.length) {
    await supabase.storage.from(IMAGE_BUCKET).remove(imgs.map(i => i.image_url)).catch(() => {});
  }
  const { error } = await supabase.from('projects').delete().eq('id', req.params.id);
  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.status(204).send();
});

// ── Project images: add / update / delete / reorder (admin) ──────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
    cb(Object.assign(new Error('Images only: JPEG, PNG, WebP, GIF'), { code: 'NOT_IMAGE' }));
  },
});

// Defense in depth: verify real file signature, not just client-supplied MIME/extension
// (a renamed/relabeled malicious file would pass the multer fileFilter above otherwise).
function sniffImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

function uploadMiddleware(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const msg = err.code === 'NOT_IMAGE' ? 'Images only: JPEG, PNG, WebP, GIF'
        : err.code === 'LIMIT_FILE_SIZE' ? 'Image too large (max 5 MB)'
        : 'Invalid file upload';
      return res.status(400).json({ error: msg });
    }
    next();
  });
}

async function assertProjectExists(projectId) {
  const { data } = await supabase.from('projects').select('id').eq('id', projectId).single();
  return !!data;
}

// POST /api/projects/:id/images — admin: add a new image to a project
router.post('/:id/images', requireAdmin, uploadMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!(await assertProjectExists(req.params.id))) return res.status(404).json({ error: 'Project not found' });

  const sniffed = sniffImageType(req.file.buffer);
  if (!sniffed) return res.status(400).json({ error: 'File content does not match a supported image format' });

  const ext = sniffed.split('/')[1].replace('jpeg', 'jpg');
  const objectName = `${req.params.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(objectName, req.file.buffer, { contentType: sniffed, upsert: false });
  if (upErr) { console.error('Storage error:', upErr.message); return res.status(500).json({ error: 'File storage error' }); }

  const { data: maxRow } = await supabase
    .from('project_images').select('sort_order').eq('project_id', req.params.id)
    .order('sort_order', { ascending: false }).limit(1).single();
  const nextSort = maxRow ? maxRow.sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('project_images')
    .insert([{ project_id: req.params.id, image_url: objectName, sort_order: nextSort }])
    .select()
    .single();
  if (error) { console.error('DB error:', error.message); return res.status(500).json({ error: 'Database error' }); }

  const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(objectName);
  return res.status(201).json({ ...data, public_url: pub.publicUrl });
});

// PUT /api/projects/:id/images/:imageId — admin: replace an existing image's file
router.put('/:id/images/:imageId', requireAdmin, uploadMiddleware, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  // Ownership check — the image must belong to the project in the URL (IDOR guard).
  const { data: row, error: findErr } = await supabase
    .from('project_images').select('id, image_url, project_id')
    .eq('id', req.params.imageId).eq('project_id', req.params.id).single();
  if (findErr || !row) return res.status(404).json({ error: 'Image not found for this project' });

  const sniffed = sniffImageType(req.file.buffer);
  if (!sniffed) return res.status(400).json({ error: 'File content does not match a supported image format' });

  const ext = sniffed.split('/')[1].replace('jpeg', 'jpg');
  const objectName = `${req.params.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(objectName, req.file.buffer, { contentType: sniffed, upsert: false });
  if (upErr) { console.error('Storage error:', upErr.message); return res.status(500).json({ error: 'File storage error' }); }

  const { data, error } = await supabase
    .from('project_images')
    .update({ image_url: objectName })
    .eq('id', req.params.imageId)
    .select()
    .single();
  if (error) { console.error('DB error:', error.message); return res.status(500).json({ error: 'Database error' }); }

  await supabase.storage.from(IMAGE_BUCKET).remove([row.image_url]).catch(() => {});

  const { data: pub } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(objectName);
  return res.json({ ...data, public_url: pub.publicUrl });
});

// PATCH /api/projects/:id/images/:imageId — admin: reorder
router.patch('/:id/images/:imageId', requireAdmin, [body('sort_order').isInt({ min: 0, max: 9999 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  const { data, error } = await supabase
    .from('project_images')
    .update({ sort_order: req.body.sort_order })
    .eq('id', req.params.imageId).eq('project_id', req.params.id)
    .select()
    .single();
  if (error) { console.error('DB error:', error.message); return res.status(500).json({ error: 'Database error' }); }
  if (!data) return res.status(404).json({ error: 'Image not found for this project' });
  return res.json(data);
});

// DELETE /api/projects/:id/images/:imageId — admin
router.delete('/:id/images/:imageId', requireAdmin, async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });

  // Ownership check (IDOR guard) before touching storage.
  const { data: row, error: findErr } = await supabase
    .from('project_images').select('id, image_url')
    .eq('id', req.params.imageId).eq('project_id', req.params.id).single();
  if (findErr || !row) return res.status(404).json({ error: 'Image not found for this project' });

  await supabase.storage.from(IMAGE_BUCKET).remove([row.image_url]).catch(() => {});
  const { error } = await supabase.from('project_images').delete().eq('id', req.params.imageId);
  if (error) { console.error('DB error:', error.message); return res.status(500).json({ error: 'Database error' }); }
  return res.status(204).send();
});

module.exports = router;
