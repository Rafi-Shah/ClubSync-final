-- Adds a sort_order column so roles display in a meaningful hierarchy
-- instead of creation-order (id), and backfills it for existing roles.

ALTER TABLE roles ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 999;

UPDATE roles SET sort_order = 10 WHERE slug = 'super_admin';
UPDATE roles SET sort_order = 20 WHERE slug = 'faculty_advisor';
UPDATE roles SET sort_order = 30 WHERE slug = 'president';
UPDATE roles SET sort_order = 40 WHERE slug = 'vice_president';
UPDATE roles SET sort_order = 50 WHERE slug = 'secretary';
UPDATE roles SET sort_order = 60 WHERE slug = 'treasurer';
UPDATE roles SET sort_order = 70 WHERE slug = 'executive';
UPDATE roles SET sort_order = 80 WHERE slug = 'member';

-- Future roles: insert between two existing ones using a value between
-- their sort_order (e.g. between Secretary=50 and Treasurer=60, use 55).
-- Roles without a specified sort_order default to 999 (land at the end).