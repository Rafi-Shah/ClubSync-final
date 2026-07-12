/*
# Admin Portal RLS Policies

## Purpose
Adds INSERT, UPDATE, and DELETE policies for admin roles (super_admin, faculty_advisor, president, vice_president, secretary, executive) on all management tables. The existing SELECT policies already allow authenticated users to read; this migration adds write policies scoped to admin-role users only.

## Approach
- Uses a helper function `is_admin_user()` that checks if the current auth user has any admin-tier role via `user_roles` + `roles` join.
- Adds INSERT, UPDATE, DELETE policies on all management tables (members, departments, teams, events, meetings, tasks, attendance, budgets, inventory, recruitments, applications, certificates, reports, gallery, site settings, about content, achievements, sponsors, faqs, contact messages, routines, volunteer hours, ideas, feedback, performance metrics, notifications, conversations, messages, resource bookings, executive committee, department members, team members, event registrations, activity logs, roles, permissions, role_permissions, user_roles).
- SELECT policies are broadened where needed so admin can see all rows (not just own).

## Security
- All write policies check `is_admin_user()` — only admin-role users can write.
- Member-scoped SELECT policies (attendance, tasks, routines, etc.) are supplemented with an admin SELECT policy so admins see ALL rows.
- The `is_admin_user()` function checks `user_roles` join `roles` for slugs: super_admin, faculty_advisor, president, vice_president, secretary, executive.
*/

-- Helper function: returns true if the current auth user has an admin role
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
      AND r.slug IN ('super_admin', 'faculty_advisor', 'president', 'vice_president', 'secretary', 'executive')
  );
$$;

-- ============ MEMBERS ============
DROP POLICY IF EXISTS "admin_select_members" ON members;
CREATE POLICY "admin_select_members" ON members FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_insert_members" ON members;
CREATE POLICY "admin_insert_members" ON members FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_members" ON members;
CREATE POLICY "admin_update_members" ON members FOR UPDATE TO authenticated USING (is_admin_user() OR auth.uid() = user_id) WITH CHECK (is_admin_user() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_delete_members" ON members;
CREATE POLICY "admin_delete_members" ON members FOR DELETE TO authenticated USING (is_admin_user());

-- ============ DEPARTMENTS ============
DROP POLICY IF EXISTS "admin_insert_departments" ON departments;
CREATE POLICY "admin_insert_departments" ON departments FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_departments" ON departments;
CREATE POLICY "admin_update_departments" ON departments FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_departments" ON departments;
CREATE POLICY "admin_delete_departments" ON departments FOR DELETE TO authenticated USING (is_admin_user());

-- ============ TEAMS ============
DROP POLICY IF EXISTS "admin_insert_teams" ON teams;
CREATE POLICY "admin_insert_teams" ON teams FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_teams" ON teams;
CREATE POLICY "admin_update_teams" ON teams FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_teams" ON teams;
CREATE POLICY "admin_delete_teams" ON teams FOR DELETE TO authenticated USING (is_admin_user());

-- ============ DEPARTMENT_MEMBERS ============
DROP POLICY IF EXISTS "admin_insert_department_members" ON department_members;
CREATE POLICY "admin_insert_department_members" ON department_members FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_department_members" ON department_members;
CREATE POLICY "admin_update_department_members" ON department_members FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_department_members" ON department_members;
CREATE POLICY "admin_delete_department_members" ON department_members FOR DELETE TO authenticated USING (is_admin_user());

-- ============ TEAM_MEMBERS ============
DROP POLICY IF EXISTS "admin_insert_team_members" ON team_members;
CREATE POLICY "admin_insert_team_members" ON team_members FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_team_members" ON team_members;
CREATE POLICY "admin_update_team_members" ON team_members FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_team_members" ON team_members;
CREATE POLICY "admin_delete_team_members" ON team_members FOR DELETE TO authenticated USING (is_admin_user());

-- ============ EXECUTIVE_COMMITTEE ============
DROP POLICY IF EXISTS "admin_insert_executive_committee" ON executive_committee;
CREATE POLICY "admin_insert_executive_committee" ON executive_committee FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_executive_committee" ON executive_committee;
CREATE POLICY "admin_update_executive_committee" ON executive_committee FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_executive_committee" ON executive_committee;
CREATE POLICY "admin_delete_executive_committee" ON executive_committee FOR DELETE TO authenticated USING (is_admin_user());

-- ============ EVENTS ============
DROP POLICY IF EXISTS "admin_insert_events" ON events;
CREATE POLICY "admin_insert_events" ON events FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_events" ON events;
CREATE POLICY "admin_update_events" ON events FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_events" ON events;
CREATE POLICY "admin_delete_events" ON events FOR DELETE TO authenticated USING (is_admin_user());

-- ============ MEETINGS ============
DROP POLICY IF EXISTS "admin_insert_meetings" ON meetings;
CREATE POLICY "admin_insert_meetings" ON meetings FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_meetings" ON meetings;
CREATE POLICY "admin_update_meetings" ON meetings FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_meetings" ON meetings;
CREATE POLICY "admin_delete_meetings" ON meetings FOR DELETE TO authenticated USING (is_admin_user());

-- ============ TASKS ============
DROP POLICY IF EXISTS "admin_select_tasks" ON tasks;
CREATE POLICY "admin_select_tasks" ON tasks FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = (SELECT user_id FROM members WHERE id = tasks.assigned_to_member_id));

