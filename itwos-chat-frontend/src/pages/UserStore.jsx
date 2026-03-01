import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  useToast,
  SimpleGrid,
  Spinner,
  Center,
  useColorModeValue,
} from '@chakra-ui/react';
import { Check, ShoppingCart, Crown, Sparkles, Star, Shield, User } from 'lucide-react';
import { useState } from 'react';
import {
  useGetPlansQuery,
  useGetMySubscriptionQuery,
  useCreateOrderMutation,
  useVerifyPaymentMutation,
} from '../store/api/userApi';
import VerifiedBadge from '../components/VerifiedBadge/VerifiedBadge';

const PLAN_COLORS = {
  blue: '#3b82f6',
  yellow: '#eab308',
  gold: '#eab308',
  pink: '#e11d48',
  vip: '#e11d48',
};

const getPlanColor = (planId) => PLAN_COLORS[planId] || PLAN_COLORS.blue;

const UserStore = () => {
  const bg = useColorModeValue('#fafafa', '#09090b');
  const fg = useColorModeValue('#18181b', '#e3e3e3');
  const surface1 = useColorModeValue('#ffffff', '#101012');
  const surface2 = useColorModeValue('#e4e4e7', '#27272a');
  const muted = useColorModeValue('#71717a', '#a1a1aa');
  const successGreen = useColorModeValue('#22c55e', '#22c55e');

  const toast = useToast();
  const { data: plansData, isLoading: plansLoading } = useGetPlansQuery();
  const { data: subscriptionData, isLoading: subscriptionLoading, refetch: refetchSubscription } = useGetMySubscriptionQuery();
  const [createOrder] = useCreateOrderMutation();
  const [verifyPayment] = useVerifyPaymentMutation();
  const [processing, setProcessing] = useState(false);

  const plans = plansData?.data || [];
  const subscription = subscriptionData?.data;

  const handlePurchase = async (badgeType, duration) => {
    try {
      setProcessing(true);
      const orderResult = await createOrder({ badgeType, duration }).unwrap();
      const { orderId, amount, key } = orderResult.data;

      const razorpayKey = key || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey || typeof window.Razorpay === 'undefined') {
        toast({
          title: 'Payment not available',
          description: !razorpayKey
            ? 'Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID in .env or ensure the server returns a key.'
            : 'Razorpay script failed to load.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setProcessing(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: amount * 100,
        currency: 'INR',
        name: 'Chat App',
        description: `${badgeType} Verified Badge - ${duration} months`,
        order_id: orderId,
        handler: async (response) => {
          try {
            await verifyPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              badgeType,
              duration,
            }).unwrap();
            toast({ title: 'Success!', description: 'Subscription purchased successfully! Your verified badge is now active.', status: 'success', duration: 5000, isClosable: true });
            refetchSubscription();
          } catch (error) {
            toast({ title: 'Payment Verification Failed', description: error?.data?.message || 'Failed to verify payment. Please contact support.', status: 'error', duration: 5000, isClosable: true });
          } finally {
            setProcessing(false);
          }
        },
        prefill: { name: 'User', email: 'user@example.com' },
        theme: { color: '#3B82F6' },
        modal: { ondismiss: () => setProcessing(false) },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setProcessing(false);
      toast({ title: 'Error', description: error?.data?.message || 'Failed to create order. Please try again.', status: 'error', duration: 5000, isClosable: true });
    }
  };

  const getBadgeIcon = (type, color) => {
    const c = color || getPlanColor(type);
    switch (String(type).toLowerCase()) {
      case 'blue':
        return <Check size={32} strokeWidth={3} color={c} style={{ minWidth: 64, minHeight: 64 }} />;
      case 'yellow':
      case 'gold':
        return (
          <Box display="inline-flex" alignItems="center" justifyContent="center" borderRadius="full" bg="#FCD34D" p={2} w="64px" h="64px">
            <Check size={32} strokeWidth={3} color="#3b82f6" />
          </Box>
        );
      case 'pink':
      case 'vip':
        return <Sparkles size={48} strokeWidth={2.5} color={c} style={{ minWidth: 64, minHeight: 64 }} />;
      default:
        return <Check size={32} strokeWidth={3} color={c} style={{ minWidth: 64, minHeight: 64 }} />;
    }
  };

  if (plansLoading || subscriptionLoading) {
    return (
      <Box minH="100vh" bg={bg} py={8} px={4}>
        <Center minH="400px">
          <Spinner size="lg" color="blue.500" />
        </Center>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={bg} py={8} px={4} color={fg}>
        <Box maxW="1200px" margin="0 auto">
          <Heading as="h1" fontSize={{ base: '2xl', md: '3rem' }} fontWeight={700} letterSpacing="-1px" mb={2}>
            Verified Badge Store
          </Heading>
          <Text className="subtitle" fontSize="1rem" color={muted} mb={8}>
            Purchase a verified badge to stand out and show your authenticity
          </Text>

          {/* Current subscription */}
          {subscription && (
            <Box mb={8} bg={surface1} border="1px solid" borderColor={surface2} borderRadius="12px" p={4}>
              <Text fontSize="xs" fontWeight={600} color={muted} textTransform="uppercase" letterSpacing="1px" mb={3}>
                Current Subscription
              </Text>
              <HStack spacing={3}>
                <VerifiedBadge badgeType={subscription.badgeType} size={24} />
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontWeight={600} fontSize="sm">
                    {String(subscription.badgeType).charAt(0).toUpperCase() + String(subscription.badgeType).slice(1)} Badge
                  </Text>
                  <Text fontSize="xs" color={muted}>
                    Expires {new Date(subscription.expiryDate).toLocaleDateString()}
                  </Text>
                </VStack>
                <Badge bg={subscription.status === 'active' ? successGreen : muted} color="white" borderRadius="6px" px={2} py={1} fontSize="xs" fontWeight={600}>
                  {subscription.status}
                </Badge>
              </HStack>
            </Box>
          )}

          {/* Cards grid */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4} mb={8}>
            {plans.map((plan) => {
              const activeColor = getPlanColor(plan.id);
              const isActive = subscription?.status === 'active' && subscription?.badgeType === plan.id;
              return (
                <Box
                  key={plan.id}
                  position="relative"
                  overflow="hidden"
                  aspectRatio="4/5"
                  border="1px solid"
                  borderColor={surface2}
                  borderRadius="8px"
                  isolation="isolate"
                  transition="border-color 0.2s ease"
                  _hover={{ borderColor: activeColor }}
                  sx={{
                    '& .card-overlay': {
                      position: 'absolute',
                      inset: 0,
                      background: `radial-gradient(circle at bottom left, transparent 55%, ${surface1})`,
                      pointerEvents: 'none',
                      zIndex: 1,
                    },
                    '&:hover .card-icon-wrap': { color: activeColor, transform: 'scale(1.1)' },
                  }}
                >
                  {/* Gradient background */}
                  <Box
                    position="absolute"
                    inset={0}
                    bg={`radial-gradient(circle at bottom left, transparent 40%, ${surface1}), linear-gradient(180deg, ${surface2}22 0%, ${surface1} 70%)`}
                    zIndex={0}
                  />
                  <Box className="card-overlay" />

                  <Box position="relative" zIndex={2} w="100%" h="100%" display="flex" flexDir="column" alignItems="center" justifyContent="center" p={6} textAlign="center">
                    <Box className="card-icon-wrap" color={muted} transition="color 0.3s ease, transform 0.3s ease" mb={3}>
                      {getBadgeIcon(plan.id, activeColor)}
                    </Box>
                    <Heading as="h3" size="md" fontWeight={700} color={fg} mb={1}>
                      {plan.name}
                    </Heading>
                    <Text fontSize="sm" color={muted} maxW="200px" mb={4}>
                      {plan.description}
                    </Text>

                    <VStack spacing={2} w="100%" mt="auto">
                      {plan.durations?.map((d) => (
                        <Box key={d.months} w="100%">
                          <Box
                            w="100%"
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            bg="rgba(16, 16, 18, 0.8)"
                            backdropFilter="blur(10px)"
                            py={3}
                            px={4}
                            borderRadius="8px"
                            border="1px solid"
                            borderColor={surface2}
                            mb={2}
                          >
                            <Text fontSize="sm" fontWeight={600} color={fg}>
                              {d.months} Month{d.months > 1 ? 's' : ''}
                            </Text>
                            <Text fontSize="lg" fontWeight={700} color={activeColor}>
                              ₹{d.price}
                            </Text>
                          </Box>
                          <Button
                            w="100%"
                            py={2.5}
                            border="none"
                            borderRadius="8px"
                            fontSize="sm"
                            fontWeight={600}
                            color="white"
                            bg={isActive ? successGreen : activeColor}
                            leftIcon={<ShoppingCart size={14} />}
                            onClick={() => !isActive && handlePurchase(plan.id, d.months)}
                            isLoading={processing}
                            isDisabled={isActive}
                            _hover={!isActive ? { transform: 'translateY(-2px)', boxShadow: 'lg' } : {}}
                            _active={!isActive ? { transform: 'translateY(0)' } : {}}
                            transition="all 0.2s"
                          >
                            {isActive ? 'Already Active' : 'Buy Now'}
                          </Button>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                </Box>
              );
            })}
          </SimpleGrid>

          {/* Benefits */}
          <Box bg={surface1} border="1px solid" borderColor={surface2} borderRadius="12px" p={6}>
            <Text fontSize="xs" fontWeight={600} color={muted} textTransform="uppercase" letterSpacing="1px" mb={4}>
              What You Get
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <HStack align="start" spacing={3}>
                <Box p={2} borderRadius="8px" bg="rgba(59, 130, 246, 0.15)">
                  <User size={20} stroke="#3b82f6" strokeWidth={2} />
                </Box>
                <Box>
                  <Text as="h3" fontSize="sm" fontWeight={600} color={fg} mb={1}>Stand Out</Text>
                  <Text fontSize="xs" color={muted}>Verified badge next to your name</Text>
                </Box>
              </HStack>
              <HStack align="start" spacing={3}>
                <Box p={2} borderRadius="8px" bg="rgba(34, 197, 94, 0.15)">
                  <Shield size={20} stroke="#22c55e" strokeWidth={2} />
                </Box>
                <Box>
                  <Text as="h3" fontSize="sm" fontWeight={600} color={fg} mb={1}>Build Trust</Text>
                  <Text fontSize="xs" color={muted}>Show authenticity and credibility</Text>
                </Box>
              </HStack>
              <HStack align="start" spacing={3}>
                <Box p={2} borderRadius="8px" bg="rgba(59, 130, 246, 0.15)">
                  <Star size={20} stroke="#3b82f6" strokeWidth={2} />
                </Box>
                <Box>
                  <Text as="h3" fontSize="sm" fontWeight={600} color={fg} mb={1}>Everywhere</Text>
                  <Text fontSize="xs" color={muted}>Badge on profile, posts, and messages</Text>
                </Box>
              </HStack>
              <HStack align="start" spacing={3}>
                <Box p={2} borderRadius="8px" bg="rgba(34, 197, 94, 0.15)">
                  <Crown size={20} stroke="#22c55e" strokeWidth={2} />
                </Box>
                <Box>
                  <Text as="h3" fontSize="sm" fontWeight={600} color={fg} mb={1}>Never Forget</Text>
                  <Text fontSize="xs" color={muted}>Automatic renewal reminder</Text>
                </Box>
              </HStack>
            </SimpleGrid>
          </Box>
        </Box>
      </Box>
  );
};

export default UserStore;
