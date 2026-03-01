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
  Badge,
  HStack,
  Button,
  Progress,
  useToast,
  Spinner,
  Center,
  useDisclosure,
  Divider,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { Eye, Calendar, DollarSign, Target, Search, Lock } from 'lucide-react'
import { useState } from 'react'
import { useGetUserClientProjectsQuery, useGetUserBookingsQuery } from '../store/api/userApi'
import { useDebounce } from '../hooks/useDebounce'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { useNavigate } from 'react-router-dom'

const UserClientProjects = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  const navigate = useNavigate()
  
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const { data, isLoading, error } = useGetUserClientProjectsQuery({
    page,
    limit: 12,
    search: debouncedSearch,
  })
  
  // Check if user has at least one confirmed booking or project (for access control)
  const { data: bookingsData } = useGetUserBookingsQuery({ page: 1, limit: 100 })
  const hasConfirmedBooking = bookingsData?.data?.some(booking => booking.status === 'confirmed') || false
  const hasProjects = (data?.data?.length || 0) > 0
  const hasAccess = hasConfirmedBooking || hasProjects

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

  const getStatusLabel = (status) => {
    const labels = {
      'planning': 'Planning',
      'in-progress': 'In Progress',
      'review': 'Under Review',
      'testing': 'Testing',
      'completed': 'Completed',
      'on-hold': 'On Hold',
      'cancelled': 'Cancelled'
    }
    return labels[status] || status
  }

  if (isLoading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" colorScheme="brand" />
      </Center>
    )
  }

  if (error) {
    return (
      <Center minH="400px">
        <Text color="red.500">Error loading your projects</Text>
      </Center>
    )
  }

  const projects = data?.data || []

  // Show access denied message if user doesn't have confirmed booking or project
  if (!isLoading && !hasAccess) {
    return (
      <VStack spacing={6} align="stretch">
          <Box
            bg={bgColor}
            p={8}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
            boxShadow="sm"
            textAlign="center"
          >
            <Lock size={64} color={useColorModeValue('#9CA3AF', '#6B7280')} style={{ margin: '0 auto 16px' }} />
            <Heading size="lg" mb={4}>
              Access Restricted
            </Heading>
            <Text color={textColor} fontSize="lg" mb={4}>
              You need admin approval to access "My Projects" page.
            </Text>
            <Text color={textColor} mb={6}>
              Please book a project from the "Projects" page. Once admin accepts your booking request, 
              you will receive a notification and gain full access to this page.
            </Text>
            <Button
              colorScheme="brand"
              onClick={() => navigate('/user/projects')}
              leftIcon={<Target size={16} />}
            >
              Browse Projects
            </Button>
          </Box>
        </VStack>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            My Projects
          </Heading>
          <Text color={textColor}>
            Track the progress of your active projects here.
          </Text>
        </Box>

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

        {projects.length === 0 ? (
          <Box
            bg={bgColor}
            p={8}
            borderRadius="lg"
            border="1px"
            borderColor={borderColor}
            boxShadow="sm"
          >
            <EmptyState
              title="No active projects"
              description="You don't have any active projects yet. Once your booking is confirmed and converted to a project, it will appear here."
              icon={<Target size={48} />}
            />
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {projects.map((project) => (
              <Card
                key={project._id}
                bg={bgColor}
                border="1px"
                borderColor={borderColor}
                boxShadow="sm"
                _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
                transition="all 0.2s"
              >
                <CardHeader>
                  <VStack align="start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Heading size="md" noOfLines={1}>
                        {project.projectTitle}
                      </Heading>
                      <Badge colorScheme={getStatusColor(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </HStack>
                    {project.description && (
                      <Text fontSize="sm" color={textColor} noOfLines={2}>
                        {project.description}
                      </Text>
                    )}
                  </VStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack align="stretch" spacing={4}>
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontSize="sm" fontWeight="medium">
                          Progress
                        </Text>
                        <Text fontSize="sm" color={textColor}>
                          {project.progress || 0}%
                        </Text>
                      </HStack>
                      <Progress
                        value={project.progress || 0}
                        colorScheme="brand"
                        size="lg"
                        borderRadius="md"
                      />
                    </Box>

                    <Divider />

                    <SimpleGrid columns={2} spacing={3}>
                      <Box>
                        <HStack spacing={1} mb={1}>
                          <DollarSign size={14} color="gray" />
                          <Text fontSize="xs" color={textColor}>
                            Budget
                          </Text>
                        </HStack>
                        <Text fontSize="sm" fontWeight="medium">
                          {project.budget || 'N/A'}
                        </Text>
                      </Box>
                      <Box>
                        <HStack spacing={1} mb={1}>
                          <Calendar size={14} color="gray" />
                          <Text fontSize="xs" color={textColor}>
                            Deadline
                          </Text>
                        </HStack>
                        <Text fontSize="sm" fontWeight="medium">
                          {project.deadline
                            ? new Date(project.deadline).toLocaleDateString()
                            : 'N/A'}
                        </Text>
                      </Box>
                    </SimpleGrid>

                    {project.techStack && project.techStack.length > 0 && (
                      <Box>
                        <Text fontSize="xs" color={textColor} mb={1}>
                          Tech Stack
                        </Text>
                        <HStack spacing={1} flexWrap="wrap">
                          {project.techStack.slice(0, 3).map((tech, idx) => (
                            <Badge key={idx} fontSize="xs" colorScheme="gray">
                              {tech}
                            </Badge>
                          ))}
                          {project.techStack.length > 3 && (
                            <Badge fontSize="xs" colorScheme="gray">
                              +{project.techStack.length - 3}
                            </Badge>
                          )}
                        </HStack>
                      </Box>
                    )}

                    <Button
                      leftIcon={<Eye size={16} />}
                      colorScheme="brand"
                      size="sm"
                      onClick={() => navigate(`/user/client-projects/${project._id}`)}
                      w="full"
                    >
                      View Details
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </VStack>
  )
}

export default UserClientProjects

