import { Tooltip, Box } from '@chakra-ui/react';
import Lottie from 'lottie-react';
import { IconlyTickSquare } from './IconlyTickSquare';
import verificationBadgeBlueAnimation from '../../assets/verificationBadgeBlue.json';

const VerifiedBadge = ({ badgeType, size = 16, showTooltip = true }) => {
  if (!badgeType) return null;

  const getBadgeStyles = () => {
    switch (badgeType) {
      case 'blue':
        const lottieSize = Math.round(size * 1.3); // Increase size by 30%
        return {
          color: '#3B82F6',
          bg: 'transparent',
          icon: (
            <Box
              w={`${lottieSize}px`}
              h={`${lottieSize}px`}
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
            >
              <Lottie
                animationData={verificationBadgeBlueAnimation}
                loop={true}
                autoplay={true}
                style={{
                  width: `${lottieSize}px`,
                  height: `${lottieSize}px`,
                }}
              />
            </Box>
          )
        };
      case 'yellow':
        return {
          color: '#FCD34D',
          bg: '#3B82F6',
          icon: (
            <Box
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              borderRadius="full"
              bg="#3B82F6"
              p="2px"
            >
              <IconlyTickSquare size={size - 2} color="#FCD34D" />
            </Box>
          )
        };
      case 'pink':
        return {
          color: '#EC4899',
          bg: 'transparent',
          icon: (
            <Box
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              filter="drop-shadow(0 0 3px rgba(236, 72, 153, 0.6))"
            >
              <IconlyTickSquare size={size} color="#EC4899" />
            </Box>
          )
        };
      default:
        return null;
    }
  };

  const badgeStyles = getBadgeStyles();
  if (!badgeStyles) return null;

  const badge = (
    <Box
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      ml={1}
      verticalAlign="middle"
    >
      {badgeStyles.icon}
    </Box>
  );

  if (showTooltip) {
    const tooltipLabels = {
      blue: 'Blue Verified',
      yellow: 'Yellow + Blue Verified',
      pink: 'Pink Verified'
    };

    return (
      <Tooltip label={tooltipLabels[badgeType]} placement="top" hasArrow>
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

export default VerifiedBadge;

