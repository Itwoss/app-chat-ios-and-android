import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Button,
  Divider,
  Box,
  Badge,
  IconButton,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react'
import { Bell, Trash2, Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGetUserNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation, useDeleteNotificationMutation } from '../../store/api/userApi'
import { useGetAdminNotificationsQuery, useMarkAsReadMutation as useAdminMarkAsRead, useMarkAllAsReadMutation as useAdminMarkAllAsRead, useDeleteNotificationMutation as useAdminDeleteNotification } from '../../store/api/adminApi'
import { getUserInfo, getAdminInfo } from '../../utils/auth'
import { getSocket } from '../../utils/socket'
import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

const NotificationsDrawer = ({ isOpen, onClose }) => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const hoverBg = useColorModeValue('gray.50', 'gray.600')
  const navigate = useNavigate()
  const toast = useToast()

  const userInfo = getUserInfo()
  const adminInfo = getAdminInfo()
  const role = userInfo?.role || adminInfo?.role
  const userId = userInfo?.id || adminInfo?.id

  const { data: userNotifications, refetch: refetchUserNotifications } = useGetUserNotificationsQuery(
    { page: 1, limit: 50, unreadOnly: false },
    { skip: !userId || role !== 'user', refetchOnMountOrArgChange: false }
  )
  const { data: adminNotifications, refetch: refetchAdminNotifications } = useGetAdminNotificationsQuery(
    { page: 1, limit: 50, unreadOnly: false },
    { skip: !userId || role !== 'admin' }
  )

  const [markAsRead] = useMarkAsReadMutation()
  const [markAllAsRead] = useMarkAllAsReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()
  const [adminMarkAsRead] = useAdminMarkAsRead()
  const [adminMarkAllAsRead] = useAdminMarkAllAsRead()
  const [adminDeleteNotification] = useAdminDeleteNotification()

  const notifications = role === 'admin' ? adminNotifications?.data : userNotifications?.data
  const unreadCount = role === 'admin' ? adminNotifications?.unreadCount : userNotifications?.unreadCount
  const refetch = role === 'admin' ? refetchAdminNotifications : refetchUserNotifications
  const markRead = role === 'admin' ? adminMarkAsRead : markAsRead
  const markAllRead = role === 'admin' ? adminMarkAllAsRead : markAllAsRead
  const deleteNotif = role === 'admin' ? adminDeleteNotification : deleteNotification

  // Track online/offline status
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Categorize notifications: new (unread), old (read and older than 24 hours), pending (read but recent)
  const categorizeNotifications = (notifs) => {
    if (!notifs || notifs.length === 0) return { new: [], old: [], pending: [] }
    
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    const newNotifs = notifs.filter(n => !n.isRead)
    const oldNotifs = notifs.filter(n => n.isRead && new Date(n.createdAt) < oneDayAgo)
    const pendingNotifs = notifs.filter(n => n.isRead && new Date(n.createdAt) >= oneDayAgo)
    
    return { new: newNotifs, old: oldNotifs, pending: pendingNotifs }
  }

  const { new: newNotifications, old: oldNotifications, pending: pendingNotifications } = categorizeNotifications(notifications)

  // Listen for Socket.IO notifications
  useEffect(() => {
    if (!userId || !isOpen) return
    
    const socket = getSocket()
    if (!socket) return

    const handleNewNotification = () => {
      refetch()
    }

    socket.on('new-notification', handleNewNotification)

    return () => {
      socket.off('new-notification', handleNewNotification)
    }
  }, [userId, isOpen, refetch])

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markRead(notification._id).unwrap()
        refetch()
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    if (notification.link) {
      navigate(notification.link)
      onClose()
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap()
      refetch()
      toast({
        title: 'All notifications marked as read',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await deleteNotif(notificationId).unwrap()
      refetch()
      toast({
        title: 'Notification deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'meeting_request':
      case 'meeting_scheduled':
        return '📅'
      case 'project_update':
      case 'status_change':
        return '📊'
      case 'note_added':
        return '💬'
      case 'milestone_completed':
        return '✅'
      case 'friend_request':
        return '👤'
      case 'message':
        return '💬'
      case 'like':
        return '❤️'
      case 'comment':
        return '💬'
      case 'follow':
        return '➕'
      default:
        return '🔔'
    }
  }

  // Determine notification style based on category
  const getNotificationStyle = (notification) => {
    const isNew = !notification.isRead
    const isOld = notification.isRead && new Date(notification.createdAt) < new Date(Date.now() - 24 * 60 * 60 * 1000)
    const isPending = notification.isRead && !isOld
    
    if (isNew) {
      return {
        bg: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        textColor: 'white',
        secondaryTextColor: 'rgba(255, 255, 255, 0.8)',
      }
    } else if (isPending) {
      return {
        bg: 'rgba(251, 191, 36, 0.2)',
        borderColor: 'rgba(251, 191, 36, 0.3)',
        textColor: 'white',
        secondaryTextColor: 'rgba(255, 255, 255, 0.7)',
      }
    } else {
      return {
        bg: 'rgba(0, 0, 0, 0.2)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textColor: 'white',
        secondaryTextColor: 'rgba(255, 255, 255, 0.5)',
      }
    }
  }

  // Show list when offline or when there are old/pending notifications
  const shouldShowList = !isOnline || oldNotifications.length > 0 || pendingNotifications.length > 0

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay 
        bg="blackAlpha.600"
        sx={{
          animation: 'fadeIn 0.3s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 }
          }
        }}
      />
      <DrawerContent
        bg="transparent"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.2)"
        pt={{ base: 'env(safe-area-inset-top, 0px)', md: 0 }}
        pb={{ base: 'env(safe-area-inset-bottom, 0px)', md: 0 }}
        sx={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'none',
        }}
      >
        <DrawerCloseButton
          color="white"
          _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
          top={{ base: 'calc(env(safe-area-inset-top, 0px) + 8px)', md: 2 }}
        />
        <DrawerHeader
          borderBottom="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          bg="transparent"
          py={3}
          px={4}
        >
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Bell size={20} color="white" />
              <Text color="white" fontWeight="600" fontSize="lg">Notifications</Text>
              {unreadCount > 0 && (
                <Badge
                  bg="rgba(239, 68, 68, 0.2)"
                  color="red.300"
                  border="1px solid"
                  borderColor="red.400"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                >
                  {unreadCount}
                </Badge>
              )}
              {!isOnline && (
                <Badge
                  bg="rgba(251, 191, 36, 0.2)"
                  color="yellow.300"
                  border="1px solid"
                  borderColor="yellow.400"
                  borderRadius="full"
                  px={2}
                  py={0.5}
                >
                  Offline
                </Badge>
              )}
            </HStack>
            {unreadCount > 0 && (
              <Button
                size="xs"
                bg="blue.500"
                color="white"
                leftIcon={<Check size={14} />}
                onClick={handleMarkAllRead}
                _hover={{ bg: 'blue.600' }}
              >
                Mark all read
              </Button>
            )}
          </HStack>
        </DrawerHeader>

        <DrawerBody
          p={0}
          overflowY="auto"
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
            },
          }}
        >
          {notifications && notifications.length > 0 ? (
            <VStack spacing={3} align="stretch" p={4}>
              {/* New Notifications */}
              {newNotifications.length > 0 && (
                <>
                  <Text color="white" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="1px" px={2}>
                    New ({newNotifications.length})
                  </Text>
                  {newNotifications.map((notification) => {
                    const style = getNotificationStyle(notification)
                    return (
                <Box
                  key={notification._id}
                  p={4}
                        borderRadius={{ base: "12px", md: "16px" }}
                        bg={style.bg}
                        border="1px solid"
                        borderColor={style.borderColor}
                  cursor="pointer"
                  onClick={() => handleNotificationClick(notification)}
                        _hover={{
                          bg: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          transform: 'translateY(-2px)',
                        }}
                        transition="all 0.2s"
                >
                  <HStack spacing={3} align="start">
                          <Box
                            flexShrink={0}
                            w="40px"
                            h="40px"
                            borderRadius="full"
                            bg="rgba(59, 130, 246, 0.2)"
                            border="1px solid"
                            borderColor="rgba(59, 130, 246, 0.4)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="20px"
                          >
                            {getNotificationIcon(notification.type)}
                          </Box>
                          <VStack align="start" spacing={1} flex={1} minW={0}>
                      <HStack justify="space-between" w="full">
                        <Text
                                fontWeight="700"
                          fontSize="sm"
                                color={style.textColor}
                                noOfLines={1}
                                flex={1}
                        >
                          {notification.title}
                        </Text>
                          <IconButton
                            icon={<Trash2 size={14} />}
                            size="xs"
                            variant="ghost"
                                bg="transparent"
                                color="red.400"
                                border="1px solid"
                                borderColor="red.400"
                                borderRadius="full"
                            onClick={(e) => handleDelete(notification._id, e)}
                            aria-label="Delete notification"
                                _hover={{
                                  bg: 'rgba(239, 68, 68, 0.2)',
                                  borderColor: 'red.500',
                                }}
                              />
                            </HStack>
                            <Text
                              fontSize="xs"
                              color={style.secondaryTextColor}
                              whiteSpace="pre-line"
                              noOfLines={2}
                              lineHeight="1.4"
                            >
                              {notification.message}
                            </Text>
                            <Text fontSize="2xs" color={style.secondaryTextColor}>
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    )
                  })}
                </>
              )}

              {/* Pending Notifications (read but recent) */}
              {pendingNotifications.length > 0 && (
                <>
                  <Text color="rgba(255, 255, 255, 0.6)" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="1px" px={2} mt={2}>
                    Pending ({pendingNotifications.length})
                  </Text>
                  {pendingNotifications.map((notification) => {
                    const style = getNotificationStyle(notification)
                    return (
                      <Box
                        key={notification._id}
                        p={4}
                        borderRadius={{ base: "12px", md: "16px" }}
                        bg={style.bg}
                        border="1px solid"
                        borderColor={style.borderColor}
                        cursor="pointer"
                        onClick={() => handleNotificationClick(notification)}
                        _hover={{
                          bg: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          transform: 'translateY(-2px)',
                        }}
                        transition="all 0.2s"
                      >
                        <HStack spacing={3} align="start">
                          <Box
                            flexShrink={0}
                            w="40px"
                            h="40px"
                            borderRadius="full"
                            bg="rgba(251, 191, 36, 0.2)"
                            border="1px solid"
                            borderColor="rgba(251, 191, 36, 0.4)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="20px"
                          >
                            {getNotificationIcon(notification.type)}
                          </Box>
                          <VStack align="start" spacing={1} flex={1} minW={0}>
                            <HStack justify="space-between" w="full">
                              <Text
                                fontWeight="500"
                                fontSize="sm"
                                color={style.textColor}
                                noOfLines={1}
                                flex={1}
                              >
                                {notification.title}
                              </Text>
                              <IconButton
                                icon={<Trash2 size={14} />}
                                size="xs"
                                variant="ghost"
                                bg="transparent"
                                color="red.400"
                                border="1px solid"
                                borderColor="red.400"
                                borderRadius="full"
                                onClick={(e) => handleDelete(notification._id, e)}
                                aria-label="Delete notification"
                                _hover={{
                                  bg: 'rgba(239, 68, 68, 0.2)',
                                  borderColor: 'red.500',
                                }}
                              />
                      </HStack>
                      <Text 
                        fontSize="xs" 
                              color={style.secondaryTextColor}
                        whiteSpace="pre-line"
                              noOfLines={2}
                              lineHeight="1.4"
                            >
                              {notification.message}
                            </Text>
                            <Text fontSize="2xs" color={style.secondaryTextColor}>
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    )
                  })}
                </>
              )}

              {/* Old Notifications (read and older than 24 hours) */}
              {oldNotifications.length > 0 && (
                <>
                  <Text color="rgba(255, 255, 255, 0.4)" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="1px" px={2} mt={2}>
                    Old ({oldNotifications.length})
                  </Text>
                  {oldNotifications.map((notification) => {
                    const style = getNotificationStyle(notification)
                    return (
                      <Box
                        key={notification._id}
                        p={4}
                        borderRadius={{ base: "12px", md: "16px" }}
                        bg={style.bg}
                        border="1px solid"
                        borderColor={style.borderColor}
                        cursor="pointer"
                        onClick={() => handleNotificationClick(notification)}
                        _hover={{
                          bg: 'rgba(255, 255, 255, 0.1)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          transform: 'translateY(-2px)',
                        }}
                        transition="all 0.2s"
                        opacity={0.7}
                      >
                        <HStack spacing={3} align="start">
                          <Box
                            flexShrink={0}
                            w="40px"
                            h="40px"
                            borderRadius="full"
                            bg="rgba(0, 0, 0, 0.3)"
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.1)"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="20px"
                          >
                            {getNotificationIcon(notification.type)}
                          </Box>
                          <VStack align="start" spacing={1} flex={1} minW={0}>
                            <HStack justify="space-between" w="full">
                              <Text
                                fontWeight="400"
                                fontSize="sm"
                                color={style.textColor}
                                noOfLines={1}
                                flex={1}
                              >
                                {notification.title}
                              </Text>
                              <IconButton
                                icon={<Trash2 size={14} />}
                                size="xs"
                                variant="ghost"
                                bg="transparent"
                                color="red.400"
                                border="1px solid"
                                borderColor="red.400"
                                borderRadius="full"
                                onClick={(e) => handleDelete(notification._id, e)}
                                aria-label="Delete notification"
                                _hover={{
                                  bg: 'rgba(239, 68, 68, 0.2)',
                                  borderColor: 'red.500',
                                }}
                              />
                            </HStack>
                            <Text
                              fontSize="xs"
                              color={style.secondaryTextColor}
                              whiteSpace="pre-line"
                              noOfLines={2}
                              lineHeight="1.4"
                      >
                        {notification.message}
                      </Text>
                            <Text fontSize="2xs" color={style.secondaryTextColor}>
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
                    )
                  })}
                </>
              )}
            </VStack>
          ) : (
            <Center minH="200px">
              <VStack spacing={2}>
                <Bell size={48} opacity={0.3} color="white" />
                <Text color="rgba(255, 255, 255, 0.6)">No notifications</Text>
              </VStack>
            </Center>
          )}
        </DrawerBody>

        <DrawerFooter
          borderTop="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          bg="transparent"
          py={3}
          px={4}
          pb={{ base: 'max(12px, env(safe-area-inset-bottom, 0px))', md: 3 }}
        >
          <Button
            variant="ghost"
            onClick={onClose}
            w="full"
            color="white"
            _hover={{ bg: 'rgba(255, 255, 255, 0.1)' }}
          >
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

export default NotificationsDrawer

