import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface MemberProfile {
  id: string;
  user_id: string;
  member_code: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  status: string;
  joined_at: string | null;
}

interface RoleInfo {
  slug: string;
  name: string;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  member: MemberProfile | null;
  roles: RoleInfo[];
  loading: boolean;
  /**
   * True only while a member/roles fetch for the current user is in flight
   * (initial load AND every subsequent auth-state change, e.g. sign-in).
   * Callers must gate on (loading || profileLoading) before treating
   * roles.length === 0 as "this user genuinely has no roles" — otherwise a
   * user is briefly misread as roleless during the async fetch window.
   */
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMember: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (uid: string) => {
    setProfileLoading(true);
    try {
      const [memberRes, rolesRes] = await Promise.all([
        supabase.from('members').select('*').eq('user_id', uid).maybeSingle(),
        supabase
          .from('user_roles')
          .select('role:roles(slug, name)')
          .eq('user_id', uid),
      ]);
      if (memberRes.data) setMember(memberRes.data as MemberProfile);
      else setMember(null);
      if (rolesRes.data) {
        const r = rolesRes.data.map((row: any) => row.role).filter(Boolean);
        setRoles(r);
      } else {
        setRoles([]);
      }
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) {
          await loadProfile(sess.user.id);
        } else {
          setMember(null);
          setRoles([]);
        }
      })();
    });

    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMember(null);
    setRoles([]);
  };

  const refreshMember = async () => {
    if (user) await loadProfile(user.id);
  };

  return (
    <Ctx.Provider value={{ user, session, member, roles, loading, profileLoading, signIn, signOut, refreshMember }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}