/*
# Organizational Structure — Departments, Teams, Executive Committee

1. Purpose
   Models the club's organizational hierarchy. A member belongs to one or more
   departments; departments contain teams; an executive committee is drawn from
   members and assigned positions.

2. New Tables
   - `departments`        : Functional units (e.g. Marketing, Tech, Events).
   - `teams`              : Sub-units within a department.
   - `department_members`  : M:N members <-> departments, with a role-in-dept.
   - `team_members`        : M:N members <-> teams.
   - `executive_committee` : Members holding executive positions (president, vp,
                            secretary, etc.) with term tracking.

3. Relationships
   - teams.department_id -> departments(id) ON DELETE CASCADE
   - department_members.department_id -> departments(id) ON DELETE CASCADE
   - department_members.member_id -> members(id) ON DELETE CASCADE
   - team_members.team_id -> teams(id) ON DELETE CASCADE
   - team_members.member_id -> members(id) ON DELETE CASCADE
   - executive_committee.member_id -> members(id) ON DELETE CASCADE

4. Security (RLS)
   - All org tables are readable by authenticated users (members need to see
     their own departments/teams and the public committee roster).
   - Writes are admin-only (no anon/authenticated write policies = locked,
     managed via service role / admin flows).

5. Notes
   - `position` on executive_committee is a free-text label (e.g. "President")
     kept distinct from RBAC `roles` which govern system access.
*/

CREATE TABLE IF NOT EXISTS departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  description text,
  head_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_departments_slug ON departments(slug);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_departments" ON departments;
CREATE POLICY "authenticated_read_departments" ON departments
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS teams (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  name          text NOT NULL,
  slug          text NOT NULL,
  description   text,
  lead_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_teams_department_id ON teams(department_id);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_teams" ON teams;
CREATE POLICY "authenticated_read_teams" ON teams
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS department_members (
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role_in_dept text NOT NULL DEFAULT 'member',
  joined_at    date NOT NULL DEFAULT CURRENT_DATE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (department_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_dept_members_member ON department_members(member_id);
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_department_members" ON department_members;
CREATE POLICY "authenticated_read_department_members" ON department_members
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS team_members (
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role_in_team text NOT NULL DEFAULT 'member',
  joined_at  date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(member_id);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_team_members" ON team_members;
CREATE POLICY "authenticated_read_team_members" ON team_members
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS executive_committee (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position    text NOT NULL,
  term_start  date NOT NULL,
  term_end    date,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_exec_member ON executive_committee(member_id);
CREATE INDEX IF NOT EXISTS idx_exec_active ON executive_committee(is_active);
ALTER TABLE executive_committee ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_executive_committee" ON executive_committee;
CREATE POLICY "authenticated_read_executive_committee" ON executive_committee
  FOR SELECT TO authenticated USING (true);
