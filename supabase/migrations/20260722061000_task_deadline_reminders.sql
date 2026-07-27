/*
# Task Deadline Reminders (in-app)

Same pattern as 20260721060000_event_reminders.sql, applied to tasks.
Makes the "Task Deadlines" notification preference actually do something.

1. Tracking
   tasks.reminder_sent_at — set once a deadline reminder has been created
   for that task, so the same task never reminds its assignee twice.

2. The reminder function
   send_task_deadline_reminders() finds tasks where:
   - due_at is within the next 24 hours (and hasn't passed yet)
   - status is not 'completed' or 'cancelled' (no point reminding about
     a task that's already done or dropped)
   - no reminder has been sent yet for it
   - the assignee's notification_preferences.tasks is true, OR they have
     no preferences row yet (defaults to on, matching Settings' default
     toggle state)
   ...and inserts one notifications row per match, then marks
   reminder_sent_at.

3. Scheduling
   Reuses the same pg_cron job style as event reminders, running every 15
   minutes. If you already ran the event reminders migration and pg_cron
   worked there, this will too.
*/

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

CREATE OR REPLACE FUNCTION public.send_task_deadline_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  WITH due AS (
    SELECT t.id AS task_id, m.user_id, t.title, t.due_at, t.priority
    FROM tasks t
    JOIN members m ON m.id = t.assigned_to_member_id
    LEFT JOIN notification_preferences np ON np.member_id = t.assigned_to_member_id
    WHERE t.status NOT IN ('completed', 'cancelled')
      AND t.reminder_sent_at IS NULL
      AND t.due_at IS NOT NULL
      AND t.due_at > now()
      AND t.due_at <= now() + interval '24 hours'
      AND (np.tasks IS NULL OR np.tasks = true)
  ),
  inserted AS (
    INSERT INTO notifications (user_id, type, title, body, link)
    SELECT
      user_id,
      'task_deadline',
      'Task due soon: ' || title,
      'Due ' || to_char(due_at, 'Mon DD, HH12:MI AM') || ' — priority: ' || priority,
      '/portal/tasks'
    FROM due
    RETURNING 1
  )
  UPDATE tasks t
  SET reminder_sent_at = now()
  FROM due
  WHERE t.id = due.task_id;
END;
$$;

SELECT cron.schedule(
  'send-task-deadline-reminders',
  '*/15 * * * *',
  $$ SELECT public.send_task_deadline_reminders(); $$
);

-- Same pg_cron fallback note as event reminders applies here — if pg_cron
-- isn't available, ask and I'll generate an Edge Function + Dashboard
-- Cron Trigger version instead.
