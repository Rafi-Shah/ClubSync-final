/*
# Direct messages stay private even from admins

Following on from 20260718060000_fix_conversations_privacy_leak.sql: that
migration correctly restricted conversations/messages read access to
is_admin_user(), fixing the leak where any authenticated user could read
anyone's conversations. But by design, admins could still read every
conversation, including one-to-one direct messages between two members.

Per decision: direct messages should be fully private — visible only to
the two participants, never to admins. Admin visibility remains for
"official" channel types only: 'team', 'executive', 'broadcast'.
('direct' is excluded from admin visibility; the conversations table's
CHECK constraint only allows 'direct','team','executive','broadcast'.)

Only SELECT (read) is changed here — admin write actions (e.g. deleting a
reported message) are a separate concern and untouched by this migration.
*/

DROP POLICY IF EXISTS "admin_select_conversations" ON conversations;
CREATE POLICY "admin_select_conversations" ON conversations
  FOR SELECT TO authenticated USING (
    is_admin_user() AND conversation_type <> 'direct'
  );

DROP POLICY IF EXISTS "admin_select_messages" ON messages;
CREATE POLICY "admin_select_messages" ON messages
  FOR SELECT TO authenticated USING (
    is_admin_user() AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND c.conversation_type <> 'direct'
    )
  );
