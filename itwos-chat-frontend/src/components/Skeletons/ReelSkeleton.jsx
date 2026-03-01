import { Box, Skeleton } from '@chakra-ui/react'

/**
 * Full-height reel/video post skeleton (for UserFeed vertical scroll).
 */
export default function ReelSkeleton() {
  return (
    <Box
      h="100dvh"
      minH="100dvh"
      w="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
    >
      <Skeleton
        height="100%"
        width="100%"
        maxH="100dvh"
        borderRadius={0}
        startColor="whiteAlpha.200"
        endColor="whiteAlpha.300"
      />
    </Box>
  )
}
