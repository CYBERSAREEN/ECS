-- =====================================================================
-- ECS — Supabase migration 001: initial schema
-- Run in Supabase SQL editor or via: supabase db push
-- =====================================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── LEADS (contact form submissions) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  organization  TEXT,
  service_required TEXT,
  message       TEXT,
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- Only service_role (backend) can read/write
CREATE POLICY "service_role_full_leads" ON leads
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── SERVICES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('web_dev','security','consultancy','ai')),
  description TEXT NOT NULL,
  badge       TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_services" ON services FOR SELECT USING (true);
CREATE POLICY "service_role_write_services" ON services
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Seed data
INSERT INTO services (title, category, description, badge, sort_order) VALUES
  ('Web Development','web_dev','Secure-by-design static and dynamic websites. Scalable from day one.',NULL,1),
  ('WAPT','security','AI-assisted web application penetration testing with actionable, prioritised reports.',NULL,2),
  ('AI-Based Cyber Tutor','ai','Patent-pending adaptive AI tutor for personalised cybersecurity education.','Coming Soon',3),
  ('Startup Consultancy','consultancy','CRM dashboards, admin panels, lead management, and operational backbone.',NULL,4);

-- ── TEAM MEMBERS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  role       TEXT NOT NULL,
  bio        TEXT,
  photo_url  TEXT,
  initials   TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_team" ON team_members FOR SELECT USING (true);
CREATE POLICY "service_role_write_team" ON team_members
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

INSERT INTO team_members (name, role, bio, initials, sort_order) VALUES
  ('Vedant Sareen','Director & CTO','Penetration tester, web developer, AI automation engineer, Red Teamer & VAPT specialist. Ex-EY Senior Security Analyst. Patent holder for PenBox DMAS.',NULL,1),
  ('Suneha Passi','Senior Web Developer','Full-stack web designer, prompt engineer, and project team lead.','SP',2),
  ('Hardik Garg','Lead Cybersecurity Analyst','Deep expertise in red teaming, cloud security, DevSecOps, and bug bounty.','HG',3);

-- ── PROJECTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type               TEXT NOT NULL CHECK (type IN ('web_dev','security')),
  title              TEXT NOT NULL,
  link               TEXT,
  description        TEXT,
  functionalities    TEXT,
  delivery_time      TEXT,
  -- Security-specific
  vulnerability_title TEXT,
  bounty_earned      TEXT,
  bounty_description TEXT,
  portswigger_links  TEXT,
  poc                TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_projects" ON projects FOR SELECT USING (true);
CREATE POLICY "service_role_write_projects" ON projects
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

INSERT INTO projects (type, title, link, description, functionalities, delivery_time) VALUES
  ('web_dev','The Raw Studios','https://therawstudios.in',
   'Scaling an institute for music, dance, art, and craft from local studio to global digital presence.',
   '1. Static website with GSAP animations, responsive across all devices
2. Admin dashboard for CRUD on courses and teachers
3. CRM and Enquiry Dashboard with WhatsApp integration
4. SEO-friendly with optimised pixel ad generation',
   '3 weeks');

-- ── PATENTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patents (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT NOT NULL,
  title              TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected')),
  date               DATE,
  ref_no             TEXT,
  patent_code        TEXT,
  sdg                TEXT,
  inventors          JSONB,
  pdf_url            TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE patents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_approved_patents" ON patents
  FOR SELECT USING (status = 'Approved');
CREATE POLICY "service_role_write_patents" ON patents
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

INSERT INTO patents (application_number, title, status, date, ref_no, patent_code, sdg, inventors) VALUES
  ('2342352151',
   'PENBOX-DMAS: A DISTRIBUTED MULTI-AGENT SECURITY APPLIANCE FOR AUTONOMOUS VULNERABILITY ASSESSMENT AND REMEDIATION AT THE EDGE',
   'Approved',
   '2026-04-29',
   'UTI4236',
   'UPTRAYAMBAK260519-4236',
   'Industry, Innovation, and Infrastructure',
   '[{"name":"Vedant Sareen","designation":"Student","dept":"Computer Science & Engineering","email":"vedant1318.be23@chitkara.edu.in","contact":"7087603933","code":"2310991318"},{"name":"Dr. Himanshi Babbar","designation":"Assistant Professor","dept":"Computer Science & Engineering","email":"himanshi.babbar@chitkara.edu.in","contact":"8557008265"}]'
   );

-- ── PATENT SUBMISSIONS (public idea form) ────────────────────────────
CREATE TABLE IF NOT EXISTS patent_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_name TEXT NOT NULL,
  organization   TEXT,
  patent_title   TEXT NOT NULL,
  file_url       TEXT,
  status         TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','reviewing','filed','rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE patent_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_submissions" ON patent_submissions
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── SCAN REQUESTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email               TEXT NOT NULL,
  website_url         TEXT NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('dns','meta','file')),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verifying','scanning','completed','failed')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scan_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_scans" ON scan_requests
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── SCAN REPORTS (QuickScan results summary) ──────────────────────────
CREATE TABLE IF NOT EXISTS scan_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target          TEXT NOT NULL,
  grade           TEXT,
  score           INTEGER,
  findings_count  INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scan_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_reports" ON scan_reports
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
