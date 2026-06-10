const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const supabase = require('../config/supabase');
const { runScan } = require('../services/scanner');

const router = express.Router();

// Tight limit — scanning is resource- and network-intensive.
const scanLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Scan limit reached. Each client can request 5 scans per hour.' },
});

/**
 * POST /api/scan/request
 * Records a scan request (domain-ownership verification happens out of band,
 * per scope). Stores the lead if a DB is configured.
 */
router.post(
  '/request',
  scanLimiter,
  [
    body('email').trim().isEmail().normalizeEmail().isLength({ max: 254 }),
    body('website_url').trim().isURL({ require_protocol: true }).isLength({ max: 500 }),
    body('verification_method').isIn(['dns', 'meta', 'file']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, website_url, verification_method } = req.body;

    if (!supabase) return res.status(202).json({ ok: true, note: 'received (DB pending)' });

    const { error } = await supabase
      .from('scan_requests')
      .insert([{ email, website_url, verification_method, status: 'pending' }]);

    if (error) { console.error("DB error:", error.message); return res.status(500).json({ error: "Database error" }); }
    return res.status(201).json({ ok: true, message: 'Scan request received. Check your email for verification instructions.' });
  }
);

/**
 * POST /api/scan/run
 * Runs the live non-intrusive QuickScan and returns the report synchronously.
 * SSRF-guarded inside the scanner service. Heavily rate-limited.
 */
router.post(
  '/run',
  scanLimiter,
  [body('website_url').trim().isURL({ require_protocol: true }).isLength({ max: 500 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const report = await runScan(req.body.website_url);
      if (!report.ok) return res.status(422).json(report);

      // Best-effort persistence; never block the response on it.
      if (supabase) {
        supabase.from('scan_reports').insert([{
          target: report.target.hostname,
          grade: report.summary.grade,
          score: report.summary.score,
          findings_count: report.summary.total_findings,
        }]).then(() => {}, () => {});
      }
      return res.status(200).json(report);
    } catch (e) {
      console.error('Scan error:', e.message);
      return res.status(500).json({ ok: false, error: 'Scan failed. Please try again later.' });
    }
  }
);

module.exports = router;
