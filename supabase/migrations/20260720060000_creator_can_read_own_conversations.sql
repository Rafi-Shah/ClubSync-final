-- Fixes: "new row violates row-level security policy for table 'conversations'"
-- when starting a new chat.
--
-- Cause: right after INSERT, the app does a .select() to read back the new
-- row's id (needed before it can insert conversation_participants rows).
-- At that exact moment:
--   - participants_read_conversations doesn't match yet (no participant row exists)
--   - admin_select_conversations excludes conversation_type = 'direct' (see
--     20260718060000_fix_conversations_privacy_leak.sql)
-- So no SELECT policy matches the brand-new row, and Postgres reports this
-- as an RLS violation on the whole insert.
--
-- Fix: the creator (conversations.created_by_member_id) can always read a
-- conversation they created, regardless of participant-row timing. This
-- only queries the members table (no self-reference to conversations or
-- conversation_participants), so it introduces no recursion risk.

CREATE POLICY "creator_select_conversations" ON conversations
FOR SELECT
USING (
  created_by_member_id IN (
    SELECT id FROM members WHERE user_id = auth.uid()
  )
);
