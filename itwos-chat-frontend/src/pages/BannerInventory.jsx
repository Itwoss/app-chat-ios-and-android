import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  useToast,
  SimpleGrid,
  Spinner,
  Center,
  Image,
  Tooltip,
  Collapse,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { Check, X, ShoppingCart, Sparkles, Flame, Zap, Snowflake, Star, Droplets, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useGetUserInventoryQuery,
  useGetMyBannerPaymentsQuery,
  useEquipBannerMutation,
  useUnequipBannerMutation,
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

// Same as Banner Store: Create Post–style glass panel
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

const BannerInventory = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen: isPaymentsOpen, onToggle: onPaymentsToggle } = useDisclosure();
  const { data: inventoryData, isLoading, refetch } = useGetUserInventoryQuery();
  const { data: paymentsData } = useGetMyBannerPaymentsQuery();
  const [equipBanner, { isLoading: isEquipping }] = useEquipBannerMutation();
  const [unequipBanner, { isLoading: isUnequipping }] = useUnequipBannerMutation();

  const payments = paymentsData?.data || [];
  const inventory = inventoryData?.data?.inventory || [];
  const equippedBanner = inventoryData?.data?.equippedBanner;
  const equippedBannerId = equippedBanner?._id;

  const handleEquip = async (bannerId) => {
    try {
      await equipBanner(bannerId).unwrap();
      refetch();
      toast({
        title: 'Success!',
        description: 'Banner equipped successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to equip banner.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUnequip = async () => {
    try {
      await unequipBanner().unwrap();
      await refetch();
      toast({
        title: 'Success!',
        description: 'Banner unequipped successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to unequip banner.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getEffectIcon = (effect) => {
    const Icon = EFFECT_ICONS[effect];
    return Icon ? <Icon size={16} /> : null;
  };

  if (isLoading) {
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
          <Box
            {...glassPanel}
            flex="1"
            minH={0}
            overflow="hidden"
            display="flex"
            flexDirection="column"
            mx={0}
          >
            {/* Header - same as Banner Store */}
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
                  Banner Inventory
                </Heading>
                <Button
                  size="xs"
                  leftIcon={<ShoppingCart size={14} />}
                  colorScheme="blue"
                  color="white"
                  _hover={{ bg: 'blue.600' }}
                  onClick={() => navigate('/user/banner-store')}
                >
                  Browse Store
                </Button>
              </HStack>
              <Text color="whiteAlpha.600" fontSize="xs" noOfLines={1} mt={0.5}>
                Manage your banner collection
              </Text>
            </Box>

            {/* Currently equipped strip - same style as store */}
            <Box
              px={{ base: 2, md: 3 }}
              py={{ base: 1.5, md: 2 }}
              borderBottom="1px solid"
              borderColor="whiteAlpha.100"
              bg="whiteAlpha.50"
              flexShrink={0}
            >
              {equippedBanner ? (
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack spacing={2}>
                    <Text fontSize="xs" color="whiteAlpha.600">
                      Equipped:
                    </Text>
                    <Text fontWeight="600" fontSize="sm" color="white" noOfLines={1}>
                      {equippedBanner.name}
                    </Text>
                  </HStack>
                  <Button
                    size="xs"
                    variant="outline"
                    color="red.300"
                    borderColor="whiteAlpha.300"
                    _hover={{ bg: 'whiteAlpha.100' }}
                    leftIcon={<X size={12} />}
                    onClick={handleUnequip}
                    isLoading={isUnequipping}
                  >
                    Unequip
                  </Button>
                </HStack>
              ) : (
                <Text fontSize="xs" color="whiteAlpha.600">
                  No banner equipped. Equip one below to show on your profile.
                </Text>
              )}
            </Box>

            {/* Inventory grid - same card style as Banner Store */}
            <Box
              flex="1"
              minH={0}
              overflow="auto"
              px={{ base: 2, md: 3 }}
              py={{ base: 1.5, md: 2 }}
              css={{
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.2)', borderRadius: '20px' },
              }}
            >
              {inventory.length === 0 ? (
                <Center flex="1" minH="200px">
                  <VStack spacing={4}>
                    <Text color="whiteAlpha.600" fontSize="sm">
                      Your inventory is empty
                    </Text>
                    <Button
                      leftIcon={<ShoppingCart size={16} />}
                      size="sm"
                      colorScheme="blue"
                      color="white"
                      _hover={{ bg: 'blue.600' }}
                      onClick={() => navigate('/user/banner-store')}
                    >
                      Browse Store
                    </Button>
                  </VStack>
                </Center>
              ) : (
                <SimpleGrid
                  columns={{ base: 2, sm: 2, md: 3, lg: 4 }}
                  spacing={{ base: 1, md: 2 }}
                  alignContent="start"
                >
                  {inventory.map((banner) => {
                    const isEquipped = banner._id === equippedBannerId;
                    const EffectIcon = EFFECT_ICONS[banner.effect];

                    return (
                      <Box
                        key={banner._id}
                        position="relative"
                        overflow="hidden"
                        borderRadius={{ base: '10px', md: '14px' }}
                        border="1px solid"
                        borderColor={isEquipped ? 'green.400' : 'whiteAlpha.200'}
                        bg="whiteAlpha.50"
                        _hover={{
                          borderColor: isEquipped ? 'green.400' : 'whiteAlpha.400',
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
                          {isEquipped && (
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
                              Equipped
                            </Box>
                          )}
                        </Box>

                        <VStack spacing={{ base: 0.5, md: 1 }} align="stretch" p={{ base: 1.5, md: 2 }} bg="transparent">
                          <Text fontWeight="600" fontSize={{ base: 'xs', md: 'sm' }} color="white" noOfLines={1}>
                            {banner.name}
                          </Text>
                          <Button
                            size="xs"
                            leftIcon={<Check size={12} />}
                            onClick={() => (isEquipped ? handleUnequip() : handleEquip(banner._id))}
                            isLoading={isEquipping || isUnequipping}
                            colorScheme={isEquipped ? 'green' : 'blue'}
                            color="white"
                            height={{ base: '24px', md: '28px' }}
                            fontSize="xs"
                            _hover={isEquipped ? { bg: 'green.600' } : { bg: 'blue.600' }}
                          >
                            {isEquipped ? 'Equipped' : 'Equip'}
                          </Button>
                        </VStack>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              )}

              {/* Payment history - same glass style */}
              {payments.length > 0 && (
                <Box mt={4} border="1px solid" borderColor="whiteAlpha.200" borderRadius={{ base: '10px', md: '14px' }} overflow="hidden" bg="whiteAlpha.50">
                  <Button
                    size="sm"
                    w="full"
                    variant="ghost"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.100' }}
                    onClick={onPaymentsToggle}
                    rightIcon={isPaymentsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    justifyContent="space-between"
                    px={3}
                    py={2}
                  >
                    <Text fontSize="xs">{isPaymentsOpen ? 'Hide' : 'Show'} payment history</Text>
                  </Button>
                  <Collapse in={isPaymentsOpen}>
                    <Box overflowX="auto" px={2} pb={2}>
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th color="whiteAlpha.700" fontSize="xs">Banner</Th>
                            <Th color="whiteAlpha.700" fontSize="xs">Amount</Th>
                            <Th color="whiteAlpha.700" fontSize="xs">Date</Th>
                            <Th color="whiteAlpha.700" fontSize="xs">Payment ID</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {payments.map((p) => (
                            <Tr key={p._id}>
                              <Td color="white" fontSize="xs">{p.banner?.name || '—'}</Td>
                              <Td color="blue.300" fontSize="xs">₹{p.amount}</Td>
                              <Td color="whiteAlpha.700" fontSize="xs">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '—'}</Td>
                              <Td color="whiteAlpha.500" fontSize="xs">{p.razorpayPaymentId?.slice(0, 12)}…</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </Collapse>
                </Box>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
  );
};

export default BannerInventory;
