/*
# Recruitment & Resource Tables

1. Purpose
   Recruitment cycles, applicant applications, inventory items, and resource
   bookings. These span Admin Portal (management) and Member Portal (booking).

2. New Tables
   - `recruitments`   : Recruitment drives/cycles.
   - `applications`   : Applicant submissions against a recruitment.
   - `inventory_items`: Club assets/equipment.
   - `resource_bookings`: Member reservations of inventory items or rooms.

3. Relationships
   - applications.recruitment_id -> recruitments(id) ON DELETE CASCADE
   - applications.reviewed_by_member_id -> members(id) ON DELETE SET NULL
   - resource_bookings.item_id -> inventory_items(id) ON DELETE CASCADE
   - resource_bookings.member_id -> members(id) ON DELETE CASCADE

4. Security (RLS)
   - recruitments: readable by authenticated (members see open drives).
   - applications: anon + authenticated may INSERT (public applicants); a user
     reads their own application by matching email to auth email. Admin reads
     all via service role.
   - inventory_items: readable by authenticated.
   - resource_bookings: member reads/inserts/updates/deletes own bookings.

5. Notes
   - applications allows public submission, so INSERT is open to anon+authenticated.
   - status enums constrained via CHECK.
*/

CREATE TABLE IF NOT EXISTS recruitments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  requirements  text,
  open_at       timestamptz NOT NULL,
  close_at      timestamptz,
  status        text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('draft','open','closed','archived')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recruitments_status ON recruitments(status);
ALTER TABLE recruitments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_recruitments" ON recruitments;
CREATE POLICY "authenticated_read_recruitments" ON recruitments
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS applications (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_id        uuid NOT NULL REFERENCES recruitments(id) ON DELETE CASCADE,
  applicant_name        text NOT NULL,
  applicant_email       text NOT NULL,
  applicant_phone       text,
  student_id            text,
  department_preference text,
  motivation            text,
  experience            text,
  status                text NOT NULL DEFAULT 'submitted'
                          CHECK (status IN ('submitted','under_review','shortlisted','accepted','rejected','withdrawn')),
  reviewed_by_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  review_notes          text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_applications_recruitment ON applications(recruitment_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(applicant_email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_own_applications" ON applications;
CREATE POLICY "anon_read_own_applications" ON applications
  FOR SELECT TO anon, authenticated USING (
    applicant_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
DROP POLICY IF EXISTS "anon_submit_applications" ON applications;
CREATE POLICY "anon_submit_applications" ON applications
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE IF NOT EXISTS inventory_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  description   text,
  category      text,
  quantity      integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit          text DEFAULT 'pcs',
  condition     text NOT NULL DEFAULT 'good'
                  CHECK (condition IN ('new','good','fair','damaged','retired')),
  location      text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_inventory" ON inventory_items;
CREATE POLICY "authenticated_read_inventory" ON inventory_items
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS resource_bookings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id     uuid REFERENCES inventory_items(id) ON DELETE CASCADE,
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  purpose     text,
  start_at    timestamptz NOT NULL,
  end_at      timestamptz NOT NULL,
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','returned','cancelled')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (end_at > start_at)
);
CREATE INDEX IF NOT EXISTS idx_bookings_member ON resource_bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_bookings_item ON resource_bookings(item_id);
CREATE INDEX IF NOT EXISTS idx_bookings_window ON resource_bookings(start_at, end_at);
ALTER TABLE resource_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own_bookings" ON resource_bookings;
CREATE POLICY "members_read_own_bookings" ON resource_bookings
  FOR SELECT TO authenticated USING (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));
DROP POLICY IF EXISTS "members_create_own_bookings" ON resource_bookings;
CREATE POLICY "members_create_own_bookings" ON resource_bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));
DROP POLICY IF EXISTS "members_update_own_bookings" ON resource_bookings;
CREATE POLICY "members_update_own_bookings" ON resource_bookings
  FOR UPDATE TO authenticated USING (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  )) WITH CHECK (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));
DROP POLICY IF EXISTS "members_delete_own_bookings" ON resource_bookings;
CREATE POLICY "members_delete_own_bookings" ON resource_bookings
  FOR DELETE TO authenticated USING (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));
