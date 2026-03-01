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
  Switch,
  Box,
  IconButton,
  Image,
  useColorModeValue,
  Select,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react'
import { Plus, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useUpdateProjectMutation, useDeleteProjectFileMutation } from '../../store/api/adminApi'
import { EmptyState } from '../EmptyState/EmptyState'
import MultiFileUpload from './MultiFileUpload'

const EditProjectModal = ({ isOpen, onClose, project, onSuccess, teams }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const [formData, setFormData] = useState({
    websiteTitle: '',
    link: '',
    description: '',
    techStack: [],
    teamMembers: [],
    isActive: true,
    status: 'planning',
    startDate: '',
    endDate: '',
  })
  const [techInput, setTechInput] = useState('')
  const [newFiles, setNewFiles] = useState([])
  const [existingFiles, setExistingFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [fileToDelete, setFileToDelete] = useState(null)
  const toast = useToast()
  const [updateProject, { isLoading }] = useUpdateProjectMutation()
  const [deleteProjectFile] = useDeleteProjectFileMutation()
  const { isOpen: isDeleteFileOpen, onOpen: onDeleteFileOpen, onClose: onDeleteFileClose } = useDisclosure()
  const cancelDeleteFileRef = useRef()

  useEffect(() => {
    if (project) {
      setFormData({
        websiteTitle: project.websiteTitle || '',
        link: project.link || '',
        description: project.description || '',
        techStack: project.techStack || [],
        teamMembers: project.teamMembers?.map(t => t._id || t) || [],
        isActive: project.isActive !== undefined ? project.isActive : true,
        status: project.status || 'planning',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      })
      setExistingFiles([...(project.images || []), ...(project.files || [])])
    }
  }, [project])

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

  const handleNewFilesChange = (files) => {
    // Validate file sizes
    const invalidFiles = files.filter(file => {
      if (file instanceof File || (file && file.size)) {
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

    if (files.length > 10) {
      toast({
        title: 'Too many files',
        description: 'Maximum 10 files allowed. Please remove some files.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setNewFiles(files)
  }

  const handleDeleteExistingFile = (fileUrl) => {
    setFileToDelete(fileUrl)
    onDeleteFileOpen()
  }

  const confirmDeleteFile = async () => {
    try {
      await deleteProjectFile({ projectId: project._id, fileUrl: fileToDelete }).unwrap()
      setExistingFiles(existingFiles.filter(f => f !== fileUrl))
      toast({
        title: 'File deleted',
        description: 'File has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to delete file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('websiteTitle', formData.websiteTitle)
      formDataToSend.append('link', formData.link)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('techStack', JSON.stringify(formData.techStack))
      formDataToSend.append('teamMembers', JSON.stringify(formData.teamMembers))
      formDataToSend.append('isActive', formData.isActive)
      formDataToSend.append('status', formData.status)
      if (formData.startDate) formDataToSend.append('startDate', formData.startDate)
      if (formData.endDate) formDataToSend.append('endDate', formData.endDate)
      
      // Append new files
      newFiles.forEach((file) => {
        formDataToSend.append('files', file)
      })

      await updateProject({ id: project._id, formData: formDataToSend }).unwrap()
      toast({
        title: 'Project updated',
        description: 'Project has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onSuccess()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to update project',
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
        <ModalHeader flexShrink={0}>Edit Project</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <ModalBody overflowY="auto" px={{ base: 4, md: 6 }} flex="1" minH={0}>
            <VStack spacing={4} w="full" align="stretch">
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Website Title</FormLabel>
                  <Input
                    name="websiteTitle"
                    value={formData.websiteTitle}
                    onChange={handleChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Website Link</FormLabel>
                  <Input
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
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
                    placeholder="Add technology"
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

              {/* Existing Files */}
              {existingFiles.length > 0 && (
                <FormControl>
                  <FormLabel>Existing Files</FormLabel>
                  <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                    {existingFiles.map((fileUrl, idx) => (
                      <Box key={idx} position="relative">
                        {fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <Image
                            src={fileUrl}
                            alt="Existing"
                            h="100px"
                            w="full"
                            objectFit="cover"
                            borderRadius="md"
                          />
                        ) : (
                          <Box
                            h="100px"
                            w="full"
                            bg={useColorModeValue('gray.100', 'gray.700')}
                            borderRadius="md"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text fontSize="xs">File</Text>
                          </Box>
                        )}
                        <IconButton
                          icon={<X size={12} />}
                          size="xs"
                          colorScheme="red"
                          position="absolute"
                          top={1}
                          right={1}
                          onClick={() => handleDeleteExistingFile(fileUrl)}
                          aria-label="Delete file"
                        />
                      </Box>
                    ))}
                  </SimpleGrid>
                </FormControl>
              )}

              <MultiFileUpload
                accept="image/*,application/pdf,.doc,.docx"
                value={newFiles}
                onChange={handleNewFilesChange}
                label="Add New Images & Files"
                helperText="Add more images or documents to the project"
                maxSize={10}
                maxFiles={10}
              />

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
          >
            <Button variant="ghost" mr={3} onClick={onClose} size={{ base: 'sm', md: 'md' }}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={isLoading}
              loadingText="Updating..."
              size={{ base: 'sm', md: 'md' }}
            >
              Update Project
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default EditProjectModal

