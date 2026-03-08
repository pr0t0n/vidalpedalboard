import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
}

interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async (userId: string) => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);
      const isAdmin = roles?.some((r: any) => r.role === 'admin') || false;
      return { profile: profile as UserProfile | null, isAdmin };
    };

    // Listener for ONGOING auth changes (does NOT control isLoading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        if (session?.user) {
          // Fire and forget - don't set loading
          fetchUserData(session.user.id).then(({ profile, isAdmin }) => {
            if (isMounted) {
              setState({ user: session.user, profile, isAdmin, isLoading: false });
            }
          });
        } else {
          setState({ user: null, profile: null, isAdmin: false, isLoading: false });
        }
      }
    );

    // INITIAL load (controls isLoading)
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          const { profile, isAdmin } = await fetchUserData(session.user.id);
          if (isMounted) {
            setState({ user: session.user, profile, isAdmin, isLoading: false });
          }
        } else {
          if (isMounted) {
            setState({ user: null, profile: null, isAdmin: false, isLoading: false });
          }
        }
      } catch {
        if (isMounted) {
          setState({ user: null, profile: null, isAdmin: false, isLoading: false });
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return { ...state, signIn, signOut };
}
