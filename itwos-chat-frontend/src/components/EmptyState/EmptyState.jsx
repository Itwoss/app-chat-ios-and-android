import {
  Box,
  VStack,
  Text,
  Button,
  useColorModeValue,
} from '@chakra-ui/react'

export const EmptyState = ({ 
  title = 'No data available',
  description = 'There is no data to display at the moment.',
  icon,
  actionLabel,
  onAction,
}) => {
  const textColor = useColorModeValue('gray.600', 'gray.400')

  return (
    <Box py={10} px={4}>
      <VStack spacing={4} textAlign="center">
        {icon && <Box fontSize="4xl">{icon}</Box>}
        <Text fontSize="lg" fontWeight="semibold">
          {title}
        </Text>
        <Text color={textColor} maxW="md">
          {description}
        </Text>
        {actionLabel && onAction && (
          <Button colorScheme="blue" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </VStack>
    </Box>
  )
}

