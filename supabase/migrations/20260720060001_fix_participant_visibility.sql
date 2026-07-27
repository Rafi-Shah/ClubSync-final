/*
# Let a participant see who ELSE is in their own conversation

1. Root cause
   "members_read_own_participations" only allows reading the row where
   member_id = the current user's own member id:

     USING (auth.uid() = (SELECT user_id FROM members WHERE id = member_id))

   That's correct for "can I see that I'm in this conversation", but it
   also silently blocks seeing the OTHER participant's row in the very
   same conversation — RLS filters that row out entirely. So a query like
   "who else is in conversation X" (used to resolve the display name for
   a direct chat) only ever gets back the current user's own row, never
   finds "someone else", and falls back to the generic "Direct Message"
   label every time.

2. Fix
   Broaden the SELECT policy so a user can also see any participant row
   belonging to a conversation they are themselves a participant of. This
   is done via a SECURITY DEFINER helper (is_my_conversation), NOT an
   inline subquery back on conversation_participants — an inline subquery
   here would cause the same infinite-recursion problem already fixed
   once before (a table's RLS policy querying itself recurses forever).
*/

CREATE OR REPLACE FUNCTION public.is_my_conversation(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = _conversation_id
      AND cp.member_id = (SELECT id FROM members WHERE user_id = auth.uid())
  );
$$;

DROP POLICY IF EXISTS "members_read_own_participations" ON conversation_participants;
CREATE POLICY "members_read_own_participations" ON conversation_participants
  FOR SELECT TO authenticated USING (
    is_admin_user()
    OR member_id = (SELECT id FROM members WHERE user_id = auth.uid())
    OR is_my_conversation(conversation_id)
  );
