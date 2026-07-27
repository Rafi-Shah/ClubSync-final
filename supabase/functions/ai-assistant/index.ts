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

// ---------------------------------------------------------------------
// Availability question parsing
//
// This is intentionally a separate, small parser rather than importing
// src/lib/routineTime.ts from the frontend — edge functions run in an
// isolated Deno runtime with no shared build step with the Vite app in
// this project, so a cross-runtime import isn't available here. Only the
// day-name/time-string PARSING is duplicated (a few lines); the actual
// overlap MATH lives in exactly one place — the find_available_members()
// Postgres function — which this file calls via RPC, same as the Admin
// Availability Finder page does. That's the piece that matters for "don't
// duplicate logic," and it isn't duplicated.
// ---------------------------------------------------------------------

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function parseDayOfWeek(q: string): number | null {
  if (/\btoday\b/.test(q)) return new Date().getDay();
  if (/\btomorrow\b/.test(q)) return (new Date().getDay() + 1) % 7;
  for (let i = 0; i < DAY_NAMES.length; i++) {
    const full = DAY_NAMES[i];
    const abbr = full.slice(0, 3);
    if (new RegExp(`\\b${full}\\b`).test(q) || new RegExp(`\\b${abbr}\\b`).test(q)) {
      return i;
    }
  }
  return null;
}

// Named time-of-day windows, used when the question says "morning" /
// "afternoon" / "evening" instead of an explicit numeric range.
const TIME_OF_DAY: Record<string, [number, number]> = {
  morning: [8 * 60, 12 * 60],
  afternoon: [12 * 60, 17 * 60],
  evening: [17 * 60, 21 * 60],
  night: [21 * 60, 23 * 60 + 59],
};

function to24Hour(hour: number, meridiem: string | undefined): number {
  if (!meridiem) return hour;
  const m = meridiem.toLowerCase();
  if (m === "pm" && hour !== 12) return hour + 12;
  if (m === "am" && hour === 12) return 0;
  return hour;
}

/** Parses an explicit "2pm to 4pm" / "14:00-16:00" / "10 AM - 1 PM" style range. */
function parseTimeRange(q: string): [number, number] | null {
  const re = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to|–|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;
  const m = q.match(re);
  if (!m) return null;

  const [, h1, min1, mer1RAW, h2, min2, mer2RAW] = m;
  let mer1 = mer1RAW;
  let mer2 = mer2RAW;
  // "2 to 4pm" — the first number borrows the second's meridiem if its own is missing.
  if (!mer1 && mer2) mer1 = mer2;

  const startHour = to24Hour(parseInt(h1, 10), mer1);
  const endHour = to24Hour(parseInt(h2, 10), mer2);
  const start = startHour * 60 + (min1 ? parseInt(min1, 10) : 0);
  const end = endHour * 60 + (min2 ? parseInt(min2, 10) : 0);
  if (end <= start) return null;
  return [start, end];
}

function parseTimeOfDay(q: string): [number, number] | null {
  for (const [word, range] of Object.entries(TIME_OF_DAY)) {
    if (new RegExp(`\\b${word}\\b`).test(q)) return range;
  }
  return null;
}

function formatMinutes(mins: number): string {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

/** Pulls "10" out of "find 10 available executive members" as a result limit. */
function parseLimit(q: string): number | null {
  const m = q.match(/\b(\d{1,3})\s+(?:available|free|members|volunteers|students)\b/i)
    ?? q.match(/\bfind\s+(\d{1,3})\b/i);
  return m ? parseInt(m[1], 10) : null;
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

  // Availability / who is free — now day + time-range + department/role aware.
  // Runs whenever the question names a day, a time range, or the general
  // availability vocabulary — a plain "who is free today" still works via
  // parseDayOfWeek's "today" fallback and the default 09:00–17:00 window.
  const mentionsAvailability = q.includes("free") || q.includes("available") || q.includes("availability") || q.includes("busy");
  const parsedDay = parseDayOfWeek(q);
  if (mentionsAvailability || parsedDay !== null) {
    const dayOfWeek = parsedDay ?? new Date().getDay();
    const range = parseTimeRange(question) ?? parseTimeOfDay(q) ?? [9 * 60, 17 * 60]; // default business hours if no time is mentioned
    const [startMinutes, endMinutes] = range;

    // Department filter: match question text against real department
    // names/slugs rather than guessing — e.g. "CSE students" only filters
    // if a department actually named/slugged like CSE exists.
    const { data: departments } = await supabase.from("departments").select("id, name, slug");
    const matchedDeptIds = (departments ?? [])
      .filter((d: any) => q.includes(d.name.toLowerCase()) || q.includes(d.slug.toLowerCase()))
      .map((d: any) => d.id);

    // Role filter: match against real role slugs/names the same way.
    const { data: roles } = await supabase.from("roles").select("slug, name");
    const matchedRoleSlugs = (roles ?? [])
      .filter((r: any) => q.includes(r.slug.replace(/_/g, " ")) || q.includes(r.name.toLowerCase()))
      .map((r: any) => r.slug);

    const limit = parseLimit(question) ?? 200;

    const { data: matches, error } = await supabase.rpc("find_available_members", {
      p_day_of_week: dayOfWeek,
      p_start_minutes: startMinutes,
      p_end_minutes: endMinutes,
      p_role_slugs: matchedRoleSlugs.length ? matchedRoleSlugs : null,
      p_department_ids: matchedDeptIds.length ? matchedDeptIds : null,
      p_batch: null,
      p_semester: null,
      p_committee_only: null,
      p_position: null,
      p_search: null,
      p_only_available: q.includes("busy") ? false : true,
      p_limit: limit,
    });

    if (error) {
      results.push({ type: "availability", data: null, summary: `Could not run the availability search: ${error.message}` });
      return results;
    }

    const dayLabel = DAY_NAMES[dayOfWeek][0].toUpperCase() + DAY_NAMES[dayOfWeek].slice(1);
    const timeLabel = `${formatMinutes(startMinutes)}–${formatMinutes(endMinutes)}`;
    const list = matches ?? [];

    if (list.length === 0) {
      const filterNote = [
        matchedDeptIds.length ? `department filter matched ${matchedDeptIds.length} department(s)` : null,
        matchedRoleSlugs.length ? `role filter: ${matchedRoleSlugs.join(", ")}` : null,
      ].filter(Boolean).join("; ");
      results.push({
        type: "availability",
        data: [],
        summary: `No members matched for ${dayLabel} ${timeLabel}${filterNote ? ` (${filterNote})` : ""}. This usually means either no active members match the requested department/role filter, or everyone who matches already has a class in that window — try widening the time range or removing a filter.`,
      });
      return results;
    }

    results.push({
      type: "availability",
      data: list,
      summary: `${q.includes("busy") ? "Busy" : "Available"} on ${dayLabel} ${timeLabel} (${list.length}): ` +
        list.slice(0, 15).map((m: any) =>
          `${m.full_name}${m.position_title ? ` (${m.position_title})` : ""}${m.department_names ? ` — ${m.department_names}` : ""}${!m.is_available && m.conflict_title ? ` [busy: ${m.conflict_title} ${m.conflict_start}-${m.conflict_end}]` : ""}`
        ).join("; "),
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