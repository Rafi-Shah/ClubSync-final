import { supabase } from '../lib/supabase';

// ============ ACTIVITY LOGGING ============
// activity_logs previously had no insert path anywhere in the codebase —
// getActivityLogs() only reads. This fires a best-effort log row on every
// mutating admin action below. It never throws or blocks the calling
// function: if logging fails (e.g. a transient network hiccup), the actual
// action the admin performed still succeeds and isn't rolled back for it.
async function logActivity(action: string, entityType: string, entityId: string | null, description: string) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('activity_logs').insert({
      user_id: userData?.user?.id ?? null,
      portal: 'admin',
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
    });
  } catch {
    // Logging must never break the actual admin action — swallow silently.
  }
}

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
  logActivity('update', 'member', id, `Updated member profile`);
}

// Deletes a member completely: their user_roles assignment, their members
// row, and their actual login (auth.users) — via an Edge Function, since
// deleting an auth user requires the service role key which client-side
// code can't use directly. The old version only deleted the members row,
// so the account could still log in afterwards even though it no longer
// showed up in Member Management.
export async function deleteMember(id: string) {
  const { data, error } = await supabase.functions.invoke('delete-member-account', {
    body: { member_id: id },
  });
  if (error) {
    let message = error.message;
    const ctx = (error as any)?.context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = await ctx.json();
        if (body?.error) message = body.error;
      } catch {
        // response body wasn't JSON — fall back to the generic message
      }
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  logActivity('delete', 'member', id, `Deleted member and revoked login access`);
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
  logActivity('create', 'member', data?.member_id ?? null, `Created account for ${input.full_name} (${input.email})`);
  return data;
}

export async function assignRole(userId: string, roleId: number) {
  const { error } = await supabase.from('user_roles').insert({ user_id: userId, role_id: roleId });
  if (error) throw error;
  logActivity('update', 'user_role', userId, `Assigned role ${roleId} to user`);
}

export async function removeRole(userId: string, roleId: number) {
  const { error } = await supabase.from('user_roles').delete()
    .eq('user_id', userId).eq('role_id', roleId);
  if (error) throw error;
  logActivity('update', 'user_role', userId, `Removed role ${roleId} from user`);
}

// ============ MEMBER EMAIL (auth-synced) ============
// Changing a member's login email requires the Supabase Admin API
// (auth.admin.updateUserById), which only works with the service role key —
// client-side code can't call it directly. This invokes an Edge Function
// that updates both auth.users.email and members.email together, so they
// never drift out of sync (which is what caused "email changed in the
// directory but login still uses the old address").
export async function updateMemberEmail(memberId: string, newEmail: string) {
  const { data, error } = await supabase.functions.invoke('update-member-email', {
    body: { member_id: memberId, new_email: newEmail },
  });
  if (error) {
    let message = error.message;
    const ctx = (error as any)?.context;
    if (ctx && typeof ctx.json === 'function') {
      try {
        const body = await ctx.json();
        if (body?.error) message = body.error;
      } catch {
        // response body wasn't JSON — fall back to the generic message
      }
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  logActivity('update', 'member', memberId, `Changed login email to ${newEmail}`);
  return data;
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
  logActivity('create', 'department', data?.id ?? null, `Created department "${input.name}"`);
  return data;
}

export async function updateDepartment(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('departments').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'department', id, `Updated department`);
}

export async function deleteDepartment(id: string) {
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'department', id, `Deleted department`);
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
  logActivity('create', 'team', data?.id ?? null, `Created team "${input.name}"`);
  return data;
}

export async function updateTeam(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('teams').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'team', id, `Updated team`);
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'team', id, `Deleted team`);
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
  logActivity('create', 'executive_committee', data?.id ?? null, `Added executive position "${input.position}"`);
  return data;
}

export async function updateExecutive(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('executive_committee').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'executive_committee', id, `Updated executive committee entry`);
}

export async function deleteExecutive(id: string) {
  const { error } = await supabase.from('executive_committee').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'executive_committee', id, `Removed executive committee entry`);
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
  logActivity('create', 'recruitment', data?.id ?? null, `Created recruitment drive "${input.title}"`);
  return data;
}

export async function updateRecruitment(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('recruitments').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'recruitment', id, `Updated recruitment drive`);
}

export async function deleteRecruitment(id: string) {
  const { error } = await supabase.from('recruitments').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'recruitment', id, `Deleted recruitment drive`);
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
  logActivity('update', 'application', id, `Updated application status`);
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
  logActivity('create', 'event', data?.id ?? null, `Created event "${input.title ?? ''}"`);
  return data;
}

export async function updateEvent(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('events').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'event', id, `Updated event`);
}

export async function deleteEvent(id: string) {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'event', id, `Deleted event`);
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
  logActivity('create', 'meeting', data?.id ?? null, `Scheduled meeting "${input.title ?? ''}"`);
  return data;
}

export async function updateMeeting(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('meetings').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'meeting', id, `Updated meeting`);
}

export async function deleteMeeting(id: string) {
  const { error } = await supabase.from('meetings').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'meeting', id, `Deleted meeting`);
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
  logActivity('create', 'task', data?.id ?? null, `Created task "${input.title ?? ''}"`);
  return data;
}

