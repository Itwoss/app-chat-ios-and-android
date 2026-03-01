import { STORAGE_KEYS } from './storageKeys'

const KEY = STORAGE_KEYS.CHAT_NICKNAMES

function getAll() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(obj) {
  try {
    localStorage.setItem(KEY, JSON.stringify(obj))
  } catch (_) {}
}

/** Get display name: nickname (with #) or null if none. */
export function getChatNickname(userId) {
  const nick = getAll()[userId]
  return nick != null && String(nick).trim() ? String(nick).trim() : null
}

/** Display in list: "#nickname" or fallback to username. */
export function getChatDisplayName(userId, username) {
  const nick = getChatNickname(userId)
  return nick ? `#${nick}` : (username || 'Unknown')
}

export function setChatNickname(userId, nickname) {
  const next = { ...getAll() }
  const trimmed = nickname != null ? String(nickname).trim() : ''
  if (trimmed) next[userId] = trimmed
  else delete next[userId]
  save(next)
}

export function removeChatNickname(userId) {
  const next = { ...getAll() }
  delete next[userId]
  save(next)
}
