/*
# Fix privacy leak: private conversations/messages readable by everyone

1. Root cause
   In 20260704172001_create_admin_rls_policies.sql, two policies were
   clearly intended to be admin-only reads (they're even named
   "admin_select_conversations" / "admin_select_messages", matching every
   other admin_select_* policy in that file, all of which correctly use
   USING (is_admin_user())) — but these two were written with
   USING (true) instead.

   Postgres combines multiple permissive RLS policies for the same command
   with OR. So even though "participants_read_conversations" and
   "participants_read_messages" correctly restrict reads to conversation
   participants only, this second, mis-written policy overrides that
   restriction for literally every authenticated user — meaning any
   member could read any other member's direct messages, not just their
   own conversations.

2. Fix
   Correct both policies to actually check is_admin_user(), matching their
   name and every sibling policy in the same migration.
*/

DROP POLICY IF EXISTS "admin_select_conversations" ON conversations;
CREATE POLICY "admin_select_conversations" ON conversations
  FOR SELECT TO authenticated USING (is_admin_user());

DROP POLICY IF EXISTS "admin_select_messages" ON messages;
CREATE POLICY "admin_select_messages" ON messages
  FOR SELECT TO authenticated USING (is_admin_user());

-- Same mistake, found in the same sweep: any member could see every other
-- member's resource bookings (what was booked, when, and the stated
-- purpose), not just their own. "members_read_own_bookings" already
-- restricts correctly — this bad policy was overriding it for everyone.
DROP POLICY IF EXISTS "admin_select_resource_bookings" ON resource_bookings;
CREATE POLICY "admin_select_resource_bookings" ON resource_bookings
  FOR SELECT TO authenticated USING (is_admin_user());
