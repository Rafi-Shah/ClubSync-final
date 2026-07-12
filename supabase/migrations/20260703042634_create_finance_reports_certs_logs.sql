/*
# Finance, Reports, Certificates, Activity Logs

1. Purpose
   Budget/finance tracking, generated reports, member certificates, and the
   audit trail (activity logs). These are primarily Admin Portal concerns.

2. New Tables
   - `budgets`        : Financial budget entries (income/expense).
   - `reports`        : Generated reports (stored reference + metadata).
   - `certificates`   : Certificates issued to members.
   - `activity_logs`  : Audit trail of user actions across all portals.

3. Relationships
   - budgets.created_by_member_id -> members(id) ON DELETE SET NULL
   - reports.generated_by_member_id -> members(id) ON DELETE SET NULL
   - certificates.member_id -> members(id) ON DELETE CASCADE
   - certificates.issued_by_member_id -> members(id) ON DELETE SET NULL
   - certificates.event_id -> events(id) ON DELETE SET NULL
   - activity_logs.user_id -> auth.users(id) ON DELETE CASCADE

4. Security (RLS)
   - budgets, reports: readable by authenticated (members see finance summary
     and published reports); writes admin-only (locked).
   - certificates: a member reads their own; admins read all via service role.
   - activity_logs: a user reads their own log entries; inserts allowed for
     authenticated (logging middleware writes the acting user's id).

5. Notes
   - budgets.type distinguishes income vs expense.
   - reports.type is a free label (attendance, event_summary, finance, etc.).
*/

CREATE TABLE IF NOT EXISTS budgets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text NOT NULL,
  type                text NOT NULL CHECK (type IN ('income','expense')),
  amount              numeric(12,2) NOT NULL CHECK (amount >= 0),
  category            text,
  description         text,
  transaction_date    date NOT NULL DEFAULT CURRENT_DATE,
  created_by_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_budgets_type ON budgets(type);
CREATE INDEX IF NOT EXISTS idx_budgets_date ON budgets(transaction_date);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_budgets" ON budgets;
CREATE POLICY "authenticated_read_budgets" ON budgets
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS reports (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text NOT NULL,
  type                  text NOT NULL,
  description           text,
  file_url              text,
  period_start          date,
  period_end            date,
  generated_by_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_reports" ON reports;
CREATE POLICY "authenticated_read_reports" ON reports
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS certificates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id           uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_id            uuid REFERENCES events(id) ON DELETE SET NULL,
  title               text NOT NULL,
  description         text,
  certificate_code    text NOT NULL UNIQUE,
  issued_at           date NOT NULL DEFAULT CURRENT_DATE,
  issued_by_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  file_url            text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_certificates_member ON certificates(member_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own_certificates" ON certificates;
CREATE POLICY "members_read_own_certificates" ON certificates
  FOR SELECT TO authenticated USING (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));

CREATE TABLE IF NOT EXISTS activity_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  portal      text NOT NULL CHECK (portal IN ('public','member','admin')),
  action      text NOT NULL,
  entity_type text,
  entity_id   uuid,
  description text,
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_portal ON activity_logs(portal);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_logs" ON activity_logs;
CREATE POLICY "users_read_own_logs" ON activity_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_insert_own_logs" ON activity_logs;
CREATE POLICY "users_insert_own_logs" ON activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
