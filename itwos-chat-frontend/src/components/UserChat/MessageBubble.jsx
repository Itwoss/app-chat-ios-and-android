import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Avatar,
  Portal,
  useColorModeValue,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Copy, Heart, Reply, Trash2 } from 'lucide-react'
import Lottie from 'lottie-react'
import catCryingAnimation from '../../assets/catCryingAnimation.json'

/**
 * Renders a single chat message bubble with reply quote, content, timestamp, status, and context menu.
 * Used by ChatConversation for each message in the list.
 */
const MessageBubble = ({
  msg,
  isOwn,
  showTimestamp = true,
  isFirstInGroup = true,
  isLastInGroup = true,
  showReadLabel = false,
  formattedTime = '',
  chatSettingsData,
  textColor,
  cardBg,
  onReply,
  onDeleteForMe,
  onDeleteForEveryone,
  renderMessageContent,
  isCryingMessage,
  messageInputRef,
  quickLikeFromMe,
  onEmojiReaction,
}) => {
  const fallbackOutgoing = useColorModeValue('brand.500', 'brand.400')
  const fallbackIncoming = useColorModeValue('#F1F1F1', 'gray.700')
  const timestampColor = useColorModeValue('gray.500', 'gray.400')
  const metaColor = isOwn ? 'whiteAlpha.800' : timestampColor
  const boxShadow = useColorModeValue(
    '0 1px 2px rgba(0,0,0,0.08)',
    '0 1px 2px rgba(0,0,0,0.25)'
  )

  // Instagram-style: gradient for outgoing (unless custom color), frosted glass for incoming
  const hasCustomOutgoingColor = chatSettingsData?.data?.outgoingBubbleColor
  const hasCustomIncomingColor = chatSettingsData?.data?.incomingBubbleColor
  
  const bubbleBg = isOwn
    ? (hasCustomOutgoingColor
        ? String(chatSettingsData.data.outgoingBubbleColor)
        : undefined) // Use gradient via sx prop
    : (hasCustomIncomingColor
        ? String(chatSettingsData.data.incomingBubbleColor)
        : undefined) // Use frosted glass via sx prop
  
  const bubbleTextColor = isOwn
    ? (chatSettingsData?.data?.outgoingTextColor || 'rgba(255,255,255,0.88)')
    : (chatSettingsData?.data?.incomingTextColor || 'rgba(0,0,0,0.85)')

  // Quick-like: ❤️ sent as reply → show as small reaction bubble, no quoted reply block
  const isQuickLike =
    msg.replyTo &&
    (String(msg.content || '').trim() === '❤️')

  // Instagram-style slide-to-reply
  const SWIPE_THRESHOLD = 56
  const MAX_DRAG = 80
  const [dragX, setDragX] = useState(0)
  const dragXRef = useRef(0)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const isGestureActiveRef = useRef(false)
  const slideWrapperRef = useRef(null)
  const rafIdRef = useRef(null)
  dragXRef.current = dragX

  // Long-press: show dropdown near the pressed message
  const [longPressOpen, setLongPressOpen] = useState(false)
  const [dropdownRect, setDropdownRect] = useState(null)
  const bubbleRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const longPressStartRef = useRef({ x: 0, y: 0 })
  const LONG_PRESS_MS = 500
  const LONG_PRESS_MOVE_THRESHOLD = 10

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const onLongPressStart = useCallback(
    (e) => {
      const x = getClientX(e)
      const y = getClientY(e)
      longPressStartRef.current = { x, y }
      clearLongPressTimer()
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null
        const rect = bubbleRef.current?.getBoundingClientRect?.()
        if (rect) {
          const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600
          const spaceAbove = rect.top
          const showBelow = spaceAbove < 120
          setDropdownRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom,
            showBelow,
          })
        }
        setLongPressOpen(true)
      }, LONG_PRESS_MS)
    },
    [clearLongPressTimer]
  )

  const onLongPressMove = useCallback(
    (e) => {
      const x = getClientX(e)
      const y = getClientY(e)
      const dx = x - longPressStartRef.current.x
      const dy = y - longPressStartRef.current.y
      if (Math.abs(dx) > LONG_PRESS_MOVE_THRESHOLD || Math.abs(dy) > LONG_PRESS_MOVE_THRESHOLD) {
        clearLongPressTimer()
      }
    },
    [clearLongPressTimer]
  )

  const onLongPressEnd = useCallback(() => {
    clearLongPressTimer()
  }, [clearLongPressTimer])

  const closeSheet = useCallback(() => {
    setLongPressOpen(false)
    setDropdownRect(null)
  }, [])

  useEffect(() => () => clearLongPressTimer(), [clearLongPressTimer])

  const getClientX = (e) => (e.touches ? e.touches[0].clientX : e.clientX)
  const getClientY = (e) => (e.touches ? e.touches[0].clientY : e.clientY)

  const onDragStart = useCallback(
    (e) => {
      startXRef.current = getClientX(e)
      startYRef.current = getClientY(e)
      if (e.touches) isGestureActiveRef.current = true
    },
    []
  )

  const onDragMove = useCallback(
    (e) => {
      const x = getClientX(e)
      const deltaX = x - startXRef.current
      const next = isOwn
        ? Math.min(0, Math.max(-MAX_DRAG, -deltaX))
        : Math.max(0, Math.min(MAX_DRAG, deltaX))
      dragXRef.current = next
      if (rafIdRef.current == null) {
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null
          setDragX(dragXRef.current)
        })
      }
    },
    [isOwn]
  )

  const onDragEnd = useCallback(() => {
    isGestureActiveRef.current = false
    const currentDrag = dragXRef.current
    if (Math.abs(currentDrag) >= SWIPE_THRESHOLD && onReply) {
      onReply(msg)
      messageInputRef?.current?.focus()
    }
    setDragX(0)
  }, [msg, onReply, messageInputRef])

  const onTouchEnd = useCallback(() => {
    onDragEnd()
  }, [onDragEnd])

  // Prevent page/list scroll when user is sliding the message (touchmove is passive by default, so use native listener)
  useEffect(() => {
    const el = slideWrapperRef.current
    if (!el) return
    const onTouchMove = (e) => {
      if (!isGestureActiveRef.current || !e.touches.length) return
      const x = e.touches[0].clientX
      const deltaX = x - startXRef.current
      if (Math.abs(deltaX) > 12) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => el.removeEventListener('touchmove', onTouchMove)
  }, [])

  useEffect(() => () => {
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current)
  }, [])

  const onMouseMove = useCallback(
    (e) => {
      e.preventDefault()
      onDragMove(e)
    },
    [onDragMove]
  )

  const onMouseUp = useCallback(() => {
    onDragEnd()
  }, [onDragEnd])

  const mouseListenersAdded = useRef(false)
  const addMouseListeners = useCallback(() => {
    if (mouseListenersAdded.current) return
    mouseListenersAdded.current = true
    const move = (e) => onMouseMove(e)
    const up = () => {
      onMouseUp()
      mouseListenersAdded.current = false
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [onMouseMove, onMouseUp])

  const replyStripColor = useColorModeValue('gray.400', 'gray.500')
  const replyStripPillBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.200')
  const messageSheetBg = useColorModeValue('gray.100', '#1c1c1e')
  const popoverHoverBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.100')
  const popoverBorderColor = useColorModeValue('gray.200', 'whiteAlpha.200')
  const popoverRedHoverBg = useColorModeValue('red.50', 'whiteAlpha.200')

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9, x: isOwn ? 20 : -20 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      transition={{
        duration: 0.25,
        type: 'spring',
        stiffness: 220,
        damping: 20,
      }}
      style={{
        display: 'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        width: '100%',
      }}
    >
    <Box
      display="flex"
      justifyContent={isOwn ? 'flex-end' : 'flex-start'}
      w="100%"
      px={2}
      position="relative"
      overflow="hidden"
    >
      {/* Reply strip — pill with Reply label (Instagram-style) */}
      <Box
        position="absolute"
        top={0}
        bottom={0}
        left={isOwn ? undefined : 0}
        right={isOwn ? 0 : undefined}
        w={`${MAX_DRAG}px`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        pointerEvents="none"
        opacity={Math.min(1, (Math.abs(dragX) / MAX_DRAG) * 1.2)}
        transition="opacity 0.1s ease-out"
      >
        <HStack
          spacing={1.5}
          bg={replyStripPillBg}
          px={2.5}
          py={1}
          borderRadius="full"
          color={replyStripColor}
        >
          <Reply size={18} strokeWidth={2} />
          <Text fontSize="xs" fontWeight="500">Reply</Text>
        </HStack>
      </Box>

      <Box
        ref={slideWrapperRef}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragX === 0 ? 'transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
          willChange: dragX !== 0 ? 'transform' : 'auto',
        }}
        onTouchStart={onDragStart}
        onTouchMove={onDragMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => {
          isGestureActiveRef.current = false
          if (rafIdRef.current != null) {
            cancelAnimationFrame(rafIdRef.current)
            rafIdRef.current = null
          }
          setDragX(0)
        }}
        onMouseDown={(e) => {
          if (e.button !== 0) return
          onDragStart(e)
          addMouseListeners()
        }}
        display="flex"
        justifyContent={isOwn ? 'flex-end' : 'flex-start'}
        w="100%"
      >
        <HStack
          spacing={isOwn ? 2 : isLastInGroup ? 2.5 : 2}
          align="flex-end"
          maxW={{ base: '82%', md: '65%' }}
          flexDirection={isOwn ? 'row-reverse' : 'row'}
        >
          {!isOwn && isLastInGroup && (
            <Avatar
              size="xs"
              name={msg.sender?.name}
              src={msg.sender?.profileImage}
              flexShrink={0}
              sx={{ width: '28px', height: '28px' }}
            />
          )}
        <VStack
          align={isOwn ? 'flex-end' : 'flex-start'}
          spacing={0}
          position="relative"
          maxW="100%"
        >
          {isOwn && isCryingMessage && isCryingMessage(msg.content) && (
            <Box
              position="absolute"
              top="-1px"
              right="10px"
              w="70px"
              h="70px"
              zIndex={10}
              pointerEvents="none"
            >
              <Lottie
                animationData={catCryingAnimation}
                loop
                autoplay
                style={{ width: '100%', height: '100%' }}
              />
            </Box>
          )}
          <HStack
            align="flex-end"
            spacing={2}
            justifyContent={isOwn ? 'flex-end' : 'flex-start'}
            maxW="100%"
          >
            {showTimestamp && isOwn && formattedTime && (
              <Text fontSize="10px" color={timestampColor} whiteSpace="nowrap">
                {formattedTime}
              </Text>
            )}
          <VStack align={isOwn ? 'flex-end' : 'flex-start'} spacing={1} maxW="100%">
            {msg.replyTo && !isQuickLike && (() => {
              const raw = msg.replyTo.content
              let quoteText = raw === 'This message was deleted' ? raw : (typeof raw === 'string' ? raw : '')
              if (quoteText && quoteText !== 'This message was deleted' && quoteText.length > 32) {
                const isAllHex = /^[a-f0-9:]+$/i.test(quoteText) && !/[\s.,!?'"]/.test(quoteText)
                const longHex = quoteText.match(/[a-f0-9]{48,}/gi)
                const mostlyHex = longHex && longHex.join('').length > quoteText.length * 0.5
                if (isAllHex || mostlyHex) quoteText = '[Message could not be decrypted]'
              }
              return (
                <Box
                  px={2.5}
                  py={1.5}
                  borderRadius="9999px"
                  maxW="100%"
                  bg={isOwn ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)'}
                  border="1px solid"
                  borderColor={isOwn ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)'}
                  color={bubbleTextColor}
                >
                  <HStack align="center" spacing={1.5}>
                    <Reply size={12} strokeWidth={2} opacity={0.85} />
                    <Text fontSize="xs" noOfLines={2} opacity={0.95}>
                      {quoteText}
                    </Text>
                  </HStack>
                </Box>
              )
            })()}
          <Box
            ref={bubbleRef}
            position="relative"
            bg={bubbleBg ?? (isOwn ? fallbackOutgoing : fallbackIncoming)}
            color={bubbleTextColor}
            px={isQuickLike ? 2 : 3}
            py={isQuickLike ? 1.5 : 2}
            borderRadius="9999px"
            maxW="100%"
            minW="auto"
            mt={isOwn && isCryingMessage && isCryingMessage(msg.content) ? '40px' : (isFirstInGroup && !msg.replyTo ? 0 : 1)}
            wordBreak="break-word"
            onContextMenu={(e) => e.preventDefault()}
            onTouchStart={onLongPressStart}
            onTouchMove={onLongPressMove}
            onTouchEnd={onLongPressEnd}
            onMouseDown={onLongPressStart}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
            sx={hasCustomOutgoingColor || hasCustomIncomingColor ? { boxShadow: boxShadow } : undefined}
          >
            <Box as="span" display="inline" maxW="100%">
              {renderMessageContent(msg)}
            </Box>
            {/* Heart reaction: consistent overlap at bubble corner */}
            {quickLikeFromMe && (
              <Box
                position="absolute"
                bottom="-6px"
                right={isOwn ? undefined : '-6px'}
                left={isOwn ? '-6px' : undefined}
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="22px"
                h="22px"
                borderRadius="full"
                bg="white"
                boxShadow="0 1px 3px rgba(0,0,0,0.2)"
                sx={{
                  animation: 'heartReactionIn 0.25s ease-out',
                  '@keyframes heartReactionIn': {
                    '0%': { opacity: 0, transform: 'scale(0.3)' },
                    '60%': { opacity: 1, transform: 'scale(1.15)' },
                    '100%': { opacity: 1, transform: 'scale(1)' },
                  },
                }}
              >
                <Heart size={12} fill="#ef4444" stroke="#ef4444" strokeWidth={1.5} />
              </Box>
            )}
          </Box>
            {isOwn && showReadLabel && (msg.status === 'read' || msg.isRead) && (
              <Text fontSize="10px" opacity={0.85} mt={0.5} alignSelf="flex-end">
                Read
              </Text>
            )}
          </VStack>
            {showTimestamp && !isOwn && formattedTime && (
              <Text fontSize="10px" color={timestampColor} whiteSpace="nowrap">
                {formattedTime}
              </Text>
            )}
          </HStack>
          {longPressOpen && (
            <Portal>
              <Box
                position="fixed"
                inset={0}
                bg="blackAlpha.500"
                backdropFilter="blur(4px)"
                zIndex={9998}
                onClick={closeSheet}
                aria-hidden
              />
              <Box
                position="fixed"
                minW="160px"
                borderRadius="14px"
                bg="rgba(30, 30, 30, 0.95)"
                _dark={{ bg: 'rgba(20, 20, 20, 0.98)' }}
                backdropFilter="blur(20px)"
                boxShadow="0 8px 30px rgba(0,0,0,0.3)"
                zIndex={9999}
                py="6px"
                onClick={(e) => e.stopPropagation()}
                style={
                  dropdownRect
                    ? (() => {
                        const popWidth = 180
                        const winW = typeof window !== 'undefined' ? window.innerWidth : 400
                        let x = dropdownRect.left + dropdownRect.width / 2
                        if (x < popWidth / 2) x = popWidth / 2
                        if (x > winW - popWidth / 2) x = winW - popWidth / 2
                        const gap = 10
                        const showBelow = dropdownRect.showBelow === true
                        const topPx = showBelow ? dropdownRect.bottom + gap : dropdownRect.top - gap
                        const transform = showBelow
                          ? 'translate(-50%, 0)'
                          : 'translate(-50%, -100%)'
                        return {
                          left: x,
                          top: topPx,
                          transform,
                        }
                      })()
                    : { left: 0, top: 0, visibility: 'hidden' }
                }
              >
                <Box
                  sx={{
                    animation: 'contextPopoverPopIn 0.15s ease-out',
                    '@keyframes contextPopoverPopIn': {
                      from: { opacity: 0, transform: 'scale(0.95)' },
                      to: { opacity: 1, transform: 'scale(1)' },
                    },
                  }}
                >
                {msg.content !== 'This message was deleted' && (
                  <Box
                    as="button"
                    w="100%"
                    textAlign="left"
                    py="10px"
                    px={4}
                    fontSize="14px"
                    fontWeight="normal"
                    color="white"
                    whiteSpace="nowrap"
                    _hover={{ bg: 'rgba(255,255,255,0.08)' }}
                    _active={{ bg: 'rgba(255,255,255,0.12)' }}
                    display="flex"
                    alignItems="center"
                    gap={3}
                    onClick={() => {
                      onReply(msg)
                      messageInputRef?.current?.focus()
                      closeSheet()
                    }}
                  >
                    <Reply size={16} opacity={0.9} />
                    Reply
                  </Box>
                )}
                {msg.content && msg.content !== 'This message was deleted' && typeof msg.content === 'string' && (
                  <Box
                    as="button"
                    w="100%"
                    textAlign="left"
                    py="10px"
                    px={4}
                    fontSize="14px"
                    fontWeight="normal"
                    color="white"
                    whiteSpace="nowrap"
                    _hover={{ bg: 'rgba(255,255,255,0.08)' }}
                    _active={{ bg: 'rgba(255,255,255,0.12)' }}
                    display="flex"
                    alignItems="center"
                    gap={3}
                    onClick={() => {
                      try {
                        navigator.clipboard?.writeText(msg.content)
                      } catch (_) {}
                      closeSheet()
                    }}
                  >
                    <Copy size={16} opacity={0.9} />
                    Copy
                  </Box>
                )}
                <Box
                  as="button"
                  w="100%"
                  textAlign="left"
                  py="10px"
                  px={4}
                  fontSize="14px"
                  fontWeight="normal"
                  color="#ff4d4f"
                  whiteSpace="nowrap"
                  _hover={{ bg: 'rgba(255,255,255,0.08)' }}
                  _active={{ bg: 'rgba(255,255,255,0.12)' }}
                  display="flex"
                  alignItems="center"
                  gap={3}
                  onClick={() => {
                    onDeleteForMe(msg)
                    closeSheet()
                  }}
                >
                  <Trash2 size={16} />
                  Delete for me
                </Box>
                {isOwn && (
                  <Box
                    as="button"
                    w="100%"
                    textAlign="left"
                    py="10px"
                    px={4}
                    fontSize="14px"
                    fontWeight="normal"
                    color="#ff4d4f"
                    whiteSpace="nowrap"
                    _hover={{ bg: 'rgba(255,255,255,0.08)' }}
                    _active={{ bg: 'rgba(255,255,255,0.12)' }}
                    display="flex"
                    alignItems="center"
                    gap={3}
                    onClick={() => {
                      onDeleteForEveryone(msg)
                      closeSheet()
                    }}
                  >
                    <Trash2 size={16} />
                    Delete for everyone
                  </Box>
                )}
                </Box>
              </Box>
            </Portal>
          )}
        </VStack>
      </HStack>
      </Box>
    </Box>
    </motion.div>
  )
}

export default MessageBubble
