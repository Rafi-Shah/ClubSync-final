-- Grant SELECT on auth.users to authenticated role so PostgREST can resolve
-- foreign key relations (members.user_id -> auth.users.id) without 403 errors.
-- Only the id column is exposed; RLS on auth.users still controls which rows
-- are visible.
GRANT SELECT (id) ON auth.users TO authenticated;
