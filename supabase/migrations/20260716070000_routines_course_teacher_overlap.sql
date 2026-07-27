/*
# Add course_code/teacher to routines + overlap prevention

The Member Portal's self-service Routine editor (and its CSV bulk import)
needs two extra descriptive columns, plus a database-level guarantee that a
member can't end up with two active, overlapping schedule entries on the
same day — even if two requests race each other (e.g. two browser tabs, or
two rows in the same CSV import). The application already does a
client-side overlap check first for a fast, friendly error message; this
constraint is the authoritative backstop.

1. New columns
   - routines.course_code (text, optional)
   - routines.teacher (text, optional)

2. Overlap prevention
   - Requires the btree_gist extension (lets GiST indexes handle the
     equality columns alongside the range comparison).
   - Excludes any two ACTIVE rows for the same member, same day, with
     overlapping [start_time, end_time) ranges. Deactivated entries
     (is_active = false) are exempt, since toggling something off should
     free up that slot.
   - Violating this raises Postgres error code 23P01, which the frontend
     already catches and turns into a friendly message.
*/

ALTER TABLE routines ADD COLUMN IF NOT EXISTS course_code text;
ALTER TABLE routines ADD COLUMN IF NOT EXISTS teacher text;

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE routines DROP CONSTRAINT IF EXISTS routines_no_overlap;
ALTER TABLE routines
  ADD CONSTRAINT routines_no_overlap
  EXCLUDE USING gist (
    member_id WITH =,
    day_of_week WITH =,
    tsrange(
      ('2000-01-01'::date + start_time)::timestamp,
      ('2000-01-01'::date + end_time)::timestamp,
      '[)'
    ) WITH &&
  )
  WHERE (is_active);
