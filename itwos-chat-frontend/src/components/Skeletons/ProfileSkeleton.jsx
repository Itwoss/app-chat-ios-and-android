import { Box, Skeleton, SkeletonCircle, VStack, HStack } from '@chakra-ui/react'

/**
 * Skeleton for profile hero: avatar, name, subtitle, badge, stats row.
 * Use while profile or user data is loading.
 */
export default function ProfileSkeleton() {
  return (
    <Box p={{ base: 4, md: 6 }} borderRadius={{ base: 0, md: '16px' }}>
      <VStack align="stretch" spacing={4}>
        <HStack spacing={4} align="start">
          <SkeletonCircle size="20" />
          <VStack align="start" spacing={2} flex={1}>
            <HStack spacing={2}>
              <Skeleton height="24px" width="160px" borderRadius="md" />
            </HStack>
            <Skeleton height="14px" width="200px" borderRadius="md" />
            <Skeleton height="20px" width="70px" borderRadius="full" />
          </VStack>
        </HStack>
        <HStack spacing={6}>
          <Skeleton height="16px" width="60px" borderRadius="md" />
          <Skeleton height="16px" width="60px" borderRadius="md" />
          <Skeleton height="16px" width="50px" borderRadius="md" />
        </HStack>
        <Skeleton height="40px" width="100%" borderRadius="md" />
        <Skeleton height="14px" width="90%" borderRadius="md" />
        <Skeleton height="14px" width="70%" borderRadius="md" />
      </VStack>
    </Box>
  )
}
