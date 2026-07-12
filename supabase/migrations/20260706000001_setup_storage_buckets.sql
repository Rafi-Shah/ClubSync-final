/*
  # Phase 6: File Upload — Storage Buckets & Policies

  1. Purpose
     Connects the "File Upload" feature referenced throughout the app
     (avatars, gallery photos, certificates, recruitment CVs) to real
     Supabase Storage, replacing the plain-text URL fields that existed
     before this phase.

  2. Buckets
     - `avatars`      : public read. Member writes only to their own
                        `{auth.uid()}/...` folder.
     - `gallery`      : public read. Only admin-role members may write
                        (Gallery CMS is an admin-only page).
     - `certificates` : public read (members need to view/download their
                        own issued certificates from a public link). Only
                        admin-role members may write.
     - `documents`    : private-ish — public read is still allowed so a
                        generated public URL works without extra signed-URL
                        plumbing, but in practice only recruitment CV links
                        are ever generated here, from `applications.cv_url`,
                        which admins already access via the applications
                        table (RLS on that table controls visibility, not
                        the bucket). Anyone (including anonymous applicants)
                        may upload — matching applications' existing
                        anon-insert policy — but nobody may list/overwrite/
                        delete another person's file since filenames are
                        random UUIDs (see src/lib/storage.ts).

  3. Security notes
     - All write policies require the folder's first path segment to match
       `auth.uid()::text`, so members can only write inside their own
       folder — except `gallery`/`certificates`, which are admin-managed
       content and require an admin role instead.
     - Buckets are NOT created with a file-size limit here because Supabase
       Storage bucket-level limits are enforced project-wide only via the
       dashboard/API in some plans; the app additionally validates size and
       MIME type client-side in src/lib/storage.ts before upload.
*/

-- 1. Buckets --------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('gallery', 'gallery', true),
  ('certificates', 'certificates', true),
  ('documents', 'documents', true)
on conflict (id) do nothing;

-- 2. Reuses public.is_admin_user(), already defined in
--    20260705081437_fix_is_admin_user_security.sql, so there is a single
--    source of truth for "is this user an admin" across table RLS and
--    storage RLS alike.

-- 3. avatars: public read, owner-folder write ------------------------------

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4. gallery: public read, admin-only write --------------------------------

drop policy if exists "gallery_public_read" on storage.objects;
create policy "gallery_public_read" on storage.objects
  for select using (bucket_id = 'gallery');

drop policy if exists "gallery_admin_write" on storage.objects;
create policy "gallery_admin_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gallery' and public.is_admin_user());

drop policy if exists "gallery_admin_update" on storage.objects;
create policy "gallery_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'gallery' and public.is_admin_user());

drop policy if exists "gallery_admin_delete" on storage.objects;
create policy "gallery_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'gallery' and public.is_admin_user());

-- 5. certificates: public read, admin-only write ---------------------------

drop policy if exists "certificates_public_read" on storage.objects;
create policy "certificates_public_read" on storage.objects
  for select using (bucket_id = 'certificates');

drop policy if exists "certificates_admin_write" on storage.objects;
create policy "certificates_admin_write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'certificates' and public.is_admin_user());

drop policy if exists "certificates_admin_delete" on storage.objects;
create policy "certificates_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'certificates' and public.is_admin_user());

-- 6. documents (recruitment CVs): public read, open insert (anon applicants
--    included, matching applications' own anon-insert policy) -------------

drop policy if exists "documents_public_read" on storage.objects;
create policy "documents_public_read" on storage.objects
  for select using (bucket_id = 'documents');

drop policy if exists "documents_open_write" on storage.objects;
create policy "documents_open_write" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'documents');
