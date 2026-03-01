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
  Textarea,
  useToast,
  SimpleGrid,
  Text,
  useColorModeValue
} from '@chakra-ui/react'
import { useState } from 'react'
import { useCreateTeamMutation } from '../../store/api/adminApi'
import FileUpload from './FileUpload'

const CreateTeamModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    bio: '',
    linkedin: '',
    github: '',
    portfolio: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [errors, setErrors] = useState({})
  const toast = useToast()
  const [createTeam, { isLoading }] = useCreateTeamMutation()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      })
    }
  }

  const handleImageChange = (file) => {
    if (file) {
      const fileSize = file.size / 1024 / 1024
      if (fileSize > 5) {
        toast({
          title: 'File size error',
          description: 'Image size must be less than 5MB',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
        return
      }
    }
    setImageFile(file)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('role', formData.role)
      if (formData.email) formDataToSend.append('email', formData.email)
      if (formData.bio) formDataToSend.append('bio', formData.bio)
      
      const socialLinks = {
        linkedin: formData.linkedin || '',
        github: formData.github || '',
        portfolio: formData.portfolio || '',
      }
      formDataToSend.append('socialLinks', JSON.stringify(socialLinks))
      
      if (imageFile) {
        formDataToSend.append('file', imageFile)
      }

      await createTeam(formDataToSend).unwrap()
      toast({
        title: 'Team member created',
        description: 'Team member has been created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      setFormData({
        name: '',
        role: '',
        email: '',
        bio: '',
        linkedin: '',
        github: '',
        portfolio: '',
      })
      setImageFile(null)
      setErrors({})
      onSuccess()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to create team member',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={{ base: 'full', sm: 'md', md: 'lg', lg: 'xl' }} 
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay />
      <ModalContent 
        maxW={{ base: '100%', sm: '90%', md: '600px', lg: '700px' }} 
        m={{ base: 0, sm: 'auto' }} 
        maxH={{ base: '100vh', md: '95vh' }}
        display="flex"
        flexDirection="column"
      >
        <ModalHeader flexShrink={0} px={{ base: 4, md: 6 }}>Add Team Member</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <ModalBody overflowY="auto" px={{ base: 4, md: 6 }} flex="1" minH={0}>
            <VStack spacing={4} w="full" align="stretch">
              <FileUpload
                accept="image/*"
                value={imageFile}
                onChange={handleImageChange}
                label="Profile Image"
                helperText="Upload a profile picture for the team member"
                maxSize={5}
              />

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} w="full">
                <FormControl isRequired isInvalid={errors.name}>
                  <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    size={{ base: 'sm', md: 'md' }}
                  />
                  {errors.name && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {errors.name}
                    </Text>
                  )}
                </FormControl>

                <FormControl isRequired isInvalid={errors.role}>
                  <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Role</FormLabel>
                  <Input
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="e.g., Frontend Developer"
                    size={{ base: 'sm', md: 'md' }}
                  />
                  {errors.role && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {errors.role}
                    </Text>
                  )}
                </FormControl>
              </SimpleGrid>

              <FormControl isInvalid={errors.email}>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Email</FormLabel>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                  size={{ base: 'sm', md: 'md' }}
                />
                {errors.email && (
                  <Text fontSize="xs" color="red.500" mt={1}>
                    {errors.email}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Bio</FormLabel>
                <Textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Short bio..."
                  rows={3}
                  size={{ base: 'sm', md: 'md' }}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4} w="full">
                <FormControl>
                  <FormLabel fontSize={{ base: 'sm', md: 'md' }}>LinkedIn</FormLabel>
                  <Input
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="LinkedIn URL"
                    size={{ base: 'sm', md: 'md' }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={{ base: 'sm', md: 'md' }}>GitHub</FormLabel>
                  <Input
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="GitHub URL"
                    size={{ base: 'sm', md: 'md' }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Portfolio</FormLabel>
                  <Input
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange}
                    placeholder="Portfolio URL"
                    size={{ base: 'sm', md: 'md' }}
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter 
            px={{ base: 4, md: 6 }} 
            pb={{ base: 4, md: 6 }} 
            pt={4}
            flexShrink={0}
            borderTop="1px"
            borderColor={useColorModeValue('gray.200', 'gray.600')}
            flexDirection={{ base: 'column', sm: 'row' }}
            gap={2}
          >
            <Button 
              variant="ghost" 
              onClick={onClose}
              size={{ base: 'sm', md: 'md' }}
              w={{ base: 'full', sm: 'auto' }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={isLoading}
              loadingText="Creating..."
              size={{ base: 'sm', md: 'md' }}
              w={{ base: 'full', sm: 'auto' }}
            >
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default CreateTeamModal

