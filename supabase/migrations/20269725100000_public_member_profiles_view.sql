-- The public Committee page needs each executive's name, avatar, and bio —
-- but the members table also holds email/phone/etc, and anon has no SELECT
-- access on it (correctly, since that data shouldn't be public). Granting
-- anon direct SELECT on members would expose everything, not just these
-- three fields.
--
-- This view is owned by the migration-running role (postgres), which is the
-- members table's owner and therefore bypasses its RLS — so the view itself
-- can freely read all rows, while only ever re-exposing the three columns
-- listed below. Only those three columns are ever visible through it.

CREATE OR REPLACE VIEW public_member_profiles AS
SELECT id, full_name, avatar_url, bio
FROM members;

GRANT SELECT ON public_member_profiles TO anon, authenticated;
