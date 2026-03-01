import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Card,
  CardBody,
  useColorModeValue,
  Spinner,
  Center,
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
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { Shield, AlertTriangle, Eye, Ban } from 'lucide-react';
import { useState } from 'react';
import {
  useGetAbuseLogsQuery,
  useReviewAbuseLogMutation,
  useGetUserActivityLogsQuery,
  useToggleLeaderboardVisibilityMutation,
} from '../../store/api/abuseApi';
import { useToast } from '@chakra-ui/react';

const AdminAbuseControl = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedLog, setSelectedLog] = useState(null);
  const [reviewData, setReviewData] = useState({
    status: 'reviewed',
    actionTaken: 'none',
    reviewNotes: '',
    reductionAmount: 0,
  });

  const [filters, setFilters] = useState({
    status: 'pending',
    severity: '',
    abuseType: '',
    userId: '',
  });

  const { data, isLoading } = useGetAbuseLogsQuery(filters);
  const [reviewAbuseLog] = useReviewAbuseLogMutation();
  const [toggleVisibility] = useToggleLeaderboardVisibilityMutation();

  const handleReview = (log) => {
    setSelectedLog(log);
    setReviewData({
      status: 'reviewed',
      actionTaken: 'none',
      reviewNotes: '',
      reductionAmount: 0,
    });
    onOpen();
  };

  const handleSubmitReview = async () => {
    try {
      await reviewAbuseLog({
        logId: selectedLog._id,
        ...reviewData,
      }).unwrap();
      toast({
        title: 'Success',
        description: 'Abuse log reviewed successfully',
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to review abuse log',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleToggleVisibility = async (userId, hidden) => {
    try {
      await toggleVisibility({ userId, hidden }).unwrap();
      toast({
        title: 'Success',
        description: `User ${hidden ? 'hidden from' : 'shown on'} leaderboard`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to toggle visibility',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const logs = data?.data?.logs || [];

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'gray',
      medium: 'yellow',
      high: 'orange',
      critical: 'red',
    };
    return colors[severity] || 'gray';
  };

  if (isLoading) {
    return (
      <Center py={8}>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack spacing={2}>
          <Shield size={24} />
          <Text fontSize="xl" fontWeight="bold" color={textColor}>
            Abuse Control
          </Text>
        </HStack>

        {/* Filters */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <HStack spacing={4} flexWrap="wrap">
              <Box>
                <Text fontSize="sm" color={textColor} mb={2}>
                  Status
                </Text>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  width="150px"
                >
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" color={textColor} mb={2}>
                  Severity
                </Text>
                <Select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  width="150px"
                >
                  <option value="">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" color={textColor} mb={2}>
                  Abuse Type
                </Text>
                <Select
                  value={filters.abuseType}
                  onChange={(e) => setFilters({ ...filters, abuseType: e.target.value })}
                  width="200px"
                >
                  <option value="">All</option>
                  <option value="duplicate_message">Duplicate Message</option>
                  <option value="media_reuse">Media Reuse</option>
                  <option value="emoji_spam">Emoji Spam</option>
                  <option value="like_farming">Like Farming</option>
                  <option value="comment_farming">Comment Farming</option>
                  <option value="share_farming">Share Farming</option>
                  <option value="daily_limit_exceeded">Daily Limit</option>
                  <option value="suspicious_pattern">Suspicious Pattern</option>
                </Select>
              </Box>
            </HStack>
          </CardBody>
        </Card>

        {/* Abuse Logs Table */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color={textColor}>User</Th>
                  <Th color={textColor}>Type</Th>
                  <Th color={textColor}>Severity</Th>
                  <Th color={textColor}>Description</Th>
                  <Th color={textColor}>Status</Th>
                  <Th color={textColor}>Date</Th>
                  <Th color={textColor}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {logs.map((log) => (
                  <Tr key={log._id}>
                    <Td>
                      <HStack spacing={2}>
                        <Avatar size="sm" src={log.user?.profileImage} name={log.user?.name} />
                        <Text color={textColor}>{log.user?.name}</Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue" variant="outline">
                        {log.abuseType?.replace(/_/g, ' ')}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color={textColor} maxW="300px" isTruncated>
                        {log.description}
                      </Text>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          log.status === 'pending'
                            ? 'yellow'
                            : log.status === 'resolved'
                            ? 'green'
                            : 'gray'
                        }
                      >
                        {log.status}
                      </Badge>
                    </Td>
                    <Td color={textColor}>
                      {new Date(log.createdAt).toLocaleDateString()}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          leftIcon={<Eye size={14} />}
                          onClick={() => handleReview(log)}
                        >
                          Review
                        </Button>
                        <Button
                          size="sm"
                          leftIcon={<Ban size={14} />}
                          colorScheme="red"
                          variant="outline"
                          onClick={() =>
                            handleToggleVisibility(log.user._id, true)
                          }
                        >
                          Hide
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {logs.length === 0 && (
              <Center py={8}>
                <Text color={textColor} opacity={0.7}>
                  No abuse logs found
                </Text>
              </Center>
            )}
          </CardBody>
        </Card>

        {/* Review Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent bg={bgColor}>
            <ModalHeader color={textColor}>Review Abuse Log</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedLog && (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                      User
                    </Text>
                    <HStack spacing={2}>
                      <Avatar
                        size="sm"
                        src={selectedLog.user?.profileImage}
                        name={selectedLog.user?.name}
                      />
                      <Text color={textColor}>{selectedLog.user?.name}</Text>
                    </HStack>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                      Description
                    </Text>
                    <Text color={textColor}>{selectedLog.description}</Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                      Status
                    </Text>
                    <Select
                      value={reviewData.status}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, status: e.target.value })
                      }
                    >
                      <option value="reviewed">Reviewed</option>
                      <option value="resolved">Resolved</option>
                      <option value="dismissed">Dismissed</option>
                    </Select>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                      Action Taken
                    </Text>
                    <Select
                      value={reviewData.actionTaken}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, actionTaken: e.target.value })
                      }
                    >
                      <option value="none">None</option>
                      <option value="warning">Warning</option>
                      <option value="count_reduction">Count Reduction</option>
                      <option value="count_freeze">Freeze Count</option>
                      <option value="temporary_ban">Temporary Ban</option>
                      <option value="permanent_ban">Permanent Ban</option>
                    </Select>
                  </Box>

                  {reviewData.actionTaken === 'count_reduction' && (
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                        Reduction Amount
                      </Text>
                      <NumberInput
                        value={reviewData.reductionAmount}
                        onChange={(_, value) =>
                          setReviewData({ ...reviewData, reductionAmount: value })
                        }
                        min={0}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </Box>
                  )}

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                      Review Notes
                    </Text>
                    <Textarea
                      value={reviewData.reviewNotes}
                      onChange={(e) =>
                        setReviewData({ ...reviewData, reviewNotes: e.target.value })
                      }
                      placeholder="Enter review notes..."
                      rows={4}
                    />
                  </Box>
                </VStack>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleSubmitReview}>
                Submit Review
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
};

export default AdminAbuseControl;

