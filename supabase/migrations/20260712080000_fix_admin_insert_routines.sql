/*
# Fix missing admin INSERT policy on routines

routines had SELECT/UPDATE/DELETE policies for admins (added in
20260704172001_create_admin_rls_policies.sql), but no INSERT policy for
admins — only "members_insert_own_routines", which requires
member_id = the inserting user's own member row. So when an admin creates
a routine on behalf of a different member via the admin Routine Management
page, the insert was rejected with "new row violates row-level security
policy for table routines". This adds the missing admin insert policy,
matching the same fix already applied to resource_bookings.
*/

DROP POLICY IF EXISTS "admin_insert_routines" ON routines;
CREATE POLICY "admin_insert_routines" ON routines
  FOR INSERT TO authenticated WITH CHECK (is_admin_user());
