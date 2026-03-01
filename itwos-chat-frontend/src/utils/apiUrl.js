/**
 * API URL — use Vite env only (fewer Safari edge cases).
 * Set VITE_API_URL in .env (e.g. https://api.itwos.store; http://localhost:5001 for dev).
 */
export const getApiUrl = () =>
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5001' : '')

/**
 * Get the current API base URL
 * @returns {string} API base URL (always HTTPS in production)
 */
export const getApiBaseUrl = () => getApiUrl();

/**
 * Check if we're in production
 * @returns {boolean}
 */
export const isProduction = () => {
  return import.meta.env.MODE === 'production' || import.meta.env.PROD;
};

/**
 * Check if we're in development
 * @returns {boolean}
 */
export const isDevelopment = () => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};
