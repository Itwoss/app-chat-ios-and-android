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
  Image,
  Textarea,
  Switch,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Avatar,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { MoreVertical, Plus, Edit, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { useState, useRef } from 'react';
import {
  useGetAllBannersAdminQuery,
  useGetBannerStatsAdminQuery,
  useGetBannerPaymentsAdminQuery,
  useCreateBannerAdminMutation,
  useUpdateBannerAdminMutation,
  useDeleteBannerAdminMutation,
  useSyncBannerInventoryAdminMutation,
} from '../store/api/adminApi';
import AdminLayout from '../components/Admin/AdminLayout';
import FileUpload from '../components/Admin/FileUpload';

const RARITY_COLORS = {
  Common: 'gray',
  Uncommon: 'green',
  Rare: 'blue',
  Epic: 'purple',
  Legendary: 'orange',
  Mythic: 'red',
};

const AdminBanners = () => {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [selectedBanner, setSelectedBanner] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const cancelDeleteRef = useRef();

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const { data, isLoading, refetch } = useGetAllBannersAdminQuery({
    page,
    limit: 20,
    category: categoryFilter || undefined,
    rarity: rarityFilter || undefined,
    isActive: isActiveFilter || undefined,
  });

  const { data: statsData } = useGetBannerStatsAdminQuery();
  const { data: paymentsData } = useGetBannerPaymentsAdminQuery({ page: 1, limit: 30 });
  const [createBanner, { isLoading: isCreating }] = useCreateBannerAdminMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerAdminMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerAdminMutation();
  const [syncBannerInventory, { isLoading: isSyncing }] = useSyncBannerInventoryAdminMutation();

  const banners = data?.data || [];
  const stats = statsData?.data || {};
  const pagination = data?.pagination || {};

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    rarity: 'Common',
    effect: 'none',
    category: '',
    stock: '-1',
    isActive: true,
    description: '',
    bannerType: 'profile',
    imageUrl: '',
    profileImageUrl: '',
    chatImageUrl: '',
    postImageUrl: '',
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileVideoFile, setProfileVideoFile] = useState(null);
  const [chatImageFile, setChatImageFile] = useState(null);
  const [chatVideoFile, setChatVideoFile] = useState(null);
  const [postImageFile, setPostImageFile] = useState(null);
  const [postVideoFile, setPostVideoFile] = useState(null);
  const [previewProfileImage, setPreviewProfileImage] = useState(null);
  const [previewProfileVideo, setPreviewProfileVideo] = useState(null);
  const [previewChatImage, setPreviewChatImage] = useState(null);
  const [previewChatVideo, setPreviewChatVideo] = useState(null);
  const [previewPostImage, setPreviewPostImage] = useState(null);
  const [previewPostVideo, setPreviewPostVideo] = useState(null);

  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      name: '',
      price: '',
      rarity: 'Common',
      effect: 'none',
      category: '',
      stock: '-1',
      isActive: true,
      description: '',
      bannerType: 'profile',
      imageUrl: '',
      profileImageUrl: '',
      chatImageUrl: '',
      postImageUrl: '',
    });
    setProfileImageFile(null);
    setChatImageFile(null);
    setPostImageFile(null);
    setPreviewProfileImage(null);
    setPreviewChatImage(null);
    setPreviewPostImage(null);
    onCreateOpen();
  };

  const handleEdit = (banner) => {
    setIsEditMode(true);
    setSelectedBanner(banner);
    setFormData({
      name: banner.name,
      price: banner.price.toString(),
      rarity: banner.rarity,
      effect: banner.effect,
      category: banner.category,
      stock: banner.stock.toString(),
      isActive: banner.isActive,
      description: banner.description || '',
      bannerType: banner.bannerType || 'profile',
      imageUrl: banner.imageUrl || '',
      profileImageUrl: banner.profileImageUrl || banner.imageUrl || '',
      profileVideoUrl: banner.profileVideoUrl || '',
      chatImageUrl: banner.chatImageUrl || banner.imageUrl || '',
      chatVideoUrl: banner.chatVideoUrl || '',
      postImageUrl: banner.postImageUrl || banner.imageUrl || '',
      postVideoUrl: banner.postVideoUrl || '',
      mediaType: banner.mediaType || 'image',
    });
    // Set preview images/videos from existing banner URLs
    setPreviewProfileImage(banner.profileImageUrl || banner.imageUrl || null);
    setPreviewProfileVideo(banner.profileVideoUrl || null);
    setPreviewChatImage(banner.chatImageUrl || banner.imageUrl || null);
    setPreviewChatVideo(banner.chatVideoUrl || null);
    setPreviewPostImage(banner.postImageUrl || banner.imageUrl || null);
    setPreviewPostVideo(banner.postVideoUrl || null);
    setProfileImageFile(null);
    setProfileVideoFile(null);
    setChatImageFile(null);
    setChatVideoFile(null);
    setPostImageFile(null);
    setPostVideoFile(null);
    onEditOpen();
  };

  const handleDelete = (banner) => {
    setSelectedBanner(banner);
    onDeleteOpen();
  };

  const handleSubmit = async () => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('rarity', formData.rarity);
      formDataToSend.append('effect', formData.effect);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('stock', formData.stock);
      formDataToSend.append('isActive', formData.isActive.toString());
      formDataToSend.append('description', formData.description);
      formDataToSend.append('bannerType', formData.bannerType);
      if (formData.mediaType) {
        formDataToSend.append('mediaType', formData.mediaType);
      }
      
      // Backend expects a single file under the field name 'file' (multer uploadSingle('file'))
      const primaryImageFile = profileImageFile || chatImageFile || postImageFile;
      if (primaryImageFile) {
        formDataToSend.append('file', primaryImageFile);
      } else if (formData.imageUrl || formData.profileImageUrl) {
        formDataToSend.append('imageUrl', formData.imageUrl || formData.profileImageUrl);
      }

      if (isEditMode) {
        await updateBanner({ id: selectedBanner._id, formData: formDataToSend }).unwrap();
        toast({
          title: 'Success',
          description: 'Banner updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onEditClose();
      } else {
        await createBanner(formDataToSend).unwrap();
        toast({
          title: 'Success',
          description: 'Banner created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onCreateClose();
      }

      refetch();
      setFormData({
        name: '',
        price: '',
        rarity: 'Common',
        effect: 'none',
        category: '',
        stock: '-1',
        isActive: true,
        description: '',
        bannerType: 'profile',
        imageUrl: '',
        profileImageUrl: '',
        chatImageUrl: '',
        postImageUrl: '',
      });
      setProfileImageFile(null);
      setChatImageFile(null);
      setPostImageFile(null);
      setPreviewProfileImage(null);
      setPreviewChatImage(null);
      setPreviewPostImage(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to save banner',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteBanner(selectedBanner._id).unwrap();
      toast({
        title: 'Success',
        description: 'Banner deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to delete banner',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
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
          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            <Heading size="lg">Banner Management</Heading>
            <HStack>
              <Button
                size="sm"
                variant="outline"
                colorScheme="orange"
                isLoading={isSyncing}
                onClick={async () => {
                  try {
                    const result = await syncBannerInventory().unwrap();
                    toast({
                      title: 'Sync complete',
                      description: result?.data
                        ? `Updated ${result.data.usersUpdated} user(s). Removed ${result.data.unpaidBannersRemoved} unpaid banner(s).`
                        : result?.message || 'Inventory synced to payments only.',
                      status: 'success',
                      duration: 5000,
                      isClosable: true,
                    });
                    refetch();
                  } catch (e) {
                    toast({
                      title: 'Sync failed',
                      description: e?.data?.message || e?.message || 'Could not sync inventory.',
                      status: 'error',
                      duration: 5000,
                      isClosable: true,
                    });
                  }
                }}
              >
                Sync inventory to payments
              </Button>
              <Button leftIcon={<Plus size={18} />} colorScheme="blue" onClick={handleCreate}>
                Create Banner
              </Button>
            </HStack>
          </HStack>

          {/* Statistics */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Banners</StatLabel>
                  <StatNumber>{stats.totalBanners || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Active Banners</StatLabel>
                  <StatNumber>{stats.activeBanners || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Purchases</StatLabel>
                  <StatNumber>{stats.totalPurchases || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Categories</StatLabel>
                  <StatNumber>{stats.categoryStats?.length || 0}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Filters */}
          <Card>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Select
                  placeholder="All Categories"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {Array.from(new Set(banners.map(b => b.category))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
                <Select
                  placeholder="All Rarities"
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                >
                  <option value="Common">Common</option>
                  <option value="Uncommon">Uncommon</option>
                  <option value="Rare">Rare</option>
                  <option value="Epic">Epic</option>
                  <option value="Legendary">Legendary</option>
                  <option value="Mythic">Mythic</option>
                </Select>
                <Select
                  placeholder="All Status"
                  value={isActiveFilter}
                  onChange={(e) => setIsActiveFilter(e.target.value)}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Banners Table */}
          <Card>
            <CardBody>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Image</Th>
                    <Th>Name</Th>
                    <Th>Category</Th>
                    <Th>Rarity</Th>
                    <Th>Price</Th>
                    <Th>Stock</Th>
                    <Th>Purchases</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {banners.map((banner) => (
                    <Tr key={banner._id}>
                      <Td>
                        <Image src={banner.imageUrl} alt={banner.name} w="60px" h="40px" objectFit="cover" borderRadius="md" />
                      </Td>
                      <Td>{banner.name}</Td>
                      <Td>{banner.category}</Td>
                      <Td>
                        <Badge colorScheme={RARITY_COLORS[banner.rarity]}>
                          {banner.rarity}
                        </Badge>
                      </Td>
                      <Td>₹{banner.price}</Td>
                      <Td>{banner.stock === -1 ? 'Unlimited' : banner.stock}</Td>
                      <Td>{banner.purchaseCount}</Td>
                      <Td>
                        <Badge colorScheme={banner.isActive ? 'green' : 'red'}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton as={IconButton} icon={<MoreVertical size={16} />} variant="ghost" />
                          <MenuList>
                            <MenuItem icon={<Edit size={16} />} onClick={() => handleEdit(banner)}>
                              Edit
                            </MenuItem>
                            <MenuItem icon={<Trash2 size={16} />} onClick={() => handleDelete(banner)} color="red">
                              Delete
                            </MenuItem>
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
                  <Button size="sm" isDisabled={page === 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <Text>
                    Page {page} of {pagination.pages}
                  </Text>
                  <Button size="sm" isDisabled={page === pagination.pages} onClick={() => setPage(page + 1)}>
                    Next
                  </Button>
                </HStack>
              )}
            </CardBody>
          </Card>

          {/* Banner payments */}
          {paymentsData?.data?.length > 0 && (
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>Recent banner payments</Heading>
                <Box overflowX="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>User</Th>
                        <Th>Banner</Th>
                        <Th>Amount</Th>
                        <Th>Date</Th>
                        <Th>Payment ID</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {paymentsData.data.map((p) => (
                        <Tr key={p._id}>
                          <Td>{p.user?.name || p.user?.username || p.user?.email || '—'}</Td>
                          <Td>{p.banner?.name || '—'}</Td>
                          <Td>₹{p.amount}</Td>
                          <Td>{p.paymentDate ? new Date(p.paymentDate).toLocaleString() : '—'}</Td>
                          <Td fontSize="xs">{p.razorpayPaymentId?.slice(0, 16)}…</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          )}
        </VStack>

        {/* Create/Edit Modal */}
        <Modal isOpen={isCreateOpen || isEditOpen} onClose={isCreateOpen ? onCreateClose : onEditClose} size="4xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent maxH="90vh">
            <ModalHeader>{isEditMode ? 'Edit Banner' : 'Create Banner'}</ModalHeader>
            <ModalCloseButton />
            <ModalBody overflowY="auto">
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Banner Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter banner name"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Banner Type</FormLabel>
                  <Select value={formData.bannerType} onChange={(e) => setFormData({ ...formData, bannerType: e.target.value })}>
                    <option value="profile">Profile Page Header</option>
                    <option value="chat">Chat Header</option>
                    <option value="post">Post Header/Section</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Profile Page Header Banner</FormLabel>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    📐 Recommended Size: 1500 × 400px (or 1200 × 300px) • Aspect Ratio: 3.75:1 • Format: JPG/PNG
                  </Text>
                  <FileUpload
                    accept="image/*"
                    value={profileImageFile}
                    onChange={(file) => {
                      setProfileImageFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreviewProfileImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        // If file is removed, keep existing URL if in edit mode
                        if (!isEditMode) {
                          setPreviewProfileImage(null);
                        }
                      }
                    }}
                    maxSize={5}
                    helperText="Upload profile header banner (max 5MB)"
                    existingImage={formData.profileImageUrl || previewProfileImage}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Profile Page Header Banner (Video)</FormLabel>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    🎥 Recommended: MP4 format • Max 50MB • Auto-plays, loops, muted
                  </Text>
                  <FileUpload
                    accept="video/*"
                    value={profileVideoFile}
                    onChange={(file) => {
                      setProfileVideoFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreviewProfileVideo(reader.result);
                        };
                        reader.readAsDataURL(file);
                        // Auto-set media type to video if video is uploaded
                        setFormData({ ...formData, mediaType: 'video' });
                      } else {
                        if (!isEditMode) {
                          setPreviewProfileVideo(null);
                        }
                      }
                    }}
                    maxSize={50}
                    helperText="Upload profile header video (max 50MB)"
                    existingImage={formData.profileVideoUrl || previewProfileVideo}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Chat Header Banner</FormLabel>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    📐 Recommended Size: 1000 × 150px (or 800 × 120px) • Aspect Ratio: 6.67:1 • Format: JPG/PNG
                  </Text>
                  <FileUpload
                    accept="image/*"
                    value={chatImageFile}
                    onChange={(file) => {
                      setChatImageFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreviewChatImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        if (!isEditMode) {
                          setPreviewChatImage(null);
                        }
                      }
                    }}
                    maxSize={5}
                    helperText="Upload chat header banner (max 5MB)"
                    existingImage={formData.chatImageUrl || previewChatImage}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Chat Header Banner (Video)</FormLabel>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    🎥 Recommended: MP4 format • Max 50MB • Auto-plays, loops, muted
                  </Text>
                  <FileUpload
                    accept="video/*"
                    value={chatVideoFile}
                    onChange={(file) => {
                      setChatVideoFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreviewChatVideo(reader.result);
                        };
                        reader.readAsDataURL(file);
                        setFormData({ ...formData, mediaType: 'video' });
                      } else {
                        if (!isEditMode) {
                          setPreviewChatVideo(null);
                        }
                      }
                    }}
                    maxSize={50}
                    helperText="Upload chat header video (max 50MB)"
                    existingImage={formData.chatVideoUrl || previewChatVideo}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Post Header/Section Banner</FormLabel>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    📐 Recommended Size: 800 × 120px (or 600 × 100px) • Aspect Ratio: 6.67:1 • Format: JPG/PNG
                  </Text>
                  <FileUpload
                    accept="image/*"
                    value={postImageFile}
                    onChange={(file) => {
                      setPostImageFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreviewPostImage(reader.result);
                        };
                        reader.readAsDataURL(file);
                      } else {
                        if (!isEditMode) {
                          setPreviewPostImage(null);
                        }
                      }
                    }}
                    maxSize={5}
                    helperText="Upload post header banner (max 5MB)"
                    existingImage={formData.postImageUrl || previewPostImage}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Post Header/Section Banner (Video)</FormLabel>
                  <Text fontSize="xs" color="gray.500" mb={2}>
                    🎥 Recommended: MP4 format • Max 50MB • Auto-plays, loops, muted
                  </Text>
                  <FileUpload
                    accept="video/*"
                    value={postVideoFile}
                    onChange={(file) => {
                      setPostVideoFile(file);
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreviewPostVideo(reader.result);
                        };
                        reader.readAsDataURL(file);
                        setFormData({ ...formData, mediaType: 'video' });
                      } else {
                        if (!isEditMode) {
                          setPreviewPostVideo(null);
                        }
                      }
                    }}
                    maxSize={50}
                    helperText="Upload post header video (max 50MB)"
                    existingImage={formData.postVideoUrl || previewPostVideo}
                  />
                </FormControl>

                {/* Live Preview Section */}
                {(previewProfileImage || previewProfileVideo || previewChatImage || previewChatVideo || previewPostImage || previewPostVideo || formData.profileImageUrl || formData.profileVideoUrl || formData.chatImageUrl || formData.chatVideoUrl || formData.postImageUrl || formData.postVideoUrl) && (
                  <Box mt={4} p={4} border="2px solid" borderColor="blue.300" borderRadius="lg" bg={useColorModeValue('blue.50', 'blue.900')}>
                    <Heading size="sm" mb={4} color={useColorModeValue('blue.700', 'blue.200')}>
                      🎨 Live Preview - How Users Will See It
                    </Heading>
                    <VStack spacing={6} align="stretch">
                      {/* Profile Page Header Preview */}
                      {(previewProfileImage || previewProfileVideo || formData.profileImageUrl || formData.profileVideoUrl) && (
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" mb={2} color={useColorModeValue('gray.700', 'gray.300')}>
                            📱 Profile Page Header
                          </Text>
                          <Box
                            position="relative"
                            borderRadius="16px"
                            overflow="hidden"
                            bgGradient={(previewProfileImage || previewProfileVideo || formData.profileImageUrl || formData.profileVideoUrl) ? undefined : useColorModeValue(
                              'linear(135deg, #667eea 0%, #764ba2 100%)',
                              'linear(135deg, #434343 0%, #000000 100%)'
                            )}
                            p={5}
                            boxShadow="0 12px 40px rgba(0,0,0,0.2)"
                            backgroundImage={(previewProfileImage || formData.profileImageUrl) && !(previewProfileVideo || formData.profileVideoUrl) ? `url(${previewProfileImage || formData.profileImageUrl})` : undefined}
                            backgroundSize="cover"
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                            minH="200px"
                            bg={!(previewProfileImage || previewProfileVideo || formData.profileImageUrl || formData.profileVideoUrl) ? useColorModeValue('gray.100', 'gray.800') : undefined}
                          >
                            {/* Video Preview */}
                            {(previewProfileVideo || formData.profileVideoUrl) && (
                              <Box
                                as="video"
                                src={previewProfileVideo || formData.profileVideoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                position="absolute"
                                top={0}
                                left={0}
                                w="100%"
                                h="100%"
                                objectFit="cover"
                                zIndex={0}
                              />
                            )}
                            <Box
                              position="absolute"
                              top={0}
                              left={0}
                              right={0}
                              bottom={0}
                              bg={useColorModeValue('whiteAlpha.200', 'blackAlpha.300')}
                              backdropFilter="blur(10px)"
                            />
                            <HStack position="relative" zIndex={1} spacing={4}>
                              <Avatar
                                size="xl"
                                name="Preview User"
                                border="3px solid"
                                borderColor="whiteAlpha.500"
                                boxShadow="0 6px 24px rgba(0,0,0,0.2)"
                              />
                              <VStack align="start" spacing={1}>
                                <Heading size="lg" color="white" textShadow="0 2px 10px rgba(0,0,0,0.3)">
                                  Preview User
                                </Heading>
                                <Text color="whiteAlpha.900" fontSize="sm">
                                  user@example.com
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        </Box>
                      )}

                      {/* Chat Header Preview */}
                      {(previewChatImage || previewChatVideo || formData.chatImageUrl || formData.chatVideoUrl) && (
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" mb={2} color={useColorModeValue('gray.700', 'gray.300')}>
                            💬 Chat Header
                          </Text>
                          <Box
                            position="relative"
                            borderRadius="md"
                            overflow="hidden"
                            minH="76px"
                            backgroundImage={(previewChatImage || formData.chatImageUrl) && !(previewChatVideo || formData.chatVideoUrl) ? `url(${previewChatImage || formData.chatImageUrl})` : undefined}
                            backgroundSize="cover"
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                            border="1px solid"
                            borderColor={useColorModeValue('gray.200', 'gray.600')}
                            bg={!(previewChatImage || previewChatVideo || formData.chatImageUrl || formData.chatVideoUrl) ? useColorModeValue('gray.100', 'gray.800') : undefined}
                          >
                            {/* Video Preview */}
                            {(previewChatVideo || formData.chatVideoUrl) && (
                              <Box
                                as="video"
                                src={previewChatVideo || formData.chatVideoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                position="absolute"
                                top={0}
                                left={0}
                                w="100%"
                                h="100%"
                                objectFit="cover"
                                zIndex={0}
                              />
                            )}
                            <Box
                              position="absolute"
                              top={0}
                              left={0}
                              w="100%"
                              h="100%"
                              bg="linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.1))"
                            />
                            <HStack p={2} h="100%" position="relative" zIndex={2} spacing={3} w="100%" align="center">
                              <Avatar
                                size="sm"
                                name="Chat User"
                                border="2px solid white"
                                boxShadow="0 2px 8px rgba(0,0,0,0.3)"
                              />
                              <VStack align="start" spacing={0} flex={1}>
                                <Text color="white" fontWeight="bold" fontSize="sm" textShadow="2px 2px 4px rgba(0,0,0,0.5)">
                                  Chat User
                                </Text>
                                <Text color="whiteAlpha.800" fontSize="xs" textShadow="2px 2px 4px rgba(0,0,0,0.5)">
                                  Online
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        </Box>
                      )}

                      {/* Post Header Preview */}
                      {(previewPostImage || previewPostVideo || formData.postImageUrl || formData.postVideoUrl) && (
                        <Box>
                          <Text fontSize="sm" fontWeight="bold" mb={2} color={useColorModeValue('gray.700', 'gray.300')}>
                            📝 Post Header / Section
                          </Text>
                          <Box
                            position="relative"
                            borderRadius="full"
                            overflow="hidden"
                            backgroundImage={(previewPostImage || formData.postImageUrl) && !(previewPostVideo || formData.postVideoUrl) ? `url(${previewPostImage || formData.postImageUrl})` : undefined}
                            backgroundSize="cover"
                            backgroundPosition="center"
                            backgroundRepeat="no-repeat"
                            minH="80px"
                            border="1px solid"
                            borderColor={useColorModeValue('gray.200', 'gray.600')}
                            bg={!(previewPostImage || previewPostVideo || formData.postImageUrl || formData.postVideoUrl) ? useColorModeValue('gray.100', 'gray.800') : undefined}
                          >
                            {/* Video Preview */}
                            {(previewPostVideo || formData.postVideoUrl) && (
                              <Box
                                as="video"
                                src={previewPostVideo || formData.postVideoUrl}
                                autoPlay
                                loop
                                muted
                                playsInline
                                position="absolute"
                                top={0}
                                left={0}
                                w="100%"
                                h="100%"
                                objectFit="cover"
                                zIndex={0}
                              />
                            )}
                            <Box
                              position="absolute"
                              top={0}
                              left={0}
                              w="100%"
                              h="100%"
                              bg="linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.1))"
                            />
                            <HStack p={3} position="relative" zIndex={2} spacing={3} align="center" w="full">
                              <Avatar
                                size="md"
                                name="Post Author"
                                border="2px solid white"
                                boxShadow="0 2px 8px rgba(0,0,0,0.3)"
                              />
                              <VStack align="start" spacing={0} flex={1}>
                                <Text color="white" fontWeight="bold" fontSize="sm" textShadow="2px 2px 4px rgba(0,0,0,0.5)">
                                  Post Author
                                </Text>
                                <Text color="whiteAlpha.800" fontSize="xs" textShadow="2px 2px 4px rgba(0,0,0,0.5)">
                                  2 hours ago
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        </Box>
                      )}
                    </VStack>
                  </Box>
                )}

                <Divider />

                <SimpleGrid columns={2} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Price</FormLabel>
                    <NumberInput value={formData.price} onChange={(_, value) => setFormData({ ...formData, price: value })} min={0}>
                      <NumberInputField placeholder="0" />
                    </NumberInput>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Rarity</FormLabel>
                    <Select value={formData.rarity} onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}>
                      <option value="Common">Common</option>
                      <option value="Uncommon">Uncommon</option>
                      <option value="Rare">Rare</option>
                      <option value="Epic">Epic</option>
                      <option value="Legendary">Legendary</option>
                      <option value="Mythic">Mythic</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>

                <SimpleGrid columns={2} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Effect</FormLabel>
                    <Select value={formData.effect} onChange={(e) => setFormData({ ...formData, effect: e.target.value })}>
                      <option value="none">None</option>
                      <option value="glow">Glow</option>
                      <option value="fire">Fire</option>
                      <option value="neon">Neon</option>
                      <option value="ice">Ice</option>
                      <option value="thunder">Thunder</option>
                      <option value="sparkle">Sparkle</option>
                      <option value="animated">Animated</option>
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Category</FormLabel>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Enter category"
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl>
                  <FormLabel>Stock (-1 for unlimited)</FormLabel>
                  <NumberInput value={formData.stock} onChange={(_, value) => setFormData({ ...formData, stock: value })} min={-1}>
                    <NumberInputField placeholder="-1" />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter banner description"
                    maxLength={500}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>Active</FormLabel>
                  <Switch
                    isChecked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={isCreateOpen ? onCreateClose : onEditClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleSubmit} isLoading={isCreating || isUpdating}>
                {isEditMode ? 'Update' : 'Create'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delete Confirmation */}
        <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelDeleteRef} onClose={onDeleteClose}>
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Banner
              </AlertDialogHeader>
              <AlertDialogBody>
                Are you sure you want to delete "{selectedBanner?.name}"? This will remove it from all users' inventories.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelDeleteRef} onClick={onDeleteClose}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3} isLoading={isDeleting}>
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

export default AdminBanners;








