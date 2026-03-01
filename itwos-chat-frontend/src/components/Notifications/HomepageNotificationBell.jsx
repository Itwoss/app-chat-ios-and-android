import {
  Box,
  IconButton,
  HStack,
  VStack,
  Text,
  Avatar,
  useColorModeValue,
  useBreakpointValue,
  Badge,
  useDisclosure,
} from '@chakra-ui/react'
import { 
  Bell, 
  X, 
  MessageCircle, 
  Heart, 
  UserPlus, 
  UserCheck, 
  Calendar,
  FileText,
  CheckCircle,
  AlertCircle,
  AtSign,
} from 'lucide-react'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getSocket } from '../../utils/socket'
import { getUserInfo } from '../../utils/auth'
import { useGetUserNotificationsQuery } from '../../store/api/userApi'
import { STORAGE_KEYS } from '../../utils/storageKeys'
import NotificationsDrawer from './NotificationsDrawer'

/** Resolve avatar URL: use as-is if absolute, else prepend API base (for relative paths from backend). */
function resolveAvatarUrl(url) {
  if (!url || typeof url !== 'string') return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const base = (import.meta.env.VITE_API_URL || '').toString().trim().replace(/\/+$/, '')
  const path = url.replace(/^\/+/, '')
  return base ? `${base}/${path}` : url
}

// ─── Swipe-lock helper ────────────────────────────────────────────────────────
// Attaches a *non-passive* touchstart listener to the given element so that
// framer-motion's pointermove can call preventDefault() and stop the browser
// from recognising it as a horizontal navigation swipe / sidebar swipe.
// We also block touchmove at the window level while a drag is in progress so
// iOS's back-swipe gesture and any React Router slide transition can't fire.
function useTouchSwipeLock(ref) {
  const draggingRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // We need { passive: false } — only achievable via addEventListener, not JSX.
    const onTouchStart = (e) => {
      draggingRef.current = false // reset; framer decides if it's a drag
    }

    // Framer fires pointerdown → pointermove. We hook window touchmove so we
    // can preventDefault AFTER we know the user is actually dragging the pill.
    const onWindowTouchMove = (e) => {
      if (draggingRef.current) {
        // Prevent both the iOS back-swipe and any custom swipe-nav listener.
        e.preventDefault()
        e.stopPropagation()
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove', onWindowTouchMove, { passive: false })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onWindowTouchMove)
    }
  }, [ref])

  // Called by onDragStart / onDragEnd from framer-motion
  const setDragging = useCallback((val) => {
    draggingRef.current = val
  }, [])

  return { setDragging }
}
// ─────────────────────────────────────────────────────────────────────────────

