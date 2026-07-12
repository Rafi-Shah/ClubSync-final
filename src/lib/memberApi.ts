import { supabase } from '../lib/supabase';
import type { MemberProfile } from '../context/AuthContext';

export async function getMyTasks(memberId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to_member_id', memberId)
    .order('due_at', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyAttendance(memberId: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, event:events(id, title, start_at), meeting:meetings(id, title, start_at)')
    .eq('member_id', memberId)
    .order('recorded_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyCertificates(memberId: string) {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('member_id', memberId)
    .order('issued_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyVolunteerHours(memberId: string) {
  const { data, error } = await supabase
    .from('volunteer_hours')
    .select('*, event:events(id, title)')
    .eq('member_id', memberId)
    .order('activity_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyIdeas(memberId: string) {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyFeedback(memberId: string) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyRoutines(memberId: string) {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('member_id', memberId)
    .order('day_of_week', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getMyPerformance(memberId: string) {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('*')
    .eq('member_id', memberId)
    .order('period_start', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getMyRegistrations(memberId: string) {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*, event:events(*)')
    .eq('member_id', memberId)
    .order('registered_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getUpcomingMeetings() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('meetings')
    .select('*')
    .gte('start_at', now)
    .order('start_at', { ascending: true })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function getUpcomingEvents() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_public', true)
    .gte('start_at', now)
    .order('start_at', { ascending: true })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export async function getMyNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

export async function updateProfile(memberId: string, updates: Partial<MemberProfile>) {
  const { error } = await supabase.from('members').update(updates).eq('id', memberId);
  if (error) throw error;
}

export async function getAllMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('id, full_name, email, avatar_url, status')
    .eq('status', 'active')
    .order('full_name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}
