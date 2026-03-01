import {
  Box,
  HStack,
  Heading,
  Text,
  IconButton,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Badge,
  useColorModeValue,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Input,
  Switch,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
} from '@chakra-ui/react'
import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowLeft, Settings, MoreVertical, Trash2, Pencil, Users, Archive } from 'lucide-react'
import UserAvatar from '../User/UserAvatar'
import UserName from '../User/UserName'
import AvatarZoomPreview from '../User/AvatarZoomPreview'
import { EmptyState } from '../EmptyState/EmptyState'
import { getChatDisplayName, setChatNickname, removeChatNickname, getChatNickname } from '../../utils/chatNicknames'
import {
  getPinnedChatIds,
  getMutedChatIds,
  getCloseFriendsIds,
  getArchivedChatIds,
  getBlockedUserIds,
  isChatPinned,
  isChatMuted,
  isCloseFriend,
  isChatArchived,
  isChatCleared,
  isUserBlocked,
  togglePinChat,
  toggleMuteChat,
  toggleCloseFriend,
  archiveChats,
  unarchiveChat,
  setChatCleared,
  unclearChat,
  toggleBlockUser,
  addChatGroup,
  applyPrefsFromApi,
} from '../../utils/chatListPrefs'
import { useLongPress } from '../../hooks/useLongPress'
import {
  useGetChatPrefsQuery,
  useUpdateArchiveMutation,
  useUnarchiveChatMutation,
  useSetChatClearedMutation,
  useUnclearChatMutation,
  useToggleBlockUserMutation,
  useTogglePinChatMutation,
  useToggleMuteChatMutation,
  useToggleCloseFriendMutation,
  useCreateChatGroupMutation,
} from '../../store/api/userApi'

const LONG_PRESS_MS = 500

const UNDECRYPT_PLACEHOLDERS = [
  '[Encrypted message - decryption failed]',
  '[Message could not be decrypted]',
  '[Encrypted Message]',
]
function lastMessagePreview(content) {
  if (!content || typeof content !== 'string') return content
  const trimmed = content.trim()
  return UNDECRYPT_PLACEHOLDERS.includes(trimmed) ? 'Message unavailable' : content
}

