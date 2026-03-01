import { Box, HStack, VStack, Text, Avatar, useColorModeValue } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { navigateToProfile } from '../../utils/profileNavigation'
import VerifiedBadge from '../VerifiedBadge/VerifiedBadge'
import UserAvatar from './UserAvatar'

/**
 * Reusable UserCard component with click-to-navigate functionality
 * Displays user info in a card format, clicking anywhere navigates to profile
 * 
 * @param {string} userId - User ID to navigate to
 * @param {string} name - User's name
 * @param {string} email - User's email (optional)
 * @param {string} src - Profile image URL
 * @param {object} subscription - User subscription object with badgeType
 * @param {string} subtitle - Optional subtitle text
 * @param {string} avatarSize - Avatar size (xs, sm, md, lg, xl)
 * @param {boolean} showEmail - Whether to show email
 * @param {function} onClick - Custom onClick handler
 * @param {object} ...props - Additional Chakra UI Box props
 */
const UserCard = ({
  userId,
  name,
  email,
  src,
  subscription,
  subtitle,
  avatarSize = 'md',
  showEmail = false,
  onClick,
  ...props
}) => {
  const navigate = useNavigate()
  const cardBg = useColorModeValue('white', 'gray.800')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.800', 'gray.100')
  const subtextColor = useColorModeValue('gray.600', 'gray.400')

  const handleClick = (e) => {
    if (onClick) {
      onClick(e)
    }
    
    // Only navigate if event wasn't prevented
    if (!e.defaultPrevented && userId) {
      navigateToProfile(navigate, userId)
    }
  }

  return (
    <Box
      p={3}
      bg={cardBg}
      borderRadius="md"
      cursor={userId ? 'pointer' : 'default'}
      transition="all 0.2s"
      _hover={userId ? { bg: hoverBg, transform: 'translateY(-2px)', boxShadow: 'md' } : {}}
      onClick={handleClick}
      {...props}
    >
      <HStack spacing={3}>
        <UserAvatar
          userId={userId}
          name={name}
          src={src}
          size={avatarSize}
          subscription={subscription}
          showBadge={false}
        />
        <VStack align="start" spacing={0} flex={1}>
          <HStack spacing={2}>
            <Text fontWeight="medium" fontSize="sm" color={textColor}>
              {name || 'Unknown User'}
            </Text>
            {subscription?.badgeType && (
              <VerifiedBadge badgeType={subscription.badgeType} size={12} />
            )}
          </HStack>
          {subtitle && (
            <Text fontSize="xs" color={subtextColor}>
              {subtitle}
            </Text>
          )}
          {showEmail && email && (
            <Text fontSize="xs" color={subtextColor}>
              {email}
            </Text>
          )}
        </VStack>
      </HStack>
    </Box>
  )
}

export default UserCard











