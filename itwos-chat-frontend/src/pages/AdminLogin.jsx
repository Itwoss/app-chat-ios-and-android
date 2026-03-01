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
import { useLoginAdminMutation } from '../store/api/adminApi'
import { setAdmin } from '../store/slices/adminSlice'
import { setAuthData } from '../utils/auth'

const AdminLogin = () => {
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
  const [loginAdmin, { isLoading }] = useLoginAdminMutation()

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
      const result = await loginAdmin(formData).unwrap()
      
      if (result.success) {
        // Store in localStorage as adminInfo
        setAuthData(result.data, 'admin')
        
        // Update Redux store
        dispatch(setAdmin(result.data))
        
        toast({
          title: 'Admin login successful',
          description: 'Welcome back!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        
        navigate('/admin/dashboard')
      }
    } catch (err) {
      const errorMessage = err?.data?.message || err?.message || 'Login failed. Please try again.'
      setError(errorMessage)
      toast({
        title: 'Login failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box as="main" minH="100vh" py={4}>
      <Container maxW="md" py={10}>
        <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
          <VStack spacing={6}>
            <VStack spacing={2}>
              <Heading size="lg">Admin Login</Heading>
              <Text fontSize="sm" color={textColor}>
                Access the admin dashboard
              </Text>
            </VStack>
            
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
                    placeholder="admin@example.com"
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
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="Logging in..."
                >
                  Login as Admin
                </Button>
              </VStack>
            </form>

            <VStack spacing={2}>
              <Text color={textColor} fontSize="sm">
                Not an admin?{' '}
                <Link as={RouterLink} to="/login" color="blue.500">
                  User Login
                </Link>
              </Text>
              <Text color={textColor} fontSize="sm">
                Don't have an account?{' '}
                <Link as={RouterLink} to="/register" color="blue.500">
                  Register here
                </Link>
              </Text>
            </VStack>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}

export default AdminLogin

