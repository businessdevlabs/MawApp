import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService, type User } from '@/services/api';

interface AuthUser extends User {
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: AuthUser | null;
  session: { token: string } | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
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
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            const userData = await apiService.verifyToken(token);
            setUser(userData as AuthUser);
            setSession({ token });
          } catch (error) {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
            console.log('Invalid token removed');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const register = async (email: string, password: string, name: string, role: string) => {
    setLoading(true);
    try {
      console.log('Starting registration process...', {
        email,
        name,
        role
      });

      const { user: newUser, token } = await apiService.register({
        email,
        password,
        fullName: name,
        role: role as 'client' | 'provider' | 'admin'
      });

      // Store token and set user state
      localStorage.setItem('authToken', token);
      setUser(newUser as AuthUser);
      setSession({ token });

      console.log('Registration successful:', newUser.email);
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
      const { user: userData, token } = await apiService.login({
        email,
        password
      });

      // Store token and set user state
      localStorage.setItem('authToken', token);
      setUser(userData as AuthUser);
      setSession({ token });
      
      console.log('Login successful:', userData.email);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      
      // Remove token and clear state
      localStorage.removeItem('authToken');
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