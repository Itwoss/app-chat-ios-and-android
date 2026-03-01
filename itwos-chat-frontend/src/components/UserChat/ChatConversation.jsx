/**
 * ChatConversation.jsx
 * Apple iMessage-style chat conversation panel.
 *
 * FIXES:
 *  - Long-press on bubble now correctly opens a context menu
 *  - Menu stays open until user picks an option OR taps outside
 *  - Swipe-to-reply no longer accidentally triggers menu
 *  - onPointerLeave no longer kills long-press mid-gesture
 *  - Replaced Popover (which had z-index/Portal conflicts) with a
 *    Portal-based absolute menu that positions itself above/below the bubble
 */

import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Avatar,
  IconButton,
  Textarea,
  useColorModeValue,
  Spinner,
  Center,
  Image,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Portal,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  Progress,
  SimpleGrid,
} from '@chakra-ui/react'
import {
  ArrowLeft,
  Send,
  Paperclip,
  Plus,
  Image as ImageIcon,
  Mic,
  MicOff,
  Smile,
  X,
  File,
  Heart,
  Reply,
  Trash2,
} from 'lucide-react'
import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import EmojiPicker from 'emoji-picker-react'
import { useVisualViewportKeyboard } from '../../hooks/useVisualViewportKeyboard'

import { formatTime, formatDate } from '../../utils/dateFormat'
import {
  RichCardBubble,
  ImageGridBubble,
  AnimatedBubble,
  DateDivider,
  ReplyPreview,
} from './ChatConversationParts'
import {
  CHAT_FOOTER_BG,
  CHAT_ICON_GRAY,
  BUBBLE_RADIUS_OWN,
  BUBBLE_RADIUS_OTHER,
  BUBBLE_SHADOW_OWN,
  BUBBLE_SHADOW_OTHER,
  TIME_COLOR_OWN,
  TIME_COLOR_OTHER,
  DEFAULT_OUTGOING_BUBBLE,
  DEFAULT_INCOMING_BUBBLE,
  SWIPE_RELEASE_THRESHOLD,
  SWIPE_MAX_DRAG,
  ELASTIC_RESISTANCE,
} from './chatConversationStyles'

const UNDECRYPT_PLACEHOLDERS = [
  '[Encrypted message - decryption failed]',
  '[Message could not be decrypted]',
  '[Encrypted Message]',
]
function replyContentPreview(content) {
  if (content == null || typeof content !== 'string') return content
  const trimmed = String(content).trim()
  return UNDECRYPT_PLACEHOLDERS.includes(trimmed) ? 'Message unavailable' : content
}

// ─── Context Menu (Portal-based, avoids Popover z-index issues) ───────────────

function BubbleContextMenu({ isOpen, onClose, isOwn, onReply, onHeart, onDeleteForMe, onDeleteForEveryone, anchorRef }) {
  const menuRef = useRef(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!isOpen || !anchorRef?.current) return

    const rect = anchorRef.current.getBoundingClientRect()
    const menuHeight = 180 // approx
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow > menuHeight
      ? rect.bottom + 8
      : rect.top - menuHeight - 8

    const menuWidth = 180
    let left = isOwn
      ? rect.right - menuWidth
      : rect.left

    // clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8))

    setPos({ top: top + window.scrollY, left })
  }, [isOpen, anchorRef, isOwn])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          anchorRef?.current && !anchorRef.current.contains(e.target)) {
        onClose()
      }
    }
    // Use capture so we get it before bubbles
    document.addEventListener('pointerdown', handler, true)
    return () => document.removeEventListener('pointerdown', handler, true)
  }, [isOpen, onClose, anchorRef])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const items = [
    { label: 'Reply', Icon: Reply, action: onReply },
    ...(onHeart ? [{ label: 'Heart', Icon: Heart, action: onHeart }] : []),
    { label: 'Delete for me', Icon: Trash2, action: onDeleteForMe },
    ...(isOwn ? [{ label: 'Delete for everyone', Icon: Trash2, action: onDeleteForEveryone }] : []),
  ]

  return (
    <Portal>
      {/* Backdrop to catch outside taps on mobile */}
      <Box
        position="fixed"
        inset={0}
        zIndex={9998}
        onPointerDown={(e) => { e.stopPropagation(); onClose() }}
      />
      <Box
        ref={menuRef}
        position="fixed"
        top={`${pos.top}px`}
        left={`${pos.left}px`}
        zIndex={9999}
        bg="gray.900"
        borderRadius="14px"
        boxShadow="0 8px 32px rgba(0,0,0,0.55)"
        border="1px solid rgba(255,255,255,0.08)"
        overflow="hidden"
        minW="168px"
        onPointerDown={(e) => e.stopPropagation()} // don't let backdrop close when clicking menu itself
        sx={{
          '@keyframes menuIn': {
            '0%': { opacity: 0, transform: 'scale(0.92) translateY(-4px)' },
            '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
          },
          animation: 'menuIn 0.15s ease-out',
        }}
      >
        <VStack spacing={0} align="stretch" p={1}>
          {items.map((item, i) => (
            <Box
              key={item.label}
              as="button"
              type="button"
              display="flex"
              alignItems="center"
              gap={2.5}
              w="100%"
              px={4}
              py={2.5}
              fontSize="14px"
              fontWeight="500"
              color={item.label.startsWith('Delete') ? 'red.400' : 'white'}
              borderRadius="10px"
              cursor="pointer"
              bg="transparent"
              _hover={{ bg: item.label.startsWith('Delete') ? 'rgba(239,68,68,0.1)' : 'whiteAlpha.100' }}
              onClick={(e) => {
                e.stopPropagation()
                item.action()
                onClose()
              }}
              borderTop={i > 0 && items[i - 1].label.startsWith('Delete') !== item.label.startsWith('Delete')
                ? '1px solid rgba(255,255,255,0.06)'
                : 'none'}
            >
              <item.Icon size={15} strokeWidth={2} />
              {item.label}
            </Box>
          ))}
        </VStack>
      </Box>
    </Portal>
  )
}

