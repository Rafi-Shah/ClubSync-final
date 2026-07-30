// NEW FILE — create at: supabase/functions/delete-member-account/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { member_id } = await req.json();
    if (!member_id) return json({ error: 'member_id is required' }, 400);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('id, user_id')
      .eq('id', member_id)
      .maybeSingle();
    if (memberErr) return json({ error: memberErr.message }, 500);
    if (!member) return json({ error: 'Member not found' }, 404);

    // Remove role assignments first — user_roles references user_id
    // independently of members, so it won't be cleaned up automatically
    // just by deleting the members row or the auth user.
    if (member.user_id) {
      const { error: roleErr } = await supabase.from('user_roles').delete().eq('user_id', member.user_id);
      if (roleErr) return json({ error: roleErr.message }, 500);
    }

    // Delete the members row (business/profile data).
    const { error: memberDeleteErr } = await supabase.from('members').delete().eq('id', member_id);
    if (memberDeleteErr) return json({ error: memberDeleteErr.message }, 500);

    // Finally delete the actual login — this is what stops them from being
    // able to sign in again with that email at all. Member Management's
    // old delete only removed the members row, leaving the auth account
    // (and login access) fully intact.
    if (member.user_id) {
      const { error: authErr } = await supabase.auth.admin.deleteUser(member.user_id);
      if (authErr) return json({ error: authErr.message }, 500);
    }

    return json({ success: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});