export async function updateTask(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('tasks').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'task', id, `Updated task`);
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'task', id, `Deleted task`);
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
  logActivity('create', 'attendance', data?.id ?? null, `Recorded attendance`);
  return data;
}

export async function updateAttendance(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('attendance').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'attendance', id, `Updated attendance record`);
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
  logActivity('create', 'budget', data?.id ?? null, `Recorded ${input.type ?? ''} transaction of ${input.amount ?? ''}`);
  return data;
}

export async function updateBudget(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('budgets').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'budget', id, `Updated budget entry`);
}

export async function deleteBudget(id: string) {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'budget', id, `Deleted budget entry`);
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
  logActivity('create', 'inventory_item', data?.id ?? null, `Added inventory item "${input.name ?? ''}"`);
  return data;
}

export async function updateInventoryItem(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('inventory_items').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'inventory_item', id, `Updated inventory item`);
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'inventory_item', id, `Deleted inventory item`);
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
  logActivity('create', 'resource_booking', data?.id ?? null, `Created resource booking`);
  return data;
}

export async function updateResourceBooking(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('resource_bookings').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'resource_booking', id, `Updated resource booking`);
}

export async function deleteResourceBooking(id: string) {
  const { error } = await supabase.from('resource_bookings').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'resource_booking', id, `Deleted resource booking`);
}

// ============ CERTIFICATES ============
export async function getCertificates() {
  const { data, error } = await supabase
    .from('certificates')
    // certificates has two FKs to members (member_id and
    // issued_by_member_id), so the embed must be disambiguated with
    // !constraint_name or PostgREST throws "more than one relationship
    // was found".
    .select('*, member:members!certificates_member_id_fkey(id, full_name), event:events(id, title)')
    .order('issued_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCertificate(input: Record<string, any>) {
  const { data, error } = await supabase.from('certificates').insert(input).select().single();
  if (error) throw error;
  logActivity('create', 'certificate', data?.id ?? null, `Issued certificate "${input.title ?? ''}"`);
  return data;
}

export async function deleteCertificate(id: string) {
  const { error } = await supabase.from('certificates').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'certificate', id, `Deleted certificate`);
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
  logActivity('create', 'report', data?.id ?? null, `Generated ${input.type ?? ''} report "${input.title ?? ''}"`);
  return data;
}

export async function deleteReport(id: string) {
  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'report', id, `Deleted report`);
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
  logActivity('create', 'gallery_item', data?.id ?? null, `Added gallery item`);
  return data;
}

export async function updateGalleryItem(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('gallery_items').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'gallery_item', id, `Updated gallery item`);
}

export async function deleteGalleryItem(id: string) {
  const { error } = await supabase.from('gallery_items').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'gallery_item', id, `Deleted gallery item`);
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
  logActivity('update', 'site_settings', id, `Updated site settings`);
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
  logActivity('update', 'about_content', id, `Updated about page content`);
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
  logActivity('create', 'achievement', data?.id ?? null, `Added achievement`);
  return data;
}

export async function updateAchievement(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('achievements').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'achievement', id, `Updated achievement`);
}

export async function deleteAchievement(id: string) {
  const { error } = await supabase.from('achievements').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'achievement', id, `Deleted achievement`);
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
  logActivity('create', 'sponsor', data?.id ?? null, `Added sponsor "${input.name ?? ''}"`);
  return data;
}

export async function updateSponsor(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('sponsors').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'sponsor', id, `Updated sponsor`);
}

export async function deleteSponsor(id: string) {
  const { error } = await supabase.from('sponsors').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'sponsor', id, `Deleted sponsor`);
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
  logActivity('create', 'faq', data?.id ?? null, `Added FAQ`);
  return data;
}

export async function updateFaq(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('faqs').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'faq', id, `Updated FAQ`);
}

export async function deleteFaq(id: string) {
  const { error } = await supabase.from('faqs').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'faq', id, `Deleted FAQ`);
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
  logActivity('update', 'contact_message', id, `Marked contact message as read`);
}

// ============ ROLES & PERMISSIONS ============
export async function getRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('sort_order');
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
    logActivity('update', 'role_permission', String(roleId), `Enabled permission ${permissionId} for role ${roleId}`);
  } else {
    const { error } = await supabase.from('role_permissions').delete()
      .eq('role_id', roleId).eq('permission_id', permissionId);
    if (error) throw error;
    logActivity('update', 'role_permission', String(roleId), `Disabled permission ${permissionId} for role ${roleId}`);
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
  logActivity('create', 'conversation', data?.id ?? null, `Created broadcast conversation "${title}"`);
  return data;
}

