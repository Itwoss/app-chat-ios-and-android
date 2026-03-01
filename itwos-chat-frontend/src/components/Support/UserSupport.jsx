import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  useColorModeValue,
  Badge,
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
  Input,
  Textarea,
  Select,
  useToast,
  Spinner,
  Center,
  Divider,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { MessageSquare, Plus, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  useCreateSupportTicketMutation,
  useGetUserTicketsQuery,
  useGetTicketByIdQuery,
  useAddTicketResponseMutation,
} from '../../store/api/supportApi';
import { getSocket } from '../../utils/socket';

const UserSupport = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { isOpen: isTicketOpen, onOpen: onTicketOpen, onClose: onTicketClose } = useDisclosure();

  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    category: 'other',
    priority: 'medium',
  });

  const [createTicket, { isLoading: isCreating }] = useCreateSupportTicketMutation();
  const { data: ticketsData, isLoading: ticketsLoading, refetch: refetchTickets } = useGetUserTicketsQuery({
    status: selectedStatus === 'all' ? undefined : selectedStatus,
  });
  const { data: ticketData, isLoading: ticketLoading, refetch: refetchTicket } = useGetTicketByIdQuery(selectedTicket, {
    skip: !selectedTicket,
  });
  const [addResponse, { isLoading: isResponding }] = useAddTicketResponseMutation();

  const [responseMessage, setResponseMessage] = useState('');

  const tickets = ticketsData?.data?.tickets || [];
  const ticket = ticketData?.data;

  // Real-time Socket.IO listeners for support ticket responses
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleTicketResponse = (data) => {
      toast({
        title: 'New Response',
        description: data.message || 'You have a new response on your support ticket',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      refetchTickets();
      if (selectedTicket) {
        refetchTicket();
      }
    };

    const handleStatusUpdate = (data) => {
      toast({
        title: 'Ticket Status Updated',
        description: data.message || `Your ticket status changed to: ${data.status}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      refetchTickets();
      if (selectedTicket) {
        refetchTicket();
      }
    };

    socket.on('support-ticket-response', handleTicketResponse);
    socket.on('support-ticket-status-updated', handleStatusUpdate);

    return () => {
      socket.off('support-ticket-response', handleTicketResponse);
      socket.off('support-ticket-status-updated', handleStatusUpdate);
    };
  }, [refetchTickets, refetchTicket, selectedTicket, toast]);

  const handleCreateTicket = async () => {
    if (!formData.subject || !formData.message) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await createTicket(formData).unwrap();
      toast({
        title: 'Success',
        description: 'Support ticket created successfully',
        status: 'success',
        duration: 3000,
      });
      onClose();
      setFormData({
        subject: '',
        message: '',
        category: 'other',
        priority: 'medium',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to create ticket',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleViewTicket = (ticketId) => {
    setSelectedTicket(ticketId);
    onTicketOpen();
  };

  const handleAddResponse = async () => {
    if (!responseMessage.trim()) {
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
        message: responseMessage,
      }).unwrap();
      toast({
        title: 'Success',
        description: 'Response added successfully',
        status: 'success',
        duration: 3000,
      });
      setResponseMessage('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to add response',
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

  const getStatusIcon = (status) => {
    if (status === 'resolved') return <CheckCircle size={16} />;
    if (status === 'closed') return <XCircle size={16} />;
    if (status === 'in_progress') return <Clock size={16} />;
    return <AlertCircle size={16} />;
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
        {/* Header */}
        <HStack justify="space-between">
          <HStack spacing={2}>
            <MessageSquare size={24} />
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              Support Center
            </Text>
          </HStack>
          <Button leftIcon={<Plus size={16} />} colorScheme="blue" onClick={onOpen}>
            New Ticket
          </Button>
        </HStack>

        {/* Status Filter */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <HStack spacing={4}>
              <Button
                variant={selectedStatus === 'all' ? 'solid' : 'ghost'}
                colorScheme="blue"
                onClick={() => setSelectedStatus('all')}
              >
                All
              </Button>
              <Button
                variant={selectedStatus === 'open' ? 'solid' : 'ghost'}
                colorScheme="blue"
                onClick={() => setSelectedStatus('open')}
              >
                Open
              </Button>
              <Button
                variant={selectedStatus === 'in_progress' ? 'solid' : 'ghost'}
                colorScheme="blue"
                onClick={() => setSelectedStatus('in_progress')}
              >
                In Progress
              </Button>
              <Button
                variant={selectedStatus === 'resolved' ? 'solid' : 'ghost'}
                colorScheme="blue"
                onClick={() => setSelectedStatus('resolved')}
              >
                Resolved
              </Button>
              <Button
                variant={selectedStatus === 'closed' ? 'solid' : 'ghost'}
                colorScheme="blue"
                onClick={() => setSelectedStatus('closed')}
              >
                Closed
              </Button>
            </HStack>
          </CardBody>
        </Card>

        {/* Tickets List */}
        {ticketsLoading ? (
          <Center py={8}>
            <Spinner size="lg" />
          </Center>
        ) : (
          <VStack spacing={4} align="stretch">
            {tickets.map((ticket) => (
              <Card
                key={ticket._id}
                bg={bgColor}
                border="1px"
                borderColor={borderColor}
                _hover={{ shadow: 'md', cursor: 'pointer' }}
                onClick={() => handleViewTicket(ticket._id)}
              >
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="lg" color={textColor}>
                        {ticket.subject}
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme={getStatusColor(ticket.status)}>
                          <HStack spacing={1}>
                            {getStatusIcon(ticket.status)}
                            <Text>{ticket.status.replace('_', ' ')}</Text>
                          </HStack>
                        </Badge>
                        <Badge colorScheme={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </HStack>
                    </HStack>
                    <Text fontSize="sm" color={textColor} opacity={0.7} noOfLines={2}>
                      {ticket.message}
                    </Text>
                    <HStack justify="space-between" fontSize="xs" color={textColor} opacity={0.6}>
                      <Text>Category: {ticket.category}</Text>
                      <Text>
                        {new Date(ticket.createdAt).toLocaleDateString()} at{' '}
                        {new Date(ticket.createdAt).toLocaleTimeString()}
                      </Text>
                    </HStack>
                    {ticket.responses && ticket.responses.length > 0 && (
                      <Text fontSize="xs" color="blue.500">
                        {ticket.responses.length} response(s)
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            ))}

            {tickets.length === 0 && (
              <Center py={8}>
                <Text color={textColor} opacity={0.7}>
                  No support tickets found
                </Text>
              </Center>
            )}
          </VStack>
        )}
      </VStack>

      {/* Create Ticket Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={bgColor}>
          <ModalHeader color={textColor}>Create Support Ticket</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color={textColor}>Subject</FormLabel>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Enter ticket subject"
                />
              </FormControl>

              <FormControl>
                <FormLabel color={textColor}>Category</FormLabel>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="account">Account</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color={textColor}>Priority</FormLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel color={textColor}>Message</FormLabel>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue or question..."
                  rows={6}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateTicket} isLoading={isCreating}>
              Submit Ticket
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Ticket Modal */}
      <Modal isOpen={isTicketOpen} onClose={onTicketClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={bgColor} maxH="90vh" overflowY="auto">
          <ModalHeader color={textColor}>Support Ticket</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {ticketLoading ? (
              <Center py={8}>
                <Spinner />
              </Center>
            ) : ticket ? (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
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
                  </HStack>
                </HStack>

                <Box bg={cardBg} p={4} borderRadius="md">
                  <Text color={textColor} whiteSpace="pre-wrap">
                    {ticket.message}
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
                {ticket.status !== 'closed' && (
                  <>
                    <Divider />
                    <FormControl>
                      <FormLabel color={textColor}>Add Response</FormLabel>
                      <Textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Type your response..."
                        rows={4}
                      />
                    </FormControl>
                    <Button
                      colorScheme="blue"
                      onClick={handleAddResponse}
                      isLoading={isResponding}
                    >
                      Send Response
                    </Button>
                  </>
                )}
              </VStack>
            ) : null}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default UserSupport;

