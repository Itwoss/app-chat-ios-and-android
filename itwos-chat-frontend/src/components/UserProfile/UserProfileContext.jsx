import { createContext, useContext } from 'react';

/**
 * Shared context for UserProfile page and its child components.
 * Provides theme colors, display data, and callbacks to avoid prop drilling.
 */
const UserProfileContext = createContext(null);

export function UserProfileProvider({ value, children }) {
  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error('useUserProfile must be used within UserProfileProvider');
  }
  return ctx;
}

export default UserProfileContext;
