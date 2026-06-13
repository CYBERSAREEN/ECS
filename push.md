# ECS Deploy Runbook

Say "push" → run all 4 steps below. Done.

---

## 1. GitHub

```bash
cd /home/kali/Desktop/excelonCS
git add -A
git commit -m "feat: <describe change>"
git push origin main --tags
```

> **Auth:** GitHub uses `gh auth setup-git`. If push fails with "invalid credentials", run:
> ```bash
> gh auth login
> gh auth setup-git
> ```

Tag a stable release after every working deploy:
```bash
git tag stable-$(date +%Y%m%d-%H%M)
git push origin --tags
```

---

## 2. Vercel (auto)

**Auto-deploys on every push to `main`.** No manual step needed.

- Project: `ecs-teal`
- Live URL: `https://ecs-teal.vercel.app`
- Dashboard: `vercel.com/cybersareen/ecs-teal`
- Config: `/home/kali/Desktop/excelonCS/vercel.json`
- Root: `ecs-backend/server.js` via `@vercel/node`
- Env vars already set on Vercel dashboard (don't touch unless rotating)

Force a manual redeploy (without a code change):
```bash
vercel --prod --cwd /home/kali/Desktop/excelonCS
```

Check deploy logs:
```bash
vercel logs --follow --cwd /home/kali/Desktop/excelonCS
```

---

## 3. Render (auto)

**Auto-deploys on every push to `main` via `render.yaml`.**

- Service: `ecs-backend`
- Region: Singapore
- Config: `/home/kali/Desktop/excelonCS/render.yaml`
- Root dir: `ecs-backend`
- Start: `node server.js`
- Health: `/healthz`

**First-time setup (one time only):**
1. Go to `render.com` → New Web Service
2. Connect GitHub repo: `CYBERSAREEN/ECS`
3. Render auto-detects `render.yaml`
4. Add env vars manually in Render dashboard (copy from `ecs-backend/.env`):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_USERNAME`
   - `ADMIN_PASSWORD_HASH`
   - `JWT_SECRET`
   - `SITE_URL` → set to your Render URL (e.g. `https://ecs-backend.onrender.com`)
   - `NODE_ENV=production`
   - `PORT=10000`

Manual trigger (if auto-deploy is off):
- Render dashboard → ecs-backend → Manual Deploy → Deploy latest commit

---

## 4. Supabase (manual — only when schema/data changes)

Supabase DB is always live. Only run these when seeding/migrating:

```bash
cd /home/kali/Desktop/excelonCS/ecs-backend

# Reseed team members (clears + reinserts all 4 members)
node scripts/reseed-team.js

# Run any SQL migration
# Log into supabase.com → Project → SQL Editor → paste & run
```

- Project: Supabase dashboard → `exceloncybersolutions` project
- DB vars in `.env`: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`

---

## All-in-one push command (copy-paste)

```bash
cd /home/kali/Desktop/excelonCS && \
git add -A && \
git commit -m "feat: update" && \
git push origin main && \
git tag stable-$(date +%Y%m%d-%H%M) && \
git push origin --tags && \
echo "✓ GitHub pushed — Vercel + Render auto-deploy triggered"
```

---

## CSS Cache Busting

When making CSS changes, bump version in `ecs-backend/package.json`:
```json
"version": "1.4.1"
```
The server reads this as `assetV` and appends `?v=1.4.1` to `styles.css`.

---

## Env Vars Reference

| Key | Where set | Notes |
|-----|-----------|-------|
| `SUPABASE_URL` | Vercel + Render + .env | Project URL from Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel + Render + .env | Service role key (not anon key) |
| `ADMIN_USERNAME` | Vercel + Render + .env | Login for /admin |
| `ADMIN_PASSWORD_HASH` | Vercel + Render + .env | bcrypt hash |
| `JWT_SECRET` | Vercel + Render + .env | Random 64-char string |
| `SITE_URL` | Vercel + Render + .env | `https://ecs-teal.vercel.app` on Vercel |
| `PORT` | Render + .env | `10000` on Render, `3000` locally |
| `NODE_ENV` | Render + Vercel | `production` |

---

## Rollback

```bash
# Find last stable tag
git tag | grep stable | tail -5

# Roll back to a tag
git checkout stable-20260613-0821
git push origin HEAD:main --force   # only if emergency
```

Vercel instant rollback: Dashboard → Deployments → click any old deploy → Promote to Production
Render rollback: Dashboard → Events → Redeploy (any past deploy)
