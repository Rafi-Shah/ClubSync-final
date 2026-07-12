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
    // This function uses the SERVICE ROLE key below, which bypasses all RLS.
    // Without this check, anyone with the public anon key (embedded in every
    // client bundle, by design) could call this endpoint and read every
    // member's data, budgets, attendance, etc. So we verify the caller's JWT
    // and require an admin-tier role before doing anything else.
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
    const { data: userData, error: userErr } = await authClient.auth.getUser(jwt);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ADMIN_ROLE_SLUGS = ["super_admin", "faculty_advisor", "president", "vice_president", "secretary", "executive"];
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role:roles(slug)")
      .eq("user_id", userData.user.id);
    const isAdmin = (roleRows ?? []).some((row: any) => ADMIN_ROLE_SLUGS.includes(row.role?.slug));

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "AI Assistant is available to admin roles only." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { question, userId } = await req.json();
    if (!question) {
      return new Response(JSON.stringify({ error: "Question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Query the database based on the question
    const dbResults = await queryDatabase(supabase, question, userId);

    // Step 2: Generate response using LLM if available, otherwise use structured fallback
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    let response: string;

    if (geminiKey) {
      response = await callGemini(geminiKey, question, dbResults);
    } else {
      response = generateStructuredResponse(question, dbResults);
    }

    return new Response(JSON.stringify({
      answer: response,
      data: dbResults,
      usedLLM: !!geminiKey,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

interface DBResult {
  type: string;
  data: any;
  summary: string;
}

async function queryDatabase(supabase: any, question: string, userId?: string): Promise<DBResult[]> {
  const q = question.toLowerCase();
  const results: DBResult[] = [];

  // Find member by ID
  if (q.includes("member id") || q.includes("find member") || q.includes("member by id")) {
    const idMatch = question.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (idMatch) {
      const { data } = await supabase.from("members").select("*").eq("id", idMatch[0]).maybeSingle();
      if (data) {
        results.push({
          type: "member_by_id",
          data,
          summary: `Found member: ${data.full_name} (${data.email}), Status: ${data.status}, Code: ${data.member_code}`,
        });
      } else {
        results.push({ type: "member_by_id", data: null, summary: "No member found with that ID." });
      }
      return results;
    }
  }

  // Find member by name
  if (q.includes("by name") || q.includes("named") || q.includes("find ") || q.includes("who is")) {
    const nameMatch = question.match(/(?:find|named|who is)\s+([a-zA-Z\s]+)/i);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      const { data } = await supabase.from("members")
        .select("*")
        .ilike("full_name", `%${name}%`)
        .limit(5);
      if (data && data.length > 0) {
        results.push({
          type: "member_by_name",
          data,
          summary: data.map((m: any) => `${m.full_name} (${m.email}, ${m.status})`).join("; "),
        });
      } else {
        results.push({ type: "member_by_name", data: [], summary: `No members found matching "${name}".` });
      }
      return results;
    }
  }

  // Who is free today / availability
  if (q.includes("free today") || q.includes("available today") || q.includes("who is free") || q.includes("availability")) {
    const today = new Date().getDay();
    const { data: routines } = await supabase.from("routines")
      .select("member_id, title, start_time, end_time")
      .eq("day_of_week", today)
      .eq("is_active", true);
    const { data: members } = await supabase.from("members").select("id, full_name").eq("status", "active");
    const busyIds = new Set((routines ?? []).map((r: any) => r.member_id));
    const free = (members ?? []).filter((m: any) => !busyIds.has(m.id));
    const busy = (members ?? []).filter((m: any) => busyIds.has(m.id));
    results.push({
      type: "availability",
      data: { free, busy, busyRoutines: routines },
      summary: `Free today (${free.length} members): ${free.map((m: any) => m.full_name).join(", ") || "None"}. Busy: ${busy.map((m: any) => m.full_name).join(", ") || "None"}.`,
    });
    return results;
  }

  // Show attendance
  if (q.includes("attendance")) {
    const { data } = await supabase.from("attendance")
      .select("*, member:members(full_name), event:events(title), meeting:meetings(title)")
      .order("recorded_at", { ascending: false })
      .limit(20);
    const present = (data ?? []).filter((a: any) => a.status === "present").length;
    const total = (data ?? []).length;
    results.push({
      type: "attendance",
      data,
      summary: `Recent attendance: ${present}/${total} present (${total > 0 ? Math.round(present / total * 100) : 0}% rate). ` +
        (data ?? []).slice(0, 5).map((a: any) => `${a.member?.full_name}: ${a.status} (${a.event?.title ?? a.meeting?.title ?? "N/A"})`).join("; "),
    });
    return results;
  }

  // Pending tasks
  if (q.includes("pending task") || q.includes("task") || q.includes("tasks")) {
    const { data } = await supabase.from("tasks")
      .select("*, assignee:members!tasks_assigned_to_member_id_fkey(full_name)")
      .neq("status", "completed")
      .order("due_at", { ascending: true })
      .limit(20);
    results.push({
      type: "pending_tasks",
      data,
      summary: `Pending tasks (${data?.length ?? 0}): ` +
        (data ?? []).map((t: any) => `${t.title} → ${t.assignee?.full_name ?? "Unassigned"} (due: ${t.due_at ? new Date(t.due_at).toLocaleDateString() : "N/A"}, priority: ${t.priority})`).join("; "),
    });
    return results;
  }

  // Generate announcement
  if (q.includes("announcement") || q.includes("announce")) {
    const { data: events } = await supabase.from("events")
      .select("*").gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true }).limit(3);
    const { data: meetings } = await supabase.from("meetings")
      .select("*").gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true }).limit(3);
    results.push({
      type: "announcement_data",
      data: { events, meetings },
      summary: `Upcoming events: ${(events ?? []).map((e: any) => `${e.title} on ${new Date(e.start_at).toLocaleDateString()}`).join(", ") || "None"}. Upcoming meetings: ${(meetings ?? []).map((m: any) => `${m.title} on ${new Date(m.start_at).toLocaleDateString()}`).join(", ") || "None"}.`,
    });
    return results;
  }

  // Generate report
  if (q.includes("report") || q.includes("summary")) {
    const [members, events, tasks, budgets, attendance] = await Promise.all([
      supabase.from("members").select("id, status"),
      supabase.from("events").select("id, status"),
      supabase.from("tasks").select("id, status"),
      supabase.from("budgets").select("type, amount"),
      supabase.from("attendance").select("status"),
    ]);
    const totalBudget = (budgets.data ?? []).reduce((s: number, b: any) => s + (b.type === "income" ? b.amount : -b.amount), 0);
    const presentCount = (attendance.data ?? []).filter((a: any) => a.status === "present").length;
    results.push({
      type: "report_data",
      data: {
        activeMembers: (members.data ?? []).filter((m: any) => m.status === "active").length,
        totalMembers: members.data?.length ?? 0,
        totalEvents: events.data?.length ?? 0,
        pendingTasks: (tasks.data ?? []).filter((t: any) => t.status !== "completed").length,
        completedTasks: (tasks.data ?? []).filter((t: any) => t.status === "completed").length,
        totalBudget,
        attendanceRate: attendance.data?.length ? Math.round(presentCount / attendance.data.length * 100) : 0,
      },
      summary: `Club Report: ${members.data?.length ?? 0} members (${(members.data ?? []).filter((m: any) => m.status === "active").length} active), ${events.data?.length ?? 0} events, ${tasks.data?.length ?? 0} tasks (${(tasks.data ?? []).filter((t: any) => t.status !== "completed").length} pending), Budget balance: $${totalBudget.toFixed(2)}, Attendance rate: ${attendance.data?.length ? Math.round(presentCount / attendance.data.length * 100) : 0}%.`,
    });
    return results;
  }

  // Meeting summaries
  if (q.includes("meeting")) {
    const { data } = await supabase.from("meetings")
      .select("*, organizer:members!meetings_organized_by_member_id_fkey(full_name)")
      .order("start_at", { ascending: false })
      .limit(10);
    results.push({
      type: "meetings",
      data,
      summary: `Recent meetings (${data?.length ?? 0}): ` +
        (data ?? []).map((m: any) => `${m.title} on ${new Date(m.start_at).toLocaleDateString()} (${m.status}, organized by ${m.organizer?.full_name ?? "N/A"})`).join("; "),
    });
    return results;
  }

  // Volunteer recommendations
  if (q.includes("volunteer") || q.includes("recommend")) {
    const { data: hours } = await supabase.from("volunteer_hours")
      .select("member_id, hours, status")
      .eq("status", "approved");
    const { data: members } = await supabase.from("members").select("id, full_name").eq("status", "active");
    const memberHours: Record<string, number> = {};
    (hours ?? []).forEach((h: any) => {
      memberHours[h.member_id] = (memberHours[h.member_id] || 0) + h.hours;
    });
    const ranked = (members ?? []).map((m: any) => ({
      ...m,
      totalHours: memberHours[m.id] || 0,
    })).sort((a: any, b: any) => b.totalHours - a.totalHours).slice(0, 10);
    results.push({
      type: "volunteer_recommendations",
      data: ranked,
      summary: `Top volunteers: ${ranked.slice(0, 5).map((m: any) => `${m.full_name} (${m.totalHours}h)`).join(", ") || "No volunteer hours recorded yet."}.`,
    });
    return results;
  }

  // Conflict detection
  if (q.includes("conflict") || q.includes("overlap") || q.includes("clash")) {
    const { data: events } = await supabase.from("events")
      .select("id, title, start_at, end_at")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true });
    const { data: meetings } = await supabase.from("meetings")
      .select("id, title, start_at, end_at")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true });
    const conflicts: any[] = [];
    const allItems = [
      ...(events ?? []).map((e: any) => ({ ...e, type: "event" })),
      ...(meetings ?? []).map((m: any) => ({ ...m, type: "meeting" })),
    ];
    for (let i = 0; i < allItems.length; i++) {
      for (let j = i + 1; j < allItems.length; j++) {
        const a = allItems[i];
        const b = allItems[j];
        const aStart = new Date(a.start_at).getTime();
        const aEnd = new Date(a.end_at || a.start_at).getTime();
        const bStart = new Date(b.start_at).getTime();
        const bEnd = new Date(b.end_at || b.start_at).getTime();
        if (aStart < bEnd && bStart < aEnd) {
          conflicts.push({ item1: a, item2: b });
        }
      }
    }
    results.push({
      type: "conflicts",
      data: conflicts,
      summary: conflicts.length === 0
        ? "No scheduling conflicts detected among upcoming events and meetings."
        : `${conflicts.length} conflict(s) detected: ${conflicts.map((c: any) => `${c.item1.title} (${c.item1.type}) overlaps with ${c.item2.title} (${c.item2.type})`).join("; ")}`,
    });
    return results;
  }

  // All members list
  if (q.includes("all members") || q.includes("list members") || q.includes("how many members")) {
    const { data } = await supabase.from("members").select("*").order("full_name");
    results.push({
      type: "all_members",
      data,
      summary: `Total members: ${data?.length ?? 0}. ${(data ?? []).map((m: any) => `${m.full_name} (${m.status})`).join(", ")}`,
    });
    return results;
  }

  // Events
  if (q.includes("event") || q.includes("upcoming")) {
    const { data } = await supabase.from("events")
      .select("*").gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true }).limit(10);
    results.push({
      type: "events",
      data,
      summary: `Upcoming events (${data?.length ?? 0}): ${(data ?? []).map((e: any) => `${e.title} on ${new Date(e.start_at).toLocaleDateString()}`).join(", ") || "None"}.`,
    });
    return results;
  }

  // Budget
  if (q.includes("budget") || q.includes("finance") || q.includes("money")) {
    const { data } = await supabase.from("budgets").select("*").order("transaction_date", { ascending: false }).limit(20);
    const income = (data ?? []).filter((b: any) => b.type === "income").reduce((s: number, b: any) => s + b.amount, 0);
    const expense = (data ?? []).filter((b: any) => b.type === "expense").reduce((s: number, b: any) => s + b.amount, 0);
    results.push({
      type: "budget",
      data,
      summary: `Budget: Income $${income.toFixed(2)}, Expense $${expense.toFixed(2)}, Net $${(income - expense).toFixed(2)}. Recent: ${(data ?? []).slice(0, 5).map((b: any) => `${b.title} (${b.type}: $${b.amount})`).join(", ") || "None"}.`,
    });
    return results;
  }

  // Default: general club overview
  const [members, events, tasks] = await Promise.all([
    supabase.from("members").select("id, status"),
    supabase.from("events").select("id, status").gte("start_at", new Date().toISOString()),
    supabase.from("tasks").select("id, status").neq("status", "completed"),
  ]);
  results.push({
    type: "overview",
    data: {
      activeMembers: (members.data ?? []).filter((m: any) => m.status === "active").length,
      upcomingEvents: events.data?.length ?? 0,
      pendingTasks: tasks.data?.length ?? 0,
    },
    summary: `Club overview: ${(members.data ?? []).filter((m: any) => m.status === "active").length} active members, ${events.data?.length ?? 0} upcoming events, ${tasks.data?.length ?? 0} pending tasks.`,
  });
  return results;
}

async function callGemini(apiKey: string, question: string, dbResults: DBResult[]): Promise<string> {
  const context = dbResults.map((r) => r.summary).join("\n");
  const prompt = `You are an AI assistant for a club management system. Based on the following database query results, answer the user's question in a clear, natural language response. Be concise but informative.

Database Results:
${context}

User Question: ${question}

Answer:`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || "Unable to generate response.";
}

function generateStructuredResponse(question: string, dbResults: DBResult[]): string {
  if (dbResults.length === 0) {
    return "I couldn't find any relevant data for your question.";
  }
  return dbResults.map((r) => r.summary).join("\n\n");
}
