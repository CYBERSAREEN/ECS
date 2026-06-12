<div align="center">

# Excelon Cyber Solutions

**Full-Stack Cybersecurity Company Website · Node.js + Express + EJS + Supabase**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

*The official web platform for Excelon Cyber Solutions — a cybersecurity firm offering VAPT, security audits, and consulting services.*

</div>

---

## What Is This?

**Excelon Cyber Solutions (ECS)** is a production-grade, full-stack website for a cybersecurity services company. Built with a security-first architecture — JWT authentication, Helmet.js headers, rate limiting, input validation, and a Supabase-backed PostgreSQL database — deployed serverlessly on Vercel.

The platform serves as both a public-facing corporate site and a private admin console for managing leads, clients, projects, patents, and team data from a single dashboard.

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero, services overview, call-to-action |
| `/about` | About | Company story, mission, and values |
| `/services` | Services | VAPT, security audits, consulting offerings |
| `/projects` | Projects | Portfolio of completed security engagements |
| `/scan` | Scan | Self-service security scan request form |
| `/contact` | Contact | Lead capture form stored in Supabase |
| `/ideas` | Ideas | Internal innovation board |
| `/admin/login` | Admin Login | JWT-protected entry point |
| `/admin/dashboard` | Admin Dashboard | Full CRUD for leads, projects, patents, team |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Templating | EJS |
| Database | Supabase (PostgreSQL) |
| Auth | JWT + bcryptjs |
| Email | Resend API |
| Security | Helmet, express-rate-limit, express-validator, CORS |
| File Uploads | Multer |
| Deployment | Vercel (Serverless) |

---

## Security Architecture

This project follows OWASP best practices throughout:

- **Authentication** — JWT tokens with `httpOnly` cookies; passwords hashed with bcrypt
- **Rate Limiting** — `express-rate-limit` on all API routes to block brute force
- **Security Headers** — Helmet.js enforces CSP, HSTS, X-Frame-Options, and more
- **Input Validation** — `express-validator` sanitizes every form field server-side
- **CORS** — Strict origin allowlist for API access
- **Environment Isolation** — All secrets in `.env`, never committed to git

---

## Project Structure

```
ECS/
└── ecs-backend/
    ├── server.js               # Express entry point
    ├── vercel.json             # Vercel serverless config
    ├── package.json
    ├── .env.example            # Required environment variables
    ├── config/                 # Supabase client, JWT helpers
    ├── middleware/             # Auth guard, error handler
    ├── routes/
    │   ├── admin.js            # Admin CRUD endpoints
    │   ├── contact.js          # Lead capture
    │   ├── leads.js            # Lead management
    │   ├── patents.js          # Patent tracking
    │   ├── projects.js         # Project portfolio
    │   ├── scan.js             # Scan request handler
    │   ├── services.js         # Services pages
    │   └── team.js             # Team management
    ├── supabase/               # DB schema + migrations
    ├── views/                  # EJS templates
    │   ├── index.ejs
    │   ├── about.ejs
    │   ├── services.ejs
    │   ├── projects.ejs
    │   ├── scan.ejs
    │   ├── contact.ejs
    │   ├── ideas.ejs
    │   ├── admin-login.ejs
    │   ├── admin-dashboard.ejs
    │   └── partials/
    └── public/                 # Static assets (CSS, JS, images)
```

---

## Local Development

**Prerequisites:** Node.js 18+, a Supabase project

```bash
git clone https://github.com/CYBERSAREEN/ECS.git
cd ECS/ecs-backend
npm install
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_KEY, JWT_SECRET, RESEND_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel          # preview
vercel --prod   # production
```

Set all `.env` variables as Vercel Environment Variables before deploying.

---

## Admin Access

Navigate to `/admin/login`. Credentials are stored in Supabase — no hardcoded credentials exist in the codebase.

---

## Author

**Vedant Sareen — CYBERSAREEN**
📧 securecybernetics@gmail.com · [GitHub](https://github.com/CYBERSAREEN)

---

<div align="center">

*Built with security-first engineering for the cybersecurity industry.*

</div>
