/*
# Activities — Events, Meetings, Tasks, Attendance

1. Purpose
   Models club activities and member participation tracking.

2. New Tables
   - `events`               : Club events (workshops, socials, competitions).
   - `meetings`             : Internal meetings (committee, team, general).
   - `tasks`                : Tasks assigned to members.
   - `attendance`           : Attendance records for events/meetings.
   - `event_registrations`  : Member sign-ups for events.

3. Relationships
   - events.organized_by_member_id -> members(id) ON DELETE SET NULL
   - meetings.event_id -> events(id) ON DELETE SET NULL (optional link)
   - meetings.organized_by_member_id -> members(id) ON DELETE SET NULL
   - tasks.assigned_to_member_id -> members(id) ON DELETE CASCADE
   - tasks.assigned_by_member_id -> members(id) ON DELETE SET NULL
   - attendance.member_id -> members(id) ON DELETE CASCADE
   - attendance.event_id -> events(id) ON DELETE CASCADE (nullable)
   - attendance.meeting_id -> meetings(id) ON DELETE CASCADE (nullable)
   - event_registrations.event_id -> events(id) ON DELETE CASCADE
   - event_registrations.member_id -> members(id) ON DELETE CASCADE

4. Security (RLS)
   - All readable by authenticated users (members see their own tasks/attendance
     and the event calendar).
   - Writes locked to admin/service role except where a member writes their own
     registration row (event_registrations INSERT/DELETE for own row).

5. Notes
   - attendance references EITHER event_id OR meeting_id (one nullable), enforced
     by a CHECK that exactly one is set.
   - status enums constrained via CHECK.
*/

CREATE TABLE IF NOT EXISTS events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text NOT NULL,
  slug                 text NOT NULL UNIQUE,
  description          text,
  location             text,
  start_at             timestamptz NOT NULL,
  end_at               timestamptz,
  organized_by_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  status               text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','published','ongoing','completed','cancelled')),
  is_public            boolean NOT NULL DEFAULT true,
  cover_image_url      text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_start_at ON events(start_at);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_events" ON events;
CREATE POLICY "authenticated_read_events" ON events
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS meetings (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                  text NOT NULL,
  agenda                 text,
  location               text,
  start_at               timestamptz NOT NULL,
  end_at                 timestamptz,
  meeting_type           text NOT NULL DEFAULT 'general'
                          CHECK (meeting_type IN ('general','committee','team','executive','emergency')),
  event_id               uuid REFERENCES events(id) ON DELETE SET NULL,
  organized_by_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  status                 text NOT NULL DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled','ongoing','completed','cancelled')),
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_meetings_start_at ON meetings(start_at);
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_meetings" ON meetings;
CREATE POLICY "authenticated_read_meetings" ON meetings
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS tasks (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                  text NOT NULL,
  description            text,
  assigned_to_member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  assigned_by_member_id  uuid REFERENCES members(id) ON DELETE SET NULL,
  related_event_id       uuid REFERENCES events(id) ON DELETE SET NULL,
  related_meeting_id     uuid REFERENCES meetings(id) ON DELETE SET NULL,
  status                 text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','in_progress','review','completed','cancelled')),
  priority               text NOT NULL DEFAULT 'medium'
                          CHECK (priority IN ('low','medium','high','urgent')),
  due_at                 timestamptz,
  completed_at           timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at ON tasks(due_at);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own_tasks" ON tasks;
CREATE POLICY "members_read_own_tasks" ON tasks
  FOR SELECT TO authenticated USING (auth.uid() = (
    SELECT user_id FROM members WHERE id = assigned_to_member_id
  ));

CREATE TABLE IF NOT EXISTS attendance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_id    uuid REFERENCES events(id) ON DELETE CASCADE,
  meeting_id  uuid REFERENCES meetings(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'present'
                CHECK (status IN ('present','absent','late','excused')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (event_id IS NOT NULL AND meeting_id IS NULL) OR
    (event_id IS NULL AND meeting_id IS NOT NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_event ON attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_meeting ON attendance(meeting_id);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own_attendance" ON attendance;
CREATE POLICY "members_read_own_attendance" ON attendance
  FOR SELECT TO authenticated USING (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));

CREATE TABLE IF NOT EXISTS event_registrations (
  event_id   uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  status     text NOT NULL DEFAULT 'registered'
               CHECK (status IN ('registered','attended','cancelled','no_show')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_event_reg_member ON event_registrations(member_id);
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own_registrations" ON event_registrations;
CREATE POLICY "members_read_own_registrations" ON event_registrations
  FOR SELECT TO authenticated USING (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));
DROP POLICY IF EXISTS "members_register_own" ON event_registrations;
CREATE POLICY "members_register_own" ON event_registrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));
DROP POLICY IF EXISTS "members_cancel_own_registration" ON event_registrations;
CREATE POLICY "members_cancel_own_registration" ON event_registrations
  FOR DELETE TO authenticated USING (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));
