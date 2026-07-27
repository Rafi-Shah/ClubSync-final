/*
# Routine Availability Feature — Schema Additions, Overlap Constraint, Search RPC

1. Purpose
   Extends the existing `routines` and `members` tables to support the
   Student Class Routine Management & Availability Finder feature, and adds
   a single indexed RPC (`find_available_members`) that both the Admin
   Availability Finder page and the AI Assistant edge function call — so the
   overlap-detection logic exists in exactly one place.

2. Changes to existing tables (additive only — no existing column/row is
   altered or dropped, so nothing already built against `routines` or
   `members` breaks)
   - routines.course_code   (nullable) — optional course code, e.g. "CSE401"
   - routines.teacher       (nullable) — optional instructor name
   - routines.start_minutes / end_minutes — generated columns (minutes since
     midnight), used only for fast range comparisons and the exclusion
     constraint below. Not meant to be written directly.
   - members.batch          (nullable) — e.g. "2022"
   - members.semester       (nullable) — e.g. "6th"

3. New constraint
   - `routines_no_overlap`: a GiST exclusion constraint that rejects any
     INSERT/UPDATE that would create two *active* routine rows for the same
     member, same day, with overlapping time ranges. An exact duplicate is a
     zero-width overlap, so this single constraint satisfies both "no
     duplicate entries" and "no overlapping classes for the same student."
     Requires the btree_gist extension for the equality comparisons.
   - Scoped to `WHERE (is_active)` so deactivating a routine (already a
     supported action in the UI) frees up that slot without deleting history.

4. New function: find_available_members(...)
   - SECURITY INVOKER (deliberately NOT DEFINER) — runs under the calling
     user's own RLS, exactly like every other query in this project. Admins
     already have SELECT policies on members/routines/user_roles/
     executive_committee/department_members (see
     20260704172001_create_admin_rls_policies.sql), so an admin caller sees
     every member; a non-admin caller sees only rows their own RLS exposes
     (effectively just themselves), which is the correct and already-
     established access boundary — no new privilege surface is introduced.
   - Does the overlap comparison as an indexed range check
     (int4range(start_minutes, end_minutes) && int4range(p_start, p_end))
     inside the database, not by shipping all routine rows to the client.
   - Accepts optional filters (role slugs, department ids, batch, semester,
     committee-only, position, free-text search) so the Admin UI and the AI
     Assistant can both do "smart filtering" through one call.
*/

-- ---------------------------------------------------------------------
-- 1. Additive columns
-- ---------------------------------------------------------------------

ALTER TABLE routines ADD COLUMN IF NOT EXISTS course_code text;
ALTER TABLE routines ADD COLUMN IF NOT EXISTS teacher text;

ALTER TABLE members ADD COLUMN IF NOT EXISTS batch text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS semester text;

CREATE INDEX IF NOT EXISTS idx_members_batch ON members(batch);
CREATE INDEX IF NOT EXISTS idx_members_semester ON members(semester);

-- Generated columns used for fast, index-friendly range comparisons.
-- STORED (not virtual) so they can be indexed and used in the exclusion
-- constraint below.
ALTER TABLE routines ADD COLUMN IF NOT EXISTS start_minutes integer
  GENERATED ALWAYS AS (EXTRACT(HOUR FROM start_time)::int * 60 + EXTRACT(MINUTE FROM start_time)::int) STORED;
ALTER TABLE routines ADD COLUMN IF NOT EXISTS end_minutes integer
  GENERATED ALWAYS AS (EXTRACT(HOUR FROM end_time)::int * 60 + EXTRACT(MINUTE FROM end_time)::int) STORED;

-- ---------------------------------------------------------------------
-- 2. Overlap / duplicate prevention (DB-level, defense in depth —
--    the frontend also checks this before submitting, for a fast/friendly
--    error message, but the constraint is the actual source of truth)
-- ---------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE routines DROP CONSTRAINT IF EXISTS routines_no_overlap;
ALTER TABLE routines ADD CONSTRAINT routines_no_overlap
  EXCLUDE USING gist (
    member_id WITH =,
    day_of_week WITH =,
    int4range(start_minutes, end_minutes, '[]') WITH &&
  ) WHERE (is_active);

-- Supports both the exclusion constraint and general day+time-range lookups
-- (including inside find_available_members below).
CREATE INDEX IF NOT EXISTS idx_routines_day_range
  ON routines USING gist (day_of_week, int4range(start_minutes, end_minutes, '[]'))
  WHERE is_active;

