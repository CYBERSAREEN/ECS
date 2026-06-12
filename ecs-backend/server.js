require('dotenv').config();

const path = require('path');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Behind Render/Vercel proxy: required so req.ip (and rate limiting) sees the
// real client IP instead of the proxy's. express-rate-limit v7 errors without it.
app.set('trust proxy', 1);

// ── View engine (EJS) ─────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Security headers ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // EJS pages use a few small inline <script> blocks + Google Fonts + GA4
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS (for API; same-origin pages don't need it) ───────────
const allowedOrigins = [
  ...(process.env.FRONTEND_URL || '').split(',').map(o => o.trim()).filter(Boolean),
  (process.env.SITE_URL || '').replace(/\/$/, ''),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
  `http://localhost:${PORT}`,
].filter(Boolean);

app.use('/api', cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Compression + template locals (SEO/GA) ────────────────────
app.use(compression());
app.use((req, res, next) => {
  const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${PORT}`;
  res.locals.siteUrl = (process.env.SITE_URL || defaultUrl).replace(/\/$/, '');
  res.locals.pagePath = req.path === '/' ? '/' : req.path.replace(/\/$/, '');
  res.locals.gaId = process.env.GA_MEASUREMENT_ID || '';
  res.locals.assetV = require('./package.json').version;
  res.locals.robotsMeta = req.path.startsWith('/vadmin') ? 'noindex, nofollow' : '';
  next();
});

// ── Parsers ───────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());

// ── Static assets ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  // public/projects (asset dir) must not 301-shadow the /projects page route
  redirect: false,
}));

// ── Global rate limit (API only) ──────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.disable('x-powered-by');

// ── API routes ────────────────────────────────────────────────
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/contact',  require('./routes/contact'));
app.use('/api/leads',    require('./routes/leads'));
app.use('/api/services', require('./routes/services'));
app.use('/api/team',     require('./routes/team'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/patents',  require('./routes/patents'));
app.use('/api/scan',     require('./routes/scan'));

// ── Health check ──────────────────────────────────────────────
app.get('/healthz', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── SEO: sitemap.xml + robots.txt ─────────────────────────────
const PUBLIC_PAGES = ['/', '/services', '/projects', '/about', '/ideas', '/contact', '/scan'];

app.get('/sitemap.xml', (req, res) => {
  const base = res.locals.siteUrl;
  const today = new Date().toISOString().slice(0, 10);
  const urls = PUBLIC_PAGES.map(p => `  <url>
    <loc>${base}${p === '/' ? '' : p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`);
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /vadmin-db7180
Disallow: /api/

Sitemap: ${res.locals.siteUrl}/sitemap.xml`);
});

// ── PAGE ROUTES (EJS) ─────────────────────────────────────────
app.get('/',         (req, res) => res.render('index'));
app.get('/services', (req, res) => res.render('services'));
app.get('/projects', (req, res) => res.render('projects'));
app.get('/about',    (req, res) => res.render('about'));
app.get('/ideas',    (req, res) => res.render('ideas'));
app.get('/contact',  (req, res) => res.render('contact'));
app.get('/scan',     (req, res) => res.render('scan'));

// Admin: login page + dashboard (server-side cookie gate)
app.get('/vadmin-db7180', (req, res) => res.render('admin-login'));
app.get('/vadmin-db7180/dashboard', (req, res) => {
  const token = req.cookies?.ecs_admin_token;
  try {
    if (!token) throw new Error('no token');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') throw new Error('bad role');
    return res.render('admin-dashboard');
  } catch {
    return res.redirect('/vadmin-db7180');
  }
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.status(404).send('<div style="font-family:sans-serif;background:#FFF7F7;color:#204969;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;"><h1 style="color:#2E86C1;">404</h1><p>Page not found.</p><a href="/" style="color:#2E86C1;font-weight:600;">← Home</a></div>');
});

// ── Error handler ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(err.message);
  if (req.path.startsWith('/api')) return res.status(500).json({ error: 'Internal server error' });
  res.status(500).send('Internal server error');
});

app.listen(PORT, () => {
  console.log(`ECS site + API listening on http://localhost:${PORT}`);
});

module.exports = app;
