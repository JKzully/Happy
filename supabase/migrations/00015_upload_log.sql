-- Upload log: track every Excel upload for audit and duplicate detection
CREATE TABLE upload_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  detected_format TEXT NOT NULL,
  file_date TEXT NOT NULL,
  rows_saved INTEGER NOT NULL DEFAULT 0,
  total_boxes INTEGER NOT NULL DEFAULT 0,
  store_count INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE upload_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read upload_log" ON upload_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert upload_log" ON upload_log
  FOR INSERT TO authenticated WITH CHECK (true);
