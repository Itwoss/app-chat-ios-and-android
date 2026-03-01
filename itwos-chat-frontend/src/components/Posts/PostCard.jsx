import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Image,
  useColorModeValue,
  useDisclosure,
  useToast,
  IconButton,
  Center,
} from '@chakra-ui/react'
import {
  Heart,
  MessageCircle,
  Trash2,
  Pencil,
  Music,
  Bookmark,
  BookmarkCheck,
  Share2,
  Eye,
  X,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  UserPlus,
  UserCheck,
  UserX,
  Link as LinkIcon,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import {
  useIncrementPostViewMutation,
  useSavePostMutation,
  useUnsavePostMutation,
  useGetSavedPostsQuery,
  useGetCurrentUserQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowingQuery,
} from '../../store/api/userApi'
import UserAvatarWithBanner from '../User/UserAvatarWithBanner'
import AvatarZoomPreview from '../User/AvatarZoomPreview'
import VideoPostPlayer from './VideoPostPlayer'
import DoubleTapLike from './DoubleTapLike'
import PostDetailsModal from './PostDetailsModal'
import { useLongPress } from '../../hooks/useLongPress'
import { useAudioManager } from '../../contexts/AudioManagerContext'
import usePostViewTracker from '../../hooks/usePostViewTracker'
import useInstagramAutoplay from '../../hooks/useInstagramAutoplay'
import useInstagramImageAutoplay from '../../hooks/useInstagramImageAutoplay'
import { useSongDetails } from '../../contexts/SongDetailsContext'
import { useAmbientGlow } from '../../hooks/useAmbientGlow'
import { useHorizontalScrollAxisLock } from '../../hooks/useHorizontalScrollAxisLock'
import { getUserInfo } from '../../utils/auth'
import { getRelativeTime } from '../../utils/dateFormat'
import { buildYouTubeEmbedUrl } from '../../utils/youtubeEmbed'
import { RippleButton } from '../ui/RippleButton'
import { throttleRAF } from '../../utils/performance'

const THRESHOLD = 8

const POST_TITLE_LINK_FONT = {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '15px',
  lineHeight: '21px',
  fontWeight: 400,
  letterSpacing: 'normal',
  color: '#F3F5F7',
}

function getShortLinkDisplayUrl(url) {
  if (!url || typeof url !== 'string') return url || ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    return u.hostname.replace(/^www\./i, '')
  } catch {
    return trimmed
  }
}

