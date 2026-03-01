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
  Textarea,
  Switch,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue,
} from '@chakra-ui/react';
import { MoreVertical, Plus, Edit, Trash2, Type, X } from 'lucide-react';
import { useState, useRef } from 'react';
import {
  useGetAllFontsAdminQuery,
  useCreateFontAdminMutation,
  useUpdateFontAdminMutation,
  useDeleteFontAdminMutation,
} from '../store/api/adminApi';
import AdminLayout from '../components/Admin/AdminLayout';
import FileUpload from '../components/Admin/FileUpload';

const FONT_TYPE_OPTIONS = [
  { value: 'classic_serif', label: 'Classic Serif' },
  { value: 'modern_sans', label: 'Modern Sans' },
  { value: 'bold_pro', label: 'Bold Pro' },
  { value: 'handwritten', label: 'Handwritten' },
  { value: 'rounded_soft', label: 'Rounded Soft' },
  { value: 'neon_glow', label: 'Neon Glow' },
  { value: 'monospace_tech', label: 'Monospace Tech' },
  { value: 'luxury_script', label: 'Luxury Script' },
  { value: 'pixel_retro', label: 'Pixel Retro' },
  { value: 'graffiti_street', label: 'Graffiti Street' },
];

const AdminFonts = () => {
  const toast = useToast();
  const [selectedFont, setSelectedFont] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [fontFile, setFontFile] = useState(null);
  const cancelDeleteRef = useRef();

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  const { data, isLoading, refetch } = useGetAllFontsAdminQuery();
  const [createFont, { isLoading: isCreating }] = useCreateFontAdminMutation();
  const [updateFont, { isLoading: isUpdating }] = useUpdateFontAdminMutation();
  const [deleteFont, { isLoading: isDeleting }] = useDeleteFontAdminMutation();

  const fonts = data?.data || [];
  const [formData, setFormData] = useState({
    name: '',
    fontFamily: '',
    fileUrl: '',
    previewUrl: '',
    price: 0,
    category: 'free',
    fontType: 'modern_sans',
    description: '',
    cssStyles: '',
    isActive: true,
    isDefault: false,
  });

  const handleCreate = () => {
    setSelectedFont(null);
    setIsEditMode(false);
    setFormData({
      name: '',
      fontFamily: '',
      fileUrl: '',
      previewUrl: '',
      price: 0,
      category: 'free',
      fontType: 'modern_sans',
      description: '',
      cssStyles: '',
      isActive: true,
      isDefault: false,
    });
    setFontFile(null);
    onCreateOpen();
  };

  const handleEdit = (font) => {
    setSelectedFont(font);
    setIsEditMode(true);
    setFormData({
      name: font.name || '',
      fontFamily: font.fontFamily || '',
      fileUrl: font.fileUrl || '',
      previewUrl: font.previewUrl || '',
      price: font.price || 0,
      category: font.category || 'free',
      fontType: font.fontType || 'modern_sans',
      description: font.description || '',
      cssStyles: font.cssStyles || '',
      isActive: font.isActive !== undefined ? font.isActive : true,
      isDefault: font.isDefault || false,
    });
    setFontFile(null);
    onEditOpen();
  };

  const handleDelete = (font) => {
    setSelectedFont(font);
    onDeleteOpen();
  };

  const handleSubmit = async () => {
    try {
      const dataToSend = {
        ...formData,
        price: parseFloat(formData.price),
        isActive: formData.isActive,
        isDefault: formData.isDefault,
      };

      if (isEditMode) {
        await updateFont({ id: selectedFont._id, data: dataToSend }).unwrap();
        toast({
          title: 'Success',
          description: 'Font updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onEditClose();
      } else {
        await createFont(dataToSend).unwrap();
        toast({
          title: 'Success',
          description: 'Font created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onCreateClose();
      }

      refetch();
      setFormData({
        name: '',
        fontFamily: '',
        fileUrl: '',
        previewUrl: '',
        price: 0,
        category: 'free',
        fontType: 'modern_sans',
        description: '',
        cssStyles: '',
        isActive: true,
        isDefault: false,
      });
      setFontFile(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to save font',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteFont(selectedFont._id).unwrap();
      toast({
        title: 'Success',
        description: 'Font deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to delete font',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <AdminLayout>
      <Box bg={bgColor} minH="100vh" p={6}>
        <Container maxW="7xl">
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <HStack justify="space-between">
              <Heading size="lg">Font Management</Heading>
              <Button
                leftIcon={<Plus size={20} />}
                colorScheme="blue"
                onClick={handleCreate}
              >
                Create Font
              </Button>
            </HStack>

            {/* Fonts Table */}
            {isLoading ? (
              <Center py={10}>
                <Spinner size="xl" />
              </Center>
            ) : (
              <Box bg={cardBg} borderRadius="lg" overflow="hidden" border="1px" borderColor={borderColor}>
                <Table variant="simple">
                  <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Font Family</Th>
                      <Th>Type</Th>
                      <Th>Category</Th>
                      <Th>Price</Th>
                      <Th>Status</Th>
                      <Th>Purchases</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {fonts.map((font) => (
                      <Tr key={font._id}>
                        <Td>
                          <HStack spacing={2}>
                            <Type size={16} />
                            <Text fontWeight="medium">{font.name}</Text>
                            {font.isDefault && (
                              <Badge colorScheme="blue" size="sm">Default</Badge>
                            )}
                          </HStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm" fontFamily={font.fontFamily ? `"${font.fontFamily}", sans-serif` : 'sans-serif'}>
                            {font.fontFamily}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {FONT_TYPE_OPTIONS.find(opt => opt.value === font.fontType)?.label || font.fontType}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={font.category === 'premium' ? 'purple' : 'green'}>
                            {font.category}
                          </Badge>
                        </Td>
                        <Td>
                          <Text>{font.price === 0 ? 'Free' : `${font.price} coins`}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={font.isActive ? 'green' : 'red'}>
                            {font.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </Td>
                        <Td>
                          <Text>{font.purchaseCount || 0}</Text>
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
                              <MenuItem icon={<Edit size={16} />} onClick={() => handleEdit(font)}>
                                Edit
                              </MenuItem>
                              <MenuItem
                                icon={<Trash2 size={16} />}
                                color="red.500"
                                onClick={() => handleDelete(font)}
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
            )}

            {/* Create/Edit Modal */}
            <Modal isOpen={isCreateOpen || isEditOpen} onClose={isEditMode ? onEditClose : onCreateClose} size="xl">
              <ModalOverlay />
              <ModalContent>
                <ModalHeader>{isEditMode ? 'Edit Font' : 'Create Font'}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                  <VStack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Font Name</FormLabel>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Neon Glow"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Font Family</FormLabel>
                      <Input
                        value={formData.fontFamily}
                        onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
                        placeholder="e.g., NeonGlow"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Font File URL</FormLabel>
                      <Input
                        value={formData.fileUrl}
                        onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                        placeholder="https://example.com/font.woff2"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Preview URL (Optional)</FormLabel>
                      <Input
                        value={formData.previewUrl}
                        onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
                        placeholder="https://example.com/preview.png"
                      />
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Font Type</FormLabel>
                      <Select
                        value={formData.fontType}
                        onChange={(e) => setFormData({ ...formData, fontType: e.target.value })}
                      >
                        {FONT_TYPE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="free">Free</option>
                        <option value="premium">Premium</option>
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Price (coins)</FormLabel>
                      <NumberInput
                        value={formData.price}
                        onChange={(value) => setFormData({ ...formData, price: value })}
                        min={0}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Font description..."
                        rows={3}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>CSS Styles (JSON or CSS string)</FormLabel>
                      <Textarea
                        value={formData.cssStyles}
                        onChange={(e) => setFormData({ ...formData, cssStyles: e.target.value })}
                        placeholder='{"textShadow": "0 0 10px #ff00ff"}' or CSS string
                        rows={3}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Active</FormLabel>
                      <Switch
                        isChecked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                    </FormControl>

                    <FormControl display="flex" alignItems="center">
                      <FormLabel mb={0}>Default Font</FormLabel>
                      <Switch
                        isChecked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      />
                    </FormControl>
                  </VStack>
                </ModalBody>
                <ModalFooter>
                  <Button variant="ghost" mr={3} onClick={isEditMode ? onEditClose : onCreateClose}>
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={handleSubmit}
                    isLoading={isCreating || isUpdating}
                  >
                    {isEditMode ? 'Update' : 'Create'}
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>

            {/* Delete Confirmation */}
            <AlertDialog
              isOpen={isDeleteOpen}
              leastDestructiveRef={cancelDeleteRef}
              onClose={onDeleteClose}
            >
              <AlertDialogOverlay>
                <AlertDialogContent>
                  <AlertDialogHeader fontSize="lg" fontWeight="bold">
                    Delete Font
                  </AlertDialogHeader>
                  <AlertDialogBody>
                    Are you sure you want to delete "{selectedFont?.name}"? This action cannot be undone.
                    {selectedFont?.purchaseCount > 0 && (
                      <Text color="red.500" mt={2}>
                        Warning: {selectedFont.purchaseCount} user(s) own this font. You should disable it instead of deleting.
                      </Text>
                    )}
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
          </VStack>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default AdminFonts;

