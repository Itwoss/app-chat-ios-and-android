import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  IconButton,
  useColorMode,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Tooltip,
  Collapse,
} from '@chakra-ui/react'
import { Moon, Sun, Menu as MenuIcon, LogOut, Users, UsersRound, FolderKanban, ChevronLeft, ChevronRight, User, Calendar, Briefcase, Video, LayoutDashboard, Settings, CreditCard, Image as ImageIcon, BookOpen, FileText, Search, BarChart3, HelpCircle, Type, Palette } from 'lucide-react'
import NotificationBell from '../Notifications/NotificationBell'
import GlobalSearch from '../Search/GlobalSearch'
import IndicatorDot from '../IndicatorDot/IndicatorDot'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useLogoutAdminMutation, useGetAllBookingsQuery, useGetAllMeetingsQuery } from '../../store/api/adminApi'
import { clearAdmin } from '../../store/slices/adminSlice'
import { clearAuthData, getAdminInfo } from '../../utils/auth'
import { useState, useEffect } from 'react'

const AdminLayout = ({ children }) => {
  const { colorMode, toggleColorMode } = useColorMode()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const sidebarBg = useColorModeValue('gray.50', 'gray.900')
  
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [adminInfo, setAdminInfo] = useState(getAdminInfo())
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure()
  const [logoutAdmin] = useLogoutAdminMutation()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  // Get data for indicator dots
  const { data: bookingsData } = useGetAllBookingsQuery(
    { page: 1, limit: 100, status: 'pending' },
    { skip: !adminInfo?.id }
  )
  const { data: meetingsData } = useGetAllMeetingsQuery(
    { page: 1, limit: 100, status: 'pending' },
    { skip: !adminInfo?.id }
  )
  
  // Calculate indicator counts
  const pendingBookings = bookingsData?.data?.length || 0
  const pendingMeetings = meetingsData?.data?.length || 0

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        onSearchOpen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSearchOpen])

  // Update adminInfo when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setAdminInfo(getAdminInfo())
    }
    
    // Listen for storage events (when localStorage is updated from other tabs/components)
    window.addEventListener('storage', handleStorageChange)
    
    // Also check periodically (for same-tab updates)
    const interval = setInterval(() => {
      const currentInfo = getAdminInfo()
      if (JSON.stringify(currentInfo) !== JSON.stringify(adminInfo)) {
        setAdminInfo(currentInfo)
      }
    }, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [adminInfo])

  const handleLogout = async () => {
    try {
      await logoutAdmin().unwrap()
      dispatch(clearAdmin())
      clearAuthData()
      navigate('/admin/login')
    } catch (error) {
      clearAuthData()
      dispatch(clearAdmin())
      navigate('/admin/login')
    }
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Count System', path: '/admin/count-dashboard', icon: BarChart3 },
    { label: 'Support', path: '/admin/support', icon: HelpCircle },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Posts', path: '/admin/posts', icon: FileText },
    { label: 'Stories', path: '/admin/stories', icon: BookOpen },
    { label: 'Teams', path: '/admin/teams', icon: UsersRound },
    { label: 'Projects', path: '/admin/projects', icon: FolderKanban },
    { label: 'Bookings', path: '/admin/bookings', icon: Calendar },
    { label: 'Client Projects', path: '/admin/client-projects', icon: Briefcase },
    { label: 'Meetings', path: '/admin/meetings', icon: Video },
    { label: 'Subscriptions', path: '/admin/subscriptions', icon: CreditCard },
    { label: 'Banners', path: '/admin/banners', icon: ImageIcon },
    { label: 'Chat Themes', path: '/admin/chat-themes', icon: Palette },
    { label: 'Fonts', path: '/admin/fonts', icon: Type },
    { label: 'Profile', path: '/admin/profile', icon: User },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ]

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
            <IconButton
              icon={<MenuIcon size={20} />}
              onClick={onOpen}
              variant="ghost"
              aria-label="Menu"
              display={{ base: 'flex', lg: 'none' }}
            />
            <IconButton
              icon={isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              onClick={toggleSidebar}
              variant="ghost"
              aria-label="Toggle sidebar"
              display={{ base: 'none', lg: 'flex' }}
            />
            <Text fontWeight="bold" fontSize="xl">
              Admin Dashboard
            </Text>
          </HStack>

          <HStack spacing={4}>
            <IconButton
              icon={<Search size={20} />}
              onClick={onSearchOpen}
              variant="ghost"
              aria-label="Search"
              title="Search (Ctrl+K)"
            />
            <NotificationBell />
            <IconButton
              icon={colorMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              onClick={toggleColorMode}
              variant="ghost"
              aria-label="Toggle color mode"
            />
            <Menu>
              <MenuButton>
                <HStack spacing={2}>
                  <Avatar 
                    size="sm" 
                    name={adminInfo?.name || 'Admin'}
                    src={adminInfo?.profileImage || null}
                  />
                  <Text display={{ base: 'none', md: 'block' }}>
                    {adminInfo?.name || 'Admin'}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList>
                <MenuItem icon={<Search size={16} />} onClick={onSearchOpen}>
                  Search
                </MenuItem>
                <MenuItem icon={<LogOut size={16} />} onClick={handleLogout}>
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={onSearchClose} />

      <Flex>
        {/* Desktop Sidebar */}
        <Box
          as="aside"
          w={{ base: '0', lg: isSidebarCollapsed ? '80px' : '250px' }}
          bg={sidebarBg}
          borderRight="1px"
          borderColor={borderColor}
          h="calc(100vh - 64px)"
          display={{ base: 'none', lg: 'flex' }}
          flexDirection="column"
          position="fixed"
          left={0}
          top="64px"
          transition="width 0.3s ease"
          overflow="hidden"
          zIndex={100}
        >
          {/* Scrollable Menu Items */}
          <Box flex="1" overflowY="auto" overflowX="hidden" w="full" p={4}>
            <VStack spacing={1} align="stretch">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path
                const Icon = item.icon
                
                // Get indicator count for this menu item
                let indicatorCount = 0
                if (item.path === '/admin/bookings') {
                  indicatorCount = pendingBookings
                } else if (item.path === '/admin/meetings') {
                  indicatorCount = pendingMeetings
                }
                
                if (isSidebarCollapsed) {
                  return (
                    <Tooltip key={item.path} label={item.label} placement="right">
                      <Box position="relative" w="full">
                        <IconButton
                          icon={<Icon size={18} />}
                          variant={isActive ? 'solid' : 'ghost'}
                          colorScheme="brand"
                          aria-label={item.label}
                          onClick={() => navigate(item.path)}
                          w="full"
                          mb={1}
                        />
                        {indicatorCount > 0 && <IndicatorDot count={indicatorCount} />}
                      </Box>
                    </Tooltip>
                  )
                }
                
                return (
                  <Box key={item.path} position="relative" w="full">
                    <Button
                      variant={isActive ? 'solid' : 'ghost'}
                      colorScheme="brand"
                      justifyContent="flex-start"
                      leftIcon={<Icon size={18} />}
                      onClick={() => navigate(item.path)}
                      mb={1}
                      w="full"
                    >
                      {item.label}
                    </Button>
                    {indicatorCount > 0 && <IndicatorDot count={indicatorCount} />}
                  </Box>
                )
              })}
            </VStack>
          </Box>

          {/* Fixed Logout Button */}
          <Box
            p={4}
            borderTop="1px"
            borderColor={borderColor}
            bg={sidebarBg}
            w="full"
          >
            {isSidebarCollapsed ? (
              <Tooltip label="Logout" placement="right">
                <IconButton
                  icon={<LogOut size={18} />}
                  variant="ghost"
                  colorScheme="red"
                  aria-label="Logout"
                  onClick={handleLogout}
                  w="full"
                />
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                colorScheme="red"
                justifyContent="flex-start"
                leftIcon={<LogOut size={18} />}
                onClick={handleLogout}
                w="full"
              >
                Logout
              </Button>
            )}
          </Box>
        </Box>

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Menu</DrawerHeader>
            <DrawerBody p={0} display="flex" flexDirection="column">
              <Box flex="1" overflowY="auto" p={4}>
                <VStack spacing={1} align="stretch">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path
                    const Icon = item.icon
                    
                    // Get indicator count for this menu item
                    let indicatorCount = 0
                    if (item.path === '/admin/bookings') {
                      indicatorCount = pendingBookings
                    } else if (item.path === '/admin/meetings') {
                      indicatorCount = pendingMeetings
                    }
                    
                    return (
                      <Box key={item.path} position="relative" w="full">
                        <Button
                          variant={isActive ? 'solid' : 'ghost'}
                          colorScheme="brand"
                          justifyContent="flex-start"
                          leftIcon={<Icon size={18} />}
                          onClick={() => {
                            navigate(item.path)
                            onClose()
                          }}
                          mb={1}
                          w="full"
                        >
                          {item.label}
                        </Button>
                        {indicatorCount > 0 && <IndicatorDot count={indicatorCount} />}
                      </Box>
                    )
                  })}
                </VStack>
              </Box>
              <Box
                p={4}
                borderTop="1px"
                borderColor={borderColor}
                bg={sidebarBg}
              >
                <Button
                  variant="ghost"
                  colorScheme="red"
                  justifyContent="flex-start"
                  leftIcon={<LogOut size={18} />}
                  onClick={() => {
                    handleLogout()
                    onClose()
                  }}
                  w="full"
                >
                  Logout
                </Button>
              </Box>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Main Content */}
        <Box 
          flex="1" 
          p={{ base: 4, md: 6, lg: 8 }}
          ml={{ base: 0, lg: isSidebarCollapsed ? '80px' : '250px' }}
          w={{ base: '100%', lg: isSidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 250px)' }}
          transition="all 0.3s ease"
        >
          {children}
        </Box>
      </Flex>
    </Box>
  )
}

export default AdminLayout
