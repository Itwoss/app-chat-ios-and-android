import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  DrawerFooter,
  VStack,
  HStack,
  Box,
  Text,
  Button,
  FormControl,
  FormLabel,
  Switch,
  Divider,
  SimpleGrid,
  Center,
  useColorModeValue,
} from '@chakra-ui/react'
import { Circle, Eye } from 'lucide-react'

/**
 * Chat Settings drawer (privacy) + Chat theme drawer (admin themes only).
 * Receives all state and handlers from parent.
 */
const ChatDrawers = ({
  isSettingsOpen,
  onSettingsClose,
  privacySettings,
  handlePrivacyChange,
  handleSaveSettings,
  isUpdatingSettings,
  isChatThemeOpen,
  onChatThemeClose,
  themes,
  chatSettingsData,
  chatIdForSettings,
  updateChatSettings,
  createChatThemeOrder,
  verifyChatThemePayment,
  isPurchasingTheme,
  textColor,
  cardBg,
  toast,
}) => {
  return (
    <>
      <Drawer
        isOpen={isSettingsOpen}
        placement="right"
        onClose={onSettingsClose}
        size={{ base: 'full', md: 'md' }}
      >
        <DrawerOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
        <DrawerContent
          bg="transparent"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.2)"
          pt={{ base: 'env(safe-area-inset-top, 0px)', md: 0 }}
          pb={{ base: 'env(safe-area-inset-bottom, 0px)', md: 0 }}
          sx={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <DrawerHeader
            py={{ base: 3, md: 4 }}
            px={{ base: 4, md: 6 }}
            borderBottom="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            bg="transparent"
          >
            <HStack justify="space-between" align="center">
              <Text size="md" color="white" fontWeight="600">
                Chat Settings
              </Text>
              <DrawerCloseButton color="white" size="md" top={{ base: 'calc(env(safe-area-inset-top, 0px) + 8px)', md: 2 }} />
            </HStack>
          </DrawerHeader>
          <DrawerBody
            px={{ base: 4, md: 6 }}
            py={{ base: 4, md: 6 }}
            overflowY="auto"
            sx={{
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                '&:hover': { background: 'rgba(255, 255, 255, 0.3)' },
              },
            }}
          >
            <VStack spacing={4} align="stretch">
              <Box
                bg="rgba(0, 0, 0, 0.2)"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.1)"
                borderRadius={{ base: '12px', md: '16px' }}
                p={4}
              >
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="white"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  mb={4}
                >
                  Privacy Settings
                </Text>
                <VStack spacing={4} align="stretch">
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <HStack spacing={3} flex={1}>
                      <Box p={2} bg="rgba(34, 197, 94, 0.2)" borderRadius="8px">
                        <Circle size={18} fill="rgba(34, 197, 94, 0.8)" />
                      </Box>
                      <VStack align="start" spacing={0} flex={1}>
                        <FormLabel mb={0} fontWeight="600" fontSize="md" color="white">
                          Show Active Status
                        </FormLabel>
                        <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)">
                          Let others see when you're online
                        </Text>
                      </VStack>
                    </HStack>
                    <Switch
                      isChecked={!privacySettings.hideOnlineStatus}
                      onChange={(e) =>
                        handlePrivacyChange('hideOnlineStatus', !e.target.checked)
                      }
                      colorScheme="green"
                      size="md"
                    />
                  </FormControl>
                  <Divider borderColor="rgba(255, 255, 255, 0.1)" />
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <HStack spacing={3} flex={1}>
                      <Box p={2} bg="rgba(59, 130, 246, 0.2)" borderRadius="8px">
                        <Eye size={18} color="rgba(59, 130, 246, 0.8)" />
                      </Box>
                      <VStack align="start" spacing={0} flex={1}>
                        <FormLabel mb={0} fontWeight="600" fontSize="md" color="white">
                          Show Last Seen
                        </FormLabel>
                        <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)">
                          Let others see when you were last active
                        </Text>
                      </VStack>
                    </HStack>
                    <Switch
                      isChecked={!privacySettings.hideLastSeen}
                      onChange={(e) =>
                        handlePrivacyChange('hideLastSeen', !e.target.checked)
                      }
                      colorScheme="blue"
                      size="md"
                    />
                  </FormControl>
                </VStack>
              </Box>
              <Box
                bg="rgba(0, 0, 0, 0.2)"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.1)"
                borderRadius={{ base: '12px', md: '16px' }}
                p={4}
              >
                <Text fontSize="sm" fontWeight="600" color="white" mb={3}>
                  Current Privacy Status
                </Text>
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">
                      Active Status
                    </Text>
                    <Text fontSize="sm" color="white" fontWeight="500">
                      {privacySettings.hideOnlineStatus ? 'Hidden' : 'Visible'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)">
                      Last Seen
                    </Text>
                    <Text fontSize="sm" color="white" fontWeight="500">
                      {privacySettings.hideLastSeen ? 'Hidden' : 'Visible'}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </DrawerBody>
          <DrawerFooter
            py={{ base: 3, md: 4 }}
            px={{ base: 4, md: 6 }}
            pb={{ base: 'max(12px, env(safe-area-inset-bottom, 0px))', md: 4 }}
            borderTop="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            bg="transparent"
          >
            <HStack spacing={3} w="100%">
              <Button
                variant="outline"
                onClick={onSettingsClose}
                flex={1}
                borderColor="rgba(255, 255, 255, 0.3)"
                color="white"
                _hover={{
                  bg: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                isLoading={isUpdatingSettings}
                flex={1}
                bg="rgba(59, 130, 246, 0.3)"
                border="1px solid"
                borderColor="rgba(59, 130, 246, 0.5)"
                color="white"
                _hover={{
                  bg: 'rgba(59, 130, 246, 0.4)',
                  borderColor: 'rgba(59, 130, 246, 0.6)',
                }}
              >
                Save Settings
              </Button>
            </HStack>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer
        isOpen={isChatThemeOpen}
        placement="right"
        onClose={onChatThemeClose}
        size={{ base: 'full', md: 'sm' }}
      >
        <DrawerOverlay />
        <DrawerContent
          pt={{ base: 'env(safe-area-inset-top, 0px)', md: 0 }}
          pb={{ base: 'env(safe-area-inset-bottom, 0px)', md: 0 }}
        >
          <DrawerCloseButton top={{ base: 'calc(env(safe-area-inset-top, 0px) + 8px)', md: 2 }} />
          <DrawerHeader>Chat theme</DrawerHeader>
          <DrawerBody overflowY="auto" pb={{ base: 'max(24px, env(safe-area-inset-bottom, 0px))', md: 6 }}>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="medium" fontSize="sm" color={textColor}>
                Themes
              </Text>
              <SimpleGrid columns={2} spacing={3}>
                {themes.map((theme) => {
                  const owned = theme.owned === true
                  const canUse = theme.isFree || owned
                  const currentThemeId = chatSettingsData?.data?.themeId
                  const isActive = currentThemeId === theme._id
                  return (
                    <Box
                      key={theme._id}
                      borderRadius="lg"
                      overflow="hidden"
                      borderWidth="2px"
                      borderColor={isActive ? 'brand.500' : 'transparent'}
                      bg={cardBg}
                    >
                      <Box position="relative" h="80px" bg="gray.700">
                        {theme.thumbnail || theme.wallpaper ? (
                          <Box
                            as="img"
                            src={theme.thumbnail || theme.wallpaper}
                            alt={theme.name}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                          />
                        ) : (
                          <Center h="100%" color="whiteAlpha.700">
                            {theme.name}
                          </Center>
                        )}
                        <Box
                          position="absolute"
                          top={1}
                          right={1}
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="600"
                          bg={theme.isFree ? 'green.500' : 'orange.500'}
                          color="white"
                        >
                          {theme.isFree ? 'Free' : `₹${theme.price}`}
                        </Box>
                        {owned && !theme.isFree && (
                          <Box
                            position="absolute"
                            top={1}
                            left={1}
                            px={2}
                            py={0.5}
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="600"
                            bg="blue.500"
                            color="white"
                          >
                            Owned
                          </Box>
                        )}
                      </Box>
                      {/* Theme preview: how chat will look on user side */}
                      <Box
                        p={1.5}
                        bg={
                          theme.wallpaper
                            ? 'gray.900'
                            : theme.backgroundColor || 'gray.800'
                        }
                        backgroundImage={theme.wallpaper ? `url(${theme.wallpaper})` : undefined}
                        backgroundSize="cover"
                        backgroundPosition="center"
                        borderRadius="md"
                        borderTopWidth="1px"
                        borderColor="whiteAlpha.100"
                      >
                        <Text fontSize="10px" color="whiteAlpha.600" mb={1}>
                          Preview
                        </Text>
                        <VStack spacing={1} align="stretch">
                          <Box
                            alignSelf="flex-end"
                            px={2}
                            py={0.5}
                            borderRadius="12px 12px 4px 12px"
                            bg={theme.outgoingBubbleColor || 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'}
                            color="white"
                            fontSize="10px"
                            maxW="85%"
                          >
                            Hi
                          </Box>
                          <Box
                            alignSelf="flex-start"
                            px={2}
                            py={0.5}
                            borderRadius="12px 12px 12px 4px"
                            bg={theme.incomingBubbleColor || 'rgba(255,255,255,0.15)'}
                            color="white"
                            fontSize="10px"
                            maxW="85%"
                          >
                            Hello
                          </Box>
                        </VStack>
                      </Box>
                      <Box p={2}>
                        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                          {theme.name}
                        </Text>
                        <HStack mt={1} spacing={1} flexWrap="wrap">
                          {canUse && (
                            <Button
                              size="xs"
                              colorScheme="brand"
                              onClick={() => {
                                if (!chatIdForSettings) return
                                updateChatSettings({
                                  chatId: chatIdForSettings,
                                  themeId: theme._id,
                                })
                                  .then(() => {
                                    onChatThemeClose()
                                    toast({
                                      title: 'Theme applied',
                                      status: 'success',
                                      duration: 2000,
                                    })
                                  })
                                  .catch((err) =>
                                    toast({
                                      title: err?.data?.message || 'Failed',
                                      status: 'error',
                                    })
                                  )
                              }}
                            >
                              {isActive ? 'In use' : 'Use'}
                            </Button>
                          )}
                          {!theme.isFree && !owned && (
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="orange"
                              isLoading={isPurchasingTheme}
                              onClick={async () => {
                                try {
                                  const result = await createChatThemeOrder({
                                    themeId: theme._id,
                                  }).unwrap()
                                  const {
                                    orderId,
                                    key,
                                    themeName,
                                  } = result?.data || {}
                                  const razorpayKey = key || import.meta.env.VITE_RAZORPAY_KEY_ID
                                  if (
                                    !orderId ||
                                    !razorpayKey ||
                                    typeof window.Razorpay === 'undefined'
                                  ) {
                                    toast({
                                      title: 'Payment not available',
                                      description: !razorpayKey
                                        ? 'Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID or ensure the server returns a key.'
                                        : 'Razorpay failed to load.',
                                      status: 'error',
                                    })
                                    return
                                  }
                                  const options = {
                                    key: razorpayKey,
                                    amount: (theme.price || 0) * 100,
                                    currency: 'INR',
                                    name: 'Chat App',
                                    description: `Chat theme: ${themeName || theme.name}`,
                                    order_id: orderId,
                                    handler: async (response) => {
                                      try {
                                        await verifyChatThemePayment({
                                          orderId:
                                            response.razorpay_order_id,
                                          paymentId:
                                            response.razorpay_payment_id,
                                          signature:
                                            response.razorpay_signature,
                                          themeId: theme._id,
                                        }).unwrap()
                                        toast({
                                          title:
                                            'Purchased! You can use this theme now.',
                                          status: 'success',
                                          duration: 3000,
                                        })
                                      } catch (err) {
                                        toast({
                                          title:
                                            err?.data?.message ||
                                            'Payment verification failed',
                                          status: 'error',
                                        })
                                      }
                                    },
                                    theme: { color: '#3B82F6' },
                                    modal: { ondismiss: () => {} },
                                  }
                                  const razorpay = new window.Razorpay(options)
                                  razorpay.open()
                                } catch (err) {
                                  toast({
                                    title:
                                      err?.data?.message || 'Failed to start payment',
                                    status: 'error',
                                  })
                                }
                              }}
                            >
                              Purchase ₹{theme.price}
                            </Button>
                          )}
                        </HStack>
                      </Box>
                    </Box>
                  )
                })}
              </SimpleGrid>
              {themes.length === 0 && (
                <Text fontSize="sm" color={textColor}>
                  No themes available yet.
                </Text>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}

export default ChatDrawers
