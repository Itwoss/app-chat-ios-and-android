import {
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Box,
  Divider,
  useColorModeValue,
  IconButton,
  Avatar,
  Badge,
} from '@chakra-ui/react';
import { Heart, MessageCircle, Eye, Music, Calendar, User, Share2 } from 'lucide-react';
import UserName from '../User/UserName';
import { formatDistanceToNow } from 'date-fns';
import { useSongDetails } from '../../contexts/SongDetailsContext';
import BlurModal from '../ui/BlurModal';

const PostDetailsModal = ({ 
  isOpen, 
  onClose, 
  post, 
  isLiked, 
  liveViewCount, 
  totalViewCount,
  songName,
  hasMusic,
  hasYouTubeSound,
  postSound,
  formatViewCount 
}) => {
  // Glassmorphism design matching Create Post modal
  const textColor = 'white';
  const secondaryTextColor = 'rgba(255, 255, 255, 0.6)';
  const borderColor = 'rgba(255, 255, 255, 0.1)';

  const { openSongDetails } = useSongDetails();

  if (!post) return null;

  const likeCount = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;
  const shareCount = post.shares?.length || 0;

  const handleClose = () => onClose();

  return (
    <BlurModal
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      closeOnOverlayClick
      closeOnEsc
      isLazy={false}
      contentProps={{
        mx: { base: 0, md: 4 },
        my: { base: 0, md: 4 },
        w: { base: '100%', md: 'auto' },
        maxW: { base: '100%', md: '480px' },
        h: { base: 'auto', md: 'auto' },
        maxH: { base: '100dvh', md: '90vh' },
        borderRadius: { base: 0, md: '24px' },
        paddingLeft: 'env(safe-area-inset-left, 0)',
        paddingRight: 'env(safe-area-inset-right, 0)',
        marginTop: 'env(safe-area-inset-top, 0)',
        marginBottom: 'env(safe-area-inset-bottom, 0)',
        minHeight: { base: '100dvh', md: undefined },
        onClick: (e) => e.stopPropagation(),
      }}
    >
      <ModalHeader
          py={{ base: 2.5, md: 3 }}
          px={{ base: 3, md: 4 }}
          fontSize={{ base: "15px", md: "17px" }}
          fontWeight="600"
          color="white"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          bg="transparent"
          onClick={(e) => e.stopPropagation()}
        >
          Post Details
        </ModalHeader>
        <ModalCloseButton 
          top={{ base: 2, md: 3 }}
          right={{ base: 2.5, md: 4 }}
          color="white"
          borderRadius="full"
          size="sm"
          _hover={{
            bg: 'whiteAlpha.200',
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
        />
        
        <ModalBody 
          px={{ base: 3, md: 4 }}
          py={{ base: 2, md: 3 }}
          overflowY="auto"
          maxH="calc(100vh - 200px)"
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
          onClick={(e) => e.stopPropagation()}
        >
          <VStack spacing={0} align="stretch">
            {/* Author Info */}
            <Box 
              px={3} 
              py={3} 
              borderBottom="1px solid" 
              borderColor="whiteAlpha.100"
              bg="rgba(0, 0, 0, 0.2)"
              borderRadius={{ base: "8px", md: "12px" }}
              mb={3}
            >
              <HStack spacing={3}>
                <Avatar
                  size="md"
                  name={post.author?.name || 'User'}
                  src={post.author?.profileImage}
                />
                <VStack align="start" spacing={0} flex={1}>
                  <HStack spacing={2}>
                    <UserName
                      userId={post.author?._id || post.author?.id}
                      name={post.author?.name || 'Unknown'}
                      subscription={post.author?.subscription}
                      fontSize="sm"
                      fontWeight={600}
                      color="white"
                    />
                  </HStack>
                  <Text fontSize="xs" color={secondaryTextColor} mt={0.5}>
                    {post.author?.accountType === 'public' ? 'Public account' : 'Private account'}
                  </Text>
                </VStack>
              </HStack>
            </Box>

            {/* Stats Section */}
            <Box 
              px={3} 
              py={3} 
              bg="rgba(0, 0, 0, 0.2)"
              borderRadius={{ base: "8px", md: "12px" }}
              border="1px solid"
              borderColor="whiteAlpha.100"
              mb={3}
            >
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Heart size={18} color={isLiked ? '#ed4956' : secondaryTextColor} />
                    <Text fontSize="sm" fontWeight={500} color="white">
                      Likes
                    </Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight={600} color="white">
                    {formatViewCount(likeCount)} {likeCount === 1 ? 'like' : 'likes'}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <MessageCircle size={18} color={secondaryTextColor} />
                    <Text fontSize="sm" fontWeight={500} color="white">
                      Comments
                    </Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight={600} color="white">
                    {formatViewCount(commentCount)} {commentCount === 1 ? 'comment' : 'comments'}
                  </Text>
                </HStack>

                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Eye size={18} color={secondaryTextColor} />
                    <Text fontSize="sm" fontWeight={500} color="white">
                      Total Views
                    </Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight={600} color="white">
                    {formatViewCount(totalViewCount || post.viewCount || 0)} {totalViewCount === 1 || post.viewCount === 1 ? 'view' : 'views'}
                  </Text>
                </HStack>

                {liveViewCount > 0 && (
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Box
                        as={Eye}
                        size={18}
                        color={secondaryTextColor}
                        sx={{
                          animation: 'pulse 2s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: 0.5 }
                          }
                        }}
                      />
                      <Text fontSize="sm" fontWeight={500} color="white">
                        Live Viewers
                      </Text>
                    </HStack>
                    <Badge 
                      bg="rgba(34, 197, 94, 0.2)"
                      color="green.300"
                      border="1px solid"
                      borderColor="green.400"
                      borderRadius="full" 
                      px={2} 
                      py={0.5}
                    >
                      <Text fontSize="xs" fontWeight={600} color="green.300">
                        {liveViewCount} {liveViewCount === 1 ? 'watching' : 'watching'}
                      </Text>
                    </Badge>
                  </HStack>
                )}

                {shareCount > 0 && (
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Share2 size={18} color={secondaryTextColor} />
                      <Text fontSize="sm" fontWeight={500} color="white">
                        Shares
                      </Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight={600} color="white">
                      {formatViewCount(shareCount)} {shareCount === 1 ? 'share' : 'shares'}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Box>

            {/* Music Info - click to open Song Details bottom sheet */}
            {hasMusic && (
              <Box 
                px={3} 
                py={3} 
                bg="rgba(0, 0, 0, 0.2)"
                borderRadius={{ base: "8px", md: "12px" }}
                border="1px solid"
                borderColor="whiteAlpha.100"
                mb={3}
                cursor={hasYouTubeSound && postSound ? 'pointer' : 'default'}
                onClick={() => hasYouTubeSound && postSound && openSongDetails(postSound)}
                _hover={hasYouTubeSound && postSound ? { bg: 'rgba(0, 0, 0, 0.3)' } : undefined}
              >
                <HStack spacing={3} mb={2}>
                  <Music size={20} color={secondaryTextColor} />
                  <Text fontSize="sm" fontWeight={600} color="white">
                    Background Music
                  </Text>
                </HStack>
                <VStack align="start" spacing={1} pl={8}>
                  <Text fontSize="sm" fontWeight={500} color="white">
                    {songName}
                  </Text>
                  {hasYouTubeSound && postSound?.artist && (
                    <Text fontSize="xs" color={secondaryTextColor}>
                      by {postSound.artist}
                    </Text>
                  )}
                  {hasYouTubeSound && postSound?.title && (
                    <Text fontSize="xs" color={secondaryTextColor}>
                      {postSound.title}
                    </Text>
                  )}
                </VStack>
              </Box>
            )}

            {/* Timestamp */}
            <Box 
              px={3} 
              py={3} 
              bg="rgba(0, 0, 0, 0.2)"
              borderRadius={{ base: "8px", md: "12px" }}
              border="1px solid"
              borderColor="whiteAlpha.100"
            >
              <HStack spacing={3} mb={2}>
                <Calendar size={18} color={secondaryTextColor} />
                <Text fontSize="sm" fontWeight={600} color="white">
                  Posted
                </Text>
              </HStack>
              <VStack align="start" spacing={1} pl={8}>
                <Text fontSize="sm" color="white">
                  {new Date(post.createdAt).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                <Text fontSize="xs" color={secondaryTextColor}>
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
    </BlurModal>
  );
};

export default PostDetailsModal;

