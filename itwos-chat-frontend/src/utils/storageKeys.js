/**
 * Centralized storage keys to avoid duplicates and unwanted entries.
 * All app-owned keys use the same prefix. Third-party keys (Razorpay, YouTube, Chakra)
 * are not managed here.
 */

const APP_PREFIX = 'itwos_'

export const STORAGE_KEYS = {
  // Audio preference (localStorage) – like chakra-ui-color-mode
  AUDIO_SOUND_ON: APP_PREFIX + 'audio_sound_on',
  // Notification bell: IDs already shown (localStorage)
  DISPLAYED_NOTIFICATION_IDS: APP_PREFIX + 'displayedNotificationIds',
  // Portrait orientation lock: 'on' | 'off' (default off = allow rotation)
  PORTRAIT_LOCK: APP_PREFIX + 'portrait_lock',
  // Chat list nicknames: JSON { [userId]: string } (displayed as #nickname)
  CHAT_NICKNAMES: APP_PREFIX + 'chat_nicknames',
  // Pinned chat user IDs: JSON string[]
  CHAT_PINNED_IDS: APP_PREFIX + 'chat_pinned_ids',
  // Muted chat user IDs: JSON string[]
  CHAT_MUTED_IDS: APP_PREFIX + 'chat_muted_ids',
  // Close friends user IDs: JSON string[]
  CLOSE_FRIENDS_IDS: APP_PREFIX + 'close_friends_ids',
  // Archived chat user IDs: JSON string[]
  CHAT_ARCHIVED_IDS: APP_PREFIX + 'chat_archived_ids',
  // Cleared chat user IDs (show empty messages): JSON string[]
  CHAT_CLEARED_IDS: APP_PREFIX + 'chat_cleared_ids',
  // Blocked user IDs: JSON string[]
  BLOCKED_USER_IDS: APP_PREFIX + 'blocked_user_ids',
  // Local groups (name + memberIds): JSON array of { id, name, memberIds }
  CHAT_GROUPS: APP_PREFIX + 'chat_groups',
  // Ambient glow behind post media (YouTube-style): 'true' | 'false'
  AMBIENT_GLOW: APP_PREFIX + 'ambient_glow',
}

export const SESSION_KEYS = {
  // Profile: location alert shown per user (sessionStorage)
  locationAlert: (userId) => `${APP_PREFIX}locationAlert_${userId}`,
}

/** Legacy auth keys that are no longer used; we only use userInfo/adminInfo now. */
const LEGACY_AUTH_KEYS = ['id', 'name', 'email', 'role']

/**
 * Remove legacy localStorage/sessionStorage keys so they don't clutter or duplicate.
 * Call once on app load (e.g. from auth or main).
 */
export function cleanupLegacyStorage() {
  try {
    LEGACY_AUTH_KEYS.forEach((key) => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
    // Migrate old keys to prefixed ones so we don't have both
    const oldAudio = localStorage.getItem('audio_sound_on')
    if (oldAudio != null) {
      localStorage.setItem(STORAGE_KEYS.AUDIO_SOUND_ON, oldAudio)
      localStorage.removeItem('audio_sound_on')
    }
    const oldNotif = localStorage.getItem('displayedNotificationIds')
    if (oldNotif != null) {
      localStorage.setItem(STORAGE_KEYS.DISPLAYED_NOTIFICATION_IDS, oldNotif)
      localStorage.removeItem('displayedNotificationIds')
    }
    // Remove old sessionStorage keys (pre-namespace) to avoid duplicates
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith('locationAlertShown_') && !key.startsWith(APP_PREFIX)) {
          sessionStorage.removeItem(key)
        }
      }
    } catch (_) {}
  } catch (_) {
    // private mode / quota
  }
}
