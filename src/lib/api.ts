import { supabase } from '../lib/supabase';
import type {
  SiteSettings, AboutBlock, GalleryItem, Achievement, Sponsor, Faq,
  ClubEvent, Department, ExecutiveWithProfile, Recruitment,
} from '../types';

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const { data, error } = await supabase
    .from('site_settings').select('*').limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAboutBlocks(): Promise<AboutBlock[]> {
  const { data, error } = await supabase
    .from('about_content').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const { data, error } = await supabase
    .from('gallery_items').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAchievements(): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from('achievements').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getSponsors(): Promise<Sponsor[]> {
  const { data, error } = await supabase
    .from('sponsors').select('*').eq('is_active', true).order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getFaqs(): Promise<Faq[]> {
  const { data, error } = await supabase
    .from('faqs').select('*').order('sort_order', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getPublicEvents(): Promise<ClubEvent[]> {
  const { data, error } = await supabase
    .from('events').select('*').eq('is_public', true).order('start_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments').select('*').eq('is_active', true).order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getExecutiveCommittee(): Promise<ExecutiveWithProfile[]> {
  const { data: execRows, error } = await supabase
    .from('executive_committee')
    .select('id, member_id, position, term_start, term_end, is_active')
    .eq('is_active', true)
    .order('term_start', { ascending: true });
  if (error) throw error;
  if (!execRows || execRows.length === 0) return [];

  // Fetch name/avatar/bio from the public-safe view (not the members table
  // directly) — anon visitors have no SELECT access on members itself, so
  // an embedded join through the FK returned null for every field here,
  // showing "Unknown" for everyone once logged out.
  const memberIds = execRows.map((r) => r.member_id);
  const { data: profiles, error: profileErr } = await supabase
    .from('public_member_profiles')
    .select('id, full_name, avatar_url, bio')
    .in('id', memberIds);
  if (profileErr) throw profileErr;

  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  return execRows.map((r) => ({
    ...r,
    member: profileById.get(r.member_id) ?? null,
  })) as unknown as ExecutiveWithProfile[];
}

export async function getOpenRecruitments(): Promise<Recruitment[]> {
  const { data, error } = await supabase
    .from('recruitments').select('*').eq('status', 'open').order('open_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function submitContactMessage(input: {
  name: string; email: string; subject: string; message: string;
}): Promise<void> {
  const { error } = await supabase.from('contact_messages').insert(input);
  if (error) throw error;
}

export async function submitApplication(input: {
  recruitment_id: string; applicant_name: string; applicant_email: string;
  applicant_phone: string | null; student_id: string | null;
  department_preference: string | null; motivation: string | null; experience: string | null;
  cv_url?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('applications').insert({
    ...input, status: 'submitted',
  });
  if (error) throw error;
}
export async function getPublicDevelopers() {
  const { data, error } = await supabase
    .from("developer_team")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

