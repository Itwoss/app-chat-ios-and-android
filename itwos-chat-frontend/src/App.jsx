import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useRef, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { initializeSocket, getSocket } from './utils/socket'
import { useGetCurrentUserQuery } from './store/api/userApi'
import { useGetCurrentAdminQuery } from './store/api/adminApi'
import { setUser, clearUser } from './store/slices/userSlice'
import { setAdmin, clearAdmin } from './store/slices/adminSlice'
import { setAuthData, getUserInfo, getAdminInfo, clearAuthData, getAuthToken } from './utils/auth'
import { cleanupLegacyStorage } from './utils/storageKeys'
import { applyOrientationLock } from './utils/orientationLock'
import AuthGuard from './components/AuthGuard/AuthGuard'
import AdminRouteGuard from './components/AuthGuard/AdminRouteGuard'
import AuthenticationErrorHandler from './components/ErrorBoundary/AuthenticationErrorHandler'
import RouteAudioController from './components/Audio/RouteAudioController'
import Home from './pages/Home'
import About from './pages/About'
import Services from './pages/Services'
import Contact from './pages/Contact'
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Register from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import UserProjects from './pages/UserProjects'
import UserProfile from './pages/UserProfile'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminTeams from './pages/AdminTeams'
import AdminProjects from './pages/AdminProjects'
import AdminBookings from './pages/AdminBookings'
import AdminClientProjects from './pages/AdminClientProjects'
import AdminClientProjectView from './pages/AdminClientProjectView'
import AdminClientProjectEdit from './pages/AdminClientProjectEdit'
import AdminMeetings from './pages/AdminMeetings'
import AdminProfile from './pages/AdminProfile'
import AdminUserFriends from './pages/AdminUserFriends'
import AdminUserChats from './pages/AdminUserChats'
import UserClientProjects from './pages/UserClientProjects'
import NotFound from './pages/NotFound'
import UserClientProjectView from './pages/UserClientProjectView'
import UserFriends from './pages/UserFriends'
import UserChat from './pages/UserChat'
import UserHome from './pages/UserHome'
import UserFeed from './pages/UserFeed'
import UserPostDetailsPage from './pages/UserPostDetailsPage'
import AdminSettings from './pages/AdminSettings'
import UserSettings from './pages/UserSettings'
import UserStore from './pages/UserStore'
import AdminSubscriptions from './pages/AdminSubscriptions'
import BannerStore from './pages/BannerStore'
import BannerPayment from './pages/BannerPayment'
import BannerInventory from './pages/BannerInventory'
import FontStore from './pages/FontStore'
import AdminBanners from './pages/AdminBanners'
import AdminFonts from './pages/AdminFonts'
import AdminChatThemes from './pages/AdminChatThemes'
import MyStories from './pages/MyStories'
import UserNotifications from './pages/UserNotifications'
import StoryViewer from './components/Stories/StoryViewer'
import AdminStories from './pages/AdminStories'
import AdminPosts from './pages/AdminPosts'
import UserLeaderboard from './pages/UserLeaderboard'
import AdminCountDashboard from './pages/AdminCountDashboard'
import UserSupport from './pages/UserSupport'
import EmployeeDashboard from './pages/EmployeeDashboard'
import EmployeeLayout from './components/Employee/EmployeeLayout'
import AdminSupport from './pages/AdminSupport'
import NotificationPermissionBanner from './components/Notifications/NotificationPermissionBanner'
import UserArea from './components/User/UserArea'

