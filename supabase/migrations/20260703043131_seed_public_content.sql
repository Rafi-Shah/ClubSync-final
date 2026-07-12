/*
# Seed Public Website Content

1. Purpose
   Populates site_settings, about_content, gallery_items, achievements,
   sponsors, and faqs with realistic demo content so the Public Website renders
   fully on first load.

2. Data Created
   - 1 site_settings row (club identity).
   - 4 about_content blocks (mission, vision, history, values).
   - 12 gallery_items across categories.
   - 6 achievements.
   - 6 sponsors across tiers.
   - 8 faqs.

3. Notes
   - Idempotent via ON CONFLICT DO NOTHING.
   - Image URLs use Pexels stock photos (per project convention).
*/

INSERT INTO site_settings (id, club_name, tagline, description, contact_email, contact_phone, address, social_links)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'ClubSync',
  'Where Passion Meets Purpose',
  'ClubSync is a premier university club dedicated to technology, innovation, and community. We empower students to build, lead, and grow together.',
  'contact@clubsync.edu',
  '+1 (555) 123-4567',
  '123 University Ave, Student Center Room 204, Boston, MA 02115',
  '{"twitter":"https://twitter.com/clubsync","instagram":"https://instagram.com/clubsync","linkedin":"https://linkedin.com/company/clubsync","facebook":"https://facebook.com/clubsync"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO about_content (block_key, title, body, image_url, sort_order) VALUES
  ('mission', 'Our Mission',
   'To foster a vibrant community of innovators where students collaborate on real-world projects, develop leadership skills, and create lasting impact through technology and teamwork.',
   'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800', 1),
  ('vision', 'Our Vision',
   'To be the most influential student-led organization on campus, recognized for producing tomorrow''s leaders, builders, and changemakers.',
   'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800', 2),
  ('history', 'Our History',
   'Founded in 2018 by a group of passionate students, ClubSync started as a small coding circle and has grown into a 200+ member organization with six departments, dozens of events, and a track record of award-winning projects.',
   'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=800', 3),
  ('values', 'Our Values',
   'We believe in collaboration over competition, learning over perfection, and community over individuality. Every member is valued, every voice is heard, and every contribution matters.',
   'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800', 4)
ON CONFLICT (block_key) DO NOTHING;

INSERT INTO gallery_items (title, image_url, category, description, sort_order) VALUES
  ('Hackathon 2025', 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800', 'events', 'Annual 48-hour hackathon', 1),
  ('Team Building', 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800', 'events', 'Fall retreat', 2),
  ('Workshop Session', 'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=800', 'workshops', 'React workshop', 3),
  ('Award Night', 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800', 'events', 'End of year gala', 4),
  ('Coding Bootcamp', 'https://images.pexels.com/photos/5439381/pexels-photo-5439381.jpeg?auto=compress&cs=tinysrgb&w=800', 'workshops', 'Summer bootcamp', 5),
  ('Community Service', 'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=800', 'community', 'Local outreach', 6),
  ('Tech Talk', 'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=800', 'events', 'Industry speaker', 7),
  ('Project Showcase', 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800', 'events', 'Final demos', 8),
  ('Networking Night', 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=800', 'community', 'Alumni mixer', 9),
  ('Design Sprint', 'https://images.pexels.com/photos/3184398/pexels-photo-3184398.jpeg?auto=compress&cs=tinysrgb&w=800', 'workshops', 'UI/UX sprint', 10),
  ('Graduation', 'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=800', 'community', 'Senior sendoff', 11),
  ('Innovation Fair', 'https://images.pexels.com/photos/260851/pexels-photo-260851.jpeg?auto=compress&cs=tinysrgb&w=800', 'events', 'Annual fair', 12)
ON CONFLICT DO NOTHING;

INSERT INTO achievements (title, description, award_date, image_url, sort_order) VALUES
  ('National Hackathon Champions', 'First place at the 2025 National Collegiate Hackathon with 200+ competing teams.', '2025-03-15', 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800', 1),
  ('Best Student Organization', 'Voted Best Student Organization by the university student body two years in a row.', '2024-12-01', 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=800', 2),
  ('Innovation Grant Recipient', 'Awarded a $25,000 innovation grant for developing a campus safety app.', '2024-09-20', 'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=800', 3),
  ('Community Impact Award', 'Recognized for 2,000+ volunteer hours in the local community.', '2024-06-10', 'https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=800', 4),
  ('Tech Conference Speakers', 'Three members selected to present at the Regional Tech Conference.', '2024-04-05', 'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=800', 5),
  ('500+ Members Milestone', 'Crossed 500 active members across all departments.', '2023-11-30', 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=800', 6)
ON CONFLICT DO NOTHING;

INSERT INTO sponsors (name, logo_url, website_url, tier, description, sort_order) VALUES
  ('TechCorp', 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://example.com/techcorp', 'platinum', 'Leading technology partner', 1),
  ('InnovateLabs', 'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://example.com/innovatelabs', 'gold', 'Innovation lab sponsor', 2),
  ('DataFlow', 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://example.com/dataflow', 'gold', 'Data infrastructure partner', 3),
  ('CloudNet', 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://example.com/cloudnet', 'silver', 'Cloud services provider', 4),
  ('DevHub', 'https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://example.com/devhub', 'silver', 'Developer community partner', 5),
  ('Local Cafe', 'https://images.pexels.com/photos/260851/pexels-photo-260851.jpeg?auto=compress&cs=tinysrgb&w=400', 'https://example.com/localcafe', 'bronze', 'Meeting space sponsor', 6)
ON CONFLICT DO NOTHING;

INSERT INTO faqs (question, answer, category, sort_order) VALUES
  ('How do I join ClubSync?', 'You can apply through our Recruitment page during open recruitment periods. We accept applications at the start of each semester.', 'membership', 1),
  ('What departments are available?', 'We have six departments: Technology, Marketing, Events, Design, Finance, and Community Outreach. You can indicate your preference on the application.', 'membership', 2),
  ('Do I need prior experience?', 'No prior experience is required for most departments. We provide training and mentorship for all new members.', 'membership', 3),
  ('Is there a membership fee?', 'No, membership is completely free. We are funded through university grants and sponsorships.', 'general', 4),
  ('How often does the club meet?', 'General meetings are held bi-weekly. Department and team meetings vary but typically occur weekly.', 'general', 5),
  ('Can I join multiple departments?', 'Members typically belong to one department but can collaborate across teams on specific projects.', 'general', 6),
  ('What events does the club organize?', 'We organize hackathons, workshops, tech talks, networking events, and community service activities throughout the year.', 'events', 7),
  ('How can my company sponsor the club?', 'We offer several sponsorship tiers with different benefits. Please contact us through the Contact page for a sponsorship package.', 'general', 8)
ON CONFLICT DO NOTHING;
