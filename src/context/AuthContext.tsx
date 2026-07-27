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
  id: number;
  slug: string;
  name: string;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  member: MemberProfile | null;
  roles: RoleInfo[];
  /**
   * The union of every permission slug granted by any of the user's roles,
   * via role_permissions. This is what RoleManagement.tsx actually edits —
   * it MUST be the source of truth for what a user can access, not the
   * user's role slug alone. (Previously, every non-"member" role was
   * treated identically as "full admin" regardless of which permissions
   * were actually toggled on for it.)
   */
  permissions: Set<string>;
  hasPermission: (slug: string) => boolean;
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
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (uid: string) => {
    setProfileLoading(true);
    try {
      const [memberRes, rolesRes] = await Promise.all([
        supabase.from('members').select('*').eq('user_id', uid).maybeSingle(),
        supabase
          .from('user_roles')
          .select('role:roles(id, slug, name)')
          .eq('user_id', uid),
      ]);
      if (memberRes.data) setMember(memberRes.data as MemberProfile);
      else setMember(null);

      const r: RoleInfo[] = rolesRes.data
        ? rolesRes.data.map((row: any) => row.role).filter(Boolean)
        : [];
      setRoles(r);

      const roleIds = r.map((role) => role.id).filter(Boolean);
      if (roleIds.length > 0) {
        const { data: permRows } = await supabase
          .from('role_permissions')
          .select('permission:permissions(slug)')
          .in('role_id', roleIds);
        const slugs = (permRows ?? [])
          .map((row: any) => row.permission?.slug)
          .filter(Boolean) as string[];
        setPermissions(new Set(slugs));
      } else {
        setPermissions(new Set());
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
          setPermissions(new Set());
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
    setPermissions(new Set());
  };

  const refreshMember = async () => {
    if (user) await loadProfile(user.id);
  };

  const hasPermission = (slug: string) => permissions.has(slug);

  return (
    <Ctx.Provider value={{ user, session, member, roles, permissions, hasPermission, loading, profileLoading, signIn, signOut, refreshMember }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}