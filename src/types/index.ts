export interface SiteSettings {
  id: string;
  club_name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  social_links: Record<string, string> | null;
}

export interface AboutBlock {
  id: string;
  block_key: string;
  title: string;
  body: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface GalleryItem {
  id: string;
  title: string | null;
  image_url: string;
  category: string;
  description: string | null;
  sort_order: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string | null;
  award_date: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

export interface ClubEvent {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string | null;
  status: string;
  is_public: boolean;
  cover_image_url: string | null;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

export interface ExecutiveMember {
  id: string;
  member_id: string;
  position: string;
  term_start: string;
  term_end: string | null;
  is_active: boolean;
}

export interface ExecutiveWithProfile extends ExecutiveMember {
  member?: { full_name: string; email: string; avatar_url: string | null; bio: string | null } | null;
}

export interface Recruitment {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  requirements: string | null;
  open_at: string;
  close_at: string | null;
  status: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface Application {
  id?: string;
  recruitment_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  student_id: string | null;
  department_preference: string | null;
  motivation: string | null;
  experience: string | null;
  status?: string;
}