export async function createGroupChat(title: string, creatorMemberId: string) {
  // The conversations.conversation_type CHECK constraint only allows
  // 'direct', 'team', 'executive', 'broadcast' — 'group' was never a valid
  // value and always violated the constraint. 'team' is the correct type
  // for a multi-member group conversation.
  const { data, error } = await supabase.from('conversations')
    .insert({ conversation_type: 'team', title, created_by_member_id: creatorMemberId })
    .select().single();
  if (error) throw error;
  logActivity('create', 'conversation', data?.id ?? null, `Created group chat "${title}"`);
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
  logActivity('update', 'conversation', conversationId, `Added a participant to conversation`);
}
export async function deleteConversation(conversationId: string) {
  // Delete dependent rows first — in case there's no ON DELETE CASCADE set
  // on these foreign keys, deleting the conversation directly would fail
  // or leave orphaned messages/participants behind.
  const { error: msgErr } = await supabase.from('messages').delete().eq('conversation_id', conversationId);
  if (msgErr) throw msgErr;
  const { error: partErr } = await supabase.from('conversation_participants').delete().eq('conversation_id', conversationId);
  if (partErr) throw partErr;
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
  if (error) throw error;
  logActivity('delete', 'conversation', conversationId, `Deleted conversation`);
}

// ============ NOTIFICATIONS (broadcast) ============
export async function broadcastNotification(userIds: string[], type: string, title: string, body: string, link?: string) {
  const rows = userIds.map(uid => ({ user_id: uid, type, title, body, link }));
  const { error } = await supabase.from('notifications').insert(rows);
  if (error) throw error;
  logActivity('create', 'notification', null, `Broadcast "${title}" sent to ${userIds.length} recipient(s)`);
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
  logActivity('create', 'routine', data?.id ?? null, `Added routine entry`);
  return data;
}

export async function updateRoutine(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('routines').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'routine', id, `Updated routine entry`);
}

export async function deleteRoutine(id: string) {
  const { error } = await supabase.from('routines').delete().eq('id', id);
  if (error) throw error;
  logActivity('delete', 'routine', id, `Deleted routine entry`);
}

// ============ AVAILABILITY FINDER ============

export interface AvailabilitySearchParams {
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  roleSlugs?: string[];
  departmentIds?: string[];
  batch?: string;
  semester?: string;
  committeeOnly?: boolean;
  position?: string;
  search?: string;
  onlyAvailable?: boolean;
  limit?: number;
}

export interface AvailabilityResult {
  member_id: string;
  member_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  batch: string | null;
  semester: string | null;
  department_names: string | null;
  role_names: string;
  position_title: string;
  is_available: boolean;
  conflict_title: string | null;
  conflict_start: string | null;
  conflict_end: string | null;
}

/**
 * Wraps the find_available_members() Postgres function. The overlap
 * computation happens inside Postgres against indexed columns — this never
 * pulls the full routines table to the client.
 */
export async function findAvailableMembers(params: AvailabilitySearchParams): Promise<AvailabilityResult[]> {
  const { data, error } = await supabase.rpc('find_available_members', {
    p_day_of_week: params.dayOfWeek,
    p_start_minutes: params.startMinutes,
    p_end_minutes: params.endMinutes,
    p_role_slugs: params.roleSlugs ?? null,
    p_department_ids: params.departmentIds ?? null,
    p_batch: params.batch ?? null,
    p_semester: params.semester ?? null,
    p_committee_only: params.committeeOnly ?? null,
    p_position: params.position ?? null,
    p_search: params.search ?? null,
    p_only_available: params.onlyAvailable ?? null,
    p_limit: params.limit ?? 200,
  });
  if (error) throw error;
  return (data ?? []) as AvailabilityResult[];
}

// ============ VOLUNTEER HOURS ============
export async function getAllVolunteerHours() {
  const { data, error } = await supabase
    .from('volunteer_hours')
    // volunteer_hours has two FKs to members (member_id and
    // approved_by_member_id), so the embed must be disambiguated with
    // !constraint_name or PostgREST throws "more than one relationship
    // was found" — matching the pattern already used elsewhere in this
    // file (tasks, events, meetings, etc.).
    .select('*, member:members!volunteer_hours_member_id_fkey(id, full_name), event:events(id, title)')
    .order('activity_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateVolunteerHours(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from('volunteer_hours').update(updates).eq('id', id);
  if (error) throw error;
  logActivity('update', 'volunteer_hours', id, `Updated volunteer hours entry`);
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
  logActivity('update', 'idea', id, `Updated idea status`);
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
  logActivity('create', 'performance_metric', data?.id ?? null, `Recorded performance metric`);
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
// ============ DEVELOPER TEAM ============
export async function getDevelopers() {
  const { data, error } = await supabase
    .from("developer_team")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createDeveloper(input: Record<string, any>) {
  const { data, error } = await supabase.from("developer_team").insert(input).select().single();
  if (error) throw error;
  logActivity("create", "developer_team", data?.id ?? null, `Added developer`);
  return data;
}

export async function updateDeveloper(id: string, updates: Record<string, any>) {
  const { error } = await supabase.from("developer_team").update(updates).eq("id", id);
  if (error) throw error;
  logActivity("update", "developer_team", id, `Updated developer`);
}

export async function deleteDeveloper(id: string) {
  const { error } = await supabase.from("developer_team").delete().eq("id", id);
  if (error) throw error;
  logActivity("delete", "developer_team", id, `Deleted developer`);
}

