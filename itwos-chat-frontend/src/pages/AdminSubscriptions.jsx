import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useToast,
  Input,
  Select,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { MoreVertical, Download, X, RefreshCw, Calendar } from 'lucide-react';
import { useState } from 'react';
import {
  useGetAllSubscriptionsAdminQuery,
  useGetSubscriptionStatsAdminQuery,
  useUpdateSubscriptionAdminMutation,
  useRevokeSubscriptionAdminMutation,
  useExtendSubscriptionAdminMutation,
  useExportSubscriptionsAdminQuery,
} from '../store/api/adminApi';
import VerifiedBadge from '../components/VerifiedBadge/VerifiedBadge';
import AdminLayout from '../components/Admin/AdminLayout';

// Simple date formatter (replacing date-fns)
const formatDate = (date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate().toString().padStart(2, '0')}, ${d.getFullYear()}`;
};

const AdminSubscriptions = () => {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [badgeTypeFilter, setBadgeTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const { isOpen: isExtendOpen, onOpen: onExtendOpen, onClose: onExtendClose } = useDisclosure();
  const { isOpen: isRevokeOpen, onOpen: onRevokeOpen, onClose: onRevokeClose } = useDisclosure();
  const [additionalMonths, setAdditionalMonths] = useState(1);

  const { data, isLoading, refetch } = useGetAllSubscriptionsAdminQuery({
    page,
    limit: 10,
    
    status: statusFilter || undefined,
    badgeType: badgeTypeFilter || undefined,
    search: search || undefined,
  });

  const { data: statsData, isLoading: statsLoading } = useGetSubscriptionStatsAdminQuery();
  const [updateSubscription] = useUpdateSubscriptionAdminMutation();
  const [revokeSubscription] = useRevokeSubscriptionAdminMutation();
  const [extendSubscription] = useExtendSubscriptionAdminMutation();
  const { data: exportData, refetch: exportRefetch } = useExportSubscriptionsAdminQuery(undefined, {
    skip: true,
  });

  const subscriptions = data?.data || [];
  const pagination = data?.pagination || {};
  const stats = statsData?.data || {};

  const handleRevoke = async () => {
    try {
      await revokeSubscription(selectedSubscription._id).unwrap();
      toast({
        title: 'Success',
        description: 'Subscription revoked successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetch();
      onRevokeClose();
      setSelectedSubscription(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to revoke subscription',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleExtend = async () => {
    try {
      await extendSubscription({
        id: selectedSubscription._id,
        additionalMonths: parseInt(additionalMonths),
      }).unwrap();
      toast({
        title: 'Success',
        description: `Subscription extended by ${additionalMonths} month(s)`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetch();
      onExtendClose();
      setSelectedSubscription(null);
      setAdditionalMonths(1);
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to extend subscription',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleExport = async () => {
    try {
      await exportRefetch();
      const blob = new Blob([exportData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: 'Success',
        description: 'Subscriptions exported successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export subscriptions',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'expired':
        return 'red';
      case 'cancelled':
        return 'gray';
      default:
        return 'gray';
    }
  };

  if (isLoading || statsLoading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="full" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Subscription Management</Heading>
          <Button
            leftIcon={<Download size={16} />}
            colorScheme="blue"
            onClick={handleExport}
          >
            Export CSV
          </Button>
        </HStack>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
          <Stat>
            <StatLabel>Total Subscriptions</StatLabel>
            <StatNumber>{stats.total || 0}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Active</StatLabel>
            <StatNumber color="green.500">{stats.active || 0}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Expired</StatLabel>
            <StatNumber color="red.500">{stats.expired || 0}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Cancelled</StatLabel>
            <StatNumber color="gray.500">{stats.cancelled || 0}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Total Revenue</StatLabel>
            <StatNumber color="blue.500">₹{stats.totalRevenue || 0}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Filters */}
        <Card>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
              <Input
                placeholder="Search by user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                placeholder="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </Select>
              <Select
                placeholder="Filter by Badge Type"
                value={badgeTypeFilter}
                onChange={(e) => setBadgeTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="blue">Blue</option>
                <option value="yellow">Yellow</option>
                <option value="pink">Pink</option>
              </Select>
              <Button
                leftIcon={<RefreshCw size={16} />}
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setBadgeTypeFilter('');
                  refetch();
                }}
              >
                Reset
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardBody>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>User</Th>
                    <Th>Badge Type</Th>
                    <Th>Duration</Th>
                    <Th>Amount</Th>
                    <Th>Start Date</Th>
                    <Th>Expiry Date</Th>
                    <Th>Status</Th>
                    <Th>Payment</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {subscriptions.map((sub) => (
                    <Tr key={sub._id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">
                            {sub.user?.name || 'N/A'}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {sub.user?.email || 'N/A'}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <HStack>
                          <VerifiedBadge badgeType={sub.badgeType} size={16} />
                          <Text textTransform="capitalize">{sub.badgeType}</Text>
                        </HStack>
                      </Td>
                      <Td>{sub.duration} months</Td>
                      <Td>₹{sub.payment?.amount || 0}</Td>
                      <Td>
                        {formatDate(sub.startDate)}
                      </Td>
                      <Td>
                        {formatDate(sub.expiryDate)}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(sub.status)}>
                          {sub.status}
                        </Badge>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm">
                            {sub.payment?.paymentMethod || 'N/A'}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {sub.payment?.transactionId?.slice(0, 10) || 'N/A'}...
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<MoreVertical size={16} />}
                            variant="ghost"
                            size="sm"
                          />
                          <MenuList>
                            <MenuItem
                              icon={<Calendar size={16} />}
                              onClick={() => {
                                setSelectedSubscription(sub);
                                onExtendOpen();
                              }}
                            >
                              Extend Subscription
                            </MenuItem>
                            {sub.status === 'active' && (
                              <MenuItem
                                icon={<X size={16} />}
                                color="red.500"
                                onClick={() => {
                                  setSelectedSubscription(sub);
                                  onRevokeOpen();
                                }}
                              >
                                Revoke Subscription
                              </MenuItem>
                            )}
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <HStack justify="center" mt={4} spacing={2}>
                <Button
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  isDisabled={page === 1}
                >
                  Previous
                </Button>
                <Text>
                  Page {pagination.page} of {pagination.pages}
                </Text>
                <Button
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  isDisabled={page === pagination.pages}
                >
                  Next
                </Button>
              </HStack>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Extend Subscription Modal */}
      <Modal isOpen={isExtendOpen} onClose={onExtendClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Extend Subscription</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                Extend subscription for{' '}
                <strong>
                  {selectedSubscription?.user?.name || 'User'}
                </strong>
              </Text>
              <FormControl>
                <FormLabel>Additional Months</FormLabel>
                <NumberInput
                  value={additionalMonths}
                  onChange={(value) => setAdditionalMonths(value)}
                  min={1}
                  max={12}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExtendClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleExtend}>
              Extend
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Revoke Subscription Modal */}
      <Modal isOpen={isRevokeOpen} onClose={onRevokeClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Revoke Subscription</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              Are you sure you want to revoke the subscription for{' '}
              <strong>
                {selectedSubscription?.user?.name || 'User'}
              </strong>
              ? This will immediately remove their verified badge.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRevokeClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleRevoke}>
              Revoke
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
    </AdminLayout>
  );
};

export default AdminSubscriptions;

