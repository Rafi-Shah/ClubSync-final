-- logActivity() (in adminApi.ts) inserts rows here on every admin action.
-- Without an INSERT policy, RLS silently blocks every one of those inserts
-- and activity_logs stays empty forever, with no visible error (the calling
-- code intentionally swallows logging failures so a broken log never breaks
-- the actual admin action).

CREATE POLICY "activity_logs_insert_own" ON activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);
