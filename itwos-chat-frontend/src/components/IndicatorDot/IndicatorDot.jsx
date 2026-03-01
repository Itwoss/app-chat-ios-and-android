import { Badge } from '@chakra-ui/react'

/** Small pill badge showing a count (e.g. notification indicator). */
export default function IndicatorDot({ count }) {
  if (count == null || count === 0) return null
  return (
    <Badge
      colorScheme="red"
      borderRadius="full"
      minW="5"
      h="5"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      fontSize="xs"
    >
      {count}
    </Badge>
  )
}
