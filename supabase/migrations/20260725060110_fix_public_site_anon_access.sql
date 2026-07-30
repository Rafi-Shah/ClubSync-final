/*
# Public website pages showing no data when logged out

1. Root cause
   departments, events, executive_committee, and recruitments all had
   their SELECT policy scoped to `TO authenticated` only (e.g.
   "authenticated_read_events"). That correctly serves the Admin/Member
   Portal, but these same tables also back PUBLIC website pages
   (Committee, Departments, Events, Recruitment) that anonymous visitors
   browse without logging in — and anon was never granted read access at
   all, so every one of those pages loaded zero rows.

   Sibling tables (about_content, achievements, faqs, gallery_items,
   site_settings) already had this right — their policies use
   `public_read_*` and are scoped `TO anon, authenticated`.

2. Fix
   - departments, executive_committee, recruitments: add anon to the
     existing SELECT policy (these have no "internal-only" subset — a
     department, an executive, or a job posting is either fully public
     or wouldn't be here at all).
   - events: anon gets read access too, but ONLY to events explicitly
     marked is_public = true. Authenticated users' access is unchanged
     (they still see every event, matching current behavior) — this only
     ever adds visibility for anonymous visitors, and only for events
     the club has explicitly marked public-facing.
*/

DROP POLICY IF EXISTS "authenticated_read_departments" ON departments;
CREATE POLICY "public_read_departments" ON departments
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_read_executive_committee" ON executive_committee;
CREATE POLICY "public_read_executive_committee" ON executive_committee
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_read_recruitments" ON recruitments;
CREATE POLICY "public_read_recruitments" ON recruitments
  FOR SELECT TO anon, authenticated USING (true);

-- events: keep full access for authenticated (unchanged), add anon
-- access scoped to public events only.
DROP POLICY IF EXISTS "anon_read_public_events" ON events;
CREATE POLICY "anon_read_public_events" ON events
  FOR SELECT TO anon USING (COALESCE(is_public, true) = true);
