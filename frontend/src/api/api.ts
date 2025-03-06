/**
 * API client for communicating with the FastAPI backend
 */

// Import Next.js config (this works in both client and server contexts)
import getConfig from 'next/config';

// Extract runtime config values
const { serverRuntimeConfig, publicRuntimeConfig } = getConfig() || {
  serverRuntimeConfig: {},
  publicRuntimeConfig: {}
};

// For server-side requests within Docker network
const SERVER_API_URL = serverRuntimeConfig.apiUrl || 'http://backend:8000/api';
// For client-side browser requests
const CLIENT_API_URL = publicRuntimeConfig.apiUrl || 'http://localhost:8000/api';

/**
 * Determine if code is running on server or client
 */
const isServer = typeof window === 'undefined';

/**
 * Get the appropriate API URL based on environment
 */
const getApiUrl = () => {
  // Use SERVER_API_URL for server-side requests, CLIENT_API_URL for client-side
  const url = isServer ? SERVER_API_URL : CLIENT_API_URL;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] Using ${isServer ? 'server-side' : 'client-side'} API URL: ${url}`);
  }
  return url;
};

/**
 * Helper function to get auth headers if available
 */
function getAuthHeaders(): Record<string, string> | undefined {
  if (typeof window === 'undefined') return undefined;
  
  try {
    // Import dynamically to avoid circular dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAuthHeader } = require('../auth');
    return getAuthHeader();
  } catch (e) {
    console.error('Failed to get auth headers', e);
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
 * Generic fetch wrapper for API calls
 */
async function fetchAPI<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${getApiUrl()}${endpoint}`;
  
  // Get authentication headers
  const authHeaders = getAuthHeaders();
  
  console.log(`API Request: ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });

  const result = await handleResponse(response);
  console.log(`API Response from ${endpoint}:`, result);
  return result;
}

/**
 * API client with methods for different endpoints
 */
export const api = {
  // Basic CRUD operations
  get: <T>(endpoint: string) => 
    fetchAPI<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, data: any) => 
    fetchAPI<T>(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  put: <T>(endpoint: string, data: any) => 
    fetchAPI<T>(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
  
  delete: <T>(endpoint: string) => 
    fetchAPI<T>(endpoint, { method: 'DELETE' }),
};