# ECS Website — Change Log & Task Tracker
> Session: 2026-06-13 | Auto-updated after each completed task

## STATUS OVERVIEW

| # | Task | Status |
|---|------|--------|
| 1 | Dark theme inversion (dark bg / light highlights) + bloom/gradient | ✅ Done |
| 2 | Hero — "Human-Led Testing" → "AI Powered Pentesting" (no hallucinations, no false +/-) | ✅ Done |
| 3 | Hero — visual design improvements (less boring) | ✅ Done |
| 4 | WhatsApp badge — enhanced design + pulsing glow | ✅ Done |
| 5 | Backend connections — audit complete, all routes functional | ✅ Done |
| 6 | Team section — Vandana as Director & CTO; 4-member layout | ✅ Done |
| 7 | About page — Vandana bio, full team, mission/vision updated | ✅ Done |
| 8 | Admin panel — drag-and-drop photo upload (no URL input) | ✅ Done |
| 9 | Admin panel — upload endpoint `/api/team/upload-photo` | ✅ Done |
| 10 | Contact page — mobile responsiveness fix | ✅ Done |
| 11 | Remove free scan feature (index, footer, nav) | ✅ Done |
| 12 | Remove CIN number everywhere | ✅ Done |
| 13 | Email → exceloncybersolutions@gmail.com everywhere | ✅ Done |
| 14 | Patent submission cost → ₹899/- | ✅ Done |
| 15 | Patent page — market rates comparison table | ✅ Done |
| 16 | Patent — 1-year validity + co-authors info | ✅ Done |
| 17 | Brochure update — desktop PDF updated | 🔲 Pending (PDF rebuild required) |
| 18 | Push to GitHub (after user approves localhost review) | 🔲 Awaiting user approval |

---

## DETAILED NOTES

### BACKEND CONNECTION AUDIT
- All API routes (`/api/team`, `/api/services`, `/api/projects`, `/api/patents`, `/api/leads`) connect to Supabase correctly.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env`.
- **Root cause of "badge not removing"**: The hero badge (`SECURE · INNOVATE · PROTECT`) and WhatsApp badge are hardcoded in `views/partials/` — they are NOT database-driven. Admin panel changes only affect DB tables (team_members, services, projects, patents). To remove or change static badges, edit `views/index.ejs` (hero badge) or `views/partials/footer.ejs` (WhatsApp badge) directly.
- EJS views fall back to hardcoded static data when `dbTeam.length === 0` — now that fallback data is updated to include Vandana.

### TEAM CHANGES
- Vandana Kochhar → Founder · Director & CTO (featured first, prominent)
- Vedant Sareen → Senior Security Analyst
- Suneha Passi → Senior Web Developer · Team Lead  
- Hardik Garg → EDR & SOC Specialist · Purple Teamer
- Grid changed from 3-col to 4-col on homepage, with Vandana featured on about page

### COLOUR INVERSION
- Body BG: #1b1f23 (dark charcoal — was cream #f6f7eb)
- Alt sections: #252c33 (slightly lighter dark — was white)
- Cards: #252c33 (with dark inset in alt sections)
- Text headings: #e8ede5 (near-white — was charcoal #242729)
- Text body: #b4b9b2 (warm grey — was #393e41)
- Accent red: #e94f37 (UNCHANGED)
- Footer/page-header: #0f1316 (deepest dark)
- Bloom: radial-gradient(red 5-15% opacity) overlays per section

### FILES CHANGED
- `ecs-backend/public/css/styles.css` — dark theme + bloom
- `ecs-backend/views/index.ejs` — hero, team, scan removal
- `ecs-backend/views/about.ejs` — Vandana featured, full team, bio
- `ecs-backend/views/partials/footer.ejs` — CIN removal, email, scan link
- `ecs-backend/views/contact.ejs` — email, mobile responsive
- `ecs-backend/views/ideas.ejs` — patent cost, market rates, validity
- `ecs-backend/views/admin-dashboard.ejs` — drag-drop photo upload
- `ecs-backend/routes/team.js` — /upload-photo endpoint

---

## SESSION RESUME CHECKPOINT
If session expires, restart from: Run `node server.js` in `ecs-backend/`, check localhost:3000, then push to GitHub after user approval.
