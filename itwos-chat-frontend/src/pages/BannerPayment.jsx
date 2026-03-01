import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Image,
  useToast,
  Center,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useCreateBannerOrderMutation, useVerifyBannerPaymentMutation, useClaimFreeBannerMutation } from '../store/api/userApi';
import { getRazorpayKeyId } from '../config/host';

/** Load Razorpay checkout script if not already loaded; resolves when window.Razorpay is available */
function loadRazorpayScript() {
  if (typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined') {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      // Razorpay may attach to window on next tick; wait for it
      const waitForRazorpay = (attempts = 0) => {
        if (typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined') {
          return resolve();
        }
        if (attempts >= 20) return reject(new Error('Razorpay not ready'));
        setTimeout(() => waitForRazorpay(attempts + 1), 50);
      };
      waitForRazorpay();
    };
    script.onerror = () => reject(new Error('Razorpay script failed to load'));
    document.body.appendChild(script);
  });
}

// Match Create Post modal: glass panel, same border/radius/backdrop
const contentPanel = {
  maxW: { base: 'calc(100% - 48px)', md: '480px' },
  mx: 'auto',
  borderRadius: { base: '20px', md: '24px' },
  overflow: 'hidden',
  bg: 'transparent',
  border: '1px solid',
  borderColor: 'rgba(255, 255, 255, 0.2)',
  sx: {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: 'none',
  },
};

const headerStyles = {
  py: { base: 2.5, md: 3 },
  px: { base: 3, md: 4 },
  fontSize: { base: '15px', md: '17px' },
  fontWeight: '600',
  color: 'white',
  borderBottom: '1px solid',
  borderColor: 'whiteAlpha.100',
  bg: 'transparent',
};

const bodyStyles = {
  px: { base: 3, md: 4 },
  py: { base: 2, md: 3 },
  bg: 'transparent',
  css: {
    '&::-webkit-scrollbar': { width: '4px' },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': {
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
    },
  },
};

const footerStyles = {
  px: { base: 3, md: 4 },
  py: { base: 2, md: 3 },
  borderTop: '1px solid',
  borderColor: 'whiteAlpha.100',
  bg: 'transparent',
};

const BANNER_STORAGE_KEY = 'bannerPayment_banner';

