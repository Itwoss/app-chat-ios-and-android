import { STORAGE_KEYS } from './storageKeys'

/**
 * Apply API chat prefs response to localStorage so existing getters still work.
 * Call when getChatPrefs returns or after mutations that return partial prefs.
 * @param {{ archivedUserIds?: string[], clearedUserIds?: string[], blockedUserIds?: string[], pinnedUserIds?: string[], mutedUserIds?: string[], closeFriendsUserIds?: string[], groups?: { id: string, name: string, memberIds: string[] }[] }} data
 */
export function applyPrefsFromApi(data) {
  if (!data) return
  try {
    if (Array.isArray(data.archivedUserIds)) localStorage.setItem(STORAGE_KEYS.CHAT_ARCHIVED_IDS, JSON.stringify(data.archivedUserIds))
    if (Array.isArray(data.clearedUserIds)) localStorage.setItem(STORAGE_KEYS.CHAT_CLEARED_IDS, JSON.stringify(data.clearedUserIds))
    if (Array.isArray(data.blockedUserIds)) localStorage.setItem(STORAGE_KEYS.BLOCKED_USER_IDS, JSON.stringify(data.blockedUserIds))
    if (Array.isArray(data.pinnedUserIds)) localStorage.setItem(STORAGE_KEYS.CHAT_PINNED_IDS, JSON.stringify(data.pinnedUserIds))
    if (Array.isArray(data.mutedUserIds)) localStorage.setItem(STORAGE_KEYS.CHAT_MUTED_IDS, JSON.stringify(data.mutedUserIds))
    if (Array.isArray(data.closeFriendsUserIds)) localStorage.setItem(STORAGE_KEYS.CLOSE_FRIENDS_IDS, JSON.stringify(data.closeFriendsUserIds))
    if (Array.isArray(data.groups)) localStorage.setItem(STORAGE_KEYS.CHAT_GROUPS, JSON.stringify(data.groups))
  } catch (_) {}
}

function getSet(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch (_) {}
}

export function getPinnedChatIds() {
  return getSet(STORAGE_KEYS.CHAT_PINNED_IDS)
}

export function isChatPinned(userId) {
  return getPinnedChatIds().has(userId)
}

export function togglePinChat(userId) {
  const set = getPinnedChatIds()
  if (set.has(userId)) set.delete(userId)
  else set.add(userId)
  saveSet(STORAGE_KEYS.CHAT_PINNED_IDS, set)
  return set.has(userId)
}

export function getMutedChatIds() {
  return getSet(STORAGE_KEYS.CHAT_MUTED_IDS)
}

export function isChatMuted(userId) {
  return getMutedChatIds().has(userId)
}

export function toggleMuteChat(userId) {
  const set = getMutedChatIds()
  if (set.has(userId)) set.delete(userId)
  else set.add(userId)
  saveSet(STORAGE_KEYS.CHAT_MUTED_IDS, set)
  return set.has(userId)
}

export function getCloseFriendsIds() {
  return getSet(STORAGE_KEYS.CLOSE_FRIENDS_IDS)
}

export function isCloseFriend(userId) {
  return getCloseFriendsIds().has(userId)
}

export function toggleCloseFriend(userId) {
  const set = getCloseFriendsIds()
  if (set.has(userId)) set.delete(userId)
  else set.add(userId)
  saveSet(STORAGE_KEYS.CLOSE_FRIENDS_IDS, set)
  return set.has(userId)
}

// Archived chats (hidden from main list, shown in Archived section)
export function getArchivedChatIds() {
  return getSet(STORAGE_KEYS.CHAT_ARCHIVED_IDS)
}

export function isChatArchived(userId) {
  return getArchivedChatIds().has(userId)
}

export function archiveChats(userIds) {
  const set = getArchivedChatIds()
  userIds.forEach((id) => set.add(id))
  saveSet(STORAGE_KEYS.CHAT_ARCHIVED_IDS, set)
}

export function unarchiveChat(userId) {
  const set = getArchivedChatIds()
  set.delete(userId)
  saveSet(STORAGE_KEYS.CHAT_ARCHIVED_IDS, set)
}

// Cleared chats (show empty message list in conversation)
export function getClearedChatUserIds() {
  return getSet(STORAGE_KEYS.CHAT_CLEARED_IDS)
}

export function isChatCleared(userId) {
  return getClearedChatUserIds().has(userId)
}

export function setChatCleared(userId) {
  const set = getClearedChatUserIds()
  set.add(userId)
  saveSet(STORAGE_KEYS.CHAT_CLEARED_IDS, set)
}

export function unclearChat(userId) {
  const set = getClearedChatUserIds()
  set.delete(userId)
  saveSet(STORAGE_KEYS.CHAT_CLEARED_IDS, set)
}

// Blocked users (hidden from chat list)
export function getBlockedUserIds() {
  return getSet(STORAGE_KEYS.BLOCKED_USER_IDS)
}

export function isUserBlocked(userId) {
  return getBlockedUserIds().has(userId)
}

export function toggleBlockUser(userId) {
  const set = getBlockedUserIds()
  if (set.has(userId)) set.delete(userId)
  else set.add(userId)
  saveSet(STORAGE_KEYS.BLOCKED_USER_IDS, set)
  return set.has(userId)
}

// Local groups (name + member user IDs)
export function getChatGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT_GROUPS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addChatGroup(name, memberIds) {
  const groups = getChatGroups()
  const id = `local-${Date.now()}`
  groups.push({ id, name, memberIds: [...memberIds] })
  try {
    localStorage.setItem(STORAGE_KEYS.CHAT_GROUPS, JSON.stringify(groups))
  } catch (_) {}
  return id
}
