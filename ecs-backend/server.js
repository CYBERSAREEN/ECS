require('dotenv').config();

const path = require('path');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const edr = require('./services/edr');
const { buildTaunt } = require('./middleware/taunts');

const app = express();
const PORT = process.env.PORT || 3000;

// Behind Render/Vercel proxy: required so req.ip (and rate limiting) sees the
// real client IP instead of the proxy's. express-rate-limit v7 errors without it.
app.set('trust proxy', 1);

// ── Quarantine: admin-blocked IPs are refused before any other work ──
edr.loadBlockedIPs();
app.use((req, res, next) => {
  if (edr.isBlocked(req.ip)) {
    return res.status(403).json({ error: buildTaunt(req.ip), quarantined: true });
  }
  next();
});

// ── Basic admission control ("manual load balancer" base layer) ──────
// Single-process concurrency capping: sheds load gracefully under a burst
// instead of letting unbounded concurrent work degrade the whole process.
// This is NOT a distributed load balancer (that needs multiple backend
// instances behind a reverse proxy) — it's the in-process equivalent: a
// circuit breaker that says "no" once too much is happening at once.
const GLOBAL_CONCURRENCY_LIMIT = 80;
const PER_IP_CONCURRENCY_LIMIT = 10;
let globalInFlight = 0;
const perIpInFlight = new Map();

app.use(async (req, res, next) => {
  const ip = req.ip;
  const ipCount = perIpInFlight.get(ip) || 0;

  // A single IP holding 10+ concurrent connections is a flood/DDoS-tool
  // signature, not normal browser behaviour — that gets the taunt treatment.
  // Whole-process overload could just be genuine traffic, so that one stays
  // a plain "try again" rather than accusing an innocent visitor.
  if (ipCount >= PER_IP_CONCURRENCY_LIMIT) {
    // Awaited (not fire-and-forget) — see services/edr.js for why.
    await edr.logEvent({ ip, rule: 'ddos-flood-per-ip', method: req.method, path: req.originalUrl, userAgent: req.headers['user-agent'] });
    res.set('Retry-After', '2');
    return res.status(429).json({ error: buildTaunt(ip) });
  }
  if (globalInFlight >= GLOBAL_CONCURRENCY_LIMIT) {
    res.set('Retry-After', '2');
    return res.status(503).json({ error: 'Server is under heavy load — please retry shortly.' });
  }

  globalInFlight++;
  perIpInFlight.set(ip, ipCount + 1);
  const release = () => {
    globalInFlight = Math.max(0, globalInFlight - 1);
    const c = (perIpInFlight.get(ip) || 1) - 1;
    if (c <= 0) perIpInFlight.delete(ip); else perIpInFlight.set(ip, c);
  };
  res.on('finish', release);
  res.on('close', release);
  next();
});

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
  res.locals.hideLoader = req.query.__ss === '1';
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
app.use('/api', require('./middleware/securityGuard'));
app.use('/api/admin',    require('./routes/admin'));
app.use('/api/contact',  require('./routes/contact'));
app.use('/api/leads',    require('./routes/leads'));
app.use('/api/services', require('./routes/services'));
app.use('/api/team',     require('./routes/team'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/patents',  require('./routes/patents'));
app.use('/api/scan',     require('./routes/scan'));
app.use('/api/edr',      require('./routes/edr'));

// ── Health check ──────────────────────────────────────────────
app.get('/healthz', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── Content version ──────────────────────────────────────────
// Cheap signal pages poll to know "did admin-managed content change since
// I loaded?" without re-fetching/re-rendering everything client-side.
// Combines row counts + latest updated_at across admin-editable tables.
app.get('/api/content-version', async (req, res) => {
  if (!dbClient) return res.json({ version: 'no-db' });
  try {
    const tables = ['services', 'team_members', 'projects', 'patents'];
    const results = await Promise.all(tables.map(t =>
      dbClient.from(t).select('updated_at', { count: 'exact', head: false }).order('updated_at', { ascending: false }).limit(1)
    ));
    const parts = results.map((r, i) => `${tables[i]}:${r.count || 0}:${(r.data && r.data[0] && r.data[0].updated_at) || ''}`);
    return res.json({ version: parts.join('|') });
  } catch (e) {
    console.error('content-version error:', e.message);
    return res.json({ version: 'error' });
  }
});

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
// Pages render dashboard-managed content from Supabase; views fall back
// to static content when the DB is unreachable or a table is empty.
const dbClient = require('./config/supabase');
async function dbRows(table, orderCol = 'sort_order', ascending = true) {
  if (!dbClient) return [];
  try {
    const { data, error } = await dbClient.from(table).select('*').order(orderCol, { ascending });
    if (error) { console.error(`DB read ${table}:`, error.message); return []; }
    return data || [];
  } catch (e) { console.error(`DB read ${table}:`, e.message); return []; }
}

app.get('/', async (req, res) => {
  const [dbServices, dbTeam] = await Promise.all([dbRows('services'), dbRows('team_members')]);
  res.render('index', { dbServices, dbTeam });
});
app.get('/services', async (req, res) => res.render('services', { dbServices: await dbRows('services') }));
async function dbProjectsWithImages() {
  if (!dbClient) return [];
  try {
    const { data, error } = await dbClient
      .from('projects')
      .select('*, project_images(id, image_url, sort_order)')
      .order('created_at', { ascending: false });
    if (!error) {
      return (data || []).map(p => ({
        ...p,
        project_images: (p.project_images || [])
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(img => ({ ...img, public_url: dbClient.storage.from('project-images').getPublicUrl(img.image_url).data.publicUrl })),
      }));
    }
    // project_images table may not exist yet (migration not applied) — degrade
    // gracefully so project text content still renders, just without images.
    console.error('DB read projects (with images):', error.message, '— falling back to projects without images');
    const { data: plain, error: plainErr } = await dbClient.from('projects').select('*').order('created_at', { ascending: false });
    if (plainErr) { console.error('DB read projects:', plainErr.message); return []; }
    return (plain || []).map(p => ({ ...p, project_images: [] }));
  } catch (e) { console.error('DB read projects:', e.message); return []; }
}

app.get('/projects', async (req, res) => {
  const rows = await dbProjectsWithImages();
  const webProjects = rows.filter(p => p.type === 'web_dev');
  const securityProjects = rows.filter(p => p.type === 'security');
  res.render('projects', { webProjects, securityProjects });
});
app.get('/about',    async (req, res) => res.render('about', { dbTeam: await dbRows('team_members') }));
app.get('/ideas',    async (req, res) => {
  const dbPatents = (await dbRows('patents', 'date', false)).filter(p => p.status !== 'Rejected');
  res.render('ideas', { dbPatents });
});
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
