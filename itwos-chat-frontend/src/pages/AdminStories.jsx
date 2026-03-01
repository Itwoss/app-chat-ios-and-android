import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  useColorModeValue,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Image,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Center,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Card,
  CardBody,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Avatar,
} from '@chakra-ui/react';
import { Search, Filter, Trash2, Eye, MoreVertical } from 'lucide-react';
import { useState, useRef } from 'react';
import {
  useGetAllStoriesAdminQuery,
  useGetStoryStatsQuery,
  useDeleteStoryAdminMutation,
  useGetStoryInteractionsQuery,
} from '../store/api/adminApi';
import AdminLayout from '../components/Admin/AdminLayout';
import { format } from 'date-fns';

const AdminStories = () => {
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    userId: '',
    search: '',
  });
  const [selectedStory, setSelectedStory] = useState(null);
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isInteractionsOpen, onOpen: onInteractionsOpen, onClose: onInteractionsClose } = useDisclosure();
  const cancelRef = useRef();

  const { data: storiesData, isLoading, refetch } = useGetAllStoriesAdminQuery({
    page,
    limit: 20,
    ...filters,
  });
  const { data: statsData, isLoading: statsLoading } = useGetStoryStatsQuery();
  const { data: interactionsData, isLoading: interactionsLoading } = useGetStoryInteractionsQuery(
    selectedStory?._id,
    { skip: !selectedStory || !isInteractionsOpen }
  );
  const [deleteStory, { isLoading: isDeleting }] = useDeleteStoryAdminMutation();

  const stories = storiesData?.data || [];
  const pagination = storiesData?.pagination || {};
  const stats = statsData?.data || {};

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleViewStory = (story) => {
    setSelectedStory(story);
    onViewOpen();
  };

  const handleViewInteractions = (story) => {
    setSelectedStory(story);
    onInteractionsOpen();
  };

  const handleDeleteClick = (story) => {
    setSelectedStory(story);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteStory(selectedStory._id).unwrap();
      toast({
        title: 'Story deleted',
        description: 'Story has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetch();
      onDeleteClose();
    } catch (error) {
      toast({
        title: 'Failed to delete story',
        description: error?.data?.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusBadge = (story) => {
    const now = new Date();
    const expiresAt = new Date(story.expiresAt);

    if (!story.isActive) {
      return <Badge colorScheme="red">Inactive</Badge>;
    }
    if (expiresAt <= now) {
      return <Badge colorScheme="orange">Expired</Badge>;
    }
    return <Badge colorScheme="green">Active</Badge>;
  };

  if (isLoading || statsLoading) {
    return (
      <AdminLayout>
        <Center minH="400px">
          <Spinner size="xl" />
        </Center>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Container maxW="7xl" py={8}>
        <VStack spacing={6} align="stretch">
          <Heading size="lg">Story Management</Heading>
          <Text color={textColor}>
            Manage all user stories, view statistics, and moderate content
          </Text>

          {/* Stats */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Stories</StatLabel>
                  <StatNumber>{stats.totalStories || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Active Stories</StatLabel>
                  <StatNumber>{stats.activeStories || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Views</StatLabel>
                  <StatNumber>{stats.totalViews || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Likes</StatLabel>
                  <StatNumber>{stats.totalLikes || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filters */}
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <Search size={18} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search by caption..."
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
              />
            </InputGroup>
            <Select
              name="status"
              placeholder="All Status"
              onChange={handleFilterChange}
              value={filters.status}
              maxW="200px"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </Select>
            <Button leftIcon={<Filter size={18} />} onClick={refetch}>
              Apply Filters
            </Button>
          </HStack>

          {/* Stories Table */}
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Media</Th>
                  <Th>User</Th>
                  <Th>Caption</Th>
                  <Th>Type</Th>
                  <Th>Views</Th>
                  <Th>Likes</Th>
                  <Th>Replies</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stories.map((story) => (
                  <Tr key={story._id}>
                    <Td>
                      <Box w="60px" h="60px" borderRadius="md" overflow="hidden">
                        {story.mediaType === 'image' ? (
                          <Image
                            src={story.mediaUrl}
                            alt="Story"
                            w="100%"
                            h="100%"
                            objectFit="cover"
                          />
                        ) : (
                          <Box
                            as="video"
                            src={story.mediaUrl}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                            muted
                          />
                        )}
                      </Box>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" fontSize="sm">
                          {story.user?.name || 'Unknown'}
                        </Text>
                        <Text fontSize="xs" color={textColor}>
                          {story.user?.email || ''}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm" noOfLines={2} maxW="200px">
                        {story.caption || '-'}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={story.mediaType === 'image' ? 'blue' : 'purple'}>
                        {story.mediaType}
                      </Badge>
                    </Td>
                    <Td>{story.viewCount || 0}</Td>
                    <Td>{story.likeCount || 0}</Td>
                    <Td>{story.replyCount || 0}</Td>
                    <Td>{getStatusBadge(story)}</Td>
                    <Td>
                      <Text fontSize="xs">
                        {format(new Date(story.createdAt), 'MMM dd, yyyy')}
                      </Text>
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<MoreVertical size={18} />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem
                            icon={<Eye size={16} />}
                            onClick={() => handleViewStory(story)}
                          >
                            View Story
                          </MenuItem>
                          <MenuItem
                            icon={<Eye size={16} />}
                            onClick={() => handleViewInteractions(story)}
                          >
                            View Interactions
                          </MenuItem>
                          <MenuItem
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDeleteClick(story)}
                            color="red.500"
                          >
                            Delete
                          </MenuItem>
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
            <HStack justify="center" mt={4}>
              <Button
                isDisabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Text>
                Page {page} of {pagination.pages}
              </Text>
              <Button
                isDisabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </HStack>
          )}
        </VStack>

        {/* View Story Modal */}
        <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Story Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedStory && (
                <VStack spacing={4} align="stretch">
                  <Box>
                    {selectedStory.mediaType === 'image' ? (
                      <Image
                        src={selectedStory.mediaUrl}
                        alt="Story"
                        w="100%"
                        borderRadius="md"
                      />
                    ) : (
                      <Box
                        as="video"
                        src={selectedStory.mediaUrl}
                        w="100%"
                        controls
                        borderRadius="md"
                      />
                    )}
                  </Box>
                  <VStack align="start" spacing={2}>
                    <Text>
                      <strong>User:</strong> {selectedStory.user?.name} ({selectedStory.user?.email})
                    </Text>
                    <Text>
                      <strong>Caption:</strong> {selectedStory.caption || 'No caption'}
                    </Text>
                    <Text>
                      <strong>Privacy:</strong> {selectedStory.privacy}
                    </Text>
                    <Text>
                      <strong>Views:</strong> {selectedStory.viewCount || 0} |{' '}
                      <strong>Likes:</strong> {selectedStory.likeCount || 0} |{' '}
                      <strong>Replies:</strong> {selectedStory.replyCount || 0}
                    </Text>
                    <Text>
                      <strong>Created:</strong>{' '}
                      {format(new Date(selectedStory.createdAt), 'PPpp')}
                    </Text>
                    <Text>
                      <strong>Expires:</strong>{' '}
                      {format(new Date(selectedStory.expiresAt), 'PPpp')}
                    </Text>
                  </VStack>
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* View Interactions Modal */}
        <Modal isOpen={isInteractionsOpen} onClose={onInteractionsClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Story Interactions</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {interactionsLoading ? (
                <Center py={10}>
                  <Spinner />
                </Center>
              ) : (
                <VStack spacing={4} align="stretch" maxH="500px" overflowY="auto">
                  {interactionsData?.data?.length > 0 ? (
                    interactionsData.data.map((interaction, index) => (
                      <HStack key={index} spacing={4} p={2} bg={cardBg} borderRadius="md">
                        <Avatar
                          src={interaction.viewer?.profileImage || ''}
                          name={interaction.viewer?.name}
                          size="sm"
                        />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="bold" fontSize="sm">
                            {interaction.viewer?.name}
                          </Text>
                          <Text fontSize="xs" color={textColor}>
                            {interaction.type} • {format(new Date(interaction.createdAt), 'PPpp')}
                          </Text>
                          {interaction.replyMessage && (
                            <Text fontSize="sm" mt={1}>
                              {interaction.replyMessage}
                            </Text>
                          )}
                        </VStack>
                      </HStack>
                    ))
                  ) : (
                    <Center py={10}>
                      <Text color={textColor}>No interactions yet</Text>
                    </Center>
                  )}
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Story
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete this story? This action cannot be undone.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleDeleteConfirm}
                  ml={3}
                  isLoading={isDeleting}
                >
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </AdminLayout>
  );
};

export default AdminStories;

