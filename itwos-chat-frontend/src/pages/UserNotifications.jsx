import {
  VStack,
  HStack,
  Heading,
  Text,
  Box,
  useColorModeValue,
  useToast,
  Center,
  Badge,
  IconButton,
  Button,
  useDisclosure,
} from '@chakra-ui/react'
import { NotificationSkeleton } from '../components/Skeletons'
import { Bell, Trash2, Check, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useGetUserNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation, useDeleteNotificationMutation } from '../store/api/userApi'
import { getUserInfo } from '../utils/auth'
import { getSocket } from '../utils/socket'
import { formatDistanceToNow } from 'date-fns'

const UserNotifications = () => {
  const toast = useToast()
  const userInfo = getUserInfo()
  const userId = userInfo?.id

  const { data: notificationsData, isLoading, refetch } = useGetUserNotificationsQuery(
    { page: 1, limit: 100, unreadOnly: false },
    { skip: !userId, refetchOnMountOrArgChange: false }
  )

  const [markAsRead] = useMarkAsReadMutation()
  const [markAllAsRead] = useMarkAllAsReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()

  const notifications = notificationsData?.data || []
  const unreadCount = notificationsData?.unreadCount || 0

  // Theme-aware colors
  const textColor = useColorModeValue('#000000', 'rgba(255, 255, 255, 1)')
  const secondaryTextColor = useColorModeValue('rgba(0, 0, 0, 0.6)', 'rgba(255, 255, 255, 0.6)')
  const borderColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)')
  const borderColorHover = useColorModeValue('rgba(0, 0, 0, 0.2)', 'rgba(255, 255, 255, 0.2)')
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(23, 23, 23, 0.8)')
  const cardBgRead = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.2)')
  const cardBgUnread = useColorModeValue('rgba(59, 130, 246, 0.15)', 'rgba(59, 130, 246, 0.2)')
  const cardBorderUnread = useColorModeValue('rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.3)')
  const cardBgReadHover = useColorModeValue('rgba(0, 0, 0, 0.08)', 'rgba(255, 255, 255, 0.1)')
  const cardBgUnreadHover = useColorModeValue('rgba(59, 130, 246, 0.25)', 'rgba(59, 130, 246, 0.3)')

  // Listen for Socket.IO notifications
  useEffect(() => {
    if (!userId) return
    
    const socket = getSocket()
    if (!socket) return

    const handleNewNotification = () => {
      refetch()
    }

    socket.on('new-notification', handleNewNotification)

    return () => {
      socket.off('new-notification', handleNewNotification)
    }
  }, [userId, refetch])

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification._id).unwrap()
        refetch()
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    if (notification.link) {
      window.location.href = notification.link
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead().unwrap()
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
      await deleteNotification(notificationId).unwrap()
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
      case 'follow':
        return '➕'
      case 'like':
        return '❤️'
      case 'comment':
        return '💬'
      default:
        return '🔔'
    }
  }

  return (
    <VStack spacing={6} align="stretch">
        <Box
          bg={cardBg}
          p={6}
          borderRadius={{ base: "20px", md: "24px" }}
          border="1px solid"
          borderColor={borderColor}
          sx={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <HStack justify="space-between" mb={4}>
            <HStack spacing={3}>
              <Bell size={24} color={textColor} />
              <Heading size="lg" color={textColor}>
                Notifications
              </Heading>
              {unreadCount > 0 && (
                <Badge 
                  bg="rgba(239, 68, 68, 0.2)"
                  color="red.300"
                  border="1px solid"
                  borderColor="red.400"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {unreadCount} unread
                </Badge>
              )}
            </HStack>
            {unreadCount > 0 && (
              <Button
                size="sm"
                bg="blue.500"
                color="white"
                leftIcon={<Check size={16} />}
                onClick={handleMarkAllRead}
                _hover={{
                  bg: 'blue.600',
                }}
              >
                Mark all read
              </Button>
            )}
          </HStack>

          {isLoading ? (
            <Box minH="200px" pt={2}>
              <NotificationSkeleton count={6} />
            </Box>
          ) : notifications.length === 0 ? (
            <Center minH="200px">
              <VStack spacing={2}>
                <Bell size={48} opacity={0.3} color={textColor} />
                <Text color={secondaryTextColor}>No notifications</Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={3} align="stretch">
              {notifications.map((notification) => (
                <Box
                  key={notification._id}
                  p={4}
                  borderRadius={{ base: "12px", md: "16px" }}
                  bg={notification.isRead ? cardBgRead : cardBgUnread}
                  border="1px solid"
                  borderColor={notification.isRead ? borderColor : cardBorderUnread}
                  cursor="pointer"
                  onClick={() => handleNotificationClick(notification)}
                  _hover={{
                    bg: notification.isRead ? cardBgReadHover : cardBgUnreadHover,
                    borderColor: borderColorHover,
                    transform: 'translateY(-2px)',
                  }}
                  transition="all 0.2s"
                  position="relative"
                >
                  <HStack spacing={3} align="start">
                    <Text fontSize="2xl">{getNotificationIcon(notification.type)}</Text>
                    <VStack align="start" spacing={1} flex="1">
                      {notification.title?.includes('Removed') || notification.title?.includes('Warning') ? (
                        <Badge 
                          bg="rgba(239, 68, 68, 0.2)"
                          color="red.300"
                          border="1px solid"
                          borderColor="red.400"
                          mb={1}
                        >
                          Important
                        </Badge>
                      ) : null}
                      <HStack justify="space-between" w="full">
                        <Text
                          fontWeight={notification.isRead ? '500' : '600'}
                          fontSize="sm"
                          color={notification.title?.includes('Removed') || notification.title?.includes('Warning') ? 'red.300' : textColor}
                        >
                          {notification.title}
                        </Text>
                        <HStack spacing={2}>
                          {!notification.isRead && (
                            <Box w="8px" h="8px" bg="blue.400" borderRadius="full" />
                          )}
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
                      </HStack>
                      <Text 
                        fontSize="xs" 
                        color={notification.title?.includes('Removed') || notification.title?.includes('Warning') ? 'red.200' : secondaryTextColor}
                        whiteSpace="pre-line"
                        noOfLines={notification.title?.includes('Removed') || notification.title?.includes('Warning') ? 5 : 2}
                      >
                        {notification.message}
                      </Text>
                      <Text fontSize="2xs" color={secondaryTextColor}>
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </VStack>
  )
}

export default UserNotifications
