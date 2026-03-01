import { Box, HStack } from '@chakra-ui/react'
import { useSlideNavigator } from '../../contexts/SlideNavigatorContext'

/**
 * Centered dot indicator for Advanced Navbar Mode.
 * One dot per page; current page highlighted; dots update live during drag.
 */
export default function SlideDotIndicator() {
  const { currentIndex, totalPages, dragProgress } = useSlideNavigator()

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={1000}
      display="flex"
      justifyContent="center"
      pb={5}
      pointerEvents="none"
    >
      <HStack spacing={2}>
        {Array.from({ length: totalPages }, (_, i) => {
          let progress = 0
          if (i === currentIndex) {
            progress = 1 - Math.min(1, Math.abs(dragProgress))
          } else if (dragProgress > 0 && i === currentIndex + 1) {
            progress = Math.min(1, dragProgress)
          } else if (dragProgress < 0 && i === currentIndex - 1) {
            progress = Math.min(1, -dragProgress)
          }
          const isActive = i === currentIndex || progress > 0
          const scale = 0.5 + (isActive ? 0.5 + progress * 0.5 : 0)
          const opacity = isActive ? 0.5 + 0.5 * (i === currentIndex ? 1 - Math.abs(dragProgress) * 0.5 : progress) : 0.35

          return (
            <Box
              key={i}
              w="8px"
              h="8px"
              borderRadius="full"
              bg="white"
              transition="transform 0.15s ease, opacity 0.15s ease"
              transform={`scale(${scale})`}
              opacity={opacity}
              boxShadow="0 1px 3px rgba(0,0,0,0.3)"
            />
          )
        })}
      </HStack>
    </Box>
  )
}
