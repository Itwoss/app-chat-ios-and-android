import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Image,
  useToast,
  useColorModeValue,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Spinner,
  Center,
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Avatar,
  Divider,
} from '@chakra-ui/react';
import { Plus, Trash2, Eye, Heart, MessageCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetMyStoriesQuery, useDeleteStoryMutation, useGetStoryViewersQuery, useGetCurrentUserQuery } from '../store/api/userApi';
import { getUserInfo } from '../utils/auth';
import StoryComposer from '../components/Stories/StoryComposer';
import { PostCardSkeleton } from '../components/Skeletons';

/**
 * Inner content of My Stories (gradient, header, list, modals).
 * Used both as full page (wrapped in UserLayout) and inside popup modal from Story Tray.
 * @param {boolean} isInsideModal - when true, container fits parent and does not use minH 100vh (for popup)
 */
export const MyStoriesContent = ({ isInsideModal = false }) => {
  const toast = useToast();
  // Create Post page blur design tokens
  const pageBgColor = useColorModeValue('white', 'gray.900');
  const pageBorderColor = useColorModeValue('#dbdbdb', '#262626');
  const blurBgLight = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
  const blurBgDark = 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(20, 20, 40, 0.4) 100%)';
  const blurBg = useColorModeValue(blurBgLight, blurBgDark);
  const blurBorderLight = 'rgba(0, 0, 0, 0.2)';
  const blurBorderDark = 'rgba(255, 255, 255, 0.1)';
  const blurBorder = useColorModeValue(blurBorderLight, blurBorderDark);
  const blurHoverBorderLight = 'rgba(0, 0, 0, 0.3)';
  const blurHoverBorderDark = 'rgba(255, 255, 255, 0.15)';
  const blurHoverBorder = useColorModeValue(blurHoverBorderLight, blurHoverBorderDark);
  const createButtonColor = useColorModeValue('black', 'white');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const headingColor = useColorModeValue('gray.800', 'white');
  // Popup (Story Tray): light text on blur like Create Post modal
  const effectiveHeadingColor = isInsideModal ? 'white' : headingColor;
  const effectiveTextColor = isInsideModal ? 'whiteAlpha.800' : textColor;
  const effectiveCreateBtnColor = isInsideModal ? 'white' : createButtonColor;

  const navigate = useNavigate();
  const { data: storiesData, isLoading, refetch } = useGetMyStoriesQuery();
  const { data: currentUserData } = useGetCurrentUserQuery();
  const [deleteStory, { isLoading: isDeleting }] = useDeleteStoryMutation();
  const userInfo = getUserInfo();

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isStoryDetailOpen, onOpen: onStoryDetailOpen, onClose: onStoryDetailClose } = useDisclosure();
  const [selectedStory, setSelectedStory] = useState(null);
  const cancelRef = useRef();

  const stories = storiesData?.data || [];

  const handleDeleteClick = (story, e) => {
    e?.stopPropagation();
    setSelectedStory(story);
    onDeleteOpen();
  };

  const handleStoryClick = (story) => {
    const isExpired = new Date(story.expiresAt) <= new Date();
    if (isExpired) {
      setSelectedStory(story);
      onStoryDetailOpen();
      return;
    }
    const rawUser = currentUserData?.data || userInfo;
    const user = rawUser ? { ...rawUser, _id: rawUser._id || rawUser.id } : null;
    if (!user) return;
    const myActiveStories = stories.filter((s) => new Date(s.expiresAt) > new Date());
    const orderedStories = [story, ...myActiveStories.filter((s) => s._id !== story._id)];
    const storyGroup = {
      user,
      stories: orderedStories,
      hasViewed: false,
      isMyStory: true,
    };
    navigate('/user/stories/view', {
      state: {
        stories: [storyGroup],
        initialUserIndex: 0,
        returnPath: '/user/stories',
      },
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteStory(selectedStory._id).unwrap();
      toast({
        title: 'Story deleted',
        description: 'Your story has been deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetch();
      onDeleteClose();
    } catch (error) {
      toast({
        title: 'Failed to delete story',
        description: error?.data?.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m left`;
    if (minutes > 0) return `${minutes}m left`;
    return 'Expired';
  };

  const now = new Date();
  const activeStories = stories.filter(s => new Date(s.expiresAt) > now);
  const oldStories = stories.filter(s => new Date(s.expiresAt) <= now);

  // Create Post popup–style blur border (glass panel)
  const blurPanelBorder = useColorModeValue('rgba(0, 0, 0, 0.12)', 'rgba(255, 255, 255, 0.2)');

  if (isLoading) {
    return (
      <Box
        position="relative"
        minH={isInsideModal ? '200px' : '100vh'}
        w="100%"
        h={isInsideModal ? '100%' : undefined}
        bg={isInsideModal ? 'transparent' : pageBgColor}
        p={4}
      >
        {isInsideModal ? (
          <Center minH="200px">
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={2}>
              {[1, 2, 3, 4].map((i) => (
                <PostCardSkeleton key={i} borderRadius="12px" />
              ))}
            </SimpleGrid>
          </Center>
        ) : (
          <Box pt={4}>
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <PostCardSkeleton key={i} borderRadius="12px" />
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box
      position="relative"
      minH={isInsideModal ? undefined : '100vh'}
      h={isInsideModal ? '100%' : undefined}
      w="100%"
      bg={isInsideModal ? 'transparent' : pageBgColor}
    >
      {/* Glass panel only on full page (menu); popup gets blur from Modal in UserHome) */}
      <Box
        position="relative"
        zIndex={1}
        h={isInsideModal ? '100%' : undefined}
        minH={isInsideModal ? undefined : '100vh'}
        w="100%"
        display={isInsideModal ? 'flex' : undefined}
        flexDirection={isInsideModal ? 'column' : undefined}
        bg="transparent"
        border={isInsideModal ? 'none' : '1px solid'}
        borderColor={blurPanelBorder}
        borderRadius={isInsideModal ? 'inherit' : { base: 0, md: '2xl' }}
        mx={isInsideModal ? 0 : { base: 0, md: 4 }}
        my={isInsideModal ? 0 : { base: 0, md: 4 }}
        sx={isInsideModal ? undefined : {
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'none',
        }}
      >
        {/* Header - Create Post blur style */}
        <Box
          display="flex"
          px={{ base: 4, md: 4 }}
          py={{ base: 2, md: 2 }}
          borderBottom="1px solid"
          borderColor={blurBorder}
          justify="space-between"
          align="center"
          bg="transparent"
          position="sticky"
          top={0}
          zIndex={10}
        >
            <Heading size="lg" color={effectiveHeadingColor} fontWeight={600}>
              My Stories
            </Heading>
            <Button
              leftIcon={<Plus size={18} />}
              onClick={onCreateOpen}
              size={{ base: 'sm', md: 'sm' }}
              bg="transparent"
              color={effectiveCreateBtnColor}
              border="1px solid"
              borderColor={blurBorder}
              _hover={{
                borderColor: blurHoverBorder,
                transform: 'scale(1.05)',
              }}
              _active={{
                transform: 'scale(0.98)',
              }}
              borderRadius="4px"
              fontWeight={600}
              h={{ base: '32px', md: '32px' }}
              fontSize={{ base: 'sm', md: 'sm' }}
              transition="all 0.2s ease"
            >
              Create Story
            </Button>
          </Box>

          <Container maxW="7xl" py={6} px={{ base: 4, md: 6 }} flex={isInsideModal ? 1 : undefined} minH={isInsideModal ? 0 : undefined} overflow={isInsideModal ? 'auto' : undefined}>
            <VStack spacing={6} align="stretch">
              <Text color={effectiveTextColor} fontSize="sm">
                Your stories will automatically expire after 24 hours
              </Text>

              {stories.length === 0 ? (
                <Center
                  py={20}
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor={blurBorder}
                  bg={blurBg}
                  sx={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <VStack spacing={4}>
                    <Text fontSize="xl" color={effectiveHeadingColor} fontWeight={500}>
                      No active stories
                    </Text>
                    <Text color={effectiveTextColor} textAlign="center" maxW="280px">
                      Create your first story to share with your friends!
                    </Text>
                    <Button
                      leftIcon={<Plus size={18} />}
                      onClick={onCreateOpen}
                      size="sm"
                      bg="transparent"
                      color={effectiveCreateBtnColor}
                      border="1px solid"
                      borderColor={blurBorder}
                      _hover={{
                        borderColor: blurHoverBorder,
                        transform: 'scale(1.05)',
                      }}
                      _active={{ transform: 'scale(0.98)' }}
                      borderRadius="4px"
                      fontWeight={600}
                      transition="all 0.2s ease"
                    >
                      Create Story
                    </Button>
                  </VStack>
                </Center>
              ) : (
            <VStack spacing={6} align="stretch">
              {/* Active Stories Section */}
              {activeStories.length > 0 && (
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color={effectiveHeadingColor}>Active Stories</Heading>
                  <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={4}>
                    {activeStories.map((story) => (
                      <Box
                        key={story._id}
                        borderRadius={{ base: '12px', md: '16px' }}
                        overflow="hidden"
                        border="1px solid"
                        borderColor={blurBorder}
                        position="relative"
                        cursor="pointer"
                        aspectRatio="4/5"
                        maxH={{ base: '300px', sm: '340px' }}
                        onClick={() => handleStoryClick(story)}
                        _hover={{
                          transform: 'translateY(-4px)',
                          borderColor: blurHoverBorder,
                        }}
                        transition="all 0.2s"
                        sx={{
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          bg: 'black',
                        }}
                      >
                        {story.mediaType === 'image' ? (
                          <Image
                            src={story.mediaUrl}
                            alt="Story"
                            position="absolute"
                            inset={0}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                          />
                        ) : (
                          <Box
                            as="video"
                            src={story.mediaUrl}
                            position="absolute"
                            inset={0}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                            muted
                          />
                        )}
                        <Box
                          position="absolute"
                          top={2}
                          right={2}
                          px={2}
                          py={1}
                          borderRadius="md"
                          bg={blurBg}
                          border="1px solid"
                          borderColor={blurBorder}
                          zIndex={2}
                          sx={{
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                          }}
                        >
                          <Text
                            fontSize="2xs"
                            fontWeight="500"
                            color="white"
                          >
                            {getTimeRemaining(story.expiresAt)}
                          </Text>
                        </Box>
                        <HStack
                          position="absolute"
                          bottom={0}
                          left={0}
                          right={0}
                          justify="space-between"
                          align="center"
                          px={2}
                          py={2}
                          bgGradient="linear(to-t, blackAlpha.800 0%, transparent 100%)"
                          zIndex={2}
                        >
                          <HStack spacing={3} color="white" fontSize="xs">
                            <HStack spacing={1}>
                              <Eye size={14} />
                              <Text>{story.viewCount || 0}</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <Heart size={14} />
                              <Text>{story.likeCount || 0}</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <MessageCircle size={14} />
                              <Text>{story.replyCount || 0}</Text>
                            </HStack>
                          </HStack>
                          <IconButton
                            icon={<Trash2 size={14} />}
                            aria-label="Delete"
                            size="xs"
                            variant="ghost"
                            color="white"
                            _hover={{ bg: 'whiteAlpha.200' }}
                            onClick={(e) => handleDeleteClick(story, e)}
                          />
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </VStack>
              )}

              {/* Old Stories Section */}
              {oldStories.length > 0 && (
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color={effectiveHeadingColor}>Old Stories</Heading>
                  <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={4}>
                    {oldStories.map((story) => (
                      <Box
                        key={story._id}
                        borderRadius={{ base: "12px", md: "16px" }}
                        overflow="hidden"
                        border="1px solid"
                        borderColor="rgba(255, 255, 255, 0.2)"
                        position="relative"
                        opacity={0.8}
                        cursor="pointer"
                        onClick={() => handleStoryClick(story)}
                        _hover={{ 
                          transform: 'translateY(-4px)',
                          opacity: 1,
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        }}
                        transition="all 0.2s"
                        sx={{
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          bg: 'transparent',
                        }}
                      >
                        <Box position="relative" h="200px">
                          {story.mediaType === 'image' ? (
                            <Image
                              src={story.mediaUrl}
                              alt="Story"
                              w="100%"
                              h="100%"
                              objectFit="cover"
                            />
                          ) : (
                            <Box
                              as="video"
                              src={story.mediaUrl}
                              w="100%"
                              h="100%"
                              objectFit="cover"
                              muted
                            />
                          )}
                          <Box
                            position="absolute"
                            top={2}
                            right={2}
                            borderRadius="md"
                            px={2}
                            py={1}
                            bg="rgba(0, 0, 0, 0.3)"
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.05)"
                            sx={{
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                            }}
                          >
                            <Badge colorScheme="gray" fontSize="xs" color="white">
                              {getTimeRemaining(story.expiresAt)}
                            </Badge>
                          </Box>
                          <HStack
                            position="absolute"
                            bottom={2}
                            left={2}
                            right={2}
                            justify="space-between"
                            bg="rgba(0, 0, 0, 0.3)"
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.05)"
                            borderRadius="md"
                            px={2}
                            py={1}
                            sx={{
                              backdropFilter: 'blur(10px)',
                              WebkitBackdropFilter: 'blur(10px)',
                            }}
                          >
                            <HStack spacing={2} color="white" fontSize="xs">
                              <HStack spacing={1}>
                                <Eye size={14} />
                                <Text>{story.viewCount || 0}</Text>
                              </HStack>
                              <Text>•</Text>
                              <HStack spacing={1}>
                                <Heart size={14} />
                                <Text>{story.likeCount || 0}</Text>
                              </HStack>
                              <Text>•</Text>
                              <HStack spacing={1}>
                                <MessageCircle size={14} />
                                <Text>{story.replyCount || 0}</Text>
                              </HStack>
                            </HStack>
                            <IconButton
                              icon={<Trash2 size={14} />}
                              aria-label="Delete"
                              size="xs"
                              colorScheme="red"
                              onClick={(e) => handleDeleteClick(story, e)}
                            />
                          </HStack>
                        </Box>
                        {story.caption && (
                          <Box p={2} bg="transparent">
                            <Text fontSize="sm" noOfLines={2} color="white">
                              {story.caption}
                            </Text>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </SimpleGrid>
                </VStack>
              )}
            </VStack>
          )}
        </VStack>
      </Container>

        {/* Create Story — Instagram-style composer */}
        <StoryComposer
          isOpen={isCreateOpen}
          onClose={onCreateClose}
          onSuccess={() => {
            refetch();
            onCreateClose();
          }}
        />

        {/* Story Detail Modal */}
        {selectedStory && (
          <StoryDetailModal
            isOpen={isStoryDetailOpen}
            onClose={onStoryDetailClose}
            story={selectedStory}
          />
        )}

        {/* Delete Confirmation */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
          isCentered
          motionPreset="scale"
        >
          <AlertDialogOverlay
            bg="blackAlpha.600"
            sx={{
              animation: 'fadeIn 0.3s ease-out',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 }
              }
            }}
          />
          <AlertDialogContent
            mx={{ base: 6, md: 4 }}
            my={{ base: 6, md: 4 }}
            maxW={{ base: "calc(100% - 48px)", md: "400px" }}
            borderRadius={{ base: "20px", md: "24px" }}
            overflow="hidden"
            bg="transparent"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.2)"
            sx={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: 'none',
            }}
          >
            <AlertDialogHeader
              py={{ base: 3, md: 4 }}
              px={{ base: 4, md: 5 }}
              fontSize={{ base: "18px", md: "20px" }}
              fontWeight="600"
              color="white"
              borderBottom="1px solid"
              borderColor="whiteAlpha.100"
              bg="transparent"
            >
              Delete Story
            </AlertDialogHeader>
            <AlertDialogBody
              px={{ base: 4, md: 5 }}
              py={{ base: 4, md: 5 }}
              color="whiteAlpha.800"
              fontSize={{ base: "14px", md: "15px" }}
            >
              Are you sure you want to delete this story? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter
              px={{ base: 4, md: 5 }}
              py={{ base: 3, md: 4 }}
              borderTop="1px solid"
              borderColor="whiteAlpha.100"
              bg="transparent"
            >
              <HStack spacing={3} w="full">
                <Button
                  ref={cancelRef}
                  onClick={onDeleteClose}
                  flex={1}
                  size={{ base: "sm", md: "md" }}
                  variant="ghost"
                  color="white"
                  fontSize={{ base: "13px", md: "14px" }}
                  py={{ base: 2.5, md: 2 }}
                  _hover={{
                    bg: 'whiteAlpha.200',
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  flex={1}
                  size={{ base: "sm", md: "md" }}
                  bg="red.500"
                  color="white"
                  fontWeight="600"
                  fontSize={{ base: "13px", md: "14px" }}
                  py={{ base: 2.5, md: 2 }}
                  isLoading={isDeleting}
                  loadingText="Deleting..."
                  _hover={{
                    bg: 'red.600',
                  }}
                  _active={{
                    transform: 'scale(0.98)',
                  }}
                >
                  Delete
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </Box>
      </Box>
  );
};

const MyStories = () => <MyStoriesContent />;

// Story Detail Modal Component
const StoryDetailModal = ({ isOpen, onClose, story }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  
  const { data: viewersData, isLoading: isLoadingViewers } = useGetStoryViewersQuery(
    story?._id,
    { skip: !story?._id || !isOpen }
  );

  const viewersPayload = viewersData?.data;
  const viewers = Array.isArray(viewersPayload) ? viewersPayload : (viewersPayload?.viewers || []);
  const viewCount =
    (viewersPayload && !Array.isArray(viewersPayload) && viewersPayload.viewCount != null)
      ? viewersPayload.viewCount
      : (story?.viewCount ?? viewers.length ?? 0);
  const likeCount = viewersData?.data?.likeCount ?? story?.likeCount ?? 0;
  const replyCount = story?.replyCount || 0;

  // Separate viewers into likers and regular viewers
  const likers = viewers.filter(v => v.hasLiked);
  const regularViewers = viewers.filter(v => !v.hasLiked);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={{ base: "full", md: "xl" }}
      motionPreset="scale"
      isCentered
    >
      <ModalOverlay 
        bg="blackAlpha.800"
        sx={{
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />
      <ModalContent
        mx={{ base: 0, md: 4 }}
        my={{ base: 0, md: 4 }}
        maxW={{ base: "100%", md: "600px" }}
        h={{ base: "100%", md: "auto" }}
        maxH={{ base: "100%", md: "90vh" }}
        borderRadius={{ base: "0", md: "24px" }}
        overflow="hidden"
        bg="transparent"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.2)"
        sx={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'none',
        }}
      >
        <ModalHeader
          py={{ base: 3, md: 4 }}
          px={{ base: 4, md: 6 }}
          fontSize={{ base: "18px", md: "20px" }}
          fontWeight="600"
          color="white"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          bg="transparent"
        >
          <VStack spacing={2} align="stretch">
            <Text>Story Details</Text>
            <HStack spacing={4} fontSize="sm" color="whiteAlpha.600">
              {likeCount > 0 && (
                <HStack spacing={1}>
                  <Heart size={16} />
                  <Text>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
                </HStack>
              )}
              {replyCount > 0 && (
                <HStack spacing={1}>
                  <MessageCircle size={16} />
                  <Text>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</Text>
                </HStack>
              )}
            </HStack>
          </VStack>
        </ModalHeader>
        <ModalCloseButton 
          top={{ base: 3, md: 4 }}
          right={{ base: 4, md: 6 }}
          color="white"
          borderRadius="full"
          size="md"
          _hover={{
            bg: 'whiteAlpha.200',
          }}
        />
        <ModalBody 
          px={{ base: 4, md: 6 }}
          py={{ base: 4, md: 6 }}
          maxH={{ base: "calc(100vh - 200px)", md: "60vh" }}
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
          {/* Story Media Preview */}
          <Box
            mb={6}
            borderRadius="12px"
            overflow="hidden"
            border="1px solid"
            borderColor="whiteAlpha.100"
          >
            <Box position="relative" h={{ base: "250px", md: "300px" }}>
              {story?.mediaType === 'image' ? (
                <Image
                  src={story?.mediaUrl}
                  alt="Story"
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              ) : (
                <Box
                  as="video"
                  src={story?.mediaUrl}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  controls
                />
              )}
            </Box>
            {story?.caption && (
              <Box p={4} bg="whiteAlpha.50" borderTop="1px solid" borderColor="whiteAlpha.100">
                <Text color="white" fontSize="sm">
                  {story.caption}
                </Text>
              </Box>
            )}
          </Box>

          {isLoadingViewers ? (
            <Center py={10}>
              <Spinner size="lg" color="white" />
            </Center>
          ) : viewers.length === 0 ? (
            <Center py={10}>
              <VStack spacing={2}>
                <Eye size={48} color="rgba(255, 255, 255, 0.4)" />
                <Text color="whiteAlpha.600">No viewers yet</Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={0} align="stretch">
              {/* Likers Section */}
              {likers.length > 0 && (
                <>
                  <Box px={4} py={3} bg="whiteAlpha.50" borderRadius="8px" mb={2}>
                    <HStack spacing={2}>
                      <Heart size={16} color="#ef4444" fill="#ef4444" />
                      <Text fontSize="sm" fontWeight="semibold" color="white">
                        Likes ({likers.length})
                      </Text>
                    </HStack>
                  </Box>
                  {likers.map((viewer, idx) => (
                    <HStack
                      key={viewer._id || idx}
                      px={4}
                      py={3}
                      _hover={{ bg: 'whiteAlpha.100' }}
                      borderRadius="8px"
                      mb={1}
                    >
                      <Avatar
                        size="sm"
                        name={viewer.viewer?.name}
                        src={viewer.viewer?.profileImage}
                      />
                      <VStack align="start" spacing={0} flex={1}>
                        <HStack spacing={2}>
                          <Text fontWeight="medium" fontSize="sm" color="white">
                            {viewer.viewer?.name}
                          </Text>
                          {viewer.emoji && (
                            <Text fontSize="sm">{viewer.emoji}</Text>
                          )}
                        </HStack>
                        <Text fontSize="xs" color="whiteAlpha.500">
                          {new Date(viewer.createdAt).toLocaleString()}
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
                  {regularViewers.length > 0 && <Divider my={3} borderColor="whiteAlpha.100" />}
                </>
              )}
              
              {/* Regular Viewers Section */}
              {regularViewers.length > 0 && (
                <>
                  <Box px={4} py={3} bg="whiteAlpha.50" borderRadius="8px" mb={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="white">
                      Viewers ({regularViewers.length})
                    </Text>
                  </Box>
                  {regularViewers.map((viewer, idx) => (
                    <HStack
                      key={viewer._id || idx}
                      px={4}
                      py={3}
                      _hover={{ bg: 'whiteAlpha.100' }}
                      borderRadius="8px"
                      mb={1}
                    >
                      <Avatar
                        size="sm"
                        name={viewer.viewer?.name}
                        src={viewer.viewer?.profileImage}
                      />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontWeight="medium" fontSize="sm" color="white">
                          {viewer.viewer?.name}
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.500">
                          {new Date(viewer.createdAt).toLocaleString()}
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
                </>
              )}
            </VStack>
          )}
        </ModalBody>
        <ModalFooter
          px={{ base: 4, md: 6 }}
          py={{ base: 3, md: 4 }}
          borderTop="1px solid"
          borderColor="whiteAlpha.100"
          bg="transparent"
        >
          <Button
            onClick={onClose}
            flex={1}
            size={{ base: "sm", md: "md" }}
            bg="whiteAlpha.100"
            color="white"
            _hover={{
              bg: 'whiteAlpha.200',
            }}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MyStories;

