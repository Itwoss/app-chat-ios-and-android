import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  IconButton,
  Select,
  useToast,
  SimpleGrid,
  Text,
  Switch,
  FormHelperText,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useUpdateUserMutation } from '../../store/api/adminApi'
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
  { value: '+256', label: '+256 (Uganda)' },
  { value: '+0', label: 'Other' },
]

const EditUserModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    countryCode: '',
    phoneNumber: '',
    role: 'user',
    isActive: true,
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const toast = useToast()
  const [updateUser, { isLoading }] = useUpdateUserMutation()

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        countryCode: user.countryCode || '',
        phoneNumber: user.phoneNumber || '',
        role: user.role || 'user',
        isActive: user.isActive !== undefined ? user.isActive : true,
      })
    }
  }, [user])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email'
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.countryCode && !formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required when country code is provided'
    }

    if (formData.phoneNumber && !/^\d{6,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 6-15 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      })
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
      const updateData = {
        name: formData.name,
        email: formData.email,
        countryCode: formData.countryCode,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        isActive: formData.isActive,
      }

      if (formData.password) {
        updateData.password = formData.password
      }

      await updateUser({ id: user._id, ...updateData }).unwrap()
      toast({
        title: 'User updated',
        description: 'User has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onSuccess()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to update user',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit User</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl isRequired isInvalid={errors.name}>
                  <FormLabel>Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full name"
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
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      {errors.email}
                    </Text>
                  )}
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl isInvalid={errors.countryCode}>
                  <FormLabel>Country Code</FormLabel>
                  <Select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
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

                <FormControl isInvalid={errors.phoneNumber}>
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

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl isInvalid={errors.password}>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current"
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
                  <FormHelperText>Leave blank to keep current password</FormHelperText>
                  {errors.password && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      {errors.password}
                    </Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel>Role</FormLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="isActive" mb="0">
                  Active Status
                </FormLabel>
                <Switch
                  id="isActive"
                  name="isActive"
                  isChecked={formData.isActive}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      isActive: e.target.checked,
                    })
                  }}
                  colorScheme="green"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={isLoading}
              loadingText="Updating..."
            >
              Update User
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default EditUserModal

