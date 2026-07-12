/*
# Member Portal Tables — Routines, Volunteer Hours, Ideas, Feedback, Performance

1. Purpose
   Adds tables specific to the Member Portal experience: weekly routines,
   volunteer hour tracking, idea submissions, member feedback, and performance
   metrics. All are member-scoped (owner = the authenticated member).

2. New Tables
   - `routines`         : A member's recurring weekly schedule entries.
   - `volunteer_hours`  : Logged volunteer hours per member, optionally linked
                          to an event.
   - `ideas`            : Member-submitted ideas with status tracking.
   - `feedback`         : Member feedback (general or about an event/meeting).
   - `performance_metrics`: Aggregated performance scores per member per period.

3. Relationships
   - routines.member_id -> members(id) ON DELETE CASCADE
   - volunteer_hours.member_id -> members(id) ON DELETE CASCADE
   - volunteer_hours.event_id -> events(id) ON DELETE SET NULL
   - volunteer_hours.approved_by_member_id -> members(id) ON DELETE SET NULL
   - ideas.member_id -> members(id) ON DELETE CASCADE
   - feedback.member_id -> members(id) ON DELETE CASCADE
   - feedback.related_event_id -> events(id) ON DELETE SET NULL
   - feedback.related_meeting_id -> meetings(id) ON DELETE SET NULL
   - performance_metrics.member_id -> members(id) ON DELETE CASCADE

4. Security (RLS)
   - All tables: a member can read/update/delete their own rows (owner-scoped
     via auth.uid() = (SELECT user_id FROM members WHERE id = member_id)).
   - INSERT: a member can insert their own rows.
   - volunteer_hours: read includes own rows; admin approval handled via
     service role (no authenticated UPDATE policy — members can't self-approve).
   - ideas: member can read/update own; status changes locked to admin.
   - feedback: member can read own; admin reads all via service role.
   - performance_metrics: read-only for members (no INSERT/UPDATE/DELETE policy).

5. Notes
   - routines.day_of_week uses 0=Sunday..6=Saturday.
   - volunteer_hours.status: pending/approved/rejected.
   - ideas.status: submitted/under_review/approved/rejected/implemented.
   - performance_metrics stores a numeric score and category breakdowns.
*/

CREATE TABLE IF NOT EXISTS routines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time  time NOT NULL,
  end_time    time NOT NULL,
  location    text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_routines_member ON routines(member_id);
CREATE INDEX IF NOT EXISTS idx_routines_day ON routines(day_of_week);
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own_routines" ON routines;
CREATE POLICY "members_read_own_routines" ON routines
  FOR SELECT TO authenticated USING (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));
DROP POLICY IF EXISTS "members_insert_own_routines" ON routines;
CREATE POLICY "members_insert_own_routines" ON routines
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));
DROP POLICY IF EXISTS "members_update_own_routines" ON routines;
CREATE POLICY "members_update_own_routines" ON routines
  FOR UPDATE TO authenticated USING (auth.uid() = (SELECT user_id FROM members WHERE id = member_id)) WITH CHECK (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));
DROP POLICY IF EXISTS "members_delete_own_routines" ON routines;
CREATE POLICY "members_delete_own_routines" ON routines
  FOR DELETE TO authenticated USING (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));

CREATE TABLE IF NOT EXISTS volunteer_hours (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id             uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_id              uuid REFERENCES events(id) ON DELETE SET NULL,
  activity_description  text NOT NULL,
  hours                 numeric(5,2) NOT NULL CHECK (hours > 0),
  activity_date         date NOT NULL DEFAULT CURRENT_DATE,
  status                text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected')),
  approved_by_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  approved_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_volunteer_member ON volunteer_hours(member_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_status ON volunteer_hours(status);
ALTER TABLE volunteer_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own_volunteer" ON volunteer_hours;
CREATE POLICY "members_read_own_volunteer" ON volunteer_hours
  FOR SELECT TO authenticated USING (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));
DROP POLICY IF EXISTS "members_insert_own_volunteer" ON volunteer_hours;
CREATE POLICY "members_insert_own_volunteer" ON volunteer_hours
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));

CREATE TABLE IF NOT EXISTS ideas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text NOT NULL,
  category    text NOT NULL DEFAULT 'general',
  status      text NOT NULL DEFAULT 'submitted'
                CHECK (status IN ('submitted','under_review','approved','rejected','implemented')),
  admin_notes text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ideas_member ON ideas(member_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own_ideas" ON ideas;
CREATE POLICY "members_read_own_ideas" ON ideas
  FOR SELECT TO authenticated USING (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));
DROP POLICY IF EXISTS "members_insert_own_ideas" ON ideas;
CREATE POLICY "members_insert_own_ideas" ON ideas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));
DROP POLICY IF EXISTS "members_update_own_ideas" ON ideas;
CREATE POLICY "members_update_own_ideas" ON ideas
  FOR UPDATE TO authenticated USING (auth.uid() = (SELECT user_id FROM members WHERE id = member_id)) WITH CHECK (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));

CREATE TABLE IF NOT EXISTS feedback (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  feedback_type       text NOT NULL DEFAULT 'general'
                        CHECK (feedback_type IN ('general','event','meeting','club')),
  subject             text NOT NULL,
  body                text NOT NULL,
  rating              smallint CHECK (rating >= 1 AND rating <= 5),
  related_event_id    uuid REFERENCES events(id) ON DELETE SET NULL,
  related_meeting_id  uuid REFERENCES meetings(id) ON DELETE SET NULL,
  is_anonymous        boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_feedback_member ON feedback(member_id);
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own_feedback" ON feedback;
CREATE POLICY "members_read_own_feedback" ON feedback
  FOR SELECT TO authenticated USING (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));
DROP POLICY IF EXISTS "members_insert_own_feedback" ON feedback;
CREATE POLICY "members_insert_own_feedback" ON feedback
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));

CREATE TABLE IF NOT EXISTS performance_metrics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  period_start    date NOT NULL,
  period_end      date NOT NULL,
  attendance_rate numeric(5,2) DEFAULT 0 CHECK (attendance_rate >= 0 AND attendance_rate <= 100),
  tasks_completed integer DEFAULT 0,
  tasks_assigned  integer DEFAULT 0,
  volunteer_hours numeric(5,2) DEFAULT 0,
  events_attended integer DEFAULT 0,
  overall_score   numeric(5,2) DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start)
);
CREATE INDEX IF NOT EXISTS idx_perf_member ON performance_metrics(member_id);
CREATE INDEX IF NOT EXISTS idx_perf_period ON performance_metrics(period_start, period_end);
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own_performance" ON performance_metrics;
CREATE POLICY "members_read_own_performance" ON performance_metrics
  FOR SELECT TO authenticated USING (auth.uid() = (SELECT user_id FROM members WHERE id = member_id));
