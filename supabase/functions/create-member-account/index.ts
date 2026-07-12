import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // --- Authentication & authorization -----------------------------------
    // This function uses the SERVICE ROLE key below, which bypasses all RLS
    // and can create arbitrary auth users. Without this check, anyone with
    // the public anon key (embedded in every client bundle, by design)
    // could call this endpoint and mint themselves a member account. So we
    // verify the caller's JWT and require an admin-tier role first.
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing Authorization header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: callerData, error: callerErr } = await authClient.auth.getUser(jwt);
    if (callerErr || !callerData?.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ADMIN_ROLE_SLUGS = ["super_admin", "faculty_advisor", "president", "vice_president", "secretary", "executive"];
    const { data: callerRoleRows } = await supabaseAdmin
      .from("user_roles")
      .select("role:roles(slug)")
      .eq("user_id", callerData.user.id);
    const callerIsAdmin = (callerRoleRows ?? []).some((row: any) => ADMIN_ROLE_SLUGS.includes(row.role?.slug));

    if (!callerIsAdmin) {
      return new Response(JSON.stringify({ error: "Only admin roles may create member accounts." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, full_name, member_code, phone, role_slug } = await req.json();

    if (!email || !password || !full_name) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // Insert into members table
    const { data: member, error: memberError } = await supabaseAdmin
      .from("members")
      .insert({
        user_id: userId,
        member_code: member_code || `CLUB-${Date.now().toString().slice(-4)}`,
        full_name,
        email,
        phone: phone || null,
        status: "active",
        joined_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (memberError) {
      // Cleanup: delete auth user if member insert fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: memberError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign the requested role — defaults to "member" for a normal member
    // account. To create an admin-tier account, the caller passes one of
    // the real slugs from the roles table (e.g. "executive", "president").
    // We look it up rather than trust an id directly, so an invalid slug
    // fails loudly instead of silently leaving the new user role-less.
    const { data: roleData, error: roleLookupError } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("slug", role_slug || "member")
      .maybeSingle();

    if (roleLookupError || !roleData) {
      // Cleanup: don't leave an orphaned auth user + member row behind
      await supabaseAdmin.from("members").delete().eq("user_id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: `Unknown role "${role_slug || "member"}".` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: roleAssignError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role_id: roleData.id,
    });

    if (roleAssignError) {
      await supabaseAdmin.from("members").delete().eq("user_id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: roleAssignError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, member }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});