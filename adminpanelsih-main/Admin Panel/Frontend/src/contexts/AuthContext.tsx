import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface UserSession {
  location: string;
  lastLogin: Date;
}

interface AuthContextType {
  user: User | null;
  userSession: UserSession | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, otp: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedSession = localStorage.getItem('userSession');
    
    if (storedUser && storedSession) {
      setUser(JSON.parse(storedUser));
      setUserSession({
        ...JSON.parse(storedSession),
        lastLogin: new Date(JSON.parse(storedSession).lastLogin)
      });
    }
    
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, otp: string): Promise<boolean> => {
    // Mock authentication - in real app, this would call an API
    if (email === 'ishaan.saxena@mca.gov.in' && password === 'password' && otp === '123456') {
      const mockUser: User = {
        id: 1,
        name: 'Ishaan Saxena',
        email: 'ishaan.saxena@mca.gov.in',
        role: 'Policy Analyst',
        avatar: 'https://placehold.co/40x40/E2E8F0/475569?text=I'
      };

      const mockSession: UserSession = {
        location: 'Delhi, India',
        lastLogin: new Date()
      };

      setUser(mockUser);
      setUserSession(mockSession);
      
      // Store in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('userSession', JSON.stringify(mockSession));
      
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    setUserSession(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userSession');
  };

  const value: AuthContextType = {
    user,
    userSession,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};