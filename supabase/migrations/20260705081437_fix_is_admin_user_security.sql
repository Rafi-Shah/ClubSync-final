-- Fix: is_admin_user() was SECURITY DEFINER which can cause issues
-- when called during auth flows. Switch to SECURITY INVOKER and
-- add a helper to avoid recursion.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.slug IN ('super_admin', 'faculty_advisor', 'president', 'vice_president', 'secretary', 'executive')
  );
$$;
