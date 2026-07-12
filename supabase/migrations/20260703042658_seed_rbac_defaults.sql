/*
# Seed Default Roles, Permissions, and Super Admin

1. Purpose
   Populates the RBAC foundation with the seven system roles defined in the
   spec, a baseline permission set, role-permission mappings, and a Super Admin
   auth user + member + role assignment. This makes the system immediately
   usable for first login.

2. Data Created
   - 7 roles: super_admin, faculty_advisor, president, vice_president,
     secretary, executive, member.
   - Baseline permissions (CRUD-style slugs) across modules.
   - role_permissions: super_admin gets ALL permissions; faculty_advisor and
     executive-tier roles get a broad management subset; member gets self-service
     permissions only.
   - A Super Admin auth user (email: admin@clubsync.local) with a member profile
     and the super_admin role.

3. Security
   - No schema changes. RLS write policies on roles/permissions/user_roles are
     intentionally absent (admin-only via service role), so this seed runs via
     the service-role migration context.

4. Notes
   - The super admin password is set via auth.users. The credentials are:
     Email: admin@clubsync.local  Password: ClubSync@Admin2026
     CHANGE THIS PASSWORD IMMEDIATELY on first login.
   - Idempotent: uses ON CONFLICT DO NOTHING so re-running is safe.
*/

