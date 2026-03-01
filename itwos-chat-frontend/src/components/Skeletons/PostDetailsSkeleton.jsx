import { Box, Skeleton, VStack, HStack } from '@chakra-ui/react'
import UserAvatarNameSkeleton from './UserAvatarNameSkeleton'

/**
 * Skeleton for single post detail view (sheet/modal): header + media + caption/actions.
 */
export default function PostDetailsSkeleton() {
  return (
    <VStack align="stretch" spacing={4} p={4}>
      <HStack justify="space-between">
        <UserAvatarNameSkeleton avatarSize="md" showSubtext={false} />
        <Skeleton height="32px" width="32px" borderRadius="md" />
      </HStack>
      <Skeleton
        height="min(70vh, 400px)"
        width="100%"
        borderRadius="lg"
        startColor="gray.200"
        endColor="gray.300"
        _dark={{ startColor: 'whiteAlpha.200', endColor: 'whiteAlpha.300' }}
      />
      <VStack align="stretch" spacing={2}>
        <Skeleton height="14px" width="90%" borderRadius="md" />
        <Skeleton height="14px" width="60%" borderRadius="md" />
      </VStack>
    </VStack>
  )
}