// ─── Single Message Row ───────────────────────────────────────────────────────

function MessageRow({
  msg,
  isOwn,
  showTimestamp,
  isLastOutgoing,
  isLastFromSender,
  isHearted,
  renderContent,
  onReply,
  onDeleteForMe,
  onDeleteForEveryone,
  onEmojiReaction,
  otherUserAvatar,
  themeColors,
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isSnappingBack, setIsSnappingBack] = useState(false)

  // Refs
  const bubbleRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const pointerStartRef = useRef({ x: 0, y: 0 })
  const isPointerDownRef = useRef(false)
  const swipeStartedRef = useRef(false)   // true once horizontal drag exceeds threshold
  const swipeTriggeredRef = useRef(false) // true once swipe-to-reply fired
  const longPressFiredRef = useRef(false) // true once long press menu opened
  const lastSwipeOffsetRef = useRef(0)
  const rafRef = useRef(null)

  const bubbleBg = isOwn
    ? (themeColors?.outgoingBubbleColor || DEFAULT_OUTGOING_BUBBLE)
    : (themeColors?.incomingBubbleColor || DEFAULT_INCOMING_BUBBLE)
  const textColor = isOwn
    ? (themeColors?.outgoingTextColor || 'white')
    : (themeColors?.incomingTextColor || 'white')
  const timeColor = isOwn ? TIME_COLOR_OWN : TIME_COLOR_OTHER

  const isDeleted = msg.content === 'This message was deleted'

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const snapBack = () => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    lastSwipeOffsetRef.current = 0
    setIsSnappingBack(true)
    setSwipeOffset(0)
  }

  const handlePointerDown = (e) => {
    if (isDeleted || showMenu) return
    // Only handle primary button / touch
    if (e.pointerType === 'mouse' && e.button !== 0) return

    isPointerDownRef.current = true
    swipeStartedRef.current = false
    swipeTriggeredRef.current = false
    longPressFiredRef.current = false
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    lastSwipeOffsetRef.current = 0

    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (_) {}

    // Start long-press timer
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      // Only open if we haven't swiped
      if (!swipeStartedRef.current && isPointerDownRef.current) {
        longPressFiredRef.current = true
        setShowMenu(true)
      }
    }, 450)
  }

  const handlePointerMove = (e) => {
    if (!isPointerDownRef.current) return

    const dx = e.clientX - pointerStartRef.current.x
    const dy = e.clientY - pointerStartRef.current.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    // If significant horizontal movement — cancel long press, start swipe
    if (absDx > 8 && absDx > absDy) {
      if (!swipeStartedRef.current) {
        swipeStartedRef.current = true
        cancelLongPress()
      }
    }

    // If significant vertical movement — cancel long press
    if (absDy > 10 && absDy > absDx) {
      cancelLongPress()
    }

    if (!swipeStartedRef.current) return

    // Calculate elastic swipe offset
    let offset = 0
    if (isOwn) {
      if (dx < 0) {
        const abs = Math.abs(dx)
        offset = -(abs <= SWIPE_RELEASE_THRESHOLD
          ? abs
          : SWIPE_RELEASE_THRESHOLD + (abs - SWIPE_RELEASE_THRESHOLD) * ELASTIC_RESISTANCE)
        offset = Math.max(offset, -SWIPE_MAX_DRAG)
      }
    } else {
      if (dx > 0) {
        offset = dx <= SWIPE_RELEASE_THRESHOLD
          ? dx
          : SWIPE_RELEASE_THRESHOLD + (dx - SWIPE_RELEASE_THRESHOLD) * ELASTIC_RESISTANCE
        offset = Math.min(offset, SWIPE_MAX_DRAG)
      }
    }

    lastSwipeOffsetRef.current = offset
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        setSwipeOffset(lastSwipeOffsetRef.current)
      })
    }
  }

  const handlePointerUp = (e) => {
    if (!isPointerDownRef.current) return
    isPointerDownRef.current = false

    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (_) {}
    cancelLongPress()

    const currentOffset = lastSwipeOffsetRef.current
    const pastThreshold = isOwn
      ? currentOffset <= -SWIPE_RELEASE_THRESHOLD
      : currentOffset >= SWIPE_RELEASE_THRESHOLD

    if (pastThreshold && swipeStartedRef.current && !isDeleted) {
      swipeTriggeredRef.current = true
      onReply(msg)
    }

    snapBack()
  }

  const handlePointerCancel = (e) => {
    isPointerDownRef.current = false
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch (_) {}
    cancelLongPress()
    snapBack()
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    if (!isDeleted) setShowMenu(true)
  }

  const handleClick = (e) => {
    // If a swipe just completed, eat the click
    if (swipeTriggeredRef.current) {
      e.preventDefault()
      e.stopPropagation()
      swipeTriggeredRef.current = false
    }
  }

  const pastThreshold = isOwn
    ? swipeOffset <= -SWIPE_RELEASE_THRESHOLD
    : swipeOffset >= SWIPE_RELEASE_THRESHOLD

  return (
    <AnimatedBubble>
      <Flex
        direction="column"
        alignItems={isOwn ? 'flex-end' : 'flex-start'}
        mb={1}
        px={4}
      >
        {/* Reply preview */}
        {msg.replyTo && (
          <Box
            maxW="240px"
            mb={0.5}
            px={3}
            py={1.5}
            borderRadius="12px"
            bg="whiteAlpha.100"
            borderLeft="3px solid"
            borderColor={isOwn ? 'purple.300' : 'blue.300'}
            opacity={0.85}
            ml={isOwn ? 'auto' : '36px'}
          >
            <Text fontSize="xs" color="gray.400" noOfLines={2}>
              {typeof msg.replyTo === 'object'
                ? replyContentPreview(msg.replyTo.content) || '...'
                : '...'}
            </Text>
          </Box>
        )}

        <HStack
          alignItems="flex-end"
          spacing={2}
          flexDirection={isOwn ? 'row-reverse' : 'row'}
        >
          {/* Avatar for received */}
          {!isOwn && (
            <Avatar
              size="xs"
              src={otherUserAvatar}
              mb="2px"
              flexShrink={0}
            />
          )}

          {/* Bubble wrapper with swipe */}
          <Box position="relative">
            <Box
              display="flex"
              alignItems="center"
              flexDirection={isOwn ? 'row-reverse' : 'row'}
              w="fit-content"
              maxW={{ base: '72vw', md: '400px' }}
              sx={{ touchAction: 'pan-y' }}
              style={{
                transform: `translateX(${swipeOffset}px)`,
                transition: isSnappingBack
                  ? 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  : 'none',
                willChange: swipeOffset !== 0 ? 'transform' : 'auto',
              }}
              onTransitionEnd={() => setIsSnappingBack(false)}
            >
              {/* Reply hint */}
              {pastThreshold && (
                <Flex
                  align="center"
                  gap={1}
                  flexShrink={0}
                  px={2}
                  opacity={0.9}
                >
                  <Reply size={14} strokeWidth={2} color="rgba(255,255,255,0.8)" />
                  <Text fontSize="11px" fontWeight="600" color="whiteAlpha.900">
                    Reply
                  </Text>
                </Flex>
              )}

              {/* The actual bubble */}
              <Box
                ref={bubbleRef}
                data-role="bubble-inner"
                px={isDeleted ? 3 : msg.messageType === 'image' ? 0 : 3}
                py={isDeleted ? 2 : msg.messageType === 'image' ? 0 : 2}
                borderRadius={
                  msg.messageType === 'image'
                    ? '0'
                    : isOwn
                    ? BUBBLE_RADIUS_OWN
                    : BUBBLE_RADIUS_OTHER
                }
                background={msg.messageType === 'image' ? 'transparent' : bubbleBg}
                color={textColor}
                maxW={{ base: '72vw', md: '400px' }}
                cursor={isDeleted ? 'default' : 'pointer'}
                sx={{ touchAction: 'pan-y' }}
                onContextMenu={handleContextMenu}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onClick={handleClick}
                userSelect="none"
                backdropFilter="blur(10px)"
                boxShadow={
                  msg.messageType === 'image'
                    ? 'none'
                    : isOwn
                    ? BUBBLE_SHADOW_OWN
                    : BUBBLE_SHADOW_OTHER
                }
              >
                {showTimestamp || (isOwn && isLastOutgoing) ? (
                  <Flex
                    direction="row"
                    align="center"
                    alignSelf="stretch"
                    gap={2}
                    flexWrap="wrap"
                    justifyContent={isOwn ? 'flex-end' : 'flex-start'}
                  >
                    <Box flex={1} minW={0} display="flex" justifyContent={isOwn ? 'flex-end' : 'flex-start'}>
                      {renderContent(msg)}
                    </Box>
                    <Text
                      fontSize="10px"
                      color={timeColor}
                      flexShrink={0}
                      whiteSpace="nowrap"
                    >
                      {formatTime(msg.createdAt)}
                      {isLastOutgoing && msg.status === 'read' && ' · Read'}
                      {isLastOutgoing && msg.status === 'delivered' && ' · Delivered'}
                      {isLastOutgoing && msg.status === 'sent' && ' · Sent'}
                    </Text>
                  </Flex>
                ) : (
                  renderContent(msg)
                )}
              </Box>
            </Box>

            {/* Heart reaction badge */}
            {isHearted && (
              <Box
                position="absolute"
                bottom="-12px"
                right={isOwn ? undefined : "-4px"}
                left={isOwn ? "-4px" : undefined}
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="38px"
                h="38px"
                pointerEvents="none"
                sx={{
                  '@keyframes heartReactionIn': {
                    '0%': { opacity: 0, transform: 'scale(0.3)' },
                    '60%': { opacity: 1, transform: 'scale(1.1)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                  },
                  animation: 'heartReactionIn 0.25s ease-out',
                }}
              >
                <Heart size={12} fill="#ef4444" stroke="#ef4444" strokeWidth={1.5} />
              </Box>
            )}

            {/* Context menu */}
            <BubbleContextMenu
              isOpen={showMenu && !isDeleted}
              onClose={() => setShowMenu(false)}
              isOwn={isOwn}
              anchorRef={bubbleRef}
              onReply={() => onReply(msg)}
              onHeart={onEmojiReaction ? () => onEmojiReaction(msg, '❤️') : null}
              onDeleteForMe={() => onDeleteForMe(msg)}
              onDeleteForEveryone={isOwn ? () => onDeleteForEveryone(msg) : null}
            />
          </Box>
        </HStack>
      </Flex>
    </AnimatedBubble>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatConversation({
  selectedUserId,
  currentChat,
  messages = [],
  chatLoading,
  messagesLoading,
  currentUserId,
  chatSettingsData,
  borderColor,
  cardBg,
  textColor,
  bgColor,
  replyToMessage,
  setReplyToMessage,
  message,
  onMessageChange,
  onMessageBlur,
  onInputKeyDown,
  messageInputRef,
  messagesEndRef,
  fileInputRef,
  imageInputRef,
  handleSend,
  onQuickHeart,
  onEmojiReaction,
  handleFileSelect,
  isSending,
  isSendingRef,
  selectedFiles,
  previewImages,
  removeFile,
  uploadingFiles,
  uploadProgress,
  showEmojiPicker,
  setShowEmojiPicker,
  onEmojiClick,
  isRecording,
  startRecording,
  stopRecording,
  isAudioSupported,
  formatDuration,
  recordingDuration,
  audioUrl,
  clearRecording,
  isProcessing,
  audioBlob,
  onDeleteForMe,
  onDeleteForEveryone,
  onChatThemeOpen,
  typingUsers,
  selectedChatId,
  renderMessageContent,
  isCryingMessage,
  onBack,
  isChatCleared,
  onRestoreChat,
  chatError,
  refetchChat,
  messagesError,
  onRetryMessages,
  onViewProfile,
}) {
  const [showAllTimestamps, setShowAllTimestamps] = useState(false)
  const { isKeyboardOpen } = useVisualViewportKeyboard()
  const longPressTimer = useRef(null)
  const longPressTriggered = useRef(false)
  const scrollContainerRef = useRef(null)
  const micLongPressTimerRef = useRef(null)
  const micLongPressActiveRef = useRef(false)

  useEffect(() => {
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages?.length])

  const otherParticipant = currentChat?.participants?.find(
    (p) => String(p._id) !== String(currentUserId)
  )
  const chatName =
    otherParticipant?.name ||
    currentChat?.otherUser?.name ||
    'Chat'
  const chatAvatar =
    otherParticipant?.profileImage ||
    otherParticipant?.profilePicture ||
    currentChat?.otherUser?.profileImage ||
    currentChat?.otherUser?.profilePicture ||
    null
  const isOnline =
    otherParticipant?.onlineStatus === 'online' ||
    currentChat?.otherUser?.onlineStatus === 'online'

  const typingEntry = typingUsers?.[selectedChatId]
  const isOtherTyping = typingEntry && String(typingEntry) !== String(currentUserId)

  const footerBg = CHAT_FOOTER_BG
  const iconGray = CHAT_ICON_GRAY
  const hasText = (message || '').trim().length > 0
  const hasAttachment = (selectedFiles?.length ?? 0) > 0 || (previewImages?.length ?? 0) > 0 || !!audioUrl
  const showSend = hasText || hasAttachment
  const isDisabled = isSending || isSendingRef?.current || (uploadingFiles?.length ?? 0) > 0

  const grouped = []
  const sorted = [...(messages || [])].sort(
    (a, b) => (new Date(a.createdAt || 0).getTime() || 0) - (new Date(b.createdAt || 0).getTime() || 0)
  )
  sorted.forEach((msg, i) => {
    const label = formatDate(msg.createdAt)
    const prevLabel = i > 0 ? formatDate(sorted[i - 1].createdAt) : null
    if (prevLabel !== label) {
      grouped.push({ type: 'date', label, key: `date-${label}-${msg._id ?? i}` })
    }
    const content = String(msg.content || '').trim()
    const isHeartOnlyReply =
      (content === '❤️' || content === '❤') && (msg.replyTo?._id ?? msg.replyTo)
    if (isHeartOnlyReply) return
    grouped.push({ type: 'msg', msg, key: msg._id })
  })

  const lastOutgoingMessageId = (() => {
    const owned = (messages || []).filter(
      (m) => String(m.sender?._id || m.sender) === String(currentUserId)
    )
    const excludeHeartOnlyReply = (m) => {
      const content = String(m.content || '').trim()
      if (content !== '❤️' && content !== '❤') return true
      return !(m.replyTo?._id ?? m.replyTo)
    }
    const visibleOwned = owned.filter(excludeHeartOnlyReply)
    if (visibleOwned.length === 0) return null
    const byNewest = [...visibleOwned].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
    return byNewest[0]?._id ?? null
  })()

  const getSenderId = (m) => String(m?.sender?._id ?? m?.sender ?? '')
  const lastMessageIdBySender = useMemo(() => {
    const map = {}
    ;(messages || []).forEach((m) => {
      const sid = getSenderId(m)
      const existing = map[sid]
      if (
        !existing ||
        new Date(m.createdAt || 0).getTime() > new Date(existing.createdAt || 0).getTime()
      ) {
        map[sid] = m
      }
    })
    return Object.fromEntries(
      Object.entries(map).map(([sid, msg]) => [sid, msg._id])
    )
  }, [messages])

  const heartedMessageIds = useMemo(() => {
    const set = new Set()
    ;(messages || []).forEach((m) => {
      const content = String(m.content || '').trim()
      if (content !== '❤️' && content !== '❤') return
      const replyId = m.replyTo?._id ?? m.replyTo
      if (replyId) set.add(replyId)
    })
    return set
  }, [messages])

  // Long-press on empty background reveals timestamps
  const handleListPointerDown = useCallback((e) => {
    const target = e.target
    const isOnBubble = target.closest('[data-role="bubble-inner"]')
    if (isOnBubble) return
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      setShowAllTimestamps(true)
    }, 500)
  }, [])

  const handleListPointerUp = useCallback(() => {
    clearTimeout(longPressTimer.current)
    setShowAllTimestamps(false)
  }, [])

  // Mic long-press
  const MIC_LONG_PRESS_MS = 400
  const onMicPointerDown = useCallback(() => {
    if (!isAudioSupported || isDisabled) return
    micLongPressActiveRef.current = false
    micLongPressTimerRef.current = setTimeout(() => {
      micLongPressTimerRef.current = null
      startRecording()
      micLongPressActiveRef.current = true
    }, MIC_LONG_PRESS_MS)
  }, [isAudioSupported, isDisabled, startRecording])

  const onMicPointerUp = useCallback(() => {
    const wasLongPress = micLongPressActiveRef.current
    if (micLongPressTimerRef.current) {
      clearTimeout(micLongPressTimerRef.current)
      micLongPressTimerRef.current = null
    }
    if (wasLongPress) {
      micLongPressActiveRef.current = false
      stopRecording()
      setTimeout(handleSend, 350)
    } else if (!isRecording) {
      startRecording()
    }
  }, [isRecording, stopRecording, handleSend, startRecording])

  const onMicPointerCancel = useCallback(() => {
    if (micLongPressTimerRef.current) {
      clearTimeout(micLongPressTimerRef.current)
      micLongPressTimerRef.current = null
    }
    if (micLongPressActiveRef.current) {
      micLongPressActiveRef.current = false
      stopRecording()
      setTimeout(handleSend, 350)
    }
  }, [stopRecording, handleSend])

  const bg = useColorModeValue('#f5f5f7', '#0a0a0f')
  const headerBg = useColorModeValue('rgba(255,255,255,0.72)', 'rgba(15,15,20,0.85)')
  const mutedText = useColorModeValue('gray.500', 'whiteAlpha.500')

  if (!selectedUserId) {
    return (
      <Center flex={1} flexDirection="column" gap={3} opacity={0.35}>
        <Text fontSize="5xl">💬</Text>
        <Text fontSize="md" fontWeight="500">
          Select a conversation
        </Text>
      </Center>
    )
  }

  return (
    <Flex
      direction="column"
      h="100dvh"
      maxH="100dvh"
      minH={0}
      overflow="hidden"
      bg={bg}
      position="relative"
      sx={{
        '@supports (height: 100dvh)': {
          h: '100dvh',
          maxH: '100dvh',
        },
      }}
    >
      {/* ── HEADER ── */}
      <Box
        flexShrink={0}
        backdropFilter="blur(24px) saturate(180%)"
        bg={headerBg}
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
        zIndex={10}
        pl="max(12px, env(safe-area-inset-left))"
        pr={3}
        py={2}
        pt="max(8px, env(safe-area-inset-top))"
      >
        <HStack spacing={3}>
          <IconButton
            aria-label="Back"
            icon={<ArrowLeft size={20} />}
            variant="ghost"
            size="sm"
            type="button"
            borderRadius="full"
            color="white"
            _hover={{ bg: 'whiteAlpha.100' }}
            display={{ base: 'flex', md: 'none' }}
            onClick={onBack}
            ml={0}
            flexShrink={0}
            minW="44px"
            minH="44px"
            sx={{ touchAction: 'manipulation' }}
          />
          <Avatar
            size="sm"
            src={chatAvatar}
            name={chatName}
            cursor="pointer"
            onClick={() => otherParticipant?._id && onViewProfile?.(otherParticipant._id)}
          />
          <VStack
            spacing={0}
            align="flex-start"
            flex={1}
            cursor="pointer"
            onClick={() => otherParticipant?._id && onViewProfile?.(otherParticipant._id)}
          >
            <Text fontWeight="700" fontSize="sm" color="white" lineHeight="tight">
              {chatName}
            </Text>
            <Text fontSize="11px" color={isOnline ? 'green.300' : mutedText}>
              {isOnline ? 'Active now' : 'Offline'}
            </Text>
          </VStack>
          <IconButton
            aria-label="Theme"
            icon={<span style={{ fontSize: '18px' }}>🎨</span>}
            variant="ghost"
            size="sm"
            minW="44px"
            minH="44px"
            borderRadius="full"
            color="white"
            _hover={{ bg: 'whiteAlpha.100' }}
            onClick={onChatThemeOpen}
          />
        </HStack>
      </Box>

      {/* ── MESSAGE LIST ── */}
      <Box
        ref={scrollContainerRef}
        flex={1}
        minH={0}
        overflowY="auto"
        overflowX="hidden"
        py={2}
        pb={4}
        bg={
          chatSettingsData?.data?.wallpaper
            ? 'gray.900'
            : chatSettingsData?.data?.backgroundColor || undefined
        }
        backgroundImage={
          chatSettingsData?.data?.wallpaper
            ? `url(${chatSettingsData.data.wallpaper})`
            : undefined
        }
        backgroundSize="cover"
        backgroundPosition="center"
        sx={{
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          overscrollBehavior: 'contain',
        }}
        onPointerDown={handleListPointerDown}
        onPointerUp={handleListPointerUp}
        onPointerCancel={handleListPointerUp}
      >
        {messagesLoading && (
          <Center py={6}>
            <Spinner size="sm" color="whiteAlpha.400" />
          </Center>
        )}

        {!messagesLoading && messagesError && onRetryMessages && (
          <Center py={6} flexDirection="column" gap={3}>
            <Text fontSize="sm" color="whiteAlpha.800">Couldn't load messages</Text>
            <Button size="sm" colorScheme="blue" variant="outline" onClick={() => onRetryMessages()}>
              Try again
            </Button>
          </Center>
        )}

        {!messagesError && isChatCleared && (
          <Center py={4}>
            <Button size="xs" variant="ghost" color="blue.300" onClick={onRestoreChat}>
              Restore messages
            </Button>
          </Center>
        )}

        {!messagesError && grouped.map((item) => {
          if (item.type === 'date') {
            return (
              <Box key={item.key} data-role="date-divider">
                <DateDivider label={item.label} />
              </Box>
            )
          }
          const msg = item.msg
          const isOwn = String(msg.sender?._id || msg.sender) === String(currentUserId)
          const senderId = getSenderId(msg)
          const isLastFromSender = msg._id === lastMessageIdBySender[senderId]
          const isHearted = heartedMessageIds.has(msg._id)
          return (
            <Box key={item.key} data-role="bubble">
              <MessageRow
                msg={msg}
                isOwn={isOwn}
                showTimestamp={showAllTimestamps}
                isLastOutgoing={isOwn && msg._id === lastOutgoingMessageId}
                isLastFromSender={isLastFromSender}
                isHearted={isHearted}
                onReply={setReplyToMessage}
                onDeleteForMe={onDeleteForMe}
                onDeleteForEveryone={onDeleteForEveryone}
                onEmojiReaction={onEmojiReaction}
                otherUserAvatar={chatAvatar}
                themeColors={chatSettingsData?.data}
                renderContent={renderMessageContent}
              />
            </Box>
          )
        })}

        {/* Uploading indicators */}
        {(uploadingFiles ?? []).map((uf) => (
          <Flex key={uf.id} justifyContent="flex-end" px={4} mb={1}>
            <HStack
              bg="whiteAlpha.100"
              px={3}
              py={2}
              borderRadius="16px"
              spacing={2}
            >
              <Spinner size="xs" color="purple.300" />
              <Text fontSize="xs" color="whiteAlpha.600">
                {uf.name} {uploadProgress?.[uf.id] ? `${uploadProgress[uf.id]}%` : ''}
              </Text>
            </HStack>
          </Flex>
        ))}

        {isOtherTyping && (
          <Flex px={4} mb={2} alignItems="flex-end" gap={2}>
            <Avatar size="xs" src={chatAvatar} />
            <HStack
              bg="whiteAlpha.100"
              px={3}
              py={2}
              borderRadius={BUBBLE_RADIUS_OTHER}
              spacing={1}
            >
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg="whiteAlpha.500"
                  style={{
                    animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </HStack>
          </Flex>
        )}

        <Box ref={messagesEndRef} h="4px" />
      </Box>

      {/* ── FOOTER ── */}
      {!isChatCleared && (
        <Box
          flexShrink={0}
          w="100%"
          zIndex={20}
          px={{ base: 2, md: 3 }}
          pt={2}
          pb={isKeyboardOpen ? 2 : 'max(16px, env(safe-area-inset-bottom))'}
          bg={footerBg}
          borderTop="1px solid rgba(255,255,255,0.06)"
        >
          <Box w="100%" minW={0} maxW="100%" overflow="visible" boxSizing="border-box">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e, 'image')}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e, 'file')}
            />

            {(previewImages?.length ?? 0) > 0 && (
              <Box mb={2} p={2} borderRadius="16px" bg="rgba(255,255,255,0.05)" maxW="100%" minW={0} overflow="hidden">
                <SimpleGrid columns={4} spacing={2}>
                  {(previewImages ?? []).map((preview, idx) => (
                    <Box key={idx} position="relative">
                      <Image
                        src={preview.url}
                        alt="Preview"
                        maxH="72px"
                        w="100%"
                        borderRadius="10px"
                        objectFit="cover"
                      />
                      <Box
                        position="absolute"
                        top="-6px"
                        right="-6px"
                        w="20px"
                        h="20px"
                        borderRadius="full"
                        bg="#ef4444"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        onClick={() => removeFile(idx)}
                        boxShadow="0 2px 6px rgba(0,0,0,0.5)"
                      >
                        <X size={10} color="white" strokeWidth={3} />
                      </Box>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            {replyToMessage && (
              <ReplyPreview
                replyToMessage={replyToMessage}
                previewText={replyContentPreview(replyToMessage?.content) || 'Attachment'}
                onCancel={() => setReplyToMessage(null)}
              />
            )}

            <Popover
              isOpen={showEmojiPicker}
              onClose={() => setShowEmojiPicker(false)}
              placement="top-start"
              isLazy
            >
              <PopoverTrigger>
                <Box
                  as="span"
                  w={0}
                  h={0}
                  overflow="hidden"
                  position="absolute"
                  opacity={0}
                  pointerEvents="none"
                  aria-hidden
                />
              </PopoverTrigger>
              <PopoverContent
                zIndex={9999}
                w="auto"
                bg="gray.900"
                borderColor="rgba(255,255,255,0.1)"
                borderRadius="16px"
                overflow="hidden"
                boxShadow="0 20px 60px rgba(0,0,0,0.7)"
              >
                <PopoverBody p={0}>
                  <Box
                    sx={{
                      '& .epr-skin-tones': { display: 'none !important' },
                      '& [class*="epr-skin-tones"]': { display: 'none !important' },
                      '& .epr-cat-btn': { filter: 'brightness(0) invert(1)', opacity: 0.7 },
                      '& .epr-cat-btn.epr-active': {
                        filter: 'brightness(0) saturate(100%) invert(55%) sepia(70%) saturate(800%) hue-rotate(190deg)',
                        opacity: 1,
                      },
                      '& .epr-cat-btn:focus': { outline: 'none' },
                      '& .epr-cat-btn:focus::before': { display: 'none !important' },
                    }}
                  >
                    <EmojiPicker onEmojiClick={onEmojiClick} skinTonesDisabled />
                  </Box>
                </PopoverBody>
              </PopoverContent>
            </Popover>

            <Box
              display="flex"
              alignItems="center"
              borderRadius="full"
              bg="rgba(255,255,255,0.06)"
              minH="40px"
              py="4px"
              pl="6px"
              pr="6px"
              gap={0}
              w="100%"
              minW={0}
              maxW="100%"
              overflow="hidden"
              border="1px solid rgba(255,255,255,0.05)"
              boxSizing="border-box"
              sx={{ overflowX: 'hidden' }}
            >
              <Menu placement="top-start" isLazy strategy="fixed">
                <MenuButton
                  as={IconButton}
                  aria-label="Add attachment"
                  icon={<Plus size={18} strokeWidth={2.5} color="rgba(255,255,255,0.9)" />}
                  bg="transparent"
                  borderRadius="full"
                  w="44px"
                  h="44px"
                  minW="44px"
                  minH="44px"
                  flexShrink={0}
                  border="none"
                  _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                  _active={{ bg: 'rgba(255,255,255,0.15)' }}
                  isDisabled={isDisabled}
                />
                <MenuList
                  zIndex={9999}
                  bg="rgba(28, 28, 30, 0.96)"
                  backdropFilter="blur(28px)"
                  sx={{ WebkitBackdropFilter: 'blur(28px)' }}
                  borderColor="rgba(255,255,255,0.1)"
                  borderWidth="1px"
                  borderRadius="20px"
                  boxShadow="0 24px 64px rgba(0,0,0,0.6)"
                  py="6px"
                  px="4px"
                  minW="190px"
                  overflow="hidden"
                >
                  {[
                    { icon: <Smile size={17} color="#a78bfa" />, label: 'Emoji', onClick: () => setShowEmojiPicker(true), bg: 'rgba(167,139,250,0.08)' },
                    { icon: <ImageIcon size={17} color="#34d399" />, label: 'Upload image', onClick: () => imageInputRef?.current?.click(), bg: 'rgba(52,211,153,0.08)' },
                    { icon: <Paperclip size={17} color="#60a5fa" />, label: 'Upload file', onClick: () => fileInputRef?.current?.click(), bg: 'rgba(96,165,250,0.08)' },
                  ].map(({ icon, label, onClick, bg: itemBg }) => (
                    <MenuItem
                      key={label}
                      icon={icon}
                      onClick={onClick}
                      bg="transparent"
                      borderRadius="12px"
                      mx="2px"
                      px={3}
                      py="11px"
                      mb="2px"
                      _hover={{ bg: itemBg || 'rgba(255,255,255,0.07)' }}
                      _active={{ bg: 'rgba(255,255,255,0.12)' }}
                      color="white"
                      fontSize="14px"
                      fontWeight="500"
                      transition="background 0.15s"
                    >
                      {label}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>

              {isRecording ? (
                <HStack flex={1} minW={0} spacing={2} pl={2} pr={1} py="7px">
                  <Box
                    w="8px"
                    h="8px"
                    borderRadius="full"
                    bg="red.500"
                    flexShrink={0}
                    sx={{
                      '@keyframes recPulse': {
                        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                        '50%': { opacity: 0.5, transform: 'scale(0.8)' },
                      },
                      animation: 'recPulse 1.2s ease-in-out infinite',
                    }}
                  />
                  <Text fontSize="15px" color="red.400" fontWeight="600" whiteSpace="nowrap">
                    {formatDuration?.(recordingDuration) || '0:00'}
                  </Text>
                  <Text fontSize="14px" color="whiteAlpha.500">Recording…</Text>
                </HStack>
              ) : (
                <Textarea
                  ref={messageInputRef}
                  value={message}
                  onChange={onMessageChange}
                  onBlur={onMessageBlur}
                  onKeyDown={onInputKeyDown}
                  placeholder={(uploadingFiles?.length ?? 0) > 0 ? 'Sending…' : 'Message…'}
                  isDisabled={isDisabled}
                  resize="none"
                  rows={1}
                  minH="34px"
                  maxH="120px"
                  flex={1}
                  minW={0}
                  w={0}
                  overflowY="auto"
                  overflowX="hidden"
                  borderRadius="full"
                  border="none"
                  bg="transparent"
                  _focus={{ border: 'none', boxShadow: 'none', outline: 'none' }}
                  _placeholder={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}
                  pl={2}
                  pr={1}
                  py="7px"
                  fontSize="15px"
                  lineHeight="1.4"
                  color="white"
                  style={{ fontSize: '16px' }}
                />
              )}

              {isAudioSupported && !isRecording && !showSend && (
                <Tooltip label="Hold to record & send • Tap to record">
                  <Box
                    as="button"
                    type="button"
                    disabled={!isAudioSupported || isDisabled}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    w="44px"
                    h="44px"
                    flexShrink={0}
                    borderRadius="full"
                    cursor={(!isAudioSupported || isDisabled) ? 'not-allowed' : 'pointer'}
                    opacity={(!isAudioSupported || isDisabled) ? 0.4 : 1}
                    _hover={{ bg: 'rgba(255,255,255,0.08)' }}
                    transition="opacity 0.15s, background 0.15s"
                    onPointerDown={(e) => { e.preventDefault(); onMicPointerDown() }}
                    onPointerUp={onMicPointerUp}
                    onPointerCancel={onMicPointerCancel}
                    onPointerLeave={onMicPointerCancel}
                  >
                    <Mic size={17} color={iconGray} strokeWidth={1.8} />
                  </Box>
                </Tooltip>
              )}

              {isRecording ? (
                <>
                  <Tooltip label="Stop recording">
                    <Box
                      as="button"
                      type="button"
                      onClick={stopRecording}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      w="44px"
                      h="44px"
                      flexShrink={0}
                      borderRadius="full"
                      bg="rgba(239,68,68,0.2)"
                      cursor="pointer"
                      _hover={{ bg: 'rgba(239,68,68,0.35)' }}
                      _active={{ transform: 'scale(0.9)' }}
                      transition="background 0.15s, transform 0.1s"
                      aria-label="Stop recording"
                    >
                      <MicOff size={17} color="#ef4444" />
                    </Box>
                  </Tooltip>
                  <Tooltip label="Send voice">
                    <Box
                      as="button"
                      type="button"
                      onClick={() => {
                        stopRecording()
                        setTimeout(handleSend, 350)
                      }}
                      disabled={isDisabled}
                      w="44px"
                      h="44px"
                      minW="44px"
                      minH="44px"
                      flexShrink={0}
                      borderRadius="full"
                      bg="white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      cursor={isDisabled ? 'not-allowed' : 'pointer'}
                      opacity={isDisabled ? 0.5 : 1}
                      _hover={{ bg: '#e5e5e5' }}
                      _active={{ transform: 'scale(0.9)' }}
                      transition="background 0.15s, transform 0.1s"
                      aria-label="Send voice message"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="19" x2="12" y2="5" />
                        <polyline points="5 12 12 5 19 12" />
                      </svg>
                    </Box>
                  </Tooltip>
                </>
              ) : (
                <Box
                  as="button"
                  type="button"
                  onClick={showSend ? handleSend : (onQuickHeart ?? (() => {}))}
                  disabled={isDisabled}
                  w="44px"
                  h="44px"
                  minW="44px"
                  minH="44px"
                  flexShrink={0}
                  borderRadius="full"
                  bg={showSend ? 'white' : 'transparent'}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  cursor={isDisabled ? 'not-allowed' : 'pointer'}
                  opacity={isDisabled ? 0.5 : 1}
                  _hover={showSend ? { bg: '#e5e5e5' } : { bg: 'rgba(255,255,255,0.1)' }}
                  _active={{ transform: 'scale(0.9)' }}
                  transition="background 0.15s, opacity 0.15s, transform 0.1s"
                  aria-label={showSend ? 'Send message' : 'Quick heart'}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {isDisabled ? (
                    <Spinner size="sm" color={showSend ? 'black' : 'white'} thickness="2px" />
                  ) : showSend ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  ) : (
                    <Heart size={18} fill="#ef4444" stroke="#ef4444" strokeWidth={1.5} style={{ transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
                  )}
                </Box>
              )}
            </Box>

            {audioUrl && !isRecording && (
              <Box mt={2} p={3} bg="rgba(255,255,255,0.05)" borderRadius="14px">
                <HStack spacing={3} align="center">
                  {isProcessing ? (
                    <HStack spacing={2}>
                      <Spinner size="sm" />
                      <Text fontSize="13px" color="whiteAlpha.700">Processing…</Text>
                    </HStack>
                  ) : (
                    <>
                      <audio controls style={{ maxWidth: '260px', height: '32px' }}>
                        <source src={audioUrl} type={audioBlob?.type || 'audio/webm'} />
                      </audio>
                      <IconButton
                        icon={<X size={14} />}
                        size="sm"
                        variant="ghost"
                        onClick={clearRecording}
                        aria-label="Remove audio"
                        color="red.400"
                        _hover={{ bg: 'rgba(239,68,68,0.12)' }}
                        borderRadius="full"
                      />
                    </>
                  )}
                </HStack>
              </Box>
            )}

            {(uploadingFiles?.length ?? 0) > 0 && (
              <Box mt={2} p={3} bg="rgba(255,255,255,0.05)" borderRadius="14px">
                <VStack spacing={3} align="stretch">
                  {(uploadingFiles ?? []).map((uploadingFile) => {
                    const progress = uploadProgress?.[uploadingFile.id] || 0
                    const isImage = uploadingFile.type === 'image'
                    const isAudio = uploadingFile.type === 'audio'
                    return (
                      <Box key={uploadingFile.id}>
                        <HStack spacing={2} mb={2} align="center">
                          {isAudio ? <Mic size={14} color="#60a5fa" /> : isImage ? <ImageIcon size={14} color="#34d399" /> : <File size={14} color="#a78bfa" />}
                          <Text fontSize="13px" fontWeight="500" flex={1} color="whiteAlpha.800" noOfLines={1}>
                            {isAudio ? 'Voice message' : isImage ? 'Image' : uploadingFile.name}
                          </Text>
                          <Text fontSize="12px" color="whiteAlpha.500">{progress}%</Text>
                        </HStack>
                        <Progress
                          value={progress}
                          colorScheme="brand"
                          size="xs"
                          borderRadius="full"
                          isAnimated
                          bg="rgba(255,255,255,0.08)"
                        />
                      </Box>
                    )
                  })}
                </VStack>
              </Box>
            )}

            {(selectedFiles?.length ?? 0) > 0 && (
              <HStack mt={2} spacing={2} flexWrap="wrap" px={1} maxW="100%" minW={0} overflow="hidden">
                {(selectedFiles ?? []).map((file, idx) => (
                  <Box
                    key={idx}
                    display="inline-flex"
                    alignItems="center"
                    gap="4px"
                    bg="rgba(96,165,250,0.12)"
                    border="1px solid rgba(96,165,250,0.25)"
                    borderRadius="8px"
                    px={2}
                    py="4px"
                  >
                    <Text fontSize="12px" color="#93c5fd" maxW="120px" noOfLines={1}>{file.name}</Text>
                    <Box
                      as="button"
                      onClick={() => removeFile(idx)}
                      color="rgba(255,255,255,0.6)"
                      _hover={{ color: 'white' }}
                      display="flex"
                      alignItems="center"
                    >
                      <X size={11} strokeWidth={2.5} />
                    </Box>
                  </Box>
                ))}
              </HStack>
            )}
          </Box>
        </Box>
      )}

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </Flex>
  )
}