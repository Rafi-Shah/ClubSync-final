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

-- Insert initial data
INSERT INTO developer_team (name, role, photo, facebook, github, gmail, linkedin, sort_order) VALUES
('Rafi Shah', 'Lead Developer', 'https://raw.githubusercontent.com/Rafi-Shah/ClubSync-final/main/docs/screenshots/IMG_6161.JPG', 'https://www.facebook.com/rafi.shah168', 'https://github.com/Rafi-Shah', 'mailto:rafishah7774440@gmail.com', 'https://www.linkedin.com/in/rafi-shah-95683a389', 1),
('Meherin Afrin Muna', 'Frontend Designer', 'https://raw.githubusercontent.com/Rafi-Shah/ClubSync-final/main/docs/screenshots/1000097000.jpg', 'https://www.facebook.com/meherin.muna.2910', 'https://github.com/Meherin-Afrin-Muna', 'mailto:meherinmuna29@gmail.com', 'https://www.linkedin.com/in/meherin-afrin-muna-79167a371', 2),
('Akhi Akter', 'Data Entry', 'https://raw.githubusercontent.com/Rafi-Shah/ClubSync-final/main/docs/screenshots/akhi.jpeg', 'https://www.facebook.com/aakhiakter0725', 'https://github.com/Akhi2425473', 'mailto:akhi199909@gmail.com', 'https://www.linkedin.com/in/akhi-akter-8812743b2/', 3)
ON CONFLICT DO NOTHING;
