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
  FormControl,
  FormLabel,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Link,
} from '@chakra-ui/react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, DollarSign, Target, Users, Code, FileText, MessageSquare, Video, Clock, CheckCircle, FileEdit, TrendingUp, ExternalLink, ListChecks, UserCheck } from 'lucide-react'
import IndicatorDot from '../components/IndicatorDot/IndicatorDot'
import { useState } from 'react'
import { useGetClientProjectByIdQuery, useAddClientNoteMutation, useRequestMeetingMutation, useGetProjectMeetingsQuery } from '../store/api/userApi'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  useDisclosure,
} from '@chakra-ui/react'

const UserClientProjectView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('gray.50', 'gray.600')
  const toast = useToast()

  const { data, isLoading, error, refetch } = useGetClientProjectByIdQuery(id)
  const { data: meetingsData, refetch: refetchMeetings } = useGetProjectMeetingsQuery(id)
  const [addNote, { isLoading: isAddingNote }] = useAddClientNoteMutation()
  const [requestMeeting, { isLoading: isRequestingMeeting }] = useRequestMeetingMutation()
  const [noteText, setNoteText] = useState('')
  const { isOpen: isMeetingOpen, onOpen: onMeetingOpen, onClose: onMeetingClose } = useDisclosure()
  const [meetingData, setMeetingData] = useState({
    requestedDate: '',
    agenda: '',
  })
  
  const meetings = meetingsData?.data || []
  const scheduledMeetings = meetings.filter(m => m.status === 'scheduled' && m.meetingLink)

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

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a note',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await addNote({ id, note: noteText }).unwrap()
      toast({
        title: 'Note added',
        description: 'Your note has been added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      setNoteText('')
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to add note',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  if (isLoading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" colorScheme="brand" />
      </Center>
    )
  }

  if (error || !data?.success) {
    return (
      <Center minH="400px">
        <Text color="red.500">Error loading project</Text>
      </Center>
    )
  }

  const project = data.data
  const pendingMeetings = meetings.filter(m => m.status === 'pending').length
  
  // Calculate indicator counts (only if project data is loaded)
  const pendingWorkSteps = project?.workSteps?.filter(step => 
    step.status === 'pending' || step.status === 'in-progress'
  ).length || 0
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
    <>
    <VStack spacing={6} align="stretch">
        <Button
          leftIcon={<ArrowLeft size={18} />}
          variant="ghost"
          onClick={() => navigate('/user/client-projects')}
          alignSelf="flex-start"
        >
          Back to My Projects
        </Button>

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
                    {getStatusLabel(project.status)}
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
                  {(pendingWorkSteps > 0 || pendingMeetings > 0) && (
                    <IndicatorDot count={pendingWorkSteps + pendingMeetings} />
                  )}
                </Tab>
                <Tab position="relative">
                  Work Steps
                  {pendingWorkSteps > 0 && <IndicatorDot count={pendingWorkSteps} />}
                </Tab>
                <Tab position="relative">Team</Tab>
                <Tab position="relative">
                  Timeline
                  {newActivities > 0 && <IndicatorDot count={newActivities} />}
                </Tab>
                <Tab position="relative">
                  Meetings
                  {pendingMeetings > 0 && <IndicatorDot count={pendingMeetings} />}
                </Tab>
                <Tab position="relative">
                  Notes
                  {hasNewNotes && <IndicatorDot count={1} />}
                </Tab>
              </TabList>

              <TabPanels>
                {/* Overview Tab */}
                <TabPanel px={0} pt={6}>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="medium" fontSize="lg">Project Progress</Text>
                        <Text fontSize="xl" fontWeight="bold" colorScheme="brand">
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
                        <HStack spacing={3}>
                          {project.teamMembers.map((member) => (
                            <HStack key={member._id} spacing={2}>
                              <Avatar size="sm" name={member.name} src={member.image} />
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm" fontWeight="medium">{member.name}</Text>
                                <Text fontSize="xs" color={textColor}>{member.role}</Text>
                              </VStack>
                            </HStack>
                          ))}
                        </HStack>
                      </Box>
                    )}

                    {project.milestones && project.milestones.length > 0 && (
                      <Box>
                        <Text fontWeight="medium" mb={3}>Project Milestones</Text>
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
                                {milestone.completedDate && (
                                  <Text fontSize="xs" color="green.500">
                                    Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                                  </Text>
                                )}
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      </Box>
                    )}

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
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Work Steps Tab */}
                <TabPanel px={0} pt={6}>
                  <VStack spacing={4} align="stretch">
                    <Text fontWeight="bold" fontSize="lg">Work Steps Progress</Text>
                    {project.workSteps && project.workSteps.length > 0 ? (
                      <VStack spacing={3} align="stretch">
                        {[...project.workSteps]
                          .sort((a, b) => a.stepNumber - b.stepNumber)
                          .map((step) => (
                            <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm" key={step.stepNumber}>
                              <VStack align="stretch" spacing={3}>
                                <HStack justify="space-between">
                                  <HStack>
                                    <Text fontWeight="bold">
                                      Step {step.stepNumber}: {step.title}
                                    </Text>
                                    <Badge colorScheme={step.status === 'completed' ? 'green' : step.status === 'in-progress' ? 'blue' : 'gray'} fontSize="xs">{step.status}</Badge>
                                  </HStack>
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
                                <Progress value={step.progress || 0} size="md" colorScheme="blue" borderRadius="full" />
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
                                {step.completedDate && (
                                  <Text fontSize="xs" color="green.500">
                                    Completed: {new Date(step.completedDate).toLocaleDateString()}
                                  </Text>
                                )}
                              </VStack>
                            </Box>
                          ))}
                      </VStack>
                    ) : (
                      <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm">
                        <Text color={textColor} textAlign="center" py={4}>
                          No work steps added yet. Work steps will appear here once admin adds them.
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* Team Tab */}
                <TabPanel px={0} pt={6}>
                  <VStack spacing={4} align="stretch">
                    <Text fontWeight="bold" fontSize="lg">Assigned Team</Text>
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
                          No employees assigned yet.
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
                      <Text fontWeight="medium">Meetings</Text>
                      <Button
                        leftIcon={<Video size={18} />}
                        colorScheme="brand"
                        size="sm"
                        onClick={onMeetingOpen}
                      >
                        Request Meeting
                      </Button>
                    </HStack>
                    
                    {meetings.length > 0 ? (
                      <VStack spacing={3} align="stretch">
                        {meetings.map((meeting) => (
                          <Card key={meeting._id} bg={cardBg}>
                            <CardBody>
                              <VStack align="stretch" spacing={3}>
                                <HStack justify="space-between">
                                  <Badge colorScheme={
                                    meeting.status === 'scheduled' ? 'green' :
                                    meeting.status === 'pending' ? 'yellow' :
                                    meeting.status === 'completed' ? 'blue' :
                                    'red'
                                  }>
                                    {meeting.status}
                                  </Badge>
                                  <Text fontSize="xs" color={textColor}>
                                    {new Date(meeting.createdAt).toLocaleDateString()}
                                  </Text>
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
                                  <Button
                                    leftIcon={<ExternalLink size={16} />}
                                    colorScheme="green"
                                    size="sm"
                                    as={Link}
                                    href={meeting.meetingLink}
                                    target="_blank"
                                    w="full"
                                  >
                                    Join Meeting
                                  </Button>
                                )}
                                
                                {meeting.notes && (
                                  <Box>
                                    <Text fontSize="xs" fontWeight="medium" mb={1}>Notes:</Text>
                                    <Text fontSize="xs" color={textColor}>{meeting.notes}</Text>
                                  </Box>
                                )}
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    ) : (
                      <Center minH="200px">
                        <VStack spacing={2}>
                          <Video size={48} opacity={0.3} />
                          <Text color={textColor}>No meetings scheduled</Text>
                          <Button
                            leftIcon={<Video size={18} />}
                            colorScheme="brand"
                            size="sm"
                            onClick={onMeetingOpen}
                          >
                            Request Meeting
                          </Button>
                        </VStack>
                      </Center>
                    )}
                  </VStack>
                </TabPanel>

                {/* Notes Tab */}
                <TabPanel px={0} pt={6}>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <HStack spacing={2} mb={3}>
                        <MessageSquare size={18} />
                        <Text fontWeight="medium">Add a Note</Text>
                      </HStack>
                      <form onSubmit={handleAddNote}>
                        <VStack spacing={3} align="stretch">
                          <FormControl>
                            <Textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Add a note or question about this project..."
                              rows={3}
                            />
                          </FormControl>
                          <Button
                            type="submit"
                            colorScheme="brand"
                            size="sm"
                            isLoading={isAddingNote}
                            loadingText="Adding..."
                            alignSelf="flex-end"
                          >
                            Add Note
                          </Button>
                        </VStack>
                      </form>
                    </Box>

                    {project.clientNotes && project.clientNotes.length > 0 && (
                      <Box>
                        <Text fontWeight="medium" mb={3}>Your Notes</Text>
                        <VStack spacing={2} align="stretch">
                          {project.clientNotes.map((note, idx) => (
                            <Box key={idx} bg={cardBg} p={3} borderRadius="md">
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
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Box>
      </VStack>

      {/* Meeting Request Modal */}
      <Modal isOpen={isMeetingOpen} onClose={onMeetingClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request a Meeting</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={async (e) => {
            e.preventDefault()
            try {
              await requestMeeting({
                projectId: id,
                requestedDate: meetingData.requestedDate,
                agenda: meetingData.agenda,
              }).unwrap()
              toast({
                title: 'Meeting requested',
                description: 'Your meeting request has been submitted',
                status: 'success',
                duration: 3000,
                isClosable: true,
              })
              setMeetingData({ requestedDate: '', agenda: '' })
              onMeetingClose()
              refetch()
            } catch (err) {
              toast({
                title: 'Error',
                description: err?.data?.message || 'Failed to request meeting',
                status: 'error',
                duration: 5000,
                isClosable: true,
              })
            }
          }}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Preferred Date</FormLabel>
                  <Input
                    type="date"
                    value={meetingData.requestedDate}
                    onChange={(e) => setMeetingData({ ...meetingData, requestedDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Agenda (Optional)</FormLabel>
                  <Textarea
                    value={meetingData.agenda}
                    onChange={(e) => setMeetingData({ ...meetingData, agenda: e.target.value })}
                    placeholder="What would you like to discuss?"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onMeetingClose}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="brand" isLoading={isRequestingMeeting}>
                Request Meeting
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  )
}

export default UserClientProjectView

