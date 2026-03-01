import { 
  Box, 
  Button, 
  Heading, 
  Text, 
  VStack, 
  useColorModeValue,
  Container 
} from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { clearUser } from '../../store/slices/userSlice'
import { clearAdmin } from '../../store/slices/adminSlice'
import { clearAuthData } from '../../utils/auth'

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const headingColor = useColorModeValue('gray.800', 'white')
  const pageBg = useColorModeValue('gray.50', 'gray.900')

  const handleLogout = () => {
    // Clear all auth data
    clearAuthData()
    dispatch(clearUser())
    dispatch(clearAdmin())
    
    // Reset error boundary
    if (resetErrorBoundary) {
      resetErrorBoundary()
    }
    
    // Navigate to login
    navigate('/login', { replace: true })
  }

  return (
    <Box
      role="alert"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={pageBg}
      p={4}
    >
      <Container maxW="md">
        <VStack
          spacing={6}
          w="full"
          p={8}
          bg={bgColor}
          borderRadius="lg"
          boxShadow="xl"
          textAlign="center"
        >
          <Heading size="xl" color="red.500">
            Authentication Error
          </Heading>
          <Text color={textColor} fontSize="md" lineHeight="tall">
            {error?.message || 'Your session has expired or you are not authenticated. Please login again.'}
          </Text>
          <Button
            colorScheme="blue"
            onClick={handleLogout}
            size="lg"
            w="full"
            mt={4}
          >
            Go to Login
          </Button>
        </VStack>
      </Container>
    </Box>
  )
}

export default ErrorFallback

