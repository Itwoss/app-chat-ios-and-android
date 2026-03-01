import Cookies from 'js-cookie'

// Instagram-style session: survive refresh and PWA close/reopen. Primary: HTTP-only cookie (backend). Fallback: token in cookie + localStorage, sent as Bearer.
const AUTH_TOKEN_KEY = 'userAuthToken'
const ADMIN_TOKEN_KEY = 'adminAuthToken'
const AUTH_TOKEN_COOKIE = 'appAuthToken'
const AUTH_TOKEN_COOKIE_MAX_AGE_DAYS = 7

export const setAuthToken = (token, role = 'user') => {
  if (!token) return
  try {
    if (role === 'admin') {
      localStorage.setItem(ADMIN_TOKEN_KEY, token)
      localStorage.removeItem(AUTH_TOKEN_KEY)
      Cookies.set(AUTH_TOKEN_COOKIE, token, { path: '/', maxAge: AUTH_TOKEN_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60, secure: window.location?.protocol === 'https:', sameSite: 'lax' })
    } else {
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      Cookies.set(AUTH_TOKEN_COOKIE, token, { path: '/', maxAge: AUTH_TOKEN_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60, secure: window.location?.protocol === 'https:', sameSite: 'lax' })
    }
  } catch (_) {}
}

export const getAuthToken = () => {
  try {
    const fromStorage = localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY)
    if (fromStorage) return fromStorage
    const fromCookie = Cookies.get(AUTH_TOKEN_COOKIE)
    if (fromCookie) {
      localStorage.setItem(AUTH_TOKEN_KEY, fromCookie)
      return fromCookie
    }
    return null
  } catch (_) {
    return null
  }
}

// iOS: localStorage.setItem can throw (e.g. private mode); wrap in try/catch so app doesn't crash.
export const setAuthData = (userData, role) => {
  const userRole = userData.role || role
  try {
    localStorage.removeItem('id')
    localStorage.removeItem('name')
    localStorage.removeItem('email')
    localStorage.removeItem('role')

    if (userRole === 'admin') {
      localStorage.setItem('adminInfo', JSON.stringify({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userRole,
        profileImage: userData.profileImage || null
      }))
      localStorage.removeItem('userInfo')
    } else {
      const existingUserInfo = getUserInfo()
      const userInfoToStore = {
        id: userData.id || userData._id || existingUserInfo?.id,
        name: userData.name || existingUserInfo?.name,
        email: userData.email || existingUserInfo?.email,
        role: userRole,
        countryCode: userData.countryCode ?? existingUserInfo?.countryCode ?? null,
        phoneNumber: userData.phoneNumber ?? existingUserInfo?.phoneNumber ?? null,
        fullNumber: userData.fullNumber ?? existingUserInfo?.fullNumber ?? null,
        profileImage: userData.profileImage ?? existingUserInfo?.profileImage ?? null,
        accountType: userData.accountType ?? existingUserInfo?.accountType ?? null,
        bio: userData.bio ?? existingUserInfo?.bio ?? '',
        address: userData.address ?? existingUserInfo?.address ?? null,
        privacySettings: userData.privacySettings ?? existingUserInfo?.privacySettings ?? null,
        navbarSettings: userData.navbarSettings !== undefined && userData.navbarSettings !== null
          ? userData.navbarSettings
          : existingUserInfo?.navbarSettings ?? null,
        subscription: userData.subscription ?? existingUserInfo?.subscription ?? null,
        equippedBanner: userData.equippedBanner ?? existingUserInfo?.equippedBanner ?? null,
        equippedFont: userData.equippedFont ?? existingUserInfo?.equippedFont ?? null,
      }
      localStorage.setItem('userInfo', JSON.stringify(userInfoToStore))
      localStorage.removeItem('adminInfo')
    }
  } catch (_) {
    // iOS Safari can throw on setItem/removeItem (e.g. private browsing, quota)
  }
}

// iOS: Wrap all storage access in try/catch — Safari can throw (private mode, quota, security).
export const getUserInfo = () => {
  try {
    const userInfo = localStorage.getItem('userInfo')
    if (userInfo) {
      return JSON.parse(userInfo)
    }
  } catch (_) {
    // iOS Safari can throw on getItem in restricted contexts
  }
  return null
}

export const getAdminInfo = () => {
  try {
    const adminInfo = localStorage.getItem('adminInfo')
    if (adminInfo) {
      return JSON.parse(adminInfo)
    }
  } catch (_) {
    // iOS Safari can throw on getItem in restricted contexts
  }
  return null
}

export const getAuthData = () => {
  const userInfo = getUserInfo()
  const adminInfo = getAdminInfo()
  return userInfo || adminInfo || null
}

export const clearAuthData = () => {
  console.log('[clearAuthData] Clearing all authentication data');

  try {
    localStorage.removeItem('userInfo')
    localStorage.removeItem('adminInfo')
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    localStorage.removeItem('id')
    localStorage.removeItem('name')
    localStorage.removeItem('email')
    localStorage.removeItem('role')
    Cookies.remove(AUTH_TOKEN_COOKIE, { path: '/' })
  } catch (_) {
    // iOS Safari can throw on removeItem in restricted contexts
  }

  // CRITICAL FOR iOS: Clear cookies with same options used when setting (domain, path, sameSite, secure)
  const isProduction = window.location.protocol === 'https:'
  const hostname = window.location.hostname

  const baseOptions = { path: '/', sameSite: 'none', secure: true }
  const withDomain = (domain) => (isProduction ? { ...baseOptions, domain } : { path: '/' }) // dev: path only

  // Custom domain (e.g. www.itwos.store) — backend sets domain: '.itwos.store'
  if (isProduction && hostname.includes('itwos.store')) {
    Cookies.remove('userToken', withDomain('.itwos.store'))
    Cookies.remove('adminToken', withDomain('.itwos.store'))
  }
  // Digital Ocean app domain
  if (isProduction && hostname.endsWith('.ondigitalocean.app')) {
    Cookies.remove('userToken', withDomain('.ondigitalocean.app'))
    Cookies.remove('adminToken', withDomain('.ondigitalocean.app'))
  }
  // Fallback: no domain (same-origin)
  Cookies.remove('userToken', { path: '/' })
  Cookies.remove('adminToken', { path: '/' })
  
  console.log('[clearAuthData] All auth data cleared');
}

export const checkAuth = () => {
  // Check cookies first (source of truth)
  const userToken = Cookies.get('userToken')
  const adminToken = Cookies.get('adminToken')
  const userInfo = getUserInfo()
  const adminInfo = getAdminInfo()
  const storedToken = getAuthToken()

  if (userToken || adminToken) return true
  if (userInfo || adminInfo) return true
  // PWA: localStorage is often cleared on app close; token may still be in cookie — treat as logged in so we refetch user
  if (storedToken) return true
  return false
}

