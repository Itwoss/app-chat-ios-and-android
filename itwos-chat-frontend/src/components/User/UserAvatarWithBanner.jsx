import { Box, HStack, VStack, Avatar, Text, useColorModeValue } from '@chakra-ui/react';
import { useGetUserEquippedBannerQuery } from '../../store/api/userApi';
import UserName from './UserName';

/**
 * UserAvatarWithBanner - Shows user avatar and username with banner background
 * Used in post headers and profile sections
 */
const UserAvatarWithBanner = ({
  userId,
  name,
  src,
  subscription,
  fontSize = 'sm',
  fontWeight = 'medium',
  avatarSize = 'md',
  showBadge = true,
  children,
  ...props
}) => {
  const { data: bannerData } = useGetUserEquippedBannerQuery(userId, {
    skip: !userId,
  });
  const equippedBanner = bannerData?.data?.equippedBanner;
  // Use postImageUrl/postVideoUrl for post headers, fallback to imageUrl for backward compatibility
  const bannerImageUrl = equippedBanner?.postImageUrl || equippedBanner?.imageUrl;
  const bannerVideoUrl = equippedBanner?.postVideoUrl;
  const hasBanner = equippedBanner && (bannerImageUrl || bannerVideoUrl);

  const content = (
    <HStack spacing={3} align="center" w="full">
        <Avatar
        key={`avatar-${userId}-${src}`}
          name={name}
          src={src}
          size={avatarSize}
          boxShadow={hasBanner ? '0 2px 8px rgba(0,0,0,0.3)' : undefined}
        sx={{
          imageRendering: 'auto',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          willChange: 'auto',
        }}
            />
      <VStack align="start" spacing={0} flex={1}>
        <UserName
          userId={userId}
          name={name}
          subscription={subscription}
          fontSize={fontSize}
          fontWeight={fontWeight}
          color={hasBanner ? 'white' : undefined}
          textShadow={hasBanner ? '2px 2px 4px rgba(0,0,0,0.5)' : undefined}
        />
        {children}
      </VStack>
    </HStack>
  );

  if (hasBanner) {
    return (
      <Box
        position="relative"
        overflow="hidden"
        borderRadius="full"
        bg="gray.800"
        backgroundImage={bannerImageUrl ? `url(${bannerImageUrl})` : undefined}
        backgroundSize="cover"
        backgroundPosition="center"
      >
        {bannerVideoUrl && (
          <Box
            as="video"
            src={bannerVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%"
            objectFit="cover"
            zIndex={0}
          />
        )}
        <Box position="relative" zIndex={1} p={3} borderRadius="full" w="100%" h="100%" minH="100%">
          {content}
        </Box>
      </Box>
    );
  }

  // Fallback: apply props to wrapper Box when no banner
  return (
    <Box w="full" {...props}>
      {content}
    </Box>
  );
};

export default UserAvatarWithBanner;

