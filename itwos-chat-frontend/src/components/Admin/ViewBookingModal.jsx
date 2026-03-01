import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  useColorModeValue,
  Box,
  Avatar,
  Button,
  Select,
  FormControl,
  FormLabel,
  Textarea,
  SimpleGrid,
} from '@chakra-ui/react'
import { Calendar, User, Mail, Phone, ExternalLink, FileText, FolderKanban } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useConvertBookingToProjectMutation } from '../../store/api/adminApi'
import { useToast } from '@chakra-ui/react'
import { useNavigate } from 'react-router-dom'

const ViewBookingModal = ({ isOpen, onClose, booking, onStatusUpdate }) => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const bgColor = useColorModeValue('gray.50', 'gray.600')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  const navigate = useNavigate()

  const [status, setStatus] = useState(booking?.status || 'pending')
  const [adminNotes, setAdminNotes] = useState(booking?.adminNotes || '')
  const [convertToProject, { isLoading: isConverting }] = useConvertBookingToProjectMutation()

  useEffect(() => {
    if (booking) {
      setStatus(booking.status || 'pending')
      setAdminNotes(booking.adminNotes || '')
    }
  }, [booking])

  const handleConvertToProject = async () => {
    if (!booking || booking.status !== 'confirmed') {
      toast({
        title: 'Error',
        description: 'Only confirmed bookings can be converted to projects',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
      const result = await convertToProject({
        bookingId: booking._id,
        projectTitle: booking.projectId?.websiteTitle || 'New Project',
        description: booking.requirements,
      }).unwrap()

      toast({
        title: 'Success',
        description: 'Booking converted to project successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })

      onClose()
      navigate(`/admin/client-projects/${result.data._id}`)
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to convert booking to project',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'green'
      case 'cancelled':
        return 'red'
      case 'completed':
        return 'blue'
      case 'pending':
      default:
        return 'yellow'
    }
  }

  const handleStatusSave = async () => {
    if (onStatusUpdate && booking) {
      await onStatusUpdate(booking._id, status, adminNotes)
    }
    onClose()
  }

  if (!booking) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>Booking Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* User Information */}
            <Box>
              <HStack spacing={2} mb={3}>
                <User size={18} />
                <Text fontWeight="bold" fontSize="lg">
                  User Information
                </Text>
              </HStack>
              <Box bg={bgColor} p={4} borderRadius="md" border="1px" borderColor={borderColor}>
                <HStack spacing={4} mb={3}>
                  <Avatar
                    size="md"
                    name={booking.userId?.name || 'User'}
                    src={booking.userId?.profileImage || undefined}
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">{booking.userId?.name || 'N/A'}</Text>
                    <HStack spacing={2}>
                      <Mail size={14} />
                      <Text fontSize="sm" color={textColor}>
                        {booking.userId?.email || 'N/A'}
                      </Text>
                    </HStack>
                    {booking.userId?.phoneNumber && (
                      <HStack spacing={2}>
                        <Phone size={14} />
                        <Text fontSize="sm" color={textColor}>
                          +{booking.userId?.countryCode} {booking.userId?.phoneNumber}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </HStack>
              </Box>
            </Box>

            {/* Project Information */}
            <Box>
              <HStack spacing={2} mb={3}>
                <FileText size={18} />
                <Text fontWeight="bold" fontSize="lg">
                  Project Information
                </Text>
              </HStack>
              <Box bg={bgColor} p={4} borderRadius="md" border="1px" borderColor={borderColor}>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold">{booking.projectId?.websiteTitle || 'N/A'}</Text>
                  {booking.projectId?.link && (
                    <HStack spacing={2}>
                      <ExternalLink size={14} />
                      <Text
                        as="a"
                        href={booking.projectId.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        color="blue.500"
                        fontSize="sm"
                        _hover={{ textDecoration: 'underline' }}
                      >
                        {booking.projectId.link}
                      </Text>
                    </HStack>
                  )}
                  {booking.projectId?.description && (
                    <Text fontSize="sm" color={textColor} noOfLines={3}>
                      {booking.projectId.description}
                    </Text>
                  )}
                  {booking.projectId?.status && (
                    <Badge colorScheme={getStatusColor(booking.projectId.status)}>
                      {booking.projectId.status}
                    </Badge>
                  )}
                </VStack>
              </Box>
            </Box>

            <Divider />

            {/* Booking Details */}
            <Box>
              <HStack spacing={2} mb={3}>
                <Calendar size={18} />
                <Text fontWeight="bold" fontSize="lg">
                  Booking Details
                </Text>
              </HStack>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" color={textColor} mb={1}>
                    Requirements
                  </Text>
                  <Text fontSize="md" whiteSpace="pre-wrap">
                    {booking.requirements || 'N/A'}
                  </Text>
                </Box>

                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontSize="sm" color={textColor} mb={1}>
                      Project Type
                    </Text>
                    <Text fontSize="md" fontWeight="medium">
                      {booking.projectType || 'N/A'}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color={textColor} mb={1}>
                      Budget
                    </Text>
                    <Text fontSize="md" fontWeight="medium">
                      {booking.budget || 'N/A'}
                    </Text>
                  </Box>
                </SimpleGrid>

                <Box>
                  <Text fontSize="sm" color={textColor} mb={1}>
                    Project Deadline
                  </Text>
                  <Text fontSize="md" fontWeight="medium">
                    {booking.deadline
                      ? new Date(booking.deadline).toLocaleDateString()
                      : 'Not specified'}
                  </Text>
                </Box>

                <Divider />

                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  Contact Information
                </Text>

                <SimpleGrid columns={2} spacing={4}>
                  {booking.contactEmail && (
                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>
                        Contact Email
                      </Text>
                      <Text fontSize="md">
                        {booking.contactEmail}
                      </Text>
                    </Box>
                  )}
                  {booking.contactPhone && (
                    <Box>
                      <Text fontSize="sm" color={textColor} mb={1}>
                        Contact Phone
                      </Text>
                      <Text fontSize="md">
                        {booking.contactPhone}
                      </Text>
                    </Box>
                  )}
                </SimpleGrid>

                {booking.additionalContactInfo && (
                  <Box>
                    <Text fontSize="sm" color={textColor} mb={1}>
                      Additional Contact Info
                    </Text>
                    <Text fontSize="md" whiteSpace="pre-wrap">
                      {booking.additionalContactInfo}
                    </Text>
                  </Box>
                )}

                <Divider />

                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  Demo Preferences
                </Text>

                <HStack spacing={4}>
                  <Box flex="1">
                    <Text fontSize="sm" color={textColor} mb={1}>
                      Preferred Date
                    </Text>
                    <Text fontSize="md">
                      {booking.preferredDate
                        ? new Date(booking.preferredDate).toLocaleDateString()
                        : 'Not specified'}
                    </Text>
                  </Box>
                  <Box flex="1">
                    <Text fontSize="sm" color={textColor} mb={1}>
                      Preferred Time
                    </Text>
                    <Text fontSize="md">
                      {booking.preferredTime || 'Not specified'}
                    </Text>
                  </Box>
                </HStack>

                <Box>
                  <Text fontSize="sm" color={textColor} mb={1}>
                    Booking Status
                  </Text>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    colorScheme="brand"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </Select>
                </Box>

                <FormControl>
                  <FormLabel fontSize="sm">Admin Notes</FormLabel>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this booking..."
                    rows={3}
                  />
                </FormControl>

                <HStack spacing={2} mt={2}>
                  <Text fontSize="sm" color={textColor}>
                    Created: {new Date(booking.createdAt).toLocaleString()}
                  </Text>
                  {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                    <Text fontSize="sm" color={textColor}>
                      Updated: {new Date(booking.updatedAt).toLocaleString()}
                    </Text>
                  )}
                </HStack>
              </VStack>
            </Box>

            <Divider />

            {booking?.status === 'confirmed' && (
              <Box
                bg={useColorModeValue('green.50', 'green.900')}
                p={4}
                borderRadius="md"
                border="1px"
                borderColor={useColorModeValue('green.200', 'green.700')}
                mb={4}
              >
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('green.700', 'green.300')}>
                    Ready to Start Project?
                  </Text>
                  <Text fontSize="xs" color={textColor}>
                    Convert this confirmed booking to a client project to start tracking progress.
                  </Text>
                  <Button
                    leftIcon={<FolderKanban size={16} />}
                    colorScheme="green"
                    size="sm"
                    onClick={handleConvertToProject}
                    isLoading={isConverting}
                    loadingText="Converting..."
                  >
                    Convert to Project
                  </Button>
                </VStack>
              </Box>
            )}

            <HStack justify="flex-end" spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button colorScheme="brand" onClick={handleStatusSave}>
                Save Changes
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default ViewBookingModal

