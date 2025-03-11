/**
 * Server-side API client for communicating with the backend
 * This file should only be imported in Server Components
 */

// We use Next.js server environment
// Import cookies conditionally to avoid "Cannot use import statement outside a module" error
let cookies: any;
try {
  // This will only work in a Next.js Server Component context
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const headers = require('next/headers');
  cookies = headers.cookies;
} catch (e) {
  // This block will run during build/static analysis but not at runtime
  console.warn('next/headers module not available, server-side cookies will not work');
}

// Backend URL for server-to-server communication inside Docker
const SERVER_API_URL = 'http://backend:8000/api';

// For development mode only - this should be handled properly in production
const DEV_MODE = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development';

// For development, we'll create a token for the test user
// This would never be done in production, it's just for development convenience
let devToken: string | null = null;

/**
 * Generates a valid JWT token for the test user for development purposes
 */
async function getDevToken(): Promise<string | null> {
  if (!DEV_MODE) return null;
  
  if (devToken) return devToken;
  
  try {
    // First, ensure the test user exists
    await fetch(`${SERVER_API_URL}/dev-setup`, {
      cache: 'no-store'
    });
    
    // Now login to get a token
    const response = await fetch(`${SERVER_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        username: "test@example.com",
        password: "password123"
      }),
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('[Server API] Failed to get dev token', await response.text());
      return null;
    }
    
    const data = await response.json();
    devToken = data.access_token;
    return devToken;
  } catch (error) {
    console.error('[Server API] Error getting dev token:', error);
    return null;
  }
}

/**
 * Get authentication headers from cookies or dev token
 */
async function getAuthHeaders(): Promise<Record<string, string> | undefined> {
  try {
    // In development mode, try to use a development token
    if (DEV_MODE) {
      const token = await getDevToken();
      if (token) {
        return {
          'Authorization': `Bearer ${token}`
        };
      }
    }
    
    // For production, use cookies
    if (typeof cookies === 'function') {
      try {
        const cookieStore = cookies();
        const token = cookieStore.get('wealthsphere_access_token')?.value;
        
        if (!token) {
          console.warn('[Server API] No auth token found in cookies');
          return undefined;
        }
        
        return {
          'Authorization': `Bearer ${token}`
        };
      } catch (e) {
        console.error('[Server API] Error accessing cookies:', e);
        return undefined;
      }
    } else {
      console.warn('[Server API] Cookies API not available');
      return undefined;
    }
  } catch (error) {
    console.error('[Server API] Error getting auth headers:', error);
    return undefined;
  }
}

/**
 * Handle response from the API
 */
async function handleResponse(response: Response) {
  // Handle non-200 responses
  if (!response.ok) {
    // Try to extract error message from response body, if any
    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    } catch (e) {
      // If response body can't be parsed as JSON, throw generic error
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // For 204 No Content
  if (response.status === 204) {
    return null;
  }

  // For other successful responses, return JSON
  return response.json();
}

/**
 * Generic fetch wrapper for API calls with retry for auth errors
 */
async function fetchServerAPI<T>(
  endpoint: string, 
  options: RequestInit = {},
  retryCount = 0
): Promise<T> {
  const url = `${SERVER_API_URL}${endpoint}`;
  
  // Get authentication headers from cookies or dev token
  const authHeaders = await getAuthHeaders();
  
  console.log(`[Server] API Request: ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
    // Needed for server-side fetching in Next.js
    cache: 'no-store'
  });

  // If we get a 401 in development mode and haven't retried yet, try again
  // This handles the case where the token needs to be generated first
  if (DEV_MODE && response.status === 401 && retryCount === 0) {
    console.log('[Server] Retrying API request after 401 in development mode');
    
    // Clear the dev token to force a new one
    devToken = null;
    
    // Wait a moment and retry
    await new Promise(resolve => setTimeout(resolve, 500));
    return fetchServerAPI(endpoint, options, retryCount + 1);
  }

  return handleResponse(response);
}

/**
 * Server-side API client with methods for different endpoints
 * This should only be used in Server Components
 */
export const serverApi = {
  // Basic CRUD operations
  get: <T>(endpoint: string) => 
    fetchServerAPI<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, data: any) => 
    fetchServerAPI<T>(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  put: <T>(endpoint: string, data: any) => 
    fetchServerAPI<T>(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
  
  delete: <T>(endpoint: string) => 
    fetchServerAPI<T>(endpoint, { method: 'DELETE' }),
}; 