const HomepageNotificationBell = ({ inline = false }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const userInfo = getUserInfo()
  const { isOpen: isDrawerOpen, onOpen: onDrawerOpen, onClose: onDrawerClose } = useDisclosure()
  const currentUserId = userInfo?.id

  const [isExpanded, setIsExpanded] = useState(false)
  const [notificationData, setNotificationData] = useState(null)
  const [isPulsing, setIsPulsing] = useState(false)
  const [notificationQueue, setNotificationQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false)

  const autoHideTimerRef = useRef(null)
  const pulseTimeoutRef = useRef(null)
  const displayedNotificationIdsRef = useRef(new Set())
  const handleCloseRef = useRef(null)
  const currentShowingIdRef = useRef(null)
  const processNextRef = useRef(null)

  // Ref for the draggable pill element — used by the swipe-lock hook
  const pillRef = useRef(null)
  const { setDragging } = useTouchSwipeLock(pillRef)

  // Track whether the pointer moved (drag) or stayed (tap)
  const didDragRef = useRef(false)
  // Capture pointer position on down so we can threshold-check on up
  const pointerDownPosRef = useRef({ x: 0, y: 0 })

  const notificationSoundRef = useRef(
    typeof Audio !== 'undefined' ? new Audio('/notification.mp3') : null
  )

  const isOnHomePage = location.pathname === '/user/home'
  const isMobileOrTablet = useBreakpointValue({ base: true, lg: false }) ?? false

  const { data: notificationsData, refetch } = useGetUserNotificationsQuery(
    { page: 1, limit: 50, unreadOnly: false },
    {
      skip: !currentUserId || !isOnHomePage,
      pollingInterval: 30000,
      refetchOnWindowFocus: false,
      refetchOnMountOrArgChange: false,
    }
  )

  const unreadCount = notificationsData?.unreadCount || 0
  const totalInQueue = notificationQueue.length + (notificationData ? 1 : 0)

  // ── Colors ──────────────────────────────────────────────────────────────────
  const bellBg = useColorModeValue('rgba(255,255,255,0.6)', 'rgba(28,28,30,0.6)')
  const borderColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(255,255,255,0.2)')
  const textColor = useColorModeValue('gray.900', 'gray.50')
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400')
  const indicatorColor = 'rgb(255,0,81)'
  const pillGlassBg = useColorModeValue('rgba(255,255,255,0.2)', 'rgba(0,0,0,0.2)')
  const iconCircleBg = useColorModeValue('rgba(255,0,80,0.12)', 'rgba(255,0,80,0.2)')
  const iconCircleBorder = useColorModeValue('rgba(255,0,80,0.25)', 'rgba(255,0,80,0.4)')
  const iconColor = useColorModeValue('rgba(255,0,80,0.9)', '#FF0050')

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const shouldShowPopup = () => isOnHomePage && !!notificationData

  const saveDisplayedNotifications = () => {
    try {
      const ids = Array.from(displayedNotificationIdsRef.current)
      localStorage.setItem(
        STORAGE_KEYS.DISPLAYED_NOTIFICATION_IDS,
        JSON.stringify(ids.slice(-100))
      )
    } catch (e) {
      console.warn('[NotificationBell] Failed to save displayed ids:', e)
    }
  }

  const getNotificationIcon = (type) => {
    const p = { size: 16, color: 'currentColor' }
    switch (type) {
      case 'message': return <MessageCircle {...p} />
      case 'like': return <Heart {...p} />
      case 'comment': return <MessageCircle {...p} />
      case 'follow': return <UserPlus {...p} />
      case 'friend_request': return <UserCheck {...p} />
      case 'meeting_request':
      case 'meeting_scheduled': return <Calendar {...p} />
      case 'project_update':
      case 'status_change': return <FileText {...p} />
      case 'milestone_completed': return <CheckCircle {...p} />
      case 'mention': return <AtSign {...p} />
      default: return <AlertCircle {...p} />
    }
  }

  const getSenderInfo = (notification) => {
    if (!notification) return { name: 'User', avatar: null }
    if (notification.sender?._id) {
      const rawAvatar =
        notification.sender.profilePicture ||
        notification.sender.avatar ||
        notification.sender.profileImage ||
        null
      return {
        name: notification.sender.name || notification.sender.username || 'User',
        avatar: resolveAvatarUrl(rawAvatar) || rawAvatar,
      }
    }
    if (notification.type === 'message' && notification.title) {
      const rawAvatar = notification.sender?.profilePicture || notification.sender?.avatar || notification.sender?.profileImage || null
      return {
        name: notification.title,
        avatar: resolveAvatarUrl(rawAvatar) || rawAvatar,
      }
    }
    return { name: notification.title || 'User', avatar: null }
  }

  const getNotificationMessage = (notification) => {
    if (!notification) return 'New notification'
    if (notification.merged && notification.latestMessage) return notification.latestMessage
    if (notification.message) return notification.message
    return notification.title || 'New notification'
  }

  const getPriority = (n) => {
    switch (n?.type) {
      case 'message': return 1
      case 'mention': return 2
      case 'comment': return 3
      case 'follow':
      case 'friend_request': return 4
      case 'like': return 5
      default: return 6
    }
  }

  const mergeSimilarNotifications = (queue) => {
    const map = {}
    queue.forEach((n) => {
      const key = `${n.sender?._id ?? n.sender ?? 'unknown'}-${n.type ?? 'unknown'}`
      if (!map[key]) {
        map[key] = { ...n, count: 1, merged: false }
      } else {
        map[key] = {
          ...map[key],
          count: (map[key].count || 1) + 1,
          merged: true,
          latestMessage: n.message || n.title || map[key].latestMessage,
          createdAt: n.createdAt || map[key].createdAt,
        }
      }
    })
    return Object.values(map)
  }

  const truncateMessage = (text, maxLength = 30) => {
    if (!text) return 'New notification'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // ── Queue processing ─────────────────────────────────────────────────────────
  const processNextNotification = () => {
    if (notificationQueue.length === 0) {
      setIsExpanded(false)
      setNotificationData(null)
      setCurrentIndex(0)
      return
    }
    if (isExpanded) return

    const next = notificationQueue[0]
    currentShowingIdRef.current = next?._id ?? null
    setNotificationQueue((prev) => prev.slice(1))
    setNotificationData(next)
    setCurrentIndex((prev) => prev + 1)
    setIsExpanded(true)

    if (notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0
      notificationSoundRef.current.volume = 0.4
      notificationSoundRef.current.play().catch(() => {})
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30)
    }

    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current)
    if (autoHideTimerRef.current) clearTimeout(autoHideTimerRef.current)

    setIsPulsing(true)
    pulseTimeoutRef.current = setTimeout(() => {
      setIsPulsing(false)
      pulseTimeoutRef.current = null
    }, 2000)

    autoHideTimerRef.current = setTimeout(() => {
      const idToMark = currentShowingIdRef.current
      if (idToMark) {
        displayedNotificationIdsRef.current.add(idToMark)
        saveDisplayedNotifications()
      }
      currentShowingIdRef.current = null
        clearTimeout(autoHideTimerRef.current)
        autoHideTimerRef.current = null
      setIsExpanded(false)
      setNotificationData(null)
      setTimeout(() => processNextRef.current?.(), 120)
    }, 5000)
  }
  processNextRef.current = processNextNotification

  // ── handleClose ──────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (notificationData?._id) {
      displayedNotificationIdsRef.current.add(notificationData._id)
      saveDisplayedNotifications()
    }
    currentShowingIdRef.current = null
    setIsExpanded(false)
    setNotificationData(null)
    if (autoHideTimerRef.current) {
      clearTimeout(autoHideTimerRef.current)
      autoHideTimerRef.current = null
    }
    setTimeout(() => processNextRef.current?.(), 100)
  }, [notificationData])
  handleCloseRef.current = handleClose

  // ── addToQueue ───────────────────────────────────────────────────────────────
  const addToQueue = useCallback((notification) => {
    if (!notification?._id) return
    if (displayedNotificationIdsRef.current.has(notification._id)) return

    if (notification.type === 'message' && location.pathname.startsWith('/user/chat')) {
      const chatUserId = location.pathname.match(/\/user\/chat\/([^/]+)/)?.[1]
      const notifChatUserId = notification.link?.match(/\/user\/chat\/([^/]+)/)?.[1]
      if (notifChatUserId === chatUserId) {
        displayedNotificationIdsRef.current.add(notification._id)
        saveDisplayedNotifications()
        return
      }
    }

    setNotificationQueue((prev) => {
      if (prev.some((n) => n._id === notification._id)) return prev
      const incomingPriority = getPriority(notification)
      const filtered = prev.filter((item) => getPriority(item) <= incomingPriority)
      const merged = mergeSimilarNotifications([...filtered, notification])
      return merged.sort((a, b) => getPriority(a) - getPriority(b))
    })
  }, [location.pathname])

  // ── Clear timers on unmount / page change ────────────────────────────────────
  useEffect(() => {
    if (!isOnHomePage) {
        clearTimeout(autoHideTimerRef.current)
        clearTimeout(pulseTimeoutRef.current)
    }
    return () => {
        clearTimeout(autoHideTimerRef.current)
        clearTimeout(pulseTimeoutRef.current)
    }
  }, [isOnHomePage])

  useEffect(() => {
    if (location.pathname !== '/user/home') {
      setNotificationData(null)
      setIsExpanded(false)
      setNotificationQueue([])
      clearTimeout(autoHideTimerRef.current)
      clearTimeout(pulseTimeoutRef.current)
    }
  }, [location.pathname])

  // ── Process queue when it grows ──────────────────────────────────────────────
  useEffect(() => {
    if (!isExpanded && notificationQueue.length > 0) {
      const t = setTimeout(() => processNextNotification(), 50)
      return () => clearTimeout(t)
    }
  }, [notificationQueue.length, isExpanded])

  // ── Load displayed-ids from localStorage ─────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DISPLAYED_NOTIFICATION_IDS)
      if (stored) {
        const parsed = JSON.parse(stored)
        displayedNotificationIdsRef.current = new Set(Array.isArray(parsed) ? parsed : [])
      }
    } catch (e) {
      console.warn('[NotificationBell] Failed to load displayed ids:', e)
    }
  }, [])

  // ── Socket listeners ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOnHomePage || !currentUserId) return
    const socket = getSocket()
    if (!socket) return

    const handleNewNotification = (notification) => {
      addToQueue(notification)
      refetch()
    }

    const handleNewMessage = (data) => {
      if (!data?.message) return
      if (data.message.receiver?._id?.toString() !== currentUserId?.toString()) return

      if (location.pathname.startsWith('/user/chat')) {
        const chatUserId = location.pathname.match(/\/user\/chat\/([^/]+)/)?.[1]
        if (chatUserId === data.message.sender?._id?.toString()) return
      }

      addToQueue({
          _id: `message-${Date.now()}-${Math.random()}`,
          type: 'message',
          title: data.message.sender?.name || 'New Message',
          message: data.message.content || 'Sent you a message',
          link: `/user/chat/${data.message.sender?._id || data.senderId}`,
          sender: data.message.sender || {},
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
      })
    }

    socket.on('new-notification', handleNewNotification)
    socket.on('new-message', handleNewMessage)

    return () => {
      socket.off('new-notification', handleNewNotification)
      socket.off('new-message', handleNewMessage)
        clearTimeout(autoHideTimerRef.current)
        clearTimeout(pulseTimeoutRef.current)
    }
  }, [isOnHomePage, currentUserId, location.pathname, refetch, addToQueue])

  // ── Initial unread load ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOnHomePage || !notificationsData?.data || hasLoadedInitial || isExpanded) return

    const unread = notificationsData.data
      .filter((n) => {
        if (!n._id) return false
        if (displayedNotificationIdsRef.current.has(n._id)) return false
        if (n.type === 'message' && location.pathname.startsWith('/user/chat')) {
          const chatUserId = location.pathname.match(/\/user\/chat\/([^/]+)/)?.[1]
          const notifChatUserId = n.link?.match(/\/user\/chat\/([^/]+)/)?.[1]
          if (notifChatUserId === chatUserId) return false
        }
        return !n.isRead
      })
      .sort((a, b) => {
        const da = new Date(a.createdAt || a.timestamp || 0)
        const db = new Date(b.createdAt || b.timestamp || 0)
        return da - db
      })

    if (unread.length > 0) {
      setHasLoadedInitial(true)
      setNotificationQueue(unread)
      setCurrentIndex(0)
    }
  }, [notificationsData, isOnHomePage, hasLoadedInitial, isExpanded, location.pathname])

  // ── Clear everything when no unread ──────────────────────────────────────────
  useEffect(() => {
    if (unreadCount === 0) {
        clearTimeout(autoHideTimerRef.current)
        clearTimeout(pulseTimeoutRef.current)
      setNotificationData(null)
      setNotificationQueue([])
      setIsExpanded(false)
    }
  }, [unreadCount])

  // ── Derived values for render ─────────────────────────────────────────────────
  const senderInfo = notificationData ? getSenderInfo(notificationData) : { name: 'User', avatar: null }
  const notificationMessage = notificationData ? getNotificationMessage(notificationData) : ''

  // ── Animation variants ────────────────────────────────────────────────────────
  const dynamicIslandVariants = {
    collapsed: { height: 46, borderRadius: 22, scale: 0.96, y: -60, opacity: 0 },
    expanded: {
      height: 'auto',
      borderRadius: 50,
      scale: 1,
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 360, damping: 32, mass: 0.9 },
    },
    exit: { y: -40, opacity: 0, scale: 0.97, transition: { duration: 0.18 } },
  }

  if (!isOnHomePage) return null

  const hasNotificationsToShow =
    unreadCount > 0 || notificationQueue.length > 0 || !!notificationData
  if (!inline && !hasNotificationsToShow) return null

  return (
    <>
      {/* ── Dynamic-Island popup ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {shouldShowPopup() && (
          <>
            {/*
              Backdrop: transparent, covers whole screen.
              Clicking the backdrop closes the popup.
              touchAction: 'pan-y' allows vertical scroll so the page can scroll while the popup is visible.
            */}
            <Box
              position="fixed"
              inset={0}
              zIndex={10000}
              pointerEvents="auto"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleClose()
              }}
              sx={{ touchAction: 'pan-y' }}
            />

            <Box
              position="fixed"
              left={0}
              right={0}
              top={0}
              zIndex={10001}
              display="flex"
              justifyContent="center"
              alignItems="flex-start"
              px={{ base: 3, md: 4 }}
              pointerEvents="none"
              sx={{ paddingTop: 'max(12px, env(safe-area-inset-top, 0px))' }}
    >
      <motion.div
                ref={pillRef}              // ← attached for the non-passive touch listener
                variants={dynamicIslandVariants}
                initial="collapsed"
                animate="expanded"
                exit="exit"
                drag
                dragConstraints={{ top: -80, bottom: 120, left: -120, right: 120 }}
                dragElastic={0.22}
                dragMomentum={false}       // ← prevents momentum from re-triggering browser gestures
                dragTransition={{ bounceStiffness: 480, bounceDamping: 32 }}
                // ─ Key fix: tell framer to preventDefault on pointer capture so
                //   browser won't interpret the same touch as a swipe gesture.
                onDragStart={() => {
                  setDragging(true)
                  didDragRef.current = false
                }}
                onDrag={() => {
                  didDragRef.current = true
                }}
                onDragEnd={(e, info) => {
                  setDragging(false)
                  const dismissDown = info.offset.y > 40 || info.velocity.y > 250
                  const dismissLeft = info.offset.x < -50 || info.velocity.x < -300
                  const dismissRight = info.offset.x > 50 || info.velocity.x > 300
                  if (dismissDown || dismissLeft || dismissRight) {
                    handleClose()
                  }
                }}
                onPointerDown={(e) => {
                  pointerDownPosRef.current = { x: e.clientX, y: e.clientY }
                  didDragRef.current = false
                  // Capture the pointer so framer can call preventDefault on
                  // subsequent move events at the browser level.
                  e.currentTarget.setPointerCapture?.(e.pointerId)
                }}
                onPointerUp={(e) => {
                  // Only treat as a "tap" if the pointer didn't move much
                  const dx = Math.abs(e.clientX - pointerDownPosRef.current.x)
                  const dy = Math.abs(e.clientY - pointerDownPosRef.current.y)
                  const isTap = dx < 8 && dy < 8 && !didDragRef.current
                  if (isTap) {
                    if (notificationData?.link) navigate(notificationData.link)
                    handleClose()
                  }
        }}
        style={{
                  width: 'fit-content',
                  minWidth: '200px',
                  maxWidth: '320px',
                  overflow: 'hidden',
                  pointerEvents: 'auto',
                  cursor: 'grab',
                  // Critically: 'none' lets our non-passive listener handle swipe,
                  // while framer's pointer capture handles the drag itself.
                  touchAction: 'none',
                  transform: 'translateZ(0)',
                  willChange: 'transform',
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                }}
                whileDrag={{ cursor: 'grabbing' }}
              >
                <Box
                  position="relative"
                  w="fit-content"
                  maxW="100%"
                  borderRadius="50px"
                  overflow="hidden"
                  border="1px solid"
                  borderColor={borderColor}
                  boxShadow="0 8px 24px rgba(0,0,0,0.12)"
                >
                  <Box
                    position="absolute"
                    inset={0}
                    bg={pillGlassBg}
                    sx={{
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                    }}
                    zIndex={0}
                  />
                  <Box position="relative" zIndex={2} p={3} pointerEvents="none">
                    <HStack spacing={3} align="center" w="full" minW={0}>
                      {senderInfo.avatar ? (
                        <Avatar
                          src={senderInfo.avatar}
                          name={senderInfo.name}
                          size="sm"
                          w="36px"
                          h="36px"
                          minW="36px"
                          flexShrink={0}
                        />
                      ) : (
                        <Box
                          w="36px"
                          h="36px"
                          minW="36px"
                          borderRadius="full"
                          bg={iconCircleBg}
                          border="1px solid"
                          borderColor={iconCircleBorder}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color={iconColor}
                          flexShrink={0}
                        >
                          {getNotificationIcon(notificationData.type)}
                        </Box>
                      )}

                      <VStack align="start" spacing={0.5} flex="0 1 auto" minW={0} maxW="100%" overflow="hidden">
                        <HStack justify="space-between" w="full" align="center" minW={0}>
                          <HStack spacing={2} minW={0}>
                            <Text
                              fontWeight="600"
                              fontSize="sm"
                              color={textColor}
                              noOfLines={1}
                              overflow="hidden"
                              textOverflow="ellipsis"
                            >
                              {senderInfo.name}
                            </Text>
                          </HStack>
                        </HStack>
                        <Text
                          fontSize="xs"
                          color={secondaryTextColor}
                          noOfLines={2}
                          w="full"
                          overflow="hidden"
                          textOverflow="ellipsis"
                          display="-webkit-box"
                          sx={{ WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                        >
                          {notificationMessage}
                        </Text>
                      </VStack>

                      {/* Close button: stop propagation so pill doesn't capture pointer; click closes */}
                      <Box
                        pointerEvents="auto"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleClose()
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <IconButton
                          aria-label="Close notification"
                          icon={<X size={16} />}
                          size="xs"
                          variant="ghost"
                          flexShrink={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleClose()
                          }}
                        />
                      </Box>
                    </HStack>
                  </Box>
                </Box>
              </motion.div>
            </Box>
          </>
        )}
      </AnimatePresence>

      {/* ── Bell icon ─────────────────────────────────────────────────────────── */}
      <Box
        position={inline ? 'relative' : 'fixed'}
        top={
          inline
            ? undefined
            : { base: 'calc(env(safe-area-inset-top, 0px) + 16px)', md: '20px' }
        }
        right={
          inline
            ? undefined
            : { base: 'calc(env(safe-area-inset-right, 0px) + 16px)', md: '24px' }
        }
        zIndex={inline ? 10 : 10000}
      >
        <motion.div
          animate={{ scale: isPulsing ? [1, 1.08, 1] : 1 }}
          transition={{
            duration: 0.5,
            repeat: isPulsing ? Infinity : 0,
            repeatDelay: 0.5,
          }}
          style={{ display: 'flex', justifyContent: 'flex-end' }}
        >
          <Box
            as="button"
            onClick={onDrawerOpen}
            borderRadius="full"
            h={inline ? '32px' : '48px'}
            minW={inline ? '32px' : '48px'}
            w={inline ? '32px' : '48px'}
            bg={bellBg}
            backdropFilter="blur(20px)"
            border="0.5px solid"
            borderColor={borderColor}
            color={textColor}
            _hover={{
              transform: 'scale(1.02)',
              bg: useColorModeValue('rgba(255,255,255,0.33)', 'rgba(28,28,30,0.8)'),
            }}
            transition="all 0.2s ease"
            boxShadow="0 4px 16px rgba(0,0,0,0.1)"
            position="relative"
            sx={{ WebkitBackdropFilter: 'blur(20px)' }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              w="full"
              h="full"
            >
              <Box
                position="relative"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
              >
                <Bell size={inline ? 18 : 21} />
                      {unreadCount > 0 && (
                        <Box
                          position="absolute"
                          top={{ base: '-3px', md: '-4px' }}
                          right={{ base: '-3px', md: '-4px' }}
                          minW={{ base: '14px', md: '16px' }}
                          h={{ base: '14px', md: '16px' }}
                          px={unreadCount > 99 ? 1 : 0.5}
                          borderRadius="full"
                          bg={indicatorColor}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text
                            fontSize={{ base: '8px', md: '10px' }}
                            fontWeight="bold"
                            color="white"
                            lineHeight="1"
                          >
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </Text>
                        </Box>
                      )}
              </Box>
            </Box>
          </Box>
      </motion.div>
    </Box>

    <NotificationsDrawer isOpen={isDrawerOpen} onClose={onDrawerClose} />
  </>
  )
}

export default HomepageNotificationBell