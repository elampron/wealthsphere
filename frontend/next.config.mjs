/** @type {import('next').NextConfig} */
const nextConfig = {
  // Using src directory
  distDir: '.next',
  
  // Disable ESLint during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript type checking during build
  typescript: {
    // Warning: This allows production builds to successfully complete even if your project has type errors.
    ignoreBuildErrors: true,
  },
  // Output standalone for Docker compatibility
  output: 'standalone',
  // Server-specific environment variables
  serverRuntimeConfig: {
    // Will only be available on the server side
    apiUrl: process.env.NEXT_SERVER_API_URL || 'http://backend:8000/api',
  },
  // Environment variables available on both client and server
  publicRuntimeConfig: {
    // Will be available on both server and client
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  },
};

export default nextConfig; 