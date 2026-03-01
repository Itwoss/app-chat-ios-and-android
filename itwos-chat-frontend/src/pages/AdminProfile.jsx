import {
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  useToast,
  Avatar,
  HStack,
  Divider,
  IconButton,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { Edit, X, Check, Eye, EyeOff } from 'lucide-react'
import { useGetCurrentAdminQuery, useUpdateAdminProfileMutation } from '../store/api/adminApi'
import { getAdminInfo, setAuthData } from '../utils/auth'
import AdminLayout from '../components/Admin/AdminLayout'
import FileUpload from '../components/Admin/FileUpload'

const AdminProfile = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  
  const { data: adminData, isLoading: adminLoading, refetch } = useGetCurrentAdminQuery()
  const [updateProfile, { isLoading }] = useUpdateAdminProfileMutation()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [profileImage, setProfileImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [existingImage, setExistingImage] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    // Only initialize once when adminData is first loaded
    const adminResponse = adminData?.data || (adminData?.success ? adminData.data : null)
    
    if (adminResponse && !isInitialized) {
      setFormData({
        name: adminResponse.name || '',
        email: adminResponse.email || '',
        password: '',
        confirmPassword: '',
      })
      setExistingImage(adminResponse.profileImage || null)
      setIsInitialized(true)
    } else if (!adminResponse && !isInitialized && !adminLoading) {
      // Fallback to localStorage if API data not available yet
      const adminInfo = getAdminInfo()
      if (adminInfo) {
        setFormData({
          name: adminInfo.name || '',
          email: adminInfo.email || '',
          password: '',
          confirmPassword: '',
        })
        setExistingImage(adminInfo.profileImage || null)
        setIsInitialized(true)
      }
    }
  }, [adminData, isInitialized, adminLoading])

  // Update form when adminData changes after successful update
  useEffect(() => {
    const adminResponse = adminData?.data || (adminData?.success ? adminData.data : null)
    if (adminResponse && isInitialized && !isEditing) {
      setFormData(prev => ({
        ...prev,
        name: adminResponse.name || prev.name,
        email: adminResponse.email || prev.email,
        password: '',
        confirmPassword: '',
      }))
      if (adminResponse.profileImage) {
        setExistingImage(adminResponse.profileImage)
      }
    }
  }, [adminData, isInitialized, isEditing])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleImageChange = (file) => {
    setProfileImage(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewImage(null)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    // Reset password fields when entering edit mode
    setFormData(prev => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }))
    setProfileImage(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset to original values
    const adminResponse = adminData?.data || (adminData?.success ? adminData.data : null)
    if (adminResponse) {
      setFormData({
        name: adminResponse.name || '',
        email: adminResponse.email || '',
        password: '',
        confirmPassword: '',
      })
    } else {
      const adminInfo = getAdminInfo()
      if (adminInfo) {
        setFormData({
          name: adminInfo.name || '',
          email: adminInfo.email || '',
          password: '',
          confirmPassword: '',
        })
      }
    }
    setProfileImage(null)
    setPreviewImage(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (formData.password && formData.password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters',
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
      }

      if (formData.password) {
        updateData.password = formData.password
      }

      if (profileImage) {
        updateData.file = profileImage
      }

      const result = await updateProfile(updateData).unwrap()
      
      if (result.data) {
        setAuthData(result.data, 'admin')
        setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: '',
        }))
        setProfileImage(null)
        // Update existing image if new one was uploaded
        if (result.data.profileImage) {
          setExistingImage(result.data.profileImage)
        }
        setIsEditing(false)
        // Trigger custom event to update AdminLayout
        window.dispatchEvent(new CustomEvent('adminInfoUpdated'))
        // Refetch to get latest data
        refetch()
        
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const displayData = (adminData?.success ? adminData.data : adminData?.data) || getAdminInfo() || {}
  const currentImage = profileImage ? URL.createObjectURL(profileImage) : existingImage

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="lg" mb={2}>
            Profile Settings
          </Heading>
          {!isEditing && (
            <Button
              leftIcon={<Edit size={18} />}
              colorScheme="brand"
              onClick={handleEdit}
            >
              Edit Profile
            </Button>
          )}
        </HStack>
        <Text color={textColor}>
          Manage your profile information and account settings.
        </Text>

        <Box
          bg={bgColor}
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          boxShadow="sm"
        >
          {isEditing ? (
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                <HStack justify="space-between" align="start">
                  <HStack spacing={6} align="start" flex="1">
                    <Avatar
                      size="xl"
                      src={previewImage || existingImage}
                      name={formData.name || 'Admin'}
                    />
                    <VStack align="start" flex="1">
                      <FormControl>
                        <FormLabel>Profile Image</FormLabel>
                        <FileUpload
                          accept="image/*"
                          value={profileImage}
                          onChange={handleImageChange}
                          label=""
                          helperText="Upload a profile picture"
                          maxSize={5}
                          existingImage={previewImage || existingImage}
                        />
                      </FormControl>
                    </VStack>
                  </HStack>
                  <IconButton
                    icon={<X size={18} />}
                    aria-label="Cancel"
                    onClick={handleCancel}
                    variant="ghost"
                    colorScheme="red"
                  />
                </HStack>

                <Divider />

                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    isDisabled={!isEditing}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    isDisabled={!isEditing}
                  />
                </FormControl>

                <Divider />

                <Text fontWeight="medium" fontSize="md">
                  Change Password (leave blank to keep current password)
                </Text>

                <FormControl>
                  <FormLabel>New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter new password"
                      isDisabled={!isEditing}
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
                        isDisabled={!isEditing}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel>Confirm New Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      isDisabled={!isEditing}
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
                        isDisabled={!isEditing}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <HStack justify="flex-end" spacing={3}>
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    isDisabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="brand"
                    isLoading={isLoading}
                    loadingText="Updating..."
                    leftIcon={<Check size={18} />}
                  >
                    Save Changes
                  </Button>
                </HStack>
              </VStack>
            </form>
          ) : (
            <VStack spacing={6} align="stretch">
              <HStack spacing={6} align="start">
                <Avatar
                  size="xl"
                  src={existingImage}
                  name={displayData.name || 'Admin'}
                />
                <VStack align="start" spacing={1} flex="1">
                  <Text fontWeight="bold" fontSize="xl">
                    {displayData.name || 'Admin'}
                  </Text>
                  <Text color={textColor} fontSize="sm">
                    {displayData.email || ''}
                  </Text>
                </VStack>
              </HStack>

              <Divider />

              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" color={textColor} mb={1}>
                    Name
                  </Text>
                  <Text fontWeight="medium">{displayData.name || 'N/A'}</Text>
                </Box>

                <Box>
                  <Text fontSize="sm" color={textColor} mb={1}>
                    Email
                  </Text>
                  <Text fontWeight="medium">{displayData.email || 'N/A'}</Text>
                </Box>
              </VStack>
            </VStack>
          )}
        </Box>
      </VStack>
    </AdminLayout>
  )
}

export default AdminProfile
