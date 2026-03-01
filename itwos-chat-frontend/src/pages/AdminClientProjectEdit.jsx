import {
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Box,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  HStack,
  Divider,
  Select,
  Textarea,
  Progress,
  SimpleGrid,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useGetClientProjectByIdQuery, useUpdateClientProjectMutation } from '../store/api/adminApi'
import AdminLayout from '../components/Admin/AdminLayout'

const AdminClientProjectEdit = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()

  const { data, isLoading, error } = useGetClientProjectByIdQuery(id)
  const [updateProject, { isLoading: isUpdating }] = useUpdateClientProjectMutation()

  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    status: 'planning',
    progress: 0,
    adminNotes: '',
    deadline: '',
  })

  useEffect(() => {
    if (data?.success && data.data) {
      const project = data.data
      setFormData({
        projectTitle: project.projectTitle || '',
        description: project.description || '',
        status: project.status || 'planning',
        progress: project.progress || 0,
        adminNotes: project.adminNotes || '',
        deadline: project.deadline
          ? new Date(project.deadline).toISOString().split('T')[0]
          : '',
      })
    }
  }, [data])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'progress' ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const updateData = {
        ...formData,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
      }

      await updateProject({ id, ...updateData }).unwrap()

      toast({
        title: 'Project updated',
        description: 'Project has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      navigate(`/admin/client-projects/${id}`)
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

  if (isLoading) {
    return (
      <AdminLayout>
        <Center minH="400px">
          <Spinner size="xl" colorScheme="brand" />
        </Center>
      </AdminLayout>
    )
  }

  if (error || !data?.success) {
    return (
      <AdminLayout>
        <Center minH="400px">
          <Text color="red.500">Error loading project</Text>
        </Center>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <HStack>
          <Button
            leftIcon={<ArrowLeft size={18} />}
            variant="ghost"
            onClick={() => navigate(`/admin/client-projects/${id}`)}
          >
            Back to View
          </Button>
        </HStack>

        <Box
          bg={bgColor}
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <Heading size="lg" mb={6}>
            Edit Client Project
          </Heading>

          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch">
              <FormControl isRequired>
                <FormLabel>Project Title</FormLabel>
                <Input
                  name="projectTitle"
                  value={formData.projectTitle}
                  onChange={handleChange}
                  placeholder="Enter project title"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter project description"
                  rows={4}
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="testing">Testing</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Progress (%)</FormLabel>
                  <Input
                    type="number"
                    name="progress"
                    value={formData.progress}
                    onChange={handleChange}
                    min={0}
                    max={100}
                  />
                  <Progress
                    value={formData.progress}
                    colorScheme="brand"
                    size="sm"
                    mt={2}
                    borderRadius="md"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Deadline</FormLabel>
                <Input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Admin Notes</FormLabel>
                <Textarea
                  name="adminNotes"
                  value={formData.adminNotes}
                  onChange={handleChange}
                  placeholder="Add internal notes about this project..."
                  rows={4}
                />
              </FormControl>

              <Divider />

              <HStack justify="flex-end" spacing={3}>
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/admin/client-projects/${id}`)}
                  isDisabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="brand"
                  leftIcon={<Save size={18} />}
                  isLoading={isUpdating}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </HStack>
            </VStack>
          </form>
        </Box>
      </VStack>
    </AdminLayout>
  )
}

export default AdminClientProjectEdit

