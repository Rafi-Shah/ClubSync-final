/*
# RBAC Core — Roles, Permissions, Users

1. Purpose
   Establishes the Role Based Access Control foundation shared by all three
   interfaces (Public Website, Member Portal, Admin Portal). All three portals
   authenticate against this single set of tables.

2. New Tables
   - `roles`              : Named roles (super_admin, faculty_advisor, president,
                           vice_president, secretary, executive, member).
   - `permissions`        : Granular permissions (e.g. users.manage, events.create).
   - `role_permissions`   : Many-to-many between roles and permissions.
   - `user_roles`         : Many-to-many between users (auth.users) and roles.
   - `members`            : Club member profile, linked 1:1 to an auth user.

3. Relationships
   - `user_roles.user_id`  -> auth.users(id) ON DELETE CASCADE
   - `user_roles.role_id`  -> roles(id)       ON DELETE CASCADE
   - `role_permissions.role_id`       -> roles(id)       ON DELETE CASCADE
   - `role_permissions.permission_id` -> permissions(id)  ON DELETE CASCADE
   - `members.user_id`     -> auth.users(id) ON DELETE CASCADE

4. Security (RLS)
   - roles, permissions, role_permissions: readable by authenticated users
     (needed for authorization checks); writable only by service role (no
     anon/authenticated INSERT/UPDATE/DELETE policy — stays locked).
   - user_roles: a user may read their own role assignments; assignment writes
     are admin-only (locked here, managed via service role / admin edge flow).
   - members: owner may read/update own profile; admins read all via service role.

5. Notes
   - auth.users is the Supabase-provided identity table. We do NOT create it.
   - Password hashing + session management are handled by Supabase Auth.
   - Email confirmation stays OFF per project convention.
*/

-- 1. Roles ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  description text,
  is_system   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_roles" ON roles;
CREATE POLICY "authenticated_read_roles" ON roles
  FOR SELECT TO authenticated USING (true);

-- 2. Permissions ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS permissions (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text NOT NULL UNIQUE,
  slug        text NOT NULL UNIQUE,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_permissions" ON permissions;
CREATE POLICY "authenticated_read_permissions" ON permissions
  FOR SELECT TO authenticated USING (true);

-- 3. Role <-> Permission -------------------------------------------------
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       bigint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id bigint NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "authenticated_read_role_permissions" ON role_permissions;
CREATE POLICY "authenticated_read_role_permissions" ON role_permissions
  FOR SELECT TO authenticated USING (true);

-- 4. Users <-> Roles -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id    bigint NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_read_own_roles" ON user_roles;
CREATE POLICY "users_read_own_roles" ON user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 5. Members (club profile, 1:1 with auth user) --------------------------
CREATE TABLE IF NOT EXISTS members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  member_code     text NOT NULL UNIQUE,
  full_name       text NOT NULL,
  email           text NOT NULL UNIQUE,
  phone           text,
  avatar_url      text,
  bio             text,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','suspended','alumni','removed')),
  joined_at       date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_read_own" ON members;
CREATE POLICY "members_read_own" ON members
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "members_update_own" ON members;
CREATE POLICY "members_update_own" ON members
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
