/**
 * Build YouTube embed URL with consistent params (loop, no controls, playsinline, JS API, start/end).
 * Use for all iframes so request matches: loop=1&controls=0&modestbranding=1&playsinline=1&enablejsapi=1&start=0&end=30
 * @param {string} baseUrl - Full embed URL (e.g. https://www.youtube.com/embed/VIDEO_ID) or just video id
 * @param {{ start?: number, end?: number, mute?: number }} opts - start/end seconds; mute=1 for silent preview
 * @returns {string}
 */
export function buildYouTubeEmbedUrl(baseUrl, opts = {}) {
  const start = opts.start ?? 0
  const end = opts.end ?? null
  const mute = opts.mute ?? null
  const base = baseUrl.startsWith('http') ? baseUrl : `https://www.youtube.com/embed/${baseUrl}`
  const sep = base.includes('?') ? '&' : '?'
  let q = `loop=1&controls=0&modestbranding=1&playsinline=1&enablejsapi=1&start=${start}`
  if (end != null) q += `&end=${end}`
  if (mute != null) q += `&mute=${mute}`
  return `${base}${sep}${q}`
}
