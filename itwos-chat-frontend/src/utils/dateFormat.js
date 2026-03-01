/**
 * Shared date/time formatting. Used by ChatConversation, UserHome, and others.
 */

export function formatTime(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const today = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  if (today(d, now)) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (today(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

/** Short relative time for feed: "just now", "5 mins", "2 hrs", "3 days", or "Jan 15" */
export function getRelativeTime(date) {
  const now = Date.now()
  const t = new Date(date).getTime()
  const diff = Math.floor((now - t) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return diff < 120 ? '1 min' : `${Math.floor(diff / 60)} mins`
  if (diff < 86400) return diff < 7200 ? '1 hr' : `${Math.floor(diff / 3600)} hrs`
  if (diff < 604800) return Math.floor(diff / 86400) === 1 ? '1 day' : `${Math.floor(diff / 86400)} days`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
