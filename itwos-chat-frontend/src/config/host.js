/**
 * iOS-Compatible Host Configuration
 * 
 * This file provides a centralized configuration for all host/API URLs
 * that ensures iOS Safari compatibility.
 * 
 * CRITICAL RULES FOR iOS:
 * 1. NEVER use HTTP in production (iOS blocks it)
 * 2. Always use HTTPS URLs
 * 3. Environment variables must be available at BUILD_TIME
 * 4. Never fall back to localhost or HTTP
 */

/**
 * Get the API base URL
 * Always returns HTTPS in production for iOS compatibility
 */
export const getApiUrl = () => {
  // Check if VITE_API_URL is set (must be set at BUILD_TIME in Digital Ocean)
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    let url = String(envUrl).trim();
    
    // Force HTTPS if we're on HTTPS (iOS requirement)
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      // Replace http:// with https:// if present
      if (url.startsWith('http://')) {
        console.warn('[Host Config] Converting HTTP to HTTPS for iOS:', url);
        url = url.replace('http://', 'https://');
      }
      // Ensure it starts with https://
      if (!url.startsWith('https://')) {
        url = 'https://' + url.replace(/^https?:\/\//, '');
      }
    }
    
    return url;
  }
  
  // Development mode - use relative URL for Vite proxy
  if (import.meta.env.DEV) {
    return ''; // Empty = relative URL = uses Vite proxy
  }
  
  // Production fallback - MUST be HTTPS (iOS requirement)
  const fallbackUrl = 'https://plankton-app-ymi7p.ondigitalocean.app';
  console.error('[Host Config] CRITICAL: VITE_API_URL not set! Using fallback:', fallbackUrl);
  return fallbackUrl;
};

/**
 * Get the frontend URL
 */
export const getFrontendUrl = () => {
  const envUrl = import.meta.env.VITE_FRONTEND_URL;
  
  if (envUrl) {
    let url = String(envUrl).trim();
    // Ensure HTTPS
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      if (url.startsWith('http://')) {
        url = url.replace('http://', 'https://');
      }
      if (!url.startsWith('https://')) {
        url = 'https://' + url.replace(/^https?:\/\//, '');
      }
    }
    return url;
  }
  
  // Fallback to current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return 'https://seahorse-app-6oovh.ondigitalocean.app';
};

/**
 * Check if we're in production
 */
export const isProduction = () => {
  return import.meta.env.MODE === 'production' || import.meta.env.PROD;
};

/**
 * Check if we're in development
 */
export const isDevelopment = () => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

/**
 * Get Razorpay Key ID
 */
export const getRazorpayKeyId = () => {
  return import.meta.env.VITE_RAZORPAY_KEY_ID || '';
};

/**
 * Host configuration object
 */
export const hostConfig = {
  apiUrl: getApiUrl(),
  frontendUrl: getFrontendUrl(),
  razorpayKeyId: getRazorpayKeyId(),
  isProduction: isProduction(),
  isDevelopment: isDevelopment(),
};

// Log configuration in development
if (isDevelopment()) {
  console.log('[Host Config]', hostConfig);
}

export default hostConfig;
