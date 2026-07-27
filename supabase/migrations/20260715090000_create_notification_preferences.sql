/*
# Add notification_preferences table

The Member Portal's Settings page had a "Notification Preferences" section
that only ever wrote to local React state — the "Save Preferences" button
showed a fake "Saved!" confirmation but nothing was ever persisted, and no
table existed to persist it to. This migration adds the missing table so
the page can be connected to a real backend.

One row per member, upserted on save. RLS restricts each member to their
own row only.
*/

CREATE TABLE IF NOT EXISTS notification_preferences (
  member_id   uuid PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  email       boolean NOT NULL DEFAULT true,
  push        boolean NOT NULL DEFAULT true,
  events      boolean NOT NULL DEFAULT true,
  tasks       boolean NOT NULL DEFAULT true,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_read_own_notification_prefs" ON notification_preferences;
CREATE POLICY "members_read_own_notification_prefs" ON notification_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = (SELECT user_id FROM members WHERE id = notification_preferences.member_id));

DROP POLICY IF EXISTS "members_insert_own_notification_prefs" ON notification_preferences;
CREATE POLICY "members_insert_own_notification_prefs" ON notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = (SELECT user_id FROM members WHERE id = notification_preferences.member_id));

DROP POLICY IF EXISTS "members_update_own_notification_prefs" ON notification_preferences;
CREATE POLICY "members_update_own_notification_prefs" ON notification_preferences
  FOR UPDATE TO authenticated
  USING (auth.uid() = (SELECT user_id FROM members WHERE id = notification_preferences.member_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM members WHERE id = notification_preferences.member_id));
