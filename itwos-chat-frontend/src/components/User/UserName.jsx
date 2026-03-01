import { Text, HStack, useColorModeValue } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { navigateToProfile } from '../../utils/profileNavigation'
import VerifiedBadge from '../VerifiedBadge/VerifiedBadge'
import { useFont } from '../../contexts/FontContext'

/**
 * Reusable UserName component with click-to-navigate functionality
 * Clicking the name navigates to the user's profile
 * 
 * @param {string} userId - User ID to navigate to
 * @param {string} name - User's name
 * @param {object} subscription - User subscription object with badgeType
 * @param {string} fontSize - Text font size
 * @param {string} fontWeight - Text font weight
 * @param {function} onClick - Custom onClick handler
 * @param {object} ...props - Additional Chakra UI Text props
 */
const UserName = ({
  userId,
  name,
  subscription,
  fontSize = 'sm',
  fontWeight = 'medium',
  onClick,
  ...props
}) => {
  const navigate = useNavigate()
  const textColor = useColorModeValue('gray.800', 'gray.100')
  const { getFontFamily, equippedFont } = useFont()

  const handleClick = (e) => {
    if (onClick) {
      onClick(e)
    }
    
    // Only navigate if event wasn't prevented
    if (!e.defaultPrevented && userId) {
      navigateToProfile(navigate, userId)
    }
  }

  // Get CSS styles from equipped font if available
  const additionalStyles = equippedFont?.cssStyles 
    ? (() => {
        try {
          return JSON.parse(equippedFont.cssStyles);
        } catch {
          // If not JSON, treat as CSS string
          return {};
        }
      })()
    : {};

  return (
    <HStack spacing={2} display="inline-flex" alignItems="center">
      <Text
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={textColor}
        fontFamily={getFontFamily()}
        style={additionalStyles}
        cursor={userId ? 'pointer' : 'default'}
        transition="all 0.2s"
        _hover={userId ? { color: 'blue.500', textDecoration: 'underline' } : {}}
        onClick={handleClick}
        {...props}
      >
        {name || 'Unknown User'}
      </Text>
      {subscription?.badgeType && (
        <VerifiedBadge badgeType={subscription.badgeType} size={fontSize === 'xs' ? 10 : fontSize === 'sm' ? 12 : 14} />
      )}
    </HStack>
  )
}

export default UserName



