import { HStack, Skeleton, SkeletonCircle, VStack } from '@chakra-ui/react'

/**
 * Skeleton for user avatar + name (e.g. in post header, dashboard welcome, list item).
 */
export default function UserAvatarNameSkeleton({ avatarSize = 'md', showSubtext = true }) {
  const sizeMap = { sm: 8, md: 10, lg: 12, xl: 16 }
  const s = sizeMap[avatarSize] || 10
  return (
    <HStack spacing={3}>
      <SkeletonCircle size={s} />
      <VStack align="start" spacing={1}>
        <Skeleton height="14px" width="100px" borderRadius="md" />
        {showSubtext && (
          <Skeleton height="10px" width="70px" borderRadius="md" />
        )}
      </VStack>
    </HStack>
  )
}
