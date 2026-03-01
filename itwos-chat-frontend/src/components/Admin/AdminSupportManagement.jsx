import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  useColorModeValue,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  useToast,
  Spinner,
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { MessageSquare, AlertCircle, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  useGetAllTicketsQuery,
  useGetAdminTicketByIdQuery,
  useAddAdminResponseMutation,
  useUpdateTicketStatusMutation,
} from '../../store/api/supportApi';
import { getSocket } from '../../utils/socket';

const AdminSupportManagement = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const toast = useToast();
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: '',
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [responseData, setResponseData] = useState({
    message: '',
    changeStatus: '',
    resolutionNotes: '',
  });

  const { data, isLoading, refetch } = useGetAllTicketsQuery(filters);
  const { data: ticketData, isLoading: ticketLoading } = useGetAdminTicketByIdQuery(
    selectedTicket,
    { skip: !selectedTicket }
  );
  const [addResponse, { isLoading: isResponding }] = useAddAdminResponseMutation();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateTicketStatusMutation();

  const tickets = data?.data?.tickets || [];
  const stats = data?.data?.stats || {};
  const ticket = ticketData?.data;

  // Real-time Socket.IO listeners for support tickets
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewTicket = (data) => {
      toast({
        title: 'New Support Ticket',
        description: data.message || 'A new support ticket has been created',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      refetch();
    };

    const handleTicketUpdate = (data) => {
      toast({
        title: 'Ticket Updated',
        description: data.message || 'A support ticket has been updated',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      refetch();
    };

    socket.on('new-support-ticket', handleNewTicket);
    socket.on('support-ticket-updated', handleTicketUpdate);

    return () => {
      socket.off('new-support-ticket', handleNewTicket);
      socket.off('support-ticket-updated', handleTicketUpdate);
    };
  }, [refetch, toast]);

  const handleViewTicket = (ticketId) => {
    setSelectedTicket(ticketId);
    setResponseData({ message: '', changeStatus: '', resolutionNotes: '' });
    onOpen();
  };

  const handleAddResponse = async () => {
    if (!responseData.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a message',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await addResponse({
        ticketId: selectedTicket,
        ...responseData,
      }).unwrap();
      toast({
        title: 'Success',
        description: 'Response added successfully',
        status: 'success',
        duration: 3000,
      });
      setResponseData({ message: '', changeStatus: '', resolutionNotes: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to add response',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    try {
      await updateStatus({
        ticketId,
        status,
      }).unwrap();
      toast({
        title: 'Success',
        description: 'Ticket status updated',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to update status',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'blue',
      in_progress: 'yellow',
      resolved: 'green',
      closed: 'gray',
    };
    return colors[status] || 'gray';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'gray',
      medium: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colors[priority] || 'gray';
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <Card bg={bgColor}>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack spacing={1}>
                    <AlertCircle size={16} />
                    <Text>Open</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="blue.500">{stats.open || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bgColor}>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack spacing={1}>
                    <Clock size={16} />
                    <Text>In Progress</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="yellow.500">{stats.in_progress || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bgColor}>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack spacing={1}>
                    <CheckCircle size={16} />
                    <Text>Resolved</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="green.500">{stats.resolved || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bgColor}>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack spacing={1}>
                    <XCircle size={16} />
                    <Text>Closed</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="gray.500">{stats.closed || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={bgColor}>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack spacing={1}>
                    <AlertCircle size={16} />
                    <Text>Urgent</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="red.500">{stats.urgent || 0}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                  Status
                </Text>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  placeholder="All Statuses"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                  Priority
                </Text>
                <Select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  placeholder="All Priorities"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                  Category
                </Text>
                <Select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  placeholder="All Categories"
                >
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="account">Account</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="other">Other</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                  Search
                </Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Search size={16} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search tickets..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </InputGroup>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Tickets Table */}
        {isLoading ? (
          <Center py={8}>
            <Spinner size="lg" />
          </Center>
        ) : (
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th color={textColor}>User</Th>
                    <Th color={textColor}>Subject</Th>
                    <Th color={textColor}>Category</Th>
                    <Th color={textColor}>Priority</Th>
                    <Th color={textColor}>Status</Th>
                    <Th color={textColor}>Created</Th>
                    <Th color={textColor}>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {tickets.map((ticket) => (
                    <Tr key={ticket._id} _hover={{ bg: cardBg, cursor: 'pointer' }}>
                      <Td>
                        <HStack spacing={2}>
                          <Avatar size="sm" src={ticket.user?.profileImage} name={ticket.user?.name} />
                          <Text color={textColor}>{ticket.user?.name}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Text color={textColor} fontWeight="medium">
                          {ticket.subject}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue" variant="outline">
                          {ticket.category}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td color={textColor}>
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </Td>
                      <Td>
                        <Button size="sm" colorScheme="blue" onClick={() => handleViewTicket(ticket._id)}>
                          View
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {tickets.length === 0 && (
                <Center py={8}>
                  <Text color={textColor} opacity={0.7}>
                    No tickets found
                  </Text>
                </Center>
              )}
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* View Ticket Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={bgColor} maxH="90vh" overflowY="auto">
          <ModalHeader color={textColor}>Support Ticket Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {ticketLoading ? (
              <Center py={8}>
                <Spinner />
              </Center>
            ) : ticket ? (
              <VStack spacing={4} align="stretch">
                {/* Ticket Info */}
                <HStack justify="space-between">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" fontSize="lg" color={textColor}>
                      {ticket.subject}
                    </Text>
                    <HStack spacing={2}>
                      <Badge colorScheme={getStatusColor(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                      <Badge colorScheme={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                      <Badge colorScheme="blue" variant="outline">
                        {ticket.category}
                      </Badge>
                    </HStack>
                  </VStack>
                </HStack>

                {/* User Info */}
                <Box bg={cardBg} p={4} borderRadius="md">
                  <HStack spacing={3}>
                    <Avatar src={ticket.user?.profileImage} name={ticket.user?.name} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium" color={textColor}>
                        {ticket.user?.name}
                      </Text>
                      <Text fontSize="sm" color={textColor} opacity={0.7}>
                        {ticket.user?.email}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>

                {/* Original Message */}
                <Box bg={cardBg} p={4} borderRadius="md">
                  <Text fontWeight="medium" color={textColor} mb={2}>
                    Original Message
                  </Text>
                  <Text color={textColor} whiteSpace="pre-wrap">
                    {ticket.message}
                  </Text>
                  <Text fontSize="xs" color={textColor} opacity={0.6} mt={2}>
                    Created: {new Date(ticket.createdAt).toLocaleString()}
                  </Text>
                </Box>

                <Divider />

                {/* Responses */}
                <Text fontWeight="bold" color={textColor}>
                  Responses ({ticket.responses?.length || 0})
                </Text>

                {ticket.responses?.map((response, index) => (
                  <Box
                    key={index}
                    bg={response.isAdmin ? 'blue.50' : cardBg}
                    p={4}
                    borderRadius="md"
                    borderLeft="4px"
                    borderColor={response.isAdmin ? 'blue.500' : 'gray.300'}
                  >
                    <HStack spacing={2} mb={2}>
                      <Avatar size="sm" src={response.user?.profileImage} name={response.user?.name} />
                      <VStack align="start" spacing={0}>
                        <HStack spacing={2}>
                          <Text fontWeight="medium" color={textColor}>
                            {response.user?.name}
                          </Text>
                          {response.isAdmin && (
                            <Badge colorScheme="blue" size="sm">
                              Admin
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="xs" color={textColor} opacity={0.6}>
                          {new Date(response.createdAt).toLocaleString()}
                        </Text>
                      </VStack>
                    </HStack>
                    <Text color={textColor} whiteSpace="pre-wrap">
                      {response.message}
                    </Text>
                  </Box>
                ))}

                {/* Add Response */}
                <Divider />
                <FormControl>
                  <FormLabel color={textColor}>Response Message</FormLabel>
                  <Textarea
                    value={responseData.message}
                    onChange={(e) =>
                      setResponseData({ ...responseData, message: e.target.value })
                    }
                    placeholder="Type your response..."
                    rows={4}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>Change Status (Optional)</FormLabel>
                  <Select
                    value={responseData.changeStatus}
                    onChange={(e) =>
                      setResponseData({ ...responseData, changeStatus: e.target.value })
                    }
                    placeholder="Keep current status"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </Select>
                </FormControl>

                {responseData.changeStatus === 'resolved' && (
                  <FormControl>
                    <FormLabel color={textColor}>Resolution Notes</FormLabel>
                    <Textarea
                      value={responseData.resolutionNotes}
                      onChange={(e) =>
                        setResponseData({ ...responseData, resolutionNotes: e.target.value })
                      }
                      placeholder="Add resolution notes..."
                      rows={3}
                    />
                  </FormControl>
                )}

                <HStack spacing={2}>
                  <Button
                    colorScheme="blue"
                    onClick={handleAddResponse}
                    isLoading={isResponding}
                    flex="1"
                  >
                    Send Response
                  </Button>
                  {ticket.status !== 'closed' && (
                    <>
                      <Button
                        colorScheme="green"
                        variant="outline"
                        onClick={() => handleUpdateStatus(ticket._id, 'resolved')}
                        isLoading={isUpdating}
                      >
                        Mark Resolved
                      </Button>
                      <Button
                        colorScheme="red"
                        variant="outline"
                        onClick={() => handleUpdateStatus(ticket._id, 'closed')}
                        isLoading={isUpdating}
                      >
                        Close
                      </Button>
                    </>
                  )}
                </HStack>
              </VStack>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminSupportManagement;

