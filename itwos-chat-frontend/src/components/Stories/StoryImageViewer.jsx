import {
  Box,
  Image,
  Avatar,
  Text,
  HStack,
  VStack,
  Badge,
  Center,
  useBreakpointValue,
} from '@chakra-ui/react';
import { Music, Eye, Link2 } from 'lucide-react';

/**
 * Unified Instagram-style Story Image Viewer.
 * ONE rule: same 9:16 frame everywhere, object-fit: cover always.
 * - Mobile: 100vw × 100vh (or 100% when embedded), objectFit="cover".
 * - Desktop: 360px × 640px frame, objectFit="cover" (never contain).
 * Edit → Preview → Live → StoryViewer all match.
 */
const FRAME_W = 360;
const FRAME_H = 640;

export default function StoryImageViewer({
  storyImage,
  userName = 'You',
  userAvatar,
  timestamp,
  musicTitle,
  musicThumbnail,
  musicArtist,
  caption,
  embedded = false,
  viewCount,
  storyPath,
  privacy,
  topRightContent,
  ...rest
}) {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const frameW = isMobile ? (embedded ? '100%' : '100vw') : `${FRAME_W}px`;
  const frameH = isMobile ? (embedded ? '100%' : '100vh') : `${FRAME_H}px`;

  if (!storyImage) {
    return (
      <Box
        w={frameW}
        h={frameH}
        minH={isMobile && embedded ? '40vh' : undefined}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="black"
        borderRadius={isMobile ? 0 : '16px'}
        overflow="hidden"
        {...rest}
      >
        <Text color="whiteAlpha.600" fontSize="sm">
          No image
        </Text>
      </Box>
    );
  }

  const inner = (
    <Box
      position="relative"
      w={frameW}
      h={frameH}
      minH={isMobile && embedded ? '60vh' : undefined}
      overflow="hidden"
      bg="black"
      borderRadius={isMobile ? 0 : '16px'}
    >
      <Image
        src={storyImage}
        alt="Story"
        position="absolute"
        top={0}
        left={0}
        w="100%"
        h="100%"
        objectFit="cover"
      />
      {/* Top overlay: desktop/tablet = user + story path left, view count + actions right; mobile = same in one row */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bg="linear-gradient(to bottom, rgba(0,0,0,0.6), transparent 60%)"
        p={4}
      >
        <Box
          display="flex"
          flexDirection={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'stretch', md: 'center' }}
          justifyContent="space-between"
          gap={{ base: 2, md: 3 }}
        >
          {/* Left: user header + story path (desktop/tablet) */}
          <HStack spacing={3} flex={1} minW={0} align="flex-start">
            <Avatar size="sm" name={userName} src={userAvatar} border="2px solid" borderColor="whiteAlpha.400" flexShrink={0} />
            <VStack align="start" spacing={0} flex={1} minW={0}>
              <Text fontWeight="bold" fontSize="sm" noOfLines={1} color="white">
                {userName}
              </Text>
              {timestamp && (
                <Text fontSize="xs" opacity={0.9} color="white">
                  {timestamp}
                </Text>
              )}
              {storyPath != null && (
                <HStack spacing={1.5} color="whiteAlpha.800" fontSize="xs" mt={1} display={{ base: 'flex', md: 'flex' }}>
                  <Link2 size={12} />
                  <Text noOfLines={1}>{storyPath}</Text>
                </HStack>
              )}
            </VStack>
          </HStack>
          {/* Right: view count + topRightContent (e.g. close / adjust) */}
          <HStack spacing={2} flexShrink={0}>
            {viewCount != null && (
              <HStack spacing={1} color="white">
                <Eye size={14} />
                <Text fontSize="xs">{viewCount} views</Text>
              </HStack>
            )}
            {topRightContent}
          </HStack>
        </Box>
      </Box>
      {/* Story path is shown in overlay left block above (user + path left, actions right) */}
      {privacy && (
        <Box position="absolute" top="76px" right={4}>
          <Badge
            colorScheme={privacy === 'public' ? 'green' : privacy === 'followers' ? 'blue' : 'purple'}
            fontSize="xs"
          >
            {privacy === 'public' ? '🌐 Public' : privacy === 'followers' ? '👥 Followers' : '⭐ Close Friends'}
          </Badge>
        </Box>
      )}
      {/* Music pill – top right below header, Threads-style (song avatar + name) */}
      {musicTitle && (
        <Box
          position="absolute"
          top={56}
          right={4}
          zIndex={2}
          maxW="calc(100% - 100px)"
        >
          <HStack
            spacing={2}
            bg="blackAlpha.700"
            borderRadius="full"
            py={1.5}
            pl={1}
            pr={3}
            border="1px solid"
            borderColor="whiteAlpha.200"
            sx={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {musicThumbnail ? (
              <Image
                src={musicThumbnail}
                alt=""
                boxSize="8"
                borderRadius="full"
                objectFit="cover"
                flexShrink={0}
              />
            ) : (
              <Center boxSize="8" flexShrink={0} borderRadius="full" bg="whiteAlpha.200">
                <Music size={16} color="white" />
              </Center>
            )}
            <Box flex={1} minW={0} maxW="100px" overflow="hidden">
              <Box
                as="span"
                display="inline-block"
                fontSize="xs"
                fontWeight="600"
                color="white"
                whiteSpace="nowrap"
                sx={{
                  animation: 'storySongMarquee 6s linear infinite',
                  '@keyframes storySongMarquee': {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                  },
                }}
              >
                {musicTitle}
                {' · '}
                {musicTitle}
              </Box>
            </Box>
          </HStack>
        </Box>
      )}
      {caption && (
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bg="linear-gradient(to top, rgba(0,0,0,0.75), transparent)"
          p={4}
        >
          <Text color="white" fontSize="sm" noOfLines={3}>
            {caption}
          </Text>
        </Box>
      )}
    </Box>
  );

  if (!isMobile && embedded) {
    return (
      <Box
        w="100%"
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH={FRAME_H}
        {...rest}
      >
        {inner}
      </Box>
    );
  }

  if (isMobile && !embedded) {
    return (
      <Box
        position="relative"
        w="100vw"
        h="100vh"
        left="50%"
        right="50%"
        marginLeft="-50vw"
        marginRight="-50vw"
        {...rest}
      >
        {inner}
      </Box>
    );
  }

  return <Box {...rest}>{inner}</Box>;
}
