// NEW FILE — create at: supabase/functions/send-email-notifications/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Notification types that have a dedicated preference column beyond the
// master "email" toggle. Anything not in this map only needs email=true.
const CATEGORY_PREFERENCE_COLUMN: Record<string, string> = {
  event_reminder: 'events',
  task_deadline: 'tasks',
};

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Only look at notifications from the last 24 hours that haven't been
  // emailed yet — avoids re-scanning the entire history every 15 minutes.
  const { data: pending, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, body, link, created_at')
    .is('email_sent_at', null)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!pending || pending.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  let sentCount = 0;
  const errors: string[] = [];

  for (const notif of pending) {
    try {
      // notifications.user_id is a foreign key to auth.users(id) — i.e. the
      // real auth user_id, confirmed by the "violates foreign key constraint
      // notifications_user_id_fkey" error that surfaced when Broadcast.tsx
      // was mistakenly sending members.id instead. Look members up by their
      // user_id column, not their primary key.
      const { data: member } = await supabase
        .from('members')
        .select('id, full_name, email')
        .eq('user_id', notif.user_id)
        .maybeSingle();

      if (!member) {
        // No matching member row — mark as handled so we don't retry forever
        await supabase.from('notifications').update({ email_sent_at: new Date().toISOString() }).eq('id', notif.id);
        continue;
      }

      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('email, events, tasks')
        .eq('member_id', member.id)
        .maybeSingle();

      // Default to true if no preferences row exists yet (opt-out model)
      const emailEnabled = prefs?.email ?? true;
      const categoryColumn = CATEGORY_PREFERENCE_COLUMN[notif.type];
      const categoryEnabled = categoryColumn ? (prefs?.[categoryColumn as 'events' | 'tasks'] ?? true) : true;

      if (!emailEnabled || !categoryEnabled) {
        await supabase.from('notifications').update({ email_sent_at: new Date().toISOString() }).eq('id', notif.id);
        continue;
      }

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ClubSync <onboarding@resend.dev>',
          to: member.email,
          subject: notif.title,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #1e293b;">${notif.title}</h2>
              <p style="color: #475569; line-height: 1.6;">${notif.body ?? ''}</p>
              ${notif.link ? `<p><a href="${notif.link}" style="color: #4f46e5;">View in ClubSync</a></p>` : ''}
            </div>
          `,
        }),
      });

      if (!resendRes.ok) {
        const errBody = await resendRes.text();
        errors.push(`notif ${notif.id}: ${errBody}`);
        continue; // leave email_sent_at null so it retries next run
      }

      await supabase.from('notifications').update({ email_sent_at: new Date().toISOString() }).eq('id', notif.id);
      sentCount++;
    } catch (e) {
      errors.push(`notif ${notif.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return new Response(JSON.stringify({ sent: sentCount, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});