/*
# Developer Team Table

1. Purpose
   Stores information about the developers of ClubSync to be displayed on the Contact page.

2. New Tables
   - `developer_team`
*/

CREATE TABLE IF NOT EXISTS developer_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  photo text,
  facebook text,
  github text,
  gmail text,
  linkedin text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE developer_team ENABLE ROW LEVEL SECURITY;

-- Public can read active developers
DROP POLICY IF EXISTS "public_read_developers" ON developer_team;
CREATE POLICY "public_read_developers" ON developer_team
  FOR SELECT TO anon, authenticated USING (is_active = true);


