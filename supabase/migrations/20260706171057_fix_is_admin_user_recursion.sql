-- Fix: is_admin_user() must be SECURITY DEFINER to bypass RLS on user_roles.
-- When SECURITY INVOKER, it causes infinite recursion because the RLS policy
-- on user_roles calls is_admin_user() which queries user_roles.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.slug IN ('super_admin', 'faculty_advisor', 'president', 'vice_president', 'secretary', 'executive')
  );
$$;