function ChatListItem({
  chat,
  selectedUserId,
  selectionMode,
  selectedChatIds,
  longPressedUserId,
  cardBg,
  textColor,
  borderColor,
  bgColor,
  onLongPress,
  onClick,
  onNicknameClick,
  onDeleteClick,
  onAvatarLongPress,
  getDisplayName,
}) {
  const otherUser = chat.otherUser
  const isSelected = selectedUserId === otherUser._id
  const isLongPressed = longPressedUserId === otherUser._id
  const isInSelection = selectedChatIds.has(otherUser._id)
  const displayName = getDisplayName(otherUser._id, otherUser.name)

  const longPress = useLongPress(
    () => onLongPress(chat),
    () => onClick(chat),
    LONG_PRESS_MS
  )

  const avatarLongPress = useLongPress(
    (e) => {
      e?.stopPropagation?.()
      onAvatarLongPress?.(otherUser)
    },
    undefined,
    LONG_PRESS_MS
  )

  const isCapsule = isLongPressed
  const boxBg = isSelected && !isCapsule ? cardBg : isCapsule ? cardBg : 'transparent'

  return (
    <Box
      p={isCapsule ? 2 : 3}
      py={isCapsule ? 2.5 : 3}
      bg={boxBg}
      borderRadius={isCapsule ? '999px' : 'md'}
      cursor="pointer"
      _hover={{ bg: cardBg }}
      _active={!selectionMode && !isCapsule ? { transform: 'translateX(-3px)' } : undefined}
      boxShadow={isCapsule ? 'md' : undefined}
      transition="all 0.2s"
      sx={{ borderBottom: isCapsule ? 'none' : '0.5px solid', borderColor: 'blackAlpha.200' }}
      _dark={isCapsule ? undefined : { borderColor: 'whiteAlpha.300' }}
      _last={{ borderBottom: 'none' }}
      {...longPress}
    >
      <HStack spacing={3}>
        <Box
          position="relative"
          flexShrink={0}
          cursor={onAvatarLongPress ? 'pointer' : undefined}
          {...(onAvatarLongPress ? {
            onTouchStart: (e) => { e.stopPropagation(); avatarLongPress.onTouchStart(e); },
            onTouchEnd: (e) => { e.stopPropagation(); avatarLongPress.onTouchEnd(e); },
            onTouchMove: (e) => { e.stopPropagation(); avatarLongPress.onTouchMove(e); },
            onTouchCancel: (e) => { e.stopPropagation(); avatarLongPress.onTouchCancel(e); },
            onMouseDown: (e) => { e.stopPropagation(); avatarLongPress.onMouseDown(e); },
            onMouseUp: (e) => { e.stopPropagation(); avatarLongPress.onMouseUp(e); },
            onMouseLeave: (e) => { e.stopPropagation(); avatarLongPress.onMouseLeave(e); },
          } : {})}
        >
          <UserAvatar
            userId={otherUser._id}
            name={otherUser.name}
            src={otherUser.profileImage}
            size="md"
            subscription={otherUser.subscription}
          />
          {!otherUser?.privacySettings?.hideOnlineStatus && otherUser.onlineStatus === 'online' && (
            <Box position="absolute" bottom={0} right={0} w={3} h={3} bg="green.500" borderRadius="full" border="2px" borderColor={bgColor} zIndex={1} />
          )}
        </Box>
        {isCapsule ? (
          <>
            <Button size="xs" leftIcon={<Pencil size={12} />} variant="ghost" flex={1} onClick={(e) => { e.stopPropagation(); onNicknameClick(); }} fontSize="xs">
              Nickname
            </Button>
            <IconButton aria-label="Delete" icon={<Trash2 size={16} />} size="xs" variant="ghost" colorScheme="red" onClick={onDeleteClick} />
          </>
        ) : (
          <VStack align="start" spacing={0} flex={1} minW={0}>
            <HStack spacing={2} w="full">
              <Text fontSize="sm" fontWeight="medium" color={textColor} noOfLines={1}>
                {displayName}
              </Text>
              {chat.unreadCount > 0 && (
                <Badge colorScheme="brand" borderRadius="full" fontSize="xs">{chat.unreadCount}</Badge>
              )}
            </HStack>
            {chat.lastMessage && (
              <Text fontSize="xs" color={textColor} noOfLines={1}>{lastMessagePreview(chat.lastMessage.content)}</Text>
            )}
          </VStack>
        )}
      </HStack>
    </Box>
  )
}

/**
 * Left panel: chat list with long-press selection, nicknames, action menu, chat settings.
 */
