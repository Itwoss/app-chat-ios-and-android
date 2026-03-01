import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  Select,
  Switch,
  FormControl,
  FormLabel,
  useColorModeValue,
  useToast,
  Divider,
  Radio,
  RadioGroup,
  Stack,
  Badge,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { Plus, X, GripVertical, Eye, EyeOff, Save } from 'lucide-react'
import { Home, Rss, MessageCircle, LayoutDashboard, User } from 'lucide-react'

// Icon options
const iconOptions = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'feed', label: 'Feed', icon: Rss },
  { value: 'chat', label: 'Chat', icon: MessageCircle },
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'profile', label: 'Profile', icon: User },
]

// Route options
const routeOptions = [
  { value: '/user/home', label: 'Home' },
  { value: '/user/feed', label: 'Feed' },
  { value: '/user/chat', label: 'Chat' },
  { value: '/user/dashboard', label: 'Dashboard' },
  { value: '/user/profile', label: 'Profile' },
]

const NavbarSettings = ({ navbarSettings, onSave, onChange, isLoading, hideSaveButton = false }) => {
  const toast = useToast()
  
  // Apple App Store Color Palette
  const isDark = useColorModeValue(false, true)
  const cardBg = useColorModeValue('#FFFFFF', '#1C1C1E')
  const textPrimary = useColorModeValue('#000000', '#FFFFFF')
  const textSecondary = useColorModeValue('#6C6C70', '#98989D')
  const borderColor = useColorModeValue('#E5E5EA', '#2C2C2E')
  const accentBlue = useColorModeValue('#007AFF', '#0A84FF')
  const hoverBg = useColorModeValue('#F2F2F7', '#2C2C2E')

  const [navbarType, setNavbarType] = useState(navbarSettings?.navbarType || 'normal')
  const [position, setPosition] = useState(navbarSettings?.advancedNavbar?.position || 'bottom-left')
  const [slideEdgeOnly, setSlideEdgeOnly] = useState(navbarSettings?.slideNavigation?.edgeOnly ?? false)
  const [items, setItems] = useState(
    navbarSettings?.advancedNavbar?.items || [
      { id: 'home', label: 'Home', icon: 'home', route: '/user/home', visible: true, order: 1 },
      { id: 'feed', label: 'Feed', icon: 'feed', route: '/user/feed', visible: true, order: 2 },
      { id: 'chat', label: 'Chat', icon: 'chat', route: '/user/chat', visible: true, order: 3 },
      { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/user/dashboard', visible: true, order: 4 },
      { id: 'profile', label: 'Profile', icon: 'profile', route: '/user/profile', visible: true, order: 5 },
    ]
  )

  // Sync state when navbarSettings prop changes (e.g., after save or refresh)
  useEffect(() => {
    // Always sync navbarType (including 'normal')
    if (navbarSettings?.navbarType !== undefined) {
      setNavbarType(navbarSettings.navbarType)
    }
    
    // Sync position if advanced navbar config exists
    if (navbarSettings?.advancedNavbar?.position) {
      setPosition(navbarSettings.advancedNavbar.position)
    }
    
    // Sync items if advanced navbar config exists and has items
    if (navbarSettings?.slideNavigation?.edgeOnly !== undefined) {
      setSlideEdgeOnly(navbarSettings.slideNavigation.edgeOnly)
    }
    if (navbarSettings?.advancedNavbar?.items && Array.isArray(navbarSettings.advancedNavbar.items) && navbarSettings.advancedNavbar.items.length > 0) {
      setItems(navbarSettings.advancedNavbar.items)
    } else if (navbarSettings?.navbarType === 'normal') {
      // Reset to default items when switching to normal (only if not already set)
      const defaultItems = [
        { id: 'home', label: 'Home', icon: 'home', route: '/user/home', visible: true, order: 1 },
        { id: 'feed', label: 'Feed', icon: 'feed', route: '/user/feed', visible: true, order: 2 },
        { id: 'chat', label: 'Chat', icon: 'chat', route: '/user/chat', visible: true, order: 3 },
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', route: '/user/dashboard', visible: true, order: 4 },
        { id: 'profile', label: 'Profile', icon: 'profile', route: '/user/profile', visible: true, order: 5 },
      ]
      // Only set if items are different to avoid unnecessary updates
      setItems(prevItems => {
        const prevStr = JSON.stringify(prevItems)
        const defaultStr = JSON.stringify(defaultItems)
        return prevStr === defaultStr ? prevItems : defaultItems
      })
    }
  }, [navbarSettings])

  // Notify parent of current settings when used in Settings page (single Save Changes)
  useEffect(() => {
    if (!onChange) return
    const payload = {
      navbarType: navbarType || 'normal',
      ...(navbarType === 'advanced' ? {
        advancedNavbar: {
          position: position || 'bottom-left',
          items: items.map((item, index) => ({ ...item, order: index + 1 })),
        },
      } : { advancedNavbar: { position: 'bottom-left', items: [] } }),
      ...(navbarType === 'slide' ? { slideNavigation: { enabled: true, edgeOnly: slideEdgeOnly } } : {}),
    }
    onChange(payload)
  }, [navbarType, position, items, slideEdgeOnly, onChange])

  const handleAddItem = () => {
    if (items.length >= 8) {
      toast({
        title: 'Maximum items reached',
        description: 'You can add up to 8 items',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const newId = `item-${Date.now()}`
    setItems([
      ...items,
      {
        id: newId,
        label: 'New Item',
        icon: 'home',
        route: '/user/home',
        visible: true,
        order: items.length + 1,
      },
    ])
  }

  const handleRemoveItem = (id) => {
    if (items.length <= 2) {
      toast({
        title: 'Minimum items required',
        description: 'You need at least 2 items',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setItems(items.filter(item => item.id !== id).map((item, index) => ({
      ...item,
      order: index + 1,
    })))
  }

  const handleUpdateItem = (id, field, value) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleToggleVisibility = (id) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, visible: !item.visible } : item
    ))
  }

  const handleMoveItem = (id, direction) => {
    const index = items.findIndex(item => item.id === id)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= items.length) return

    const newItems = [...items]
    ;[newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]]
    
    // Update orders
    newItems.forEach((item, idx) => {
      item.order = idx + 1
    })

    setItems(newItems)
  }

  // Build payload for save (shared by handleSave and auto-save)
  const buildSettingsPayload = (navType, pos, itemsList, edgeOnly) => ({
    navbarType: navType || 'normal',
    ...(navType === 'advanced' ? {
      advancedNavbar: {
        position: pos || 'bottom-left',
        items: (itemsList || items).map((item, index) => ({ ...item, order: index + 1 })),
      },
    } : {
      advancedNavbar: { position: 'bottom-left', items: [] },
    }),
    ...(navType === 'slide' ? {
      slideNavigation: { enabled: true, edgeOnly: edgeOnly ?? slideEdgeOnly },
    } : {}),
  })

  // Auto-save when Navigation Mode or main options change (validates for advanced)
  const autoSave = (payload) => {
    if (payload.navbarType === 'advanced') {
      const visibleItems = (payload.advancedNavbar?.items || []).filter(item => item.visible)
      if (visibleItems.length < 2) {
        toast({
          title: 'Invalid configuration',
          description: 'You need at least 2 visible items for Advanced Navbar',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }
    }
    onSave(payload)
    toast({
      title: 'Navigation settings saved',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  const handleSave = () => {
    // If advanced navbar is selected, validate items
    if (navbarType === 'advanced') {
      const visibleItems = items.filter(item => item.visible)
      if (visibleItems.length < 2) {
        toast({
          title: 'Invalid configuration',
          description: 'You need at least 2 visible items for Advanced Navbar',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }
    }

    const settingsToSave = buildSettingsPayload(navbarType, position, items, slideEdgeOnly)
    onSave(settingsToSave)
  }

  const visibleItemsCount = items.filter(item => item.visible).length

  return (
    <VStack spacing={6} align="stretch">
      {/* Navbar Type Selection */}
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
              mb={3}
            >
              Navigation Mode
            </Text>
            <RadioGroup
              value={navbarType}
              onChange={(newValue) => {
                setNavbarType(newValue)
                const payload = buildSettingsPayload(newValue, position, items, slideEdgeOnly)
                autoSave(payload)
              }}
            >
              <Stack spacing={3}>
                <Radio value="normal" colorScheme="blue" size="lg">
                  <VStack align="start" spacing={0} ml={2}>
                    <Text fontSize="17px" fontWeight="600" color={textPrimary}>
                      Normal Navbar
                    </Text>
                    <Text fontSize="13px" color={textSecondary}>
                      Fixed bottom navigation bar
                    </Text>
                  </VStack>
                </Radio>
                <Radio value="advanced" colorScheme="blue" size="lg">
                  <VStack align="start" spacing={0} ml={2}>
                    <Text fontSize="17px" fontWeight="600" color={textPrimary}>
                      Advanced Navbar
                    </Text>
                    <Text fontSize="13px" color={textSecondary}>
                      Radial clock-ring menu
                    </Text>
                  </VStack>
                </Radio>
                <Radio value="slide" colorScheme="blue" size="lg">
                  <VStack align="start" spacing={0} ml={2}>
                    <Text fontSize="17px" fontWeight="600" color={textPrimary}>
                      Slide Navigation
                    </Text>
                    <Text fontSize="13px" color={textSecondary}>
                      Swipe between Home → Feed → Chat → Profile (mobile)
                    </Text>
                  </VStack>
                </Radio>
              </Stack>
            </RadioGroup>
          </Box>
        </VStack>
      </Box>

      {/* Slide Navigation options when Slide mode is selected */}
      {navbarType === 'slide' && (
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
              <Text fontSize="13px" fontWeight="600" color={textSecondary} textTransform="uppercase" letterSpacing="0.5px" mb={3}>
                Slide options
              </Text>
              <FormControl display="flex" alignItems="center" justifyContent="space-between">
                <FormLabel mb={0} fontSize="15px" color={textPrimary}>
                  Edge swipe only
                </FormLabel>
                <Switch
                  isChecked={slideEdgeOnly}
                  onChange={(e) => {
                    const checked = e.target.checked
                    setSlideEdgeOnly(checked)
                    const payload = buildSettingsPayload(navbarType, position, items, checked)
                    autoSave(payload)
                  }}
                  colorScheme="blue"
                />
              </FormControl>
              <Text fontSize="12px" color={textSecondary} mt={2}>
                When on, only swipes starting from the left or right screen edge trigger navigation.
              </Text>
            </Box>
          </VStack>
        </Box>
      )}

      {/* Advanced Navbar Configuration */}
      {navbarType === 'advanced' && (
        <>
          {/* Position Selection */}
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
                  mb={3}
                >
                  Menu Position
                </Text>
                <Select
                  value={position}
                  onChange={(e) => {
                    const value = e.target.value
                    setPosition(value)
                    const payload = buildSettingsPayload(navbarType, value, items, slideEdgeOnly)
                    autoSave(payload)
                  }}
                  bg={isDark ? '#2C2C2E' : '#F2F2F7'}
                  borderColor={borderColor}
                  color={textPrimary}
                  _focus={{
                    borderColor: accentBlue,
                    boxShadow: `0 0 0 1px ${accentBlue}`,
                  }}
                >
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-center">Bottom Center</option>
                </Select>
              </Box>
            </VStack>
          </Box>

          {/* Menu Items Configuration */}
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
                <HStack justify="space-between" mb={3}>
                  <Text
                    fontSize="13px"
                    fontWeight="600"
                    color={textSecondary}
                    textTransform="uppercase"
                    letterSpacing="0.5px"
                  >
                    Menu Items ({visibleItemsCount}/{items.length})
                  </Text>
                  <Button
                    size="sm"
                    leftIcon={<Plus size={16} />}
                    onClick={handleAddItem}
                    bg={accentBlue}
                    color="white"
                    _hover={{ bg: isDark ? '#0A84FF' : '#0051D5' }}
                    isDisabled={items.length >= 8}
                  >
                    Add Item
                  </Button>
                </HStack>

                <VStack spacing={3} align="stretch">
                  {items.map((item, index) => {
                    const IconComponent = iconOptions.find(opt => opt.value === item.icon)?.icon || Home
                    
                    return (
                      <Box
                        key={item.id}
                        p={4}
                        bg={isDark ? '#2C2C2E' : '#F2F2F7'}
                        borderRadius="12px"
                        border="1px solid"
                        borderColor={borderColor}
                      >
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between">
                            <HStack spacing={3}>
                              <IconButton
                                icon={<GripVertical size={18} />}
                                variant="ghost"
                                size="sm"
                                cursor="grab"
                                aria-label="Drag to reorder"
                                color={textSecondary}
                              />
                              <Box
                                p={2}
                                bg={item.visible ? accentBlue + '20' : hoverBg}
                                borderRadius="8px"
                              >
                                <IconComponent size={20} color={item.visible ? accentBlue : textSecondary} />
                              </Box>
                              <Badge
                                colorScheme={item.visible ? 'blue' : 'gray'}
                                variant="subtle"
                                fontSize="10px"
                              >
                                {item.visible ? 'Visible' : 'Hidden'}
                              </Badge>
                            </HStack>
                            <HStack spacing={2}>
                              <IconButton
                                icon={item.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                                onClick={() => handleToggleVisibility(item.id)}
                                variant="ghost"
                                size="sm"
                                aria-label={item.visible ? 'Hide' : 'Show'}
                                color={textSecondary}
                              />
                              <IconButton
                                icon={<X size={16} />}
                                onClick={() => handleRemoveItem(item.id)}
                                variant="ghost"
                                size="sm"
                                aria-label="Remove"
                                color={textSecondary}
                                isDisabled={items.length <= 2}
                              />
                            </HStack>
                          </HStack>

                          <HStack spacing={2}>
                            <FormControl flex="1">
                              <FormLabel fontSize="13px" color={textSecondary} mb={1}>
                                Label
                              </FormLabel>
                              <Input
                                value={item.label}
                                onChange={(e) => handleUpdateItem(item.id, 'label', e.target.value)}
                                bg={cardBg}
                                borderColor={borderColor}
                                color={textPrimary}
                                size="sm"
                                _focus={{
                                  borderColor: accentBlue,
                                  boxShadow: `0 0 0 1px ${accentBlue}`,
                                }}
                              />
                            </FormControl>
                            <FormControl flex="1">
                              <FormLabel fontSize="13px" color={textSecondary} mb={1}>
                                Icon
                              </FormLabel>
                              <Select
                                value={item.icon}
                                onChange={(e) => handleUpdateItem(item.id, 'icon', e.target.value)}
                                bg={cardBg}
                                borderColor={borderColor}
                                color={textPrimary}
                                size="sm"
                                _focus={{
                                  borderColor: accentBlue,
                                  boxShadow: `0 0 0 1px ${accentBlue}`,
                                }}
                              >
                                {iconOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </Select>
                            </FormControl>
                            <FormControl flex="1">
                              <FormLabel fontSize="13px" color={textSecondary} mb={1}>
                                Route
                              </FormLabel>
                              <Select
                                value={item.route}
                                onChange={(e) => handleUpdateItem(item.id, 'route', e.target.value)}
                                bg={cardBg}
                                borderColor={borderColor}
                                color={textPrimary}
                                size="sm"
                                _focus={{
                                  borderColor: accentBlue,
                                  boxShadow: `0 0 0 1px ${accentBlue}`,
                                }}
                              >
                                {routeOptions.map(opt => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </Select>
                            </FormControl>
                          </HStack>

                          <HStack spacing={2}>
                            <Button
                              size="xs"
                              onClick={() => handleMoveItem(item.id, 'up')}
                              isDisabled={index === 0}
                              variant="ghost"
                              color={textSecondary}
                            >
                              ↑ Up
                            </Button>
                            <Button
                              size="xs"
                              onClick={() => handleMoveItem(item.id, 'down')}
                              isDisabled={index === items.length - 1}
                              variant="ghost"
                              color={textSecondary}
                            >
                              ↓ Down
                            </Button>
                          </HStack>
                        </VStack>
                      </Box>
                    )
                  })}
                </VStack>
              </Box>
            </VStack>
          </Box>
        </>
      )}

      {/* Save Button - hidden when embedded in Settings page (single Save Changes used there) */}
      {!hideSaveButton && (
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
            shadow: 'lg',
          }}
          _active={{
            transform: 'translateY(0)',
          }}
          transition="all 0.2s"
        >
          Save Navigation Settings
        </Button>
      )}
    </VStack>
  )
}

export default NavbarSettings