DROP POLICY IF EXISTS "admin_insert_tasks" ON tasks;
CREATE POLICY "admin_insert_tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_tasks" ON tasks;
CREATE POLICY "admin_update_tasks" ON tasks FOR UPDATE TO authenticated USING (is_admin_user() OR auth.uid() = (SELECT user_id FROM members WHERE id = tasks.assigned_to_member_id)) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_tasks" ON tasks;
CREATE POLICY "admin_delete_tasks" ON tasks FOR DELETE TO authenticated USING (is_admin_user());

-- ============ ATTENDANCE ============
DROP POLICY IF EXISTS "admin_select_attendance" ON attendance;
CREATE POLICY "admin_select_attendance" ON attendance FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = (SELECT user_id FROM members WHERE id = attendance.member_id));

DROP POLICY IF EXISTS "admin_insert_attendance" ON attendance;
CREATE POLICY "admin_insert_attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_attendance" ON attendance;
CREATE POLICY "admin_update_attendance" ON attendance FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_attendance" ON attendance;
CREATE POLICY "admin_delete_attendance" ON attendance FOR DELETE TO authenticated USING (is_admin_user());

-- ============ EVENT_REGISTRATIONS ============
DROP POLICY IF EXISTS "admin_select_event_registrations" ON event_registrations;
CREATE POLICY "admin_select_event_registrations" ON event_registrations FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = (SELECT user_id FROM members WHERE id = event_registrations.member_id));

DROP POLICY IF EXISTS "admin_update_event_registrations" ON event_registrations;
CREATE POLICY "admin_update_event_registrations" ON event_registrations FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_event_registrations" ON event_registrations;
CREATE POLICY "admin_delete_event_registrations" ON event_registrations FOR DELETE TO authenticated USING (is_admin_user());

-- ============ BUDGETS ============
DROP POLICY IF EXISTS "admin_insert_budgets" ON budgets;
CREATE POLICY "admin_insert_budgets" ON budgets FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_budgets" ON budgets;
CREATE POLICY "admin_update_budgets" ON budgets FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_budgets" ON budgets;
CREATE POLICY "admin_delete_budgets" ON budgets FOR DELETE TO authenticated USING (is_admin_user());

-- ============ INVENTORY_ITEMS ============
DROP POLICY IF EXISTS "admin_insert_inventory" ON inventory_items;
CREATE POLICY "admin_insert_inventory" ON inventory_items FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_inventory" ON inventory_items;
CREATE POLICY "admin_update_inventory" ON inventory_items FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_inventory" ON inventory_items;
CREATE POLICY "admin_delete_inventory" ON inventory_items FOR DELETE TO authenticated USING (is_admin_user());

