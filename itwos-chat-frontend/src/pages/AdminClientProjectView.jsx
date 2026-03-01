import {
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Box,
  HStack,
  Badge,
  Divider,
  Button,
  useToast,
  Spinner,
  Center,
  Progress,
  Avatar,
  AvatarGroup,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Link,
  FormControl,
  FormLabel,
  Textarea,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Select,
} from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, DollarSign, Target, Users, Code, FileText, Clock, Video, CheckCircle, FileEdit, TrendingUp, ExternalLink, MessageSquare, X, UserPlus, Plus, ListChecks } from 'lucide-react'
import {
  useGetClientProjectByIdQuery,
  useGetProjectMeetingsQuery,
  useScheduleMeetingMutation,
  useCancelMeetingMutation,
  useGetAllUsersQuery,
  useAssignEmployeesToProjectMutation,
  useAddWorkStepMutation,
  useUpdateWorkStepMutation,
} from '../store/api/adminApi'
import AdminLayout from '../components/Admin/AdminLayout'
import { useState } from 'react'

const AdminClientProjectView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('gray.50', 'gray.600')

  const { data, isLoading, error, refetch } = useGetClientProjectByIdQuery(id)
  const { data: meetingsData, refetch: refetchMeetings } = useGetProjectMeetingsQuery(id)
  // Get employees using users query with role filter (since we removed employee management)
  const { data: employeesData } = useGetAllUsersQuery({ page: 1, limit: 1000, role: 'employee' })
  const [scheduleMeeting, { isLoading: isScheduling }] = useScheduleMeetingMutation()
  const [cancelMeeting, { isLoading: isCancelling }] = useCancelMeetingMutation()
  const [assignEmployees, { isLoading: isAssigning }] = useAssignEmployeesToProjectMutation()
  const [addWorkStep, { isLoading: isAddingStep }] = useAddWorkStepMutation()
  const [updateWorkStep, { isLoading: isUpdatingStep }] = useUpdateWorkStepMutation()
  const toast = useToast()
  
  const { isOpen: isScheduleOpen, onOpen: onScheduleOpen, onClose: onScheduleClose } = useDisclosure()
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure()
  const { isOpen: isAssignOpen, onOpen: onAssignOpen, onClose: onAssignClose } = useDisclosure()
  const { isOpen: isAddStepOpen, onOpen: onAddStepOpen, onClose: onAddStepClose } = useDisclosure()
  const { isOpen: isEditStepOpen, onOpen: onEditStepOpen, onClose: onEditStepClose } = useDisclosure()
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [selectedStep, setSelectedStep] = useState(null)
  const [workStepData, setWorkStepData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
  })
  const [scheduleData, setScheduleData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    meetingLink: '',
    meetingPlatform: 'google-meet',
    notes: '',
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green'
      case 'in-progress': return 'blue'
      case 'review': return 'purple'
      case 'testing': return 'orange'
      case 'on-hold': return 'yellow'
      case 'cancelled': return 'red'
      case 'planning':
      default: return 'gray'
    }
  }

  const handleAssignEmployees = () => {
    // Initialize with already assigned employee IDs
    const alreadyAssigned = project.assignedEmployees?.map(emp => emp.employeeId._id) || []
    setSelectedEmployees(alreadyAssigned)
    onAssignOpen()
  }

  const handleSchedule = (meeting) => {
    setSelectedMeeting(meeting)
    setScheduleData({
      scheduledDate: '',
      scheduledTime: '',
      meetingLink: '',
      meetingPlatform: 'google-meet',
      notes: '',
    })
    onScheduleOpen()
  }

  const handleScheduleSubmit = async () => {
    if (!scheduleData.scheduledDate) {
      toast({
        title: 'Error',
        description: 'Please select a scheduled date',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await scheduleMeeting({
        id: selectedMeeting._id,
        ...scheduleData,
      }).unwrap()
      toast({
        title: 'Meeting scheduled',
        description: 'Meeting has been scheduled successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onScheduleClose()
      refetchMeetings()
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to schedule meeting',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleCancel = (meeting) => {
    setSelectedMeeting(meeting)
    onCancelOpen()
  }

  const confirmCancel = async () => {
    try {
      await cancelMeeting(selectedMeeting._id).unwrap()
      toast({
        title: 'Meeting cancelled',
        description: 'Meeting has been cancelled successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onCancelClose()
      refetchMeetings()
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to cancel meeting',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const getMeetingStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'green'
      case 'pending': return 'yellow'
      case 'completed': return 'blue'
      case 'cancelled': return 'red'
      default: return 'gray'
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

  const project = data.data
  const meetings = meetingsData?.data || []
  const pendingMeetings = meetings.filter(m => m.status === 'pending').length
  
  // Calculate indicator counts
  const pendingWorkSteps = project?.workSteps?.filter(step => 
    step.status === 'pending' || step.status === 'in-progress'
  ).length || 0
  const unassignedEmployees = project && (!project.assignedEmployees || project.assignedEmployees.length === 0) ? 1 : 0
  const newActivities = project?.activityTimeline?.filter(activity => {
    const activityDate = new Date(activity.createdAt)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return activityDate > oneDayAgo
  }).length || 0
  const hasNewNotes = project?.clientNotes?.some(note => {
    const noteDate = new Date(note.createdAt)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return noteDate > oneDayAgo
  }) || false

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <HStack>
          <Button
            leftIcon={<ArrowLeft size={18} />}
            variant="ghost"
            onClick={() => navigate('/admin/client-projects')}
          >
            Back to Projects
          </Button>
          <Button
            colorScheme="brand"
            onClick={() => navigate(`/admin/client-projects/${id}/edit`)}
          >
            Edit Project
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
          <VStack spacing={6} align="stretch">
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={2}>
                <Heading size="lg">{project.projectTitle}</Heading>
                <HStack spacing={3}>
                  <Badge colorScheme={getStatusColor(project.status)} fontSize="md" px={3} py={1}>
                    {project.status}
                  </Badge>
                  <Text fontSize="sm" color={textColor}>
                    Type: {project.projectType}
                  </Text>
                </HStack>
              </VStack>
            </HStack>

            <Divider />

            <Tabs colorScheme="brand" defaultIndex={0}>
              <TabList>
                <Tab position="relative">
                  Overview
                  {(pendingWorkSteps > 0 || pendingMeetings > 0 || unassignedEmployees > 0) && (
                    <Badge colorScheme="red" borderRadius="full" minW="5" h="5" display="inline-flex" alignItems="center" justifyContent="center" fontSize="xs">{pendingWorkSteps + pendingMeetings + unassignedEmployees}</Badge>
                  )}
                </Tab>
                <Tab position="relative">
                  Employees
                  {unassignedEmployees > 0 && <Badge colorScheme="red" borderRadius="full" minW="5" h="5" display="inline-flex" alignItems="center" justifyContent="center" fontSize="xs">{unassignedEmployees}</Badge>}
                </Tab>
                <Tab position="relative">
                  Work Steps
                  {pendingWorkSteps > 0 && <Badge colorScheme="red" borderRadius="full" minW="5" h="5" display="inline-flex" alignItems="center" justifyContent="center" fontSize="xs">{pendingWorkSteps}</Badge>}
                </Tab>
                <Tab position="relative">
                  Timeline
                  {newActivities > 0 && <Badge colorScheme="red" borderRadius="full" minW="5" h="5" display="inline-flex" alignItems="center" justifyContent="center" fontSize="xs">{newActivities}</Badge>}
                </Tab>
                <Tab position="relative">
                  Meetings
                  {pendingMeetings > 0 && <Badge colorScheme="red" borderRadius="full" minW="5" h="5" display="inline-flex" alignItems="center" justifyContent="center" fontSize="xs">{pendingMeetings}</Badge>}
                </Tab>
                <Tab position="relative">
                  Notes
                  {hasNewNotes && <Badge colorScheme="red" borderRadius="full" minW="5" h="5" display="inline-flex" alignItems="center" justifyContent="center" fontSize="xs">1</Badge>}
                </Tab>
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel px={0} pt={6}>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium">Progress</Text>
                        <Text fontSize="lg" fontWeight="bold">
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

                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Card bg={cardBg}>
                <CardBody>
                  <HStack spacing={2} mb={2}>
                    <DollarSign size={18} />
                    <Text fontSize="sm" fontWeight="medium">Budget</Text>
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold">
                    {project.budget || 'N/A'}
                  </Text>
                </CardBody>
              </Card>

              <Card bg={cardBg}>
                <CardBody>
                  <HStack spacing={2} mb={2}>
                    <Calendar size={18} />
                    <Text fontSize="sm" fontWeight="medium">Deadline</Text>
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold">
                    {project.deadline
                      ? new Date(project.deadline).toLocaleDateString()
                      : 'Not set'}
                  </Text>
                </CardBody>
              </Card>

              <Card bg={cardBg}>
                <CardBody>
                  <HStack spacing={2} mb={2}>
                    <Calendar size={18} />
                    <Text fontSize="sm" fontWeight="medium">Start Date</Text>
                  </HStack>
                  <Text fontSize="lg" fontWeight="bold">
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString()
                      : 'Not started'}
                  </Text>
                </CardBody>
              </Card>
            </SimpleGrid>

                    {project.description && (
                      <Box>
                        <HStack spacing={2} mb={2}>
                          <FileText size={18} />
                          <Text fontWeight="medium">Description</Text>
                        </HStack>
                        <Text color={textColor} whiteSpace="pre-wrap">
                          {project.description}
                        </Text>
                      </Box>
                    )}

                    {project.requirements && (
                      <Box>
                        <HStack spacing={2} mb={2}>
                          <Target size={18} />
                          <Text fontWeight="medium">Requirements</Text>
                        </HStack>
                        <Text color={textColor} whiteSpace="pre-wrap">
                          {project.requirements}
                        </Text>
                      </Box>
                    )}

                    {project.techStack && project.techStack.length > 0 && (
                      <Box>
                        <HStack spacing={2} mb={3}>
                          <Code size={18} />
                          <Text fontWeight="medium">Tech Stack</Text>
                        </HStack>
                        <HStack spacing={2} flexWrap="wrap">
                          {project.techStack.map((tech, idx) => (
                            <Badge key={idx} colorScheme="blue" fontSize="sm" px={2} py={1}>
                              {tech}
                            </Badge>
                          ))}
                        </HStack>
                      </Box>
                    )}

                    {project.teamMembers && project.teamMembers.length > 0 && (
                      <Box>
                        <HStack spacing={2} mb={3}>
                          <Users size={18} />
                          <Text fontWeight="medium">Team Members</Text>
                        </HStack>
                        <AvatarGroup size="md" max={5}>
                          {project.teamMembers.map((member) => (
                            <Avatar
                              key={member._id}
                              name={member.name}
                              src={member.image}
                              title={member.name}
                            />
                          ))}
                        </AvatarGroup>
                      </Box>
                    )}

                    {project.milestones && project.milestones.length > 0 && (
                      <Box>
                        <Text fontWeight="medium" mb={3}>Milestones</Text>
                        <VStack spacing={3} align="stretch">
                          {project.milestones.map((milestone, idx) => (
                            <Card key={idx} bg={cardBg}>
                              <CardBody>
                                <HStack justify="space-between" mb={2}>
                                  <Text fontWeight="medium">{milestone.title}</Text>
                                  <Badge
                                    colorScheme={
                                      milestone.status === 'completed'
                                        ? 'green'
                                        : milestone.status === 'in-progress'
                                        ? 'blue'
                                        : 'gray'
                                    }
                                  >
                                    {milestone.status}
                                  </Badge>
                                </HStack>
                                {milestone.description && (
                                  <Text fontSize="sm" color={textColor} mb={2}>
                                    {milestone.description}
                                  </Text>
                                )}
                                {milestone.dueDate && (
                                  <Text fontSize="xs" color={textColor}>
                                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                  </Text>
                                )}
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Employees Tab */}
                <TabPanel px={0} pt={6}>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="lg">Assigned Employees</Text>
                      <Button
                        leftIcon={<UserPlus size={16} />}
                        size="sm"
                        colorScheme="brand"
                        onClick={handleAssignEmployees}
                      >
                        {project.assignedEmployees && project.assignedEmployees.length > 0 ? 'Manage Employees' : 'Assign Employees'}
                      </Button>
                    </HStack>

                    {project.assignedEmployees && project.assignedEmployees.length > 0 ? (
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                        {project.assignedEmployees.map((assignment) => (
                          <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm" key={assignment.employeeId._id}>
                            <HStack spacing={3}>
                              <Avatar
                                size="md"
                                name={assignment.employeeId.name}
                                src={assignment.employeeId.profileImage}
                              />
                              <VStack align="start" spacing={1} flex={1}>
                                <Text fontWeight="medium">{assignment.employeeId.name}</Text>
                                <Text fontSize="sm" color={textColor}>
                                  {assignment.employeeId.email}
                                </Text>
                                <Badge colorScheme="blue" fontSize="xs">
                                  {assignment.role || 'Developer'}
                                </Badge>
                              </VStack>
                            </HStack>
                          </Box>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm">
                        <Text color={textColor} textAlign="center" py={4}>
                          No employees assigned yet. Click "Assign Employees" to get started.
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Work Steps Tab */}
                <TabPanel px={0} pt={6}>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="lg">Work Steps</Text>
                      <Button
                        leftIcon={<Plus size={16} />}
                        size="sm"
                        colorScheme="brand"
                        onClick={() => {
                          setWorkStepData({ title: '', description: '', assignedTo: '', dueDate: '' })
                          setSelectedStep(null)
                          onAddStepOpen()
                        }}
                      >
                        Add Work Step
                      </Button>
                    </HStack>

                    {project.workSteps && project.workSteps.length > 0 ? (
                      <VStack spacing={3} align="stretch">
                        {[...project.workSteps]
                          .sort((a, b) => a.stepNumber - b.stepNumber)
                          .map((step) => (
                            <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm" key={step.stepNumber}>
                              <VStack align="stretch" spacing={3}>
                                <HStack justify="space-between">
                                  <HStack>
                                    <Text fontWeight="bold">Step {step.stepNumber}: {step.title}</Text>
                                    <Badge colorScheme={step.status === 'completed' ? 'green' : step.status === 'in-progress' ? 'blue' : 'gray'} fontSize="xs">{step.status}</Badge>
                                  </HStack>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedStep(step)
                                      setWorkStepData({
                                        title: step.title,
                                        description: step.description || '',
                                        assignedTo: step.assignedTo?._id || '',
                                        dueDate: step.dueDate ? new Date(step.dueDate).toISOString().split('T')[0] : '',
                                      })
                                      onEditStepOpen()
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </HStack>
                                {step.description && (
                                  <Text fontSize="sm" color={textColor}>
                                    {step.description}
                                  </Text>
                                )}
                                {step.assignedTo && (
                                  <HStack>
                                    <Text fontSize="xs" color={textColor}>Assigned to:</Text>
                                    <Avatar size="xs" name={step.assignedTo.name} src={step.assignedTo.profileImage} />
                                    <Text fontSize="xs">{step.assignedTo.name}</Text>
                                  </HStack>
                                )}
                                <Progress value={step.progress || 0} size="sm" colorScheme="blue" borderRadius="full" />
                                {step.notes && (
                                  <Text fontSize="xs" color={textColor} fontStyle="italic">
                                    Notes: {step.notes}
                                  </Text>
                                )}
                                {step.dueDate && (
                                  <Text fontSize="xs" color={textColor}>
                                    Due: {new Date(step.dueDate).toLocaleDateString()}
                                  </Text>
                                )}
                              </VStack>
                            </Box>
                          ))}
                      </VStack>
                    ) : (
                      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm">
                        <Text color={textColor} textAlign="center" py={4}>
                          No work steps added yet. Click "Add Work Step" to create one.
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Timeline Tab */}
                <TabPanel px={0} pt={6}>
                  {project.activityTimeline && project.activityTimeline.length > 0 ? (
                    <VStack spacing={3} align="stretch">
                      {[...project.activityTimeline]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .map((activity, idx) => {
                          const getActivityIcon = () => {
                            switch (activity.type) {
                              case 'meeting_scheduled':
                                return <Video size={16} />
                              case 'status_change':
                                return <CheckCircle size={16} />
                              case 'progress_update':
                                return <TrendingUp size={16} />
                              case 'note_added':
                                return <FileEdit size={16} />
                              case 'milestone_updated':
                                return <CheckCircle size={16} />
                              case 'file_uploaded':
                                return <FileText size={16} />
                              default:
                                return <Clock size={16} />
                            }
                          }
                          
                          return (
                            <Box
                              key={idx}
                              bg={cardBg}
                              p={4}
                              borderRadius="md"
                              borderLeft="4px"
                              borderColor={activity.performedBy === 'admin' ? 'blue.500' : 'green.500'}
                              position="relative"
                            >
                              <HStack spacing={3} mb={2}>
                                {getActivityIcon()}
                                <Text fontWeight="bold" fontSize="sm" flex="1">
                                  {activity.title}
                                </Text>
                                <Badge colorScheme={activity.performedBy === 'admin' ? 'blue' : 'green'} fontSize="xs">
                                  {activity.performedBy}
                                </Badge>
                                <Text fontSize="xs" color={textColor}>
                                  {new Date(activity.createdAt).toLocaleString()}
                                </Text>
                              </HStack>
                              {activity.description && (
                                <Text fontSize="sm" color={textColor} mb={2} pl={7}>
                                  {activity.description}
                                </Text>
                              )}
                              {activity.oldValue && activity.newValue && (
                                <HStack spacing={2} fontSize="sm" color={textColor} pl={7}>
                                  <Text>Changed from</Text>
                                  <Badge colorScheme="gray" fontSize="xs">{activity.oldValue}</Badge>
                                  <Text>to</Text>
                                  <Badge colorScheme="blue" fontSize="xs">{activity.newValue}</Badge>
                                </HStack>
                              )}
                            </Box>
                          )
                        })}
                    </VStack>
                  ) : (
                    <Center minH="200px">
                      <VStack spacing={2}>
                        <Clock size={48} opacity={0.3} />
                        <Text color={textColor}>No timeline activities yet</Text>
                      </VStack>
                    </Center>
                  )}
                </TabPanel>

                {/* Meetings Tab */}
                <TabPanel px={0} pt={6}>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="medium">Project Meetings</Text>
                    </HStack>
                    
                    {meetings.length > 0 ? (
                      <VStack spacing={3} align="stretch">
                        {meetings.map((meeting) => (
                          <Card key={meeting._id} bg={cardBg}>
                            <CardBody>
                              <VStack align="stretch" spacing={3}>
                                <HStack justify="space-between">
                                  <HStack spacing={2}>
                                    <Avatar
                                      size="sm"
                                      name={meeting.userId?.name || 'Client'}
                                      src={meeting.userId?.profileImage}
                                    />
                                    <VStack align="start" spacing={0}>
                                      <Text fontSize="sm" fontWeight="medium">
                                        {meeting.userId?.name || 'Client'}
                                      </Text>
                                      <Text fontSize="xs" color={textColor}>
                                        {meeting.userId?.email}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                  <Badge colorScheme={getMeetingStatusColor(meeting.status)}>
                                    {meeting.status}
                                  </Badge>
                                </HStack>
                                
                                <Box>
                                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                                    Requested Date: {new Date(meeting.requestedDate).toLocaleDateString()}
                                  </Text>
                                  {meeting.scheduledDate && (
                                    <Text fontSize="sm" color={textColor}>
                                      Scheduled: {new Date(meeting.scheduledDate).toLocaleDateString()}
                                      {meeting.scheduledTime && ` at ${meeting.scheduledTime}`}
                                    </Text>
                                  )}
                                </Box>
                                
                                {meeting.agenda && (
                                  <Box>
                                    <Text fontSize="xs" fontWeight="medium" mb={1}>Agenda:</Text>
                                    <Text fontSize="xs" color={textColor}>{meeting.agenda}</Text>
                                  </Box>
                                )}
                                
                                {meeting.meetingLink && meeting.status === 'scheduled' && (
                                  <HStack spacing={2}>
                                    <Button
                                      leftIcon={<ExternalLink size={16} />}
                                      colorScheme="green"
                                      size="sm"
                                      as={Link}
                                      href={meeting.meetingLink}
                                      target="_blank"
                                    >
                                      Join Meeting
                                    </Button>
                                    <Text fontSize="xs" color={textColor}>
                                      Platform: {meeting.meetingPlatform || 'google-meet'}
                                    </Text>
                                  </HStack>
                                )}
                                
                                {meeting.notes && (
                                  <Box>
                                    <Text fontSize="xs" fontWeight="medium" mb={1}>Notes:</Text>
                                    <Text fontSize="xs" color={textColor}>{meeting.notes}</Text>
                                  </Box>
                                )}
                                
                                <HStack spacing={2}>
                                  {meeting.status === 'pending' && (
                                    <Button
                                      leftIcon={<Calendar size={16} />}
                                      colorScheme="green"
                                      size="sm"
                                      onClick={() => handleSchedule(meeting)}
                                    >
                                      Schedule Meeting
                                    </Button>
                                  )}
                                  {meeting.status !== 'cancelled' && (
                                    <Button
                                      leftIcon={<X size={16} />}
                                      colorScheme="red"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCancel(meeting)}
                                    >
                                      Cancel
                                    </Button>
                                  )}
                                </HStack>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    ) : (
                      <Center minH="200px">
                        <VStack spacing={2}>
                          <Video size={48} opacity={0.3} />
                          <Text color={textColor}>No meetings for this project</Text>
                        </VStack>
                      </Center>
                    )}
                  </VStack>
                </TabPanel>

                {/* Notes Tab */}
                <TabPanel px={0} pt={6}>
                  <VStack spacing={4} align="stretch">
                    {project.adminNotes && (
                      <Box>
                        <HStack spacing={2} mb={2}>
                          <MessageSquare size={18} />
                          <Text fontWeight="medium">Admin Notes</Text>
                        </HStack>
                        <Box bg={cardBg} p={4} borderRadius="md" borderLeft="4px" borderColor="blue.500">
                          <Text color={textColor} whiteSpace="pre-wrap">
                            {project.adminNotes}
                          </Text>
                        </Box>
                        <Text fontSize="xs" color={textColor} mt={2}>
                          You can edit these notes in the Edit Project page
                        </Text>
                      </Box>
                    )}

                    {project.clientNotes && project.clientNotes.length > 0 && (
                      <Box>
                        <HStack spacing={2} mb={3}>
                          <MessageSquare size={18} />
                          <Text fontWeight="medium">Client Notes</Text>
                        </HStack>
                        <VStack spacing={2} align="stretch">
                          {project.clientNotes.map((note, idx) => (
                            <Box key={idx} bg={cardBg} p={3} borderRadius="md" borderLeft="4px" borderColor="green.500">
                              <Text fontSize="sm" color={textColor} whiteSpace="pre-wrap">
                                {note.note}
                              </Text>
                              <Text fontSize="xs" color={textColor} mt={1}>
                                {new Date(note.createdAt).toLocaleString()}
                              </Text>
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {(!project.adminNotes && (!project.clientNotes || project.clientNotes.length === 0)) && (
                      <Center minH="200px">
                        <VStack spacing={2}>
                          <MessageSquare size={48} opacity={0.3} />
                          <Text color={textColor}>No notes yet</Text>
                        </VStack>
                      </Center>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Box>
      </VStack>

      {/* Assign Employees Modal */}
      <Modal isOpen={isAssignOpen} onClose={onAssignClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Employees</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={textColor}>
                Select employees to assign to this project
              </Text>
              {employeesData?.data && employeesData.data.length > 0 ? (
                <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                  {employeesData.data
                    .filter((employee) => {
                      // Show all employees, but indicate which are already assigned
                      return true
                    })
                    .map((employee) => {
                      const isAlreadyAssigned = project.assignedEmployees?.some(
                        emp => emp.employeeId._id === employee._id
                      )
                      return (
                    <Box
                      key={employee._id}
                      p={3}
                      border="1px solid"
                      borderColor={borderColor}
                      borderRadius="md"
                      cursor="pointer"
                      bg={selectedEmployees.includes(employee._id) ? 'blue.50' : bgColor}
                      opacity={isAlreadyAssigned && !selectedEmployees.includes(employee._id) ? 0.6 : 1}
                      onClick={() => {
                        setSelectedEmployees((prev) =>
                          prev.includes(employee._id)
                            ? prev.filter((id) => id !== employee._id)
                            : [...prev, employee._id]
                        )
                      }}
                    >
                      <HStack>
                        <Avatar size="sm" name={employee.name} src={employee.profileImage} />
                        <VStack align="start" spacing={0} flex={1}>
                          <HStack>
                            <Text fontWeight="medium">{employee.name}</Text>
                            {isAlreadyAssigned && (
                              <Badge colorScheme="green" fontSize="xs">Assigned</Badge>
                            )}
                          </HStack>
                          <Text fontSize="xs" color={textColor}>
                            {employee.email}
                          </Text>
                        </VStack>
                        {selectedEmployees.includes(employee._id) && (
                          <CheckCircle size={20} color="green" />
                        )}
                      </HStack>
                    </Box>
                      )
                    })}
                </VStack>
              ) : (
                <Text color={textColor}>No employees available</Text>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAssignClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={async () => {
                try {
                  await assignEmployees({
                    projectId: id,
                    employeeIds: selectedEmployees,
                    roles: selectedEmployees.map(() => 'Developer'),
                  }).unwrap()
                  toast({
                    title: 'Success',
                    description: 'Employees assigned successfully',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  })
                  setSelectedEmployees([])
                  onAssignClose()
                  refetch()
                } catch (err) {
                  toast({
                    title: 'Error',
                    description: err?.data?.message || 'Failed to assign employees',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                  })
                }
              }}
              isLoading={isAssigning}
              isDisabled={selectedEmployees.length === 0}
            >
              Assign
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add/Edit Work Step Modal */}
      <Modal
        isOpen={isAddStepOpen || isEditStepOpen}
        onClose={selectedStep ? onEditStepClose : onAddStepClose}
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedStep ? 'Edit Work Step' : 'Add Work Step'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  value={workStepData.title}
                  onChange={(e) => setWorkStepData({ ...workStepData, title: e.target.value })}
                  placeholder="Work step title"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={workStepData.description}
                  onChange={(e) => setWorkStepData({ ...workStepData, description: e.target.value })}
                  placeholder="Work step description"
                  rows={3}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Assign To</FormLabel>
                <Select
                  value={workStepData.assignedTo}
                  onChange={(e) => setWorkStepData({ ...workStepData, assignedTo: e.target.value })}
                  placeholder="Select employee (optional)"
                >
                  {project.assignedEmployees?.map((assignment) => (
                    <option key={assignment.employeeId._id} value={assignment.employeeId._id}>
                      {assignment.employeeId.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Due Date</FormLabel>
                <Input
                  type="date"
                  value={workStepData.dueDate}
                  onChange={(e) => setWorkStepData({ ...workStepData, dueDate: e.target.value })}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={selectedStep ? onEditStepClose : onAddStepClose}
            >
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={async () => {
                try {
                  if (selectedStep) {
                    await updateWorkStep({
                      projectId: id,
                      stepNumber: selectedStep.stepNumber,
                      title: workStepData.title,
                      description: workStepData.description,
                      assignedTo: workStepData.assignedTo || null,
                      dueDate: workStepData.dueDate || null,
                    }).unwrap()
                    toast({
                      title: 'Success',
                      description: 'Work step updated successfully',
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    })
                    onEditStepClose()
                  } else {
                    await addWorkStep({
                      projectId: id,
                      ...workStepData,
                      assignedTo: workStepData.assignedTo || null,
                      dueDate: workStepData.dueDate || null,
                    }).unwrap()
                    toast({
                      title: 'Success',
                      description: 'Work step added successfully',
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    })
                    onAddStepClose()
                  }
                  setWorkStepData({ title: '', description: '', assignedTo: '', dueDate: '' })
                  setSelectedStep(null)
                  refetch()
                } catch (err) {
                  toast({
                    title: 'Error',
                    description: err?.data?.message || 'Failed to save work step',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                  })
                }
              }}
              isLoading={isAddingStep || isUpdatingStep}
              isDisabled={!workStepData.title}
            >
              {selectedStep ? 'Update' : 'Add'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  )
}

export default AdminClientProjectView

