/**
 * Extracted presentational pieces for ChatConversation.
 * Reduces ChatConversation.jsx size and keeps bubble/UI components in one place.
 */

import { Box, VStack, HStack, Text, Flex, Image, List, ListItem, IconButton } from '@chakra-ui/react'
import { ExternalLink, X } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

// ─── Rich Card Bubble ────────────────────────────────────────────────────────

export function RichCardBubble({ imageUrl, title, description, buttonLabel, buttonUrl, items = [] }) {
  return (
    <Box
      maxW="280px"
      borderRadius="20px"
      overflow="hidden"
      bg="gray.800"
      boxShadow="0 2px 12px rgba(0,0,0,0.3)"
    >
      {imageUrl && (
        <Box w="100%" h="150px" overflow="hidden">
          <Image src={imageUrl} alt="" w="100%" h="100%" objectFit="cover" />
        </Box>
      )}
      <VStack align="stretch" p={3} spacing={1.5}>
        {title && (
          <Text fontWeight="700" fontSize="sm" color="white" lineHeight="tight">
            {title}
          </Text>
        )}
        {description && (
          <Text fontSize="xs" color="gray.400" noOfLines={2}>
            {description}
          </Text>
        )}
        {items?.length > 0 && (
          <List spacing={0} fontSize="xs" color="gray.400" pl={2} listStyleType="disc">
            {items.slice(0, 4).map((item, i) => (
              <ListItem key={i}>{item}</ListItem>
            ))}
          </List>
        )}
        {buttonLabel && buttonUrl && (
          <Box
            as="a"
            href={buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1.5}
            mt={1}
            py={2}
            px={3}
            borderRadius="12px"
            bg="whiteAlpha.100"
            color="white"
            fontSize="sm"
            fontWeight="600"
            _hover={{ bg: 'whiteAlpha.200' }}
            transition="background 0.15s"
          >
            {buttonLabel}
            <ExternalLink size={13} />
          </Box>
        )}
      </VStack>
    </Box>
  )
}

// ─── Image Grid Bubble ────────────────────────────────────────────────────────

export function ImageGridBubble({ attachments }) {
  const count = attachments.length
  if (count === 1) {
    return (
      <Box borderRadius="18px" overflow="hidden" maxW="240px">
        <Image src={attachments[0].url} alt="" w="100%" objectFit="cover" />
      </Box>
    )
  }
  const visible = Math.min(count, 4)
  const extra = count > 4 ? count - 3 : 0
  return (
    <Box
      display="grid"
      gridTemplateColumns="1fr 1fr"
      gap="2px"
      borderRadius="18px"
      overflow="hidden"
      w="220px"
      h={count === 2 ? '150px' : '220px'}
    >
      {attachments.slice(0, visible).map((img, i) => {
        const isOverlay = extra > 0 && i === 3
        return (
          <Box key={i} position="relative" overflow="hidden">
            <Image src={img.url} alt="" w="100%" h="100%" objectFit="cover" />
            {isOverlay && (
              <>
                <Box position="absolute" inset={0} bg="blackAlpha.700" />
                <Flex position="absolute" inset={0} align="center" justify="center" color="white" fontSize="xl" fontWeight="bold">
                  +{extra}
                </Flex>
              </>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

// ─── Animated Message Bubble ─────────────────────────────────────────────────

export function AnimatedBubble({ children }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <Box
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
        transition: 'opacity 0.28s cubic-bezier(0.34,1.56,0.64,1), transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {children}
    </Box>
  )
}

// ─── Date Divider ─────────────────────────────────────────────────────────────

export function DateDivider({ label }) {
  return (
    <Flex align="center" justify="center" py={3} px={4}>
      <Text
        fontSize="11px"
        fontWeight="600"
        color="whiteAlpha.500"
        letterSpacing="0.04em"
        bg="whiteAlpha.50"
        px={3}
        py={0.5}
        borderRadius="full"
      >
        {label}
      </Text>
    </Flex>
  )
}

// ─── Reply preview (above input) ─────────────────────────────────────────────
// previewText: already resolved (replyContentPreview(content) or 'Attachment')

export function ReplyPreview({ replyToMessage, previewText, onCancel }) {
  const isDeleted = replyToMessage?.content === 'This message was deleted'
  return (
    <Box
      mb={2}
      mx={1}
      borderRadius="14px"
      overflow="hidden"
      bg="rgba(255,255,255,0.06)"
      border="1px solid rgba(255,255,255,0.1)"
      backdropFilter="blur(8px)"
    >
      <HStack spacing={0} align="stretch">
        <Box w="3px" bg="linear-gradient(180deg, #3b82f6, #8b5cf6)" flexShrink={0} />
        <VStack align="start" spacing={0} flex={1} px={3} py="8px" minW={0}>
          <Text fontSize="12px" fontWeight="700" color="#60a5fa" letterSpacing="0.01em">
            {replyToMessage?.sender?.name || 'Unknown'}
          </Text>
          <Text fontSize="12px" color="rgba(255,255,255,0.6)" noOfLines={1} mt="1px">
            {isDeleted ? '🚫 This message was deleted' : (previewText || 'Attachment')}
          </Text>
        </VStack>
        <IconButton
          icon={<X size={14} />}
          size="xs"
          variant="ghost"
          aria-label="Cancel reply"
          color="rgba(255,255,255,0.6)"
          _hover={{ color: 'white', bg: 'rgba(255,255,255,0.1)' }}
          borderRadius="full"
          m={1}
          alignSelf="center"
          onClick={onCancel}
        />
      </HStack>
    </Box>
  )
}
