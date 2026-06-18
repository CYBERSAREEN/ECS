-- ── SECURITY EVENTS (EDR-lite) ──────────────────────────────────────
-- Every request the injection guard / admission-control layer flags gets
-- logged here for admin review (Block / Ignore).
CREATE TABLE IF NOT EXISTS security_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip          TEXT NOT NULL,
  fake_mac    TEXT,                 -- cosmetic only — real MACs are not observable over HTTP
  rule        TEXT NOT NULL,
  field       TEXT,
  sample      TEXT,
  method      TEXT,
  path        TEXT,
  user_agent  TEXT,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','ignored','blocked')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_security_events" ON security_events
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── BLOCKED IPS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_ips (
  ip          TEXT PRIMARY KEY,
  reason      TEXT,
  blocked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_blocked_ips" ON blocked_ips
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