-- 1. Roles ----------------------------------------------------------------
INSERT INTO roles (name, slug, description, is_system) VALUES
  ('Super Admin',      'super_admin',      'Full system access across all portals', true),
  ('Faculty Advisor',  'faculty_advisor',  'Faculty oversight of the club',          true),
  ('President',        'president',        'Club president',                         true),
  ('Vice President',   'vice_president',   'Club vice president',                    true),
  ('Secretary',        'secretary',        'Club secretary',                         true),
  ('Executive',        'executive',        'Executive committee member',            true),
  ('Member',           'member',           'General club member',                    true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Permissions ----------------------------------------------------------
INSERT INTO permissions (name, slug, description) VALUES
  ('Manage Users',          'users.manage',          'Create, update, suspend users'),
  ('View Users',            'users.view',            'View user/member lists'),
  ('Manage Members',        'members.manage',        'Manage member profiles and status'),
  ('View Members',          'members.view',          'View member directory'),
  ('Manage Departments',    'departments.manage',   'Create and edit departments'),
  ('View Departments',      'departments.view',     'View departments'),
  ('Manage Teams',          'teams.manage',         'Create and edit teams'),
  ('View Teams',            'teams.view',            'View teams'),
  ('Manage Executives',     'executives.manage',    'Assign executive committee positions'),
  ('View Executives',       'executives.view',      'View executive committee'),
  ('Manage Events',         'events.manage',        'Create, edit, delete events'),
  ('View Events',           'events.view',          'View events'),
  ('Manage Meetings',       'meetings.manage',      'Create, edit, delete meetings'),
  ('View Meetings',         'meetings.view',        'View meetings'),
  ('Manage Tasks',          'tasks.manage',         'Assign and update tasks'),
  ('View Tasks',            'tasks.view',           'View tasks'),
  ('Manage Attendance',     'attendance.manage',    'Record and edit attendance'),
  ('View Attendance',       'attendance.view',      'View attendance'),
  ('Manage Recruitment',    'recruitment.manage',   'Manage recruitment drives and applications'),
  ('View Recruitment',      'recruitment.view',     'View recruitment drives'),
  ('Manage Inventory',      'inventory.manage',     'Manage inventory items'),
  ('View Inventory',        'inventory.view',       'View inventory'),
  ('Manage Bookings',       'bookings.manage',      'Approve/reject resource bookings'),
  ('Create Bookings',       'bookings.create',      'Create own resource bookings'),
  ('Manage Budgets',        'budgets.manage',       'Manage income/expense entries'),
  ('View Budgets',          'budgets.view',         'View budgets'),
  ('Manage Reports',        'reports.manage',       'Generate and publish reports'),
  ('View Reports',          'reports.view',         'View reports'),
  ('Manage Certificates',   'certificates.manage',  'Issue certificates'),
  ('View Own Certificates', 'certificates.view_own','View own certificates'),
  ('Manage Roles',          'roles.manage',         'Assign roles and permissions'),
  ('View Activity Logs',    'logs.view',            'View activity logs'),
  ('Manage CMS',            'cms.manage',           'Manage public website content'),
  ('Send Broadcasts',       'broadcasts.send',      'Send broadcast messages'),
  ('Use AI Assistant',      'ai.use',               'Access the AI Club Assistant'),
  ('Access Admin Portal',   'portal.admin',         'Access the Admin Portal'),
  ('Access Member Portal',  'portal.member',        'Access the Member Portal')
ON CONFLICT (slug) DO NOTHING;

-- 3. Role <-> Permission mappings -----------------------------------------
-- Super Admin: ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'super_admin'
ON CONFLICT DO NOTHING;

-- Faculty Advisor: broad management minus role management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'faculty_advisor'
  AND p.slug NOT IN ('roles.manage')
ON CONFLICT DO NOTHING;

-- President: management across modules, admin portal
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'president'
  AND p.slug IN (
    'users.view','members.manage','members.view','departments.manage','departments.view',
    'teams.manage','teams.view','executives.view','events.manage','events.view',
    'meetings.manage','meetings.view','tasks.manage','tasks.view','attendance.manage',
    'attendance.view','recruitment.manage','recruitment.view','inventory.view',
    'bookings.manage','budgets.manage','budgets.view','reports.manage','reports.view',
    'certificates.manage','logs.view','cms.manage','broadcasts.send','ai.use',
    'portal.admin','portal.member'
  )
ON CONFLICT DO NOTHING;

-- Vice President: same as President minus role-sensitive items
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'vice_president'
  AND p.slug IN (
    'members.view','departments.view','teams.manage','teams.view','executives.view',
    'events.manage','events.view','meetings.manage','meetings.view','tasks.manage',
    'tasks.view','attendance.manage','attendance.view','recruitment.manage',
    'recruitment.view','inventory.view','bookings.manage','budgets.view','reports.view',
    'certificates.manage','broadcasts.send','ai.use','portal.admin','portal.member'
  )
ON CONFLICT DO NOTHING;

-- Secretary: records & communications focus
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'secretary'
  AND p.slug IN (
    'members.view','departments.view','teams.view','executives.view','events.view',
    'meetings.manage','meetings.view','tasks.manage','tasks.view','attendance.manage',
    'attendance.view','recruitment.view','inventory.view','bookings.manage',
    'reports.manage','reports.view','certificates.manage','broadcasts.send',
    'portal.admin','portal.member'
  )
ON CONFLICT DO NOTHING;

-- Executive: limited management, full member access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'executive'
  AND p.slug IN (
    'members.view','departments.view','teams.view','executives.view','events.view',
    'meetings.view','tasks.manage','tasks.view','attendance.view','recruitment.view',
    'inventory.view','bookings.create','reports.view','certificates.view_own',
    'portal.admin','portal.member'
  )
ON CONFLICT DO NOTHING;

-- Member: self-service only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.slug = 'member'
  AND p.slug IN (
    'members.view','departments.view','teams.view','executives.view','events.view',
    'meetings.view','tasks.view','attendance.view','bookings.create',
    'certificates.view_own','portal.member'
  )
ON CONFLICT DO NOTHING;

-- 4. Super Admin auth user + member + role assignment --------------------
-- Create the auth user if not exists. The encrypted password is set using
-- the crypt() function from pgcrypto (Supabase uses bcrypt by default for
-- auth.users; we use the standard Supabase-compatible bcrypt cost 10).
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@clubsync.local',
  crypt('ClubSync@Admin2026', gen_salt('bf', 10)),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Super Admin"}'::jsonb,
  false
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'admin@clubsync.local'
);

-- Member profile for the super admin
INSERT INTO members (user_id, member_code, full_name, email, status, joined_at)
SELECT u.id, 'CLUB-0001', 'Super Admin', u.email, 'active', CURRENT_DATE
FROM auth.users u
WHERE u.email = 'admin@clubsync.local'
  AND NOT EXISTS (
    SELECT 1 FROM members m WHERE m.user_id = u.id
  );

-- Assign super_admin role to the super admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM auth.users u, roles r
WHERE u.email = 'admin@clubsync.local'
  AND r.slug = 'super_admin'
ON CONFLICT DO NOTHING;
