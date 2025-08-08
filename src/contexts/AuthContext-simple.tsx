import React, { createContext, useContext, useState, useEffect } from 'react';

interface IUser {
  _id: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthUser extends IUser {
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
  const [loading, setLoading] = useState(false);

  const register = async (email: string, password: string, name: string, role: string) => {
    setLoading(true);
    try {
      console.log('Simulating registration...', { email, name, role });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful registration
      const newUser = {
        _id: `user_${Date.now()}`,
        email,
        fullName: name,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AuthUser;

      const token = `token_${Date.now()}`;
      
      localStorage.setItem('authToken', token);
      setUser(newUser);
      setSession({ token });

      console.log('Registration successful:', newUser);
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
      // Simulate login
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const userData = {
        _id: 'user_login',
        email,
        fullName: 'Test User',
        role: 'client',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AuthUser;

      const token = `token_${Date.now()}`;
      
      localStorage.setItem('authToken', token);
      setUser(userData);
      setSession({ token });
      
      console.log('Login successful:', userData);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('authToken');
      setUser(null);
      setSession(null);
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Logout failed');
    }
  };

  const signOut = logout;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile: user,
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