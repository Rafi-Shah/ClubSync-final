/*
# Fix infinite recursion between conversations and conversation_participants RLS

1. Root cause
   The earlier CRUD-fix migration (20260711090000) added INSERT/DELETE
   policies on conversation_participants that check
   "conversations.created_by_member_id = <me>" via a subquery directly
   against the conversations table. But conversations' own SELECT policy
   ("participants_read_conversations") checks conversation_participants
   right back. Any query against conversations from inside another table's
   policy still goes through conversations' RLS, and vice versa — so the
   two policies call each other forever:

     insert into conversation_participants
       -> policy reads conversations
         -> conversations policy reads conversation_participants
           -> policy reads conversations
             -> ... (infinite recursion)

   This is exactly the same class of problem is_admin_user() was already
   fixed for (see 20260706171057_fix_is_admin_user_recursion.sql) — solved
   the same way here: a SECURITY DEFINER helper function bypasses RLS for
   its internal query, breaking the cycle.

2. Fix
   - Add is_conversation_creator(uuid), SECURITY DEFINER, so checking who
     created a conversation never re-triggers conversations' own RLS.
   - Point conversation_participants' insert/delete policies at this
     function instead of an inline subquery on conversations.

3. Side effect this explains
   Because the participant insert was silently failing every time (wrapped
   in a transaction that aborted on the recursion error), a newly created
   conversation never actually got its participant rows. Sending a message
   right after then failed RLS too ("new row violates row-level security
   policy for table messages"), because the sender was never a real
   participant of that conversation to begin with. Fixing the recursion
   here fixes both errors — the messages failure was a downstream
   consequence, not a separate bug.
*/

CREATE OR REPLACE FUNCTION public.is_conversation_creator(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = _conversation_id
      AND c.created_by_member_id = (SELECT id FROM members WHERE user_id = auth.uid())
  );
$$;

DROP POLICY IF EXISTS "members_insert_participants" ON conversation_participants;
CREATE POLICY "members_insert_participants" ON conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    is_admin_user()
    OR member_id = (SELECT id FROM members WHERE user_id = auth.uid())
    OR is_conversation_creator(conversation_id)
  );

DROP POLICY IF EXISTS "members_delete_participants" ON conversation_participants;
CREATE POLICY "members_delete_participants" ON conversation_participants
  FOR DELETE TO authenticated
  USING (
    is_admin_user()
    OR member_id = (SELECT id FROM members WHERE user_id = auth.uid())
    OR is_conversation_creator(conversation_id)
  );
