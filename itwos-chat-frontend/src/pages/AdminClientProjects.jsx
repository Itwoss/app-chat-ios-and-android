import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  IconButton,
  useDisclosure,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spinner,
  Center,
  useColorModeValue,
  Text,
  VStack,
  Heading,
  Avatar,
  Tooltip,
  Progress,
} from '@chakra-ui/react'
import { Search, Eye, Trash2, Edit } from 'lucide-react'
import { useState, useRef } from 'react'
import { useGetAllClientProjectsQuery, useDeleteClientProjectMutation } from '../store/api/adminApi'
import { useDebounce } from '../hooks/useDebounce'
import { EmptyState } from '../components/EmptyState/EmptyState'
import AdminLayout from '../components/Admin/AdminLayout'
import { useNavigate } from 'react-router-dom'

const AdminClientProjects = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  const navigate = useNavigate()
  
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteProjectId, setDeleteProjectId] = useState(null)
  
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = useRef()

  const { data, isLoading, error, refetch } = useGetAllClientProjectsQuery({
    page,
    limit: 10,
    search: debouncedSearch,
    status: statusFilter,
  })

  const [deleteProject] = useDeleteClientProjectMutation()

  const handleView = (project) => {
    navigate(`/admin/client-projects/${project._id}`)
  }

  const handleEdit = (project) => {
    navigate(`/admin/client-projects/${project._id}/edit`)
  }

  const handleDelete = (projectId) => {
    setDeleteProjectId(projectId)
    onDeleteOpen()
  }

  const confirmDelete = async () => {
    try {
      await deleteProject(deleteProjectId).unwrap()
      toast({
        title: 'Project deleted',
        description: 'Client project has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onDeleteClose()
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to delete project',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'green'
      case 'in-progress':
        return 'blue'
      case 'review':
        return 'purple'
      case 'testing':
        return 'orange'
      case 'on-hold':
        return 'yellow'
      case 'cancelled':
        return 'red'
      case 'planning':
      default:
        return 'gray'
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

  if (error) {
    return (
      <AdminLayout>
        <Center minH="400px">
          <Text color="red.500">Error loading client projects</Text>
        </Center>
      </AdminLayout>
    )
  }

  const projects = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Heading size="lg">Client Projects</Heading>
        </Flex>

        <Box
          bg={bgColor}
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            mb={6}
            flexWrap="wrap"
          >
            <InputGroup flex={{ base: '1', md: '0 1 300px' }}>
              <InputLeftElement pointerEvents="none">
                <Search size={18} color="gray" />
              </InputLeftElement>
              <Input
                placeholder="Search by project title or description..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value)
                  setPage(1)
                }}
              />
            </InputGroup>

            <Select
              placeholder="All Statuses"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              w={{ base: '100%', md: '200px' }}
            >
              <option value="planning">Planning</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="testing">Testing</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </Flex>

          {projects.length === 0 ? (
            <EmptyState
              title="No client projects found"
              description="There are no client projects to display."
            />
          ) : (
            <>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Client</Th>
                      <Th>Project Title</Th>
                      <Th>Type</Th>
                      <Th>Status</Th>
                      <Th>Progress</Th>
                      <Th>Deadline</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {projects.map((project) => (
                      <Tr key={project._id}>
                        <Td>
                          <HStack spacing={2}>
                            <Avatar
                              size="sm"
                              name={project.userId?.name || 'User'}
                              src={project.userId?.profileImage || undefined}
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium" fontSize="sm">
                                {project.userId?.name || 'N/A'}
                              </Text>
                              <Text fontSize="xs" color={textColor}>
                                {project.userId?.email || 'N/A'}
                              </Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                            {project.projectTitle || 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {project.projectType || 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1} w="150px">
                            <Progress
                              value={project.progress || 0}
                              colorScheme="brand"
                              size="sm"
                              w="full"
                              borderRadius="md"
                            />
                            <Text fontSize="xs" color={textColor}>
                              {project.progress || 0}%
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          {project.deadline ? (
                            <Text fontSize="sm">
                              {new Date(project.deadline).toLocaleDateString()}
                            </Text>
                          ) : (
                            <Text fontSize="sm" color={textColor}>Not set</Text>
                          )}
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Tooltip label="View Details">
                              <IconButton
                                icon={<Eye size={16} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => handleView(project)}
                                aria-label="View project"
                              />
                            </Tooltip>
                            <Tooltip label="Edit">
                              <IconButton
                                icon={<Edit size={16} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="green"
                                onClick={() => handleEdit(project)}
                                aria-label="Edit project"
                              />
                            </Tooltip>
                            <Tooltip label="Delete">
                              <IconButton
                                icon={<Trash2 size={16} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDelete(project._id)}
                                aria-label="Delete project"
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>

              {pagination.pages > 1 && (
                <Flex justify="space-between" align="center" mt={4} flexWrap="wrap" gap={4}>
                  <Text fontSize="sm" color={textColor}>
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} projects
                  </Text>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      isDisabled={pagination.page === 1}
                      colorScheme="brand"
                    >
                      Previous
                    </Button>
                    <Text fontSize="sm">
                      Page {pagination.page} of {pagination.pages}
                    </Text>
                    <Button
                      size="sm"
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      isDisabled={pagination.page === pagination.pages}
                      colorScheme="brand"
                    >
                      Next
                    </Button>
                  </HStack>
                </Flex>
              )}
            </>
          )}
        </Box>
      </VStack>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Client Project
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure? You can't undo this action afterwards.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AdminLayout>
  )
}

export default AdminClientProjects

