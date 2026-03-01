import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Card,
  CardBody,
  useColorModeValue,
  useToast,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  NumberInput,
  NumberInputField,
  Switch,
  Select,
} from '@chakra-ui/react';
import { Plus, Calendar, X, Edit2 } from 'lucide-react';
import { useState } from 'react';
import {
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useCancelEventMutation,
} from '../../store/api/eventApi';

const AdminEventManagement = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingEvent, setEditingEvent] = useState(null);

  const { data, isLoading } = useGetEventsQuery({});
  const [createEvent] = useCreateEventMutation();
  const [updateEvent] = useUpdateEventMutation();
  const [cancelEvent] = useCancelEventMutation();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    reward: 10000,
    applyToMonthly: true,
    applyToTotal: false,
  });

  const handleCreate = () => {
    setEditingEvent(null);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      reward: 10000,
      applyToMonthly: true,
      applyToTotal: false,
    });
    onOpen();
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description || '',
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      reward: event.reward,
      applyToMonthly: event.applyToMonthly,
      applyToTotal: event.applyToTotal,
    });
    onOpen();
  };

  const handleSubmit = async () => {
    try {
      if (editingEvent) {
        await updateEvent({
          eventId: editingEvent._id,
          ...formData,
        }).unwrap();
        toast({
          title: 'Success',
          description: 'Event updated successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        await createEvent(formData).unwrap();
        toast({
          title: 'Success',
          description: 'Event created successfully',
          status: 'success',
          duration: 3000,
        });
      }
      onClose();
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        reward: 10000,
        applyToMonthly: true,
        applyToTotal: false,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to save event',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleCancel = async (eventId, reason) => {
    try {
      await cancelEvent({ eventId, reason }).unwrap();
      toast({
        title: 'Success',
        description: 'Event cancelled successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to cancel event',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const events = data?.data?.events || [];

  const getEventStatus = (event) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (event.isCancelled) return { label: 'Cancelled', color: 'red' };
    if (now < start) return { label: 'Upcoming', color: 'blue' };
    if (now >= start && now <= end) return { label: 'Active', color: 'green' };
    return { label: 'Ended', color: 'gray' };
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Calendar size={24} />
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              Event Management
            </Text>
          </HStack>
          <Button leftIcon={<Plus size={16} />} colorScheme="blue" onClick={handleCreate}>
            Create Event
          </Button>
        </HStack>

        {/* Events Table */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color={textColor}>Name</Th>
                  <Th color={textColor}>Start Date</Th>
                  <Th color={textColor}>End Date</Th>
                  <Th color={textColor}>Reward</Th>
                  <Th color={textColor}>Completions</Th>
                  <Th color={textColor}>Status</Th>
                  <Th color={textColor}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {events.map((event) => {
                  const status = getEventStatus(event);
                  return (
                    <Tr key={event._id}>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="medium" color={textColor}>
                            {event.name}
                          </Text>
                          {event.description && (
                            <Text fontSize="xs" color={textColor} opacity={0.7}>
                              {event.description.substring(0, 50)}...
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td color={textColor}>
                        {new Date(event.startDate).toLocaleDateString()}
                      </Td>
                      <Td color={textColor}>
                        {new Date(event.endDate).toLocaleDateString()}
                      </Td>
                      <Td color={textColor}>{event.reward.toLocaleString()}</Td>
                      <Td color={textColor}>
                        {event.completions?.length || 0}
                      </Td>
                      <Td>
                        <Badge colorScheme={status.color}>{status.label}</Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<Edit2 size={16} />}
                            size="sm"
                            onClick={() => handleEdit(event)}
                            aria-label="Edit event"
                          />
                          {!event.isCancelled && status.label === 'Active' && (
                            <IconButton
                              icon={<X size={16} />}
                              size="sm"
                              colorScheme="red"
                              onClick={() =>
                                handleCancel(event._id, 'Cancelled by admin')
                              }
                              aria-label="Cancel event"
                            />
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>

            {events.length === 0 && (
              <Box textAlign="center" py={8}>
                <Text color={textColor} opacity={0.7}>
                  No events found. Create one to get started.
                </Text>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Create/Edit Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent bg={bgColor}>
            <ModalHeader color={textColor}>
              {editingEvent ? 'Edit Event' : 'Create Event'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel color={textColor}>Event Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter event name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter event description"
                    rows={3}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>Start Date & Time</FormLabel>
                  <Input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>End Date & Time</FormLabel>
                  <Input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={textColor}>Reward Points</FormLabel>
                  <NumberInput
                    value={formData.reward}
                    onChange={(_, value) =>
                      setFormData({ ...formData, reward: value })
                    }
                    min={0}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <FormLabel mb={0} color={textColor}>
                        Apply to Monthly Count
                      </FormLabel>
                      <Text fontSize="xs" color={textColor} opacity={0.7}>
                        Add reward to current month count
                      </Text>
                    </VStack>
                    <Switch
                      isChecked={formData.applyToMonthly}
                      onChange={(e) =>
                        setFormData({ ...formData, applyToMonthly: e.target.checked })
                      }
                      colorScheme="blue"
                    />
                  </HStack>
                </FormControl>

                <FormControl>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <FormLabel mb={0} color={textColor}>
                        Apply to Total Count
                      </FormLabel>
                      <Text fontSize="xs" color={textColor} opacity={0.7}>
                        Add reward to lifetime total
                      </Text>
                    </VStack>
                    <Switch
                      isChecked={formData.applyToTotal}
                      onChange={(e) =>
                        setFormData({ ...formData, applyToTotal: e.target.checked })
                      }
                      colorScheme="blue"
                    />
                  </HStack>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleSubmit}>
                {editingEvent ? 'Update' : 'Create'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default AdminEventManagement;

