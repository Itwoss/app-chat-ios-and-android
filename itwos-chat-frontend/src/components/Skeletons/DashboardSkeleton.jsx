import { Box, Skeleton, VStack, HStack, SimpleGrid } from '@chakra-ui/react'
import UserAvatarNameSkeleton from './UserAvatarNameSkeleton'

/**
 * Skeleton for dashboard: welcome card (avatar + text) + stats grid + content.
 */
export default function DashboardSkeleton() {
  return (
    <VStack spacing={6} align="stretch">
      <Box p={6} borderRadius="20px">
        <HStack spacing={4} align="center">
          <UserAvatarNameSkeleton avatarSize="xl" showSubtext />
          <VStack align="start" spacing={2} flex={1}>
            <Skeleton height="20px" width="220px" borderRadius="md" />
            <Skeleton height="14px" width="180px" borderRadius="md" />
          </VStack>
        </HStack>
      </Box>
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height="80px" borderRadius="16px" />
        ))}
      </SimpleGrid>
      <Skeleton height="200px" width="100%" borderRadius="16px" />
      <Skeleton height="120px" width="100%" borderRadius="16px" />
    </VStack>
  )
}