const ScrollablePostTitle = memo(function ScrollablePostTitle({ title, pageBgColor, textPrimaryColor }) {
  const scrollRef = useRef(null)
  useHorizontalScrollAxisLock(scrollRef)
  const [shadow, setShadow] = useState({ left: false, right: false })
  const [isExpanded, setIsExpanded] = useState(false)

  const updateShadow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const showLeft = scrollLeft > THRESHOLD
    const showRight = scrollWidth - clientWidth - scrollLeft > THRESHOLD
    setShadow((prev) => {
      if (prev.left === showLeft && prev.right === showRight) return prev
      return { left: showLeft, right: showRight }
    })
  }, [])

  const onScroll = useCallback(throttleRAF(updateShadow), [updateShadow])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const rafId = requestAnimationFrame(updateShadow)
    const ro = new ResizeObserver(updateShadow)
    ro.observe(el)
    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
    }
  }, [updateShadow])

  const toggleExpanded = useCallback((e) => {
    e.stopPropagation()
    setIsExpanded((prev) => !prev)
  }, [])

  if (isExpanded) {
    return (
      <Box position="relative" overflow="hidden" px={2} py={1} w="100%" minW={0}>
        <HStack align="flex-start" spacing={2} w="100%">
          <Text
            as="span"
            display="block"
            flex={1}
            whiteSpace="normal"
            wordBreak="break-word"
            cursor="pointer"
            onClick={toggleExpanded}
            sx={POST_TITLE_LINK_FONT}
          >
            {title}
          </Text>
          <Box
            as="button"
            type="button"
            aria-label="Show less"
            flexShrink={0}
            onClick={toggleExpanded}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={1}
            borderRadius="md"
            color="#F3F5F7"
            _hover={{ bg: 'blackAlpha.8' }}
            _active={{ bg: 'blackAlpha.12' }}
          >
            <ChevronUp size={14} strokeWidth={2} />
          </Box>
        </HStack>
      </Box>
    )
  }

  return (
    <Box position="relative" overflow="hidden" px={2} py={1} w="100%" minW={0}>
      <Box
        ref={scrollRef}
        onScroll={onScroll}
        onClick={() => setIsExpanded(true)}
        overflowX="auto"
        overflowY="hidden"
        w="100%"
        minW={0}
        cursor="pointer"
        data-slide-nav-aware
        sx={{
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          overscrollBehaviorX: 'contain',
        }}
      >
        <Text
          as="span"
          display="inline-block"
          whiteSpace="nowrap"
          minW="max-content"
          sx={POST_TITLE_LINK_FONT}
        >
          {title}
        </Text>
      </Box>
      {shadow.left && (
        <Box
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          w="20px"
          flexShrink={0}
          pointerEvents="none"
          bg={`linear-gradient(to right, ${pageBgColor}, transparent)`}
          zIndex={1}
        />
      )}
      {shadow.right && (
        <Box
          position="absolute"
          right={0}
          top={0}
          bottom={0}
          w="20px"
          flexShrink={0}
          pointerEvents="none"
          bg={`linear-gradient(to left, ${pageBgColor}, transparent)`}
          zIndex={1}
        />
      )}
    </Box>
  )
})
export default function PostCard({
    post,
    onLike,
    playingVideoPostId,
    onVideoPlayingChange,
    onVideoOpenInFeed,
    onOpenCommentSheet,
    onOpenEditPostModal,
    onDeletePost,
    expandedLinksPostId,
    onToggleLinksExpand,
    ambientGlowEnabled = true,
    ambientGlowOpacity = 0.75,
    glowBlendMode = 'normal',
    soundPostId,
    onRequestSoundSound,
    onRequestMuteSound,
  }) {
    const userInfo = getUserInfo()
    const { data: userData } = useGetCurrentUserQuery()
    const pageBgColorCard = useColorModeValue('white', '#000000')
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [showThumbnails, setShowThumbnails] = useState(false)
    const [thumbnailAnimations, setThumbnailAnimations] = useState({})
    const [isHoveringDots, setIsHoveringDots] = useState(false)
    const autoSlideRef = useRef(null)
    const thumbnailTimeoutRef = useRef(null)
    const dotsContainerRef = useRef(null)
    // Swipe/drag state
    const [touchStartX, setTouchStartX] = useState(null)
    const [touchStartY, setTouchStartY] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState(0)
    const imageContainerRef = useRef(null)
    const [isSaved, setIsSaved] = useState(false)
    const [songName, setSongName] = useState('Background Music')
    const [isSongExpanded, setIsSongExpanded] = useState(false)
    const [optimisticFollowing, setOptimisticFollowing] = useState(null)
    const [followButtonHover, setFollowButtonHover] = useState(false)
    
    const location = useLocation()
    const params = useParams()
    const postRef = useRef(null)
    const likeButtonRef = useRef(null)
    const youtubeIframeRef = useRef(null)
    const imageMediaRef = useRef(null)
    const imageGlowCanvasRef = useRef(null)
    const videoRef = useRef(null)
    const videoGlowCanvasRef = useRef(null)
    const youtubeThumbnailRef = useRef(null)
    const [incrementView] = useIncrementPostViewMutation()
    const [savePost] = useSavePostMutation()
    const [unsavePost] = useUnsavePostMutation()
    const { data: savedPostsData } = useGetSavedPostsQuery({}, { refetchOnMountOrArgChange: false })
    const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure()
    const toast = useToast()
    const [saveMessageAtPoint, setSaveMessageAtPoint] = useState(null)
    const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false)
    const avatarLongPress = useLongPress(() => setAvatarPreviewOpen(true))
    
    // Check if we're on a feed page (where audio should be allowed)
    const FEED_PATHS = ['/user/home', '/user/feed']
    const isOnFeedPage = FEED_PATHS.some(path => location.pathname === path || location.pathname.startsWith(path + '/'))
    
    const hasUploadedSong = Boolean(post.song)
    const hasYouTubeSound = Boolean(
      post.sound && post.sound.source === 'youtube'
    )
    const hasVideoWithOwnAudio = Boolean(post.video)
    // Image posts with music: show song + mute button and allow tap-to-play (no autoplay on scroll)
    const isImagePost = !post.video
    let hasMusic = hasUploadedSong || hasYouTubeSound
    if (hasVideoWithOwnAudio && !hasUploadedSong && !hasYouTubeSound) {
      hasMusic = false
    }
    const isImageWithMusic = hasUploadedSong && !hasYouTubeSound
    const hasMusicForMedia = hasMusic

    const {
      activePostId,
      playPost,
      stopPost,
      toggleSessionSound,
      setSessionSoundOn,
      youtubeIframesRef,
      setPostVisibility,
      clearPostVisibility,
      getTopVisiblePostId,
      getTopVisibleVisibility,
      getTopVisibleVisibilitySecond,
      registerYouTubeIframe,
      registerImageMusic,
      unregisterImageMusic,
      getTopVisibleImageMusic,
      visibilityVersion,
      sessionSoundOn,
    } = useAudioManager()

    const _visibilityVersion = visibilityVersion
    const isActiveYouTubePost = hasYouTubeSound && (
      String(activePostId) === String(post._id) || String(getTopVisiblePostId() ?? '') === String(post._id)
    )

    // Session unmute: only the top-visible post with music has sound (same for video and image)
    const isThisPostWithSound = soundPostId !== null && String(getTopVisiblePostId() ?? '') === String(post._id)

    const playMusicWithOpts = useCallback((id, opts) => {
      if (hasYouTubeSound) playPost(id, { isYouTube: true, iframeRef: youtubeIframeRef })
      else if (post.song) playPost(id, { audioUrl: post.song })
    }, [hasYouTubeSound, playPost, post.song])

    const stopMusicForPost = useCallback((id) => {
      stopPost(id)
    }, [stopPost])

    // When session is unmuted, only the top-visible post with music plays; others stop (video + image same rule)
    useEffect(() => {
      if (!hasMusicForMedia) return
      const topId = getTopVisiblePostId()
      const shouldPlay = soundPostId !== null && String(topId ?? '') === String(post._id)
      if (shouldPlay) {
        setSessionSoundOn(true)
        if (hasYouTubeSound) playPost(post._id, { isYouTube: true, iframeRef: youtubeIframeRef })
        else if (hasUploadedSong && post.song) playPost(post._id, { audioUrl: post.song })
      } else {
        stopPost(post._id)
      }
    }, [hasMusicForMedia, soundPostId, visibilityVersion, post._id, hasYouTubeSound, hasUploadedSong, post.song, playPost, stopPost, setSessionSoundOn])

    // Image posts never autoplay audio — only attach hook for video posts with YouTube sound
    const autoplayRef = useInstagramAutoplay({
      postId: post._id,
      hasMusic: !!hasYouTubeSound,
      sessionSoundOn,
      play: useCallback((id) => {
        if (hasYouTubeSound) playPost(id, { isYouTube: true, iframeRef: youtubeIframeRef })
        else if (post.song) playPost(id, { audioUrl: post.song })
      }, [hasYouTubeSound, playPost, post.song]),
      stop: stopMusicForPost,
      setVisibility: setPostVisibility,
      clearVisibility: clearPostVisibility,
      getTopVisiblePostId,
      getTopVisibleVisibility,
      getTopVisibleVisibilitySecond,
    })

    const imageAutoplay = useInstagramImageAutoplay({
      postId: post._id,
      hasMusic: isImageWithMusic,
      playMusic: playMusicWithOpts,
      stopMusic: stopMusicForPost,
      setSessionSoundOn,
      sessionSoundOn,
      getTopVisibleImageMusic,
      getTopVisiblePostId,
      getTopVisibleVisibility,
      getTopVisibleVisibilitySecond,
      visibilityVersion,
      setVisibility: setPostVisibility,
      clearVisibility: clearPostVisibility,
      registerImageMusic,
      unregisterImageMusic,
    })

    // Ambient glow behind media (image or video). For YouTube sound posts, use song thumbnail as glow source.
    const glowMediaRef = (post.sound?.source === 'youtube' && post.sound?.thumbnail) ? youtubeThumbnailRef : imageMediaRef
    useAmbientGlow(glowMediaRef, imageGlowCanvasRef, { type: 'image', enabled: ambientGlowEnabled, glowOpacity: ambientGlowOpacity })
    useAmbientGlow(videoRef, videoGlowCanvasRef, { type: 'video', isPlaying: playingVideoPostId === post._id, enabled: ambientGlowEnabled, glowOpacity: ambientGlowOpacity })

    const userId = userInfo?.id || userData?.data?._id || userData?.data?.id
    // Resolve author id: backend may send author as object { _id, id } or as raw id string
    const authorId = (() => {
      const a = post.author
      if (a == null) return post.authorId ?? null
      if (typeof a === 'object') return a._id ?? a.id ?? null
      return a
    })()
    const isAuthor = Boolean(
      authorId != null && userId != null && String(authorId) === String(userId)
    )
    
    // Check if we're on the author's profile page (Instagram-style: delete only on own profile)
    const isOnProfilePage = location.pathname.startsWith('/user/profile')
    const profileUserId = params?.userId || (location.pathname === '/user/profile' ? userId : null)
    const isOnOwnProfile = isOnProfilePage && (
      !profileUserId || // If no userId param, it's own profile
      profileUserId?.toString() === userId?.toString() || // If userId matches current user
      profileUserId?.toString() === authorId?.toString() // If viewing author's profile
    )
    const showDeleteButton = isAuthor && isOnOwnProfile // Only show delete on author's own profile page

    // Follow button: only show for other users' posts when current user is known
    const [followUser] = useFollowUserMutation()
    const [unfollowUser] = useUnfollowUserMutation()
    const { data: followingData, refetch: refetchFollowing } = useGetFollowingQuery(undefined, { skip: !authorId })
    const followingList = useMemo(() => {
      if (!followingData) return []
      if (Array.isArray(followingData)) return followingData
      if (Array.isArray(followingData?.data)) return followingData.data
      if (Array.isArray(followingData?.following)) return followingData.following
      if (Array.isArray(followingData?.data?.following)) return followingData.data.following
      return []
    }, [followingData])
    const isFollowingAuthor = followingList.some(
      (u) => (u?._id ?? u)?.toString() === authorId?.toString()
    )
    const displayFollowing = optimisticFollowing !== null ? optimisticFollowing : isFollowingAuthor
    const handleFollowClick = async (e) => {
      e.stopPropagation()
      if (!authorId) return
      const wasFollowing = displayFollowing
      setOptimisticFollowing(!wasFollowing)
      try {
        if (wasFollowing) {
          await unfollowUser(authorId).unwrap()
        } else {
          await followUser(authorId).unwrap()
        }
        await refetchFollowing()
      } catch (err) {
        console.error('Follow/unfollow failed:', err)
        setOptimisticFollowing(wasFollowing)
        return
      }
      setOptimisticFollowing(null)
    }

    const isLiked = post.likes?.some(like => {
      const likeId = typeof like === 'object' ? like._id : like
      return likeId?.toString() === userId?.toString()
    }) || false

    // Post view tracking hook
    const {
      postElementRef,
      liveViewCount,
      totalViewCount,
      setTotalViewCount
    } = usePostViewTracker(post._id, true, 2, 24)
    
    // Update total view count from post data (only when post.viewCount changes and differs)
    useEffect(() => {
      if (post.viewCount !== undefined && post.viewCount !== totalViewCount) {
        setTotalViewCount(post.viewCount)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [post.viewCount]) // Only depend on post.viewCount to prevent unnecessary re-renders
    
    // Format number for display (e.g., 1234 -> 1.2K)
    const formatViewCount = (count) => {
      if (count < 1000) return count.toString()
      if (count < 1000000) return (count / 1000).toFixed(1) + 'K'
      return (count / 1000000).toFixed(1) + 'M'
    }
    
    // Set song name
    useEffect(() => {
      if (hasYouTubeSound && post.sound?.title) {
        setSongName(post.sound.title)
      } else if (hasUploadedSong && post.song) {
        try {
          const urlParts = post.song.split('/')
          const fileName = urlParts[urlParts.length - 1]
          const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '')
          setSongName(nameWithoutExt || 'Background Music')
        } catch {
          setSongName('Background Music')
        }
      } else {
        setSongName('Background Music')
      }
    }, [post.song, post.sound, hasYouTubeSound, hasUploadedSong])
    
    // Reset image index when post changes
    useEffect(() => {
      setCurrentImageIndex(0)
    }, [post._id])

    // Check if post is saved
    useEffect(() => {
      if (savedPostsData?.data?.savedPosts) {
        const saved = savedPostsData.data.savedPosts.some(
          sp => sp.post?._id === post._id || sp.post?._id?.toString() === post._id?.toString()
        )
        setIsSaved(saved)
      }
    }, [savedPostsData, post._id])

    const safePostMessage = useCallback((iframe, message) => {
      if (!iframe || !iframe.contentWindow) return false
      try {
        iframe.contentWindow.postMessage(message, '*')
        return true
      } catch (e) {
        return false
      }
    }, [])

    const handleLikeClick = () => {
      if (onLike) {
        onLike(post._id)
      }
    }

    const handleSaveClick = async (e) => {
      e.stopPropagation()
      try {
        if (isSaved) {
          await unsavePost(post._id).unwrap()
          setIsSaved(false)
          setSaveMessageAtPoint({ message: 'Post unsaved' })
        } else {
          await savePost({ postId: post._id }).unwrap()
          setIsSaved(true)
          setSaveMessageAtPoint({ message: 'Post saved' })
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error?.data?.message || 'Failed to save/unsave post',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    }

    // Clear save message at point after 2s
    useEffect(() => {
      if (!saveMessageAtPoint) return
      const t = setTimeout(() => setSaveMessageAtPoint(null), 2000)
      return () => clearTimeout(t)
    }, [saveMessageAtPoint])

    const handleShare = (e) => {
      e.stopPropagation()
      const url = `${window.location.origin}/user/post/${post._id}`
      if (navigator.share) {
        navigator.share({ title: post.title || 'Post', url }).catch(() => {})
      } else {
        navigator.clipboard?.writeText(url).then(() => {
          toast({ title: 'Link copied', status: 'success', duration: 2000, isClosable: true })
        })
      }
    }

    const handleMusicToggle = useCallback(() => {
      if (!hasMusicForMedia) return
      const topId = getTopVisiblePostId()
      const thisHasSound = soundPostId !== null && String(topId ?? '') === String(post._id)
      if (thisHasSound) {
        onRequestMuteSound?.()
        setSessionSoundOn(false)
        stopPost(post._id)
        return
      }
      onRequestSoundSound?.(post._id)
      setSessionSoundOn(true)
      if (String(topId ?? '') === String(post._id)) {
        if (hasYouTubeSound) playPost(post._id, { isYouTube: true, iframeRef: youtubeIframeRef })
        else if (isImageWithMusic && imageAutoplay) imageAutoplay.handlePlay()
        else if (hasUploadedSong && post.song) playPost(post._id, { audioUrl: post.song })
      }
    }, [post._id, hasMusicForMedia, hasYouTubeSound, hasUploadedSong, isImageWithMusic, imageAutoplay, post.song, soundPostId, getTopVisiblePostId, onRequestSoundSound, onRequestMuteSound, setSessionSoundOn, playPost, stopPost])

    // Get post images - memoized to prevent re-renders
    const postImages = post.images && post.images.length > 0 ? post.images : []
    const hasMultipleImages = postImages.length > 1
    const postImage = useMemo(() => {
      return postImages.length > 0 ? postImages[currentImageIndex] : null
    }, [postImages, currentImageIndex])

    // Don't auto-show thumbnails - only show when dot is clicked

    // Auto-slide thumbnails (Amazon-style) - only if more than 4 images
    useEffect(() => {
      if (!hasMultipleImages || postImages.length <= 4) {
        if (autoSlideRef.current) {
          clearInterval(autoSlideRef.current)
          autoSlideRef.current = null
        }
        return
      }

      // Auto-slide thumbnails every 3 seconds
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => {
          const nextIndex = (prev + 1) % postImages.length
          return nextIndex
        })
      }, 3000)

      autoSlideRef.current = interval

      return () => {
        if (interval) clearInterval(interval)
      }
    }, [hasMultipleImages, postImages.length])

    // Pause auto-slide on hover/interaction
    const handleImageInteraction = () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current)
        autoSlideRef.current = null
      }
    }

    const handleImageInteractionEnd = () => {
      if (hasMultipleImages && postImages.length > 4) {
        const interval = setInterval(() => {
          setCurrentImageIndex((prev) => {
            const nextIndex = (prev + 1) % postImages.length
            return nextIndex
          })
        }, 3000)
        autoSlideRef.current = interval
      }
    }

    // Show thumbnails with sequential animation
    const showThumbnailsWithAnimation = () => {
      setShowThumbnails(true)
      
      // Reset animations
      setThumbnailAnimations({})
      
      // Animate thumbnails one by one in sequence
      postImages.forEach((_, thumbIndex) => {
        setTimeout(() => {
          setThumbnailAnimations((prev) => ({
            ...prev,
            [thumbIndex]: true
          }))
        }, thumbIndex * 50) // 50ms delay between each thumbnail
      })
    }

    // Hide thumbnails after delay
    const scheduleHideThumbnails = (delay = 2500) => {
      if (thumbnailTimeoutRef.current) {
        clearTimeout(thumbnailTimeoutRef.current)
      }
      thumbnailTimeoutRef.current = setTimeout(() => {
        if (!isHoveringDots) {
          setShowThumbnails(false)
          setThumbnailAnimations({})
        }
      }, delay)
    }

    // Show thumbnails when dot is clicked
    const handleDotClick = (index) => {
      handleImageInteraction()
      setCurrentImageIndex(index)
      showThumbnailsWithAnimation()
      scheduleHideThumbnails(2500)
    }

    // Handle hover on dots area (desktop)
    const handleDotsHover = () => {
      setIsHoveringDots(true)
      showThumbnailsWithAnimation()
      if (thumbnailTimeoutRef.current) {
        clearTimeout(thumbnailTimeoutRef.current)
      }
    }

    // Handle hover on individual dot (desktop)
    const handleDotHover = () => {
      setIsHoveringDots(true)
      if (!showThumbnails) {
        showThumbnailsWithAnimation()
      }
      if (thumbnailTimeoutRef.current) {
        clearTimeout(thumbnailTimeoutRef.current)
      }
    }

    // Handle mouse leave from dots area (desktop)
    const handleDotsLeave = () => {
      setIsHoveringDots(false)
      // Hide immediately when leaving the dots area
      if (thumbnailTimeoutRef.current) {
        clearTimeout(thumbnailTimeoutRef.current)
      }
      setShowThumbnails(false)
      setThumbnailAnimations({})
    }

    // Handle touch on dots area (mobile/tablet)
    const handleDotsTouch = () => {
      showThumbnailsWithAnimation()
      scheduleHideThumbnails(3000)
    }

    // Swipe/Drag handlers for image navigation
    const handleTouchStart = (e) => {
      if (!hasMultipleImages) return
      const touch = e.touches[0]
      setTouchStartX(touch.clientX)
      setTouchStartY(touch.clientY)
      setIsDragging(true)
      handleImageInteraction() // Pause auto-slide
    }

    const handleTouchMove = (e) => {
      if (!hasMultipleImages || touchStartX === null) return
      const touch = e.touches[0]
      const diffX = touch.clientX - touchStartX
      const diffY = touch.clientY - touchStartY
      
      // Only handle horizontal swipes (ignore if vertical movement is greater)
      if (Math.abs(diffX) > Math.abs(diffY)) {
        e.preventDefault()
        // Constrain drag offset to prevent over-scrolling
        const maxDrag = imageContainerRef.current?.offsetWidth || 300
        const constrainedDrag = Math.max(-maxDrag * 0.3, Math.min(maxDrag * 0.3, diffX))
        setDragOffset(constrainedDrag)
      }
    }

    const handleTouchEnd = (e) => {
      if (!hasMultipleImages || touchStartX === null) return
      const touch = e.changedTouches[0]
      const diffX = touch.clientX - touchStartX
      const threshold = 50 // Minimum swipe distance
      
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          // Swipe right - go to previous image
          setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : postImages.length - 1))
        } else {
          // Swipe left - go to next image
          setCurrentImageIndex((prev) => (prev < postImages.length - 1 ? prev + 1 : 0))
        }
      }
      
      setTouchStartX(null)
      setTouchStartY(null)
      setIsDragging(false)
      setDragOffset(0)
      handleImageInteractionEnd() // Resume auto-slide if needed
    }

    // Mouse drag handlers for desktop
    const handleMouseDown = (e) => {
      if (!hasMultipleImages) return
      // Don't start drag if clicking on interactive elements
      if (
        e.target.closest('[aria-label="Post details"]') || 
        e.target.closest('[aria-label="Delete post"]') ||
        e.target.closest('[data-three-dot-menu]') ||
        e.target.closest('[data-dot-indicator]')
      ) {
        return
      }
      setTouchStartX(e.clientX)
      setTouchStartY(e.clientY)
      setIsDragging(true)
      handleImageInteraction() // Pause auto-slide
    }

    const handleMouseMove = useCallback((e) => {
      if (!hasMultipleImages || !isDragging || touchStartX === null) return
      const diffX = e.clientX - touchStartX
      const diffY = e.clientY - touchStartY
      
      // Only handle horizontal drags (ignore if vertical movement is greater)
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Constrain drag offset to prevent over-scrolling
        const maxDrag = imageContainerRef.current?.offsetWidth || 300
        const constrainedDrag = Math.max(-maxDrag * 0.3, Math.min(maxDrag * 0.3, diffX))
        setDragOffset(constrainedDrag)
      }
    }, [hasMultipleImages, isDragging, touchStartX])

    const handleMouseUp = useCallback((e) => {
      if (!hasMultipleImages || touchStartX === null) return
      const diffX = e.clientX - touchStartX
      const threshold = 50 // Minimum drag distance
      
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          // Drag right - go to previous image
          setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : postImages.length - 1))
        } else {
          // Drag left - go to next image
          setCurrentImageIndex((prev) => (prev < postImages.length - 1 ? prev + 1 : 0))
        }
      }
      
      setTouchStartX(null)
      setTouchStartY(null)
      setIsDragging(false)
      setDragOffset(0)
      handleImageInteractionEnd() // Resume auto-slide if needed
    }, [hasMultipleImages, touchStartX, postImages.length, handleImageInteractionEnd])

    // Cleanup mouse events on unmount
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [isDragging, handleMouseMove, handleMouseUp])
    
    // Get song display for story-style pill (same as story)
    const songTitle = post.sound?.title || (post.song ? 'Background Music' : null)
    const songArtist = post.sound?.artist
    const songThumbnail = post.sound?.thumbnail

    // Glass gradient overlay
    const glassBg = "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.75) 100%)"

    // Extract all useColorModeValue calls to top level (hooks must be called unconditionally)
    const headerBgGradient = useColorModeValue(
      'linear(to-r, gray.100, gray.50)',
      'linear(to-r, gray.900, gray.800)'
    )
    const headerBorderColor = useColorModeValue('gray.200', 'gray.700')
    const headerHoverShadow = useColorModeValue('0 4px 12px rgba(0,0,0,0.15)', '0 4px 12px rgba(0,0,0,0.3)')
    const avatarBorderColor = useColorModeValue('gray.300', 'gray.600')
    const textPrimaryColor = useColorModeValue('#262626', '#fafafa')
    const textSecondaryColor = useColorModeValue('#8e8e8e', '#a8a8a8')
    const actionButtonHoverBg = useColorModeValue('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.1)')
    const actionButtonIconColor = useColorModeValue('#262626', '#fafafa')

    // Get custom border radius from post
    const postBorderRadius = post.borderRadius || '24px';
    // Check if borderRadius is 0 (full width, edge-to-edge like Instagram)
    const isFullWidth = postBorderRadius === '0' || postBorderRadius === '0px' || postBorderRadius === 0;

    const videoRatio = post.video ? (post.videoRatio || '4:5') : null
    const videoAspectRatioValue = videoRatio ? videoRatio.replace(':', ' /') : null

    return (
      <Box 
        mb={isFullWidth ? 0 : 0} 
        w="100%" 
        position="relative"
        px={isFullWidth ? 0 : 0}
        mx={isFullWidth ? 0 : 0}
        maxW={isFullWidth ? '100%' : undefined}
      >
        {/* Home: always show full card (header + video + footer). Click video → open in feed full screen. */}
        <>
        {/* Content Layer */}
        <Box position="relative" zIndex={1} overflow="visible">
        {/* USER HEADER - Post banner: full width on all screens */}
        <Box
          mb={0.5}
          borderRadius="full"
          display="flex"
          alignItems="center"
          transition="all 0.2s"
          _hover={{
            boxShadow: headerHoverShadow,
          }}
          overflow="hidden"
          bg={useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.1)')}
          border="1px solid"
          borderColor={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
          w="100%"
        >
          <HStack flex={1} minW={0} spacing={0} align="center">
            <Box {...avatarLongPress} flex={1} minW={0} cursor="pointer">
              <UserAvatarWithBanner
                userId={post.author?._id || post.author?.id}
                name={post.author?.name || "Unknown"}
                src={post.author?.profileImage}
                subscription={post.author?.subscription}
                fontSize="xs"
                fontWeight={600}
                avatarSize="sm"
                px={2}
                py={1.5}
                bg="transparent"
                border="none"
              >
                {post.createdAt && (
                  <Text
                    fontSize="2xs"
                    color={textSecondaryColor}
                    mt={0.5}
                  >
                    {getRelativeTime(post.createdAt)}
                  </Text>
                )}
              </UserAvatarWithBanner>
            </Box>
            {/* Follow: only show when viewing someone else's post (never on own post) */}
            {userId != null && !isAuthor && authorId && (
              <Button
                size="sm"
                leftIcon={displayFollowing ? (followButtonHover ? <UserX size={14} /> : <UserCheck size={14} />) : <UserPlus size={14} />}
                variant="outline"
                colorScheme="gray"
                flexShrink={0}
                ml="auto"
                mr={2}
                fontSize="xs"
                fontWeight={600}
                borderRadius="full"
                borderColor={displayFollowing && followButtonHover ? useColorModeValue('red.300', 'red.400') : useColorModeValue('blackAlpha.200', 'whiteAlpha.300')}
                color={displayFollowing && followButtonHover ? 'red.500' : textPrimaryColor}
                _hover={{ bg: useColorModeValue('blackAlpha.100', 'whiteAlpha.100') }}
                onMouseEnter={() => setFollowButtonHover(true)}
                onMouseLeave={() => setFollowButtonHover(false)}
                onClick={handleFollowClick}
              >
                {displayFollowing ? (followButtonHover ? 'Unfollow' : 'Following') : 'Follow'}
              </Button>
            )}
          </HStack>
        </Box>
        <AvatarZoomPreview
          isOpen={avatarPreviewOpen}
          onClose={() => setAvatarPreviewOpen(false)}
          name={post.author?.name || 'Unknown'}
          src={post.author?.profileImage}
        />

        {/* Post title – below user profile row, above media */}
        {post.title && (
          <Box mb={post.links?.length ? 1 : 2} mt={-0.5} px={0}>
            <ScrollablePostTitle
              title={post.title}
              pageBgColor={pageBgColorCard}
              textPrimaryColor={textPrimaryColor}
            />
          </Box>
        )}

        {/* Links – show 2 by default; down/up icon on same row as 2nd link (or last when expanded) */}
        {(() => {
          const rawLinks = post.links
          const linksArray = Array.isArray(rawLinks) ? rawLinks : (typeof rawLinks === 'string' ? (() => { try { return JSON.parse(rawLinks) } catch { return [] } })() : [])
          const validLinks = (linksArray || []).filter((l) => l && (String(l.name || '').trim() || String(l.url || '').trim()))
          if (validLinks.length === 0) return null
          const postId = post._id || post.id
          const isExpanded = expandedLinksPostId === postId
          const visibleLinks = validLinks.length > 2 && !isExpanded ? validLinks.slice(0, 2) : validLinks
          const showMoreOption = validLinks.length > 2
          return (
          <Box mb={2} px={2} onClick={(e) => e.stopPropagation()} role="presentation">
            <VStack align="stretch" spacing={1} w="100%">
              {visibleLinks.map((link, idx) => (
                <HStack key={idx} align="center" spacing={2} w="100%" sx={{ ...POST_TITLE_LINK_FONT, fontSize: '15px' }}>
                  <Box as="span" color="gray.300" display="inline-flex" alignItems="center" aria-hidden><LinkIcon size={14} /></Box>
                  <Text as="span" color="gray.300" noOfLines={1} fontSize="15px">{link.name || 'Link'}</Text>
                  <Text as="span" color="gray.300" fontSize="15px" flexShrink={0}>→</Text>
                  <Text
                    as="a"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="blue.400"
                    noOfLines={1}
                    fontSize="15px"
                    flex={1}
                    minW={0}
                    textDecoration="none"
                    _hover={{ textDecoration: 'none', color: 'blue.300' }}
                    _active={{ textDecoration: 'none' }}
                    sx={{
                      fontFamily: POST_TITLE_LINK_FONT.fontFamily,
                      fontSize: '15px',
                      lineHeight: POST_TITLE_LINK_FONT.lineHeight,
                      fontWeight: POST_TITLE_LINK_FONT.fontWeight,
                      letterSpacing: POST_TITLE_LINK_FONT.letterSpacing,
                    }}
                  >
                    {getShortLinkDisplayUrl(link.url)}
                  </Text>
                  {showMoreOption && idx === visibleLinks.length - 1 && (
                    <Box
                      as="button"
                      type="button"
                      flexShrink={0}
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      aria-label={isExpanded ? 'Show less links' : 'Show more links'}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onToggleLinksExpand?.(postId, isExpanded)
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      color="gray.400"
                      _hover={{ color: 'gray.300' }}
                      p={0.5}
                      sx={{ cursor: 'pointer', touchAction: 'manipulation' }}
                    >
                      {isExpanded ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                    </Box>
                  )}
                </HStack>
              ))}
            </VStack>
          </Box>
          )
        })()}

        {/* POST CARD - Image Container */}
        {(() => {
          const imageMetadata = post.imageEditMetadata?.[currentImageIndex];
          const ratio = post.video ? (post.videoRatio || '4:5') : (imageMetadata?.ratio || '4:5');
          const aspectRatioValue = ratio.replace(':', ' /');
          return (
            <Box
              borderRadius={isFullWidth ? '0' : postBorderRadius}
              overflow="visible"
              position="relative"
              bg="black"
              w="100%"
              aspectRatio={aspectRatioValue}
              ref={(node) => {
                postRef.current = node
                if (hasYouTubeSound && autoplayRef) autoplayRef(node)
                if (isImageWithMusic && imageAutoplay?.ref) imageAutoplay.ref(node)
                if (postElementRef) postElementRef.current = node
              }}
              cursor={hasMusicForMedia ? 'pointer' : 'default'}
              boxShadow="0 4px 12px rgba(0,0,0,0.15)"
              style={{
                borderRadius: isFullWidth ? '0' : postBorderRadius,
              }}
            >
              <DoubleTapLike
                allowGlowOverflow
                likeCounterRef={likeButtonRef}
                onLike={() => onLike(post._id)}
                onSingleTap={
                  post.video && onVideoOpenInFeed
                    ? () => onVideoOpenInFeed(post)
                    : handleMusicToggle
                }
              >
              {/* VIDEO or BACKGROUND IMAGE */}
              {post.video && (
                <>
                  {/* Edge-to-edge media; glow extends outside for soft YouTube-style halo */}
                  <Box position="relative" w="100%" h="100%" bg="black">
                    {ambientGlowEnabled && (
                    <Box position="absolute" inset={0} zIndex={0} overflow="visible" pointerEvents="none">
                      <canvas
                        ref={videoGlowCanvasRef}
                        className="ambient-glow-canvas"
                        style={{
                          position: 'absolute',
                          left: -24,
                          top: -24,
                          width: 'calc(100% + 48px)',
                          height: 'calc(100% + 48px)',
                          zIndex: -1,
                          filter: 'blur(60px) saturate(1.6)',
                          opacity: 0,
                          transition: 'opacity 0.6s ease',
                          pointerEvents: 'none',
                          mixBlendMode: glowBlendMode,
                        }}
                      />
                    </Box>
                    )}
                    <Box position="relative" w="100%" h="100%" zIndex={1}>
                      <VideoPostPlayer
                        videoUrl={post.video}
                        thumbnailUrl={post.videoThumbnail}
                        videoRatio={post.videoRatio || '4:5'}
                        trimStart={post.videoTrimStart}
                        trimEnd={post.videoTrimEnd}
                        onPlayingChange={(playing) => onVideoPlayingChange(post._id, playing)}
                        onVideoRef={(el) => { videoRef.current = el }}
                        autoplayWhenVisible={true}
                        onUserRequestPlay={onVideoOpenInFeed ? () => onVideoOpenInFeed(post) : undefined}
                        soundOn={soundPostId !== null && String(getTopVisiblePostId() ?? '') === String(post._id)}
                        onRequestSound={onRequestSoundSound ? () => onRequestSoundSound(post._id) : undefined}
                        onRequestMute={onRequestMuteSound}
                        showMuteControl={hasMusic}
                      />
                    </Box>
                  </Box>
                  {/* YouTube/Instagram-style bottom gradient + blur strip over media */}
                  <Box
                    position="absolute"
                    left={0}
                    right={0}
                    bottom={0}
                    h="35%"
                    zIndex={1}
                    pointerEvents="none"
                    background="linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.5) 70%, rgba(0,0,0,0.85) 100%)"
                  />
                </>
              )}
              {!post.video && postImage && (
                <Box position="relative" w="100%" h="100%" bg="black">
                  {ambientGlowEnabled && (
                  <Box position="absolute" inset={0} zIndex={0} overflow="visible" pointerEvents="none">
                    <canvas
                      ref={imageGlowCanvasRef}
                      className="ambient-glow-canvas"
                      style={{
                        position: 'absolute',
                        left: -24,
                        top: -24,
                        width: 'calc(100% + 48px)',
                        height: 'calc(100% + 48px)',
                        zIndex: -1,
                        filter: 'blur(60px) saturate(1.6)',
                        opacity: 0,
                        transition: 'opacity 0.6s ease',
                        pointerEvents: 'none',
                        mixBlendMode: glowBlendMode,
                      }}
                    />
                  </Box>
                  )}
                  {/* Hidden img for YouTube thumbnail–driven glow when post has YouTube sound */}
                  {post.sound?.source === 'youtube' && post.sound?.thumbnail && (
                    <img
                      ref={youtubeThumbnailRef}
                      src={post.sound.thumbnail}
                      alt=""
                      style={{
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        opacity: 0,
                        pointerEvents: 'none',
                        zIndex: -2,
                      }}
                    />
                  )}
                <Box
                  ref={imageContainerRef}
                  position="relative"
                  w="100%"
                  h="100%"
                  zIndex={1}
                  overflow="hidden"
                  onMouseEnter={handleImageInteraction}
                  onMouseLeave={handleImageInteractionEnd}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  sx={{
                    touchAction: hasMultipleImages ? 'pan-x pan-y pinch-zoom' : 'pan-y pinch-zoom',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                >
                  {postImage && (
                  <>
                  {/* Main Image Display with swipe support */}
                  {/* Music + Mute are together in bottom-left (see Music block below) */}
                <Image
                    ref={imageMediaRef}
                    key={`post-image-${post._id}-${currentImageIndex}`}
                  src={postImage}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  position="absolute"
                  top={0}
                  left={0}
                  zIndex={0}
                    loading="lazy"
                    decoding="async"
                    sx={{
                      imageRendering: 'auto',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: isDragging ? `translateX(${dragOffset}px)` : 'translateX(0)',
                      transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-in-out',
                      willChange: 'auto',
                    }}
                  />

                  {/* Image Navigation - Only show if multiple images */}
                  {hasMultipleImages && postImage && (
                    <>
                      {/* Expanded hover area around dots for easier triggering */}
                      <Box
                        position="absolute"
                        bottom="8px"
                        left="50%"
                        transform="translateX(-50%)"
                        zIndex={8}
                        w="250px"
                        h="40px"
                        onMouseEnter={handleDotsHover}
                        onMouseLeave={handleDotsLeave}
                        pointerEvents="auto"
                      />
                      {/* Image Dots Indicator (Instagram-style) - Bottom Center */}
                      <HStack
                        ref={dotsContainerRef}
                        position="absolute"
                        bottom="8px"
                        left="50%"
                        transform="translateX(-50%)"
                        zIndex={9}
                        spacing={1}
                        bg="rgba(0, 0, 0, 0.35)"
                        px={2}
                        py={1}
                        borderRadius="full"
                        cursor="pointer"
                        onMouseEnter={handleDotsHover}
                        onMouseLeave={handleDotsLeave}
                        onTouchStart={handleDotsTouch}
                      >
                        {postImages.map((_, index) => (
                          <Box
                            key={index}
                            w={currentImageIndex === index ? '6px' : '4px'}
                            h={currentImageIndex === index ? '6px' : '4px'}
                            borderRadius="full"
                            bg={currentImageIndex === index ? 'white' : 'rgba(255, 255, 255, 0.5)'}
                            cursor="pointer"
                            transition="all 0.2s"
                            onMouseEnter={handleDotHover}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDotClick(index)
                            }}
                            _hover={{
                              bg: 'white',
                              transform: 'scale(1.2)',
                            }}
                          />
                        ))}
                      </HStack>
                    </>
                  )}
                  </>
                  )}
                </Box>
                </Box>
              )}

              </DoubleTapLike>

              {/* Thumbnail Arc (Protractor-style) - Bottom of Image */}
              {hasMultipleImages && postImages.length > 1 && (
                <Box
                  position="absolute"
                  bottom={0}
                  left="50%"
                  transform="translateX(-50%)"
                  zIndex={8}
                  w="100%"
                  h={showThumbnails ? "140px" : "0px"}
                  overflow="visible"
                  pointerEvents={showThumbnails ? "auto" : "none"}
                  transition="height 0.3s ease-out"
                >
                  {/* Protractor Arc Container */}
                  <Box
                    position="relative"
                    w="100%"
                    h="100%"
                    display="flex"
                    justifyContent="center"
                    alignItems="flex-end"
                    pb={4}
                  >
                    {postImages.map((image, index) => {
                      // Calculate angle for 180-degree arc (semicircle)
                      const totalImages = postImages.length
                      const angleStep = totalImages > 1 ? 180 / (totalImages - 1) : 0
                      const angle = -90 + (index * angleStep)
                      const radius = 90
                      const radian = (angle * Math.PI) / 180
                      const x = Math.cos(radian) * radius
                      const y = Math.sin(radian) * radius
                      
                      const isAnimated = thumbnailAnimations[index] || false
                      
                      return (
                        <Box
                          key={index}
                          position="absolute"
                          left={`calc(50% + ${x}px)`}
                          bottom={`${-y + 20}px`}
                          transform={`translate(-50%, 0) scale(${isAnimated ? 1 : 0}) rotate(${angle}deg)`}
                          transformOrigin="center bottom"
                          w="60px"
                          h="60px"
                          borderRadius="8px"
                          overflow="hidden"
                          border="2px solid"
                          borderColor={currentImageIndex === index ? 'white' : 'rgba(255, 255, 255, 0.3)'}
                          cursor="pointer"
                          opacity={isAnimated ? (currentImageIndex === index ? 1 : 0.8) : 0}
                          transition="all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
                          bg="rgba(0, 0, 0, 0.5)"
                          sx={{
                            boxShadow: isAnimated ? '0 4px 12px rgba(0, 0, 0, 0.4)' : 'none',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleImageInteraction()
                            setCurrentImageIndex(index)
                            setShowThumbnails(true)
                            setThumbnailAnimations({})
                            postImages.forEach((_, thumbIndex) => {
                              setTimeout(() => {
                                setThumbnailAnimations((prev) => ({
                                  ...prev,
                                  [thumbIndex]: true
                                }))
                              }, thumbIndex * 50)
                            })
                            if (thumbnailTimeoutRef.current) {
                              clearTimeout(thumbnailTimeoutRef.current)
                            }
                            thumbnailTimeoutRef.current = setTimeout(() => {
                              setShowThumbnails(false)
                              setThumbnailAnimations({})
                            }, 2500)
                          }}
                          _hover={{
                            opacity: 1,
                            transform: `translate(-50%, 0) scale(1.15) rotate(${angle}deg)`,
                            borderColor: 'white',
                            zIndex: 10,
                          }}
                        >
                          <Box
                            transform={`rotate(${-angle}deg)`}
                            transformOrigin="center"
                            w="100%"
                            h="100%"
                          >
                            <Image
                              src={image}
                              w="100%"
                              h="100%"
                              objectFit="cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </Box>
                        </Box>
                      )
                    })}
                    
                    {/* Drawing Arc Line Effect */}
                    {showThumbnails && (
                      <Box
                        position="absolute"
                        left="50%"
                        bottom="30px"
                        transform="translateX(-50%)"
                        w={`${90 * 2}px`}
                        h="90px"
                        borderTop="2px solid rgba(255, 255, 255, 0.4)"
                        borderLeft="2px solid rgba(255, 255, 255, 0.2)"
                        borderRight="2px solid rgba(255, 255, 255, 0.2)"
                        borderRadius="90px 90px 0 0"
                        opacity={0}
                        pointerEvents="none"
                        sx={{
                          animation: 'drawArc 0.8s ease-out forwards',
                          '@keyframes drawArc': {
                            '0%': {
                              opacity: 0,
                              transform: 'translateX(-50%) scaleX(0)',
                            },
                            '100%': {
                              opacity: 0.6,
                              transform: 'translateX(-50%) scaleX(1)',
                            },
                          },
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}
              {!post.video && !postImage && (
                <Box
                  w="100%"
                  h="100%"
                  bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  position="absolute"
                  top={0}
                  left={0}
                  zIndex={0}
                />
              )}

              {/* Edit & Delete - bottom right of post (author only) */}
              {showDeleteButton && (
                <Box
                  position="absolute"
                  bottom="8px"
                  right={2}
                  zIndex={10}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <HStack spacing={1}>
                    <IconButton
                      icon={<Pencil size={16} />}
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenEditPostModal(post)
                      }}
                      aria-label="Edit post"
                      bg="rgba(255, 255, 255, 0.25)"
                      color="white"
                      borderRadius="full"
                      minW="36px"
                      h="36px"
                      _hover={{
                        bg: 'rgba(255, 255, 255, 0.4)',
                        transform: 'scale(1.1)',
                      }}
                      transition="all 0.2s"
                    />
                    <IconButton
                      icon={<Trash2 size={16} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeletePost(post._id)
                      }}
                      aria-label="Delete post"
                      bg="rgba(220, 38, 38, 0.6)"
                      color="white"
                      borderRadius="full"
                      minW="36px"
                      h="36px"
                      _hover={{
                        bg: 'rgba(220, 38, 38, 0.85)',
                        transform: 'scale(1.1)',
                      }}
                      transition="all 0.2s"
                    />
                  </HStack>
                </Box>
              )}

              {/* YouTube Sound Player – only load iframe when this post is active to reduce canceled requests */}
          {hasYouTubeSound && post.sound.preview_url && isActiveYouTubePost && (
            <Box
              position="absolute"
              width="2px"
              height="2px"
              overflow="hidden"
              opacity={0.01}
              pointerEvents="none"
              zIndex={-1}
              top={0}
              left={0}
            >
              <Box
                ref={youtubeIframeRef}
                as="iframe"
                width="2"
                height="2"
                src={buildYouTubeEmbedUrl(post.sound.preview_url, { start: post.sound.startTime || 0, end: post.sound.endTime ?? undefined })}
                allow="autoplay; encrypted-media; microphone; camera"
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ border: 'none' }}
                key={`${post._id}-${post.sound.video_id}`}
                onLoad={() => {
                  if (youtubeIframeRef.current) {
                    registerYouTubeIframe(post._id, youtubeIframeRef.current)
                    if (String(activePostId) === String(post._id) || String(getTopVisiblePostId() ?? '') === String(post._id)) {
                      playPost(post._id, { isYouTube: true, iframeRef: youtubeIframeRef })
                    }
                  }
                }}
              />
            </Box>
          )}

        {/* Music + Mute – bottom-left: music icon and mute/unmute (image and video posts with music) */}
        {hasMusicForMedia && (() => {
          const isPlayingWithSound = isThisPostWithSound
          return (
            <Box
              position="absolute"
              bottom={4}
              left={4}
              zIndex={2}
              maxW="calc(100% - 100px)"
              onClick={(e) => e.stopPropagation()}
              data-music-control
            >
              <HStack spacing={2} align="center">
                {isSongExpanded ? (
                  <HStack
                    spacing={1.5}
                    bg="rgba(255, 255, 255, 0.18)"
                    borderRadius="full"
                    py={1}
                    pl={1}
                    pr={1.5}
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.25)"
                    sx={{
                      animation: 'homeSongExpand 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                      '@keyframes homeSongExpand': {
                        '0%': { opacity: 0, transform: 'scale(0.85)' },
                        '100%': { opacity: 1, transform: 'scale(1)' },
                      },
                    }}
                  >
                    <Box
                      as="button"
                      type="button"
                      flexShrink={0}
                      cursor={hasYouTubeSound && post.sound ? 'pointer' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (hasYouTubeSound && post.sound) openSongDetails(post.sound)
                      }}
                      _hover={hasYouTubeSound && post.sound ? { opacity: 0.9 } : undefined}
                      sx={{ touchAction: 'manipulation' }}
                    >
                      {hasYouTubeSound && songThumbnail ? (
                        <Image
                          src={songThumbnail}
                          alt=""
                          boxSize="6"
                          borderRadius="full"
                          objectFit="cover"
                          pointerEvents="none"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <Center boxSize="6" borderRadius="full" bg="whiteAlpha.300" pointerEvents="none">
                          <Music size={12} color="white" />
                        </Center>
                      )}
                    </Box>
                    <Box
                      flex={1}
                      minW={0}
                      maxW="100px"
                      overflow="hidden"
                      as="button"
                      type="button"
                      textAlign="left"
                      cursor={hasYouTubeSound && post.sound ? 'pointer' : 'default'}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (hasYouTubeSound && post.sound) openSongDetails(post.sound)
                      }}
                      _hover={hasYouTubeSound && post.sound ? { opacity: 0.9 } : undefined}
                      sx={{ touchAction: 'manipulation' }}
                    >
                      <Text fontSize="2xs" fontWeight="600" color="white" noOfLines={1}>
                        {hasYouTubeSound && songArtist ? `${songTitle} · ${songArtist}` : songTitle}
                      </Text>
                    </Box>
                    {!post.video && (
                      <IconButton
                        aria-label={isPlayingWithSound ? 'Mute' : 'Unmute'}
                        icon={isPlayingWithSound ? <Volume2 size={14} /> : <VolumeX size={14} />}
                        size="xs"
                        variant="ghost"
                        color="white"
                        opacity={0.9}
                        _hover={{ opacity: 1, bg: 'whiteAlpha.200' }}
                        borderRadius="full"
                        minW={6}
                        h={6}
                        onClick={(e) => { e.stopPropagation(); handleMusicToggle() }}
                      />
                    )}
                    <IconButton
                      aria-label="Close song"
                      icon={<X size={12} />}
                      size="xs"
                      variant="ghost"
                      color="white"
                      opacity={0.9}
                      _hover={{ opacity: 1, bg: 'whiteAlpha.200' }}
                      borderRadius="full"
                      minW={6}
                      h={6}
                      onClick={(e) => { e.stopPropagation(); setIsSongExpanded(false) }}
                    />
                  </HStack>
                ) : (
                  <>
                    <Center
                      as="button"
                      boxSize="7"
                      borderRadius="full"
                      bg="rgba(255, 255, 255, 0.2)"
                      border="1px solid"
                      borderColor="rgba(255, 255, 255, 0.28)"
                      _hover={{ bg: 'rgba(255, 255, 255, 0.3)' }}
                      _active={{ transform: 'scale(0.95)' }}
                      onClick={(e) => { e.stopPropagation(); setIsSongExpanded(true) }}
                      title={songTitle ? (hasYouTubeSound && songArtist ? `${songTitle} · ${songArtist}` : songTitle) : 'Music'}
                    >
                      <Music size={14} color="white" />
                    </Center>
                    {!post.video && (
                      <IconButton
                        aria-label={isPlayingWithSound ? 'Mute' : 'Unmute'}
                        icon={isPlayingWithSound ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        size="sm"
                        borderRadius="full"
                        bg="rgba(255, 255, 255, 0.2)"
                        border="1px solid"
                        borderColor="rgba(255, 255, 255, 0.28)"
                        color="white"
                        _hover={{ bg: 'rgba(255, 255, 255, 0.3)' }}
                        _active={{ transform: 'scale(0.95)' }}
                        onClick={(e) => { e.stopPropagation(); handleMusicToggle() }}
                      />
                    )}
                  </>
                )}
              </HStack>
            </Box>
          )
        })()}

            </Box>
          );
        })()}

        {/* Gap between post content and footer - matching header gap */}
        {!isFullWidth && <Box mb={2} w="100%" />}

        {/* ACTION BUTTONS - reel-style blur tablet strip */}
        <Box
          px={2}
          py={1.5}
          mt={0}
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          gap={1}
          flexWrap="nowrap"
          w="100%"
          minW={0}
          bg="rgba(0, 0, 0, 0.35)"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.15)"
          overflow="hidden"
          sx={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Like – pill: icon + label + count */}
          <RippleButton
            as={HStack}
            ref={likeButtonRef}
            spacing={0}
            gap={0}
            onClick={(e) => {
              e.stopPropagation()
              handleLikeClick()
            }}
            px={2}
            py={1}
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.08)"
            transition="background 0.2s"
            _hover={{ bg: 'rgba(255, 255, 255, 0.15)' }}
            rippleColor="rgba(255, 255, 255, 0.4)"
            duration="600ms"
            flexShrink={0}
            _active={{}}
          >
            <Heart
              size={14}
              fill={isLiked ? '#ed4956' : 'none'}
              color={isLiked ? '#ed4956' : 'white'}
              strokeWidth={1.5}
            />
            <Text fontSize="2xs" fontWeight="500" color="white" minW="2ch" textAlign="right" display="block" ml={-2}>
              {post.likes?.length || 0}
            </Text>
            <Text fontSize="2xs" fontWeight="500" color="white" ml={-0.5}>
              Like
            </Text>
          </RippleButton>

          {/* Comment – pill: icon + count + label */}
          <RippleButton
            as={HStack}
            spacing={1}
            onClick={(e) => {
              e.stopPropagation()
              stopPost(post._id)
              onOpenCommentSheet?.(post)
            }}
            px={2}
            py={1}
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.08)"
            transition="background 0.2s"
            _hover={{ bg: 'rgba(255, 255, 255, 0.15)' }}
            rippleColor="rgba(255, 255, 255, 0.4)"
            duration="600ms"
            flexShrink={0}
            _active={{}}
          >
            <MessageCircle size={14} color="white" strokeWidth={1.5} />
            <Text fontSize="2xs" fontWeight="500" color="white" minW="2ch" textAlign="right" display="block" ml={-2}>
              {post.comments?.length ?? 0}
            </Text>
            <Text fontSize="2xs" fontWeight="500" color="white" ml={-0.5}>
              Comment
            </Text>
          </RippleButton>

          {/* View – pill: icon + label + count */}
          <HStack
            spacing={1}
            px={2}
            py={1}
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.08)"
            flexShrink={0}
          >
            <Eye size={14} color="white" strokeWidth={1.5} />
            <Text fontSize="2xs" fontWeight="500" color="white">
              {formatViewCount(post.viewCount ?? 0)}
            </Text>
            <Text fontSize="2xs" fontWeight="500" color="white">
              Views
            </Text>
          </HStack>

          {/* Share – pill */}
          <RippleButton
            as={HStack}
            spacing={1}
            onClick={handleShare}
            px={2}
            py={1}
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.08)"
            transition="background 0.2s"
            _hover={{ bg: 'rgba(255, 255, 255, 0.15)' }}
            rippleColor="rgba(255, 255, 255, 0.4)"
            duration="600ms"
            flexShrink={0}
            _active={{}}
          >
            <Share2 size={14} color="white" strokeWidth={1.5} />
            <Text fontSize="2xs" fontWeight="500" color="white">
              Share
            </Text>
          </RippleButton>

          {/* Save – circular */}
          <RippleButton
            as={Box}
            role="button"
            aria-label={isSaved ? 'Unsave' : 'Save'}
            size="sm"
            w="32px"
            h="32px"
            minW="32px"
            minH="32px"
            borderRadius="full"
            bg="rgba(255, 255, 255, 0.08)"
            color="white"
            _hover={{ bg: 'rgba(255, 255, 255, 0.15)' }}
            _active={{}}
            flexShrink={0}
            onClick={(e) => {
              e.stopPropagation()
              handleSaveClick(e)
            }}
            rippleColor="rgba(255, 255, 255, 0.4)"
            duration="600ms"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
          >
            {isSaved ? (
              <BookmarkCheck size={14} color="white" strokeWidth={1.5} fill="white" />
            ) : (
              <Bookmark size={14} color="white" strokeWidth={1.5} />
            )}
          </RippleButton>

        </Box>
        
        {/* Post Details Modal */}
        <PostDetailsModal
          isOpen={isDetailsOpen}
          onClose={onDetailsClose}
          post={post}
          isLiked={isLiked}
          liveViewCount={liveViewCount}
          totalViewCount={totalViewCount || post.viewCount || 0}
          songName={songName}
          hasMusic={hasMusicForMedia}
          hasYouTubeSound={hasYouTubeSound}
          postSound={post.sound}
          formatViewCount={formatViewCount}
        />
        {saveMessageAtPoint && (() => {
          const thumbUrl = post.videoThumbnail || (post.images && post.images[0] && (typeof post.images[0] === 'string' ? post.images[0] : post.images[0].url || post.images[0].imageUrl))
          const { message } = saveMessageAtPoint
          return (
            <Box
              position="fixed"
              left="0"
              right="0"
              top="0"
              display="flex"
              justifyContent="center"
              zIndex={9999}
              pointerEvents="none"
              px={4}
              sx={{
                paddingTop: 'max(env(safe-area-inset-top), 16px)',
                animation: 'saveToastIn 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards',
              }}
            >
              <HStack
                spacing={2}
                px={4}
                py={2.5}
                borderRadius="50px"
                border="1px solid rgba(255, 255, 255, 0.25)"
                boxShadow="0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05) inset"
                sx={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                }}
              >
                {thumbUrl && (
                  <Image
                    src={thumbUrl}
                    alt=""
                    w="8"
                    h="8"
                    minW="32px"
                    minH="32px"
                    borderRadius="full"
                    objectFit="cover"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <Text fontWeight="500" color="white" fontSize="sm" whiteSpace="nowrap">
                  {message}
                </Text>
              </HStack>
            </Box>
          )
        })()}
        </Box>
        </>
      </Box>
    )
  }
