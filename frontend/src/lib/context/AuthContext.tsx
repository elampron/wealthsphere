'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, getUser, login, logout, signup, isAuthenticated, getAccessToken } from '../auth';
import { LoginCredentials, SignupData } from '../auth';
import { useToast } from '@/components/ui/use-toast';

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
  const { addToast } = useToast();
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
        if (isMounted.current) {
          addToast({
            title: "Error",
            description: "Failed to load user data",
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, [addToast]);

  const handleLogin = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const success = await login(credentials);
      if (success) {
        const user = getUser();
        if (user) {
          setUser(user);
          addToast({
            title: "Success",
            description: "Logged in successfully",
          });
          return true;
        }
      }
      addToast({
        title: "Error",
        description: "Invalid credentials",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to log in",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSignup = async (data: SignupData): Promise<boolean> => {
    try {
      const success = await signup(data);
      if (success) {
        addToast({
          title: "Success",
          description: "Account created successfully",
        });
        return true;
      }
      addToast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    addToast({
      title: "Success",
      description: "Logged out successfully",
    });
  };

  const value = {
    user,
    isLoading,
    isLoggedIn: isAuthenticated(),
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 