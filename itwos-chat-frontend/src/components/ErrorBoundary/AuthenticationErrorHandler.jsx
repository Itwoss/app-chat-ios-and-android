import { useEffect, useState, useRef } from 'react'
import { useGetCurrentUserQuery } from '../../store/api/userApi'
import { useGetCurrentAdminQuery } from '../../store/api/adminApi'
import { getUserInfo, getAdminInfo } from '../../utils/auth'

/**
 * Monitors RTK Query 401s and throws so ErrorBoundary can catch.
 * Uses stable deps (has401, message) to avoid unnecessary effect runs.
 */
const AuthenticationErrorHandler = ({ children }) => {
  const userInfo = getUserInfo()
  const adminInfo = getAdminInfo()
  const role = userInfo?.role || adminInfo?.role
  const hasLocalAuth = !!userInfo || !!adminInfo
  const [authError, setAuthError] = useState(null)
  const last401Ref = useRef(false)

  const { error: userError, isError: isUserError } = useGetCurrentUserQuery(undefined, {
    skip: !hasLocalAuth || (role !== 'user' && role !== 'employee'),
  })

  const { error: adminError, isError: isAdminError } = useGetCurrentAdminQuery(undefined, {
    skip: !hasLocalAuth || role !== 'admin',
  })

  const user401 = Boolean(isUserError && userError?.status === 401)
  const admin401 = Boolean(isAdminError && adminError?.status === 401)
  const has401 = user401 || admin401
  const message = user401
    ? (userError?.data?.message || 'Authentication required. Please login again.')
    : admin401
      ? (adminError?.data?.message || 'Authentication required. Please login again.')
      : null

  useEffect(() => {
    if (has401 && message && !last401Ref.current) {
      last401Ref.current = true
      setAuthError(new Error(message))
    } else if (!has401) {
      last401Ref.current = false
      setAuthError(null)
    }
  }, [has401, message])

  if (authError) {
    throw authError
  }

  return <>{children}</>
}

export default AuthenticationErrorHandler

