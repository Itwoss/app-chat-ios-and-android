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
  SimpleGrid,
  Select,
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { useRegisterUserMutation } from '../store/api/userApi'
import { setUser } from '../store/slices/userSlice'
import { setAuthData } from '../utils/auth'

const COUNTRY_CODES = [
  { value: '+1', label: '+1 (US/Canada)' },
  { value: '+44', label: '+44 (UK)' },
  { value: '+91', label: '+91 (India)' },
  { value: '+234', label: '+234 (Nigeria)' },
  { value: '+81', label: '+81 (Japan)' },
  { value: '+49', label: '+49 (Germany)' },
  { value: '+33', label: '+33 (France)' },
  { value: '+61', label: '+61 (Australia)' },
  { value: '+27', label: '+27 (South Africa)' },
  { value: '+254', label: '+254 (Kenya)' },
  { value: '+233', label: '+233 (Ghana)' },
  { value: '+255', label: '+255 (Tanzania)' },
  { value: '+256', label: '+256 (Uganda)' },
]

const Register = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryCode: '',
    phoneNumber: '',
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const toast = useToast()
  const [registerUser, { isLoading }] = useRegisterUserMutation()

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email'
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.countryCode) {
      newErrors.countryCode = 'Please select a country code'
    }

    if (!formData.phoneNumber || !/^\d{6,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 6-15 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      })
    }
  }

  const handleCountryCodeChange = (e) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, countryCode: value }))
    if (errors.countryCode) {
      setErrors((prev) => ({ ...prev, countryCode: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: 'Validation failed',
        description: 'Please fix the errors in the form',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
      const result = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        countryCode: formData.countryCode,
        phoneNumber: formData.phoneNumber,
      }).unwrap()

      if (result.success) {
        // Store in localStorage
        setAuthData(result.data, 'user')

        // Update Redux store
        dispatch(setUser(result.data))

        toast({
          title: 'Registration successful',
          description: 'Welcome! Your account has been created.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })

        navigate('/user/dashboard')
      }
    } catch (err) {
      const errorMessage = err?.data?.message || err?.message || 'Registration failed. Please try again.'
      const validationErrors = err?.data?.errors || []
      
      if (validationErrors.length > 0) {
        const formErrors = {}
        validationErrors.forEach((error) => {
          formErrors[error.param] = error.msg
        })
        setErrors(formErrors)
      }

      toast({
        title: 'Registration failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box as="main" minH="100vh" py={4}>
      <Container maxW="2xl" py={10}>
        <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
          <VStack spacing={6}>
            <Heading size="lg">Register</Heading>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <VStack spacing={4}>
                {/* Name and Email on same row */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <FormControl isRequired isInvalid={errors.name}>
                    <FormLabel>Name</FormLabel>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                    />
                    {errors.name && (
                      <Text fontSize="sm" color="red.500" mt={1}>
                        {errors.name}
                      </Text>
                    )}
                  </FormControl>

                  <FormControl isRequired isInvalid={errors.email}>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                    />
                    {errors.email && (
                      <Text fontSize="sm" color="red.500" mt={1}>
                        {errors.email}
                      </Text>
                    )}
                  </FormControl>
                </SimpleGrid>

                {/* Country Code and Phone Number on same row */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <FormControl isRequired isInvalid={errors.countryCode}>
                    <FormLabel>Country Code</FormLabel>
                    <Select
                      name="countryCode"
                      value={formData.countryCode || ''}
                      onChange={handleCountryCodeChange}
                      placeholder="Select country code"
                    >
                      {COUNTRY_CODES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </Select>
                    {errors.countryCode && (
                      <Text fontSize="sm" color="red.500" mt={1}>
                        {errors.countryCode}
                      </Text>
                    )}
                  </FormControl>

                  <FormControl isRequired isInvalid={errors.phoneNumber}>
                    <FormLabel>Phone Number</FormLabel>
                    <Input
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="1234567890"
                      type="tel"
                    />
                    {errors.phoneNumber && (
                      <Text fontSize="sm" color="red.500" mt={1}>
                        {errors.phoneNumber}
                      </Text>
                    )}
                  </FormControl>
                </SimpleGrid>

                {/* Password and Confirm Password on same row */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                  <FormControl isRequired isInvalid={errors.password}>
                    <FormLabel>Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
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
                    {errors.password && (
                      <Text fontSize="sm" color="red.500" mt={1}>
                        {errors.password}
                      </Text>
                    )}
                  </FormControl>

                  <FormControl isRequired isInvalid={errors.confirmPassword}>
                    <FormLabel>Confirm Password</FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                        pr="4.5rem"
                      />
                      <InputRightElement width="4.5rem">
                        <IconButton
                          h="1.75rem"
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          icon={showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        />
                      </InputRightElement>
                    </InputGroup>
                    {errors.confirmPassword && (
                      <Text fontSize="sm" color="red.500" mt={1}>
                        {errors.confirmPassword}
                      </Text>
                    )}
                  </FormControl>
                </SimpleGrid>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="Registering..."
                  mt={2}
                >
                  Register
                </Button>
              </VStack>
            </form>

            <Text color={textColor}>
              Already have an account?{' '}
              <Link as={RouterLink} to="/login" color="blue.500">
                Login here
              </Link>
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}

export default Register

