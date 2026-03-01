import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Spinner,
  Center,
  Image,
  Tooltip,
  Select,
  useToast,
} from '@chakra-ui/react';
import { ShoppingCart, Search, Sparkles, Flame, Zap, Snowflake, Star, Droplets, Filter } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useGetAllBannersQuery,
  useGetUserInventoryQuery,
  useClaimFreeBannerMutation,
} from '../store/api/userApi';

const RARITY_COLORS = {
  Common: 'gray',
  Uncommon: 'green',
  Rare: 'blue',
  Epic: 'purple',
  Legendary: 'orange',
  Mythic: 'red',
};

const EFFECT_ICONS = {
  none: null,
  glow: Sparkles,
  fire: Flame,
  neon: Zap,
  ice: Snowflake,
  thunder: Zap,
  sparkle: Star,
  animated: Droplets,
};

// Create Post–style glass panel tokens
const glassPanel = {
  bg: 'transparent',
  border: '1px solid',
  borderColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: { base: '16px', md: '24px' },
  sx: {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: 'none',
  },
};

const inputStyles = {
  border: '1px solid',
  borderColor: 'whiteAlpha.200',
  borderRadius: { base: '8px', md: '12px' },
  bg: 'whiteAlpha.50',
  color: 'white',
  _placeholder: { color: 'whiteAlpha.500' },
  _focus: {
    borderColor: 'whiteAlpha.400',
    boxShadow: 'none',
  },
  _hover: { borderColor: 'whiteAlpha.300' },
};

const selectStyles = {
  ...inputStyles,
};

