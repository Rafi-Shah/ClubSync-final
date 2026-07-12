/*
# Communication Center — RLS Policies

1. Purpose
   Adds the row-level security policies for the communication tables created in
   the previous migration. Split out because the conversations SELECT policy
   references conversation_participants, which had to exist first.

2. Policies
   - conversations: participants can read.
   - conversation_participants: a member reads their own participations.
   - messages: participants read; participants insert (sender must be participant).
   - message_read_receipts: member reads/inserts own receipts.
   - notifications: user reads/updates/inserts own rows.
*/

DROP POLICY IF EXISTS "participants_read_conversations" ON conversations;
CREATE POLICY "participants_read_conversations" ON conversations
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversations.id
        AND cp.member_id = (SELECT id FROM members WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "members_read_own_participations" ON conversation_participants;
CREATE POLICY "members_read_own_participations" ON conversation_participants
  FOR SELECT TO authenticated USING (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));

DROP POLICY IF EXISTS "participants_read_messages" ON messages;
CREATE POLICY "participants_read_messages" ON messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.member_id = (SELECT id FROM members WHERE user_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "participants_send_messages" ON messages;
CREATE POLICY "participants_send_messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = (SELECT user_id FROM members WHERE id = sender_member_id)
    AND EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id
        AND cp.member_id = sender_member_id
    )
  );

DROP POLICY IF EXISTS "members_read_own_receipts" ON message_read_receipts;
CREATE POLICY "members_read_own_receipts" ON message_read_receipts
  FOR SELECT TO authenticated USING (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));
DROP POLICY IF EXISTS "members_insert_own_receipts" ON message_read_receipts;
CREATE POLICY "members_insert_own_receipts" ON message_read_receipts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = (
    SELECT user_id FROM members WHERE id = member_id
  ));

DROP POLICY IF EXISTS "users_read_own_notifications" ON notifications;
CREATE POLICY "users_read_own_notifications" ON notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "users_insert_own_notifications" ON notifications;
CREATE POLICY "users_insert_own_notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