-- ---------------------------------------------------------------------
-- 3. find_available_members — the shared availability search
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION find_available_members(
  p_day_of_week    smallint,
  p_start_minutes  integer,
  p_end_minutes    integer,
  p_role_slugs     text[]  DEFAULT NULL,
  p_department_ids uuid[]  DEFAULT NULL,
  p_batch          text    DEFAULT NULL,
  p_semester       text    DEFAULT NULL,
  p_committee_only boolean DEFAULT NULL,
  p_position       text    DEFAULT NULL,
  p_search         text    DEFAULT NULL,
  p_only_available boolean DEFAULT NULL,
  p_limit          integer DEFAULT 200
)
RETURNS TABLE (
  member_id        uuid,
  member_code      text,
  full_name        text,
  email            text,
  phone            text,
  avatar_url       text,
  batch            text,
  semester         text,
  department_names text,
  role_names       text,
  position_title   text,
  is_available     boolean,
  conflict_title   text,
  conflict_start   time,
  conflict_end     time
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  WITH conflicts AS (
    -- One representative conflicting class per member (earliest), for the
    -- "which class conflicts" detail. A member can only have one overlap
    -- shown here even if they technically had two back-to-back classes
    -- spanning the window — that's an acceptable simplification for display.
    SELECT DISTINCT ON (r.member_id)
      r.member_id,
      r.title AS conflict_title,
      r.start_time AS conflict_start,
      r.end_time AS conflict_end
    FROM routines r
    WHERE r.is_active
      AND r.day_of_week = p_day_of_week
      AND int4range(r.start_minutes, r.end_minutes, '[]') && int4range(p_start_minutes, p_end_minutes, '[]')
    ORDER BY r.member_id, r.start_time
  ),
  base AS (
    SELECT
      m.id AS id,
      m.member_code,
      m.full_name,
      m.email,
      m.phone,
      m.avatar_url,
      m.batch,
      m.semester,
      m.user_id,
      (
        SELECT string_agg(d.name, ', ' ORDER BY d.name)
        FROM department_members dm JOIN departments d ON d.id = dm.department_id
        WHERE dm.member_id = m.id
      ) AS department_names,
      (
        SELECT array_agg(DISTINCT dm.department_id)
        FROM department_members dm
        WHERE dm.member_id = m.id
      ) AS department_ids,
      (
        SELECT array_agg(DISTINCT r.slug)
        FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = m.user_id
      ) AS role_slugs,
      (
        SELECT string_agg(DISTINCT r.name, ', ' ORDER BY r.name)
        FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = m.user_id
      ) AS role_names,
      (
        SELECT ec.position FROM executive_committee ec
        WHERE ec.member_id = m.id AND ec.is_active
        ORDER BY ec.term_start DESC LIMIT 1
      ) AS position_title,
      EXISTS (
        SELECT 1 FROM executive_committee ec WHERE ec.member_id = m.id AND ec.is_active
      ) AS on_committee
    FROM members m
    WHERE m.status = 'active'
  )
  SELECT
    b.id,
    b.member_code,
    b.full_name,
    b.email,
    b.phone,
    b.avatar_url,
    b.batch,
    b.semester,
    b.department_names,
    COALESCE(b.role_names, 'Member') AS role_names,
    COALESCE(b.position_title, COALESCE(b.role_names, 'Member')) AS position_title,
    (c.member_id IS NULL) AS is_available,
    c.conflict_title,
    c.conflict_start,
    c.conflict_end
  FROM base b
  LEFT JOIN conflicts c ON c.member_id = b.id
  WHERE
    (p_role_slugs IS NULL OR b.role_slugs && p_role_slugs)
    AND (p_department_ids IS NULL OR b.department_ids && p_department_ids)
    AND (p_batch IS NULL OR b.batch = p_batch)
    AND (p_semester IS NULL OR b.semester = p_semester)
    AND (p_committee_only IS NULL OR b.on_committee = p_committee_only)
    AND (p_position IS NULL OR b.position_title = p_position)
    AND (p_search IS NULL OR b.full_name ILIKE '%' || p_search || '%' OR b.member_code ILIKE '%' || p_search || '%')
    AND (p_only_available IS NULL OR (c.member_id IS NULL) = p_only_available)
  ORDER BY is_available DESC, b.full_name ASC
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION find_available_members TO authenticated;

COMMENT ON FUNCTION find_available_members IS
  'Shared by the Admin Availability Finder page and the AI Assistant edge function. SECURITY INVOKER: relies entirely on existing RLS (admins see all members via is_admin_user()-gated policies; non-admins see only themselves).';