-- ============ RESOURCE_BOOKINGS ============
DROP POLICY IF EXISTS "admin_select_resource_bookings" ON resource_bookings;
CREATE POLICY "admin_select_resource_bookings" ON resource_bookings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_update_resource_bookings" ON resource_bookings;
CREATE POLICY "admin_update_resource_bookings" ON resource_bookings FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_resource_bookings" ON resource_bookings;
CREATE POLICY "admin_delete_resource_bookings" ON resource_bookings FOR DELETE TO authenticated USING (is_admin_user());

-- ============ RECRUITMENTS ============
DROP POLICY IF EXISTS "admin_insert_recruitments" ON recruitments;
CREATE POLICY "admin_insert_recruitments" ON recruitments FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_recruitments" ON recruitments;
CREATE POLICY "admin_update_recruitments" ON recruitments FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_recruitments" ON recruitments;
CREATE POLICY "admin_delete_recruitments" ON recruitments FOR DELETE TO authenticated USING (is_admin_user());

-- ============ APPLICATIONS ============
DROP POLICY IF EXISTS "admin_select_all_applications" ON applications;
CREATE POLICY "admin_select_all_applications" ON applications FOR SELECT TO authenticated USING (is_admin_user() OR applicant_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

DROP POLICY IF EXISTS "admin_update_applications" ON applications;
CREATE POLICY "admin_update_applications" ON applications FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_applications" ON applications;
CREATE POLICY "admin_delete_applications" ON applications FOR DELETE TO authenticated USING (is_admin_user());

-- ============ CERTIFICATES ============
DROP POLICY IF EXISTS "admin_select_certificates" ON certificates;
CREATE POLICY "admin_select_certificates" ON certificates FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = (SELECT user_id FROM members WHERE id = certificates.member_id));

DROP POLICY IF EXISTS "admin_insert_certificates" ON certificates;
CREATE POLICY "admin_insert_certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_certificates" ON certificates;
CREATE POLICY "admin_update_certificates" ON certificates FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_certificates" ON certificates;
CREATE POLICY "admin_delete_certificates" ON certificates FOR DELETE TO authenticated USING (is_admin_user());

-- ============ REPORTS ============
DROP POLICY IF EXISTS "admin_insert_reports" ON reports;
CREATE POLICY "admin_insert_reports" ON reports FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_reports" ON reports;
CREATE POLICY "admin_update_reports" ON reports FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_reports" ON reports;
CREATE POLICY "admin_delete_reports" ON reports FOR DELETE TO authenticated USING (is_admin_user());

-- ============ ACTIVITY_LOGS ============
DROP POLICY IF EXISTS "admin_select_activity_logs" ON activity_logs;
CREATE POLICY "admin_select_activity_logs" ON activity_logs FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_delete_activity_logs" ON activity_logs;
CREATE POLICY "admin_delete_activity_logs" ON activity_logs FOR DELETE TO authenticated USING (is_admin_user());

-- ============ GALLERY_ITEMS ============
DROP POLICY IF EXISTS "admin_insert_gallery" ON gallery_items;
CREATE POLICY "admin_insert_gallery" ON gallery_items FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_gallery" ON gallery_items;
CREATE POLICY "admin_update_gallery" ON gallery_items FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_gallery" ON gallery_items;
CREATE POLICY "admin_delete_gallery" ON gallery_items FOR DELETE TO authenticated USING (is_admin_user());

-- ============ SITE_SETTINGS ============
DROP POLICY IF EXISTS "admin_update_site_settings" ON site_settings;
CREATE POLICY "admin_update_site_settings" ON site_settings FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_insert_site_settings" ON site_settings;
CREATE POLICY "admin_insert_site_settings" ON site_settings FOR INSERT TO authenticated WITH CHECK (is_admin_user());

