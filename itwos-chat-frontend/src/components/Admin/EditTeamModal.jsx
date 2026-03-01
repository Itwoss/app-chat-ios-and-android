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
  Switch,
  useColorModeValue,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useUpdateTeamMutation } from '../../store/api/adminApi'
import FileUpload from './FileUpload'

const EditTeamModal = ({ isOpen, onClose, team, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    email: '',
    bio: '',
    linkedin: '',
    github: '',
    portfolio: '',
    isActive: true,
  })
  const [imageFile, setImageFile] = useState(null)
  const [existingImage, setExistingImage] = useState(null)
  const [errors, setErrors] = useState({})
  const toast = useToast()
  const [updateTeam, { isLoading }] = useUpdateTeamMutation()

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        role: team.role || '',
        email: team.email || '',
        bio: team.bio || '',
        linkedin: team.socialLinks?.linkedin || '',
        github: team.socialLinks?.github || '',
        portfolio: team.socialLinks?.portfolio || '',
        isActive: team.isActive !== undefined ? team.isActive : true,
      })
      setExistingImage(team.image || null)
    }
  }, [team])

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
      setExistingImage(null) // Clear existing image when new one is selected
    }
    setImageFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('role', formData.role)
      formDataToSend.append('email', formData.email || '')
      formDataToSend.append('bio', formData.bio || '')
      formDataToSend.append('isActive', formData.isActive)
      
      const socialLinks = {
        linkedin: formData.linkedin || '',
        github: formData.github || '',
        portfolio: formData.portfolio || '',
      }
      formDataToSend.append('socialLinks', JSON.stringify(socialLinks))
      
      if (imageFile) {
        formDataToSend.append('file', imageFile)
      }

      await updateTeam({ id: team._id, formData: formDataToSend }).unwrap()
      toast({
        title: 'Team member updated',
        description: 'Team member has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onSuccess()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to update team member',
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
        <ModalHeader flexShrink={0} px={{ base: 4, md: 6 }}>Edit Team Member</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <ModalBody overflowY="auto" px={{ base: 4, md: 6 }} flex="1" minH={0}>
            <VStack spacing={4} w="full" align="stretch">
              <FileUpload
                accept="image/*"
                value={imageFile || existingImage}
                onChange={handleImageChange}
                label="Profile Image"
                helperText="Upload a new profile picture or keep the existing one"
                maxSize={5}
              />

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Role</FormLabel>
                  <Input
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={3}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                <FormControl>
                  <FormLabel>LinkedIn</FormLabel>
                  <Input
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>GitHub</FormLabel>
                  <Input
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Portfolio</FormLabel>
                  <Input
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange}
                  />
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
              loadingText="Updating..."
              size={{ base: 'sm', md: 'md' }}
              w={{ base: 'full', sm: 'auto' }}
            >
              Update
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default EditTeamModal

