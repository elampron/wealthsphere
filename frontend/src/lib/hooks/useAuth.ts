import { useState, useEffect } from 'react';
import { isAuthenticated as checkAuth, getUser, User } from '@/lib/auth';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function checkAuthState() {
      const authenticated = checkAuth();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        setUser(getUser());
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    }

    // Check immediately
    checkAuthState();

    // Set up interval to check periodically
    const interval = setInterval(checkAuthState, 60000); // Check every minute

    // Cleanup
    return () => clearInterval(interval);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    user
  };
} 