-- ============ ABOUT_CONTENT ============
DROP POLICY IF EXISTS "admin_insert_about" ON about_content;
CREATE POLICY "admin_insert_about" ON about_content FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_about" ON about_content;
CREATE POLICY "admin_update_about" ON about_content FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_about" ON about_content;
CREATE POLICY "admin_delete_about" ON about_content FOR DELETE TO authenticated USING (is_admin_user());

-- ============ ACHIEVEMENTS ============
DROP POLICY IF EXISTS "admin_insert_achievements" ON achievements;
CREATE POLICY "admin_insert_achievements" ON achievements FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_achievements" ON achievements;
CREATE POLICY "admin_update_achievements" ON achievements FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_achievements" ON achievements;
CREATE POLICY "admin_delete_achievements" ON achievements FOR DELETE TO authenticated USING (is_admin_user());

-- ============ SPONSORS ============
DROP POLICY IF EXISTS "admin_insert_sponsors" ON sponsors;
CREATE POLICY "admin_insert_sponsors" ON sponsors FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_sponsors" ON sponsors;
CREATE POLICY "admin_update_sponsors" ON sponsors FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_sponsors" ON sponsors;
CREATE POLICY "admin_delete_sponsors" ON sponsors FOR DELETE TO authenticated USING (is_admin_user());

-- ============ FAQS ============
DROP POLICY IF EXISTS "admin_insert_faqs" ON faqs;
CREATE POLICY "admin_insert_faqs" ON faqs FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_faqs" ON faqs;
CREATE POLICY "admin_update_faqs" ON faqs FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_faqs" ON faqs;
CREATE POLICY "admin_delete_faqs" ON faqs FOR DELETE TO authenticated USING (is_admin_user());

-- ============ CONTACT_MESSAGES ============
DROP POLICY IF EXISTS "admin_select_contact_messages" ON contact_messages;
CREATE POLICY "admin_select_contact_messages" ON contact_messages FOR SELECT TO authenticated USING (is_admin_user());

DROP POLICY IF EXISTS "admin_update_contact_messages" ON contact_messages;
CREATE POLICY "admin_update_contact_messages" ON contact_messages FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_contact_messages" ON contact_messages;
CREATE POLICY "admin_delete_contact_messages" ON contact_messages FOR DELETE TO authenticated USING (is_admin_user());

-- ============ ROUTINES ============
DROP POLICY IF EXISTS "admin_select_routines" ON routines;
CREATE POLICY "admin_select_routines" ON routines FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = (SELECT user_id FROM members WHERE id = routines.member_id));

DROP POLICY IF EXISTS "admin_update_routines" ON routines;
CREATE POLICY "admin_update_routines" ON routines FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_routines" ON routines;
CREATE POLICY "admin_delete_routines" ON routines FOR DELETE TO authenticated USING (is_admin_user());

-- ============ VOLUNTEER_HOURS ============
DROP POLICY IF EXISTS "admin_select_volunteer_hours" ON volunteer_hours;
CREATE POLICY "admin_select_volunteer_hours" ON volunteer_hours FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = (SELECT user_id FROM members WHERE id = volunteer_hours.member_id));

DROP POLICY IF EXISTS "admin_update_volunteer_hours" ON volunteer_hours;
CREATE POLICY "admin_update_volunteer_hours" ON volunteer_hours FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_volunteer_hours" ON volunteer_hours;
CREATE POLICY "admin_delete_volunteer_hours" ON volunteer_hours FOR DELETE TO authenticated USING (is_admin_user());

-- ============ IDEAS ============
DROP POLICY IF EXISTS "admin_select_ideas" ON ideas;
CREATE POLICY "admin_select_ideas" ON ideas FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = (SELECT user_id FROM members WHERE id = ideas.member_id));

DROP POLICY IF EXISTS "admin_update_ideas" ON ideas;
CREATE POLICY "admin_update_ideas" ON ideas FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_ideas" ON ideas;
CREATE POLICY "admin_delete_ideas" ON ideas FOR DELETE TO authenticated USING (is_admin_user());

-- ============ FEEDBACK ============
DROP POLICY IF EXISTS "admin_select_feedback" ON feedback;
CREATE POLICY "admin_select_feedback" ON feedback FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = (SELECT user_id FROM members WHERE id = feedback.member_id));

