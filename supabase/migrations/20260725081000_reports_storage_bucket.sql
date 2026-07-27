-- Creates a storage bucket for generated report PDFs. Reports are public
-- (view link works without auth, matching the existing certificates bucket
-- pattern), but only admins can upload/delete — same as certificates.

INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "reports_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports' AND is_admin_user());

CREATE POLICY "reports_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'reports');

CREATE POLICY "reports_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'reports' AND is_admin_user());
