import { supabase } from '../lib/supabase';

// ============ MEMBERS ============
export async function getAllMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .order('full_name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateMember(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('members').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteMember(id: string) {
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) throw error;
}

// ============ USERS (auth) ============
// user_roles and members both reference auth.users independently — there is
// no direct foreign key between user_roles and members, so PostgREST cannot
// embed members through a user_roles!...fkey select (that was causing
// "Could not find a relationship between 'user_roles' and 'members'").
// Fetch both and join them client-side on user_id instead.
export async function getAllUsersWithRoles() {
  const [rolesRes, membersRes] = await Promise.all([
    supabase.from('user_roles').select('user_id, role:roles(id, name, slug)').order('user_id'),
    supabase.from('members').select('id, user_id, full_name, email'),
  ]);
  if (rolesRes.error) throw rolesRes.error;
  if (membersRes.error) throw membersRes.error;

  const memberByUserId = new Map((membersRes.data ?? []).map((m: any) => [m.user_id, m]));

  return (rolesRes.data ?? []).map((row: any) => ({
    user_id: row.user_id,
    role: row.role,
    member: memberByUserId.get(row.user_id) ?? null,
  }));
}

// Creates a brand-new login (auth user), a matching `members` row, and a
// `user_roles` row, all in one step, via the create-member-account edge
// function. Pass role_slug to control the assigned role — omit it (or pass
// "member") for a regular member account, or pass an admin-tier slug
// (e.g. "executive", "president") to create an admin account.
export async function createUserAccount(input: {
  email: string;
  password: string;
  full_name: string;
  member_code?: string;
  phone?: string;
  role_slug?: string;
}) {
  const { data, error } = await supabase.functions.invoke('create-member-account', {
    body: input,
  });
  if (error) {
    // When an Edge Function returns a non-2xx status, supabase-js sets `data`
    // to null and gives a generic "Edge Function returned a non-2xx status
    // code" message on `error` — the actual reason our function sent back
    // (e.g. "Unknown role", "User already registered", a missing field) is
    // only available on error.context, which is the raw Response object and
    // has to be read separately. Without this, every failure looked
    // identical and gave no clue what actually went wrong.
    let message = error.message;
    const ctx = (error as any)?.context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = await ctx.json();
        if (body?.error) message = body.error;
      } catch {
        // response body wasn't JSON (or already consumed) — fall back to the generic message
      }
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function assignRole(userId: string, roleId: number) {
  const { error } = await supabase.from('user_roles').insert({ user_id: userId, role_id: roleId });
  if (error) throw error;
}

export async function removeRole(userId: string, roleId: number) {
  const { error } = await supabase.from('user_roles').delete()
    .eq('user_id', userId).eq('role_id', roleId);
  if (error) throw error;
}

// ============ DEPARTMENTS ============
export async function getDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*, head:members!departments_head_member_id_fkey(id, full_name), members:department_members(member_id)')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createDepartment(input: { name: string; slug: string; description?: string | null; head_member_id?: string | null }) {
  const { data, error } = await supabase.from('departments').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateDepartment(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('departments').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteDepartment(id: string) {
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw error;
}

// ============ TEAMS ============
export async function getTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('*, department:departments(id, name), lead:members!teams_lead_member_id_fkey(id, full_name)')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createTeam(input: { department_id: string; name: string; slug: string; description?: string | null; lead_member_id?: string | null }) {
  const { data, error } = await supabase.from('teams').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTeam(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('teams').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}

// ============ EXECUTIVE COMMITTEE ============
export async function getExecutives() {
  const { data, error } = await supabase
    .from('executive_committee')
    .select('*, member:members!executive_committee_member_id_fkey(id, full_name, email, avatar_url)')
    .order('term_start', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createExecutive(input: { member_id: string; position: string; term_start: string; term_end?: string | null }) {
  const { data, error } = await supabase.from('executive_committee').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateExecutive(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('executive_committee').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteExecutive(id: string) {
  const { error } = await supabase.from('executive_committee').delete().eq('id', id);
  if (error) throw error;
}

// ============ RECRUITMENT ============
export async function getRecruitments() {
  const { data, error } = await supabase
    .from('recruitments')
    .select('*')
    .order('open_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createRecruitment(input: { title: string; slug: string; description?: string | null; requirements?: string | null; open_at: string; close_at?: string | null; status: string }) {
  const { data, error } = await supabase.from('recruitments').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateRecruitment(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('recruitments').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteRecruitment(id: string) {
  const { error } = await supabase.from('recruitments').delete().eq('id', id);
  if (error) throw error;
}

export async function getApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select('*, recruitment:recruitments(id, title)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateApplication(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('applications').update(updates).eq('id', id);
  if (error) throw error;
}

// ============ EVENTS ============
export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*, organizer:members!events_organized_by_member_id_fkey(id, full_name)')
    .order('start_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createEvent(input: Record<string, any>) {
  const { data, error } = await supabase.from('events').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('events').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
}

// ============ MEETINGS ============
export async function getMeetings() {
  const { data, error } = await supabase
    .from('meetings')
    .select('*, organizer:members!meetings_organized_by_member_id_fkey(id, full_name)')
    .order('start_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMeeting(input: Record<string, any>) {
  const { data, error } = await supabase.from('meetings').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateMeeting(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('meetings').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteMeeting(id: string) {
  const { error } = await supabase.from('meetings').delete().eq('id', id);
  if (error) throw error;
}

// ============ TASKS ============
export async function getAllTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:members!tasks_assigned_to_member_id_fkey(id, full_name), assigner:members!tasks_assigned_by_member_id_fkey(id, full_name), event:events(id, title)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTask(input: Record<string, any>) {
  const { data, error } = await supabase.from('tasks').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('tasks').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

// ============ ATTENDANCE ============
export async function getAllAttendance() {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, member:members(id, full_name), event:events(id, title), meeting:meetings(id, title)')
    .order('recorded_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createAttendance(input: Record<string, any>) {
  const { data, error } = await supabase.from('attendance').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateAttendance(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('attendance').update(updates).eq('id', id);
  if (error) throw error;
}

// ============ BUDGETS ============
export async function getBudgets() {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('transaction_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createBudget(input: Record<string, any>) {
  const { data, error } = await supabase.from('budgets').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateBudget(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('budgets').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteBudget(id: string) {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
}

// ============ INVENTORY ============
export async function getInventory() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createInventoryItem(input: Record<string, any>) {
  const { data, error } = await supabase.from('inventory_items').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateInventoryItem(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('inventory_items').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
  if (error) throw error;
}

// ============ RESOURCE BOOKINGS ============
export async function getResourceBookings() {
  const { data, error } = await supabase
    .from('resource_bookings')
    .select('*, item:inventory_items(id, name), member:members(id, full_name)')
    .order('start_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createResourceBooking(input: Record<string, any>) {
  const { data, error } = await supabase.from('resource_bookings').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateResourceBooking(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('resource_bookings').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteResourceBooking(id: string) {
  const { error } = await supabase.from('resource_bookings').delete().eq('id', id);
  if (error) throw error;
}

// ============ CERTIFICATES ============
export async function getCertificates() {
  const { data, error } = await supabase
    .from('certificates')
    .select('*, member:members(id, full_name), event:events(id, title)')
    .order('issued_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCertificate(input: Record<string, any>) {
  const { data, error } = await supabase.from('certificates').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCertificate(id: string) {
  const { error } = await supabase.from('certificates').delete().eq('id', id);
  if (error) throw error;
}

// ============ REPORTS ============
export async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createReport(input: Record<string, any>) {
  const { data, error } = await supabase.from('reports').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteReport(id: string) {
  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) throw error;
}

// ============ ACTIVITY LOGS ============
export async function getActivityLogs() {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

// ============ GALLERY CMS ============
export async function getGalleryItems() {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createGalleryItem(input: Record<string, any>) {
  const { data, error } = await supabase.from('gallery_items').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateGalleryItem(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('gallery_items').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteGalleryItem(id: string) {
  const { error } = await supabase.from('gallery_items').delete().eq('id', id);
  if (error) throw error;
}

// ============ WEBSITE CMS ============
export async function getSiteSettings() {
  const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateSiteSettings(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('site_settings').update(updates).eq('id', id);
  if (error) throw error;
}

export async function getAboutBlocks() {
  const { data, error } = await supabase
    .from('about_content')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateAboutBlock(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('about_content').update(updates).eq('id', id);
  if (error) throw error;
}

export async function getAchievements() {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createAchievement(input: Record<string, any>) {
  const { data, error } = await supabase.from('achievements').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateAchievement(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('achievements').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteAchievement(id: string) {
  const { error } = await supabase.from('achievements').delete().eq('id', id);
  if (error) throw error;
}

export async function getSponsors() {
  const { data, error } = await supabase
    .from('sponsors')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createSponsor(input: Record<string, any>) {
  const { data, error } = await supabase.from('sponsors').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateSponsor(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('sponsors').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteSponsor(id: string) {
  const { error } = await supabase.from('sponsors').delete().eq('id', id);
  if (error) throw error;
}

export async function getFaqs() {
  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createFaq(input: Record<string, any>) {
  const { data, error } = await supabase.from('faqs').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateFaq(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('faqs').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteFaq(id: string) {
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) throw error;
}

export async function getContactMessages() {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markContactMessageRead(id: string) {
  const { error } = await supabase.from('contact_messages').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

// ============ ROLES & PERMISSIONS ============
export async function getRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('id');
  if (error) throw error;
  return data ?? [];
}

export async function getPermissions() {
  const { data, error } = await supabase
    .from('permissions')
    .select('*')
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function getRolePermissions() {
  const { data, error } = await supabase
    .from('role_permissions')
    .select('role_id, permission_id, permission:permissions(id, name, slug)')
    .order('role_id');
  if (error) throw error;
  return data ?? [];
}

export async function toggleRolePermission(roleId: number, permissionId: number, enable: boolean) {
  if (enable) {
    const { error } = await supabase.from('role_permissions').insert({ role_id: roleId, permission_id: permissionId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('role_permissions').delete()
      .eq('role_id', roleId).eq('permission_id', permissionId);
    if (error) throw error;
  }
}

// ============ COMMUNICATION ============
export async function getConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, creator:members!conversations_created_by_member_id_fkey(id, full_name)')
    .order('last_message_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:members!messages_sender_member_id_fkey(id, full_name, avatar_url)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(conversationId: string, senderMemberId: string, body: string) {
  const { data, error } = await supabase.from('messages')
    .insert({ conversation_id: conversationId, sender_member_id: senderMemberId, body })
    .select('*, sender:members!messages_sender_member_id_fkey(id, full_name, avatar_url)')
    .single();
  if (error) throw error;
  await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
  return data;
}

export async function createBroadcast(title: string, creatorMemberId: string) {
  const { data, error } = await supabase.from('conversations')
    .insert({ conversation_type: 'broadcast', title, created_by_member_id: creatorMemberId })
    .select().single();
  if (error) throw error;
  return data;
}

export async function createGroupChat(title: string, creatorMemberId: string) {
  const { data, error } = await supabase.from('conversations')
    .insert({ conversation_type: 'group', title, created_by_member_id: creatorMemberId })
    .select().single();
  if (error) throw error;
  return data;
}

export async function getConversationParticipants(conversationId: string) {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('*, member:members(id, full_name, avatar_url)')
    .eq('conversation_id', conversationId);
  if (error) throw error;
  return data ?? [];
}

export async function addParticipant(conversationId: string, memberId: string) {
  const { error } = await supabase.from('conversation_participants')
    .insert({ conversation_id: conversationId, member_id: memberId });
  if (error) throw error;
}

// ============ NOTIFICATIONS (broadcast) ============
export async function broadcastNotification(userIds: string[], type: string, title: string, body: string, link?: string) {
  const rows = userIds.map(uid => ({ user_id: uid, type, title, body, link }));
  const { error } = await supabase.from('notifications').insert(rows);
  if (error) throw error;
}

export async function getAllNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

// ============ ROUTINES ============
export async function getAllRoutines() {
  const { data, error } = await supabase
    .from('routines')
    .select('*, member:members(id, full_name)')
    .order('day_of_week', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createRoutine(input: Record<string, any>) {
  const { data, error } = await supabase.from('routines').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function updateRoutine(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('routines').update(updates).eq('id', id);
  if (error) throw error;
}

export async function deleteRoutine(id: string) {
  const { error } = await supabase.from('routines').delete().eq('id', id);
  if (error) throw error;
}

// ============ VOLUNTEER HOURS ============
export async function getAllVolunteerHours() {
  const { data, error } = await supabase
    .from('volunteer_hours')
    .select('*, member:members(id, full_name), event:events(id, title)')
    .order('activity_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateVolunteerHours(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('volunteer_hours').update(updates).eq('id', id);
  if (error) throw error;
}

// ============ IDEAS ============
export async function getAllIdeas() {
  const { data, error } = await supabase
    .from('ideas')
    .select('*, member:members(id, full_name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateIdea(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('ideas').update(updates).eq('id', id);
  if (error) throw error;
}

// ============ FEEDBACK ============
export async function getAllFeedback() {
  const { data, error } = await supabase
    .from('feedback')
    .select('*, member:members(id, full_name), event:events(id, title)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ============ PERFORMANCE ============
export async function getAllPerformance() {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('*, member:members(id, full_name)')
    .order('period_start', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPerformance(input: Record<string, any>) {
  const { data, error } = await supabase.from('performance_metrics').insert(input).select().single();
  if (error) throw error;
  return data;
}

// ============ DASHBOARD STATS ============
export async function getDashboardStats() {
  const now = new Date().toISOString();
  const [members, upcomingEvents, tasks, applications, budgets, inventory, unreadMessages] = await Promise.all([
    supabase.from('members').select('id, status').eq('status', 'active'),
    // "Upcoming Events" card must only count future events, not every event ever created.
    supabase.from('events').select('id, status').gte('start_at', now),
    supabase.from('tasks').select('id, status'),
    supabase.from('applications').select('id, status').eq('status', 'submitted'),
    supabase.from('budgets').select('type, amount'),
    supabase.from('inventory_items').select('id, quantity'),
    supabase.from('contact_messages').select('id, is_read').eq('is_read', false),
  ]);

  const totalBudget = (budgets.data ?? []).reduce((sum: number, b: any) => sum + (b.type === 'income' ? b.amount : -b.amount), 0);
  const totalInventory = (inventory.data ?? []).reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);

  return {
    activeMembers: members.data?.length ?? 0,
    totalEvents: upcomingEvents.data?.length ?? 0,
    pendingTasks: (tasks.data ?? []).filter((t: any) => t.status !== 'completed').length,
    pendingApplications: applications.data?.length ?? 0,
    totalBudget,
    totalInventory,
    // Previously this pulled from an unrelated `activity_logs` query (capped
    // at 1 row) instead of the actual unread contact_messages count, due to
    // a variable-position mismatch — it always showed 0 or 1 regardless of
    // real unread messages.
    unreadContacts: unreadMessages.data?.length ?? 0,
  };
}