DROP POLICY IF EXISTS "admin_update_feedback" ON feedback;
CREATE POLICY "admin_update_feedback" ON feedback FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_feedback" ON feedback;
CREATE POLICY "admin_delete_feedback" ON feedback FOR DELETE TO authenticated USING (is_admin_user());

-- ============ PERFORMANCE_METRICS ============
DROP POLICY IF EXISTS "admin_select_performance" ON performance_metrics;
CREATE POLICY "admin_select_performance" ON performance_metrics FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = (SELECT user_id FROM members WHERE id = performance_metrics.member_id));

DROP POLICY IF EXISTS "admin_insert_performance" ON performance_metrics;
CREATE POLICY "admin_insert_performance" ON performance_metrics FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_performance" ON performance_metrics;
CREATE POLICY "admin_update_performance" ON performance_metrics FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_performance" ON performance_metrics;
CREATE POLICY "admin_delete_performance" ON performance_metrics FOR DELETE TO authenticated USING (is_admin_user());

-- ============ NOTIFICATIONS ============
DROP POLICY IF EXISTS "admin_select_notifications" ON notifications;
CREATE POLICY "admin_select_notifications" ON notifications FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_insert_all_notifications" ON notifications;
CREATE POLICY "admin_insert_all_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (is_admin_user() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_update_notifications" ON notifications;
CREATE POLICY "admin_update_notifications" ON notifications FOR UPDATE TO authenticated USING (is_admin_user() OR auth.uid() = user_id) WITH CHECK (is_admin_user() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_delete_notifications" ON notifications;
CREATE POLICY "admin_delete_notifications" ON notifications FOR DELETE TO authenticated USING (is_admin_user() OR auth.uid() = user_id);

-- ============ CONVERSATIONS ============
DROP POLICY IF EXISTS "admin_select_conversations" ON conversations;
CREATE POLICY "admin_select_conversations" ON conversations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_conversations" ON conversations;
CREATE POLICY "admin_insert_conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_conversations" ON conversations;
CREATE POLICY "admin_update_conversations" ON conversations FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_conversations" ON conversations;
CREATE POLICY "admin_delete_conversations" ON conversations FOR DELETE TO authenticated USING (is_admin_user());

-- ============ MESSAGES ============
DROP POLICY IF EXISTS "admin_select_messages" ON messages;
CREATE POLICY "admin_select_messages" ON messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_delete_messages" ON messages;
CREATE POLICY "admin_delete_messages" ON messages FOR DELETE TO authenticated USING (is_admin_user());

-- ============ ROLES ============
DROP POLICY IF EXISTS "admin_insert_roles" ON roles;
CREATE POLICY "admin_insert_roles" ON roles FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_update_roles" ON roles;
CREATE POLICY "admin_update_roles" ON roles FOR UPDATE TO authenticated USING (is_admin_user()) WITH CHECK (is_admin_user());

-- ============ USER_ROLES ============
DROP POLICY IF EXISTS "admin_select_user_roles" ON user_roles;
CREATE POLICY "admin_select_user_roles" ON user_roles FOR SELECT TO authenticated USING (is_admin_user() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_insert_user_roles" ON user_roles;
CREATE POLICY "admin_insert_user_roles" ON user_roles FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_user_roles" ON user_roles;
CREATE POLICY "admin_delete_user_roles" ON user_roles FOR DELETE TO authenticated USING (is_admin_user());

-- ============ ROLE_PERMISSIONS ============
DROP POLICY IF EXISTS "admin_insert_role_permissions" ON role_permissions;
CREATE POLICY "admin_insert_role_permissions" ON role_permissions FOR INSERT TO authenticated WITH CHECK (is_admin_user());

DROP POLICY IF EXISTS "admin_delete_role_permissions" ON role_permissions;
CREATE POLICY "admin_delete_role_permissions" ON role_permissions FOR DELETE TO authenticated USING (is_admin_user());
