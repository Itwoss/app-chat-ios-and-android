import {
  Box,
  Flex,
  Button,
  useColorModeValue,
} from '@chakra-ui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useThrottledResize } from '../../hooks/useThrottledResize'
import { Home, Rss, MessageCircle, LayoutDashboard, User, Menu } from 'lucide-react'
import { useGetUnreadCountQuery } from '../../store/api/userApi'
import { getUserInfo } from '../../utils/auth'
import IndicatorDot from '../IndicatorDot/IndicatorDot'
import { useSlideNavigator } from '../../contexts/SlideNavigatorContext'

const NormalNavbar = ({ items = null, onOpenMenu = null }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { goToIndex } = useSlideNavigator()
  const userInfo = getUserInfo()
  
  // Scroll: hide navbar on scroll down, show on scroll up (mobile/tablet only)
  const [isNavbarVisible, setIsNavbarVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  )
  useThrottledResize(() => window.innerWidth < 1024, setIsMobile)

  // Get unread message count for chat indicator (uses shared RTK cache; poll only)
  const { data: unreadCountData } = useGetUnreadCountQuery(
    undefined,
    { skip: !userInfo?.id, pollingInterval: 60000, refetchOnWindowFocus: false, refetchOnMountOrArgChange: false }
  )
  const unreadMessageCount = unreadCountData?.data?.unreadCount || 0

  const isDark = useColorModeValue(false, true)
  const defaultItems = [
    { label: 'Home', path: '/user/home', icon: Home },
    { label: 'Feed', path: '/user/feed', icon: Rss },
    { label: 'Chat', path: '/user/chat', icon: MessageCircle },
    { label: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { label: 'Profile', path: '/user/profile', icon: User },
  ]
  const navItems = items || defaultItems

  // Scroll: hide on scroll down, show on scroll up (window + layout + slide inner)
  // Use a minimum delta and throttle state updates so we don't cause lag
  const MIN_SCROLL_DELTA = 10
  const SCROLL_THROTTLE_MS = 80
  useEffect(() => {
    const isNarrow = () => window.innerWidth < 1024

    const getContainers = () => ({
      main: document.querySelector('[data-user-layout-main]'),
      inner: document.querySelector('[data-user-scroll-main]'),
    })

    let lastY = 0
    let lastUpdate = 0
    let attachedMain = null
    let attachedInner = null

    const getScrollY = () => {
      const pageY = window.scrollY
      const { main, inner } = getContainers()
      const mainY = main?.scrollTop ?? 0
      const innerY = inner?.scrollTop ?? 0
      return Math.max(pageY, mainY, innerY)
    }

    const handleScroll = () => {
      if (!isNarrow()) {
        setIsNavbarVisible(true)
        return
      }

      const currentY = getScrollY()
      const delta = currentY - lastY

      if (currentY < 10) {
        setIsNavbarVisible(true)
        lastY = currentY
        return
      }

      if (Math.abs(delta) < MIN_SCROLL_DELTA) {
        lastY = currentY
        return
      }

      const scrollingDown = delta > 0
      const now = Date.now()
      if (now - lastUpdate >= SCROLL_THROTTLE_MS) {
        lastUpdate = now
        setIsNavbarVisible(!scrollingDown)
      }
      lastY = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    const { main, inner } = getContainers()
    if (main) {
      attachedMain = main
      main.addEventListener('scroll', handleScroll, { passive: true })
    }
    if (inner) {
      attachedInner = inner
      inner.addEventListener('scroll', handleScroll, { passive: true })
    }
    // Slide inner (motion.div) may mount after AnimatePresence; attach on next frame
    const t = requestAnimationFrame(() => {
      const late = document.querySelector('[data-user-scroll-main]')
      if (late && late !== attachedInner) {
        attachedInner = late
        late.addEventListener('scroll', handleScroll, { passive: true })
      }
    })

    return () => {
      cancelAnimationFrame(t)
      window.removeEventListener('scroll', handleScroll)
      attachedMain?.removeEventListener('scroll', handleScroll)
      attachedInner?.removeEventListener('scroll', handleScroll)
    }
  }, [location.pathname])

  const navBarStyle = {
    background: 'transparent',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    boxShadow: 'none',
  }

  return (
    <>
      <Flex
        as="nav"
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        w="100%"
        maxW="280px"
        mx="auto"
        h="44px"
        zIndex={1000}
        display={{ base: 'flex', lg: 'none' }}
        px={1}
        pb={0}
        gap={1.5}
        align="center"
        justify="center"
        pointerEvents={isMobile && !isNavbarVisible ? 'none' : 'auto'}
        transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        transform={isMobile && !isNavbarVisible ? 'translateY(100%)' : 'translateY(0)'}
      >
        {/* Navbar 1: Home, Feed, Chat, Dashboard, Profile */}
        <Box
          flex="1"
          minW={0}
          h="44px"
          borderRadius="50px"
          overflow="visible"
          position="relative"
          pointerEvents="auto"
          sx={navBarStyle}
          transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        >
          <Flex
            w="100%"
            h="100%"
            justify="space-evenly"
            align="center"
            px={0.5}
            position="relative"
            zIndex={2}
            alignItems="center"
            justifyContent="center"
          >
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/user/home' && location.pathname === '/user/home') ||
                (item.path === '/user/profile' && location.pathname.startsWith('/user/profile'))
              const Icon = item.icon
              
              const indicatorCount = item.path === '/user/chat' ? unreadMessageCount : 0
              
              return (
                <Box 
                  key={item.label} 
                  position="relative" 
                  flex="1" 
                  minW="0"
                  maxW="44px"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  overflow="visible"
                >
                  <Button
                    type="button"
                    variant="ghost"
                    flexDirection="row"
                    h="100%"
                    minH="auto"
                    py={0}
                    px={1}
                    w="100%"
                    maxW="44px"
                    borderRadius="16px"
                    cursor="pointer"
                    onClick={() => {
                      const idx = navItems.findIndex((n) => n.path === item.path)
                      if (typeof goToIndex === 'function' && idx >= 0) goToIndex(idx)
                      navigate(item.path)
                    }}
                    bg="transparent"
                    color="transparent"
                    justifyContent="center"
                    alignItems="center"
                    gap={0}
                    position="relative"
                    display="flex"
                    aria-label={item.label}
                    sx={{
                      ...(isActive ? {
                        background: 'transparent',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                      } : {}),
                    }}
                    _hover={{
                      bg: isActive 
                        ? 'transparent' 
                        : 'rgba(0, 0, 0, 0.05)',
                      '@media (prefers-color-scheme: dark)': {
                        bg: isActive 
                          ? 'transparent' 
                          : 'rgba(255, 255, 255, 0.05)',
                      },
                      transform: 'scale(1.05)',
                      backdropFilter: 'blur(4px)',
                      WebkitBackdropFilter: 'blur(4px)',
                    }}
                    _active={{
                      transform: 'scale(0.95)',
                    }}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  >
                    <Box
                      as="span"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      color={isActive ? "blue.400" : "gray.700"}
                      _dark={{
                        color: isActive ? "blue.400" : "gray.300"
                      }}
                    >
                      <Icon size={18} />
                    </Box>
                  </Button>
                  
                  {indicatorCount > 0 && (
                    <Box position="absolute" top="-2px" right="-2px" zIndex={1}>
                      <IndicatorDot count={indicatorCount} />
                    </Box>
                  )}
                </Box>
              )
            })}
          </Flex>
        </Box>

        {/* Navbar 2: Menu only - opens side drawer */}
        {onOpenMenu && (
          <Box
            flex="0 0 auto"
            w="44px"
            h="44px"
            borderRadius="50px"
            overflow="visible"
            position="relative"
            pointerEvents="auto"
            sx={navBarStyle}
            transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Button
              variant="ghost"
              flexDirection="row"
              h="100%"
              minH="44px"
              py={0}
              px={1}
              w="100%"
              borderRadius="16px"
              onClick={onOpenMenu}
              aria-label="Open menu"
              bg="transparent"
              color="transparent"
              justifyContent="center"
              alignItems="center"
              gap={0}
              display="flex"
              _hover={{
                bg: 'rgba(0, 0, 0, 0.05)',
                _dark: { bg: 'rgba(255, 255, 255, 0.05)' },
                transform: 'scale(1.05)',
              }}
              _active={{ transform: 'scale(0.95)' }}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <Box as="span" display="inline-flex" color="gray.700" _dark={{ color: 'gray.300' }}>
                <Menu size={18} />
              </Box>
            </Button>
          </Box>
        )}
      </Flex>
    </>
  )
}

export default NormalNavbar