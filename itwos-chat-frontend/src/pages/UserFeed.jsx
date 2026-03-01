import {
  useColorModeValue,
  Box,
  Spinner,
  Center,
  Text,
  HStack,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { throttleMs } from '../utils/performance'
import {
  useGetFeedQuery,
  useToggleLikeMutation,
  useAddCommentMutation,
  useDeletePostMutation,
  useGetCurrentUserQuery,
  useSavePostMutation,
  useUnsavePostMutation,
  useGetSavedPostsQuery,
} from '../store/api/userApi'
import ReelCard from '../components/reels/ReelCard'
import CommentBottomSheet from '../components/Posts/CommentBottomSheet'
import { getUserInfo } from '../utils/auth'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { ReelSkeleton } from '../components/Skeletons'

const UserFeed = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const initialPostFromState = location.state?.initialPost ?? null
  const bgColor = useColorModeValue('#000000', '#000000')
  const dialogBg = useColorModeValue('white', 'gray.800')
  const userInfo = getUserInfo()
  const { data: userData } = useGetCurrentUserQuery()

  const [page, setPage] = useState(1)
  const [allPosts, setAllPosts] = useState([])
  const [activeReelIndex, setActiveReelIndex] = useState(0)
  const [soundIndex, setSoundIndex] = useState(0) // which reel has sound (0 = first unmuted; -1 = all muted)
  const [commentPostId, setCommentPostId] = useState(null)
  const [postToDelete, setPostToDelete] = useState(null) // show confirm before delete
  const [heartAnimationPostId, setHeartAnimationPostId] = useState(null) // trigger heart burst on reel when liked (double-tap or like button)
  const [feedMode, setFeedMode] = useState('video') // 'image' | 'video'
  const [viewportKey, setViewportKey] = useState(0) // force reflow when orientation/resize so video container updates
  const scrollRef = useRef(null)
  const postRefsRef = useRef([])
  const activeReelStableRef = useRef(null)
  const activeReelStableTimerRef = useRef(null)
  const autoLoadVideoPagesRef = useRef(0)
  const MIN_VIDEOS_TO_STOP_AUTOLOAD = 5
  const MAX_AUTOLOAD_PAGES = 5

  const { data, isLoading, isFetching, refetch, isError: feedError } = useGetFeedQuery({
    page,
    limit: 20,
  })
  const [savePost] = useSavePostMutation()
  const [unsavePost] = useUnsavePostMutation()
  const { data: savedPostsData, refetch: refetchSaved } = useGetSavedPostsQuery({}, { refetchOnMountOrArgChange: false })
  const savedPostIds = useMemo(() => {
    const list = savedPostsData?.data?.savedPosts ?? []
    return new Set(list.map((sp) => sp.post?._id ?? sp.post).filter(Boolean))
  }, [savedPostsData])
  const toast = useToast()

  // Throttled resize/orientation for low-end devices (fixes video stuck in portrait)
  useEffect(() => {
    const handler = throttleMs(() => setViewportKey((k) => k + 1), 150)
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler)
    }
  }, [])

  const pagination = data?.pagination
  const hasMore = pagination && page < pagination.pages

  const basePosts = allPosts.length ? allPosts : (data?.data || [])
  const withInitial = initialPostFromState
    ? [initialPostFromState, ...basePosts.filter((p) => p._id !== initialPostFromState._id)]
    : basePosts

  const isVideoPost = (p) => !!p?.video
  const isImagePost = (p) => !p?.video && ((p?.images?.length > 0) || (p?.imageUrls?.length > 0))
  const posts = useMemo(() => {
    if (feedMode === 'video') return withInitial.filter(isVideoPost)
    return withInitial.filter(isImagePost)
  }, [feedMode, withInitial])

  const mergePostWithExisting = useCallback((existing, incoming) => {
    if (!existing) return incoming
    return {
      ...incoming,
      song: incoming.song ?? existing.song,
      sound: incoming.sound ?? existing.sound,
    }
  }, [])

  // Merge new posts into feed (de-duplicate by _id; preserve song/sound when feed omits them)
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

  // Infinite scroll: when last reel is mostly visible, load more (no sentinel = no extra height = no bounce)
  useEffect(() => {
    const root = scrollRef.current
    if (!root || !hasMore || isFetching || posts.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            Number(entry.target.dataset.reelIndex) === posts.length - 1
          ) {
            setPage((p) => p + 1)
          }
        })
      },
      { root, threshold: 0.8 }
    )

    const lastEl = postRefsRef.current[posts.length - 1]
    if (lastEl) observer.observe(lastEl)
    return () => observer.disconnect()
  }, [posts.length, hasMore, isFetching])

  useEffect(() => {
    if (feedMode !== 'video') autoLoadVideoPagesRef.current = 0
  }, [feedMode])

  // Video mode: keep loading more pages until we have enough reels (Instagram-like feed)
  useEffect(() => {
    if (feedMode !== 'video' || !hasMore || isFetching) return
    if (posts.length >= MIN_VIDEOS_TO_STOP_AUTOLOAD) return
    if (autoLoadVideoPagesRef.current >= MAX_AUTOLOAD_PAGES) return
    autoLoadVideoPagesRef.current += 1
    setPage((p) => p + 1)
  }, [feedMode, hasMore, isFetching, posts.length])

  // Reel in view: only update active/sound after index is stable (stops bounce from IO flapping during scroll)
  const postCount = posts.length
  useEffect(() => {
    const refs = postRefsRef.current
    const root = scrollRef.current
    const n = postCount
    if (n === 0 || !root) return

    const STABLE_MS = 80

    const visible = new Map()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.dataset.reelIndex)
          if (Number.isFinite(index)) {
            visible.set(index, entry.intersectionRatio)
          }
        })
        let best = -1
        let bestRatio = 0.75
        visible.forEach((ratio, index) => {
          if (ratio > bestRatio) {
            bestRatio = ratio
            best = index
          }
        })
        if (best < 0) return

        if (activeReelStableTimerRef.current) clearTimeout(activeReelStableTimerRef.current)
        if (activeReelStableRef.current === best) {
          setActiveReelIndex(best)
          setSoundIndex(best)
          return
        }
        activeReelStableRef.current = best
        activeReelStableTimerRef.current = setTimeout(() => {
          activeReelStableTimerRef.current = null
          setActiveReelIndex(best)
          setSoundIndex(best)
        }, STABLE_MS)
      },
      { root, rootMargin: '0px', threshold: [0.5, 0.75, 1] }
    )

    for (let i = 0; i < n; i++) {
      const el = refs[i]
      if (el) observer.observe(el)
    }
    return () => {
      if (activeReelStableTimerRef.current) clearTimeout(activeReelStableTimerRef.current)
      observer.disconnect()
    }
  }, [postCount])

  const [toggleLike] = useToggleLikeMutation()
  const [addComment] = useAddCommentMutation()
  const [deletePost] = useDeletePostMutation()
  const lastLikedPostIdRef = useRef(null)
  const lastLikedTimeRef = useRef(0)
  const LIKE_COOLDOWN_MS = 2000

  const handleLike = async (postId, options) => {
    const showBurst = options?.showBurst !== false
    const now = Date.now()
    const samePost = lastLikedPostIdRef.current === postId
    const withinCooldown = now - lastLikedTimeRef.current < LIKE_COOLDOWN_MS
    if (samePost && withinCooldown) {
      if (showBurst) {
        setHeartAnimationPostId(postId)
        setTimeout(() => setHeartAnimationPostId(null), 1200)
      }
      return
    }
    lastLikedPostIdRef.current = postId
    lastLikedTimeRef.current = now
    if (showBurst) {
      setHeartAnimationPostId(postId)
      setTimeout(() => setHeartAnimationPostId(null), 1200)
    }
    const currentUserId = userInfo?.id || userData?.data?._id
    setAllPosts((prev) =>
      prev.map((p) => {
        if (p._id !== postId) return p
        const liked = p.likes?.some((l) => (l._id || l) === currentUserId)
        return {
          ...p,
          likes: liked
            ? (p.likes || []).filter((l) => (l._id || l) !== currentUserId)
            : [...(p.likes || []), { _id: currentUserId }],
        }
      })
    )
    try {
      await toggleLike(postId).unwrap()
    } catch (err) {
      refetch()
      console.error(err)
    }
  }

  const handleDeleteClick = (postId) => {
    setPostToDelete(postId)
  }

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return
    const id = postToDelete
    setPostToDelete(null)
    setAllPosts((prev) => prev.filter((p) => p._id !== id))
    try {
      await deletePost(id).unwrap()
      toast({ title: 'Post deleted', status: 'success', duration: 2000 })
    } catch (err) {
      refetch()
      toast({ title: err?.data?.message || 'Failed to delete', status: 'error', duration: 2000 })
    }
  }

  const handleAddComment = async (postId, content) => {
    setAllPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? { ...p, comments: [...(p.comments || []), { _id: 'temp', content, author: userInfo }] }
          : p
      )
    )
    try {
      await addComment({ postId, content }).unwrap()
    } catch (err) {
      refetch()
      console.error(err)
    }
  }

  const handleSave = async (postId) => {
    const saved = savedPostIds.has(postId)
    try {
      if (saved) {
        await unsavePost(postId).unwrap()
        toast({ title: 'Post unsaved', status: 'info', duration: 2000 })
      } else {
        await savePost({ postId }).unwrap()
        toast({ title: 'Post saved', status: 'success', duration: 2000 })
      }
      refetchSaved()
    } catch (err) {
      toast({ title: err?.data?.message || 'Failed to save', status: 'error', duration: 2000 })
    }
  }

  return (
    <>
    <Box
        bg={bgColor}
        minH="100dvh"
        h="100dvh"
        w="100%"
        maxW="100vw"
        p={0}
        m={0}
        position="relative"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        overflow="hidden"
        sx={{ boxSizing: 'border-box' }}
      >
        {/* Full-screen reels: one post per viewport; height/width from viewport so rotation resizes video */}
        <Box
          w="100%"
          maxW="540px"
          flex={1}
          minH={0}
          h="100%"
          mx="auto"
          position="relative"
          display="flex"
          flexDirection="column"
          overflow="hidden"
          sx={{ height: '100dvh', maxHeight: '100dvh' }}
        >
        {isLoading ? (
          <Box
            w="100%"
            flex={1}
            minH={0}
            h="100%"
            overflowY="auto"
            overflowX="hidden"
            sx={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
          >
            {[1, 2, 3].map((i) => (
              <Box key={i} h="100dvh" minH="100dvh" w="100%">
                <ReelSkeleton />
              </Box>
            ))}
          </Box>
        ) : feedError ? (
          <Center flex={1} flexDirection="column" gap={4} px={4}>
            <Text color="white" fontSize="md">Couldn't load feed</Text>
            <Text color="whiteAlpha.700" fontSize="sm" textAlign="center">Check your connection and try again.</Text>
            <HStack spacing={3}>
              <Button size="sm" colorScheme="blue" onClick={() => refetch()}>Try again</Button>
              <Button size="sm" variant="ghost" color="whiteAlpha.900" onClick={() => navigate('/user/home')}>Go to Home</Button>
            </HStack>
          </Center>
        ) : posts.length === 0 ? (
          <Box py={20}>
            <EmptyState
              title={feedMode === 'video' ? 'No video posts' : 'No image posts'}
              description={feedMode === 'video' ? 'Switch to Image to see photo posts' : 'Switch to Video to see video posts'}
              icon={feedMode === 'video' ? '🎬' : '🖼️'}
            />
          </Box>
        ) : (
          <Box position="relative" w="100%" flex={1} minH={0} h="100%" sx={{ height: '100dvh' }}>
            <Box
              ref={scrollRef}
              as="main"
              w="100%"
              overflowY="scroll"
              overflowX="hidden"
              position="relative"
              zIndex={0}
              sx={{
                height: '100dvh',
                maxHeight: '100dvh',
                scrollSnapType: 'y mandatory',
                scrollSnapStop: 'always',
                overscrollBehaviorY: 'contain',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {posts.map((post, index) => {
                const inWindow = index >= Math.max(0, activeReelIndex - 2) && index <= Math.min(posts.length - 1, activeReelIndex + 2)
                return (
                  <Box
                    key={post._id}
                    ref={(el) => { postRefsRef.current[index] = el }}
                    data-reel-index={index}
                    w="100%"
                    flexShrink={0}
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                    scrollSnapAlign="start"
                    sx={{
                      height: '100dvh',
                      minHeight: '100dvh',
                      scrollSnapStop: 'always',
                      transform: 'translateZ(0)',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  >
                    {inWindow ? (
                      <ReelCard
                        post={post}
                        onLike={handleLike}
                        triggerHeartAnimation={heartAnimationPostId === post._id}
                        onDelete={handleDeleteClick}
                        onAddComment={handleAddComment}
                        onOpenComments={setCommentPostId}
                        onSave={handleSave}
                        isSaved={savedPostIds.has(post._id)}
                        hasSound={location.pathname === '/user/feed' && soundIndex === index}
                        onRequestSound={() => setSoundIndex((prev) => (prev === index ? -1 : index))}
                        userInfo={userInfo}
                        userData={userData}
                        scrollRootRef={scrollRef}
                        showFeedModeSwitch={location.pathname.startsWith('/user/feed')}
                        feedMode={feedMode}
                        onFeedModeSwitch={() => setFeedMode(feedMode === 'video' ? 'image' : 'video')}
                      />
                    ) : (
                      <Box w="100%" flexShrink={0} aria-hidden="true" sx={{ height: '100dvh', minHeight: '100dvh' }} />
                    )}
                  </Box>
                )
              })}
            </Box>

            {/* Spinner outside scroll flow so it doesn't add height / cause bounce */}
            {hasMore && isFetching && (
              <Center
                position="absolute"
                bottom={4}
                left="50%"
                transform="translateX(-50%)"
                zIndex={10}
                py={2}
                pointerEvents="none"
              >
                <Spinner size="sm" color="white" />
              </Center>
            )}
          </Box>
        )}
        </Box>
      </Box>

    <CommentBottomSheet
        isOpen={!!commentPostId}
        onClose={() => setCommentPostId(null)}
        post={posts.find((p) => p._id === commentPostId) || null}
        onCommentAdded={refetch}
      />

      <AlertDialog
        isOpen={!!postToDelete}
        leastDestructiveRef={undefined}
        onClose={() => setPostToDelete(null)}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={dialogBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="600">
              Delete post?
            </AlertDialogHeader>
            <AlertDialogBody>
              This post will be permanently deleted. This cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button onClick={() => setPostToDelete(null)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}

export default UserFeed
