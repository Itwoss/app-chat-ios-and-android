import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  useToast,
  SimpleGrid,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Center,
  IconButton,
  Tooltip,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { ShoppingCart, Search, Check, Sparkles, Type } from 'lucide-react';
import { useState } from 'react';
import {
  useGetAllFontsQuery,
  useGetUserFontInventoryQuery,
  usePurchaseFontMutation,
  useEquipFontMutation,
} from '../store/api/userApi';
import { useFont } from '../contexts/FontContext';

const FONT_TYPE_LABELS = {
  classic_serif: 'Classic Serif',
  modern_sans: 'Modern Sans',
  bold_pro: 'Bold Pro',
  handwritten: 'Handwritten',
  rounded_soft: 'Rounded Soft',
  neon_glow: 'Neon Glow',
  monospace_tech: 'Monospace Tech',
  luxury_script: 'Luxury Script',
  pixel_retro: 'Pixel Retro',
  graffiti_street: 'Graffiti Street',
};

const FontStore = () => {
  const toast = useToast();
  const { equippedFont } = useFont();
  const [filters, setFilters] = useState({
    category: '',
    fontType: '',
    search: '',
  });

  const { data: fontsData, isLoading: fontsLoading, refetch: refetchFonts } = useGetAllFontsQuery(filters);
  const { data: inventoryData, refetch: refetchInventory } = useGetUserFontInventoryQuery();
  const [purchaseFont, { isLoading: isPurchasing }] = usePurchaseFontMutation();
  const [equipFont, { isLoading: isEquipping }] = useEquipFontMutation();

  const fonts = fontsData?.data || [];
  const inventory = inventoryData?.data?.inventory || [];
  const ownedFontIds = new Set(inventory.map(f => f._id));
  const equippedFontId = inventoryData?.data?.equippedFont?._id;

  const handlePurchase = async (fontId) => {
    try {
      await purchaseFont(fontId).unwrap();
      toast({
        title: 'Success!',
        description: 'Font purchased successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetchFonts();
      refetchInventory();
    } catch (error) {
      toast({
        title: 'Purchase Failed',
        description: error?.data?.message || 'Failed to purchase font. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEquip = async (fontId) => {
    try {
      await equipFont(fontId).unwrap();
      toast({
        title: 'Success!',
        description: 'Font equipped successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      refetchFonts();
      refetchInventory();
      // Reload page to apply font globally
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Equip Failed',
        description: error?.data?.message || 'Failed to equip font. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box bg={bgColor} minH="100vh" py={8}>
        <Container maxW="7xl">
          <VStack spacing={6} align="stretch">
            {/* Header */}
            <Box>
              <Heading size="xl" mb={2}>
                Font Store
              </Heading>
              <Text color={textColor}>
                Customize your username appearance with unique fonts
              </Text>
            </Box>

            {/* Filters */}
            <Card bg={cardBg}>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Search size={20} />
                    </InputLeftElement>
                    <Input
                      placeholder="Search fonts..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </InputGroup>

                  <Select
                    placeholder="All Categories"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </Select>

                  <Select
                    placeholder="All Font Types"
                    value={filters.fontType}
                    onChange={(e) => handleFilterChange('fontType', e.target.value)}
                  >
                    {Object.entries(FONT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>

                  <Button
                    onClick={() => setFilters({ category: '', fontType: '', search: '' })}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                </SimpleGrid>
              </CardBody>
            </Card>

            {/* Fonts Grid */}
            {fontsLoading ? (
              <Center py={20}>
                <Spinner size="xl" />
              </Center>
            ) : fonts.length === 0 ? (
              <Center py={20}>
                <VStack spacing={4}>
                  <Type size={48} color={textColor} opacity={0.5} />
                  <Text color={textColor} fontSize="lg">
                    No fonts found
                  </Text>
                </VStack>
              </Center>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {fonts
                  .filter(font => {
                    if (filters.search) {
                      const searchLower = filters.search.toLowerCase();
                      return (
                        font.name.toLowerCase().includes(searchLower) ||
                        font.description?.toLowerCase().includes(searchLower) ||
                        FONT_TYPE_LABELS[font.fontType]?.toLowerCase().includes(searchLower)
                      );
                    }
                    return true;
                  })
                  .map((font) => {
                    const isOwned = font.isOwned || ownedFontIds.has(font._id);
                    const isEquipped = font.isEquipped || equippedFontId === font._id;

                    return (
                      <Card
                        key={font._id}
                        bg={cardBg}
                        border={isEquipped ? '2px solid' : '1px solid'}
                        borderColor={isEquipped ? 'blue.500' : borderColor}
                        _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                        transition="all 0.2s"
                      >
                        <CardBody>
                          <VStack spacing={4} align="stretch">
                            {/* Font Preview */}
                            <Box
                              p={6}
                              bg={useColorModeValue('gray.50', 'gray.700')}
                              borderRadius="md"
                              border="1px solid"
                              borderColor={borderColor}
                              textAlign="center"
                            >
                              <Text
                                fontSize="2xl"
                                fontWeight="bold"
                                fontFamily={font.fontFamily ? `"${font.fontFamily}", sans-serif` : 'sans-serif'}
                                style={font.cssStyles ? (() => {
                                  try {
                                    return JSON.parse(font.cssStyles);
                                  } catch {
                                    return {};
                                  }
                                })() : {}}
                                color={textColor}
                              >
                                {font.name}
                              </Text>
                              <Text fontSize="sm" color={textColor} opacity={0.7} mt={2}>
                                Preview: {font.name}
                              </Text>
                            </Box>

                            {/* Font Info */}
                            <VStack spacing={2} align="stretch">
                              <HStack justify="space-between">
                                <Heading size="sm">{font.name}</Heading>
                                {font.category === 'premium' && (
                                  <Badge colorScheme="purple">Premium</Badge>
                                )}
                                {font.isDefault && (
                                  <Badge colorScheme="blue">Default</Badge>
                                )}
                              </HStack>
                              <Text fontSize="sm" color={textColor} opacity={0.8}>
                                {FONT_TYPE_LABELS[font.fontType] || font.fontType}
                              </Text>
                              {font.description && (
                                <Text fontSize="xs" color={textColor} opacity={0.6}>
                                  {font.description}
                                </Text>
                              )}
                            </VStack>

                            <Divider />

                            {/* Price and Actions */}
                            <VStack spacing={2}>
                              <HStack justify="space-between" w="full">
                                <Text fontWeight="bold" fontSize="lg">
                                  {font.price === 0 ? 'Free' : `${font.price} coins`}
                                </Text>
                                {isEquipped && (
                                  <Badge colorScheme="green">Equipped</Badge>
                                )}
                                {isOwned && !isEquipped && (
                                  <Badge colorScheme="blue">Owned</Badge>
                                )}
                              </HStack>

                              {!isOwned ? (
                                <Button
                                  leftIcon={<ShoppingCart size={18} />}
                                  colorScheme="blue"
                                  w="full"
                                  onClick={() => handlePurchase(font._id)}
                                  isLoading={isPurchasing}
                                  isDisabled={font.price > 0} // Disable if payment not implemented
                                >
                                  {font.price === 0 ? 'Get Free' : `Buy ${font.price} coins`}
                                </Button>
                              ) : !isEquipped ? (
                                <Button
                                  leftIcon={<Check size={18} />}
                                  colorScheme="green"
                                  w="full"
                                  onClick={() => handleEquip(font._id)}
                                  isLoading={isEquipping}
                                >
                                  Equip Font
                                </Button>
                              ) : (
                                <Button
                                  leftIcon={<Check size={18} />}
                                  colorScheme="blue"
                                  variant="outline"
                                  w="full"
                                  isDisabled
                                >
                                  Currently Equipped
                                </Button>
                              )}
                            </VStack>
                          </VStack>
                        </CardBody>
                      </Card>
                    );
                  })}
              </SimpleGrid>
            )}
          </VStack>
        </Container>
      </Box>
  );
};

export default FontStore;

