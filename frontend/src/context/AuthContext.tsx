'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getUser, login, logout, signup, isAuthenticated, getAccessToken } from '../auth';
import { LoginCredentials, SignupData } from '../auth';

// Access token storage key
const USER_KEY = 'wealthsphere_user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing user on mount
    try {
      const storedUser = getUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      // Clear any potentially corrupted data
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login handler
  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await login(credentials);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  // Signup handler
  const handleSignup = async (data: SignupData) => {
    setIsLoading(true);
    try {
      const response = await signup(data);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    isLoggedIn: !!getAccessToken(),
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 