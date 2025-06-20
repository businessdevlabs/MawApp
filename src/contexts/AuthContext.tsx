
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;

interface AuthUser extends Profile {
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: AuthUser | null;  // Added profile property
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;  // Added signOut alias
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        
        if (session?.user) {
          // Fetch user profile from our profiles table
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            setUser({
              ...profile,
              email: session.user.email || profile.email
            });
          } else {
            console.error('Error fetching profile:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.email);
      // The onAuthStateChange will handle setting user and session
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (email: string, password: string, name: string, role: string) => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      console.log('Starting registration process...', {
        email,
        name,
        role,
        redirectUrl
      });

      console.log('email',
        'password', email,
        password,)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
            role: role
          }
        }
      });

      if (error) {
        console.error('Supabase registration error:', error);
        throw error;
      }

      console.log('Registration successful:', data.user?.email);
      
      if (data.user && !data.session) {
        // User needs to confirm email
        throw new Error('Please check your email and click the confirmation link to complete registration.');
      }
      
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      console.log('Login successful:', data.user?.email);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Logout failed');
    }
  };

  // signOut alias for logout
  const signOut = logout;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile: user, // profile is same as user 
      session, 
      login, 
      register, 
      logout, 
      signOut, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
