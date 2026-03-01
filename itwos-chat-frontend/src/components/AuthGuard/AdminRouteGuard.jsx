import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserInfo, getAdminInfo } from '../../utils/auth'
import { Spinner, Center } from '@chakra-ui/react'

const AdminRouteGuard = ({ children }) => {
  const navigate = useNavigate()
  const userInfo = getUserInfo()
  const adminInfo = getAdminInfo()
  const role = adminInfo?.role || userInfo?.role

  useEffect(() => {
    // Redirect employees to their dashboard
    if (role === 'employee') {
      navigate('/employee/dashboard', { replace: true })
      return
    }

    // Redirect regular users to their home
    if (role === 'user') {
      navigate('/user/home', { replace: true })
      return
    }

    // Only admins can access admin routes
    if (role !== 'admin') {
      navigate('/login', { replace: true })
      return
    }
  }, [role, navigate])

  // Show loading while checking role
  if (!role || role !== 'admin') {
    return (
      <Center minH="100vh">
        <Spinner size="xl" colorScheme="brand" />
      </Center>
    )
  }

  return <>{children}</>
}

export default AdminRouteGuard











