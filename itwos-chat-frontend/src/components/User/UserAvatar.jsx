import { Avatar, Box } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { navigateToProfile } from '../../utils/profileNavigation'

/**
 * Reusable UserAvatar component with click-to-navigate functionality
 * Clicking the avatar navigates to the user's profile
 * 
 * @param {string} userId - User ID to navigate to
 * @param {string} name - User's name
 * @param {string} src - Profile image URL
 * @param {string} size - Avatar size (xs, sm, md, lg, xl, 2xl)
 * @param {object} subscription - User subscription object with badgeType (not used, kept for backward compatibility)
 * @param {boolean} showBadge - Whether to show verified badge (not used, kept for backward compatibility)
 * @param {object} borderProps - Additional border props
 * @param {function} onClick - Custom onClick handler (will still navigate if not prevented)
 * @param {object} ...props - Additional Chakra UI Avatar props
 */
const UserAvatar = ({
  userId,
  name,
  src,
  size = 'md',
  subscription,
  showBadge = true,
  borderProps,
  onClick,
  ...props
}) => {
  const navigate = useNavigate()

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
    <Avatar
      name={name}
      src={src}
      size={size}
      onClick={handleClick}
      cursor={userId ? 'pointer' : 'default'}
      transition="transform 0.2s"
      _hover={userId ? { transform: 'scale(1.05)' } : {}}
      {...borderProps}
      {...props}
    />
  )
}

export default UserAvatar











