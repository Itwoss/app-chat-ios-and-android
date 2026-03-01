/**
 * Shared API base URL and FormData fetch for RTK Query. Used by userApi and adminApi.
 */

export function getBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) {
    let url = String(envUrl).trim()
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') return url
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      if (url.startsWith('http://')) url = url.replace('http://', 'https://')
      if (!url.startsWith('https://')) url = 'https://' + url.replace(/^https?:\/\//, '')
    }
    return url
  }
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') return 'http://localhost:5001'
  const fallback = 'https://plankton-app-ymi7p.ondigitalocean.app'
  if (import.meta.env.PROD) console.error('[API] VITE_API_URL not set! Using fallback:', fallback)
  return fallback
}

/** Run a FormData request; getToken() returns auth token or null. Returns { data } or { error }. */
export async function runFormDataFetch(args, getToken = () => null) {
  const baseUrl = (getBaseUrl() || '').replace(/\/+$/, '')
  const path = (typeof args.url === 'string' ? args.url : args.url?.url || '').replace(/^\/+/, '')
  const url = baseUrl ? `${baseUrl}/${path}` : `/${path}`
  const token = getToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(url, {
    method: args.method || 'POST',
    body: args.body,
    credentials: 'include',
    ...(Object.keys(headers).length ? { headers } : {}),
  })
  const data = await res.json()
  if (!res.ok) return { error: { status: res.status, data } }
  return { data }
}
