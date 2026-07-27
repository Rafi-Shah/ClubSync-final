-- Adds email_sent_at so we never send the same email twice, then schedules
-- a pg_cron job that calls the send-email-notifications Edge Function every
-- 15 minutes (same cadence as the event/task reminder functions).
--
-- The Edge Function needs the project's service role key to query
-- notifications with elevated privileges. Rather than hardcoding that key
-- into this SQL file (which would end up in git history), we store it in
-- Supabase Vault first and have the cron job read it from there at runtime.
--
-- BEFORE RUNNING THIS FILE: run the two "vault.create_secret" statements
-- separately in the SQL editor (see instructions below), or this migration
-- will fail with "secret not found".

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- Requires pg_cron and pg_net extensions (both available on Supabase by default)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'send-email-notifications',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/send-email-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);