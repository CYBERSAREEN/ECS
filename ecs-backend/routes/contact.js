const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const supabase = require('../config/supabase');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many submissions. Please try again later.' },
});

// POST /api/contact
router.post(
  '/',
  contactLimiter,
  [
    body('name').trim().notEmpty().isLength({ max: 120 }).escape(),
    body('email').trim().isEmail().normalizeEmail(),
    // Client's WhatsApp number — digits with country code (e.g. 917087603933)
    body('phone').trim().customSanitizer(v => String(v || '').replace(/[^\d]/g, '')).isLength({ min: 8, max: 15 }).isNumeric(),
    body('organization').trim().isLength({ max: 200 }).escape().optional({ nullable: true, checkFalsy: true }),
    body('service_required').trim().isLength({ max: 200 }).escape().optional({ nullable: true, checkFalsy: true }),
    body('message').trim().isLength({ max: 2000 }).escape().optional({ nullable: true, checkFalsy: true }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, phone, organization, service_required, message } = req.body;

    // DB not configured yet — accept gracefully (frontend opens WhatsApp regardless)
    if (!supabase) return res.status(202).json({ ok: true, note: 'received (DB pending)' });

    const { error } = await supabase.from('leads').insert([
      { name, email, phone, organization, service_required, message, status: 'new' },
    ]);

    if (error) {
      console.error('Supabase insert error:', error.message);
      return res.status(500).json({ error: 'Failed to store enquiry.' });
    }

    // Send email notification via Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM || 'ECS <noreply@excelong.in>',
          to: process.env.ADMIN_EMAIL,
          subject: `New Enquiry: ${service_required || 'General'} from ${name}`,
          html: `<p><b>Name:</b> ${name}<br><b>Email:</b> ${email}<br><b>Org:</b> ${organization || '-'}<br><b>Service:</b> ${service_required || '-'}<br><b>Message:</b><br>${message || '-'}</p>`,
        });
      } catch (emailErr) {
        console.error('Email send error:', emailErr.message);
      }
    }

    return res.status(201).json({ ok: true });
  }
);

// GET /api/contact/leads — admin only
router.get('/leads', requireAdmin, async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
  return res.json(data);
});

module.exports = router;
