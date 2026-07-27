// NEW FILE — create at: supabase/functions/update-member-email/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Without these headers, the browser's CORS preflight (OPTIONS) request to
// this function fails before the actual POST ever goes out, surfacing as
// "Failed to send a request to the Edge Function" on the client — not any
// error from inside this function's logic.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { member_id, new_email } = await req.json();

    if (!member_id || !new_email) {
      return new Response(JSON.stringify({ error: 'member_id and new_email are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Look up the member's auth user_id — members.email alone isn't enough,
    // we need the linked auth.users row to actually change the login email.
    const { data: member, error: memberErr } = await supabase
      .from('members')
      .select('id, user_id, email')
      .eq('id', member_id)
      .maybeSingle();

    if (memberErr) {
      return new Response(JSON.stringify({ error: memberErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!member) {
      return new Response(JSON.stringify({ error: 'Member not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!member.user_id) {
      return new Response(JSON.stringify({ error: 'This member has no linked login account, so only the directory email was updated.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update the actual login email in auth.users first — if this fails
    // (e.g. email already in use by another account), we bail out before
    // touching members.email, so the two stay in sync either way.
    const { error: authErr } = await supabase.auth.admin.updateUserById(member.user_id, {
      email: new_email,
      email_confirm: true, // skip the "confirm new email" step so login works immediately
    });
    if (authErr) {
      return new Response(JSON.stringify({ error: authErr.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Now sync the directory-facing members.email column
    const { error: memberUpdateErr } = await supabase
      .from('members')
      .update({ email: new_email })
      .eq('id', member_id);
    if (memberUpdateErr) {
      return new Response(JSON.stringify({ error: memberUpdateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});