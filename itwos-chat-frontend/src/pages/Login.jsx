import {
  Box,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Button,
  Text,
  Link,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { useLoginUserMutation, userApi } from '../store/api/userApi'
import { setUser } from '../store/slices/userSlice'
import { setAuthData, setAuthToken } from '../utils/auth'
import { getApiUrl } from '../utils/apiUrl'
import { STORAGE_KEYS } from '../utils/storageKeys'

const Login = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()
  const [loginUser, { isLoading }] = useLoginUserMutation()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const result = await loginUser(formData).unwrap()
      const hasUserData = result?.data && (result.data.id || result.data._id)
      const isSuccess = result?.success === true || (hasUserData && result?.success !== false)

      if (result && isSuccess && hasUserData) {
        setAuthData(result.data, 'user')
        if (result.token) setAuthToken(result.token, 'user')
        dispatch(setUser(result.data))
        try {
          localStorage.setItem(STORAGE_KEYS.AUDIO_SOUND_ON, 'false')
        } catch (_) {}

        try {
          const fullUserResult = await dispatch(
            userApi.endpoints.getCurrentUser.initiate(undefined, { forceRefetch: true })
          ).unwrap()
          if (fullUserResult?.success && fullUserResult?.data) {
            setAuthData(fullUserResult.data, 'user')
            dispatch(setUser(fullUserResult.data))
          }
        } catch (fetchErr) {
          // Non-blocking: user is already logged in
        }

        toast({
          title: 'Login successful',
          description: 'Welcome back!',
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
        navigate('/user/home', { replace: true })
        return
      }

      const errorMessage = result?.message || 'Invalid response from server.'
      setError(errorMessage)
      toast({ title: 'Login failed', description: errorMessage, status: 'error', duration: 5000, isClosable: true })
    } catch (err) {
      const data = err?.data
      let errorMessage =
        data?.message ||
        (Array.isArray(data?.errors) && data.errors[0]?.msg) ||
        err?.message ||
        'Login failed. Please check your email and password and try again.'
      setError(errorMessage)
      toast({ title: 'Login failed', description: errorMessage, status: 'error', duration: 5000, isClosable: true })
    }
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Container maxW="md" py={10}>
        <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
          <VStack spacing={6}>
            <Heading size="lg">Login</Heading>
            
            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    autoComplete="username"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      pr="4.5rem"
                    />
                    <InputRightElement width="4.5rem">
                      <IconButton
                        h="1.75rem"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <Button
                  type="submit"
                  variant="primary"
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="Logging in..."
                >
                  Login
                </Button>
              </VStack>
            </form>

            <Text color={textColor}>
              Don't have an account?{' '}
              <Link as={RouterLink} to="/register" color="blue.500">
                Register here
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}

export default Login

