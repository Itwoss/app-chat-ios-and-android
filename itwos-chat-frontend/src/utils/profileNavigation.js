/**
 * Centralized profile navigation utility
 * Handles navigation to user profiles from anywhere in the app
 */

/**
 * Navigate to a user's profile page
 * @param {Function} navigate - React Router navigate function
 * @param {string} userId - User ID to navigate to
 */
export const navigateToProfile = (navigate, userId) => {
  if (!userId) {
    console.warn('navigateToProfile: userId is required');
    return;
  }
  navigate(`/user/profile/${userId}`);
};

/**
 * Get profile URL for a user
 * @param {string} userId - User ID
 * @returns {string} Profile URL
 */
export const getProfileUrl = (userId) => {
  if (!userId) return '/user/profile';
  return `/user/profile/${userId}`;
};

/**
 * Check if a userId is the current user's ID
 * @param {string} userId - User ID to check
 * @param {string|object} currentUserId - Current user's ID (string or user object with _id/id)
 * @returns {boolean}
 */
export const isOwnProfile = (userId, currentUserId) => {
  if (!userId || !currentUserId) return false;
  const currentId = typeof currentUserId === 'string' 
    ? currentUserId 
    : currentUserId._id || currentUserId.id;
  return userId === currentId || userId.toString() === currentId?.toString();
};











