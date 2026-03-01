import {
  Box,
  IconButton,
  Text,
  useColorModeValue,
  Portal,
} from '@chakra-ui/react'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Rss, MessageCircle, LayoutDashboard, User, X } from 'lucide-react'
import { useGetUnreadCountQuery } from '../../store/api/userApi'
import { getUserInfo } from '../../utils/auth'
import IndicatorDot from '../IndicatorDot/IndicatorDot'

const iconMap = {
  home: Home,
  feed: Rss,
  chat: MessageCircle,
  dashboard: LayoutDashboard,
  profile: User,
}

const AdvancedNavbar = ({ items = null, position = 'bottom-left' }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [scrollDirection, setScrollDirection] = useState('down')
  const menuRef = useRef(null)
  const dotRef = useRef(null)
  const audioContextRef = useRef(null)
  const userInfo = getUserInfo()
  
  const { data: unreadCountData } = useGetUnreadCountQuery(
    undefined,
    { skip: !userInfo?.id, pollingInterval: 60000, refetchOnWindowFocus: false, refetchOnMountOrArgChange: false }
  )
  
  const unreadMessageCount = unreadCountData?.data?.unreadCount || 0
  
  const isDark = useColorModeValue(false, true)
  const cardBg = useColorModeValue('#FFFFFF', '#1C1C1E')
  const textPrimary = useColorModeValue('#000000', '#FFFFFF')
  const textSecondary = useColorModeValue('#6C6C70', '#98989D')
  const accentBlue = useColorModeValue('#007AFF', '#0A84FF')
  const hoverBg = useColorModeValue('#F2F2F7', '#2C2C2E')
  const lineColor = useColorModeValue('rgba(0, 122, 255, 0.3)', 'rgba(10, 132, 255, 0.3)')

  const defaultItems = [
    { id: 'home', label: 'Home', icon: 'home', route: '/user/home', visible: true, order: 1 },
    { id: 'feed', label: 'Feed', icon: 'feed', route: '/user/feed', visible: true, order: 2 },
    { id: 'chat', label: 'Chat', icon: 'chat', route: '/user/chat', visible: true, order: 3 },
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/user/dashboard', visible: true, order: 4 },
    { id: 'profile', label: 'Profile', icon: 'profile', route: '/user/profile', visible: true, order: 5 },
  ]

  const isValidItemsArray = items && 
    Array.isArray(items) && 
    items.length > 0 &&
    items.some(item => item && item.route && item.icon && item.label)
  
  let validItems = []
  if (isValidItemsArray) {
    validItems = items.filter(item => 
      item && 
      typeof item === 'object' &&
      item.route && 
      item.icon && 
      item.label &&
      (item.visible !== false)
    )
  }
  
  const itemsToUse = validItems.length >= 2 ? validItems : defaultItems
  
  let navItems = itemsToUse
    .filter(item => item && item.visible !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
  
  if (navItems.length === 0) {
    navItems = defaultItems.filter(item => item.visible !== false)
  }

  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Enhanced scroll tracking with direction
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
      
      // Determine scroll direction
      if (scrollPosition > lastScrollY) {
        setScrollDirection('down')
      } else if (scrollPosition < lastScrollY) {
        setScrollDirection('up')
      }
      
      setLastScrollY(scrollPosition)
      setScrollY(scrollPosition)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('scroll', handleScroll)
    }
  }, [lastScrollY])
  
  const playSound = useCallback((type) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const audioContext = audioContextRef.current
      
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
      
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      if (type === 'open') {
        oscillator.frequency.value = 800
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } else if (type === 'close') {
        oscillator.frequency.value = 400
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } else if (type === 'click') {
        oscillator.frequency.value = 1000
        oscillator.type = 'square'
        gainNode.gain.setValueAtTime(0.08, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.05)
      }
    } catch (error) {
      console.debug('Audio not available:', error)
    }
  }, [])
  
  useEffect(() => {
    if (isOpen) {
      playSound('open')
    } else {
      playSound('close')
    }
  }, [isOpen, playSound])
  
  const positions = useMemo(() => {
    const itemCount = navItems.length
    const isMobile = windowSize.width < 768
    
    const itemSpacing = isMobile ? 80 : 100
    const startOffset = isMobile ? 90 : 110
    
    const calculatedPositions = navItems.map((item, index) => {
      if (isMobile) {
        // Mobile: Rotating circular pattern with scroll-based rotation
        const startAngle = -90
        const angleStep = 360 / itemCount
        const baseAngle = startAngle + (angleStep * index)
        
        // Add rotation based on scroll (1 degree per 10px scroll)
        const scrollRotation = (scrollY / 10) % 360
        const currentAngle = baseAngle + scrollRotation
        
        const radian = (currentAngle * Math.PI) / 180
        const distance = startOffset
        const x = Math.cos(radian) * distance
        const y = Math.sin(radian) * distance
        
        return { ...item, x, y, angle: currentAngle, distance, baseAngle }
      } else {
        // Desktop: Vertical stack with scroll-based rotation
        const baseY = -(startOffset + (index * itemSpacing))
        
        // Add horizontal movement and rotation based on scroll
        const scrollOffset = (scrollY / 5) % 100
        const rotationOffset = scrollDirection === 'down' ? scrollOffset : -scrollOffset
        
        const y = baseY + (scrollOffset * 0.5)
        const x = Math.sin((scrollY + index * 50) / 50) * 20
        
        return { 
          ...item, 
          x, 
          y, 
          angle: rotationOffset, 
          distance: Math.abs(y), 
          baseAngle: 0 
        }
      }
    })
    
    return calculatedPositions
  }, [navItems, windowSize.width, scrollY, scrollDirection])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isOpen) return
      
      const target = event.target
      
      if (menuRef.current && menuRef.current.contains(target)) return
      if (dotRef.current && dotRef.current.contains(target)) return
      
      const isClickNearMenuItems = (() => {
        if (!dotRef.current) return false
        
        const buttonRect = dotRef.current.getBoundingClientRect()
        const buttonCenterX = buttonRect.left + buttonRect.width / 2
        const buttonCenterY = buttonRect.top + buttonRect.height / 2
        
        const clickX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0
        const clickY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0
        
        const distance = Math.sqrt(
          Math.pow(clickX - buttonCenterX, 2) + Math.pow(clickY - buttonCenterY, 2)
        )
        
        const maxRadius = 200
        return distance <= maxRadius
      })()
      
      if (!isClickNearMenuItems) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getPositionStyles = () => {
    const base = { bottom: 2 }
    switch (position) {
      case 'bottom-right':
        return { ...base, right: 20, left: 'auto' }
      case 'bottom-center':
        return { ...base, left: '50%', transform: 'translateX(-50%)', right: 'auto' }
      case 'bottom-left':
      default:
        return { ...base, left: 2, right: 'auto', transform: 'none' }
    }
  }

  const getContainerStyles = () => {
    const isMobile = windowSize.width < 768
    const base = { 
      bottom: isMobile ? 2 : 20,
      width: isMobile ? '100vw' : '400px',
      height: isMobile ? '100vh' : '500px',
    }
    
    switch (position) {
      case 'bottom-right':
        return { 
          ...base, 
          right: isMobile ? 2 : 20, 
          left: 'auto',
        }
      case 'bottom-center':
        return { 
          ...base, 
          left: '50%', 
          transform: 'translate(-50%, 0)', 
          right: 'auto' 
        }
      case 'bottom-left':
      default:
        return { 
          ...base, 
          left: isMobile ? 2 : 20, 
          right: 'auto',
        }
    }
  }

  const handleItemClick = (route, event) => {
    if (event) {
      event.stopPropagation()
    }
    playSound('click')
    navigate(route)
    setTimeout(() => {
      setIsOpen(false)
    }, 100)
  }

  return (
    <>
      <Box
        ref={dotRef}
        position="fixed"
        {...getPositionStyles()}
        zIndex={1001}
        display={{ base: 'block', lg: 'none' }}
      >
        <IconButton
          icon={isOpen ? (
            <X size={20} />
          ) : (
            <Box position="relative">
              <Box w="12px" h="12px" borderRadius="full" bg={textPrimary} />
              {navItems.length > 0 && (
                <Box
                  position="absolute"
                  top="-4px"
                  right="-4px"
                  w="18px"
                  h="18px"
                  borderRadius="full"
                  bg={accentBlue}
                  color="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="10px"
                  fontWeight="600"
                  border="2px solid"
                  borderColor={cardBg}
                >
                  {navItems.length}
                </Box>
              )}
            </Box>
          )}
          aria-label={isOpen ? "Close menu" : `Open menu (${navItems.length} items)`}
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(!isOpen)
          }}
          w="48px"
          h="48px"
          borderRadius="full"
          bg={isOpen ? accentBlue : cardBg}
          color={isOpen ? 'white' : textPrimary}
          border="1px solid"
          borderColor={isOpen ? accentBlue : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)')}
          boxShadow={isOpen 
            ? `0 8px 24px 0 rgba(${isDark ? '10, 132, 255' : '0, 122, 255'}, 0.4)`
            : `0 4px 16px 0 rgba(0, 0, 0, ${isDark ? '0.3' : '0.15'})`
          }
          _hover={{
            transform: 'scale(1.1)',
            boxShadow: `0 8px 24px 0 rgba(${isDark ? '10, 132, 255' : '0, 122, 255'}, 0.5)`,
          }}
          _active={{
            transform: 'scale(0.95)',
          }}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          sx={{
            backdropFilter: 'blur(40px) saturate(180%) brightness(1.05)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%) brightness(1.05)',
          }}
        />
      </Box>

      {isOpen && (
        <Portal>
          <Box
            ref={menuRef}
            position="fixed"
            {...getContainerStyles()}
            zIndex={1001}
            display={{ base: 'block', lg: 'none' }}
            pointerEvents="none"
            overflow="visible"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Connecting Lines (Desktop Only) */}
            {windowSize.width >= 768 && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}
              >
                {positions.map((item, index) => {
                  if (index === 0) return null
                  
                  const prevItem = positions[index - 1]
                  const buttonCenter = 28
                  
                  const getLinePosition = () => {
                    switch (position) {
                      case 'bottom-left':
                      default:
                        return {
                          x1: buttonCenter + prevItem.x,
                          y1: windowSize.height - buttonCenter + prevItem.y,
                          x2: buttonCenter + item.x,
                          y2: windowSize.height - buttonCenter + item.y,
                        }
                    }
                  }
                  
                  const linePos = getLinePosition()
                  
                  return (
                    <line
                      key={`line-${index}`}
                      x1={linePos.x1}
                      y1={linePos.y1}
                      x2={linePos.x2}
                      y2={linePos.y2}
                      stroke={lineColor}
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity={0.6}
                      style={{
                        animation: `dashAnimation 1s linear infinite`,
                      }}
                    />
                  )
                })}
              </svg>
            )}

            {positions.map((item, index) => {
              const Icon = iconMap[item.icon] || Home
              const isActive = location.pathname === item.route ||
                (item.route === '/user/home' && location.pathname === '/user/home') ||
                (item.route === '/user/profile' && location.pathname.startsWith('/user/profile'))
              
              const indicatorCount = item.route === '/user/chat' ? unreadMessageCount : 0
              
              const getItemPosition = () => {
                const buttonCenter = 28
                switch (position) {
                  case 'bottom-right':
                    return {
                      left: `calc(100% - ${buttonCenter}px + ${item.x}px)`,
                      top: `calc(100% - ${buttonCenter}px + ${item.y}px)`,
                    }
                  case 'bottom-center':
                    return {
                      left: `calc(50% + ${item.x}px)`,
                      top: `calc(100% - ${buttonCenter}px + ${item.y}px)`,
                    }
                  case 'bottom-left':
                  default:
                    return {
                      left: `calc(${buttonCenter}px + ${item.x}px)`,
                      top: `calc(100% - ${buttonCenter}px + ${item.y}px)`,
                    }
                }
              }
              
              const itemPos = getItemPosition()
              const itemRotation = item.angle || 0
              
              // Scroll-based reveal with staggered animation
              const revealProgress = Math.min(1, Math.max(0, (scrollY / 150)))
              const scrollOpacity = 0.5 + (revealProgress * 0.5)
              const scale = 0.7 + (revealProgress * 0.3)
              
              return (
                <Box
                  key={item.id || `item-${index}`}
                  position="absolute"
                  left={itemPos.left}
                  top={itemPos.top}
                  transform={`translate(-50%, -50%) rotate(${itemRotation}deg) scale(${scale})`}
                  pointerEvents="auto"
                  zIndex={1002 + index}
                  opacity={scrollOpacity}
                  onClick={(e) => e.stopPropagation()}
                  sx={{
                    animation: `menuItemIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s both`,
                    transition: 'transform 0.3s ease-out, opacity 0.2s ease',
                    willChange: 'transform, opacity',
                    '@keyframes menuItemIn': {
                      '0%': {
                        opacity: 0,
                        transform: `translate(-50%, -50%) scale(0) rotate(-180deg)`,
                      },
                      '100%': {
                        opacity: 1,
                        transform: `translate(-50%, -50%) scale(1) rotate(0deg)`,
                      },
                    },
                    '@keyframes dashAnimation': {
                      '0%': { strokeDashoffset: 0 },
                      '100%': { strokeDashoffset: 10 },
                    },
                  }}
                >
                  <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                    <Box position="relative">
                      <Box
                        as="button"
                        onClick={(e) => handleItemClick(item.route, e)}
                        w="48px"
                        h="48px"
                        borderRadius="full"
                        bg={isActive ? accentBlue : cardBg}
                        color={isActive ? 'white' : textPrimary}
                        border="2px solid"
                        borderColor={isActive ? accentBlue : (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)')}
                        boxShadow={`0 4px 12px 0 rgba(0, 0, 0, ${isDark ? '0.3' : '0.15'})`}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        _hover={{
                          transform: 'scale(1.15) rotate(15deg)',
                          bg: accentBlue,
                          color: 'white',
                          borderColor: accentBlue,
                          boxShadow: `0 6px 20px 0 rgba(${isDark ? '10, 132, 255' : '0, 122, 255'}, 0.5)`,
                        }}
                        _active={{
                          transform: 'scale(0.95)',
                        }}
                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                        sx={{
                          backdropFilter: 'blur(40px) saturate(180%) brightness(1.05)',
                          WebkitBackdropFilter: 'blur(40px) saturate(180%) brightness(1.05)',
                        }}
                      >
                        <Icon size={20} />
                      </Box>
                      {indicatorCount > 0 && <IndicatorDot count={indicatorCount} />}
                    </Box>
                    
                    <Text
                      fontSize="11px"
                      fontWeight="600"
                      color={textPrimary}
                      whiteSpace="nowrap"
                      bg={cardBg}
                      px={3}
                      py={1}
                      borderRadius="full"
                      border="1px solid"
                      borderColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}
                      boxShadow={`0 2px 8px 0 rgba(0, 0, 0, ${isDark ? '0.2' : '0.1'})`}
                      sx={{
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                      }}
                    >
                      {item.label}
                    </Text>
                  </Box>
                </Box>
              )
            })}
          </Box>
        </Portal>
      )}

      {isOpen && (
        <Portal>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.300"
            backdropFilter="blur(8px)"
            WebkitBackdropFilter="blur(8px)"
            zIndex={999}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                if (dotRef.current) {
                  const buttonRect = dotRef.current.getBoundingClientRect()
                  const buttonCenterX = buttonRect.left + buttonRect.width / 2
                  const buttonCenterY = buttonRect.top + buttonRect.height / 2
                  
                  const distance = Math.sqrt(
                    Math.pow(e.clientX - buttonCenterX, 2) + Math.pow(e.clientY - buttonCenterY, 2)
                  )
                  
                  if (distance > 200) {
                    setIsOpen(false)
                  }
                } else {
                  setIsOpen(false)
                }
              }
            }}
            sx={{
              animation: 'fadeIn 0.2s ease-out',
              '@keyframes fadeIn': {
                '0%': { opacity: 0 },
                '100%': { opacity: 1 },
              },
            }}
          />
        </Portal>
      )}
    </>
  )
}

export default AdvancedNavbar