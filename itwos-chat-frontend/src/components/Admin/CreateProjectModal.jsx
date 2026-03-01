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
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Checkbox,
  CheckboxGroup,
  Stack,
  HStack,
  useColorModeValue,
  Select,
} from '@chakra-ui/react'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useCreateProjectMutation } from '../../store/api/adminApi'
import { EmptyState } from '../EmptyState/EmptyState'
import MultiFileUpload from './MultiFileUpload'

const CreateProjectModal = ({ isOpen, onClose, onSuccess, teams }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const [formData, setFormData] = useState({
    websiteTitle: '',
    link: '',
    description: '',
    techStack: [],
    teamMembers: [],
    status: 'planning',
    startDate: '',
    endDate: '',
  })
  const [techInput, setTechInput] = useState('')
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const toast = useToast()
  const [createProject, { isLoading }] = useCreateProjectMutation()

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

  const handleTechStackAdd = () => {
    if (techInput.trim() && !formData.techStack.includes(techInput.trim())) {
      setFormData({
        ...formData,
        techStack: [...formData.techStack, techInput.trim()],
      })
      setTechInput('')
    }
  }

  const handleTechStackRemove = (tech) => {
    setFormData({
      ...formData,
      techStack: formData.techStack.filter((t) => t !== tech),
    })
  }

  const handleTeamMembersChange = (selectedIds) => {
    setFormData({
      ...formData,
      teamMembers: selectedIds,
    })
  }

  const handleFilesChange = (newFiles) => {
    // Validate file sizes
    const invalidFiles = newFiles.filter(file => {
      if (file && file.size) {
        const fileSize = file.size / 1024 / 1024
        return fileSize > 10
      }
      return false
    })

    if (invalidFiles.length > 0) {
      toast({
        title: 'File size error',
        description: 'Some files are larger than 10MB. Please select smaller files.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (newFiles.length > 10) {
      toast({
        title: 'Too many files',
        description: 'Maximum 10 files allowed. Please remove some files.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setFiles(newFiles)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.websiteTitle.trim()) {
      newErrors.websiteTitle = 'Website title is required'
    }

    if (!formData.link.trim()) {
      newErrors.link = 'Link is required'
    } else if (!/^https?:\/\/.+/.test(formData.link)) {
      newErrors.link = 'Please provide a valid URL'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
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
      formDataToSend.append('websiteTitle', formData.websiteTitle)
      formDataToSend.append('link', formData.link)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('techStack', JSON.stringify(formData.techStack))
      formDataToSend.append('teamMembers', JSON.stringify(formData.teamMembers))
      formDataToSend.append('status', formData.status)
      if (formData.startDate) formDataToSend.append('startDate', formData.startDate)
      if (formData.endDate) formDataToSend.append('endDate', formData.endDate)
      
      // Append all files
      files.forEach((file) => {
        formDataToSend.append('files', file)
      })

      await createProject(formDataToSend).unwrap()
      toast({
        title: 'Project created',
        description: 'Project has been created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      setFormData({
        websiteTitle: '',
        link: '',
        description: '',
        techStack: [],
        teamMembers: [],
        status: 'planning',
        startDate: '',
        endDate: '',
      })
      setTechInput('')
      setFiles([])
      setErrors({})
      onSuccess()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to create project',
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
      size={{ base: 'full', md: 'xl', lg: '2xl' }} 
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay />
      <ModalContent 
        maxW={{ base: '100%', md: '600px', lg: '900px' }} 
        m={{ base: 0, md: 'auto' }} 
        maxH={{ base: '100vh', md: '95vh' }}
        display="flex"
        flexDirection="column"
      >
        <ModalHeader flexShrink={0}>Create New Project</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <ModalBody overflowY="auto" px={{ base: 4, md: 6 }} flex="1" minH={0}>
            <VStack spacing={4} w="full" align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl isRequired isInvalid={errors.websiteTitle}>
                  <FormLabel>Website Title</FormLabel>
                  <Input
                    name="websiteTitle"
                    value={formData.websiteTitle}
                    onChange={handleChange}
                    placeholder="Project name"
                  />
                  {errors.websiteTitle && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      {errors.websiteTitle}
                    </Text>
                  )}
                </FormControl>

                <FormControl isRequired isInvalid={errors.link}>
                  <FormLabel>Website Link</FormLabel>
                  <Input
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                  {errors.link && (
                    <Text fontSize="sm" color="red.500" mt={1}>
                      {errors.link}
                    </Text>
                  )}
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired isInvalid={errors.description}>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Project description..."
                  rows={4}
                />
                {errors.description && (
                  <Text fontSize="sm" color="red.500" mt={1}>
                    {errors.description}
                  </Text>
                )}
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>End Date</FormLabel>
                  <Input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Tech Stack</FormLabel>
                <HStack>
                  <Input
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleTechStackAdd()
                      }
                    }}
                    placeholder="Add technology (e.g., React, Node.js)"
                  />
                  <Button onClick={handleTechStackAdd} leftIcon={<Plus size={16} />}>
                    Add
                  </Button>
                </HStack>
                {formData.techStack.length > 0 && (
                  <Wrap mt={2}>
                    {formData.techStack.map((tech, idx) => (
                      <WrapItem key={idx}>
                        <Tag size="md" colorScheme="brand">
                          <TagLabel>{tech}</TagLabel>
                          <TagCloseButton onClick={() => handleTechStackRemove(tech)} />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}
              </FormControl>

              <FormControl>
                <FormLabel>Team Members</FormLabel>
                {teams && Array.isArray(teams) && teams.length > 0 ? (
                  <CheckboxGroup
                    value={formData.teamMembers}
                    onChange={handleTeamMembersChange}
                  >
                    <Stack spacing={2} maxH="150px" overflowY="auto">
                      {teams.map((team) => (
                        <Checkbox key={team._id} value={team._id}>
                          {team.name} - {team.role}
                        </Checkbox>
                      ))}
                    </Stack>
                  </CheckboxGroup>
                ) : (
                  <EmptyState
                    title="No team members available"
                    description="Create team members first to assign them to projects."
                  />
                )}
              </FormControl>

              <MultiFileUpload
                accept="image/*,application/pdf,.doc,.docx"
                value={files}
                onChange={handleFilesChange}
                label="Images & Files"
                helperText="Upload images, documents, or other project files"
                maxSize={10}
                maxFiles={10}
              />
            </VStack>
          </ModalBody>

          <ModalFooter 
            px={{ base: 4, md: 6 }} 
            pb={{ base: 4, md: 6 }} 
            pt={4}
            flexShrink={0}
            borderTop="1px"
            borderColor={useColorModeValue('gray.200', 'gray.600')}
          >
            <Button variant="ghost" mr={3} onClick={onClose} size={{ base: 'sm', md: 'md' }}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={isLoading}
              loadingText="Creating..."
              size={{ base: 'sm', md: 'md' }}
            >
              Create Project
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default CreateProjectModal

