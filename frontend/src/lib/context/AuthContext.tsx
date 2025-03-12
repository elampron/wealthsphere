'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, getUser, login, logout, signup, isAuthenticated, getAccessToken } from '../auth';
import { LoginCredentials, SignupData } from '../auth';
import { useToast } from '../../components/ui/use-toast';

// Access token storage key
const USER_KEY = 'wealthsphere_user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
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
  const { toast } = useToast();
  const isMounted = useRef(true);

  useEffect(() => {
    // Set isMounted to true when the component mounts
    isMounted.current = true;
    
    // Check for existing user on mount
    const initAuth = async () => {
      try {
        const storedUser = getUser();
        if (storedUser && isMounted.current) {
          setUser(storedUser);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Clear any potentially corrupted data
        localStorage.removeItem(USER_KEY);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    initAuth();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Login handler
  const handleLogin = async (credentials: LoginCredentials): Promise<boolean> => {
    if (isMounted.current) setIsLoading(true);
    try {
      const response = await login(credentials);
      if (isMounted.current) {
        setUser(response.user);
        toast({
          title: "Login successful",
          description: `Welcome back, ${response.user.first_name}!`,
        });
      }
      return true;
    } catch (error) {
      console.error("Login error:", error);
      if (isMounted.current) {
        toast({
          title: "Login failed",
          description: error instanceof Error ? error.message : "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  // Signup handler
  const handleSignup = async (data: SignupData): Promise<boolean> => {
    if (isMounted.current) setIsLoading(true);
    try {
      const response = await signup(data);
      if (isMounted.current) {
        setUser(response.user);
        toast({
          title: "Account created",
          description: `Welcome to WealthSphere, ${response.user.first_name}!`,
        });
      }
      return true;
    } catch (error) {
      console.error("Signup error:", error);
      if (isMounted.current) {
        toast({
          title: "Sign up failed",
          description: error instanceof Error ? error.message : "Please check your information and try again.",
          variant: "destructive",
        });
      }
      return false;
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    if (isMounted.current) {
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    }
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