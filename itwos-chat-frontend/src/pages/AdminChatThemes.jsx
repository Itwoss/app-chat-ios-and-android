import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  useToast,
  SimpleGrid,
  IconButton,
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
  Input,
  Switch,
  Spinner,
  Center,
  Image,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
} from '@chakra-ui/react';
import { Plus, MoreVertical, Edit, Trash2, Palette } from 'lucide-react';
import { useState, useRef } from 'react';
import {
  useGetAllChatThemesAdminQuery,
  useCreateChatThemeAdminMutation,
  useUpdateChatThemeAdminMutation,
  useDeleteChatThemeAdminMutation,
} from '../store/api/adminApi';
import AdminLayout from '../components/Admin/AdminLayout';
import ColorPickerField from '../components/Admin/ColorPickerField';

const AdminChatThemes = () => {
  const toast = useToast();
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    wallpaper: '',
    isFree: true,
    price: '0',
    sortOrder: '0',
    isActive: true,
    backgroundColor: '',
    outgoingBubbleColor: '',
    incomingBubbleColor: '',
    outgoingBubbleTextColor: 'rgba(255,255,255,0.88)',
    incomingBubbleTextColor: 'rgba(0,0,0,0.85)',
  });
  const [wallpaperFile, setWallpaperFile] = useState(null);
  const cancelDeleteRef = useRef();

  const { isOpen: isModalOpen, onOpen: onModalOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const { data, isLoading, refetch } = useGetAllChatThemesAdminQuery({});
  const [createTheme, { isLoading: isCreating }] = useCreateChatThemeAdminMutation();
  const [updateTheme, { isLoading: isUpdating }] = useUpdateChatThemeAdminMutation();
  const [deleteTheme, { isLoading: isDeleting }] = useDeleteChatThemeAdminMutation();

  const themes = data?.data || [];

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      wallpaper: '',
      isFree: true,
      price: '0',
      sortOrder: '0',
      isActive: true,
      backgroundColor: '',
      outgoingBubbleColor: '',
      incomingBubbleColor: '',
      outgoingBubbleTextColor: 'rgba(255,255,255,0.88)',
      incomingBubbleTextColor: 'rgba(0,0,0,0.85)',
    });
    setWallpaperFile(null);
    setSelectedTheme(null);
  };

  const handleCreate = () => {
    resetForm();
    onModalOpen();
  };

  const handleEdit = (theme) => {
    setSelectedTheme(theme);
    setFormData({
      name: theme.name || '',
      description: theme.description || '',
      wallpaper: theme.wallpaper || '',
      isFree: !!theme.isFree,
      price: String(theme.price ?? 0),
      sortOrder: String(theme.sortOrder ?? 0),
      isActive: theme.isActive !== false,
      backgroundColor: theme.backgroundColor || '',
      outgoingBubbleColor: theme.outgoingBubbleColor || '',
      incomingBubbleColor: theme.incomingBubbleColor || '',
      outgoingBubbleTextColor: theme.outgoingBubbleTextColor || 'rgba(255,255,255,0.88)',
      incomingBubbleTextColor: theme.incomingBubbleTextColor || 'rgba(0,0,0,0.85)',
    });
    setWallpaperFile(null);
    onModalOpen();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', formData.name.trim());
    form.append('description', formData.description.trim());
    form.append('isFree', formData.isFree);
    form.append('price', formData.isFree ? '0' : formData.price);
    form.append('sortOrder', formData.sortOrder);
    form.append('isActive', formData.isActive);
    if (formData.backgroundColor) form.append('backgroundColor', formData.backgroundColor.trim());
    if (formData.outgoingBubbleColor) form.append('outgoingBubbleColor', formData.outgoingBubbleColor.trim());
    if (formData.incomingBubbleColor) form.append('incomingBubbleColor', formData.incomingBubbleColor.trim());
    if (formData.outgoingBubbleTextColor) form.append('outgoingBubbleTextColor', formData.outgoingBubbleTextColor.trim());
    if (formData.incomingBubbleTextColor) form.append('incomingBubbleTextColor', formData.incomingBubbleTextColor.trim());
    if (wallpaperFile) form.append('file', wallpaperFile);

    try {
      if (selectedTheme) {
        await updateTheme({ id: selectedTheme._id, formData: form }).unwrap();
        toast({ title: 'Theme updated', status: 'success', duration: 3000 });
      } else {
        await createTheme(form).unwrap();
        toast({ title: 'Theme created', status: 'success', duration: 3000 });
      }
      onModalClose();
      resetForm();
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || err?.message || 'Failed to save theme',
        status: 'error',
        duration: 4000,
      });
    }
  };

  const handleDeleteClick = (theme) => {
    setSelectedTheme(theme);
    onDeleteOpen();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTheme) return;
    try {
      await deleteTheme(selectedTheme._id).unwrap();
      toast({ title: 'Theme deleted', status: 'success', duration: 3000 });
      onDeleteClose();
      setSelectedTheme(null);
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to delete theme',
        status: 'error',
      });
    }
  };

  return (
    <AdminLayout>
      <Box p={4}>
        <HStack justify="space-between" mb={6}>
          <Heading size="lg" display="flex" alignItems="center" gap={2}>
            <Palette size={28} />
            Chat Themes
          </Heading>
          <Button leftIcon={<Plus size={18} />} colorScheme="brand" onClick={handleCreate}>
            Add Theme
          </Button>
        </HStack>

        {isLoading ? (
          <Center py={12}>
            <Spinner size="xl" />
          </Center>
        ) : themes.length === 0 ? (
          <Center py={12}>
            <Text color="gray.500">No chat themes yet. Add one to let users customize their chat.</Text>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {themes.map((theme) => (
              <Box
                key={theme._id}
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                bg="white"
                _dark={{ bg: 'gray.800' }}
              >
                <Box
                  h="120px"
                  bgImage={theme.wallpaper ? `url(${theme.wallpaper})` : undefined}
                  bg={theme.wallpaper ? undefined : (theme.backgroundColor || 'gray.800')}
                  style={!theme.wallpaper && theme.backgroundColor ? { backgroundColor: theme.backgroundColor } : undefined}
                  bgSize="cover"
                  bgPos="center"
                />
                <HStack px={2} py={1.5} spacing={1} bg="gray.50" _dark={{ bg: 'gray.900' }} minH="40px">
                  <Box
                    flex={1}
                    py={1}
                    px={2}
                    borderRadius="12px 12px 4px 12px"
                    bg={theme.outgoingBubbleColor || 'blue.500'}
                    color={theme.outgoingBubbleTextColor || 'rgba(255,255,255,0.88)'}
                  >
                    <Text fontSize="xs" noOfLines={1}>Send</Text>
                  </Box>
                  <Box
                    flex={1}
                    py={1}
                    px={2}
                    borderRadius="12px 12px 12px 4px"
                    bg={theme.incomingBubbleColor || 'gray.300'}
                    color={theme.incomingBubbleTextColor || 'rgba(0,0,0,0.85)'}
                  >
                    <Text fontSize="xs" noOfLines={1}>Recv</Text>
                  </Box>
                </HStack>
                <Box p={3}>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="600" noOfLines={1}>
                        {theme.name}
                      </Text>
                      <HStack>
                        {theme.isFree ? (
                          <Badge colorScheme="green">Free</Badge>
                        ) : (
                          <Badge colorScheme="blue">₹{theme.price}</Badge>
                        )}
                        {!theme.isActive && <Badge colorScheme="gray">Inactive</Badge>}
                      </HStack>
                    </VStack>
                    <Menu>
                      <MenuButton as={IconButton} icon={<MoreVertical size={16} />} size="sm" variant="ghost" aria-label="Options" />
                      <MenuList>
                        <MenuItem icon={<Edit size={14} />} onClick={() => handleEdit(theme)}>
                          Edit
                        </MenuItem>
                        <MenuItem icon={<Trash2 size={14} />} color="red.500" onClick={() => handleDeleteClick(theme)}>
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </HStack>
                  {theme.description && (
                    <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }} noOfLines={2} mt={1}>
                      {theme.description}
                    </Text>
                  )}
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      <Modal isOpen={isModalOpen} onClose={() => { onModalClose(); resetForm(); }} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedTheme ? 'Edit Chat Theme' : 'Add Chat Theme'}</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Ocean Blue"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Optional"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Wallpaper (optional – upload image file; leave empty for background color only)</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setWallpaperFile(e.target.files?.[0] || null)}
                  />
                  {selectedTheme?.wallpaper && !wallpaperFile && (
                    <Box mt={2}>
                      <Text fontSize="xs" color="gray.500">Current:</Text>
                      <Image src={selectedTheme.wallpaper} maxH="80px" borderRadius="md" alt="" />
                    </Box>
                  )}
                </FormControl>
                <ColorPickerField
                  label="Chat background color (when no image)"
                  value={formData.backgroundColor}
                  onChange={(v) => setFormData((p) => ({ ...p, backgroundColor: v }))}
                  placeholder="e.g. #121212 or rgba(18,18,18,1)"
                />
                <ColorPickerField
                  label="Outgoing bubble color (hex or rgba)"
                  value={formData.outgoingBubbleColor}
                  onChange={(v) => setFormData((p) => ({ ...p, outgoingBubbleColor: v }))}
                  placeholder="e.g. #0084FF or rgba(0,132,255,0.9)"
                />
                <ColorPickerField
                  label="Incoming bubble color (hex or rgba)"
                  value={formData.incomingBubbleColor}
                  onChange={(v) => setFormData((p) => ({ ...p, incomingBubbleColor: v }))}
                  placeholder="e.g. #E5E5EA or rgba(229,229,234,0.95)"
                />
                <ColorPickerField
                  label="Outgoing bubble text color (reduced / softer)"
                  value={formData.outgoingBubbleTextColor}
                  onChange={(v) => setFormData((p) => ({ ...p, outgoingBubbleTextColor: v }))}
                  placeholder="e.g. rgba(255,255,255,0.88)"
                />
                <ColorPickerField
                  label="Incoming bubble text color (reduced / softer)"
                  value={formData.incomingBubbleTextColor}
                  onChange={(v) => setFormData((p) => ({ ...p, incomingBubbleTextColor: v }))}
                  placeholder="e.g. rgba(0,0,0,0.85)"
                />
                <Box w="100%" p={3} borderRadius="md" bg={formData.backgroundColor ? undefined : 'gray.100'} _dark={!formData.backgroundColor ? { bg: 'gray.700' } : undefined} style={formData.backgroundColor ? { backgroundColor: formData.backgroundColor } : undefined}>
                  <Text fontSize="xs" fontWeight="600" mb={2} color="gray.600" _dark={{ color: 'gray.300' }}>Preview</Text>
                  <VStack align="stretch" spacing={2}>
                    <Box
                      alignSelf="flex-end"
                      maxW="80%"
                      px={3}
                      py={2}
                      borderRadius="18px 18px 4px 18px"
                      bg={formData.outgoingBubbleColor || 'blue.500'}
                      color={formData.outgoingBubbleTextColor || 'white'}
                    >
                      <Text fontSize="sm">Outgoing message</Text>
                    </Box>
                    <Box
                      alignSelf="flex-start"
                      maxW="80%"
                      px={3}
                      py={2}
                      borderRadius="18px 18px 18px 4px"
                      bg={formData.incomingBubbleColor || 'gray.300'}
                      color={formData.incomingBubbleTextColor || 'gray.800'}
                    >
                      <Text fontSize="sm">Incoming message</Text>
                    </Box>
                  </VStack>
                </Box>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>Free theme</FormLabel>
                  <Switch
                    isChecked={formData.isFree}
                    onChange={(e) => setFormData((p) => ({ ...p, isFree: e.target.checked }))}
                  />
                </FormControl>
                {!formData.isFree && (
                  <FormControl>
                    <FormLabel>Price (₹)</FormLabel>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={formData.price}
                      onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                    />
                  </FormControl>
                )}
                <FormControl>
                  <FormLabel>Sort order</FormLabel>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData((p) => ({ ...p, sortOrder: e.target.value }))}
                  />
                </FormControl>
                <FormControl display="flex" alignItems="center">
                  <FormLabel mb={0}>Active</FormLabel>
                  <Switch
                    isChecked={formData.isActive}
                    onChange={(e) => setFormData((p) => ({ ...p, isActive: e.target.checked }))}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => { onModalClose(); resetForm(); }}>
                Cancel
              </Button>
              <Button type="submit" colorScheme="brand" isLoading={isCreating || isUpdating}>
                {selectedTheme ? 'Update' : 'Create'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelDeleteRef} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Delete theme?</AlertDialogHeader>
            <AlertDialogBody>
              This will remove &quot;{selectedTheme?.name}&quot;. Users who purchased it will keep access until you remove the theme. Continue?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelDeleteRef} onClick={onDeleteClose}>Cancel</Button>
              <Button colorScheme="red" onClick={handleDeleteConfirm} isLoading={isDeleting} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminChatThemes;
