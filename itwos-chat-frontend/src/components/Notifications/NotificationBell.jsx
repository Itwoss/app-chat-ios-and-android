import { Box, IconButton, Badge, useColorModeValue, useDisclosure } from '@chakra-ui/react'
import { Bell } from 'lucide-react'
import { useGetAdminNotificationsQuery } from '../../store/api/adminApi'
import { getAdminInfo } from '../../utils/auth'
import NotificationsDrawer from './NotificationsDrawer'

/**
 * Admin notification bell: opens NotificationsDrawer, shows unread count.
 * Used in AdminLayout. For user layout, see HomepageNotificationBell.
 */
export default function NotificationBell() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const adminInfo = getAdminInfo()
  const { data } = useGetAdminNotificationsQuery(
    { page: 1, limit: 50, unreadOnly: false },
    { skip: !adminInfo?.id, refetchOnMountOrArgChange: false }
  )
  const unreadCount = data?.unreadCount ?? 0
  const iconColor = useColorModeValue('gray.700', 'gray.300')

  return (
    <>
      <Box position="relative" display="inline-block">
        <IconButton
          aria-label="Notifications"
          icon={<Bell size={20} />}
          onClick={onOpen}
          variant="ghost"
          size="sm"
          color={iconColor}
        />
        {unreadCount > 0 && (
          <Badge
            position="absolute"
            top="2px"
            right="2px"
            colorScheme="red"
            fontSize="2xs"
            borderRadius="full"
            minW="4"
            h="4"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={1}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Box>
      <NotificationsDrawer isOpen={isOpen} onClose={onClose} />
    </>
  )
}
