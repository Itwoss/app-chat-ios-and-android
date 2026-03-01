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
  Spinner,
  Center,
  useColorModeValue,
  Text,
  VStack,
  Heading,
  Avatar,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
} from '@chakra-ui/react'
import { Search, Calendar, Video, X } from 'lucide-react'
import { useState, useRef } from 'react'
import { useGetAllMeetingsQuery, useScheduleMeetingMutation, useCancelMeetingMutation } from '../store/api/adminApi'
import { useDebounce } from '../hooks/useDebounce'
import { EmptyState } from '../components/EmptyState/EmptyState'
import AdminLayout from '../components/Admin/AdminLayout'

const AdminMeetings = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  
  const { isOpen: isScheduleOpen, onOpen: onScheduleOpen, onClose: onScheduleClose } = useDisclosure()
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure()
  const cancelRef = useRef()

  const { data, isLoading, error, refetch } = useGetAllMeetingsQuery({
    page,
    limit: 10,
    search: debouncedSearch,
    status: statusFilter,
  })

  const [scheduleMeeting, { isLoading: isScheduling }] = useScheduleMeetingMutation()
  const [cancelMeeting, { isLoading: isCancelling }] = useCancelMeetingMutation()

  const [scheduleData, setScheduleData] = useState({
    scheduledDate: '',
    scheduledTime: '',
    meetingLink: '',
    meetingPlatform: 'google-meet',
    notes: '',
  })

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

  const getStatusColor = (status) => {
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

  if (error) {
    return (
      <AdminLayout>
        <Center minH="400px">
          <Text color="red.500">Error loading meetings</Text>
        </Center>
      </AdminLayout>
    )
  }

  const meetings = data?.data || []
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 }

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" mb={2}>
          Meeting Management
        </Heading>
        <Text color={textColor}>
          Manage client meeting requests and schedule meetings.
        </Text>

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
            justify="space-between"
            align={{ base: 'stretch', md: 'center' }}
          >
            <InputGroup maxW={{ base: 'full', md: '300px' }}>
              <InputLeftElement pointerEvents="none">
                <Search size={18} />
              </InputLeftElement>
              <Input
                placeholder="Search by project or client..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </InputGroup>

            <Select
              maxW={{ base: 'full', md: '200px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </Flex>

          {meetings.length === 0 ? (
            <EmptyState
              title="No meetings found"
              description="There are no meeting requests at the moment."
            />
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Client</Th>
                    <Th>Project</Th>
                    <Th>Requested Date</Th>
                    <Th>Scheduled Date/Time</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {meetings.map((meeting) => (
                    <Tr key={meeting._id}>
                      <Td>
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
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontWeight="medium">
                          {meeting.projectId?.projectTitle || 'N/A'}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(meeting.requestedDate).toLocaleDateString()}
                        </Text>
                      </Td>
                      <Td>
                        {meeting.scheduledDate ? (
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm">
                              {new Date(meeting.scheduledDate).toLocaleDateString()}
                            </Text>
                            {meeting.scheduledTime && (
                              <Text fontSize="xs" color={textColor}>
                                {meeting.scheduledTime}
                              </Text>
                            )}
                            {meeting.meetingLink && (
                              <Text fontSize="xs" color="blue.500" as="a" href={meeting.meetingLink} target="_blank">
                                Join Meeting
                              </Text>
                            )}
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color={textColor}>
                            Not scheduled
                          </Text>
                        )}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(meeting.status)}>
                          {meeting.status}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          {meeting.status === 'pending' && (
                            <Tooltip label="Schedule Meeting">
                              <IconButton
                                icon={<Calendar size={16} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="green"
                                onClick={() => handleSchedule(meeting)}
                                aria-label="Schedule meeting"
                              />
                            </Tooltip>
                          )}
                          {meeting.status !== 'cancelled' && (
                            <Tooltip label="Cancel Meeting">
                              <IconButton
                                icon={<X size={16} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleCancel(meeting)}
                                aria-label="Cancel meeting"
                              />
                            </Tooltip>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}

          {pagination.pages > 1 && (
            <Flex justify="center" mt={6} gap={2}>
              <Button
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                isDisabled={page === 1}
              >
                Previous
              </Button>
              <Text alignSelf="center" px={4}>
                Page {pagination.page} of {pagination.pages}
              </Text>
              <Button
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                isDisabled={page === pagination.pages}
              >
                Next
              </Button>
            </Flex>
          )}
        </Box>
      </VStack>

      {/* Schedule Meeting Modal */}
      <Modal isOpen={isScheduleOpen} onClose={onScheduleClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Schedule Meeting</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Scheduled Date</FormLabel>
                <Input
                  type="date"
                  value={scheduleData.scheduledDate}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduledDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Scheduled Time</FormLabel>
                <Input
                  type="time"
                  value={scheduleData.scheduledTime}
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduledTime: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Meeting Platform</FormLabel>
                <Select
                  value={scheduleData.meetingPlatform}
                  onChange={(e) => setScheduleData({ ...scheduleData, meetingPlatform: e.target.value })}
                >
                  <option value="google-meet">Google Meet</option>
                  <option value="zoom">Zoom</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Meeting Link</FormLabel>
                <Input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={scheduleData.meetingLink}
                  onChange={(e) => setScheduleData({ ...scheduleData, meetingLink: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Notes (Optional)</FormLabel>
                <Textarea
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                  placeholder="Add any notes about the meeting..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onScheduleClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleScheduleSubmit}
              isLoading={isScheduling}
              loadingText="Scheduling..."
            >
              Schedule Meeting
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Cancel Meeting Confirmation */}
      <Modal isOpen={isCancelOpen} onClose={onCancelClose} size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cancel Meeting</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to cancel this meeting?</Text>
          </ModalBody>
          <ModalFooter>
            <Button ref={cancelRef} variant="ghost" mr={3} onClick={onCancelClose}>
              No
            </Button>
            <Button
              colorScheme="red"
              onClick={confirmCancel}
              isLoading={isCancelling}
              loadingText="Cancelling..."
            >
              Yes, Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminLayout>
  )
}

export default AdminMeetings