const ChatListPanel = ({
  chats,
  friends,
  suggestions,
  selectedUserId,
  onChatSelect,
  onFriendSelect,
  onSuggestionSelect,
  onSettingsOpen,
  onDeleteChat,
  navigate,
  bgColor,
  cardBg,
  textColor,
  borderColor,
}) => {
  const toast = useToast()
  const backNavigateRef = useRef(false)
  const [selectedChatIds, setSelectedChatIds] = useState(new Set())
  const [longPressedUserId, setLongPressedUserId] = useState(null)
  const [avatarPreviewUser, setAvatarPreviewUser] = useState(null)

  const handleBack = useCallback(() => {
    if (backNavigateRef.current) return
    backNavigateRef.current = true
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/user/home')
    }
    setTimeout(() => { backNavigateRef.current = false }, 500)
  }, [navigate])
  const [nicknameEditUserId, setNicknameEditUserId] = useState(null)
  const [nicknameInput, setNicknameInput] = useState('')
  const [chatSettingsUserId, setChatSettingsUserId] = useState(null)
  const [prefsRefresh, setPrefsRefresh] = useState(0)
  const [groupName, setGroupName] = useState('')
  const pinnedIds = getPinnedChatIds()
  const mutedIds = getMutedChatIds()
  const archivedIds = getArchivedChatIds()
  const blockedIds = getBlockedUserIds()
  const refreshPrefs = useCallback(() => setPrefsRefresh((n) => n + 1), [])

  const { isOpen: isGroupOpen, onOpen: onGroupOpen, onClose: onGroupClose } = useDisclosure()

  const { isOpen: isNicknameOpen, onOpen: onNicknameOpen, onClose: onNicknameClose } = useDisclosure()
  const { isOpen: isChatSettingsOpen, onOpen: onChatSettingsOpen, onClose: onChatSettingsClose } = useDisclosure()

  const { data: prefsData } = useGetChatPrefsQuery()
  useEffect(() => {
    if (prefsData?.data) {
      applyPrefsFromApi(prefsData.data)
      setPrefsRefresh((n) => n + 1)
    }
  }, [prefsData])

  const [updateArchiveApi] = useUpdateArchiveMutation()
  const [unarchiveChatApi] = useUnarchiveChatMutation()
  const [setChatClearedApi] = useSetChatClearedMutation()
  const [unclearChatApi] = useUnclearChatMutation()
  const [toggleBlockApi] = useToggleBlockUserMutation()
  const [togglePinApi] = useTogglePinChatMutation()
  const [toggleMuteApi] = useToggleMuteChatMutation()
  const [toggleCloseFriendApi] = useToggleCloseFriendMutation()
  const [createChatGroupApi] = useCreateChatGroupMutation()

  const selectionMode = selectedChatIds.size > 0
  const clearSelection = useCallback(() => {
    setSelectedChatIds(new Set())
    setLongPressedUserId(null)
  }, [])

  const toggleSelect = useCallback((userId) => {
    setSelectedChatIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }, [])

  const handleLongPress = useCallback((chat) => {
    const id = chat.otherUser._id
    setSelectedChatIds((prev) => new Set(prev).add(id))
    setLongPressedUserId(id)
  }, [])

  const handleChatItemClick = useCallback(
    (chat, e) => {
      const id = chat.otherUser._id
      if (selectionMode) {
        e?.stopPropagation?.()
        toggleSelect(id)
        return
      }
      if (longPressedUserId === id) return
      onChatSelect(chat)
    },
    [selectionMode, longPressedUserId, toggleSelect, onChatSelect]
  )

  const openNicknameFor = useCallback((userId, currentNick) => {
    setNicknameEditUserId(userId)
    setNicknameInput(currentNick || '')
    onNicknameOpen()
  }, [onNicknameOpen])

  const saveNickname = useCallback(() => {
    if (!nicknameEditUserId) return
    const trimmed = nicknameInput.trim()
    if (trimmed) setChatNickname(nicknameEditUserId, trimmed)
    else removeChatNickname(nicknameEditUserId)
    toast({ title: trimmed ? 'Nickname saved' : 'Nickname removed', status: 'success', duration: 2000, isClosable: true })
    setNicknameEditUserId(null)
    onNicknameClose()
  }, [nicknameEditUserId, nicknameInput, onNicknameClose, toast])

  const openChatSettingsFor = useCallback((userId) => {
    setChatSettingsUserId(userId)
    onChatSettingsOpen()
  }, [onChatSettingsOpen])

  const handleDeleteChat = useCallback(() => {
    if (selectedChatIds.size === 0) {
      toast({ title: 'Select one or more chats to delete', status: 'info', duration: 2000, isClosable: true })
      return
    }
    if (onDeleteChat) {
      selectedChatIds.forEach((id) => onDeleteChat(id))
    }
    clearSelection()
  }, [selectedChatIds, onDeleteChat, clearSelection, toast])

  const handleArchive = useCallback(async () => {
    if (selectedChatIds.size === 0) return
    const userIds = [...selectedChatIds]
    archiveChats(userIds)
    refreshPrefs()
    toast({ title: 'Chats archived', status: 'success', duration: 2000, isClosable: true })
    clearSelection()
    try {
      await updateArchiveApi({ userIds }).unwrap()
    } catch (err) {
      toast({ title: 'Could not sync archive', description: err?.data?.message || err?.message, status: 'warning', duration: 3000, isClosable: true })
    }
  }, [selectedChatIds, refreshPrefs, toast, clearSelection, updateArchiveApi])

  const handleAddToGroup = useCallback(() => {
    if (selectedChatIds.size === 0) return
    onGroupOpen()
  }, [selectedChatIds.size, onGroupOpen])

  const handleSaveGroup = useCallback(async () => {
    const name = groupName.trim()
    if (!name) {
      toast({ title: 'Enter a group name', status: 'warning', duration: 2000, isClosable: true })
      return
    }
    const memberIds = [...selectedChatIds]
    addChatGroup(name, memberIds)
    setGroupName('')
    onGroupClose()
    refreshPrefs()
    toast({ title: 'Group created', status: 'success', duration: 2000, isClosable: true })
    clearSelection()
    try {
      await createChatGroupApi({ name, memberIds }).unwrap()
    } catch (err) {
      toast({ title: 'Could not sync group', description: err?.data?.message || err?.message, status: 'warning', duration: 3000, isClosable: true })
    }
  }, [groupName, selectedChatIds, onGroupClose, refreshPrefs, toast, clearSelection, createChatGroupApi])

  return (
    <Box
      w={{ base: '100%', md: '320px' }}
      minW={{ base: undefined, md: '320px' }}
      flexShrink={0}
      bg={bgColor}
      borderRight={{ base: 'none', md: '1px' }}
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
      h="100%"
      minH={0}
      overflow="hidden"
    >
      {/* Header: selection mode shows Back + count + 3-dots; else normal Chats + Settings */}
      <Box
        flexShrink={0}
        px={{ base: 2, md: 3 }}
        pt={{ base: 'calc(env(safe-area-inset-top, 0px) + 4px)', md: 2 }}
        pb={2}
        borderBottom="0.5px solid"
        borderColor="whiteAlpha.400"
        _dark={{ borderColor: 'whiteAlpha.500' }}
      >
        {selectionMode ? (
          <HStack justify="space-between" align="center" spacing={2}>
            <IconButton
              icon={<ArrowLeft size={18} />}
              variant="ghost"
              onClick={clearSelection}
              aria-label="Cancel selection"
              size="sm"
            />
            <Text fontSize="sm" fontWeight="600" color={textColor}>
              {selectedChatIds.size} selected
            </Text>
            <Menu>
              <MenuButton as={Button} rightIcon={<MoreVertical size={16} />} size="sm" variant="ghost" aria-label="Actions" />
              <MenuList>
                <MenuItem icon={<Trash2 size={14} />} onClick={handleDeleteChat}>Delete Chat</MenuItem>
                <MenuItem icon={<Users size={14} />} onClick={handleAddToGroup}>Add to New Group</MenuItem>
                <MenuItem icon={<Archive size={14} />} onClick={handleArchive}>Archive Chat</MenuItem>
                <MenuItem icon={<Settings size={14} />} onClick={() => { const first = [...selectedChatIds][0]; if (first) openChatSettingsFor(first); clearSelection(); }}>Chat Settings</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        ) : (
          <>
            <HStack justify="space-between" align="center" display={{ base: 'flex', md: 'none' }} spacing={1}>
              <HStack spacing={1.5} flex={1}>
                <IconButton
                  icon={<ArrowLeft size={18} />}
                  variant="ghost"
                  aria-label="Back"
                  size="sm"
                  onClick={handleBack}
                  sx={{ touchAction: 'manipulation', minW: '44px', minH: '44px' }}
                />
                <Heading size="sm" color={textColor}>Chats</Heading>
              </HStack>
              <IconButton icon={<Settings size={18} />} variant="ghost" onClick={onSettingsOpen} aria-label="Chat Settings" colorScheme="brand" size="sm" />
            </HStack>
            <HStack justify="space-between" align="center" display={{ base: 'none', md: 'flex' }} spacing={1}>
              <HStack spacing={1.5} flex={1}>
                <IconButton
                  icon={<ArrowLeft size={16} />}
                  variant="ghost"
                  aria-label="Back"
                  size="xs"
                  onClick={handleBack}
                  sx={{ touchAction: 'manipulation', minW: '44px', minH: '44px' }}
                />
                <Heading size="sm" color={textColor}>Chats</Heading>
              </HStack>
              <IconButton icon={<Settings size={16} />} variant="ghost" onClick={onSettingsOpen} aria-label="Chat Settings" colorScheme="brand" size="xs" />
            </HStack>
          </>
        )}
      </Box>

      {/* Scrollable area: only the list scrolls; bottom safe area above home indicator */}
      <Box
        flex={1}
        minH={0}
        overflowY="auto"
        overflowX="hidden"
        p={{ base: 3, md: 4 }}
        pt={4}
        sx={{
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
        }}
      >
        {chats.length === 0 ? (
          <Tabs colorScheme="brand">
            <TabList>
              <Tab fontSize="sm">Friends</Tab>
              <Tab fontSize="sm">Suggestions</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0} pt={4}>
                {friends.length === 0 ? (
                  <EmptyState
                    title="No Friends Yet"
                    description="Add friends to start conversations"
                  />
                ) : (
                  <VStack spacing={2} align="stretch">
                    {friends.map((friend) => (
                      <Box
                        key={friend._id}
                        p={3}
                        bg="transparent"
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => onFriendSelect(friend)}
                        _hover={{ bg: cardBg }}
                      >
                        <HStack spacing={3}>
                          <Box position="relative">
                            <UserAvatar
                              userId={friend._id}
                              name={friend.name}
                              src={friend.profileImage}
                              size="md"
                              subscription={friend.subscription}
                            />
                            {!friend?.privacySettings?.hideOnlineStatus &&
                              friend.onlineStatus === 'online' && (
                                <Box
                                  position="absolute"
                                  bottom={0}
                                  right={0}
                                  w={3}
                                  h={3}
                                  bg="green.500"
                                  borderRadius="full"
                                  border="2px"
                                  borderColor={bgColor}
                                  zIndex={1}
                                />
                              )}
                          </Box>
                          <VStack align="start" spacing={0} flex={1}>
                            <UserName
                              userId={friend._id}
                              name={friend.name}
                              subscription={friend.subscription}
                              fontSize="sm"
                              fontWeight="medium"
                            />
                            <Text fontSize="xs" color={textColor}>
                              {friend.accountType === 'public' ? 'Public' : 'Private'}
                            </Text>
                          </VStack>
                          <Button
                            size="xs"
                            colorScheme="brand"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFriendSelect(friend)
                            }}
                          >
                            Message
                          </Button>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </TabPanel>
              <TabPanel px={0} pt={4}>
                {suggestions.length === 0 ? (
                  <EmptyState
                    title="No Suggestions"
                    description="All users are already your friends"
                  />
                ) : (
                  <VStack spacing={2} align="stretch">
                    {suggestions.map((user) => (
                      <Box
                        key={user._id}
                        p={3}
                        bg="transparent"
                        borderRadius="md"
                        cursor="pointer"
                        onClick={() => onSuggestionSelect(user)}
                        _hover={{ bg: cardBg }}
                      >
                        <HStack spacing={3}>
                          <Box position="relative">
                            <UserAvatar
                              userId={user._id}
                              name={user.name}
                              src={user.profileImage}
                              size="md"
                              subscription={user.subscription}
                            />
                            {!user?.privacySettings?.hideOnlineStatus &&
                              user.onlineStatus === 'online' && (
                                <Box
                                  position="absolute"
                                  bottom={0}
                                  right={0}
                                  w={3}
                                  h={3}
                                  bg="green.500"
                                  borderRadius="full"
                                  border="2px"
                                  borderColor={bgColor}
                                  zIndex={1}
                                />
                              )}
                          </Box>
                          <VStack align="start" spacing={0} flex={1}>
                            <UserName
                              userId={user._id}
                              name={user.name}
                              subscription={user.subscription}
                              fontSize="sm"
                              fontWeight="medium"
                            />
                            <Text fontSize="xs" color={textColor}>
                              {user.accountType === 'public' ? 'Public' : 'Private'}
                            </Text>
                          </VStack>
                          <Button
                            size="xs"
                            colorScheme="brand"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSuggestionSelect(user)
                            }}
                          >
                            Message
                          </Button>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        ) : (
          <VStack spacing={2} align="stretch" onClick={() => setLongPressedUserId(null)}>
            {[...chats]
              .filter((c) => !blockedIds.has(c.otherUser._id) && !archivedIds.has(c.otherUser._id))
              .sort((a, b) => {
                const aPin = pinnedIds.has(a.otherUser._id)
                const bPin = pinnedIds.has(b.otherUser._id)
                if (aPin && !bPin) return -1
                if (!aPin && bPin) return 1
                return 0
              })
              .map((chat) => (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  selectedUserId={selectedUserId}
                  selectionMode={selectionMode}
                  selectedChatIds={selectedChatIds}
                  longPressedUserId={longPressedUserId}
                  cardBg={cardBg}
                  textColor={textColor}
                  borderColor={borderColor}
                  bgColor={bgColor}
                  onLongPress={handleLongPress}
                  onClick={handleChatItemClick}
                  onAvatarLongPress={(user) => setAvatarPreviewUser(user)}
                  onNicknameClick={() => openNicknameFor(chat.otherUser._id, getChatNickname(chat.otherUser._id))}
                  onDeleteClick={(e) => { e.stopPropagation(); handleDeleteChat(); setLongPressedUserId(null); }}
                  getDisplayName={getChatDisplayName}
                />
              ))}
            {chats.filter((c) => archivedIds.has(c.otherUser._id)).length > 0 && (
              <>
                <Text fontSize="xs" fontWeight="600" color={textColor} pt={4} pb={1}>Archived</Text>
                {chats
                  .filter((c) => archivedIds.has(c.otherUser._id))
                  .map((chat) => (
                    <HStack key={chat._id} w="full" p={3} borderRadius="md" _hover={{ bg: cardBg }} spacing={3}>
                      <Box flex={1} cursor="pointer" onClick={() => { onChatSelect(chat); unarchiveChat(chat.otherUser._id); refreshPrefs(); unarchiveChatApi(chat.otherUser._id).catch(() => {}); }}>
                        <HStack spacing={3}>
                          <UserAvatar userId={chat.otherUser._id} name={chat.otherUser.name} src={chat.otherUser.profileImage} size="md" />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium" color={textColor}>{getChatDisplayName(chat.otherUser._id, chat.otherUser.name)}</Text>
                            {chat.lastMessage && <Text fontSize="xs" color={textColor} noOfLines={1}>{lastMessagePreview(chat.lastMessage.content)}</Text>}
                          </VStack>
                        </HStack>
                      </Box>
                      <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); unarchiveChat(chat.otherUser._id); refreshPrefs(); toast({ title: 'Unarchived', status: 'success', duration: 2000, isClosable: true }); unarchiveChatApi(chat.otherUser._id).catch(() => {}); }}>Unarchive</Button>
                    </HStack>
                  ))}
              </>
            )}
          </VStack>
        )}
      </Box>

      {/* Nickname edit drawer */}
      <Drawer isOpen={isNicknameOpen} onClose={onNicknameClose} placement="bottom" size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Nickname</DrawerHeader>
          <DrawerBody pb={6}>
            <VStack align="stretch" spacing={4}>
              <Text fontSize="sm" color={textColor}>Display as #name in chat list. Leave empty to show original name.</Text>
              <Input
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="e.g. sanjay → #sanjay"
                size="md"
              />
              <Button colorScheme="blue" onClick={saveNickname}>Save</Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Chat Settings drawer */}
      <Drawer isOpen={isChatSettingsOpen} onClose={onChatSettingsClose} placement="bottom" size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Chat Settings</DrawerHeader>
          <DrawerBody pb={6}>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between" w="full">
                <Text fontSize="sm" color={textColor}>Close Friends</Text>
                <Switch
                  isChecked={chatSettingsUserId ? isCloseFriend(chatSettingsUserId) : false}
                  onChange={() => {
                    if (chatSettingsUserId) {
                      const added = toggleCloseFriend(chatSettingsUserId)
                      refreshPrefs()
                      toast({ title: added ? 'Added to Close Friends' : 'Removed from Close Friends', status: 'success', duration: 2000, isClosable: true })
                      toggleCloseFriendApi(chatSettingsUserId).catch(() => {})
                    }
                  }}
                />
              </HStack>
              {chatSettingsUserId && isChatCleared(chatSettingsUserId) ? (
                <Button size="sm" w="full" variant="outline" onClick={async () => { unclearChat(chatSettingsUserId); refreshPrefs(); toast({ title: 'Messages restored', status: 'success', duration: 2000, isClosable: true }); onChatSettingsClose(); await unclearChatApi(chatSettingsUserId).catch(() => {}); }}>Restore messages</Button>
              ) : (
                <Button size="sm" w="full" variant="outline" onClick={async () => { if (chatSettingsUserId) { setChatCleared(chatSettingsUserId); refreshPrefs(); toast({ title: 'Chat cleared', status: 'success', duration: 2000, isClosable: true }); onChatSettingsClose(); await setChatClearedApi(chatSettingsUserId).catch(() => {}); } }}>Clear All Chat</Button>
              )}
              <Button size="sm" w="full" variant="outline" onClick={() => { if (chatSettingsUserId) { removeChatNickname(chatSettingsUserId); refreshPrefs(); toast({ title: 'Nickname removed', status: 'success', duration: 2000, isClosable: true }); } onChatSettingsClose(); }}>Remove Nickname</Button>
              <HStack justify="space-between" w="full">
                <Text fontSize="sm" color={textColor}>Mute Notifications</Text>
                <Switch
                  isChecked={chatSettingsUserId ? isChatMuted(chatSettingsUserId) : false}
                  onChange={() => {
                    if (chatSettingsUserId) {
                      const muted = toggleMuteChat(chatSettingsUserId)
                      refreshPrefs()
                      toast({ title: muted ? 'Chat muted' : 'Chat unmuted', status: 'success', duration: 2000, isClosable: true })
                      toggleMuteApi(chatSettingsUserId).catch(() => {})
                    }
                  }}
                />
              </HStack>
              <HStack justify="space-between" w="full">
                <Text fontSize="sm" color={textColor}>Pin Chat</Text>
                <Switch
                  isChecked={chatSettingsUserId ? isChatPinned(chatSettingsUserId) : false}
                  onChange={() => {
                    if (chatSettingsUserId) {
                      const pinned = togglePinChat(chatSettingsUserId)
                      refreshPrefs()
                      toast({ title: pinned ? 'Chat pinned' : 'Chat unpinned', status: 'success', duration: 2000, isClosable: true })
                      togglePinApi(chatSettingsUserId).catch(() => {})
                    }
                  }}
                />
              </HStack>
              <HStack justify="space-between" w="full">
                <Text fontSize="sm" color={textColor}>Block</Text>
                <Switch
                  isChecked={chatSettingsUserId ? isUserBlocked(chatSettingsUserId) : false}
                  onChange={() => {
                    if (chatSettingsUserId) {
                      const blocked = toggleBlockUser(chatSettingsUserId)
                      refreshPrefs()
                      toast({ title: blocked ? 'User blocked' : 'User unblocked', status: 'success', duration: 2000, isClosable: true })
                      onChatSettingsClose()
                      toggleBlockApi(chatSettingsUserId).catch(() => {})
                    }
                  }}
                />
              </HStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* New group name modal */}
      <Modal isOpen={isGroupOpen} onClose={() => { onGroupClose(); setGroupName(''); }}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>New group</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} size="md" />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={2} onClick={() => { onGroupClose(); setGroupName(''); }}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSaveGroup}>Create group</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AvatarZoomPreview
        isOpen={!!avatarPreviewUser}
        onClose={() => setAvatarPreviewUser(null)}
        name={avatarPreviewUser?.name}
        src={avatarPreviewUser?.profileImage}
      />
    </Box>
  )
}

export default ChatListPanel