// Instagram-style boot: minimal dark splash, no login flash; skip after 3s if API hangs (e.g. iOS)
function BootLoadingScreen() {
  const [showSkip, setShowSkip] = useState(false)
  const skipTimerRef = useRef(null)
  useEffect(() => {
    skipTimerRef.current = setTimeout(() => setShowSkip(true), 3000)
    return () => {
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current)
    }
  }, [])
  const handleSkip = () => {
    try {
      window.dispatchEvent(new Event('skip-boot-wait'))
    } catch (_) {}
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#000',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        color: '#fff',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
          marginBottom: 20,
        }}
      />
      <span style={{ fontSize: 18, fontWeight: 600, marginBottom: 24 }}>Chat App</span>
      <div
        style={{
          width: 24,
          height: 24,
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {showSkip && (
        <button
          type="button"
          onClick={handleSkip}
          style={{
            marginTop: 32,
            padding: '12px 24px',
            fontSize: 15,
            color: 'rgba(255,255,255,0.9)',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.4)',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          Tap to continue
        </button>
      )}
    </div>
  )
}

function App() {
  const dispatch = useDispatch()
  const location = useLocation()
  const [booted, setBooted] = useState(false)

  // Lock to portrait on all pages except feed (allow rotation on feed only)
  useEffect(() => {
    const isFeedPage = location.pathname === '/user/feed' || location.pathname.startsWith('/user/feed/')
    applyOrientationLock(!isFeedPage)
  }, [location.pathname])
  // One-time cleanup of legacy and duplicate storage keys (localStorage + sessionStorage)
  useEffect(() => {
    cleanupLegacyStorage()
  }, [])
  const userInfo = getUserInfo()
  const adminInfo = getAdminInfo()
  const role = userInfo?.role || adminInfo?.role
  // Instagram-style: stay logged in until logout or token expire. Token/cookie survive PWA close/reopen.
  const hasLocalAuth = !!userInfo || !!adminInfo || !!getAuthToken()

  // When role is unknown (token only after PWA reopen), run both; one will 200 and restore userInfo
  // Skip /me when we have no token to send (cross-origin: cookie often not sent, so 401 without Bearer)
  const canSendUserAuth = Boolean(getAuthToken())
  const { data: userData, error: userError, isError: isUserError } = useGetCurrentUserQuery(undefined, {
    skip: !hasLocalAuth || role === 'admin' || !canSendUserAuth,
  })
  const { data: adminData, error: adminError, isError: isAdminError } = useGetCurrentAdminQuery(undefined, {
    skip: !hasLocalAuth || role === 'user' || role === 'employee' || !canSendUserAuth,
  })

  // Boot: run only when auth resolution state changes (primitives to avoid unnecessary runs)
  const userResolved = userData != null || isUserError
  const adminResolved = adminData != null || isAdminError
  useEffect(() => {
    if (!hasLocalAuth || userResolved || adminResolved) {
      setBooted(true)
      if (hasLocalAuth && (userResolved || adminResolved)) {
        console.log('[App] Boot: auth API resolved', { userData: !!userData, adminData: !!adminData, isUserError, isAdminError })
      }
    }
  }, [hasLocalAuth, userResolved, adminResolved, userData, adminData, isUserError, isAdminError])

  // iOS: If auth API never resolves (request hangs/blocked), boot after timeout so app is not stuck on blank screen.
  useEffect(() => {
    const BOOT_TIMEOUT_MS = 5000
    const t = setTimeout(() => {
      setBooted((b) => {
        if (!b) {
          console.log('[App] Boot: timeout (auth API did not resolve in 5s — rendering anyway; common on iOS)')
          return true
        }
        return b
      })
    }, BOOT_TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [])

  // Allow user to skip wait (e.g. on iOS when API hangs) — listen for custom event from loading UI
  useEffect(() => {
    const handler = () => setBooted(true)
    window.addEventListener('skip-boot-wait', handler)
    return () => window.removeEventListener('skip-boot-wait', handler)
  }, [])

  // Auth sync: only run when meaningful auth state changes (avoids extra runs from RTK refetch refs)
  const user401 = Boolean(isUserError && userError?.status === 401)
  const admin401 = Boolean(isAdminError && adminError?.status === 401)
  const userSuccess = Boolean(userData?.success && userData?.data)
  const adminSuccess = Boolean(adminData?.success && adminData?.data)
  // If we have local "auth" (userInfo) but no token to send, treat as logged out (e.g. token cleared/expired)
  const staleAuth = hasLocalAuth && !canSendUserAuth && (!!userInfo || !!adminInfo)
  const authSyncSig = useMemo(
    () => `${hasLocalAuth}-${user401}-${admin401}-${userSuccess}-${adminSuccess}-${staleAuth}-${userData?.data?._id ?? ''}-${adminData?.data?._id ?? ''}-${role}`,
    [hasLocalAuth, user401, admin401, userSuccess, adminSuccess, staleAuth, userData?.data?._id, adminData?.data?._id, role]
  )
  useEffect(() => {
    if (!hasLocalAuth) {
      dispatch(clearUser())
      dispatch(clearAdmin())
      return
    }
    if (staleAuth) {
      clearAuthData()
      dispatch(clearUser())
      dispatch(clearAdmin())
      return
    }
    if (user401 || admin401) {
      if (userSuccess || adminSuccess) return
      clearAuthData()
      dispatch(clearUser())
      dispatch(clearAdmin())
      if (user401) console.log('[App] 401 (user) - clearing auth')
      if (admin401) console.log('[App] 401 (admin) - clearing auth')
      return
    }
    if (userSuccess && userData?.data) {
      setAuthData(userData.data, role === 'employee' ? 'user' : 'user')
      dispatch(setUser(userData.data))
    }
    if (adminSuccess && adminData?.data) {
      setAuthData(adminData.data, 'admin')
      dispatch(setAdmin(adminData.data))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only when authSyncSig changes to avoid RTK ref churn
  }, [authSyncSig])

  // Initialize Socket.IO when we have local auth (API validates cookies)
  useEffect(() => {
    if (hasLocalAuth) {
      const socket = initializeSocket()
      return () => {
        if (socket && socket.connected) {
          socket.disconnect()
        }
      }
    }
  }, [hasLocalAuth])

  // iOS: show in-app loading so user sees something; after 3s show "Tap to continue" so user can skip wait
  if (!booted) {
    return (
      <BootLoadingScreen />
    )
  }

  const showNotificationBanner = hasLocalAuth && (role === 'user' || role === 'employee')

  return (
    <AuthenticationErrorHandler>
      <RouteAudioController />
      {showNotificationBanner && <NotificationPermissionBanner />}
      <Routes>
        {/* Public routes - no AuthGuard; "/" redirects to home when already logged in (fixes PWA reopen showing login) */}
        <Route path="/" element={hasLocalAuth ? (role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/user/home" replace />) : <Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={hasLocalAuth ? (role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/user/home" replace />) : <Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected user routes - single layout with optional slide transition */}
        <Route path="/user" element={<AuthGuard><UserArea /></AuthGuard>}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<UserHome />} />
          <Route path="feed" element={<UserFeed />} />
          <Route path="chat" element={<UserChat />} />
          <Route path="chat/:userId" element={<UserChat />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="profile/:userId" element={<UserProfile />} />
          <Route path="projects" element={<UserProjects />} />
          <Route path="client-projects" element={<UserClientProjects />} />
          <Route path="client-projects/:id" element={<UserClientProjectView />} />
          <Route path="post/:postId" element={<UserPostDetailsPage />} />
          <Route path="friends" element={<UserFriends />} />
          <Route path="settings" element={<UserSettings />} />
          <Route path="store" element={<UserStore />} />
          <Route path="banner-store" element={<BannerStore />} />
          <Route path="banner-store/payment" element={<BannerPayment />} />
          <Route path="banner-inventory" element={<BannerInventory />} />
          <Route path="font-store" element={<FontStore />} />
          <Route path="stories" element={<MyStories />} />
          <Route path="notifications" element={<UserNotifications />} />
          <Route path="stories/view" element={<StoryViewer />} />
          <Route path="leaderboard" element={<UserLeaderboard />} />
          <Route path="support" element={<UserSupport />} />
        </Route>
        <Route path="/admin/dashboard" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
        <Route path="/admin/users" element={<AdminRouteGuard><AdminUsers /></AdminRouteGuard>} />
        <Route path="/admin/teams" element={<AdminRouteGuard><AdminTeams /></AdminRouteGuard>} />
        <Route path="/admin/projects" element={<AdminRouteGuard><AdminProjects /></AdminRouteGuard>} />
        <Route path="/admin/bookings" element={<AdminRouteGuard><AdminBookings /></AdminRouteGuard>} />
        <Route path="/admin/client-projects" element={<AdminRouteGuard><AdminClientProjects /></AdminRouteGuard>} />
        <Route path="/admin/client-projects/:id" element={<AdminRouteGuard><AdminClientProjectView /></AdminRouteGuard>} />
        <Route path="/admin/client-projects/:id/edit" element={<AdminRouteGuard><AdminClientProjectEdit /></AdminRouteGuard>} />
        <Route path="/admin/meetings" element={<AdminRouteGuard><AdminMeetings /></AdminRouteGuard>} />
        <Route path="/admin/profile" element={<AdminRouteGuard><AdminProfile /></AdminRouteGuard>} />
        <Route path="/admin/settings" element={<AdminRouteGuard><AdminSettings /></AdminRouteGuard>} />
        <Route path="/admin/subscriptions" element={<AdminRouteGuard><AdminSubscriptions /></AdminRouteGuard>} />
        <Route path="/admin/banners" element={<AdminRouteGuard><AdminBanners /></AdminRouteGuard>} />
        <Route path="/admin/chat-themes" element={<AdminRouteGuard><AdminChatThemes /></AdminRouteGuard>} />
        <Route path="/admin/fonts" element={<AdminRouteGuard><AdminFonts /></AdminRouteGuard>} />
        <Route path="/admin/stories" element={<AdminRouteGuard><AdminStories /></AdminRouteGuard>} />
        <Route path="/admin/posts" element={<AdminRouteGuard><AdminPosts /></AdminRouteGuard>} />
        <Route path="/admin/count-dashboard" element={<AdminRouteGuard><AdminCountDashboard /></AdminRouteGuard>} />
        <Route path="/admin/support" element={<AdminRouteGuard><AdminSupport /></AdminRouteGuard>} />
        <Route path="/admin/users/:userId/friends" element={<AdminRouteGuard><AdminUserFriends /></AdminRouteGuard>} />
        <Route path="/admin/users/:userId/chats" element={<AdminRouteGuard><AdminUserChats /></AdminRouteGuard>} />
        <Route path="/employee/dashboard" element={<AuthGuard><EmployeeLayout><EmployeeDashboard /></EmployeeLayout></AuthGuard>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthenticationErrorHandler>
  )
}

export default App

