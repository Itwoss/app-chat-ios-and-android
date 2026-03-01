import {
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Box,
  Card,
  CardBody,
  Avatar,
  HStack,
  Button,
  IconButton,
  useToast,
  Spinner,
  Center,
  Image,
  Textarea,
  Input,
  InputGroup,
  InputRightElement,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  SimpleGrid,
  IconButton as ChakraIconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react'
import StoryTray from '../components/Stories/StoryTray'
import HomepageNotificationBell from '../components/Notifications/HomepageNotificationBell'
import {
  Heart,
  MessageCircle,
  Trash2,
  Pencil,
  Image as ImageIcon,
  Send,
  X,
  Music,
  Bookmark,
  BookmarkCheck,
  Share2,
  Eye,
  TrendingUp,
  ThumbsUp,
  BarChart2,
  Volume2,
  VolumeX,
  Video,
  ChevronUp,
  ChevronDown,
  UserPlus,
  UserCheck,
  UserX,
  Link as LinkIcon,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import {
  useGetFeedQuery,
  useGetTrendingSectionsQuery,
  useCreatePostMutation,
  useToggleLikeMutation,
  useDeletePostMutation,
  useGetCurrentUserQuery,
  useSavePostMutation,
  useUnsavePostMutation,
  useGetSavedPostsQuery,
  useGetStoriesFeedQuery,
  useGetMyStoriesQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowingQuery,
} from '../store/api/userApi'
import UserAvatar from '../components/User/UserAvatar'
import UserName from '../components/User/UserName'
import UserAvatarWithBanner from '../components/User/UserAvatarWithBanner'
import AvatarZoomPreview from '../components/User/AvatarZoomPreview'
import { useLongPress } from '../hooks/useLongPress'
import VerifiedBadge from '../components/VerifiedBadge/VerifiedBadge'
import { getUserInfo } from '../utils/auth'
import { STORAGE_KEYS } from '../utils/storageKeys'
import { EmptyState } from '../components/EmptyState/EmptyState'
import PostDetailsModal from '../components/Posts/PostDetailsModal'
import VideoPostPlayer from '../components/Posts/VideoPostPlayer'
import DoubleTapLike from '../components/Posts/DoubleTapLike'
import PostCard from '../components/Posts/PostCard'
import { useAudioManager } from '../contexts/AudioManagerContext'
import { useIncrementPostViewMutation } from '../store/api/userApi'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import usePostViewTracker from '../hooks/usePostViewTracker'
import useInstagramAutoplay from '../hooks/useInstagramAutoplay'
import useInstagramImageAutoplay from '../hooks/useInstagramImageAutoplay'
import { useCreatePost } from '../contexts/CreatePostContext'
import CreatePostModal from '../components/Posts/CreatePostModal'
import EditPostModal from '../components/Posts/EditPostModal'
import CommentBottomSheet from '../components/Posts/CommentBottomSheet'
import { RippleButton } from '../components/ui/RippleButton'
import BlurModal from '../components/ui/BlurModal'
import { PostCardSkeleton } from '../components/Skeletons'
import { MyStoriesContent } from './MyStories'
import useAmbientColors from '../hooks/useAmbientColors'
import { useAmbientGlow } from '../hooks/useAmbientGlow'
import { useHorizontalScrollAxisLock } from '../hooks/useHorizontalScrollAxisLock'
import { getSocket } from '../utils/socket'
import { buildYouTubeEmbedUrl } from '../utils/youtubeEmbed'
import { getRelativeTime } from '../utils/dateFormat'
import { useBreakpointValue } from '@chakra-ui/react'

// ─── FIX 1: Memoized trending card to prevent re-renders during page scroll ───
const TrendingCard = memo(({ post, index, onNavigate, cardBg, borderColor, textColor }) => {
  const thumb = post.videoThumbnail || null
  const postBorderRadius = post.borderRadius || '12px'
  const positionNumber = index + 1

  return (
    <Box
      flexShrink={0}
      w="116px"
      minW="116px"
      borderRadius={postBorderRadius}
      overflow="hidden"
      bg={cardBg}
      cursor="pointer"
      onClick={() => onNavigate(post)}
      border="1px solid"
      borderColor={borderColor}
      // FIX 2: Use 'pan-x' so the card captures horizontal drag, not vertical
      sx={{ touchAction: 'pan-x', userSelect: 'none' }}
    >
      <Box position="relative" w="100%" pt="133.33%" bg="gray.700">
        <Center
          position="absolute"
          top={2}
          left={2}
          w="24px"
          h="24px"
          borderRadius="full"
          bg="blackAlpha.700"
          color="white"
          fontSize="12px"
          fontWeight="800"
          zIndex={1}
        >
          {positionNumber}
        </Center>
        {thumb ? (
          <Image
            src={thumb}
            alt=""
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%"
            objectFit="cover"
            // FIX 3: lazy load images so off-screen thumbnails don't block paint
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Center position="absolute" top={0} left={0} w="100%" h="100%" color="whiteAlpha.700">
            <Video size={24} />
          </Center>
        )}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p={2}
          bg="linear-gradient(transparent, blackAlpha.800)"
        >
          <Text fontSize="xs" fontFamily="Raleway, sans-serif" fontWeight="bold" color="white" noOfLines={2}>
            {post.title || 'Post'}
          </Text>
          <HStack spacing={2} mt={0.5} fontSize="2xs" color="whiteAlpha.800">
            <HStack spacing={0.5}>
              <Heart size={10} />
              {post.likes?.length || 0}
            </HStack>
            <HStack spacing={0.5}>
              <MessageCircle size={10} />
              {post.comments?.length || 0}
            </HStack>
          </HStack>
        </Box>
      </Box>
    </Box>
  )
})

/** 
 * FIX 4: Horizontal trending carousel with corrected touchAction.
 * - 'pan-x' tells the browser this element handles horizontal scrolling
 *   → browser does NOT wait for JS before committing vertical scroll on page
 * - 'overscrollBehaviorX: contain' prevents the horizontal drag from
 *   accidentally triggering page pull-to-refresh or vertical scroll
 */
function TrendingCarouselScroll({ onScroll, children }) {
  const scrollRef = useRef(null)
  useHorizontalScrollAxisLock(scrollRef)
  return (
    <Box
      ref={scrollRef}
      overflowX="auto"
      overflowY="hidden"
      w="100%"
      pb={2}
      data-slide-nav-aware
      onScroll={onScroll}
      sx={{
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
        WebkitOverflowScrolling: 'touch',
        // KEY FIX: was 'manipulation' which blocks browser native scroll optimisation.
        // 'pan-x' lets the browser know this scrolls horizontally → zero JS scroll lag.
        touchAction: 'pan-x',
        overscrollBehaviorX: 'contain',
        // GPU-accelerate the layer so compositing happens off main thread
        willChange: 'scroll-position',
        transform: 'translateZ(0)',
        // Containment hints so layout/paint of carousel doesn't affect page
        contain: 'layout style',
      }}
    >
      {children}
    </Box>
  )
}

const UserHome = () => {
  const navigate = useNavigate()
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('gray.50', 'gray.600')
  const pageBgColor = useColorModeValue('white', '#000000')
  const pageBorderColor = useColorModeValue('#dbdbdb', '#262626')
  const hoverBgColor = useColorModeValue('gray.100', 'gray.800')
  const blurBgLight = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
  const blurBgDark = 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(20, 20, 40, 0.4) 100%)'
  const blurBg = useColorModeValue(blurBgLight, blurBgDark)
  const blurBorderLight = 'rgba(0, 0, 0, 0.2)'
  const blurBorderDark = 'rgba(255, 255, 255, 0.1)'
  const blurBorder = useColorModeValue(blurBorderLight, blurBorderDark)
  const blurHoverLight = 'rgba(255, 255, 255, 0.15)'
  const blurHoverDark = 'rgba(255, 255, 255, 0.08)'
  const blurHover = useColorModeValue(blurHoverLight, blurHoverDark)
  const blurHoverBorderLight = 'rgba(0, 0, 0, 0.3)'
  const blurHoverBorderDark = 'rgba(255, 255, 255, 0.15)'
  const blurHoverBorder = useColorModeValue(blurHoverBorderLight, blurHoverBorderDark)
  const createPostButtonColor = useColorModeValue('black', 'white')
  const ambientGlowOpacity = useColorModeValue(0.58, 0.75)
  const glowBlendMode = useColorModeValue('multiply', 'normal')
  const [ambientGlowEnabled, setAmbientGlowEnabled] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEYS.AMBIENT_GLOW) !== 'false' } catch { return true }
  })
  useEffect(() => {
    const handler = () => {
      try { setAmbientGlowEnabled(localStorage.getItem(STORAGE_KEYS.AMBIENT_GLOW) !== 'false') } catch (_) {}
    }
    window.addEventListener('ambientGlowChanged', handler)
    return () => window.removeEventListener('ambientGlowChanged', handler)
  }, [])
  const topLeftGradient = useColorModeValue(
    'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.06) 40%, transparent 70%)',
    'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.08) 40%, transparent 70%)'
  )
  const bottomLeftGradient = 'linear-gradient(315deg, rgba(10, 78, 105, 0.71) 0%, rgba(10, 78, 105, 0.2) 35%, transparent 65%)'
  const bottomRightGradient = 'linear-gradient(225deg, rgba(10, 78, 105, 0.71) 0%, rgba(10, 78, 105, 0.2) 35%, transparent 65%)'
  const toast = useToast()
  const userInfo = getUserInfo()
  const currentUserId = userInfo?.id
  const { data: userData } = useGetCurrentUserQuery()
  
  const isMobileOrTablet = useBreakpointValue({ base: true, lg: false }) ?? false

  const [page, setPage] = useState(1)
  const [allPosts, setAllPosts] = useState([])
  const [trendingPostForDetails, setTrendingPostForDetails] = useState(null)
  const loadMoreSentinelRef = useRef(null)
  const refetchAfterDeleteRef = useRef(false)
  const trendingRefetchAtRef = useRef(0)
  const TRENDING_REFETCH_COOLDOWN_MS = 3000

  const { data: trendingData, refetch: refetchTrending, isFetching: isTrendingFetching } = useGetTrendingSectionsQuery(undefined, { refetchOnMountOrArgChange: false })
  const trendingSections = trendingData?.data
    ? [
        { id: 'today', title: "Today's Trending", icon: TrendingUp, posts: trendingData.data.todayTrending || [] },
        { id: 'topLiked', title: 'Top Liked', icon: ThumbsUp, posts: trendingData.data.topLiked || [] },
        { id: 'viewed', title: 'Most Viewed', icon: BarChart2, posts: trendingData.data.mostViewed || [] },
      ]
        .map((s) => ({ ...s, posts: (s.posts || []).filter((p) => !!p?.video) }))
        .filter((s) => s.posts.length > 0)
    : []

  // FIX 5: Throttle the scroll handler with requestAnimationFrame to avoid
  // blocking the main thread on every scroll event tick
  const trendingScrollRafRef = useRef(null)
  const handleTrendingScroll = useCallback(
    (e) => {
      if (trendingScrollRafRef.current) return
      trendingScrollRafRef.current = requestAnimationFrame(() => {
        trendingScrollRafRef.current = null
        const el = e.target
        if (!el || typeof refetchTrending !== 'function') return
        const { scrollLeft, scrollWidth, clientWidth } = el
        const threshold = 80
        const nearEnd = scrollLeft + clientWidth >= scrollWidth - threshold
        if (nearEnd && Date.now() - trendingRefetchAtRef.current > TRENDING_REFETCH_COOLDOWN_MS) {
          trendingRefetchAtRef.current = Date.now()
          refetchTrending()
        }
      })
    },
    [refetchTrending]
  )

  const { data, isLoading, isFetching, refetch } = useGetFeedQuery(
    { page, limit: 10 },
    {
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: true,
    }
  )

  const pagination = data?.pagination
  const hasMore = Boolean(pagination && page < pagination.pages)

  const mergePostWithExisting = useCallback((existing, incoming) => {
    if (!existing) return incoming
    return {
      ...incoming,
      song: incoming.song ?? existing.song,
      sound: incoming.sound ?? existing.sound,
    }
  }, [])

  useEffect(() => {
    if (!data?.data) return

    if (page === 1) {
      setAllPosts((prev) => {
        const existingById = new Map(prev.map((p) => [p._id, p]))
        const unique = Array.from(
          new Map(
            data.data.map((p) => {
              const merged = mergePostWithExisting(existingById.get(p._id), p)
              return [merged._id, merged]
            })
          ).values()
        )
        return unique
      })
    } else {
      setAllPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p._id))
        const newUniquePosts = data.data.filter((p) => !existingIds.has(p._id))
        return [...prev, ...newUniquePosts]
      })
    }
  }, [data, page, mergePostWithExisting])

  useEffect(() => {
    if (page === 1 && refetchAfterDeleteRef.current) {
      refetchAfterDeleteRef.current = false
      refetch()
    }
  }, [page, refetch])

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current
    if (!sentinel || !hasMore || isFetching) return
    const observer = new IntersectionObserver(
      (entries) => {
        const [e] = entries
        if (e?.isIntersecting) setPage((p) => p + 1)
      },
      { root: null, rootMargin: '200px', threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, isFetching])

  const [toggleLike] = useToggleLikeMutation()
  const [deletePost] = useDeletePostMutation()

  const { isOpen: isCreatePostOpen, openModal: openCreatePostModal, closeModal: closeCreatePostModal, isEditPostOpen, postToEdit, openEditPostModal, closeEditPostModal } = useCreatePost()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isMyStoriesModalOpen, onOpen: onOpenMyStoriesModal, onClose: onCloseMyStoriesModal } = useDisclosure()
  const [deletePostId, setDeletePostId] = useState(null)
  const cancelDeleteRef = useRef()
  const [playingVideoPostId, setPlayingVideoPostId] = useState(null)
  const [soundPostId, setSoundPostId] = useState(null)
  const [commentSheetPostId, setCommentSheetPostId] = useState(null)
  const [expandedLinksPostId, setExpandedLinksPostId] = useState(null)
  const posts = allPosts.length ? allPosts : (data?.data || [])

  const { setSessionSoundOn } = useAudioManager()
  useEffect(() => {
    try {
      setSessionSoundOn(soundPostId !== null)
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') console.warn('[UserHome] setSessionSoundOn failed', e)
    }
  }, [soundPostId, setSessionSoundOn])

  const handleRequestSound = useCallback((postId) => {
    setSoundPostId((prev) => {
      if (prev === postId) return null
      return postId
    })
  }, [])

  const handleRequestMute = useCallback(() => {
    setSoundPostId(null)
  }, [])

  const handleOpenCommentSheet = useCallback((post) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setPlayingVideoPostId(null)
    setCommentSheetPostId(post._id)
  }, [])

  const { data: storiesData } = useGetStoriesFeedQuery(undefined, { refetchOnMountOrArgChange: false })
  const { data: myStoriesData } = useGetMyStoriesQuery(undefined, { refetchOnMountOrArgChange: false })
  const myStories = myStoriesData?.data || []
  const allStories = storiesData?.data || []
  
  const firstStoryProfileImage = (() => {
    const currentUserProfileImage = userData?.data?.profileImage || userInfo?.profileImage
    if (currentUserProfileImage && myStories.length > 0) {
      return currentUserProfileImage
    }
    if (allStories.length > 0 && allStories[0]?.user?.profileImage) {
      return allStories[0].user.profileImage
    }
    if (posts.length > 0 && posts[0].images && posts[0].images.length > 0) {
      return posts[0].images[0]
    }
    return null
  })()
  
  const firstPostImage = useMemo(() => {
    return posts.length > 0 && posts[0].images && posts[0].images.length > 0 
      ? posts[0].images[0] 
      : null
  }, [posts.length > 0 ? posts[0]?._id : null, posts[0]?.images?.[0]])
  
  const sharedAmbientGradient = useAmbientColors(firstStoryProfileImage || firstPostImage || null)

  const handleLike = async (postId) => {
    try {
      await toggleLike(postId).unwrap()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to like post',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleDelete = (postId) => {
    setDeletePostId(postId)
    onDeleteOpen()
  }

  const confirmDelete = async () => {
    try {
      await deletePost(deletePostId).unwrap()
      toast({
        title: 'Success',
        description: 'Post deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onDeleteClose()
      setDeletePostId(null)
      refetchAfterDeleteRef.current = true
      setPage(1)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete post',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  // FIX 6: Stable navigate callback so TrendingCard memo isn't busted every render
  const handleNavigateToPost = useCallback((post) => {
    navigate('/user/feed', { state: { initialPost: post } })
  }, [navigate])

  if (isLoading) {
    return (
      <>
        <Box w="100%" maxW={{ base: '100%', md: '420px' }} mx="auto" bg={pageBgColor} px={0}>
          <Box px={4} py={4}>
            {[1, 2, 3].map((i) => (
              <Box key={i} mb={4}>
                <PostCardSkeleton />
              </Box>
            ))}
          </Box>
        </Box>
      </>
    )
  }

  return (
    <>
      <Box
        w="100%"
        maxW={{ base: '100%', md: '420px' }}
        mx="auto"
        bg={pageBgColor}
        px={0}
        position="relative"
      >
        {/* Top-left corner gradient */}
        <Box
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="280px"
          bg={topLeftGradient}
          pointerEvents="none"
          zIndex={0}
        />
        {/* Bottom-left soft gradient */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          w="100%"
          h="320px"
          bg={bottomLeftGradient}
          pointerEvents="none"
          zIndex={0}
        />
        {/* Bottom-right soft gradient */}
        <Box
          position="absolute"
          bottom={0}
          right={0}
          w="100%"
          h="320px"
          bg={bottomRightGradient}
          pointerEvents="none"
          zIndex={0}
        />
        {/* Header */}
        <Box
          className="home-header"
          position="absolute"
          left={0}
          right={0}
          top={-2}
          display="flex"
          px={{ base: 4, md: 4 }}
          pt={{ base: 'calc(env(safe-area-inset-top, 12px) + 12px)', md: 'calc(env(safe-area-inset-top, 16px) + 6px)' }}
          pb={{ base: 2, md: 2 }}
          align="center"
          bg="transparent"
          zIndex={10}
        >
          <HStack flex={1} justify="space-between" align="center" spacing={3}>
            <Button
              leftIcon={<ImageIcon size={16} />}
              onClick={openCreatePostModal}
              size={{ base: "sm", md: "sm" }}
              bg="transparent"
              color={createPostButtonColor}
              border="1px solid"
              borderColor={blurBorder}
              _hover={{ 
                borderColor: blurHoverBorder,
                transform: 'scale(1.05)'
              }}
              _active={{ 
                transform: 'scale(0.98)'
              }}
              borderRadius="4px"
              fontWeight={600}
              h={{ base: "32px", md: "32px" }}
              fontSize={{ base: "sm", md: "sm" }}
              transition="all 0.2s ease"
            >
              Create Post
            </Button>
            <HomepageNotificationBell inline />
          </HStack>
        </Box>

        {/* Spacer */}
        <Box
          pt={{ base: 'calc(env(safe-area-inset-top, 12px) + 12px)', md: 'calc(env(safe-area-inset-top, 16px) + 6px)' }}
          pb={{ base: 2, md: 2 }}
          h={{ base: '32px', md: '32px' }}
        />

        {/* Story Tray */}
        <Box
          bg="transparent"
          position="relative"
          overflow="hidden"
          mt={3}
          pl={{ base: 2, md: 2 }}
          pr={{ base: 4, md: 4 }}
        >
          <Box position="relative" zIndex={1}>
            <StoryTray onOpenMyStories={onOpenMyStoriesModal} />
          </Box>
        </Box>

        <Box
          w="100%"
          h="1px"
          bg={pageBorderColor}
          flexShrink={0}
          mb={2}
        />

        <VStack spacing={0} align="stretch" px={0}>

          {/* Hotstar-style Trending Sections */}
          {trendingSections.length > 0 && (
            <Box w="100%" pb={4} borderBottom="1px solid" borderColor={pageBorderColor}>
              {trendingSections.map((section) => (
                <Box key={section.id} mt={section.id === 'today' ? 0 : 4} className="perf-content-visibility-auto">
                  <HStack spacing={2} px={4} mb={2} align="center">
                    {section.icon && <section.icon size={14} style={{ color: textColor }} />}
                    <Text as="span" fontSize="12px" fontWeight="700" color={textColor}>
                      {section.title}
                    </Text>
                  </HStack>
                  <TrendingCarouselScroll onScroll={handleTrendingScroll}>
                    {/* FIX 7: Use HStack inside a single wrapper; avoid re-creating inline on each render */}
                    <HStack spacing={3} px={4} align="stretch" w="max-content" minW="100%">
                      {section.posts.map((post, index) => (
                        <TrendingCard
                          key={post._id}
                          post={post}
                          index={index}
                          onNavigate={handleNavigateToPost}
                          cardBg={cardBg}
                          borderColor={borderColor}
                          textColor={textColor}
                        />
                      ))}
                      {isTrendingFetching && (
                        <Center
                          flexShrink={0}
                          w="116px"
                          minW="116px"
                          h="155px"
                          bg={cardBg}
                          borderRadius="12px"
                          border="1px solid"
                          borderColor={borderColor}
                        >
                          <Spinner size="md" color={textColor} />
                        </Center>
                      )}
                    </HStack>
                  </TrendingCarouselScroll>
                </Box>
              ))}
            </Box>
          )}

          {posts.length === 0 ? (
            <Box 
              p={8} 
              textAlign="center"
              bg={pageBgColor}
              minH="400px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <EmptyState
                title="No posts yet"
                description="Start following friends or create your first post to see content here"
              />
            </Box>
          ) : (
            posts.map((post, index) => {
              const postBorderRadius = post.borderRadius || '24px';
              const isFullWidth = postBorderRadius === '0' || postBorderRadius === '0px' || postBorderRadius === 0;
              return (
                <Box
                  key={`post-${post._id}`}
                  mb={index < posts.length - 1 ? -1 : 0}
                  pt={2}
                  pb={2}
                  px={0}
                  position="relative"
                  className="perf-content-visibility-auto"
                  style={{ transform: 'translateZ(0)' }}
                  overflow="visible"
                >
                  <PostCard
                    post={post}
                    onLike={handleLike}
                    playingVideoPostId={playingVideoPostId}
                    onVideoPlayingChange={(postId, isPlaying) => setPlayingVideoPostId(isPlaying ? postId : null)}
                    onVideoOpenInFeed={(p) => navigate('/user/feed', { state: { initialPost: p } })}
                    onOpenCommentSheet={handleOpenCommentSheet}
                    onOpenEditPostModal={openEditPostModal}
                    onDeletePost={handleDelete}
                    expandedLinksPostId={expandedLinksPostId}
                    onToggleLinksExpand={(postId, isExpanded) => setExpandedLinksPostId(isExpanded ? null : postId)}
                    soundPostId={soundPostId}
                    onRequestSoundSound={handleRequestSound}
                    onRequestMuteSound={handleRequestMute}
                    ambientGlowEnabled={ambientGlowEnabled}
                    ambientGlowOpacity={ambientGlowOpacity}
                    glowBlendMode={glowBlendMode}
                  />
                </Box>
              );
            })
          )}

          {/* Infinite scroll sentinel */}
          {posts.length > 0 && (
            <Box ref={loadMoreSentinelRef} minH="1px" py={2} w="100%">
              {hasMore && isFetching && page > 1 && (
                <Center py={4}>
                  <Spinner size="sm" colorScheme="brand" />
                </Center>
              )}
            </Box>
          )}
          
          <CreatePostModal
            isOpen={isCreatePostOpen}
            onClose={closeCreatePostModal}
            onSuccess={() => { setPage(1); refetch(); }}
          />
          <EditPostModal
            isOpen={isEditPostOpen}
            post={postToEdit}
            onClose={closeEditPostModal}
            onSuccess={() => { setPage(1); refetch(); }}
          />
          <CommentBottomSheet
            isOpen={!!commentSheetPostId}
            onClose={() => setCommentSheetPostId(null)}
            post={posts.find((p) => p._id === commentSheetPostId) || null}
            onCommentAdded={() => refetch()}
          />

          <BlurModal
            isOpen={isMyStoriesModalOpen}
            onClose={onCloseMyStoriesModal}
            size="full"
            isCentered={false}
            contentProps={{
              m: { base: 3, sm: 4, md: 6 },
              mx: { base: 3, sm: 4, md: 'auto' },
              w: { base: 'auto', md: '100%' },
              maxW: { base: 'none', md: '400px' },
              h: { base: 'calc(100vh - 24px)', sm: 'calc(100vh - 32px)', md: 'min(90vh, 711px)' },
              maxH: { base: 'calc(100vh - 24px)', sm: 'calc(100vh - 32px)', md: 'min(90vh, 711px)' },
              borderRadius: { base: '20px', md: '24px' },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <ModalCloseButton
              top={{ base: 3, md: 4 }}
              right={{ base: 3, md: 4 }}
              zIndex={15}
              color="white"
              borderRadius="full"
              _hover={{ bg: 'whiteAlpha.200' }}
            />
            <ModalBody p={0} flex={1} minH={0} overflow="hidden" display="flex" flexDirection="column">
              <MyStoriesContent isInsideModal />
            </ModalBody>
          </BlurModal>

          {trendingPostForDetails && (
            <PostDetailsModal
              isOpen={!!trendingPostForDetails}
              onClose={() => setTrendingPostForDetails(null)}
              post={trendingPostForDetails}
              isLiked={trendingPostForDetails.likes?.some((like) => {
                const likeId = typeof like === 'object' ? like._id : like
                return likeId?.toString() === currentUserId?.toString()
              }) || false}
              liveViewCount={trendingPostForDetails.viewCount || 0}
              totalViewCount={trendingPostForDetails.viewCount || 0}
              songName={trendingPostForDetails.sound?.title || 'Background Music'}
              hasMusic={(() => {
                const p = trendingPostForDetails
                const hasUploadedSong = Boolean(p?.song)
                const hasYouTubeSound = Boolean(p?.sound && p.sound.source === 'youtube')
                const hasVideoWithOwnAudio = Boolean(p?.video)
                let hasMusic = hasUploadedSong || hasYouTubeSound
                if (hasVideoWithOwnAudio && !hasUploadedSong && !hasYouTubeSound) hasMusic = false
                return hasMusic
              })()}
              hasYouTubeSound={!!(trendingPostForDetails.sound?.source === 'youtube')}
              postSound={trendingPostForDetails.sound}
              formatViewCount={(count) => {
                if (count < 1000) return count.toString()
                if (count < 1000000) return (count / 1000).toFixed(1) + 'K'
                return (count / 1000000).toFixed(1) + 'M'
              }}
            />
          )}

          <AlertDialog
            isOpen={isDeleteOpen}
            leastDestructiveRef={cancelDeleteRef}
            onClose={onDeleteClose}
            motionPreset="none"
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Delete Post
                </AlertDialogHeader>
                <AlertDialogBody>
                  Are you sure you want to delete this post? This action cannot be undone.
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelDeleteRef} onClick={onDeleteClose}>
                    Cancel
                  </Button>
                  <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>

        </VStack>
      </Box>
    </>
  )
}

export default UserHome