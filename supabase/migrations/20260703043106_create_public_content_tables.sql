/*
# Public Website Content Tables

1. Purpose
   Stores content rendered on the Public Website (no login required). These
   tables are read by the public frontend and written by the Admin Portal CMS
   later. All readable by anon + authenticated (intentionally public).

2. New Tables
   - `site_settings`        : Single-row club identity (name, tagline, logo, contact).
   - `about_content`        : About-Club page blocks (mission, vision, history).
   - `gallery_items`        : Gallery images with category + caption.
   - `achievements`         : Club awards/milestones.
   - `sponsors`            : Sponsor logos + links, tiered.
   - `faqs`                : FAQ question/answer pairs, ordered.
   - `contact_messages`     : Submissions from the public Contact form.

3. Relationships
   - None external; self-contained public content.

4. Security (RLS)
   - site_settings, about_content, gallery_items, achievements, sponsors, faqs:
     SELECT open to anon + authenticated (public website). No write policies
     (admin-only via service role).
   - contact_messages: anon + authenticated may INSERT (public form); no SELECT
     for anon/authenticated (only service role reads submissions).

5. Notes
   - site_settings enforced single-row via a CHECK on a fixed id.
   - Ordered tables use a `sort_order` integer.
*/

CREATE TABLE IF NOT EXISTS site_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_name   text NOT NULL DEFAULT 'ClubSync',
  tagline     text,
  description text,
  logo_url    text,
  contact_email text,
  contact_phone text,
  address     text,
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = '00000000-0000-0000-0000-000000000001')
);
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_site_settings" ON site_settings;
CREATE POLICY "public_read_site_settings" ON site_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS about_content (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_key   text NOT NULL UNIQUE,
  title       text NOT NULL,
  body        text,
  image_url   text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_about_content" ON about_content;
CREATE POLICY "public_read_about_content" ON about_content
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS gallery_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text,
  image_url   text NOT NULL,
  category    text NOT NULL DEFAULT 'general',
  description text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery_items(category);
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_gallery" ON gallery_items;
CREATE POLICY "public_read_gallery" ON gallery_items
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS achievements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  award_date  date,
  image_url   text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_achievements_date ON achievements(award_date DESC);
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_achievements" ON achievements;
CREATE POLICY "public_read_achievements" ON achievements
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS sponsors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  logo_url    text,
  website_url text,
  tier        text NOT NULL DEFAULT 'bronze'
                CHECK (tier IN ('platinum','gold','silver','bronze')),
  description text,
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sponsors_tier ON sponsors(tier);
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_sponsors" ON sponsors;
CREATE POLICY "public_read_sponsors" ON sponsors
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS faqs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question    text NOT NULL,
  answer      text NOT NULL,
  category    text NOT NULL DEFAULT 'general',
  sort_order  integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_faqs" ON faqs;
CREATE POLICY "public_read_faqs" ON faqs
  FOR SELECT TO anon, authenticated USING (is_published = true);

CREATE TABLE IF NOT EXISTS contact_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  subject     text NOT NULL,
  message     text NOT NULL,
  is_read     boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_messages(created_at DESC);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_submit_contact" ON contact_messages;
CREATE POLICY "public_submit_contact" ON contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);
