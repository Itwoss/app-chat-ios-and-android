import {
  Box,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Image,
  Badge,
  IconButton,
  useDisclosure,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
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
  VStack,
  Link,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { Search, Plus, Edit, Trash2, ExternalLink, FolderKanban, Eye } from 'lucide-react'
import { useState, useRef } from 'react'
import { useGetAllProjectsQuery, useDeleteProjectMutation } from '../../store/api/adminApi'
import { useGetAllTeamsQuery } from '../../store/api/adminApi'
import { useDebounce } from '../../hooks/useDebounce'
import CreateProjectModal from './CreateProjectModal'
import EditProjectModal from './EditProjectModal'
import ViewProjectModal from './ViewProjectModal'
import { EmptyState } from '../EmptyState/EmptyState'

const ProjectsManagement = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [selectedProject, setSelectedProject] = useState(null)
  const [deleteProjectId, setDeleteProjectId] = useState(null)
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const cancelRef = useRef()

  const { data, isLoading, error, refetch } = useGetAllProjectsQuery({
    page,
    limit: 12,
    search: debouncedSearch,
  })

  // Get all teams without pagination for selection
  const { data: teamsData } = useGetAllTeamsQuery({ noPagination: true })
  const [deleteProject] = useDeleteProjectMutation()

  const handleEdit = (project) => {
    setSelectedProject(project)
    onEditOpen()
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
        description: 'Project has been deleted successfully',
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

  const handleCreateSuccess = () => {
    onCreateClose()
    refetch()
  }

  const handleEditSuccess = () => {
    onEditClose()
    setSelectedProject(null)
    refetch()
  }

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
        <Heading size="md">Project Management</Heading>
        <Button
          leftIcon={<Plus size={18} />}
          colorScheme="brand"
          onClick={onCreateOpen}
          size={{ base: 'sm', md: 'md' }}
        >
          Create Project
        </Button>
      </Flex>

      {/* Search */}
      <Box
        bg={bgColor}
        p={4}
        borderRadius="lg"
        border="1px"
        borderColor={borderColor}
        boxShadow="sm"
      >
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Search size={18} color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Search projects..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
            />
          </InputGroup>
      </Box>

      {/* Project Cards */}
      {isLoading ? (
        <Center py={10}>
          <Spinner size="xl" />
        </Center>
      ) : error ? (
        <Text color="red.500">Error loading projects</Text>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {data?.data?.length > 0 ? (
              data.data.map((project) => (
                <Card key={project._id} bg={bgColor} border="1px" borderColor={borderColor}>
                  <CardHeader>
                    {project.images && project.images.length > 0 && (
                      <Image
                        src={project.images[0]}
                        alt={project.websiteTitle}
                        borderRadius="md"
                        h="200px"
                        w="full"
                        objectFit="cover"
                      />
                    )}
                    <Heading size="sm" mt={4}>
                      {project.websiteTitle}
                    </Heading>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack spacing={2} align="stretch">
                      <Text fontSize="sm" color={textColor} noOfLines={3}>
                        {project.description}
                      </Text>
                      
                      {project.techStack && project.techStack.length > 0 && (
                        <Wrap>
                          {project.techStack.map((tech, idx) => (
                            <WrapItem key={idx}>
                              <Badge colorScheme="brand">{tech}</Badge>
                            </WrapItem>
                          ))}
                        </Wrap>
                      )}

                      {project.teamMembers && project.teamMembers.length > 0 && (
                        <Text fontSize="xs" color={textColor}>
                          Team: {project.teamMembers.map(t => t.name).join(', ')}
                        </Text>
                      )}

                      <HStack justify="space-between" mt={2}>
                        <Link href={project.link} isExternal color="blue.500" fontSize="sm">
                          <HStack spacing={1}>
                            <Text>Visit</Text>
                            <ExternalLink size={14} />
                          </HStack>
                        </Link>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<Eye size={16} />}
                            size="sm"
                            colorScheme="gray"
                            variant="ghost"
                            onClick={() => {
                              setSelectedProject(project)
                              onViewOpen()
                            }}
                            aria-label="View project"
                          />
                          <IconButton
                            icon={<Edit size={16} />}
                            size="sm"
                            colorScheme="brand"
                            variant="ghost"
                            onClick={() => handleEdit(project)}
                            aria-label="Edit project"
                          />
                          <IconButton
                            icon={<Trash2 size={16} />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDelete(project._id)}
                            aria-label="Delete project"
                          />
                        </HStack>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))
            ) : (
              <Box gridColumn="1 / -1">
                <EmptyState
                  title="No projects found"
                  description="Create your first project to showcase your work."
                  icon={<FolderKanban size={48} />}
                  actionLabel="Create Project"
                  onAction={onCreateOpen}
                />
              </Box>
            )}
          </SimpleGrid>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <HStack justify="center" mt={4} spacing={2}>
              <Button
                size="sm"
                onClick={() => setPage(page - 1)}
                isDisabled={page === 1}
              >
                Previous
              </Button>
              <Text>
                Page {data.pagination.page} of {data.pagination.pages}
              </Text>
              <Button
                size="sm"
                onClick={() => setPage(page + 1)}
                isDisabled={page >= data.pagination.pages}
              >
                Next
              </Button>
            </HStack>
          )}
        </>
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={handleCreateSuccess}
        teams={teamsData?.data || []}
      />

      {selectedProject && (
        <>
          <EditProjectModal
            isOpen={isEditOpen}
            onClose={onEditClose}
            project={selectedProject}
            onSuccess={handleEditSuccess}
            teams={teamsData?.data || []}
          />
          <ViewProjectModal
            isOpen={isViewOpen}
            onClose={onViewClose}
            project={selectedProject}
          />
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Project
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
    </VStack>
  )
}

export default ProjectsManagement

