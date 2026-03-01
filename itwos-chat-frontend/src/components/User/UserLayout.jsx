import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  useColorModeValue,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Tooltip,
  Divider,
  Avatar,
} from '@chakra-ui/react'
import { LayoutDashboard, FolderKanban, User, ChevronLeft, ChevronRight, Briefcase, Users, MessageCircle , Home, Settings, ShoppingCart, Image as ImageIcon, BookOpen, Trophy, HelpCircle, Rss, Bell} from 'lucide-react'
import GlobalSearch from '../Search/GlobalSearch'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCreatePost } from '../../contexts/CreatePostContext'
import { useGetUserNotificationsQuery, useGetUserBookingsQuery, useGetUserClientProjectsQuery, useGetUnreadCountQuery } from '../../store/api/userApi'
import { getUserInfo } from '../../utils/auth'
import PostRemovalWarning from '../Warnings/PostRemovalWarning'
import IndicatorDot from '../IndicatorDot/IndicatorDot'
import { getSocket } from '../../utils/socket'
import { useState, useEffect, useRef } from 'react'
import { useSlideNavigation } from '../../hooks/useSlideNavigation'
import { useThrottledResize } from '../../hooks/useThrottledResize'
import NormalNavbar from '../Navigation/NormalNavbar'
import AdvancedNavbar from '../Navigation/AdvancedNavbar'
import SlideDotIndicator from '../Navigation/SlideDotIndicator'
import { ViewingMediaProvider, useViewingMedia } from '../../contexts/ViewingMediaContext'
import SongDetailsSheet from '../Music/SongDetailsSheet'
import { useSlideHandledByParent } from './SlideTransitionContext'

