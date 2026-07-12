/*
# Fix CRUD-breaking RLS gaps

1. Purpose
   Several tables had missing or self-contradicting RLS policies that broke
   Create/Update/Delete for legitimate, already-built app features. This
   migration only adds/corrects policies — no table or column changes.

2. Fixes
   - conversation_participants: had ZERO insert/update/delete policy at all
     (only enabled RLS + a select policy), so every "start chat / add
     participant / mark read / leave conversation" action failed for
     everyone, including admins. Adds insert/update/delete policies.
   - conversations: insert was admin-only, so a regular member could never
     start a direct/team chat from the Member Portal. Broadens insert to
     allow members to create their own direct/team conversations, while
     keeping broadcast-type conversations admin-only (that stays a
     dedicated admin feature, see admin/Broadcast.tsx).
   - tasks: "admin_update_tasks" USING clause allowed a member to attempt
     updating their own assigned task, but WITH CHECK required
     is_admin_user() — so the update always failed after the fact. A member
     could never mark their own task as complete. Fixed so USING and WITH
     CHECK agree.
   - resource_bookings: there was no INSERT policy for admins at all (only
     "members_create_own_bookings", which requires member_id = the
     inserting user's own member row). So when an admin books a resource on
     behalf of another member via the admin UI, the insert was rejected.
     Adds an admin insert policy.
*/

-- ============ CONVERSATIONS ============
-- Broaden insert: members may create their own direct/team conversations;
-- broadcast-type conversations remain admin-only.
DROP POLICY IF EXISTS "admin_insert_conversations" ON conversations;
DROP POLICY IF EXISTS "members_insert_conversations" ON conversations;
CREATE POLICY "members_insert_conversations" ON conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_user()
    OR (
      conversation_type IN ('direct', 'team')
      AND created_by_member_id = (SELECT id FROM members WHERE user_id = auth.uid())
    )
  );

-- ============ CONVERSATION_PARTICIPANTS ============
-- A member can add themselves, or be added by the conversation's creator,
-- or be added/removed/updated by an admin.
DROP POLICY IF EXISTS "members_insert_participants" ON conversation_participants;
CREATE POLICY "members_insert_participants" ON conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_user()
    OR member_id = (SELECT id FROM members WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by_member_id = (SELECT id FROM members WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "members_update_own_participation" ON conversation_participants;
CREATE POLICY "members_update_own_participation" ON conversation_participants
  FOR UPDATE TO authenticated
  USING (
    is_admin_user()
    OR member_id = (SELECT id FROM members WHERE user_id = auth.uid())
  )
  WITH CHECK (
    is_admin_user()
    OR member_id = (SELECT id FROM members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "members_delete_participants" ON conversation_participants;
CREATE POLICY "members_delete_participants" ON conversation_participants
  FOR DELETE TO authenticated
  USING (
    is_admin_user()
    OR member_id = (SELECT id FROM members WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_participants.conversation_id
        AND c.created_by_member_id = (SELECT id FROM members WHERE user_id = auth.uid())
    )
  );

-- ============ TASKS ============
-- Fix USING/WITH CHECK mismatch: a member assigned a task could pass the
-- USING check but never the WITH CHECK, so their own update always failed.
DROP POLICY IF EXISTS "admin_update_tasks" ON tasks;
CREATE POLICY "admin_update_tasks" ON tasks FOR UPDATE TO authenticated
  USING (
    is_admin_user()
    OR auth.uid() = (SELECT user_id FROM members WHERE id = tasks.assigned_to_member_id)
  )
  WITH CHECK (
    is_admin_user()
    OR auth.uid() = (SELECT user_id FROM members WHERE id = tasks.assigned_to_member_id)
  );

-- ============ RESOURCE_BOOKINGS ============
-- Admins had select/update/delete but no insert policy, so booking a
-- resource on behalf of another member from the admin UI always failed.
DROP POLICY IF EXISTS "admin_insert_resource_bookings" ON resource_bookings;
CREATE POLICY "admin_insert_resource_bookings" ON resource_bookings
  FOR INSERT TO authenticated WITH CHECK (is_admin_user());
