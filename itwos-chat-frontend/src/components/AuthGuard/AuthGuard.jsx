import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetCurrentUserQuery } from '../../store/api/userApi'
import { useGetCurrentAdminQuery } from '../../store/api/adminApi'
import { getUserInfo, getAdminInfo, clearAuthData, getAuthToken } from '../../utils/auth'

const AuthGuard = ({ children }) => {
  const navigate = useNavigate()
  const userInfo = getUserInfo()
  const adminInfo = getAdminInfo()
  const role = userInfo?.role || adminInfo?.role
  const hasLocalAuth = !!userInfo || !!adminInfo || !!getAuthToken()

  const { data: userData, error: userError, isError: isUserError } = useGetCurrentUserQuery(undefined, {
    skip: !hasLocalAuth || role === 'admin',
  })
  const { data: adminData, error: adminError, isError: isAdminError } = useGetCurrentAdminQuery(undefined, {
    skip: !hasLocalAuth || role === 'user' || role === 'employee',
  })

  useEffect(() => {
    if (!hasLocalAuth) {
      navigate('/login', { replace: true })
      return
    }
    const userSuccess = userData?.success && userData?.data
    const adminSuccess = adminData?.success && adminData?.data
    if (isUserError && userError?.status === 401 && !adminSuccess) {
      console.log('[AuthGuard] 401 (user) - redirecting to login')
      clearAuthData()
      navigate('/login', { replace: true })
    }
    if (isAdminError && adminError?.status === 401 && !userSuccess) {
      console.log('[AuthGuard] 401 (admin) - redirecting to admin login')
      clearAuthData()
      navigate('/admin/login', { replace: true })
    }
  }, [hasLocalAuth, isUserError, isAdminError, navigate, userError, adminError, userData, adminData])

  if (!hasLocalAuth) return null

  // Don't throw error during render - handle it in useEffect instead
  return <>{children}</>
}

export default AuthGuard

