import { Box, Skeleton, SkeletonCircle, VStack, HStack } from '@chakra-ui/react'

/**
 * Skeleton for a feed post card: avatar + name row, media area, action line.
 * Use while post list is loading.
 */
export default function PostCardSkeleton({ borderRadius = '24px', fullWidth } = {}) {
  return (
    <Box
      p={fullWidth ? 0 : 2}
      mx={fullWidth ? 0 : 0}
      w={fullWidth ? '100%' : undefined}
      borderRadius={borderRadius}
    >
      <VStack align="stretch" spacing={3}>
        <HStack spacing={3} align="center">
          <SkeletonCircle size="10" />
          <VStack align="start" spacing={1} flex={1}>
            <Skeleton height="14px" width="120px" borderRadius="md" />
            <Skeleton height="10px" width="80px" borderRadius="md" />
          </VStack>
        </HStack>
        <Skeleton
          height="320px"
          width="100%"
          borderRadius="lg"
          startColor="gray.200"
          endColor="gray.300"
          _dark={{ startColor: 'whiteAlpha.200', endColor: 'whiteAlpha.300' }}
        />
        <HStack spacing={4}>
          <Skeleton height="20px" width="20px" borderRadius="md" />
          <Skeleton height="20px" width="20px" borderRadius="md" />
          <Skeleton height="20px" width="60px" borderRadius="md" />
        </HStack>
        <HStack spacing={2}>
          <Skeleton height="12px" width="100px" borderRadius="md" />
          <Skeleton height="12px" width="140px" borderRadius="md" />
        </HStack>
      </VStack>
    </Box>
  )
}
