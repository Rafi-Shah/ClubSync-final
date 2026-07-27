/*
# Event Reminders (in-app)

Makes the "Event Reminders" notification preference actually do something.
Previously toggling it only saved a boolean with no feature behind it.

1. Tracking
   event_registrations.reminder_sent_at — set once a reminder notification
   has been created for that registration, so the same member never gets
   reminded twice for the same event.

2. The reminder function
   send_event_reminders() finds registrations where:
   - the event starts within the next 24 hours (and hasn't started yet)
   - the registration is still active (not cancelled)
   - no reminder has been sent yet for it
   - the member's notification_preferences.events is true, OR the member
     has no preferences row at all yet (defaults to on, matching the
     Settings page's default toggle state)
   ...and inserts one notifications row per match, then marks
   reminder_sent_at so it won't fire again.

   SECURITY DEFINER because this runs on a schedule with no logged-in
   user — it needs to bypass RLS to read across all members' data and
   insert notifications on their behalf.

3. Scheduling
   Uses pg_cron (Supabase's built-in Postgres extension for scheduled
   jobs) to run the function every 15 minutes. If pg_cron isn't available
   on your project/plan, the CREATE EXTENSION line will fail — see the
   note at the bottom of this file for the alternative.
*/

ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

CREATE OR REPLACE FUNCTION public.send_event_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH due AS (
    SELECT er.event_id, er.member_id, m.user_id, e.title, e.start_at, e.location
    FROM event_registrations er
    JOIN events e ON e.id = er.event_id
    JOIN members m ON m.id = er.member_id
    LEFT JOIN notification_preferences np ON np.member_id = er.member_id
    WHERE er.status = 'registered'
      AND er.reminder_sent_at IS NULL
      AND e.start_at > now()
      AND e.start_at <= now() + interval '24 hours'
      AND (np.events IS NULL OR np.events = true)
  ),
  inserted AS (
    INSERT INTO notifications (user_id, type, title, body, link)
    SELECT
      user_id,
      'event_reminder',
      'Upcoming: ' || title,
      'Starts ' || to_char(start_at, 'Mon DD, HH12:MI AM') || COALESCE(' at ' || location, ''),
      '/portal/events'
    FROM due
    RETURNING 1
  )
  UPDATE event_registrations er
  SET reminder_sent_at = now()
  FROM due
  WHERE er.event_id = due.event_id AND er.member_id = due.member_id;
END;
$$;

-- Schedule it. If your project doesn't have pg_cron available, this line
-- will error — comment it out and see the note below for a fallback.
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'send-event-reminders',
  '*/15 * * * *',
  $$ SELECT public.send_event_reminders(); $$
);

/*
FALLBACK if pg_cron is unavailable on your Supabase plan/region:
Skip the two statements above (CREATE EXTENSION / cron.schedule) and
instead create a Supabase Edge Function that calls this same function via
RPC, then schedule that Edge Function from the Supabase Dashboard under
Edge Functions -> your function -> Cron Triggers (no extension needed).
The Edge Function body would just be:

  const { createClient } = ...;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  await supabase.rpc('send_event_reminders');

Ask me and I'll generate that Edge Function file if pg_cron isn't
available for you.
*/
