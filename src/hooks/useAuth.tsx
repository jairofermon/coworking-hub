import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  approved: boolean;
  isAdmin: boolean;
  isCliente: boolean;
  clienteId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function ensureProfile(user: User): Promise<void> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from('profiles').insert({
      user_id: user.id,
      full_name: user.user_metadata?.full_name ?? '',
      email: user.email ?? '',
      approved: false,
    });
    await supabase.from('user_roles').upsert(
      { user_id: user.id, role: 'user' },
      { onConflict: 'user_id,role' }
    );
  }
}

async function loadAuthUser(user: User): Promise<AuthUser> {
  await ensureProfile(user);

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, approved')
    .eq('user_id', user.id)
    .single();

  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);

  const isAdmin = roles?.some((r: any) => r.role === 'admin') ?? false;
  const isCliente = roles?.some((r: any) => r.role === 'cliente') ?? false;

  let clienteId: string | null = null;
  if (isCliente) {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    clienteId = (cliente as any)?.id ?? null;
  }

  return {
    id: user.id,
    email: user.email ?? '',
    fullName: profile?.full_name ?? '',
    approved: profile?.approved ?? false,
    isAdmin,
    isCliente,
    clienteId,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        setSession(session);
        if (session?.user) {
          setTimeout(async () => {
            if (!mounted) return;
            try {
              const authUser = await loadAuthUser(session.user);
              if (mounted) setUser(authUser);
            } catch (e) {
              console.error('Error loading user profile:', e);
              if (mounted) setUser(null);
            }
            if (mounted) setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        try {
          const authUser = await loadAuthUser(session.user);
          if (mounted) setUser(authUser);
        } catch (e) {
          console.error('Error loading user profile:', e);
          if (mounted) setUser(null);
        }
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