const UserLayoutContent = ({ children }) => {
  const slideHandledByParent = useSlideHandledByParent()
  const { viewingMedia } = useViewingMedia()
  // Apple App Store Color Palette
  const isDark = useColorModeValue(false, true)
  const bgColor = useColorModeValue('#F2F2F7', '#000000')
  const cardBg = useColorModeValue('#FFFFFF', '#1C1C1E')
  const textPrimary = useColorModeValue('#000000', '#FFFFFF')
  const textSecondary = useColorModeValue('#6C6C70', '#98989D')
  const borderColor = useColorModeValue('#E5E5EA', '#2C2C2E')
  const accentBlue = useColorModeValue('#007AFF', '#0A84FF')
  const sidebarBg = useColorModeValue('#FFFFFF', '#1C1C1E')
  const hoverBg = useColorModeValue('#F2F2F7', '#2C2C2E')
  
  const navigate = useNavigate()
  const location = useLocation()
  const isPostPage = location.pathname === '/user/home' || location.pathname === '/user/feed'
  const isChatPage = location.pathname.startsWith('/user/chat')
  const isFeedPage = location.pathname === '/user/feed'
  const isPostDetailsPage = /^\/user\/post\/[^/]+$/.test(location.pathname)
  const { openModal: openCreatePostModal } = useCreatePost()
  const [userInfo, setUserInfo] = useState(getUserInfo())
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isWarningOpen, onOpen: onWarningOpen, onClose: onWarningClose } = useDisclosure()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [removalNotification, setRemovalNotification] = useState(null)
  const [slideDragOffsetX, setSlideDragOffsetX] = useState(0)
  const slideTouchStartX = useRef(0)
  const slideTouchStartY = useRef(0)
  const slideGestureHorizontal = useRef(false)
  
  // Mobile breakpoint (matches useSlideNavigation) – slide nav and menu only on mobile (throttled for perf)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useThrottledResize(() => window.innerWidth < 768, setIsMobile)

  // Get notifications (poll only; no refetch on mount to avoid request burst)
  // Use same args as NotificationBell/HomepageNotificationBell (limit 50) so RTK Query shares one cache = one request
  const { data: notificationsData } = useGetUserNotificationsQuery(
    { page: 1, limit: 50, unreadOnly: false },
    { skip: !userInfo?.id, pollingInterval: 30000, refetchOnWindowFocus: false, refetchOnMountOrArgChange: false }
  )
  
  const unreadNotificationCount = notificationsData?.unreadCount || 0
  
  // Get bookings and projects for indicator dots (no refetch on mount to avoid burst when navigating)
  const { data: bookingsData } = useGetUserBookingsQuery(
    { page: 1, limit: 100 },
    { skip: !userInfo?.id, refetchOnMountOrArgChange: false }
  )
  const { data: projectsData } = useGetUserClientProjectsQuery(
    { page: 1, limit: 100 },
    { skip: !userInfo?.id, refetchOnMountOrArgChange: false }
  )
  
  // Get unread message count for chat indicator (poll only; no refetch on focus/mount to avoid excessive calls)
  const { data: unreadCountData } = useGetUnreadCountQuery(
    undefined,
    {
      skip: !userInfo?.id,
      pollingInterval: 60000,
      refetchOnWindowFocus: false,
      refetchOnMountOrArgChange: false
    }
  )
  
  // Calculate indicator counts
  const pendingBookings = bookingsData?.data?.filter(b => b.status === 'pending').length || 0
  const projectsWithUpdates = projectsData?.data?.filter(p => {
    // Check if project has pending meetings or pending work steps
    const hasPendingMeetings = p.meetings?.some(m => m.status === 'pending')
    const hasPendingSteps = p.workSteps?.some(s => s.status === 'pending' || s.status === 'in-progress')
    return hasPendingMeetings || hasPendingSteps
  }).length || 0
  const unreadMessageCount = unreadCountData?.data?.unreadCount || 0

  // Update userInfo when localStorage changes
  useEffect(() => {
    const updateUserInfo = () => {
      const updatedInfo = getUserInfo()
      if (updatedInfo) {
        setUserInfo(updatedInfo)
      }
    }
    
    // Listen for custom storage update event (dispatched after save)
    const handleUserInfoUpdate = () => {
      // Small delay to ensure localStorage is updated
      setTimeout(updateUserInfo, 50)
    }
    
    window.addEventListener('userInfoUpdated', handleUserInfoUpdate)
    
    // Also check on location change (when navigating)
    updateUserInfo()
    
    // Also listen for storage events (when localStorage is updated from other tabs/windows)
    window.addEventListener('storage', updateUserInfo)
    
    return () => {
      window.removeEventListener('userInfoUpdated', handleUserInfoUpdate)
      window.removeEventListener('storage', updateUserInfo)
    }
  }, [location])

  // Check for post removal notifications and show warning dialog
  useEffect(() => {
    if (!notificationsData?.data || !userInfo?.id) return

    const notifications = notificationsData.data
    const unreadRemovalNotifications = notifications.filter(
      (notif) =>
        !notif.isRead &&
        (notif.title?.includes('Removed') || 
         notif.title?.includes('removed') ||
         notif.message?.includes('removed for violating'))
    )

    if (unreadRemovalNotifications.length > 0 && !isWarningOpen) {
      // Get the most recent removal notification
      const latestRemoval = unreadRemovalNotifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0]

      setRemovalNotification(latestRemoval)
      onWarningOpen()
    }
  }, [notificationsData, userInfo, isWarningOpen, onWarningOpen])

  // Listen for socket notifications to show warning dialog immediately
  useEffect(() => {
    if (!userInfo?.id) return

    const socket = getSocket()
    if (!socket) return

    const handleNewNotification = (notification) => {
      // Check if it's a removal notification
      if (
        notification.title?.includes('Removed') ||
        notification.title?.includes('removed') ||
        notification.message?.includes('removed for violating')
      ) {
        // Show warning dialog immediately
        setRemovalNotification(notification)
        onWarningOpen()
      }
    }

    socket.on('new-notification', handleNewNotification)

    return () => {
      socket.off('new-notification', handleNewNotification)
    }
  }, [userInfo, isWarningOpen, onWarningOpen])

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  // Global Search
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure()

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only prevent default for the search shortcut, not for scrolling
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        onSearchOpen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSearchOpen])

  // Completely disable legacy swipe navigation —
  // HorizontalSlideNavigator handles ALL gestures (no double conflict, no page jumps).
  useSlideNavigation({
    navigate,
    pathname: location.pathname,
    skip: true,
  })

  const menuItems = [
    { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { label: 'Home', path: '/user/home', icon: Home },
    { label: 'Feed', path: '/user/feed', icon: Rss },
    { label: 'Friends', path: '/user/friends', icon: Users },
    { label: 'Chat', path: '/user/chat', icon: MessageCircle },
    { label: 'Notifications', path: '/user/notifications', icon: Bell },
    { label: 'Leaderboard', path: '/user/leaderboard', icon: Trophy },
    { label: 'Support', path: '/user/support', icon: HelpCircle },
    { label: 'Projects', path: '/user/projects', icon: FolderKanban },
    { label: 'My Projects', path: '/user/client-projects', icon: Briefcase },
    { label: 'Store', path: '/user/store', icon: ShoppingCart },
    { label: 'Banner Store', path: '/user/banner-store', icon: ImageIcon },
    { label: 'My Banners', path: '/user/banner-inventory', icon: ImageIcon },
    { label: 'My Stories', path: '/user/stories', icon: BookOpen },
    { label: 'Profile', path: '/user/profile', icon: User },
    { label: 'Settings', path: '/user/settings', icon: Settings },
  ]

  // Mobile menu grouped into sections (Settings-style labels)
  const pathToItem = (path) => menuItems.find((i) => i.path === path)
  const menuSections = [
    {
      title: 'Main',
      items: [pathToItem('/user/home'), pathToItem('/user/feed'), pathToItem('/user/dashboard')].filter(Boolean),
    },
    {
      title: 'Social',
      items: [pathToItem('/user/friends'), pathToItem('/user/chat'), pathToItem('/user/notifications')].filter(Boolean),
    },
    {
      title: 'Explore',
      items: [pathToItem('/user/leaderboard'), pathToItem('/user/support'), pathToItem('/user/projects'), pathToItem('/user/client-projects')].filter(Boolean),
    },
    {
      title: 'Shop',
      items: [pathToItem('/user/store'), pathToItem('/user/banner-store')].filter(Boolean),
    },
    {
      title: 'You',
      items: [pathToItem('/user/banner-inventory'), pathToItem('/user/stories'), pathToItem('/user/profile'), pathToItem('/user/settings')].filter(Boolean),
    },
  ]

  // Main navigation items (Home, Feed, Chat, Dashboard)
  const mainNavItems = [
    { label: 'Home', path: '/user/home', icon: Home },
    { label: 'Feed', path: '/user/feed', icon: Rss },
    { label: 'Chat', path: '/user/chat', icon: MessageCircle },
    { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
  ]
  
  // Profile navigation (single icon)
  const profileNavItem = {
    label: 'Profile',
    path: '/user/profile',
    icon: User,
  }

  // Get navbar settings from userInfo
  const navbarType = userInfo?.navbarSettings?.navbarType || 'normal'
  const advancedNavbarConfig = userInfo?.navbarSettings?.advancedNavbar || null

  // Prepare items for NormalNavbar (include Profile)
  const normalNavItems = [
    ...mainNavItems,
    profileNavItem,
  ]

  // Prepare items for AdvancedNavbar
  // Check if items exist and are valid array
  const hasItemsArray = advancedNavbarConfig?.items && Array.isArray(advancedNavbarConfig.items)
  
  // Use saved items if they exist and have valid data, otherwise use defaults
  // AdvancedNavbar will handle further validation
  let advancedNavItems = [
    { id: 'home', label: 'Home', icon: 'home', route: '/user/home', visible: true, order: 1 },
    { id: 'feed', label: 'Feed', icon: 'feed', route: '/user/feed', visible: true, order: 2 },
    { id: 'chat', label: 'Chat', icon: 'chat', route: '/user/chat', visible: true, order: 3 },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/user/dashboard', visible: true, order: 4 },
    { id: 'profile', label: 'Profile', icon: 'profile', route: '/user/profile', visible: true, order: 5 },
  ]
  
  // If we have saved items, use them (even if empty array - AdvancedNavbar will handle it)
  if (hasItemsArray) {
    // Filter out invalid items but keep the array structure
    const validSavedItems = advancedNavbarConfig.items.filter(item => 
      item && 
      typeof item === 'object' &&
      item.id &&
      item.label &&
      item.icon &&
      item.route
    )
    
    // Only use saved items if we have at least one valid item
    if (validSavedItems.length > 0) {
      advancedNavItems = validSavedItems
    }
  }

  return (
    <Box
      minH={{ base: 0, lg: '100vh' }}
      bg={bgColor}
      position="relative"
      overflowX="hidden"
      overflowY={{ base: 'visible', lg: undefined }}
      style={{
        WebkitOverflowScrolling: 'touch',
        touchAction: slideHandledByParent ? 'none' : 'pan-y',
      }}
    >

      {/* Global Search Modal */}
      <GlobalSearch isOpen={isSearchOpen} onClose={onSearchClose} />

      <Flex
        minH={{ base: 0, lg: '100vh' }}
        position="relative"
        h={{ base: 'auto', lg: '100vh' }}
        overflow={{ base: 'visible', lg: 'hidden' }}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >

        {/* Desktop Sidebar - macOS Glassmorphism (Apple TV style); hidden when viewing media */}
        <Box
          as="aside"
          display={viewingMedia ? 'none' : { base: 'none', lg: 'flex' }}
          flexDirection="column"
          w={isSidebarCollapsed ? "72px" : "280px"}
          minW={isSidebarCollapsed ? "72px" : "280px"}
          position="fixed"
          left={0}
          top={0}
          bottom={0}
          zIndex={100}
          transition="width 0.3s ease"
          overflow="hidden"
          overflowX="hidden"
          pt={5}
          pb={5}
          pl={5}
          pr={0}
          borderRadius="0 24px 24px 0"
          bg="rgba(20, 20, 25, 0.6)"
          border="1px solid rgba(255, 255, 255, 0.08)"
          boxShadow="inset 0 0 0 1px rgba(255,255,255,0.04), 0 10px 40px rgba(0,0,0,0.5)"
          sx={{
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            _before: {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: '0 24px 24px 0',
              padding: '1px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            },
          }}
        >
          {/* Sidebar Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} pr={5}>
            {!isSidebarCollapsed && (
              <Text
                fontSize="14px"
                fontWeight="600"
                color="rgba(255,255,255,0.4)"
                letterSpacing="0.5px"
                textTransform="uppercase"
              >
                Menu
              </Text>
            )}
            <IconButton
              icon={isSidebarCollapsed ? <ChevronRight size={18} color="rgba(255, 255, 255, 0.95)" /> : <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />}
              onClick={toggleSidebar}
              variant="ghost"
              size="sm"
              aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              color="rgba(255,255,255,0.95)"
              _hover={{ bg: 'rgba(255,255,255,0.08)' }}
              borderRadius="14px"
              sx={{ '& svg': { color: 'inherit' } }}
            />
          </Box>
          <Box w="100%" h="1px" bg="rgba(255,255,255,0.08)" flexShrink={0} mb={2} />
          {/* Sidebar Menu Items - mobile-style sections when expanded; icon-only when collapsed */}
          <Box
            flex="1"
            minW={0}
            overflowY="auto"
            overflowX="hidden"
            py={2}
            pr={3}
            pl={0}
            sx={{
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': { bg: 'rgba(255,255,255,0.1)', borderRadius: 3 },
              '&::-webkit-scrollbar-track': { bg: 'transparent' },
              scrollbarWidth: 'thin',
              scrollbarGutter: 'stable',
            }}
          >
            {isSidebarCollapsed ? (
              <VStack spacing={0} align="stretch">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path
                  const Icon = item.icon
                  const iconColor = isActive ? '#ffffff' : 'rgba(255,255,255,0.95)'
                  return (
                    <Box key={item.path} position="relative" w="full">
                      <Button
                        variant="ghost"
                        justifyContent="center"
                        onClick={() => navigate(item.path)}
                        w="full"
                        minH="44px"
                        py={2}
                        px={0}
                        borderRadius="12px"
                        fontSize="14px"
                        fontWeight="500"
                        boxShadow={isActive ? '0 4px 20px rgba(10,132,255,0.4)' : 'none'}
                        sx={{
                          bg: isActive ? 'linear-gradient(135deg, #2ea0ff, #0a84ff)' : 'transparent',
                          color: iconColor,
                          _hover: {
                            bg: isActive ? 'linear-gradient(135deg, #2ea0ff, #0a84ff)' : 'rgba(255,255,255,0.08)',
                          },
                          '& svg, & path, & line, & circle, & polyline': {
                            stroke: 'currentColor !important',
                            color: 'inherit',
                          },
                        }}
                        transition="all 0.25s ease"
                        title={item.label}
                        _active={{ opacity: 0.9 }}
                      >
                        <Box as="span" display="inline-flex" color={iconColor} sx={{ '& svg': { stroke: 'currentColor' } }}>
                          <Icon size={20} strokeWidth={1.5} />
                        </Box>
                      </Button>
                      {((item.path === '/user/client-projects' && (pendingBookings + projectsWithUpdates) > 0) || (item.path === '/user/chat' && unreadMessageCount > 0) || (item.path === '/user/notifications' && unreadNotificationCount > 0)) && (
                        <Box position="absolute" top="-2px" right="-2px" zIndex={1}>
                          <IndicatorDot count={item.path === '/user/client-projects' ? pendingBookings + projectsWithUpdates : item.path === '/user/chat' ? unreadMessageCount : unreadNotificationCount} />
                        </Box>
                      )}
                    </Box>
                  )
                })}
              </VStack>
            ) : (
              <VStack spacing={0} align="stretch">
                {menuSections.map((section) => (
                  <Box key={section.title} w="full" pt={section.title === 'Main' ? 0 : 5} pb={1}>
                    <Text
                      fontSize="13px"
                      fontWeight="600"
                      color="rgba(255,255,255,0.45)"
                      letterSpacing="0.3px"
                      textTransform="uppercase"
                      px={4}
                      mb={2}
                    >
                      {section.title}
                    </Text>
                    <VStack spacing={0} align="stretch">
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.path
                        const Icon = item.icon
                        let indicatorCount = 0
                        if (item.path === '/user/client-projects') indicatorCount = pendingBookings + projectsWithUpdates
                        else if (item.path === '/user/chat') indicatorCount = unreadMessageCount
                        else if (item.path === '/user/notifications') indicatorCount = unreadNotificationCount
                        return (
                          <Box key={item.path} position="relative" w="full">
                            <Button
                              variant="ghost"
                              justifyContent="flex-start"
                              leftIcon={<Icon size={20} strokeWidth={1.5} />}
                              onClick={() => navigate(item.path)}
                              w="full"
                              minH="44px"
                              py={2}
                              px={4}
                              gap={3}
                              borderRadius="12px"
                              fontSize="14px"
                              fontWeight="500"
                              color={isActive ? '#ffffff' : 'rgba(255,255,255,0.7)'}
                              boxShadow={isActive ? '0 4px 20px rgba(10,132,255,0.4)' : 'none'}
                              sx={{
                                bg: isActive ? 'linear-gradient(135deg, #2ea0ff, #0a84ff)' : 'transparent',
                                _hover: {
                                  bg: isActive ? 'linear-gradient(135deg, #2ea0ff, #0a84ff)' : 'rgba(255,255,255,0.08)',
                                },
                              }}
                              transition="all 0.25s ease"
                              _active={{ opacity: 0.9 }}
                              textAlign="left"
                            >
                              <Box as="span" flex="1" minW={0} w="full" display="block" textAlign="left">
                                {item.label}
                              </Box>
                            </Button>
                            {indicatorCount > 0 && (
                              <Box position="absolute" top="50%" right={4} transform="translateY(-50%)" zIndex={1}>
                                <IndicatorDot count={indicatorCount} />
                              </Box>
                            )}
                          </Box>
                        )
                      })}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
          <Box w="100%" h="1px" bg="rgba(255,255,255,0.08)" flexShrink={0} />
          {/* Profile section (bottom) - mobile-style compact block */}
          <Box
            mt="auto"
            pt={4}
            pr={5}
            display="flex"
            flexDirection="column"
            gap={2}
          >
            <HStack
              spacing={3}
              minH="44px"
              py={2}
              px={4}
              borderRadius="12px"
              bg="rgba(255,255,255,0.05)"
              cursor="pointer"
              onClick={() => { navigate('/user/profile'); }}
              _hover={{ bg: 'rgba(255,255,255,0.08)' }}
              transition="all 0.2s"
            >
              <Avatar
                size="sm"
                name={userInfo?.name || 'User'}
                src={userInfo?.profileImage || userInfo?.profilePicture || userInfo?.avatar}
                flexShrink={0}
              />
              {!isSidebarCollapsed && (
                <Text fontSize="14px" fontWeight="500" color="white" noOfLines={1}>
                  {userInfo?.name || 'Profile'}
                </Text>
              )}
            </HStack>
          </Box>
        </Box>

        {/* Mobile Drawer - macOS Glassmorphism (Apple TV style) */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs" motionPreset="none">
          <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(20px)" />
          <DrawerContent
            maxW="280px"
            w="85vw"
            maxH="100dvh"
            h="100dvh"
            display="flex"
            flexDirection="column"
            overflow="hidden"
            borderRight="1px solid rgba(255, 255, 255, 0.08)"
            borderRadius="0 24px 24px 0"
            bg="rgba(20, 20, 25, 0.85)"
            boxShadow="inset 0 0 0 1px rgba(255,255,255,0.04), 0 10px 40px rgba(0,0,0,0.5)"
            pt={{ base: 'max(16px, env(safe-area-inset-top, 0px))', lg: 0 }}
            sx={{
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              animation: 'drawerContentIn 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            }}
          >
            <DrawerCloseButton
              color="rgba(255,255,255,0.8)"
              borderRadius="14px"
              _hover={{ bg: 'rgba(255,255,255,0.08)' }}
              right={3}
              sx={{ top: 'max(16px, env(safe-area-inset-top, 16px))' }}
            />
            <DrawerHeader pt={3} pb={1} pr={12} flexShrink={0}>
              <Text
                fontSize="14px"
                fontWeight="600"
                color="rgba(255,255,255,0.4)"
                letterSpacing="0.5px"
                textTransform="uppercase"
              >
                Menu
              </Text>
            </DrawerHeader>
            <Box w="100%" h="1px" bg="rgba(255,255,255,0.08)" flexShrink={0} mx={3} mt={1} />
            <DrawerBody p={0} display="flex" flexDirection="column" overflow="hidden" flex="1" minH={0}>
              <Box flex="1" minH={0} overflowY="auto" overflowX="hidden" px={3} py={2} sx={{ '&::-webkit-scrollbar': { width: 2 }, '&::-webkit-scrollbar-thumb': { bg: 'rgba(255,255,255,0.1)', borderRadius: 2 }, scrollbarWidth: 'thin' }}>
                <VStack spacing={0} align="stretch">
                  {menuSections.map((section) => (
                    <Box key={section.title} w="full" pt={section.title === 'Main' ? 0 : 5} pb={1}>
                      <Text
                        fontSize="13px"
                        fontWeight="600"
                        color="rgba(255,255,255,0.45)"
                        letterSpacing="0.3px"
                        textTransform="uppercase"
                        px={4}
                        mb={2}
                      >
                        {section.title}
                      </Text>
                      <VStack spacing={0} align="stretch">
                        {section.items.map((item) => {
                          const isActive = location.pathname === item.path
                          const Icon = item.icon
                          let indicatorCount = 0
                          if (item.path === '/user/client-projects') indicatorCount = pendingBookings + projectsWithUpdates
                          else if (item.path === '/user/chat') indicatorCount = unreadMessageCount
                          else if (item.path === '/user/notifications') indicatorCount = unreadNotificationCount
                          return (
                            <Box key={item.path} position="relative" w="full">
                              <Button
                                variant="ghost"
                                justifyContent="flex-start"
                                leftIcon={<Icon size={20} strokeWidth={1.5} />}
                                onClick={() => { navigate(item.path); onClose(); }}
                                w="full"
                                minH="44px"
                                py={2}
                                px={4}
                                gap={3}
                                borderRadius="12px"
                                fontSize="14px"
                                fontWeight="500"
                                color={isActive ? '#ffffff' : 'rgba(255,255,255,0.7)'}
                                boxShadow={isActive ? '0 4px 20px rgba(10,132,255,0.4)' : 'none'}
                                sx={{
                                  bg: isActive ? 'linear-gradient(135deg, #2ea0ff, #0a84ff)' : 'transparent',
                                  _hover: {
                                    bg: isActive ? 'linear-gradient(135deg, #2ea0ff, #0a84ff)' : 'rgba(255,255,255,0.08)',
                                  },
                                }}
                                transition="all 0.25s ease"
                              >
                                {item.label}
                              </Button>
                              {indicatorCount > 0 && (
                                <Box position="absolute" top="50%" right={4} transform="translateY(-50%)" zIndex={1}>
                                  <IndicatorDot count={indicatorCount} />
                                </Box>
                              )}
                            </Box>
                          )
                        })}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
              <Box w="100%" h="1px" bg="rgba(255,255,255,0.08)" flexShrink={0} mx={3} />
              <Box px={3} pt={2} pb={4} flexShrink={0}>
                <HStack
                  spacing={3}
                  minH="44px"
                  py={2}
                  px={4}
                  borderRadius="12px"
                  bg="rgba(255,255,255,0.05)"
                  cursor="pointer"
                  onClick={() => { navigate('/user/profile'); onClose(); }}
                  _hover={{ bg: 'rgba(255,255,255,0.08)' }}
                  transition="all 0.2s"
                >
                  <Avatar
                    size="sm"
                    name={userInfo?.name || 'User'}
                    src={userInfo?.profileImage || userInfo?.profilePicture || userInfo?.avatar}
                    flexShrink={0}
                  />
                  <Text fontSize="14px" fontWeight="500" color="white" noOfLines={1}>
                    {userInfo?.name || 'Profile'}
                  </Text>
                </HStack>
              </Box>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

         {/* Main Content: chat + feed locked to viewport (100dvh) so feed shows one reel; home scrolls with all posts */}
         <Box
           data-user-layout-main
           flex={{ base: 1, lg: 1 }}
           minW={0}
           minH={0}
           p={{ base: 0, md: 0, lg: 0 }}
           pr={{ base: 0, lg: 4 }}
           w={{ base: '100%', lg: viewingMedia ? '100%' : (isSidebarCollapsed ? 'calc(100% - 72px)' : 'calc(100% - 280px)') }}
           ml={{ base: 0, lg: viewingMedia ? 0 : (isSidebarCollapsed ? '72px' : '280px') }}
           pb={{ base: (location.pathname === '/user/home' || isFeedPage) ? 0 : (slideHandledByParent ? (navbarType === 'slide' ? 0 : navbarType === 'advanced' ? '56px' : '80px') : (isChatPage || (navbarType === 'slide' && isMobile)) ? 0 : '80px'), lg: 0 }}
           position="relative"
           transition="margin-left 0.3s ease, width 0.3s ease"
           bg={bgColor}
           h={(isChatPage || isFeedPage) ? '100dvh' : { base: slideHandledByParent ? '100dvh' : 'auto', lg: '100vh' }}
           maxH={(isChatPage || isFeedPage) ? '100dvh' : { base: 'none', lg: '100vh' }}
           overflowY={(isChatPage || isFeedPage) ? 'hidden' : { base: slideHandledByParent ? 'hidden' : 'visible', lg: 'auto' }}
           overflowX="hidden"
           overscrollBehavior={(isChatPage || isFeedPage) ? 'contain' : { base: 'auto', lg: 'contain' }}
           sx={{
             '@media (max-width: 768px)': {
               backgroundColor: 'transparent !important',
               background: 'transparent !important',
               WebkitOverflowScrolling: 'touch',
               touchAction: slideHandledByParent ? 'none' : 'pan-y',
             },
             '@media (min-width: 1024px)': {
               WebkitOverflowScrolling: 'auto',
             },
           }}
         >
           {(() => {
            const isMainRoute = location.pathname === '/user/home' || location.pathname === '/user/feed' || location.pathname.startsWith('/user/chat') || location.pathname === '/user/dashboard' || location.pathname.startsWith('/user/profile')
            const isSettingsPage = location.pathname === '/user/settings'
            const isFriendsPage = location.pathname === '/user/friends'
            const showBackButton = location.pathname.startsWith('/user') && !isMainRoute && !isSettingsPage && !isFriendsPage
            const isSlideRoute = location.pathname === '/user/home' || location.pathname === '/user/feed' || location.pathname.startsWith('/user/chat') || location.pathname === '/user/dashboard' || location.pathname.startsWith('/user/profile')
            // When UserArea provides SlideTransition (nested routes), don't double-wrap. Otherwise use in-layout slide on mobile slide nav.
            // No nested drag transitions — HorizontalSlideNavigator is the only gesture system.
            const useSlideTransition = false
            const maxDrag = typeof window !== 'undefined' ? window.innerWidth * 0.45 : 200
            const handleSlideTouchStart = (e) => {
              if (!useSlideTransition) return
              if (e.target.closest && e.target.closest('[data-swipe-lock="true"]')) return
              if (e.target.closest && e.target.closest('[data-chat-messages]')) return
              slideTouchStartX.current = e.touches[0].clientX
              slideTouchStartY.current = e.touches[0].clientY
              slideGestureHorizontal.current = false
            }
            const handleSlideTouchMove = (e) => {
              if (!useSlideTransition) return
              if (e.target.closest && e.target.closest('[data-swipe-lock="true"]')) return
              if (e.target.closest && e.target.closest('[data-chat-messages]')) return
              const x = e.touches[0].clientX
              const y = e.touches[0].clientY
              const dx = x - slideTouchStartX.current
              const dy = y - slideTouchStartY.current
              if (!slideGestureHorizontal.current) {
                if (Math.abs(dx) > Math.abs(dy) * 1.2) slideGestureHorizontal.current = true
                else return
              }
              const capped = Math.max(-maxDrag, Math.min(maxDrag, dx))
              setSlideDragOffsetX(capped)
            }
            const handleSlideTouchEnd = () => {
              if (!useSlideTransition) return
              setSlideDragOffsetX(0)
              slideGestureHorizontal.current = false
            }
            const content = !useSlideTransition ? children : (
              <Box
                w="100%"
                h="100%"
                minH="inherit"
                overflow="hidden"
                onTouchStart={handleSlideTouchStart}
                onTouchMove={handleSlideTouchMove}
                onTouchEnd={handleSlideTouchEnd}
                onTouchCancel={handleSlideTouchEnd}
                style={{ touchAction: 'pan-y' }}
              >
                <Box
                  w="100%"
                  h="100%"
                  minH="inherit"
                  sx={{
                    transform: `translateX(${slideDragOffsetX}px)`,
                    transition: slideDragOffsetX === 0 ? 'transform 0.2s ease-out' : 'none',
                  }}
                >
                  {/* Lightweight CSS slide-in; no framer-motion for low-end perf */}
                  <div
                    key={location.pathname}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: 'inherit',
                      touchAction: 'pan-y',
                      animation: 'slideInFromRight 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                    }}
                  >
                    {children}
                  </div>
                </Box>
              </Box>
            )
            return (
              <>
                {showBackButton ? (
                  <Box
                    className="back-row"
                    w="100%"
                    h="100%"
                    minH="100%"
                    display="flex"
                    flexDirection="column"
                    sx={{
                      paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
                      paddingRight: 'max(12px, env(safe-area-inset-right, 0px))',
                      paddingBottom: '12px',
                      paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
                    }}
                  >
                    <Box
                      position="sticky"
                      top={0}
                      left={0}
                      right={0}
                      zIndex={20}
                      pt={0}
                      px={{ base: 3, lg: 4 }}
                      pb={2}
                      flexShrink={0}
                      sx={{ backgroundColor: 'inherit' }}
                    >
                      <IconButton
                        aria-label="Go back"
                        icon={<ChevronLeft size={24} />}
                        variant="ghost"
                        size="md"
                        onClick={() => navigate(-1)}
                        borderRadius="12px"
                        color={textPrimary}
                        _hover={{ bg: hoverBg }}
                      />
                    </Box>
                    <Box flex="1" minH={0} display="flex" flexDirection="column">
                      {content}
                    </Box>
                  </Box>
                ) : (
                  content
                )}
              </>
            )
           })()}
         </Box>
       </Flex>

       {/* Dual-Mode Navigation - When horizontal strip: Normal = top nav, Advanced = dots, Slide = none. Hide on feed/chat/post details/viewing media. On profile, hide menu icon. */}
       {slideHandledByParent ? (
         isFeedPage ? null : navbarType === 'normal' ? (
           <NormalNavbar items={normalNavItems} onOpenMenu={location.pathname.startsWith('/user/profile') ? null : onOpen} />
         ) : navbarType === 'advanced' ? (
           <SlideDotIndicator />
         ) : null
       ) : navbarType !== 'slide' && !isChatPage && !isFeedPage && !isPostDetailsPage && !viewingMedia ? (
         navbarType === 'advanced' ? (
           <AdvancedNavbar
             items={advancedNavItems}
             position={advancedNavbarConfig?.position || 'bottom-left'}
           />
         ) : (
           <NormalNavbar items={normalNavItems} onOpenMenu={location.pathname.startsWith('/user/profile') ? null : onOpen} />
         )
       ) : null}

      {/* Notification bell shows only on home page (HomepageNotificationBell in UserHome); removed from other pages */}

      {/* Post Removal Warning Dialog */}
      <PostRemovalWarning
        isOpen={isWarningOpen}
        onClose={onWarningClose}
        notification={removalNotification}
      />

      {/* Song Details Bottom Sheet - when user taps a song on post/reel/profile */}
      <SongDetailsSheet />
    </Box>
  )
}

const UserLayout = ({ children }) => (
  <ViewingMediaProvider>
    <UserLayoutContent>{children}</UserLayoutContent>
  </ViewingMediaProvider>
)

export default UserLayout

