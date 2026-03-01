import {
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Box,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Image,
  Badge,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  useToast,
  Spinner,
  Center,
  Link,
  useDisclosure,
} from '@chakra-ui/react'
import { Search, ExternalLink, Calendar } from 'lucide-react'
import { useState } from 'react'
import { useGetAllActiveProjectsQuery } from '../store/api/userApi'
import { useDebounce } from '../hooks/useDebounce'
import PreBookDemoModal from '../components/User/PreBookDemoModal'
import { EmptyState } from '../components/EmptyState/EmptyState'
import ViewProjectModal from '../components/Admin/ViewProjectModal'

const UserProjects = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [selectedProject, setSelectedProject] = useState(null)
  
  const { isOpen: isBookingOpen, onOpen: onBookingOpen, onClose: onBookingClose } = useDisclosure()
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()

  const { data, isLoading, error } = useGetAllActiveProjectsQuery({
    page,
    limit: 12,
    search: debouncedSearch,
  })

  const statusColors = {
    'planning': 'gray',
    'in-progress': 'blue',
    'completed': 'green',
    'on-hold': 'yellow',
    'cancelled': 'red'
  }

  const statusLabels = {
    'planning': 'Planning',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'on-hold': 'On Hold',
    'cancelled': 'Cancelled'
  }

  const handleBookingSuccess = () => {
    toast({
      title: 'Success',
      description: 'Your booking request has been submitted',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  return (
    <VStack spacing={6} align="stretch">
        <Heading size="lg" mb={2}>
          Our Projects
        </Heading>
        <Text color={textColor}>
          Explore our completed and in-progress projects. Pre-book a live demo to see them in action.
        </Text>

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
              <Search size={20} />
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

        {/* Projects Grid */}
        <Box
          bg={bgColor}
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          boxShadow="sm"
        >
          {isLoading ? (
            <Center py={10}>
              <Spinner size="xl" />
            </Center>
          ) : error ? (
            <Text color="red.500">Error loading projects</Text>
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={6}>
                {data?.data?.length > 0 ? (
                  data.data.map((project) => (
                    <Card key={project._id} overflow="hidden">
                      {project.images && project.images.length > 0 && (
                        <Image
                          src={project.images[0]}
                          alt={project.websiteTitle}
                          h="200px"
                          w="100%"
                          objectFit="cover"
                        />
                      )}
                      <CardHeader>
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={1} flex="1">
                            <Heading size="sm">{project.websiteTitle}</Heading>
                            <Badge colorScheme={statusColors[project.status] || 'gray'} fontSize="xs">
                              {statusLabels[project.status] || project.status}
                            </Badge>
                          </VStack>
                        </HStack>
                      </CardHeader>
                      <CardBody pt={0}>
                        <Text fontSize="sm" color={textColor} noOfLines={3} mb={4}>
                          {project.description}
                        </Text>
                        <VStack spacing={2} align="stretch">
                          {project.link && (
                            <Link href={project.link} isExternal color="blue.500" fontSize="sm">
                              <HStack>
                                <Text>Visit Website</Text>
                                <ExternalLink size={14} />
                              </HStack>
                            </Link>
                          )}
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="brand"
                              onClick={() => {
                                setSelectedProject(project)
                                onViewOpen()
                              }}
                              flex="1"
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="brand"
                              leftIcon={<Calendar size={16} />}
                              onClick={() => {
                                setSelectedProject(project)
                                onBookingOpen()
                              }}
                              flex="1"
                            >
                              Book Demo
                            </Button>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))
                ) : (
                  <Box gridColumn="1 / -1">
                    <EmptyState
                      title="No projects found"
                      description="No active projects available at the moment."
                      icon={<Calendar size={48} />}
                    />
                  </Box>
                )}
              </SimpleGrid>

              {/* Pagination */}
              {data?.pagination && data.pagination.pages > 1 && (
                <HStack justify="center" mt={6} spacing={2}>
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
        </Box>

        {/* Modals */}
        {selectedProject && (
          <>
            <PreBookDemoModal
              isOpen={isBookingOpen}
              onClose={onBookingClose}
              project={selectedProject}
              onSuccess={handleBookingSuccess}
            />
            <ViewProjectModal
              isOpen={isViewOpen}
              onClose={onViewClose}
              project={selectedProject}
            />
          </>
        )}
      </VStack>
  )
}

export default UserProjects

