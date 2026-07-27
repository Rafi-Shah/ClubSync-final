-- Members need to see each other's basic info (full_name, email, avatar, etc.)
-- for the member directory / "New Chat" picker and for showing the other
-- participant's name in direct conversations. The existing members_read_own
-- policy only allows reading your own row, so getAllMembers() and the
-- other-participant name lookup in Chat.tsx both silently returned nothing
-- for non-admin members.

CREATE POLICY "members_read_directory" ON members
  FOR SELECT TO authenticated
  USING (status = 'active');