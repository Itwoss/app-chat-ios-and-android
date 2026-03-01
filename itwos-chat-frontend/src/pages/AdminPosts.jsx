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
  Textarea,
  FormControl,
  FormLabel,
  Switch,
  Divider,
} from '@chakra-ui/react';
import { Search, Trash2, Eye, MoreVertical, RotateCcw, AlertTriangle, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  useGetAllPostsAdminQuery,
  useGetPostStatsAdminQuery,
  useRemovePostAdminMutation,
  useRestorePostAdminMutation,
  useDeletePostPermanentlyAdminMutation,
  useWarnUserForPostAdminMutation,
} from '../store/api/adminApi';
import AdminLayout from '../components/Admin/AdminLayout';
import { format } from 'date-fns';
import VerifiedBadge from '../components/VerifiedBadge/VerifiedBadge';
import { getSocket } from '../utils/socket';

const AdminPosts = () => {
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.600');

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    authorId: '',
    isRemoved: '',
  });
  const [selectedPost, setSelectedPost] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [warnUser, setWarnUser] = useState(true);
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isRemoveOpen, onOpen: onRemoveOpen, onClose: onRemoveClose } = useDisclosure();
  const { isOpen: isWarnOpen, onOpen: onWarnOpen, onClose: onWarnClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();

  const { data: postsData, isLoading, refetch } = useGetAllPostsAdminQuery({
    page,
    limit: 20,
    ...filters,
  });
  const { data: statsData, isLoading: statsLoading } = useGetPostStatsAdminQuery();

  // Real-time Socket.IO listener for new posts
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewPost = (data) => {
      toast({
        title: 'New Post',
        description: data.message || 'A new post has been created',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      // Automatically refresh posts
      refetch();
    };

    socket.on('new-post', handleNewPost);

    return () => {
      socket.off('new-post', handleNewPost);
    };
  }, [refetch, toast]);
  const [removePost, { isLoading: isRemoving }] = useRemovePostAdminMutation();
  const [restorePost, { isLoading: isRestoring }] = useRestorePostAdminMutation();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostPermanentlyAdminMutation();
  const [warnUserForPost, { isLoading: isWarning }] = useWarnUserForPostAdminMutation();

  const posts = postsData?.data?.posts || [];
  const pagination = postsData?.data?.pagination || {};
  const stats = statsData?.data || {};

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    onViewOpen();
  };

  const handleRemovePost = (post) => {
    setSelectedPost(post);
    setRemoveReason('');
    setWarnUser(true);
    onRemoveOpen();
  };

  const handleRemoveConfirm = async () => {
    if (!removeReason.trim() || removeReason.trim().length < 10) {
      toast({
        title: 'Invalid reason',
        description: 'Removal reason must be at least 10 characters',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await removePost({
        id: selectedPost._id,
        reason: removeReason.trim(),
        warnUser,
      }).unwrap();
      toast({
        title: 'Post removed',
        description: warnUser ? 'Post removed and user warned' : 'Post removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetch();
      onRemoveClose();
      setRemoveReason('');
    } catch (error) {
      toast({
        title: 'Failed to remove post',
        description: error?.data?.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleWarnUser = (post) => {
    setSelectedPost(post);
    setRemoveReason('');
    onWarnOpen();
  };

  const handleWarnConfirm = async () => {
    if (!removeReason.trim() || removeReason.trim().length < 10) {
      toast({
        title: 'Invalid reason',
        description: 'Warning reason must be at least 10 characters',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await warnUserForPost({
        id: selectedPost._id,
        reason: removeReason.trim(),
      }).unwrap();
      toast({
        title: 'User warned',
        description: 'User has been warned about their post',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetch();
      onWarnClose();
      setRemoveReason('');
    } catch (error) {
      toast({
        title: 'Failed to warn user',
        description: error?.data?.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRestorePost = async (post) => {
    try {
      await restorePost(post._id).unwrap();
      toast({
        title: 'Post restored',
        description: 'Post has been restored successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Failed to restore post',
        description: error?.data?.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeletePermanently = async () => {
    try {
      await deletePost(selectedPost._id).unwrap();
      toast({
        title: 'Post deleted',
        description: 'Post has been permanently deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetch();
      onDeleteClose();
    } catch (error) {
      toast({
        title: 'Failed to delete post',
        description: error?.data?.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusBadge = (post) => {
    if (post.isRemoved) {
      return <Badge colorScheme="red">Removed</Badge>;
    }
    if (post.isArchived) {
      return <Badge colorScheme="orange">Archived</Badge>;
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
          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4}>
            <Card bg={bgColor} border="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Posts</StatLabel>
                  <StatNumber>{stats.total || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={bgColor} border="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Active Posts</StatLabel>
                  <StatNumber color="green.500">{stats.active || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={bgColor} border="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Removed Posts</StatLabel>
                  <StatNumber color="red.500">{stats.removed || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={bgColor} border="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Likes</StatLabel>
                  <StatNumber>{stats.totalLikes || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg={bgColor} border="1px" borderColor={borderColor}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Views</StatLabel>
                  <StatNumber color="blue.500">{stats.totalViews || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filters */}
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Search size={18} />
                  </InputLeftElement>
                  <Input
                    placeholder="Search posts..."
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </InputGroup>
                <Select
                  name="isRemoved"
                  value={filters.isRemoved}
                  onChange={handleFilterChange}
                  placeholder="All Posts"
                >
                  <option value="">All Posts</option>
                  <option value="false">Active Only</option>
                  <option value="true">Removed Only</option>
                </Select>
                <Input
                  placeholder="Author ID (optional)"
                  name="authorId"
                  value={filters.authorId}
                  onChange={handleFilterChange}
                />
                <Button onClick={() => refetch()} colorScheme="blue">
                  Refresh
                </Button>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Posts Table */}
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Author</Th>
                    <Th>Content</Th>
                    <Th>Media</Th>
                    <Th>Likes</Th>
                    <Th>Comments</Th>
                    <Th>Views</Th>
                    <Th>Status</Th>
                    <Th>Date</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {posts.map((post) => (
                    <Tr key={post._id}>
                      <Td>
                        <HStack>
                          <Avatar
                            size="sm"
                            name={post.author?.name || 'User'}
                            src={post.author?.profileImage || null}
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="bold">
                              {post.author?.name || 'Unknown'}
                            </Text>
                            {post.author?.subscription?.badgeType && (
                              <VerifiedBadge
                                badgeType={post.author.subscription.badgeType}
                                size={12}
                              />
                            )}
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" noOfLines={2} maxW="200px">
                          {post.content}
                        </Text>
                      </Td>
                      <Td>
                        {post.images?.length > 0 && (
                          <Badge colorScheme="blue">{post.images.length} images</Badge>
                        )}
                        {post.song && <Badge colorScheme="purple">Song</Badge>}
                        {!post.images?.length && !post.song && (
                          <Text fontSize="xs" color={textColor}>
                            None
                          </Text>
                        )}
                      </Td>
                      <Td>{post.likes?.length || 0}</Td>
                      <Td>{post.comments?.length || 0}</Td>
                      <Td>{post.viewCount || 0}</Td>
                      <Td>{getStatusBadge(post)}</Td>
                      <Td>
                        <Text fontSize="xs">
                          {format(new Date(post.createdAt), 'MMM dd, yyyy')}
                        </Text>
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
                            <MenuItem icon={<Eye size={16} />} onClick={() => handleViewPost(post)}>
                              View Details
                            </MenuItem>
                            {!post.isRemoved ? (
                              <>
                                <MenuItem
                                  icon={<AlertTriangle size={16} />}
                                  onClick={() => handleWarnUser(post)}
                                >
                                  Warn User
                                </MenuItem>
                                <MenuItem
                                  icon={<X size={16} />}
                                  onClick={() => handleRemovePost(post)}
                                  color="red.500"
                                >
                                  Remove Post
                                </MenuItem>
                              </>
                            ) : (
                              <>
                                <MenuItem
                                  icon={<RotateCcw size={16} />}
                                  onClick={() => handleRestorePost(post)}
                                >
                                  Restore Post
                                </MenuItem>
                                <MenuItem
                                  icon={<Trash2 size={16} />}
                                  onClick={() => {
                                    setSelectedPost(post);
                                    onDeleteOpen();
                                  }}
                                  color="red.500"
                                >
                                  Delete Permanently
                                </MenuItem>
                              </>
                            )}
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

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
      </Container>

      {/* View Post Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Post Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedPost && (
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Avatar
                    name={selectedPost.author?.name || 'User'}
                    src={selectedPost.author?.profileImage || null}
                  />
                  <VStack align="start" spacing={0}>
                    <HStack>
                      <Text fontWeight="bold">{selectedPost.author?.name || 'Unknown'}</Text>
                      {selectedPost.author?.subscription?.badgeType && (
                        <VerifiedBadge
                          badgeType={selectedPost.author.subscription.badgeType}
                          size={16}
                        />
                      )}
                    </HStack>
                    <Text fontSize="sm" color={textColor}>
                      {selectedPost.author?.email}
                    </Text>
                  </VStack>
                </HStack>
                <Divider />
                <Text>{selectedPost.content}</Text>
                {selectedPost.images?.length > 0 && (
                  <SimpleGrid columns={2} spacing={2}>
                    {selectedPost.images.map((img, idx) => (
                      <Image key={idx} src={img} alt={`Post image ${idx + 1}`} borderRadius="md" />
                    ))}
                  </SimpleGrid>
                )}
                {selectedPost.song && (
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" mb={2}>
                      Audio:
                    </Text>
                    <audio controls src={selectedPost.song} style={{ width: '100%' }} />
                  </Box>
                )}
                <HStack>
                  <Text fontSize="sm">
                    <strong>Likes:</strong> {selectedPost.likes?.length || 0}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Comments:</strong> {selectedPost.comments?.length || 0}
                  </Text>
                  <Text fontSize="sm">
                    <strong>Views:</strong> {selectedPost.viewCount || 0}
                  </Text>
                </HStack>
                {selectedPost.isRemoved && (
                  <Box p={3} bg="red.50" borderRadius="md" border="1px" borderColor="red.200">
                    <Text fontSize="sm" fontWeight="bold" color="red.600">
                      Removed
                    </Text>
                    <Text fontSize="xs" color="red.500">
                      Reason: {selectedPost.removalReason}
                    </Text>
                    {selectedPost.removedBy && (
                      <Text fontSize="xs" color="red.500">
                        Removed by: {selectedPost.removedBy?.name || 'Admin'}
                      </Text>
                    )}
                  </Box>
                )}
                <Text fontSize="xs" color={textColor}>
                  Created: {format(new Date(selectedPost.createdAt), 'PPpp')}
                </Text>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Remove Post Dialog */}
      <AlertDialog
        isOpen={isRemoveOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRemoveClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Post
            </AlertDialogHeader>
            <AlertDialogBody>
              <VStack spacing={4} align="stretch">
                <Text>
                  Are you sure you want to remove this post? This action will hide it from all users.
                </Text>
                <FormControl>
                  <FormLabel>Removal Reason (min 10 characters)</FormLabel>
                  <Textarea
                    value={removeReason}
                    onChange={(e) => setRemoveReason(e.target.value)}
                    placeholder="Enter the reason for removing this post..."
                    rows={4}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>Warn User</FormLabel>
                  <Switch
                    isChecked={warnUser}
                    onChange={(e) => setWarnUser(e.target.checked)}
                  />
                </FormControl>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onRemoveClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleRemoveConfirm}
                ml={3}
                isLoading={isRemoving}
              >
                Remove Post
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Warn User Dialog */}
      <AlertDialog isOpen={isWarnOpen} leastDestructiveRef={cancelRef} onClose={onWarnClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Warn User
            </AlertDialogHeader>
            <AlertDialogBody>
              <VStack spacing={4} align="stretch">
                <Text>Send a warning to the user about this post without removing it.</Text>
                <FormControl>
                  <FormLabel>Warning Reason (min 10 characters)</FormLabel>
                  <Textarea
                    value={removeReason}
                    onChange={(e) => setRemoveReason(e.target.value)}
                    placeholder="Enter the reason for warning the user..."
                    rows={4}
                  />
                </FormControl>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onWarnClose}>
                Cancel
              </Button>
              <Button
                colorScheme="orange"
                onClick={handleWarnConfirm}
                ml={3}
                isLoading={isWarning}
              >
                Warn User
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Delete Permanently Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Post Permanently
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure? This action cannot be undone. The post and all associated media will be
              permanently deleted.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeletePermanently}
                ml={3}
                isLoading={isDeleting}
              >
                Delete Permanently
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminPosts;

