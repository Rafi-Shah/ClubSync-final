ALTER TABLE members
ADD COLUMN IF NOT EXISTS student_id text,
ADD COLUMN IF NOT EXISTS batch text,
ADD COLUMN IF NOT EXISTS facebook text,
ADD COLUMN IF NOT EXISTS github text,
ADD COLUMN IF NOT EXISTS linkedin text,
ADD COLUMN IF NOT EXISTS gmail text;

DROP VIEW IF EXISTS public_member_profiles;

CREATE OR REPLACE VIEW public_member_profiles AS
SELECT id, full_name, avatar_url, bio, student_id, batch, facebook, github, linkedin, gmail
FROM members;

GRANT SELECT ON public_member_profiles TO anon, authenticated;
