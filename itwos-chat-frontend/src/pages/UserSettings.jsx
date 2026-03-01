import {
  VStack,
  Heading,
  Text,
  Box,
  FormControl,
  FormLabel,
  Switch,
  Button,
  useToast,
  Divider,
  HStack,
  SimpleGrid,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  IconButton,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { Save, Shield, Eye, EyeOff, X, AlertCircle, Moon, Sun, Bell, ArrowLeft, LogOut, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useGetCurrentUserQuery, useUpdateUserProfileMutation, useGetMySubscriptionQuery, useCancelSubscriptionMutation, useSendTestPushMutation, useGetVapidPublicKeyQuery, useSavePushSubscriptionMutation, useLogoutUserMutation } from '../store/api/userApi'
import { clearUser } from '../store/slices/userSlice'
import { ensurePushSubscription, resubscribePushSubscription } from '../utils/pushUtils'
import { getUserInfo, setAuthData, clearAuthData } from '../utils/auth'
import { STORAGE_KEYS } from '../utils/storageKeys'
import VerifiedBadge from '../components/VerifiedBadge/VerifiedBadge'
import NavbarSettings from '../components/Navigation/NavbarSettings'

const UserSettings = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { colorMode, toggleColorMode } = useColorMode()
  const isDark = colorMode === 'dark'
  
  // Apple App Store Colors
  const bgColor = useColorModeValue('#F2F2F7', '#000000')
  const cardBg = useColorModeValue('#FFFFFF', '#1C1C1E')
  const textPrimary = useColorModeValue('#000000', '#FFFFFF')
  const textSecondary = useColorModeValue('#6C6C70', '#98989D')
  const borderColor = useColorModeValue('#E5E5EA', '#2C2C2E')
  const accentBlue = useColorModeValue('#007AFF', '#0A84FF')
  const accentRed = '#FF3B30'
  const successGreen = useColorModeValue('#34C759', '#30D158')
  
  const toast = useToast()
  
  const { data: userData, refetch } = useGetCurrentUserQuery()
  const [updateProfile, { isLoading }] = useUpdateUserProfileMutation()
  const [logoutUser] = useLogoutUserMutation()
  const { data: subscriptionData, refetch: refetchSubscription } = useGetMySubscriptionQuery()
  const [cancelSubscription, { isLoading: isCancelling }] = useCancelSubscriptionMutation()
  const [sendTestPush, { isLoading: isSendingTestPush }] = useSendTestPushMutation()
  const { data: vapidData } = useGetVapidPublicKeyQuery(undefined, { skip: false })
  const [savePushSubscription] = useSavePushSubscriptionMutation()
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure()
  const cancelRef = useRef()
  
  const [privacySettings, setPrivacySettings] = useState({
    hideLastSeen: false,
    hideOnlineStatus: false,
  })
  const [navbarSettings, setNavbarSettings] = useState({
    navbarType: 'normal',
    advancedNavbar: {
      position: 'bottom-left',
      items: [],
    },
  })
  const [isInitialized, setIsInitialized] = useState(false)
  const subscription = subscriptionData?.data

  // Ambient glow (YouTube-style behind post media) — localStorage, synced with home via event
  const [ambientGlowEnabled, setAmbientGlowEnabled] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEYS.AMBIENT_GLOW) !== 'false' } catch { return true }
  })
  const toggleAmbientGlow = useCallback(() => {
    setAmbientGlowEnabled((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEYS.AMBIENT_GLOW, next ? 'true' : 'false')
        window.dispatchEvent(new CustomEvent('ambientGlowChanged', { detail: { enabled: next } }))
      } catch (_) {}
      return next
    })
  }, [])

  useEffect(() => {
    const userResponse = userData?.data || (userData?.success ? userData.data : null)
    
    if (userResponse && !isInitialized) {
      setPrivacySettings({
        hideLastSeen: userResponse.privacySettings?.hideLastSeen || false,
        hideOnlineStatus: userResponse.privacySettings?.hideOnlineStatus || false,
      })
      setNavbarSettings({
        navbarType: userResponse.navbarSettings?.navbarType || 'normal',
        advancedNavbar: userResponse.navbarSettings?.advancedNavbar || {
          position: 'bottom-left',
          items: [
            { id: 'home', label: 'Home', icon: 'home', route: '/user/home', visible: true, order: 1 },
            { id: 'feed', label: 'Feed', icon: 'feed', route: '/user/feed', visible: true, order: 2 },
            { id: 'chat', label: 'Chat', icon: 'chat', route: '/user/chat', visible: true, order: 3 },
            { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/user/dashboard', visible: true, order: 4 },
            { id: 'profile', label: 'Profile', icon: 'profile', route: '/user/profile', visible: true, order: 5 },
          ],
        },
        ...(userResponse.navbarSettings?.slideNavigation && { slideNavigation: userResponse.navbarSettings.slideNavigation }),
      })
      setIsInitialized(true)
    } else if (!userResponse && !isInitialized) {
      const userInfo = getUserInfo()
      if (userInfo?.privacySettings) {
        setPrivacySettings({
          hideLastSeen: userInfo.privacySettings.hideLastSeen || false,
          hideOnlineStatus: userInfo.privacySettings.hideOnlineStatus || false,
        })
      }
      if (userInfo?.navbarSettings) {
        setNavbarSettings(userInfo.navbarSettings)
      }
      setIsInitialized(true)
    }
  }, [userData, isInitialized])

  const handlePrivacyChange = (setting, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value,
    }))
  }

  const handleSave = async () => {
    try {
      const result = await updateProfile({
        privacySettings,
        navbarSettings,
      }).unwrap()
      
      if (result.data) {
        setAuthData(result.data, 'user')
        window.dispatchEvent(new CustomEvent('userInfoUpdated'))
        refetch()
        
        toast({
          title: 'Settings updated',
          description: 'Your settings have been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to update settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleNavbarChange = useCallback((newNavbarSettings) => {
    setNavbarSettings(newNavbarSettings)
  }, [])

  const handleNavbarSave = async (newNavbarSettings) => {
    try {
      // Update local state immediately for instant UI feedback
      setNavbarSettings(newNavbarSettings)
      
      const result = await updateProfile({
        navbarSettings: newNavbarSettings,
      }).unwrap()
      
      if (result.data) {
        // Ensure navbarSettings is included in the response data
        const updatedNavbarSettings = result.data.navbarSettings || newNavbarSettings
        
        // Update local state with the response data
        setNavbarSettings(updatedNavbarSettings)
        
        // Always save to localStorage with the complete user data
        // Ensure navbarSettings is always included
        const userDataToSave = {
          ...result.data,
          navbarSettings: result.data.navbarSettings || updatedNavbarSettings
        }
        
        setAuthData(userDataToSave, 'user')
        
        // Dispatch event to notify UserLayout to update immediately
        window.dispatchEvent(new CustomEvent('userInfoUpdated'))
        
        // Refetch to ensure data is synced
        refetch()
        
        toast({
          title: 'Navigation settings updated',
          description: 'Your navigation settings have been saved',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to update navigation settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription().unwrap()
      refetchSubscription()
      onCancelClose()
      
      toast({
        title: 'Subscription Cancelled',
        description: 'Your verified badge has been removed. Payment is non-refundable.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to cancel subscription',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser().unwrap()
      dispatch(clearUser())
      clearAuthData()
      navigate('/login', { replace: true })
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to logout',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const displayData = (userData?.data || (userData?.success ? userData.data : null)) || getUserInfo() || {}

  return (
    <Box
        minH="100vh"
        bg={bgColor}
        pt={{ base: 'max(24px, env(safe-area-inset-top, 0px))', md: 6 }}
        pb={6}
        px={{ base: 4, md: 6 }}
        transition="all 0.3s ease"
      >
        <VStack spacing={6} align="stretch" maxW="900px" mx="auto">
          {/* Header - back on left, title only; theme is in Appearance section below */}
          <HStack justify="space-between" align="center" mb={2} spacing={3}>
            <IconButton
              aria-label="Go back"
              icon={<ArrowLeft size={22} />}
              onClick={() => navigate(-1)}
              bg={cardBg}
              color={textPrimary}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="full"
              size="lg"
              flexShrink={0}
              _hover={{
                bg: isDark ? '#2C2C2E' : '#F2F2F7',
                transform: 'scale(1.05)',
              }}
              transition="all 0.2s"
            />
            <Heading
              size="2xl"
              color={textPrimary}
              fontWeight="700"
              letterSpacing="-0.5px"
              truncate
              flex="1"
              minW={0}
            >
              Settings
            </Heading>
          </HStack>

          {/* Appearance Section */}
          <Box
            bg={cardBg}
            borderRadius="16px"
            overflow="hidden"
            border="1px solid"
            borderColor={borderColor}
            shadow="sm"
          >
            <VStack spacing={0} align="stretch" divider={<Divider borderColor={borderColor} />}>
              {/* Section Header */}
              <Box px={5} py={4}>
                <Text 
                  fontSize="13px" 
                  fontWeight="600" 
                  color={textSecondary}
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Appearance
                </Text>
              </Box>
              
              {/* Theme Toggle Row */}
              <FormControl display="flex" alignItems="center" px={5} py={4}>
                <HStack flex="1" spacing={3}>
                  <Box 
                    p={2} 
                    bg={isDark ? accentBlue + '20' : accentBlue + '15'}
                    borderRadius="8px"
                  >
                    {isDark ? <Moon size={20} color={accentBlue} /> : <Sun size={20} color={accentBlue} />}
                  </Box>
                  <VStack align="start" spacing={0}>
                    <FormLabel mb={0} fontWeight="600" fontSize="17px" color={textPrimary}>
                      {isDark ? 'Dark Mode' : 'Light Mode'}
                    </FormLabel>
                    <Text fontSize="13px" color={textSecondary}>
                      Toggle for animated theme switch
                    </Text>
                  </VStack>
                </HStack>
                <IconButton
                  aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  icon={isDark ? <Sun size={20} /> : <Moon size={20} />}
                  onClick={toggleColorMode}
                  bg={cardBg}
                  color={textPrimary}
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="full"
                  _hover={{
                    bg: isDark ? '#2C2C2E' : '#F2F2F7',
                  }}
                />
              </FormControl>

              {/* Ambient glow (post media) */}
              <FormControl display="flex" alignItems="center" px={5} py={4}>
                <HStack flex="1" spacing={3}>
                  <Box 
                    p={2} 
                    bg={isDark ? accentBlue + '20' : accentBlue + '15'}
                    borderRadius="8px"
                  >
                    <Sparkles size={20} color={accentBlue} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <FormLabel mb={0} fontWeight="600" fontSize="17px" color={textPrimary}>
                      Ambient glow
                    </FormLabel>
                    <Text fontSize="13px" color={textSecondary}>
                      Soft glow behind post images and videos on home
                    </Text>
                  </VStack>
                </HStack>
                <Switch
                  isChecked={ambientGlowEnabled}
                  onChange={toggleAmbientGlow}
                  colorScheme="blue"
                  size="lg"
                  sx={{
                    'span.chakra-switch__track': {
                      bg: isDark ? '#39393D' : '#E5E5EA',
                    },
                    'span.chakra-switch__track[data-checked]': {
                      bg: successGreen,
                    },
                  }}
                />
              </FormControl>
            </VStack>
          </Box>

          {/* Notifications (push) */}
          <Box
            bg={cardBg}
            borderRadius="16px"
            overflow="hidden"
            border="1px solid"
            borderColor={borderColor}
            shadow="sm"
          >
            <VStack spacing={0} align="stretch" divider={<Divider borderColor={borderColor} />}>
              <Box px={5} py={4}>
                <Text fontSize="13px" fontWeight="600" color={textSecondary} textTransform="uppercase" letterSpacing="0.5px">
                  Notifications
                </Text>
              </Box>
              <FormControl px={5} py={4}>
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="15px" color={textPrimary}>
                    Send a test notification to this device to verify push is working.
                  </Text>
                  <Text fontSize="13px" color={textSecondary}>
                    To get system notifications on your phone, open this app on your phone and enable notifications there too (tap Enable in the banner or allow in browser settings).
                  </Text>
                  <Button
                    leftIcon={<Bell size={18} />}
                    size="sm"
                    colorScheme="blue"
                    onClick={async () => {
                      if (!('Notification' in window)) {
                        toast({ title: 'Not supported', description: 'This browser does not support notifications.', status: 'warning', duration: 5000, isClosable: true })
                        return
                      }
                      if (Notification.permission !== 'granted') {
                        toast({ title: 'Enable notifications first', description: 'Allow notifications when the banner appears, or in your browser site settings.', status: 'warning', duration: 6000, isClosable: true })
                        return
                      }
                      try {
                        const publicKey = vapidData?.data?.publicKey
                        if (publicKey) {
                          await ensurePushSubscription(publicKey, savePushSubscription)
                        }
                        await sendTestPush().unwrap()
                        toast({ title: 'Test sent', description: 'Check for a notification on this device (or in system tray).', status: 'success', duration: 4000, isClosable: true })
                      } catch (e) {
                        const msg = e?.data?.message || e?.message || 'Something went wrong.'
                        const is503 = e?.status === 503 || (msg && msg.toLowerCase().includes('could not deliver'))
                        if (is503 && vapidData?.data?.publicKey) {
                          try {
                            const refreshed = await resubscribePushSubscription(vapidData.data.publicKey, savePushSubscription)
                            toast({
                              title: refreshed ? 'Subscription refreshed' : 'Delivery failed',
                              description: refreshed
                                ? 'Your notification subscription was refreshed (it may have expired). Try "Send test notification" again.'
                                : msg,
                              status: refreshed ? 'info' : 'warning',
                              duration: 7000,
                              isClosable: true,
                            })
                          } catch (_) {
                            toast({ title: 'Delivery failed', description: msg, status: 'warning', duration: 7000, isClosable: true })
                          }
                        } else {
                          toast({
                            title: is503 ? 'Delivery failed' : 'Test failed',
                            description: msg,
                            status: 'warning',
                            duration: 7000,
                            isClosable: true,
                          })
                        }
                      }
                    }}
                    isLoading={isSendingTestPush}
                  >
                    Send test notification
                  </Button>
                </VStack>
              </FormControl>
            </VStack>
          </Box>

          {/* Privacy Settings Section */}
          <Box
            bg={cardBg}
            borderRadius="16px"
            overflow="hidden"
            border="1px solid"
            borderColor={borderColor}
            shadow="sm"
          >
            <VStack spacing={0} align="stretch" divider={<Divider borderColor={borderColor} />}>
              {/* Section Header */}
              <Box px={5} py={4}>
                <Text 
                  fontSize="13px" 
                  fontWeight="600" 
                  color={textSecondary}
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Privacy
                </Text>
              </Box>
              
              {/* Hide Last Seen */}
              <FormControl display="flex" alignItems="center" px={5} py={4}>
                <HStack flex="1" spacing={3}>
                  <Box 
                    p={2} 
                    bg={isDark ? '#FF453A20' : '#FF3B3015'}
                    borderRadius="8px"
                  >
                    <EyeOff size={20} color={accentRed} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <FormLabel mb={0} fontWeight="600" fontSize="17px" color={textPrimary}>
                      Hide Last Seen
                    </FormLabel>
                    <Text fontSize="13px" color={textSecondary}>
                      Others won't see your activity
                    </Text>
                  </VStack>
                </HStack>
                <Switch
                  isChecked={privacySettings.hideLastSeen}
                  onChange={(e) => handlePrivacyChange('hideLastSeen', e.target.checked)}
                  colorScheme="blue"
                  size="lg"
                  sx={{
                    'span.chakra-switch__track': {
                      bg: isDark ? '#39393D' : '#E5E5EA',
                    },
                    'span.chakra-switch__track[data-checked]': {
                      bg: successGreen,
                    },
                  }}
                />
              </FormControl>

              {/* Hide Online Status */}
              <FormControl display="flex" alignItems="center" px={5} py={4}>
                <HStack flex="1" spacing={3}>
                  <Box 
                    p={2} 
                    bg={isDark ? successGreen + '20' : successGreen + '15'}
                    borderRadius="8px"
                  >
                    <Eye size={20} color={successGreen} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <FormLabel mb={0} fontWeight="600" fontSize="17px" color={textPrimary}>
                      Hide Online Status
                    </FormLabel>
                    <Text fontSize="13px" color={textSecondary}>
                      Appear offline to everyone
                    </Text>
                  </VStack>
                </HStack>
                <Switch
                  isChecked={privacySettings.hideOnlineStatus}
                  onChange={(e) => handlePrivacyChange('hideOnlineStatus', e.target.checked)}
                  colorScheme="blue"
                  size="lg"
                  sx={{
                    'span.chakra-switch__track': {
                      bg: isDark ? '#39393D' : '#E5E5EA',
                    },
                    'span.chakra-switch__track[data-checked]': {
                      bg: successGreen,
                    },
                  }}
                />
              </FormControl>
            </VStack>
          </Box>

          {/* Navigation Settings Section */}
          <Box
            bg={cardBg}
            borderRadius="16px"
            overflow="hidden"
            border="1px solid"
            borderColor={borderColor}
            shadow="sm"
          >
            <VStack spacing={0} align="stretch" divider={<Divider borderColor={borderColor} />}>
              <Box px={5} py={4}>
                <Text 
                  fontSize="13px" 
                  fontWeight="600" 
                  color={textSecondary}
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  mb={4}
                >
                  Navigation
                </Text>
                <NavbarSettings
                  navbarSettings={navbarSettings}
                  onSave={handleNavbarSave}
                  onChange={handleNavbarChange}
                  isLoading={isLoading}
                  hideSaveButton
                />
              </Box>
            </VStack>
          </Box>

          {/* Save Button */}
          <Button
            size="lg"
            h="56px"
            bg={accentBlue}
            color="white"
            borderRadius="14px"
            fontSize="17px"
            fontWeight="600"
            leftIcon={<Save size={20} />}
            onClick={handleSave}
            isLoading={isLoading}
            loadingText="Saving..."
            _hover={{ 
              bg: isDark ? '#0A84FF' : '#0051D5',
              transform: 'translateY(-1px)',
              shadow: 'lg'
            }}
            _active={{
              transform: 'translateY(0)',
            }}
            transition="all 0.2s"
          >
            Save Changes
          </Button>

          {/* Logout Section */}
          <Box
            bg={cardBg}
            borderRadius="16px"
            overflow="hidden"
            border="1px solid"
            borderColor={borderColor}
            shadow="sm"
          >
            <VStack spacing={0} align="stretch" divider={<Divider borderColor={borderColor} />}>
              <Box px={5} py={4}>
                <Text 
                  fontSize="13px" 
                  fontWeight="600" 
                  color={textSecondary}
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  mb={4}
                >
                  Account
                </Text>
                <Button
                  w="full"
                  size="lg"
                  h="56px"
                  leftIcon={<LogOut size={20} />}
                  bg="transparent"
                  color={accentRed}
                  borderRadius="14px"
                  fontSize="17px"
                  fontWeight="600"
                  onClick={handleLogout}
                  _hover={{
                    bg: isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.08)',
                  }}
                  transition="all 0.2s"
                >
                  Logout
                </Button>
              </Box>
            </VStack>
          </Box>

          {/* Subscription Section */}
          {subscription && subscription.status === 'active' && (
            <Box
              bg={cardBg}
              borderRadius="16px"
              overflow="hidden"
              border="1px solid"
              borderColor={borderColor}
              shadow="sm"
            >
              <VStack spacing={0} align="stretch" divider={<Divider borderColor={borderColor} />}>
                {/* Section Header */}
                <Box px={5} py={4}>
                  <Text 
                    fontSize="13px" 
                    fontWeight="600" 
                    color={textSecondary}
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                  >
                    Subscription
                  </Text>
                </Box>
                
                {/* Subscription Info */}
                <Box px={5} py={4}>
                  <HStack spacing={3} mb={4}>
                    <VerifiedBadge badgeType={subscription.badgeType} size={28} />
                    <VStack align="start" spacing={0} flex="1">
                      <Text fontWeight="600" fontSize="17px" color={textPrimary}>
                        {subscription.badgeType.charAt(0).toUpperCase() + subscription.badgeType.slice(1)} Badge
                      </Text>
                      <Text fontSize="13px" color={textSecondary}>
                        Expires {new Date(subscription.expiryDate).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </HStack>
                  
                  {/* Warning Box */}
                  <Box
                    p={4}
                    borderRadius="12px"
                    bg={isDark ? '#3A1A1A' : '#FFF5F5'}
                    border="1px solid"
                    borderColor={isDark ? '#5C2020' : '#FED7D7'}
                  >
                    <HStack spacing={2} mb={2}>
                      <AlertCircle size={18} color={accentRed} />
                      <Text fontWeight="600" fontSize="15px" color={accentRed}>
                        Cancel Subscription
                      </Text>
                    </HStack>
                    <Text fontSize="13px" color={isDark ? '#FFA8A8' : '#C53030'} mb={3}>
                      Badge removed immediately. No refunds available.
                    </Text>
                    <Button
                      leftIcon={<X size={16} />}
                      size="sm"
                      h="36px"
                      bg="transparent"
                      color={accentRed}
                      border="1px solid"
                      borderColor={accentRed}
                      borderRadius="8px"
                      fontSize="15px"
                      fontWeight="600"
                      onClick={onCancelOpen}
                      isLoading={isCancelling}
                      _hover={{ 
                        bg: isDark ? '#3A1A1A' : '#FFF5F5',
                      }}
                    >
                      Cancel Subscription
                    </Button>
                  </Box>
                </Box>
              </VStack>
            </Box>
          )}

          {/* Account Information Section */}
          <Box
            bg={cardBg}
            borderRadius="16px"
            overflow="hidden"
            border="1px solid"
            borderColor={borderColor}
            shadow="sm"
          >
            <VStack spacing={0} align="stretch" divider={<Divider borderColor={borderColor} />}>
              {/* Section Header */}
              <Box px={5} py={4}>
                <Text 
                  fontSize="13px" 
                  fontWeight="600" 
                  color={textSecondary}
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                >
                  Account Information
                </Text>
              </Box>
              
              {/* Account Type */}
              <Box px={5} py={4}>
                <HStack justify="space-between">
                  <Text fontSize="17px" color={textPrimary}>
                    Account Type
                  </Text>
                  <Text fontSize="17px" color={textSecondary} fontWeight="500">
                    {displayData.accountType === 'private' ? 'Private' : 'Public'}
                  </Text>
                </HStack>
                <Text fontSize="13px" color={textSecondary} mt={1}>
                  {displayData.accountType === 'private'
                    ? 'Only accepted friends can message you'
                    : 'Anyone can message you'}
                </Text>
              </Box>

              {/* Privacy Status */}
              <Box px={5} py={4}>
                <Text fontSize="17px" color={textPrimary} mb={2}>
                  Current Privacy
                </Text>
                <VStack align="stretch" spacing={1}>
                  <HStack justify="space-between">
                    <Text fontSize="15px" color={textSecondary}>
                      Last Seen
                    </Text>
                    <Text fontSize="15px" color={textPrimary} fontWeight="500">
                      {privacySettings.hideLastSeen ? 'Hidden' : 'Visible'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="15px" color={textSecondary}>
                      Online Status
                    </Text>
                    <Text fontSize="15px" color={textPrimary} fontWeight="500">
                      {privacySettings.hideOnlineStatus ? 'Hidden' : 'Visible'}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </VStack>

        {/* Cancel Subscription Dialog — light/dark bg, no blur */}
        <AlertDialog
          isOpen={isCancelOpen}
          leastDestructiveRef={cancelRef}
          onClose={onCancelClose}
        >
          <AlertDialogOverlay
            bg={isDark ? 'blackAlpha.600' : 'blackAlpha.500'}
          >
          <AlertDialogContent
            mx={{ base: 6, md: 4 }}
            my={{ base: 6, md: 4 }}
            maxW={{ base: 'calc(100% - 48px)', md: '400px' }}
            borderRadius={{ base: '20px', md: '24px' }}
            overflow="hidden"
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            boxShadow="lg"
          >
            <AlertDialogHeader
              fontSize="20px"
              fontWeight="700"
              color={textPrimary}
              pt={6}
              px={6}
              borderBottom="1px solid"
              borderColor={isDark ? 'whiteAlpha.100' : 'blackAlpha.08'}
            >
              Cancel Subscription?
            </AlertDialogHeader>
            <AlertDialogBody pb={6} px={6} pt={5}>
              <VStack spacing={4} align="stretch">
                <Text fontSize="15px" color={textSecondary}>
                  Are you sure you want to cancel your subscription?
                </Text>
                <Box
                  p={4}
                  borderRadius="12px"
                  bg={isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.08)'}
                  border="1px solid"
                  borderColor={isDark ? 'rgba(255, 59, 48, 0.35)' : 'rgba(255, 59, 48, 0.2)'}
                >
                  <HStack spacing={2} mb={2}>
                    <AlertCircle size={18} color={accentRed} />
                    <Text fontWeight="600" fontSize="15px" color={accentRed}>
                      Important
                    </Text>
                  </HStack>
                  <Text fontSize="13px" color={isDark ? '#FFA8A8' : '#C53030'}>
                    Your verified badge will be immediately removed. Payment is non-refundable.
                  </Text>
                </Box>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter pb={6} px={6} gap={3}>
              <Button
                ref={cancelRef}
                onClick={onCancelClose}
                flex="1"
                h="50px"
                bg={isDark ? '#2C2C2E' : '#F2F2F7'}
                color={accentBlue}
                borderRadius="12px"
                fontSize="17px"
                fontWeight="600"
                _hover={{
                  bg: isDark ? '#3A3A3C' : '#E5E5EA',
                }}
              >
                Keep
              </Button>
              <Button
                flex="1"
                h="50px"
                bg={accentRed}
                color="white"
                borderRadius="12px"
                fontSize="17px"
                fontWeight="600"
                onClick={handleCancelSubscription}
                isLoading={isCancelling}
                _hover={{
                  bg: '#D70015',
                }}
              >
                Cancel
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
  )
}

export default UserSettings