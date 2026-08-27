/*
# Admin RLS Policies for Developer Team

Allows admins to manage the developer_team table.
*/

-- Admin full access
DROP POLICY IF EXISTS "admin_insert_developers" ON developer_team;
CREATE POLICY "admin_insert_developers" ON developer_team 
  FOR INSERT TO authenticated WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "admin_update_developers" ON developer_team;
CREATE POLICY "admin_update_developers" ON developer_team 
  FOR UPDATE TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "admin_delete_developers" ON developer_team;
CREATE POLICY "admin_delete_developers" ON developer_team 
  FOR DELETE TO authenticated USING (public.is_admin_user());

DROP POLICY IF EXISTS "admin_select_developers" ON developer_team;
CREATE POLICY "admin_select_developers" ON developer_team 
  FOR SELECT TO authenticated USING (public.is_admin_user());
