/**
 * Authentication module for handling user login, signup, and token management
 */

import { api } from './api/api';

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type SignupData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

// Token storage keys
const ACCESS_TOKEN_KEY = 'wealthsphere_access_token';
const USER_KEY = 'wealthsphere_user';

/**
 * Store authentication data in both localStorage and cookies
 */
export function storeAuthData(authResponse: Partial<AuthResponse>): void {
  if (authResponse.access_token) {
    // Store in localStorage for easy JS access
    localStorage.setItem(ACCESS_TOKEN_KEY, authResponse.access_token);
    
    // Store in cookies for middleware access
    document.cookie = `${ACCESS_TOKEN_KEY}=${authResponse.access_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
  }
  
  if (authResponse.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
  }
}

/**
 * Clear authentication data from both localStorage and cookies
 */
export function clearAuthData(): void {
  // Clear from localStorage
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  
  // Clear from cookies
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

/**
 * Get the stored access token
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * Get the stored user data
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem(USER_KEY);
  if (!userData || userData === "undefined" || userData === "null") return null;
  
  try {
    return JSON.parse(userData) as User;
  } catch (e) {
    console.error('Failed to parse user data', e);
    // Clear invalid data to prevent future errors
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  
  // Don't necessarily require a user object
  // Some operations may only need a valid token
  return true;
}

/**
 * Login the user
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  // Format credentials to match OAuth2PasswordRequestForm expected by FastAPI
  const formData = new FormData();
  formData.append('username', credentials.email); // FastAPI expects 'username' but we use 'email'
  formData.append('password', credentials.password);
  
  // Use custom fetch for FormData instead of JSON
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/login`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage = errorData?.detail || `Login failed: ${response.status}`;
    throw new Error(errorMessage);
  }
  
  const tokenResponse = await response.json();
  
  // Store the token first
  storeAuthData({ 
    access_token: tokenResponse.access_token,
    token_type: tokenResponse.token_type 
  });
  
  // Then fetch the user data with the token
  const userResponse = await api.get<User>('/auth/me');
  
  // Store the complete auth data
  const authResponse = {
    ...tokenResponse,
    user: userResponse
  };
  
  storeAuthData({ user: userResponse });
  
  return authResponse as AuthResponse;
}

/**
 * Sign up a new user
 */
export async function signup(data: SignupData): Promise<AuthResponse> {
  // First register the user
  await api.post<User>('/auth/register', data);
  
  // Then login to get the token
  return login({ 
    email: data.email, 
    password: data.password 
  });
}

/**
 * Logout the user
 */
export function logout(): void {
  clearAuthData();
  // Add additional logout logic here if needed
}

/**
 * Add authorization header to requests
 */
export function getAuthHeader(): Record<string, string> | undefined {
  const token = getAccessToken();
  if (!token) return undefined;
  
  return {
    Authorization: `Bearer ${token}`,
  };
} 