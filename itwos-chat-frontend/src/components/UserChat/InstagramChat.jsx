import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Avatar,
  Portal,
  IconButton,
  Textarea,
  Center,
  useColorModeValue,
} from '@chakra-ui/react'
import { Check, CheckCheck, Copy, Heart, Reply, Trash2, Send } from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toDate(v) {
  if (!v) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}
function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}
function formatTime(dateStr) {
  const d = toDate(dateStr)
  return d ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''
}
function formatDateDivider(dateStr) {
  const d = toDate(dateStr)
  if (!d) return ''
  const now = new Date()
  const msgKey = dayKey(d)
  if (msgKey === dayKey(now)) return 'Today'
  const yest = new Date(now)
  yest.setDate(yest.getDate() - 1)
  if (msgKey === dayKey(yest)) return 'Yesterday'
  const diffMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round(diffMs / 86_400_000)
  if (diffDays < 7) return d.toLocaleDateString(undefined, { weekday: 'long' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined })
}
function shouldShowTimestamp(prev, curr) {
  if (!prev) return true
  const p = toDate(prev.createdAt || prev.timestamp)
  const c = toDate(curr.createdAt || curr.timestamp)
  if (!p || !c) return true
  if (c.getTime() - p.getTime() > 5 * 60 * 1000) return true
  if (dayKey(c) !== dayKey(p)) return true
  return false
}
function formatMessageTimestamp(dateStr) {
  const d = toDate(dateStr)
  if (!d) return ''
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const now = new Date()
  if (dayKey(d) === dayKey(now)) return timeStr
  const yest = new Date(now)
  yest.setDate(yest.getDate() - 1)
  if (dayKey(d) === dayKey(yest)) return `Yesterday ${timeStr}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

// ─── Bubble (grouped radius, gradient/frosted, avatar on last, receipts, heart, long-press) ─
function InstaBubble({
  msg,
  isOwn,
  showTimestamp,
  isFirstInGroup,
  isLastInGroup,
  formattedTime,
  hasHeartReaction,
  onReply,
  onCopy,
  onDelete,
  showAvatar,
  otherUser,
}) {
  const bubbleRef = useRef(null)
  const [longPressOpen, setLongPressOpen] = useState(false)
  const [menuRect, setMenuRect] = useState(null)
  const longPressTimer = useRef(null)
  const startPos = useRef({ x: 0, y: 0 })
  const MOVE_THRESHOLD = 12
  const LONG_PRESS_MS = 500

  const getBubbleRadius = () => {
    if (isOwn) {
      if (isFirstInGroup && isLastInGroup) return '18px 18px 4px 18px'
      if (isFirstInGroup && !isLastInGroup) return '18px 18px 4px 4px'
      if (!isFirstInGroup && isLastInGroup) return '4px 18px 4px 18px'
      return '4px 4px 4px 4px'
    }
    if (isFirstInGroup && isLastInGroup) return '18px 18px 18px 4px'
    if (isFirstInGroup && !isLastInGroup) return '18px 18px 4px 4px'
    if (!isFirstInGroup && isLastInGroup) return '4px 18px 18px 4px'
    return '4px 4px 4px 4px'
  }

  const getStatusIcon = () => {
    if (!isOwn) return null
    const status = msg.status || 'sent'
    const size = 10
    if (status === 'read') return <CheckCheck size={size} style={{ color: '#4FC3F7' }} />
    if (status === 'delivered') return <CheckCheck size={size} style={{ color: 'rgba(255,255,255,0.7)' }} />
    return <Check size={size} style={{ color: 'rgba(255,255,255,0.7)' }} />
  }

  const clearTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const onLongPressStart = useCallback((e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX
    const y = e.touches ? e.touches[0].clientY : e.clientY
    startPos.current = { x, y }
    clearTimer()
    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null
      const rect = bubbleRef.current?.getBoundingClientRect?.()
      if (rect) {
        const showBelow = rect.top < 180
        setMenuRect({ ...rect, showBelow })
      }
      setLongPressOpen(true)
    }, LONG_PRESS_MS)
  }, [clearTimer])

  const onLongPressMove = useCallback((e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX
    const y = e.touches ? e.touches[0].clientY : e.clientY
    if (Math.abs(x - startPos.current.x) > MOVE_THRESHOLD || Math.abs(y - startPos.current.y) > MOVE_THRESHOLD) clearTimer()
  }, [clearTimer])

  const onLongPressEnd = useCallback(() => clearTimer(), [clearTimer])

  useEffect(() => () => clearTimer(), [clearTimer])

  const menuBg = useColorModeValue('white', '#2a2a2e')
  const menuBorder = useColorModeValue('gray.200', 'whiteAlpha.200')
  const menuItemHover = useColorModeValue('gray.50', 'whiteAlpha.100')
  const menuItemDangerHover = useColorModeValue('red.50', 'red.900')

  return (
    <Box display="flex" justifyContent={isOwn ? 'flex-end' : 'flex-start'} w="100%" px={2} position="relative">
      <HStack spacing={2} align="flex-end" maxW={{ base: '82%', md: '65%' }} flexDirection={isOwn ? 'row-reverse' : 'row'}>
        {!isOwn && (showAvatar ? <Avatar size="sm" name={otherUser?.name} src={otherUser?.avatar} flexShrink={0} /> : <Box w="32px" flexShrink={0} />)}
        <VStack align={isOwn ? 'flex-end' : 'flex-start'} spacing={0}>
          <Box
            ref={bubbleRef}
            position="relative"
            px={3}
            py={2}
            borderRadius={getBubbleRadius()}
            maxW="100%"
            mt={isFirstInGroup ? 0 : 1}
            wordBreak="break-word"
            onContextMenu={(e) => e.preventDefault()}
            onTouchStart={onLongPressStart}
            onTouchMove={onLongPressMove}
            onTouchEnd={onLongPressEnd}
            onMouseDown={onLongPressStart}
            onMouseUp={onLongPressEnd}
            onMouseLeave={onLongPressEnd}
            sx={{
              background: isOwn
                ? 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #F77737 100%)'
                : 'rgba(255,255,255,0.08)',
              color: isOwn ? '#fff' : 'rgba(255,255,255,0.95)',
              backdropFilter: isOwn ? 'none' : 'blur(12px)',
              border: isOwn ? 'none' : '1px solid rgba(255,255,255,0.06)',
              boxShadow: isOwn ? '0 2px 8px rgba(131,58,180,0.35)' : '0 1px 3px rgba(0,0,0,0.2)',
            }}
          >
            {msg.replyTo && (
              <Box borderLeft="3px solid" borderColor={isOwn ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'} pl={2} mb={1} fontSize="xs" opacity={0.95}>
                <Text fontWeight="600" noOfLines={1}>{msg.replyTo.senderName || 'Unknown'}</Text>
                <Text noOfLines={2}>{msg.replyTo.content || ''}</Text>
              </Box>
            )}
            <Text fontSize="sm" whiteSpace="pre-wrap">{msg.content || ''}</Text>
            {((showTimestamp && formattedTime) || isOwn) && (
              <HStack mt={1} justify="flex-end" align="center" spacing={1} fontSize="10px" color={isOwn ? 'whiteAlpha.800' : 'whiteAlpha.600'}>
                {showTimestamp && formattedTime && <Text whiteSpace="nowrap">{formattedTime}</Text>}
                {getStatusIcon()}
              </HStack>
            )}
            {hasHeartReaction && (
              <Box
                position="absolute"
                bottom="-6px"
                right={isOwn ? undefined : '-6px'}
                left={isOwn ? '-6px' : undefined}
                w="22px"
                h="22px"
                borderRadius="full"
                bg="white"
                boxShadow="0 1px 3px rgba(0,0,0,0.2)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                sx={{
                  '@keyframes heartIn': { '0%': { opacity: 0, transform: 'scale(0.3)' }, '60%': { transform: 'scale(1.15)' }, '100%': { opacity: 1, transform: 'scale(1)' } },
                  animation: 'heartIn 0.25s ease-out',
                }}
              >
                <Heart size={12} fill="#ef4444" stroke="#ef4444" strokeWidth={1.5} />
              </Box>
            )}
          </Box>
        </VStack>
      </HStack>

      {longPressOpen && menuRect && (
        <Portal>
          <Box position="fixed" inset={0} bg="blackAlpha.500" backdropFilter="blur(4px)" onClick={() => setLongPressOpen(false)} zIndex={9998} />
          <Box
            position="fixed"
            left={menuRect.left}
            top={menuRect.showBelow ? menuRect.bottom + 8 : undefined}
            bottom={menuRect.showBelow ? undefined : typeof window !== 'undefined' ? window.innerHeight - menuRect.top + 8 : undefined}
            minW="160px"
            bg={menuBg}
            borderRadius="12px"
            boxShadow="lg"
            border="1px solid"
            borderColor={menuBorder}
            py={1}
            zIndex={9999}
          >
            <HStack as="button" w="100%" px={3} py={2} _hover={{ bg: menuItemHover }} onClick={() => { onReply?.(msg); setLongPressOpen(false); }}>
              <Reply size={16} /><Text fontSize="sm">Reply</Text>
            </HStack>
            <HStack as="button" w="100%" px={3} py={2} _hover={{ bg: menuItemHover }} onClick={() => { onCopy?.(msg); setLongPressOpen(false); }}>
              <Copy size={16} /><Text fontSize="sm">Copy</Text>
            </HStack>
            <HStack as="button" w="100%" px={3} py={2} _hover={{ bg: menuItemDangerHover }} color="red.500" onClick={() => { onDelete?.(msg); setLongPressOpen(false); }}>
              <Trash2 size={16} /><Text fontSize="sm">Delete</Text>
            </HStack>
          </Box>
        </Portal>
      )}
    </Box>
  )
}

// ─── Swipeable row (swipe to reply) ───────────────────────────────────────────
function SwipeableRow({ children, onSwipeReply, isOwn }) {
  const ref = useRef(null)
  const startX = useRef(0)
  const dragging = useRef(false)
  const [dragX, setDragX] = useState(0)
  const dragXRef = useRef(0)
  const THRESHOLD = 50
  const MAX = 80
  dragXRef.current = dragX

  const getX = (e) => e.touches ? e.touches[0].clientX : e.clientX

  const onStart = useCallback((e) => {
    startX.current = getX(e)
    dragging.current = true
  }, [])

  const onMove = useCallback((e) => {
    if (!dragging.current) return
    const x = e.touches ? e.touches[0].clientX : e.clientX
    const dx = x - startX.current
    const v = isOwn ? Math.min(0, Math.max(-MAX, -dx)) : Math.max(0, Math.min(MAX, dx))
    setDragX(v)
  }, [isOwn])

  const onEnd = useCallback(() => {
    const cur = dragXRef.current
    setDragX(0)
    dragging.current = false
    if (Math.abs(cur) >= THRESHOLD) onSwipeReply?.()
  }, [onSwipeReply])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prevent = (e) => { if (dragging.current && e.touches?.length && Math.abs(e.touches[0].clientX - startX.current) > 10) e.preventDefault() }
    el.addEventListener('touchmove', prevent, { passive: false })
    return () => el.removeEventListener('touchmove', prevent)
  }, [])

  const onMouseDown = useCallback((e) => {
    if (e.button !== 0) return
    onStart(e)
    const move = (ev) => onMove(ev)
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      const cur = dragXRef.current
      setDragX(0)
      dragging.current = false
      if (Math.abs(cur) >= THRESHOLD) onSwipeReply?.()
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [onStart, onMove, onSwipeReply])

  return (
    <Box ref={ref} position="relative" overflow="hidden" onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onMouseDown={onMouseDown}>
      <Box style={{ transform: `translateX(${dragX}px)`, transition: dragX === 0 ? 'transform 0.25s ease-out' : 'none' }}>
        {children}
      </Box>
      <Center position="absolute" top={0} bottom={0} left={isOwn ? undefined : 0} right={isOwn ? 0 : undefined} w={`${MAX}px`} pointerEvents="none" opacity={Math.min(1, Math.abs(dragX) / MAX)}>
        <HStack bg="rgba(255,255,255,0.15)" px={2.5} py={1} borderRadius="full" color="white" fontSize="xs">
          <Reply size={16} /><Text>Reply</Text>
        </HStack>
      </Center>
    </Box>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const MY_ID = 'me'
const OTHER_ID = 'other'
const OTHER_USER = { name: 'Alex', avatar: '' }

const INITIAL_MESSAGES = [
  { id: '1', senderId: OTHER_ID, content: 'Hey! How are you?', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), status: 'read' },
  { id: '2', senderId: MY_ID, content: 'Doing great, thanks!', createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), status: 'read' },
  { id: '3', senderId: OTHER_ID, content: 'Want to grab coffee tomorrow?', createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(), status: 'read' },
  { id: '4', senderId: OTHER_ID, content: 'Same place as last time', createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(), status: 'read' },
  { id: '5', senderId: MY_ID, content: 'Sure, 10am?', createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), status: 'read' },
  { id: '6', senderId: OTHER_ID, content: 'Perfect 👋', createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000 + 1 * 60 * 1000).toISOString(), status: 'read' },
]

export default function InstagramChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [typing, setTyping] = useState(false)
  const [heartOnMessageId, setHeartOnMessageId] = useState(null) // which message has a heart reaction from me
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  const displayList = useMemo(() => {
    const sorted = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    let lastDay = null
    const out = []
    sorted.forEach((msg, i) => {
      const d = toDate(msg.createdAt)
      if (d) {
        const dk = dayKey(d)
        if (dk !== lastDay) {
          out.push({ type: 'divider', id: `d-${dk}`, date: msg.createdAt })
          lastDay = dk
        }
      }
      const prev = sorted[i - 1]
      const next = sorted[i + 1]
      const senderId = msg.senderId || msg.sender?._id
      const prevSender = prev ? (prev.senderId || prev.sender?._id) : null
      const nextSender = next ? (next.senderId || next.sender?._id) : null
      out.push({
        type: 'message',
        msg,
        showTimestamp: shouldShowTimestamp(prev, msg),
        isFirstInGroup: prevSender !== senderId,
        isLastInGroup: nextSender !== senderId,
      })
    })
    return out
  }, [messages])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text && !replyTo) return
    const content = text || '❤️'
    const replyPayload = replyTo ? { senderName: replyTo.senderName || OTHER_USER.name, content: replyTo.content, _id: replyTo.id } : undefined
    const newMsg = {
      id: `m-${Date.now()}`,
      senderId: MY_ID,
      content,
      replyTo: replyPayload,
      createdAt: new Date().toISOString(),
      status: 'sent',
    }
    setMessages((m) => [...m, newMsg])
    setInput('')
    setReplyTo(null)
    if (content === '❤️' && replyTo?.id) setHeartOnMessageId(replyTo.id)
    // Simulated reply after 1–2s
    setTimeout(() => {
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        setMessages((m) => [
          ...m,
          {
            id: `m-${Date.now()}-bot`,
            senderId: OTHER_ID,
            content: 'Got it! 👍',
            createdAt: new Date().toISOString(),
            status: 'read',
          },
        ])
      }, 800 + Math.random() * 700)
    }, 600)
  }, [input, replyTo])

  const handleCopy = useCallback((msg) => {
    if (msg?.content && navigator?.clipboard) navigator.clipboard.writeText(msg.content)
  }, [])
  const handleDelete = useCallback((msg) => {
    setMessages((m) => m.filter((x) => x.id !== msg.id))
  }, [])

  const hasText = input.trim().length > 0
  const footerBg = '#0a0a0a'
  const messagesBg = '#121212'

  return (
    <Box h="100%" display="flex" flexDir="column" bg={messagesBg}>
      {/* Messages area */}
      <Box ref={scrollRef} flex={1} overflowY="auto" overflowX="hidden" py={3} px={1}>
        {displayList.map((item) => {
          if (item.type === 'divider') {
            return (
              <Center key={item.id} py={2}>
                <Text fontSize="xs" color="whiteAlpha.600">{formatDateDivider(item.date)}</Text>
              </Center>
            )
          }
          const { msg, showTimestamp, isFirstInGroup, isLastInGroup } = item
          const isOwn = (msg.senderId || msg.sender?._id) === MY_ID
          return (
            <SwipeableRow key={msg.id} onSwipeReply={() => setReplyTo({ id: msg.id, content: msg.content, senderName: isOwn ? 'You' : OTHER_USER.name })} isOwn={isOwn}>
              <Box py={0.5}>
                <InstaBubble
                  msg={{ ...msg, replyTo: msg.replyTo ? { senderName: msg.replyTo.senderName, content: msg.replyTo.content } : undefined }}
                  isOwn={isOwn}
                  showTimestamp={showTimestamp}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  formattedTime={formatMessageTimestamp(msg.createdAt)}
                  hasHeartReaction={heartOnMessageId === msg.id}
                  onReply={(m) => setReplyTo({ id: m.id, content: m.content, senderName: isOwn ? 'You' : OTHER_USER.name })}
                  onCopy={handleCopy}
                  onDelete={handleDelete}
                  showAvatar={!isOwn && isLastInGroup}
                  otherUser={OTHER_USER}
                />
              </Box>
            </SwipeableRow>
          )
        })}

        {/* Typing indicator */}
        {typing && (
          <Box mt={2} pl={2}>
            <HStack spacing={2} align="center">
              <Avatar size="sm" name={OTHER_USER.name} src={OTHER_USER.avatar} />
              <Box bg="rgba(255,255,255,0.08)" px={3} py="6px" borderRadius="18px" borderBottomLeftRadius="4px">
                <HStack spacing="4px">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <Box
                      key={i}
                      w="5px"
                      h="5px"
                      bg="rgba(255,255,255,0.5)"
                      borderRadius="full"
                      sx={{ '@keyframes bounce': { '0%,60%,100%': { transform: 'translateY(0)' }, '30%': { transform: 'translateY(-4px)' } }, animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${d}s` }}
                    />
                  ))}
                </HStack>
              </Box>
            </HStack>
          </Box>
        )}
        <Box h={2} />
      </Box>

      {/* Swipe-to-reply preview bar */}
      {replyTo && (
        <HStack px={3} py={2} bg="rgba(0,0,0,0.3)" borderTop="1px solid rgba(255,255,255,0.06)" spacing={2}>
          <Reply size={16} color="#9ca3af" />
          <VStack align="flex-start" spacing={0} flex={1} minW={0}>
            <Text fontSize="xs" color="whiteAlpha.700">Replying to {replyTo.senderName}</Text>
            <Text fontSize="sm" noOfLines={1}>{replyTo.content}</Text>
          </VStack>
          <IconButton size="sm" variant="ghost" aria-label="Cancel reply" onClick={() => setReplyTo(null)}><Text>✕</Text></IconButton>
        </HStack>
      )}

      {/* Footer input */}
      <Box px={3} py={2} pb="calc(10px + env(safe-area-inset-bottom))" bg={footerBg} borderTop="1px solid rgba(255,255,255,0.06)">
        <HStack spacing={2} align="flex-end">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message..."
            size="sm"
            minH="40px"
            maxH="120px"
            resize="none"
            borderRadius="20px"
            bg="rgba(255,255,255,0.08)"
            border="1px solid rgba(255,255,255,0.08)"
            color="white"
            _placeholder={{ color: 'whiteAlpha.500' }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <IconButton
            size="lg"
            borderRadius="full"
            aria-label={hasText ? 'Send' : 'Send heart'}
            icon={hasText ? <Send size={20} /> : <Text fontSize="xl">❤️</Text>}
            onClick={handleSend}
            colorScheme={hasText ? 'brand' : undefined}
            bg={hasText ? 'linear-gradient(135deg, #833AB4, #FD1D1D)' : 'transparent'}
            _hover={hasText ? {} : { bg: 'whiteAlpha.200' }}
          />
        </HStack>
      </Box>
    </Box>
  )
}