const BannerStore = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [filters, setFilters] = useState({
    category: '',
    rarity: '',
    effect: '',
    minPrice: '',
    maxPrice: '',
    search: '',
  });

  const { data: bannersData, isLoading: bannersLoading } = useGetAllBannersQuery(filters);
  const { data: inventoryData } = useGetUserInventoryQuery();
  const [claimFreeBanner, { isLoading: isClaimingFree }] = useClaimFreeBannerMutation();
  const [claimingBannerId, setClaimingBannerId] = useState(null);

  const banners = bannersData?.data || [];
  const inventory = inventoryData?.data?.inventory || [];
  const ownedBannerIds = new Set(inventory.map(b => b._id));

  const handleBuyClick = (banner) => {
    if (ownedBannerIds.has(banner._id)) return;
    if (banner.stock !== -1 && banner.stock <= 0) return;
    const isFree = Number(banner.price) === 0;
    if (isFree) {
      setClaimingBannerId(banner._id);
      claimFreeBanner({ bannerId: banner._id })
        .unwrap()
        .then(() => {
          toast({ title: 'Added!', description: 'Banner added to your inventory.', status: 'success', duration: 3000, isClosable: true });
        })
        .catch((err) => {
          const msg = err?.data?.message || err?.message || 'Failed to claim';
          toast({ title: 'Error', description: msg, status: 'error', duration: 4000, isClosable: true });
        })
        .finally(() => setClaimingBannerId(null));
      return;
    }
    navigate('/user/banner-store/payment', { state: { banner } });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      rarity: '',
      effect: '',
      minPrice: '',
      maxPrice: '',
      search: '',
    });
  };

  const getEffectIcon = (effect) => {
    const Icon = EFFECT_ICONS[effect];
    return Icon ? <Icon size={16} /> : null;
  };

  if (bannersLoading) {
    return (
      <Box minH="100vh" bg="black" position="relative">
        <Center minH="400px">
          <Spinner size="xl" color="white" />
        </Center>
      </Box>
    );
  }

  return (
    <Box
        h={{ base: '100vh', md: '100vh' }}
        maxH="100vh"
        w="100%"
        bg="black"
        position="relative"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        py={{ base: 1, md: 2 }}
        px={{ base: 2, md: 3 }}
      >
        <Container maxW="7xl" px={{ base: 0, md: 2 }} flex="1" minH={0} display="flex" flexDirection="column">
          {/* Create Post–style glass panel: one screen, no scroll */}
          <Box
            {...glassPanel}
            flex="1"
            minH={0}
            overflow="hidden"
            display="flex"
            flexDirection="column"
            mx={0}
          >
            {/* Header - compact */}
            <Box
              px={{ base: 2, md: 3 }}
              py={{ base: 1.5, md: 2 }}
              borderBottom="1px solid"
              borderColor="whiteAlpha.100"
              bg="transparent"
              flexShrink={0}
            >
              <HStack justify="space-between" align="center" gap={2}>
                <Heading size="md" color="white" fontWeight={600} noOfLines={1}>
                  Banner Store
                </Heading>
                <Button
                  size="xs"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </HStack>
              <Text color="whiteAlpha.600" fontSize="xs" noOfLines={1} mt={0.5}>
                Purchase banners for your profile
              </Text>
            </Box>

            {/* Filters - compact, minimal gap */}
            <Box
              px={{ base: 2, md: 3 }}
              py={{ base: 1.5, md: 2 }}
              borderBottom="1px solid"
              borderColor="whiteAlpha.100"
              flexShrink={0}
            >
              <SimpleGrid columns={{ base: 2, sm: 3, md: 6 }} spacing={{ base: 1, md: 2 }}>
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none" color="whiteAlpha.600" width="8">
                    <Search size={14} />
                  </InputLeftElement>
                  <Input
                    placeholder="Search"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    pl={7}
                    fontSize="xs"
                    {...inputStyles}
                  />
                </InputGroup>
                <Select
                  placeholder="Category"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  size="sm"
                  fontSize="xs"
                  {...selectStyles}
                >
                  {Array.from(new Set(banners.map(b => b.category))).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
                <Select
                  placeholder="Rarity"
                  value={filters.rarity}
                  onChange={(e) => handleFilterChange('rarity', e.target.value)}
                  size="sm"
                  fontSize="xs"
                  {...selectStyles}
                >
                  <option value="Common">Common</option>
                  <option value="Uncommon">Uncommon</option>
                  <option value="Rare">Rare</option>
                  <option value="Epic">Epic</option>
                  <option value="Legendary">Legendary</option>
                  <option value="Mythic">Mythic</option>
                </Select>
                <Select
                  placeholder="Effect"
                  value={filters.effect}
                  onChange={(e) => handleFilterChange('effect', e.target.value)}
                  size="sm"
                  fontSize="xs"
                  {...selectStyles}
                >
                  <option value="none">None</option>
                  <option value="glow">Glow</option>
                  <option value="fire">Fire</option>
                  <option value="neon">Neon</option>
                  <option value="ice">Ice</option>
                  <option value="thunder">Thunder</option>
                  <option value="sparkle">Sparkle</option>
                  <option value="animated">Animated</option>
                </Select>
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  size="sm"
                  fontSize="xs"
                  {...inputStyles}
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  size="sm"
                  fontSize="xs"
                  {...inputStyles}
                />
              </SimpleGrid>
            </Box>

            {/* Banners Grid - fills remaining space, no scroll */}
            <Box
              flex="1"
              minH={0}
              overflow="hidden"
              px={{ base: 2, md: 3 }}
              py={{ base: 1.5, md: 2 }}
              display="flex"
              flexDirection="column"
            >
              {banners.length === 0 ? (
                <Center flex="1">
                  <Text color="whiteAlpha.600" fontSize="sm">No banners found.</Text>
                </Center>
              ) : (
                <SimpleGrid
                  columns={{ base: 2, sm: 2, md: 3, lg: 4 }}
                  spacing={{ base: 1, md: 2 }}
                  flex="1"
                  minH={0}
                  alignContent="start"
                  overflow="hidden"
                >
                  {banners.map((banner) => {
                    const isOwned = ownedBannerIds.has(banner._id);
                    const isFree = Number(banner.price) === 0;
                    const isClaimingThis = claimingBannerId === banner._id;
                    const EffectIcon = EFFECT_ICONS[banner.effect];

                    return (
                      <Box
                        key={banner._id}
                        position="relative"
                        overflow="hidden"
                        borderRadius={{ base: '10px', md: '14px' }}
                        border="1px solid"
                        borderColor={isOwned ? 'green.400' : 'whiteAlpha.200'}
                        bg="whiteAlpha.50"
                        _hover={{
                          borderColor: isOwned ? 'green.400' : 'whiteAlpha.400',
                          shadow: 'md',
                          transform: 'translateY(-2px)',
                        }}
                        transition="all 0.2s"
                        flexShrink={0}
                      >
                        <Box
                          h={{ base: '72px', sm: '80px', md: '90px' }}
                          bg="whiteAlpha.100"
                          position="relative"
                          overflow="hidden"
                        >
                          <Image
                            src={banner.imageUrl}
                            alt={banner.name}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                          />
                          <HStack position="absolute" top={1} right={1} left={1} justify="space-between">
                            {EffectIcon && (
                              <Tooltip label={banner.effect}>
                                <Box p={0.5} bg="blackAlpha.600" borderRadius="sm" color="white">
                                  <EffectIcon size={12} />
                                </Box>
                              </Tooltip>
                            )}
                            <Box
                              as="span"
                              px={1}
                              py={0.5}
                              borderRadius="sm"
                              fontSize="xs"
                              fontWeight="600"
                              color="white"
                              bg={`${RARITY_COLORS[banner.rarity]}.500`}
                            >
                              {banner.rarity}
                            </Box>
                          </HStack>
                          {isOwned && (
                            <Box
                              position="absolute"
                              bottom={1}
                              left={1}
                              px={1}
                              py={0.5}
                              borderRadius="sm"
                              fontSize="xs"
                              fontWeight="600"
                              color="white"
                              bg="green.500"
                            >
                              Owned
                            </Box>
                          )}
                        </Box>

                        <VStack spacing={{ base: 0.5, md: 1 }} align="stretch" p={{ base: 1.5, md: 2 }} bg="transparent">
                          <Text fontWeight="600" fontSize={{ base: 'xs', md: 'sm' }} color="white" noOfLines={1}>
                            {banner.name}
                          </Text>
                          <HStack justify="space-between" flexWrap="nowrap">
                            <Text fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }} color={isFree ? 'green.400' : 'blue.300'}>
                              {isFree ? 'Free' : `₹${banner.price}`}
                            </Text>
                            {banner.stock !== -1 && (
                              <Text fontSize="xs" color="whiteAlpha.500">
                                {banner.stock}
                              </Text>
                            )}
                          </HStack>
                          <Button
                            size="xs"
                            leftIcon={<ShoppingCart size={12} />}
                            onClick={() => handleBuyClick(banner)}
                            isDisabled={isOwned || (banner.stock !== -1 && banner.stock <= 0) || isClaimingThis}
                            isLoading={isClaimingThis}
                            loadingText="Adding..."
                            colorScheme={isOwned ? 'green' : isFree ? 'green' : 'blue'}
                            color="white"
                            height={{ base: '24px', md: '28px' }}
                            fontSize="xs"
                            _hover={
                              isOwned ? { bg: 'green.600' } : isFree ? { bg: 'green.600' } : { bg: 'blue.600' }
                            }
                          >
                            {isOwned ? 'Owned' : banner.stock !== -1 && banner.stock <= 0 ? 'Out' : isFree ? 'Get' : 'Buy'}
                          </Button>
                        </VStack>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
  );
};

export default BannerStore;
