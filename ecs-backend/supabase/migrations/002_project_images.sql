-- ── PROJECT IMAGES ──────────────────────────────────────────────────
-- Multiple screenshots per project, managed via admin CRUD (add/update/
-- delete/reorder). Cascade-deletes when the parent project is removed.
CREATE TABLE IF NOT EXISTS project_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id);

ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_project_images" ON project_images FOR SELECT USING (true);
CREATE POLICY "service_role_write_project_images" ON project_images
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