const BannerPayment = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const toast = useToast();
  const [createBannerOrder, { isLoading: isCreatingOrder }] = useCreateBannerOrderMutation();
  const [verifyBannerPayment, { isLoading: isVerifying }] = useVerifyBannerPaymentMutation();
  const [claimFreeBanner, { isLoading: isClaimingFree }] = useClaimFreeBannerMutation();

  const [bannerFromStorage, setBannerFromStorage] = useState(null);
  useEffect(() => {
    if (state?.banner || bannerFromStorage) return;
    try {
      const raw = sessionStorage.getItem(BANNER_STORAGE_KEY);
      if (!raw) return;
      setBannerFromStorage(JSON.parse(raw));
      sessionStorage.removeItem(BANNER_STORAGE_KEY);
    } catch {
      sessionStorage.removeItem(BANNER_STORAGE_KEY);
    }
  }, [state?.banner, bannerFromStorage]);
  const banner = state?.banner || bannerFromStorage;
  const isFree = banner && Number(banner.price) === 0;
  const isPurchasing = isCreatingOrder || isVerifying || isClaimingFree;

  const handlePay = async () => {
    if (!banner?._id) return;
    if (isFree) return; // use handleClaimFree instead
    try {
      await loadRazorpayScript();
    } catch {
      toast({
        title: 'Payment unavailable',
        description: 'Razorpay failed to load. Please check your connection and try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const result = await createBannerOrder({ bannerId: banner._id }).unwrap();
      const data = result?.data || result;
      const orderId = data.orderId;
      const amount = Number(data.amount);
      const key = data.key || getRazorpayKeyId();

      if (!orderId || !amount || amount <= 0 || !key) {
        toast({
          title: 'Payment setup failed',
          description: 'Invalid order response. Please try again or contact support.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const options = {
        key,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Chat App',
        description: `Banner: ${banner.name}`,
        order_id: orderId,
        handler: async (response) => {
          if (!response?.razorpay_payment_id || !response?.razorpay_order_id || !response?.razorpay_signature) {
            toast({
              title: 'Invalid payment response',
              description: 'Payment could not be verified. Please contact support if amount was deducted.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
            return;
          }
          try {
            const result = await verifyBannerPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              bannerId: banner._id,
            }).unwrap();
            if (result?.message === 'Banner purchased successfully') {
              toast({
                title: 'Success!',
                description: 'Banner purchased successfully! Check your inventory.',
                status: 'success',
                duration: 4000,
                isClosable: true,
              });
              navigate('/user/banner-store', { replace: true });
            } else if (result?.message === 'Payment already processed') {
              toast({
                title: 'Already processed',
                description: 'This payment was already completed.',
                status: 'info',
                duration: 3000,
                isClosable: true,
              });
              navigate('/user/banner-store', { replace: true });
            } else {
              navigate('/user/banner-store', { replace: true });
            }
          } catch (error) {
            toast({
              title: 'Payment verification failed',
              description: error?.data?.message || 'Failed to verify payment. Please contact support if amount was deducted.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        },
        prefill: { name: 'User', email: 'user@example.com' },
        theme: { color: '#3B82F6' },
        modal: { ondismiss: () => {} },
      };

      // Open checkout in next tick so it runs in a user-gesture-friendly context and Razorpay is fully ready
      setTimeout(() => {
        try {
          const razorpay = new window.Razorpay(options);
          razorpay.on('payment.failed', () => {});
          razorpay.open();
        } catch (err) {
          toast({
            title: 'Payment window could not open',
            description: err?.message || 'Please allow popups or try again.',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }, 0);
    } catch (error) {
      const msg = error?.data?.message || '';
      const isPaymentRequired = msg.includes('Pay button') || msg.includes('requires payment') || error?.data?.code === 'BANNER_PAYMENT_REQUIRED';
      toast({
        title: isPaymentRequired ? 'Use the Pay button' : 'Payment failed',
        description: isPaymentRequired
          ? 'Do not use direct purchase. Go to Banner Store, click Pay on the banner, then complete payment on this page.'
          : msg || 'Failed to start payment. Please try again.',
        status: 'error',
        duration: 6000,
        isClosable: true,
      });
      if (isPaymentRequired) {
        navigate('/user/banner-store', { replace: true });
      }
    }
  };

  const handleClaimFree = () => {
    if (!banner?._id || !isFree) return;
    claimFreeBanner({ bannerId: banner._id })
      .unwrap()
      .then(() => {
        toast({
          title: 'Success!',
          description: 'Banner added to your inventory.',
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
        navigate('/user/banner-store', { replace: true });
      })
      .catch((err) => {
        toast({
          title: 'Error',
          description: err?.data?.message || err?.message || 'Failed to claim banner.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      });
  };

  if (!banner) {
    return (
      <Box minH="100vh" bg="black" py={{ base: 6, md: 8 }} px={{ base: 3, md: 4 }}>
          <Box {...contentPanel}>
            <Box {...headerStyles}>
              <Text>Payment</Text>
            </Box>
            <Box {...bodyStyles}>
              <Center minH="200px">
                <VStack spacing={4}>
                  <Text color="whiteAlpha.700" fontSize={{ base: '14px', md: '15px' }}>
                    No banner selected.
                  </Text>
                  <Button
                    leftIcon={<ArrowLeft size={18} />}
                    variant="ghost"
                    color="white"
                    fontSize={{ base: '12px', md: '14px' }}
                    _hover={{ bg: 'whiteAlpha.200' }}
                    onClick={() => navigate('/user/banner-store')}
                  >
                    Back to Banner Store
                  </Button>
                </VStack>
              </Center>
            </Box>
          </Box>
        </Box>
    );
  }

  return (
    <Box minH="100vh" bg="black" py={{ base: 6, md: 8 }} px={{ base: 3, md: 4 }}>
        <Box {...contentPanel}>
          {/* Header – same as Create Post */}
          <HStack {...headerStyles} justify="space-between" spacing={2}>
            <Button
              size="sm"
              variant="ghost"
              color="white"
              leftIcon={<ArrowLeft size={16} />}
              fontSize={{ base: '13px', md: '15px' }}
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Text flex={1} textAlign="center" fontWeight="600">
              Payment
            </Text>
            <Box w="60px" /> {/* balance back button */}
          </HStack>

          {/* Body – same input/card style as Create Post */}
          <Box {...bodyStyles}>
            <VStack spacing={{ base: 1.5, md: 3 }} align="stretch">
              <Text fontSize="xs" color="whiteAlpha.700">
                Item
              </Text>
              <Box
                borderRadius={{ base: '8px', md: '12px' }}
                overflow="hidden"
                border="1px solid"
                borderColor="whiteAlpha.100"
                bg="whiteAlpha.50"
              >
                <Box h="160px" bg="whiteAlpha.100" position="relative">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.name}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                </Box>
                <VStack align="stretch" p={4} spacing={2}>
                  <Text fontWeight="600" color="white" fontSize={{ base: '14px', md: '15px' }}>
                    {banner.name}
                  </Text>
                  {banner.description && (
                    <Text fontSize="sm" color="whiteAlpha.700" noOfLines={2}>
                      {banner.description}
                    </Text>
                  )}
                  <HStack justify="space-between" pt={2}>
                    <Text color="whiteAlpha.600" fontSize="sm">
                      Amount
                    </Text>
                    <Text fontWeight="bold" fontSize="xl" color={isFree ? 'green.400' : 'blue.400'}>
                      {isFree ? 'Free' : `₹${banner.price}`}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </Box>

          {/* Footer – same as Create Post (Cancel + Pay or Claim) */}
          <HStack {...footerStyles} spacing={{ base: 1, md: 2 }} w="full">
            <Button
              flex={1}
              size={{ base: 'xs', md: 'sm' }}
              variant="ghost"
              color="white"
              fontSize={{ base: '12px', md: '14px' }}
              py={{ base: 2.5, md: 2 }}
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            {isFree ? (
              <Button
                flex={1}
                size={{ base: 'xs', md: 'sm' }}
                bg="green.500"
                color="white"
                fontWeight="600"
                fontSize={{ base: '12px', md: '14px' }}
                py={{ base: 2.5, md: 2 }}
                _hover={{ bg: 'green.600' }}
                _active={{ transform: 'scale(0.98)' }}
                onClick={handleClaimFree}
                isLoading={isClaimingFree}
                loadingText="Adding..."
              >
                Claim free
              </Button>
            ) : (
              <Button
                flex={1}
                size={{ base: 'xs', md: 'sm' }}
                bg="blue.500"
                color="white"
                fontWeight="600"
                fontSize={{ base: '12px', md: '14px' }}
                py={{ base: 2.5, md: 2 }}
                _hover={{ bg: 'blue.600' }}
                _active={{ transform: 'scale(0.98)' }}
                onClick={handlePay}
                isLoading={isPurchasing}
                loadingText="Processing..."
              >
                Pay ₹{banner.price}
              </Button>
            )}
          </HStack>
        </Box>
      </Box>
  );
};

export default BannerPayment;
