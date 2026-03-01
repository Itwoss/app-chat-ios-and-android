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
  Tooltip
} from '@chakra-ui/react'
import { Search, Eye, Trash2, Edit } from 'lucide-react'
import { useState, useRef } from 'react'
import { useGetAllBookingsQuery, useDeleteBookingMutation, useUpdateBookingStatusMutation } from '../store/api/adminApi'
import { useDebounce } from '../hooks/useDebounce'
import { EmptyState } from '../components/EmptyState/EmptyState'
import AdminLayout from '../components/Admin/AdminLayout'
import ViewBookingModal from '../components/Admin/ViewBookingModal'

const AdminBookings = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [deleteBookingId, setDeleteBookingId] = useState(null)
  
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = useRef()

  const { data, isLoading, error, refetch } = useGetAllBookingsQuery({
    page,
    limit: 10,
    search: debouncedSearch,
    status: statusFilter,
  })

  const [deleteBooking] = useDeleteBookingMutation()
  const [updateBookingStatus] = useUpdateBookingStatusMutation()

  const handleView = (booking) => {
    setSelectedBooking(booking)
    onViewOpen()
  }

  const handleDelete = (bookingId) => {
    setDeleteBookingId(bookingId)
    onDeleteOpen()
  }

  const confirmDelete = async () => {
    try {
      await deleteBooking(deleteBookingId).unwrap()
      toast({
        title: 'Booking deleted',
        description: 'Booking has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onDeleteClose()
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to delete booking',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleStatusChange = async (bookingId, newStatus, adminNotes = '') => {
    try {
      await updateBookingStatus({
        id: bookingId,
        status: newStatus,
        ...(adminNotes !== '' && { adminNotes })
      }).unwrap()
      toast({
        title: 'Status updated',
        description: 'Booking status has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to update status',
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed'
      case 'cancelled':
        return 'Cancelled'
      case 'completed':
        return 'Completed'
      case 'pending':
      default:
        return 'Pending'
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
          <Text color="red.500">Error loading bookings</Text>
        </Center>
      </AdminLayout>
    )
  }

  const bookings = data?.data || []
  const pagination = data?.pagination || {}

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Heading size="lg">Demo Bookings</Heading>
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
                placeholder="Search by user name, email, or project..."
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </Select>
          </Flex>

          {bookings.length === 0 ? (
            <EmptyState
              title="No bookings found"
              description="There are no demo bookings to display."
            />
          ) : (
            <>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>User</Th>
                      <Th>Project</Th>
                      <Th>Type</Th>
                      <Th>Budget</Th>
                      <Th>Deadline</Th>
                      <Th>Status</Th>
                      <Th>Created</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {bookings.map((booking) => (
                      <Tr key={booking._id}>
                        <Td>
                          <HStack spacing={2}>
                            <Avatar
                              size="sm"
                              name={booking.userId?.name || 'User'}
                              src={booking.userId?.profileImage || undefined}
                            />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="medium" fontSize="sm">
                                {booking.userId?.name || 'N/A'}
                              </Text>
                              <Text fontSize="xs" color={textColor}>
                                {booking.userId?.email || 'N/A'}
                              </Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                            {booking.projectId?.websiteTitle || 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" fontWeight="medium">
                            {booking.projectType || 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {booking.budget || 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          {booking.deadline ? (
                            <Text fontSize="sm">
                              {new Date(booking.deadline).toLocaleDateString()}
                            </Text>
                          ) : (
                            <Text fontSize="sm" color={textColor}>Not specified</Text>
                          )}
                        </Td>
                        <Td>
                          <Select
                            size="sm"
                            value={booking.status}
                            onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                            w="130px"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                          </Select>
                        </Td>
                        <Td>
                          <Text fontSize="sm" color={textColor}>
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Tooltip label="View Details">
                              <IconButton
                                icon={<Eye size={16} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => handleView(booking)}
                                aria-label="View booking"
                              />
                            </Tooltip>
                            <Tooltip label="Delete">
                              <IconButton
                                icon={<Trash2 size={16} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDelete(booking._id)}
                                aria-label="Delete booking"
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
                    {pagination.total} bookings
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

      {/* View Booking Modal */}
      {selectedBooking && (
        <ViewBookingModal
          isOpen={isViewOpen}
          onClose={onViewClose}
          booking={selectedBooking}
          onStatusUpdate={handleStatusChange}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Booking
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

export default AdminBookings

