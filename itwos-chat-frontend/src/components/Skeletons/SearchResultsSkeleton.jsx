import { VStack, Box } from '@chakra-ui/react'
import UserAvatarNameSkeleton from './UserAvatarNameSkeleton'

/**
 * Skeleton for search results: list of user/post-like rows.
 */
export default function SearchResultsSkeleton({ rows = 5 }) {
  return (
    <VStack spacing={3} align="stretch" py={4}>
      {Array.from({ length: rows }).map((_, i) => (
        <Box key={i} p={3}>
          <UserAvatarNameSkeleton avatarSize="md" showSubtext />
        </Box>
      ))}
    </VStack>
  )
}
