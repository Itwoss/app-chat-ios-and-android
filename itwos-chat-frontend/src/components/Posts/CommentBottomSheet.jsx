import {
  Box,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Avatar,
  useColorModeValue,
  Center,
} from '@chakra-ui/react'
import { Send, Heart, MessageCircle } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import UserName from '../User/UserName'
import { useAddCommentMutation } from '../../store/api/userApi'
import { buildYouTubeEmbedUrl } from '../../utils/youtubeEmbed'
import { useVisualViewportKeyboard } from '../../hooks/useVisualViewportKeyboard'

const DRAG_CLOSE_THRESHOLD = 28
const SHEET_TRANSITION = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), max-height 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease'

function getRelativeTime(date) {
  if (!date) return ''
  const now = new Date()
  const d = new Date(date)
  const diffMs = now - d
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return diffMin === 1 ? '1 min' : `${diffMin} mins`
  if (diffHr < 24) return diffHr === 1 ? '1 hr' : `${diffHr} hrs`
  if (diffDay < 7) return diffDay === 1 ? '1 day' : `${diffDay} days`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Instagram-style comment bottom sheet:
 * - User header (separate section)
 * - Post footer (title + icons)
 * - Scrollable comments
 * - Fixed comment input at bottom
 */
export default function CommentBottomSheet({ isOpen, onClose, post, onCommentAdded }) {
  const [commentText, setCommentText] = useState('')
  const [addComment, { isLoading: isAdding }] = useAddCommentMutation()
  const { keyboardOffset, isKeyboardOpen } = useVisualViewportKeyboard()
  const audioRef = useRef(null)
  const dragStartY = useRef(0)

  const bg = useColorModeValue('#fff', '#111')
  const inputBg = useColorModeValue('#f0f0f0', '#222')
  const borderColor = useColorModeValue('#e0e0e0', '#333')
  const textColor = useColorModeValue('#262626', '#fafafa')
  const subtextColor = useColorModeValue('#8e8e8e', '#a8a8a8')
  const headerBg = useColorModeValue('gray.50', 'whiteAlpha.50')

  const handleDragStart = useCallback((e) => {
    dragStartY.current = e.touches ? e.touches[0].clientY : e.clientY
  }, [])

  const handleDragMove = useCallback((e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY
    const delta = y - dragStartY.current
    if (delta > DRAG_CLOSE_THRESHOLD) onClose()
  }, [onClose])

  const handleDragEnd = useCallback((e) => {
    const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
    const delta = y - dragStartY.current
    if (delta > DRAG_CLOSE_THRESHOLD) onClose()
  }, [onClose])

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    dragStartY.current = e.clientY
    const onMouseMove = (ev) => {
      if (ev.buttons !== 1) return
      const delta = ev.clientY - dragStartY.current
      if (delta > DRAG_CLOSE_THRESHOLD) {
        onClose()
        cleanup()
      }
    }
    const onMouseUp = (ev) => {
      const delta = ev.clientY - dragStartY.current
      if (delta > DRAG_CLOSE_THRESHOLD) onClose()
      cleanup()
    }
    const cleanup = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [onClose])

  const hasUploadedSong = !!(post?.song)
  const hasYouTubeSound = !!(post?.sound?.preview_url && post?.sound?.source === 'youtube')
  const youtubeSrc = hasYouTubeSound && post?.sound?.preview_url
    ? buildYouTubeEmbedUrl(post.sound.preview_url, { start: post.sound.startTime || 0, end: post.sound.endTime ?? undefined })
    : null

  useEffect(() => {
    if (!isOpen) {
      setCommentText('')
      const hideOverlay = () => {
        document.querySelectorAll('[data-comment-sheet-overlay]').forEach((el) => {
          el.style.display = 'none'
          el.style.visibility = 'hidden'
          el.style.pointerEvents = 'none'
          el.style.opacity = '0'
        })
      }
      const t = setTimeout(hideOverlay, 400)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      const clearBodyAndRoot = () => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
        document.body.style.paddingBottom = ''
        document.body.style.marginRight = ''
        document.body.style.marginBottom = ''
        const html = document.documentElement
        if (html) {
          html.style.paddingBottom = ''
          html.style.paddingRight = ''
          html.style.marginBottom = ''
          html.style.marginRight = ''
        }
        const root = document.getElementById('root')
        if (root) {
          root.style.paddingBottom = ''
          root.style.marginBottom = ''
        }
        document.querySelectorAll('body > div').forEach((el) => {
          if (el.id !== 'root') {
            el.style.paddingBottom = ''
            el.style.marginBottom = ''
          }
        })
      }
      clearBodyAndRoot()
      requestAnimationFrame(clearBodyAndRoot)
      const t1 = setTimeout(clearBodyAndRoot, 50)
      const t2 = setTimeout(clearBodyAndRoot, 150)
      const t3 = setTimeout(clearBodyAndRoot, 300)
      const t4 = setTimeout(clearBodyAndRoot, 500)
      const t5 = setTimeout(clearBodyAndRoot, 800)
      const t6 = setTimeout(clearBodyAndRoot, 1200)
      const t7 = setTimeout(clearBodyAndRoot, 2000)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
        clearTimeout(t5)
        clearTimeout(t6)
        clearTimeout(t7)
      }
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.body.style.paddingBottom = ''
      document.body.style.marginRight = ''
      document.body.style.marginBottom = ''
      const html = document.documentElement
      if (html) {
        html.style.paddingBottom = ''
        html.style.paddingRight = ''
        html.style.marginBottom = ''
        html.style.marginRight = ''
      }
      const root = document.getElementById('root')
      if (root) {
        root.style.paddingBottom = ''
        root.style.marginBottom = ''
      }
    }
  }, [isOpen])

  // Play post song when comment sheet opens; keep playing while typing/sending (no pause on input)
  useEffect(() => {
    if (!isOpen || !post) return
    if (hasUploadedSong && audioRef.current) {
      audioRef.current.volume = 1
      audioRef.current.play().catch(() => {})
    }
    return () => {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [isOpen, post?._id, hasUploadedSong])

  const handlePostComment = async () => {
    if (!commentText.trim() || !post?._id) return
    try {
      await addComment({ postId: post._id, content: commentText.trim() }).unwrap()
      setCommentText('')
      onCommentAdded?.()
    } catch (err) {
      // Optional: toast error
    }
  }

  const comments = post?.comments || []
  const likeCount = post?.likes?.length ?? 0
  const commentCount = comments.length

  const sheetTopGap = 'max(48px, env(safe-area-inset-top, 0px) + 24px)'
  const sheetMaxHeight = '60vh'

  const handleCloseComplete = useCallback(() => {
    const clearBodyAndRoot = () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      document.body.style.paddingBottom = ''
      document.body.style.marginRight = ''
      document.body.style.marginBottom = ''
      const html = document.documentElement
      if (html) {
        html.style.paddingBottom = ''
        html.style.paddingRight = ''
        html.style.marginBottom = ''
        html.style.marginRight = ''
      }
      const root = document.getElementById('root')
      if (root) {
        root.style.paddingBottom = ''
        root.style.marginBottom = ''
      }
      document.querySelectorAll('body > div').forEach((el) => {
        if (el.id !== 'root') {
          el.style.paddingBottom = ''
          el.style.marginBottom = ''
        }
      })
    }
    clearBodyAndRoot()
    requestAnimationFrame(clearBodyAndRoot)
    setTimeout(clearBodyAndRoot, 50)
    setTimeout(clearBodyAndRoot, 150)
    setTimeout(clearBodyAndRoot, 300)
    setTimeout(clearBodyAndRoot, 500)
    setTimeout(clearBodyAndRoot, 800)
    setTimeout(clearBodyAndRoot, 1200)
    setTimeout(clearBodyAndRoot, 2000)

    // Hide any leftover overlay/backdrop from this comment sheet so the black stripe doesn't persist
    const hideLeftoverOverlays = () => {
      document.querySelectorAll('[data-comment-sheet-overlay]').forEach((el) => {
        el.style.display = 'none'
        el.style.visibility = 'hidden'
        el.style.pointerEvents = 'none'
        el.style.opacity = '0'
      })
    }
    requestAnimationFrame(hideLeftoverOverlays)
    setTimeout(hideLeftoverOverlays, 0)
    setTimeout(hideLeftoverOverlays, 100)
    setTimeout(hideLeftoverOverlays, 350)
  }, [])

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      onCloseComplete={handleCloseComplete}
      placement="bottom"
      size="full"
      blockScrollOnMount={false}
      motionPreset="slideOutBottom"
    >
      <DrawerOverlay
        data-comment-sheet-overlay
        bg="transparent"
        sx={{
          top: sheetTopGap,
          height: `calc(100% - ${sheetTopGap})`,
          background: 'transparent !important',
          backgroundColor: 'transparent !important',
        }}
      />
      <DrawerContent
        maxH={sheetMaxHeight}
        mt={sheetTopGap}
        borderTopLeftRadius="20px"
        borderTopRightRadius="20px"
        bg={bg}
        overflow="hidden"
        transition={SHEET_TRANSITION}
        sx={{
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 0,
          paddingTop: 0,
        }}
        style={{
          transform: isKeyboardOpen ? `translateY(-${keyboardOffset}px)` : 'none',
          transition: 'transform 0.2s ease-out',
        }}
      >
        {/* Drag handle – high-sensitivity drag to close (touch + mouse) */}
        <Center
          pt={2}
          pb={1}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onMouseDown={handleMouseDown}
          cursor="grab"
          sx={{ touchAction: 'none' }}
        >
          <Box w="40px" h="1" borderRadius="full" bg={borderColor} pointerEvents="none" />
        </Center>

        <DrawerBody p={0} display="flex" flexDirection="column" overflow="hidden" minH={0}>
          {/* Post song: plays when sheet opens, continues while typing/sending (independent of feed mute) */}
          {hasUploadedSong && post?.song && (
            <Box position="absolute" w="1px" h="1px" opacity={0} overflow="hidden" pointerEvents="none" aria-hidden="true">
              <audio
                ref={audioRef}
                src={post.song}
                loop
                playsInline
                preload="auto"
              />
            </Box>
          )}
          {hasYouTubeSound && youtubeSrc && (
            <Box position="absolute" w="1px" h="1px" overflow="hidden" opacity={0} pointerEvents="none" aria-hidden="true">
              <Box
                as="iframe"
                src={youtubeSrc}
                title="Post song"
                allow="autoplay; encrypted-media"
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ border: 'none' }}
                key={`sheet-yt-${post?._id}`}
              />
            </Box>
          )}

          {/* Header + media: collapse smoothly when keyboard opens */}
          <Box
            flexShrink={0}
            maxH={isKeyboardOpen ? '0px' : '500px'}
            opacity={isKeyboardOpen ? 0 : 1}
            overflow="hidden"
            transition={SHEET_TRANSITION}
          >
            {/* User header – separate section */}
            <Box flexShrink={0} px={3} py={2} borderBottomWidth="1px" borderColor={borderColor} bg={headerBg}>
              <HStack spacing={3}>
                <Avatar
                  size="sm"
                  name={post?.author?.name || 'Unknown'}
                  src={post?.author?.profileImage}
                  flexShrink={0}
                />
                <VStack align="start" spacing={0} flex={1} minW={0}>
                  <UserName
                    userId={post?.author?._id || post?.author?.id}
                    name={post?.author?.name || 'Unknown'}
                    subscription={post?.author?.subscription}
                    fontSize="sm"
                    fontWeight={600}
                    color={textColor}
                  />
                  {post?.createdAt && (
                    <Text fontSize="2xs" color={subtextColor} mt={0.5}>
                      {getRelativeTime(post.createdAt)}
                    </Text>
                  )}
                </VStack>
              </HStack>
            </Box>

            {/* Post footer – small title + icons */}
            <Box flexShrink={0} px={3} py={2} borderBottomWidth="1px" borderColor={borderColor}>
              {post?.title && (
                <Text fontSize="sm" fontFamily="Raleway, sans-serif" fontWeight={300} fontStyle="italic" color={textColor} noOfLines={1} mb={2}>
                  {post.title}
                </Text>
              )}
              <HStack spacing={4} fontSize="xs" color={subtextColor}>
                <HStack spacing={1}>
                  <Heart size={14} />
                  <Text>{likeCount}</Text>
                </HStack>
                <HStack spacing={1}>
                  <MessageCircle size={14} />
                  <Text>{commentCount}</Text>
                </HStack>
              </HStack>
            </Box>
          </Box>

          {/* Scrollable comments */}
          <Box
            flex={1}
            overflowY="auto"
            minH={0}
            px={3}
            py={3}
            sx={{
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { background: borderColor, borderRadius: 4 },
            }}
          >
            {comments.length === 0 ? (
              <Text fontSize="sm" color={subtextColor} py={4}>
                No comments yet. Be the first to comment.
              </Text>
            ) : (
              <VStack align="stretch" spacing={4}>
                {comments.map((comment, index) => (
                  <HStack key={comment._id || index} align="flex-start" spacing={3}>
                    <Avatar
                      size="sm"
                      name={comment.user?.name || comment.author?.name}
                      src={comment.user?.profileImage || comment.author?.profileImage}
                      flexShrink={0}
                    />
                    <Box flex={1} minW={0}>
                      <UserName
                        userId={comment.user?._id || comment.author?._id}
                        name={comment.user?.name || comment.author?.name || 'Unknown'}
                        subscription={comment.user?.subscription || comment.author?.subscription}
                        fontSize="sm"
                        fontWeight={600}
                        color={textColor}
                      />
                      <Text fontSize="sm" color={textColor} mt={0.5}>
                        {comment.content}
                      </Text>
                    </Box>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>

          {/* Fixed comment input at bottom – no extra safe-area when keyboard open so it sticks to keyboard */}
          <Box
            flexShrink={0}
            px={3}
            py={3}
            pb={isKeyboardOpen ? 3 : 'calc(12px + env(safe-area-inset-bottom, 0px))'}
            borderTopWidth="1px"
            borderColor={borderColor}
            bg={bg}
          >
            <HStack spacing={2}>
              <Input
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handlePostComment()
                  }
                }}
                bg={inputBg}
                border="none"
                borderRadius="full"
                color={textColor}
                _placeholder={{ color: subtextColor }}
                size="md"
                flex={1}
              />
              <IconButton
                icon={<Send size={18} />}
                aria-label="Post comment"
                size="md"
                colorScheme="blue"
                borderRadius="full"
                onClick={handlePostComment}
                isLoading={isAdding}
                isDisabled={!commentText.trim()}
              />
            </HStack>
          </Box>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
