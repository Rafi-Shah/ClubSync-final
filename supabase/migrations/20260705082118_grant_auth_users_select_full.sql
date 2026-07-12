-- Grant full SELECT on auth.users to authenticated role so PostgREST can
-- resolve foreign key relations. RLS on auth.users controls row visibility.
GRANT SELECT ON auth.users TO authenticated;
