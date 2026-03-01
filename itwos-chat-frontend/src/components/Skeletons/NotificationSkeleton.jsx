import { Box, Skeleton, HStack, VStack } from '@chakra-ui/react'

/**
 * Skeleton for a single notification row (icon + title + message).
 */
export function NotificationItemSkeleton() {
  return (
    <Box p={4} borderRadius={{ base: '12px', md: '16px' }}>
      <HStack spacing={3} align="start">
        <Skeleton height="32px" width="32px" borderRadius="md" flexShrink={0} />
        <VStack align="start" spacing={2} flex={1}>
          <Skeleton height="14px" width="70%" borderRadius="md" />
          <Skeleton height="12px" width="100%" borderRadius="md" />
          <Skeleton height="10px" width="100px" borderRadius="md" />
        </VStack>
      </HStack>
    </Box>
  )
}

/**
 * List of notification skeletons.
 */
export default function NotificationSkeleton({ count = 5 }) {
  return (
    <VStack spacing={3} align="stretch">
      {Array.from({ length: count }).map((_, i) => (
        <NotificationItemSkeleton key={i} />
      ))}
    </VStack>
  )
}
