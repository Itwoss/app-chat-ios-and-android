import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react'
import { LogOut, Briefcase } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useLogoutUserMutation } from '../../store/api/userApi'
import { clearUser } from '../../store/slices/userSlice'
import { clearAuthData, getUserInfo } from '../../utils/auth'
import NotificationBell from '../Notifications/NotificationBell'

const EmployeeLayout = ({ children }) => {
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const userInfo = getUserInfo()
  const [logoutUser] = useLogoutUserMutation()

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap()
      dispatch(clearUser())
      clearAuthData()
      navigate('/login')
    } catch (error) {
      clearAuthData()
      dispatch(clearUser())
      navigate('/login')
    }
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Header */}
      <Box
        as="header"
        bg={bg}
        borderBottom="1px"
        borderColor={borderColor}
        px={4}
        py={3}
        position="sticky"
        top={0}
        zIndex={1000}
      >
        <Flex justify="space-between" align="center" maxW="full">
          <HStack spacing={4}>
            <Briefcase size={24} />
            <Text fontWeight="bold" fontSize="xl">
              Employee Dashboard
            </Text>
          </HStack>

          <HStack spacing={4}>
            <NotificationBell />
            <Menu>
              <MenuButton>
                <HStack spacing={2}>
                  <Avatar 
                    size="sm" 
                    name={userInfo?.name || 'Employee'}
                    src={userInfo?.profileImage || null}
                  />
                  <Text>{userInfo?.name || 'Employee'}</Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem icon={<LogOut size={16} />} onClick={handleLogout}>
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box p={{ base: 4, md: 6, lg: 8 }}>
        {children}
      </Box>
    </Box>
  )
}

export default EmployeeLayout











