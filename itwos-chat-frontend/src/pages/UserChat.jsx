import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  useToast,
  Spinner,
  Center,
  VStack,
  HStack,
  Image,
  useDisclosure,
  Button,
  List,
  ListItem,
} from '@chakra-ui/react'
import { Mic, File, ExternalLink, Download } from 'lucide-react'
import VoiceMessageBubble from '../components/UserChat/VoiceMessageBubble'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useGetUserChatsQuery,
  useGetOrCreateChatQuery,
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
  useDeleteMessageMutation,
  useDeleteChatMutation,
  useGetChatSettingsQuery,
  useUpdateChatSettingsMutation,
  useGetChatThemesQuery,
  useCreateChatThemeOrderMutation,
  useVerifyChatThemePaymentMutation,
  useGetUserFriendsQuery,
  useGetUserSuggestionsQuery,
  useGetCurrentUserQuery,
  useUpdateUserProfileMutation,
  useUnclearChatMutation,
  userApi,
} from '../store/api/userApi'
import { useDispatch } from 'react-redux'
import { getSocket } from '../utils/socket'
import { getUserInfo } from '../utils/auth'
import { getApiUrl } from '../utils/apiUrl'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import {
  ChatListPanel,
  ChatConversation,
  ChatDrawers,
} from '../components/UserChat'
import { isChatCleared, unclearChat } from '../utils/chatListPrefs'

// Rich card bubble (JioMart-style): hero image, headline, description, list, CTA button
function RichCardBubble({ imageUrl, title, description, buttonLabel, buttonUrl, items = [] }) {
  const cardBg = useColorModeValue('gray.200', 'gray.700')
  const cardBorder = useColorModeValue('gray.300', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const subColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <Box
      maxW="320px"
      borderRadius="16px"
      overflow="hidden"
      bg={cardBg}
      borderWidth="1px"
      borderColor={cardBorder}
      boxShadow="md"
    >
      {imageUrl && (
        <Box w="100%" h="160px" overflow="hidden" flexShrink={0}>
          <Image
            src={imageUrl}
            alt=""
            w="100%"
            h="100%"
            objectFit="cover"
          />
        </Box>
      )}
      <VStack align="stretch" p={3} spacing={2}>
        {title && (
          <Text fontWeight="bold" fontSize="md" color={textColor} lineHeight="tight">
            {title}
          </Text>
        )}
        {description && (
          <Text fontSize="sm" color={subColor} noOfLines={2}>
            {description}
          </Text>
        )}
        {items?.length > 0 && (
          <List spacing={0.5} fontSize="sm" color={subColor} listStyleType="disc" pl={2}>
            {items.slice(0, 5).map((item, i) => (
              <ListItem key={i}>{item}</ListItem>
            ))}
          </List>
        )}
        {buttonLabel && buttonUrl && (
          <Button
            as="a"
            href={buttonUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            colorScheme="blue"
            rightIcon={<ExternalLink size={14} />}
            mt={1}
            w="fit-content"
          >
            {buttonLabel}
          </Button>
        )}
      </VStack>
    </Box>
  )
}

// iMessage-style image bubble: image is the bubble, no grey wrapper
function IOSImageBubble({ attachments }) {
  const count = attachments.length

  if (count === 1) {
    return (
      <Box
        borderRadius="16px"
        overflow="hidden"
        maxW="260px"
        maxH="320px"
      >
        <Image
          src={attachments[0].url}
          alt={attachments[0].name || 'Image'}
          w="100%"
          h="100%"
          objectFit="cover"
        />
      </Box>
    )
  }

  const visibleCount = count > 4 ? 4 : count
  const extraCount = count > 4 ? count - 3 : 0

  return (
    <Box
      display="grid"
      gridTemplateColumns="1fr 1fr"
      gridTemplateRows={visibleCount === 2 ? '150px' : '75px 75px'}
      gap="3px"
      borderRadius="16px"
      overflow="hidden"
      maxW="260px"
      maxH="180px"
    >
      {attachments.slice(0, visibleCount).map((img, index) => {
        const isOverlayTile = extraCount > 0 && index === 3
        return (
          <Box key={index} overflow="hidden" position="relative">
            <Image
              src={img.url}
              alt={img.name || 'Image'}
              w="100%"
              h="100%"
              objectFit="cover"
            />
            {isOverlayTile && (
              <>
                <Box
                  position="absolute"
                  inset={0}
                  bg="blackAlpha.700"
                />
                <Center
                  position="absolute"
                  inset={0}
                  color="white"
                  fontSize="2xl"
                  fontWeight="bold"
                >
                  +{extraCount}
                </Center>
              </>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

const UserChat = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const bgColor = useColorModeValue('white', 'gray.800')
  const cardBg = useColorModeValue('gray.50', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const topLeftGradient = useColorModeValue(
    'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.06) 40%, transparent 70%)',
    'linear-gradient(135deg, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.08) 40%, transparent 70%)'
  )
  const toast = useToast()
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const messageInputRef = useRef(null)
  const userInfo = getUserInfo()
  const currentUserId = userInfo?.id
  const typingTimeoutRef = useRef(null)
  const messageRef = useRef('')
  const currentChatRef = useRef(null)
  const isSendingRef = useRef(false)
  const backNavigateRef = useRef(false)

  const [message, setMessage] = useState('')
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [selectedUserId, setSelectedUserId] = useState(userId || null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previewImages, setPreviewImages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [typingUsers, setTypingUsers] = useState({})
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [privacySettings, setPrivacySettings] = useState({
    hideLastSeen: false,
    hideOnlineStatus: false,
  })

  const { data: chatsData, isLoading: chatsLoading, refetch: refetchChats } =
    useGetUserChatsQuery()
  const { data: friendsData } = useGetUserFriendsQuery()
  const { data: suggestionsData } = useGetUserSuggestionsQuery({ limit: 10 })
  const { data: chatData, isLoading: chatLoading, error: chatError, refetch: refetchChat } =
    useGetOrCreateChatQuery(selectedUserId, { skip: !selectedUserId })
  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
    isError: messagesError,
  } = useGetChatMessagesQuery(
    {
      chatId: selectedChatId || chatData?.data?._id,
      page: 1,
      limit: 100,
    },
    { skip: !selectedChatId && !chatData?.data?._id }
  )
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation()
  const [deleteMessage, { isLoading: isDeleting }] = useDeleteMessageMutation()
  const [deleteChat, { isLoading: isDeletingChat }] = useDeleteChatMutation()
  const [markAsRead] = useMarkMessagesAsReadMutation()
  const chatIdForSettings = selectedChatId || chatData?.data?._id
  const { data: chatSettingsData } = useGetChatSettingsQuery(chatIdForSettings, {
    skip: !chatIdForSettings,
  })
  const [updateChatSettings] = useUpdateChatSettingsMutation()
  const { data: chatThemesData } = useGetChatThemesQuery()
  const [createChatThemeOrder, { isLoading: isCreatingThemeOrder }] =
    useCreateChatThemeOrderMutation()
  const [verifyChatThemePayment, { isLoading: isVerifyingThemePayment }] =
    useVerifyChatThemePaymentMutation()
  const isPurchasingTheme = isCreatingThemeOrder || isVerifyingThemePayment
  const themes = chatThemesData?.data ?? []
  const { data: currentUserData } = useGetCurrentUserQuery()
  const [updateProfile, { isLoading: isUpdatingSettings }] =
    useUpdateUserProfileMutation()

  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } =
    useDisclosure()
  const {
    isOpen: isChatThemeOpen,
    onOpen: onChatThemeOpen,
    onClose: onChatThemeClose,
  } = useDisclosure()

  const chats = chatsData?.data || []
  const friends = friendsData?.data || []
  const suggestions = suggestionsData?.data || []
  const messages = messagesData?.data || []
  // Normal response has chat in data; private-account response is { success, privateAccount, message } (no data)
  const currentChat = chatData?.data ?? (chatData?.privateAccount ? chatData : undefined)

  useEffect(() => {
    messageRef.current = message
  }, [message])
  useEffect(() => {
    currentChatRef.current = currentChat
  }, [currentChat])
  useEffect(() => {
    const userResponse =
      currentUserData?.data ||
      (currentUserData?.success ? currentUserData.data : null)
    if (userResponse?.privacySettings) {
      setPrivacySettings({
        hideLastSeen: userResponse.privacySettings.hideLastSeen || false,
        hideOnlineStatus: userResponse.privacySettings.hideOnlineStatus || false,
      })
    }
  }, [currentUserData])
  useEffect(() => {
    if (currentChat?._id) {
      setSelectedChatId(currentChat._id)
      markAsRead(currentChat._id)
    }
  }, [currentChat, markAsRead])
  useEffect(() => {
    if (userId && userId !== selectedUserId) {
      setSelectedUserId(userId)
    }
  }, [userId])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (chatError) {
      const isPrivateLocked = chatError?.status === 403 || chatError?.originalStatus === 403
      if (isPrivateLocked) {
        // Stay on chat route and show Instagram-style locked screen; no toast, no redirect
        return
      }
      const errorMessage =
        chatError?.data?.message || chatError?.message || 'Failed to load chat'
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [chatError, toast])

  const {
    isRecording,
    isSupported: isAudioSupported,
    error: audioError,
    audioBlob,
    audioUrl,
    recordingDuration,
    isProcessing,
    startRecording,
    stopRecording,
    clearRecording,
    getAudioFile,
    waitForAudioBlob,
    formatDuration,
  } = useAudioRecorder()

  useEffect(() => {
    if (audioError) {
      toast({
        title: 'Audio Recording Error',
        description: audioError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [audioError, toast])
  useEffect(() => {
    return () => {
      if (isRecording) stopRecording()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const handleNewMessage = (data) => {
      const activeChatId = selectedChatId || currentChat?._id
      const isCurrentChat = data.chatId === activeChatId
      if (data.message) {
        try {
          dispatch(
            userApi.util.updateQueryData(
              'getChatMessages',
              { chatId: data.chatId, page: 1, limit: 100 },
              (draft) => {
                let messagesArray = []
                if (draft?.data) messagesArray = draft.data
                else if (draft?.success?.data) messagesArray = draft.success.data
                else if (Array.isArray(draft)) messagesArray = draft
                const messageExists = messagesArray.some(
                  (msg) => msg._id === data.message._id
                )
                if (!messageExists) {
                  const newMessage = { ...data.message }
                  if (
                    isCurrentChat &&
                    newMessage.receiver?._id?.toString() === currentUserId?.toString()
                  ) {
                    newMessage.isRead = true
                    newMessage.status = 'read'
                    socket.emit('message-read', {
                      messageId: newMessage._id,
                      chatId: data.chatId,
                    })
                  }
                  if (draft?.data) draft.data = [newMessage, ...draft.data]
                  else if (draft?.success?.data)
                    draft.success.data = [newMessage, ...draft.success.data]
                  else if (Array.isArray(draft)) draft.unshift(newMessage)
                  else draft.data = [newMessage]
                }
              }
            )
          )
          dispatch(
            userApi.util.updateQueryData('getUserChats', undefined, (draft) => {
                const chats = draft?.data || draft?.success?.data || []
              const chatIndex = chats.findIndex((chat) => chat._id === data.chatId)
                if (chatIndex !== -1) {
                  const chat = chats[chatIndex]
                  chat.lastMessage = data.message
                  chat.lastMessageAt = data.message.createdAt || new Date()
                if (isCurrentChat) chat.unreadCount = 0
                else if (
                  data.message.receiver?._id?.toString() ===
                  currentUserId?.toString()
                )
                    chat.unreadCount = (chat.unreadCount || 0) + 1
                  chats.splice(chatIndex, 1)
                  chats.unshift(chat)
                if (draft?.data) draft.data = chats
                else if (draft?.success?.data) draft.success.data = chats
              } else refetchChats()
            })
          )
        } catch (error) {
          if (isCurrentChat) refetchMessages()
          refetchChats()
        }
        if (
          isCurrentChat &&
          data.message._id &&
          data.message.receiver?._id?.toString() === currentUserId?.toString()
        ) {
          socket.emit('message-delivered', {
            messageId: data.message._id,
            chatId: data.chatId,
          })
          socket.emit('message-read', {
            messageId: data.message._id,
            chatId: data.chatId,
          })
        }
      }
    }
    const handleMessageStatusUpdate = (data) => {
      const chatId = data.chatId || selectedChatId
      if (chatId && data.messageId) {
        try {
          dispatch(
            userApi.util.updateQueryData(
              'getChatMessages',
              { chatId, page: 1, limit: 100 },
              (draft) => {
                const messagesArray = draft?.data || draft?.success?.data || []
                const msg = messagesArray.find((m) => m._id === data.messageId)
                if (msg && data.status) {
                  msg.status = data.status
                  if (data.status === 'read') msg.isRead = true
                }
              }
            )
          )
        } catch (_) {}
      }
      refetchMessages()
    }
    socket.on('new-message', handleNewMessage)
    socket.on('message-status-updated', handleMessageStatusUpdate)
    return () => {
      socket.off('new-message', handleNewMessage)
      socket.off('message-status-updated', handleMessageStatusUpdate)
    }
  }, [
    selectedChatId,
    currentChat,
    refetchMessages,
    refetchChats,
    currentUserId,
    dispatch,
  ])

  useEffect(() => {
    if (!selectedChatId || messages.length === 0) return
      const socket = getSocket()
    if (!socket) return
        const unreadMessages = messages.filter(
      (msg) =>
        msg.receiver?._id?.toString() === currentUserId?.toString() &&
                  msg.status !== 'read' && 
                  !msg.isRead
        )
        if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        socket.emit('message-read', { messageId: msg._id, chatId: selectedChatId })
      })
          dispatch(
            userApi.util.updateQueryData(
              'getChatMessages',
              { chatId: selectedChatId, page: 1, limit: 100 },
              (draft) => {
            const arr = draft?.data || draft?.success?.data || []
            arr.forEach((m) => {
              if (m.receiver?._id?.toString() === currentUserId?.toString()) {
                m.isRead = true
                m.status = 'read'
                  }
                })
              }
            )
          )
          dispatch(
        userApi.util.updateQueryData('getUserChats', undefined, (draft) => {
                const chats = draft?.data || draft?.success?.data || []
          const chat = chats.find((c) => c._id === selectedChatId)
          if (chat) chat.unreadCount = 0
        })
      )
          markAsRead(selectedChatId)
    }
  }, [selectedChatId, messages, currentUserId, dispatch, markAsRead])

  const handleSend = async () => {
    if (isSendingRef.current || isSending) return
    let audioFile = getAudioFile()
    if (isProcessing || (!audioFile && audioUrl)) {
      const blobReady = await waitForAudioBlob(3000)
      if (blobReady) audioFile = getAudioFile()
      else {
        toast({
          title: 'Error',
          description: 'Audio is still processing. Please wait.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        })
        return
      }
    }
    if (
      (!message.trim() && selectedFiles.length === 0 && !audioFile) ||
      !currentChat?._id
    )
      return
    isSendingRef.current = true
    const socket = getSocket()
    if (socket && currentChat?._id && isTyping) {
      const receiverId = currentChat.participants.find(
        (p) => p._id !== currentUserId
      )?._id
      setIsTyping(false)
      socket.emit('stop-typing', { chatId: currentChat._id, receiverId })
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    try {
      if (audioFile) {
        const fileId = `audio-${Date.now()}`
        setUploadingFiles((prev) => [
          ...prev,
          { id: fileId, name: 'Voice message', type: 'audio' },
        ])
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }))
        const formData = new FormData()
        formData.append('chatId', currentChat._id)
        formData.append('content', 'Voice message')
        formData.append('messageType', 'audio')
        if (replyToMessage?._id) formData.append('replyTo', replyToMessage._id)
        formData.append('file', audioFile)
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100)
            setUploadProgress((prev) => ({ ...prev, [fileId]: pct }))
          }
        })
        const response = await new Promise((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300)
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve(JSON.parse(xhr.responseText || '{}')),
              })
            else
              try {
                reject({
                  message: JSON.parse(xhr.responseText || '{}').message ||
                    'Failed',
                })
              } catch {
                reject({ message: 'Failed' })
              }
          }
          xhr.onerror = () => reject({ message: 'Network error' })
          xhr.open('POST', `${getApiUrl()}/api/user/chat/message`)
          xhr.withCredentials = true
          xhr.send(formData)
        })
        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.message || 'Failed')
        }
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId))
        setUploadProgress((prev) => {
          const next = { ...prev }
          delete next[fileId]
          return next
        })
        clearRecording()
      }
      if (selectedFiles.length > 0) {
        const filesToSend = [...selectedFiles]
        const allImages =
          filesToSend.length > 1 &&
          filesToSend.every((f) => f.type.startsWith('image/'))
        // iMessage-style: send multiple images as one message (one request, one bubble)
        if (allImages) {
          const batchId = `batch-${Date.now()}`
          setUploadingFiles((prev) => [
            ...prev,
            {
              id: batchId,
              name: `${filesToSend.length} photos`,
              type: 'image',
            },
          ])
          setUploadProgress((prev) => ({ ...prev, [batchId]: 0 }))
          const formData = new FormData()
          formData.append('chatId', currentChat._id)
          formData.append('content', 'Image')
          formData.append('messageType', 'image')
          if (replyToMessage?._id) formData.append('replyTo', replyToMessage._id)
          filesToSend.forEach((file) => formData.append('files', file))
          const xhr = new XMLHttpRequest()
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100)
              setUploadProgress((prev) => ({ ...prev, [batchId]: pct }))
            }
          })
          const response = await new Promise((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300)
                resolve({
                  ok: true,
                  json: () =>
                    Promise.resolve(JSON.parse(xhr.responseText || '{}')),
                })
              else
                try {
                  reject({
                    message:
                      JSON.parse(xhr.responseText || '{}').message || 'Failed',
                  })
                } catch {
                  reject({ message: 'Failed' })
                }
            }
            xhr.onerror = () => reject({ message: 'Network error' })
            xhr.open('POST', `${getApiUrl()}/api/user/chat/message`)
            xhr.withCredentials = true
            xhr.send(formData)
          })
          const data = await response.json()
          if (!response.ok) {
            throw new Error(data.message || 'Failed')
          }
          setUploadingFiles((prev) => prev.filter((f) => f.id !== batchId))
          setUploadProgress((prev) => {
            const next = { ...prev }
            delete next[batchId]
            return next
          })
          if (data?.data && currentChat?._id) {
            const newMsg = { ...data.data, status: 'sent' }
            dispatch(
              userApi.util.updateQueryData(
                'getChatMessages',
                { chatId: currentChat._id, page: 1, limit: 100 },
                (draft) => {
                  const list = draft?.data ?? draft?.success?.data ?? []
                  if (!list.some((m) => m._id === newMsg._id)) {
                    if (draft?.data) draft.data = [newMsg, ...draft.data]
                    else if (draft?.success?.data)
                      draft.success.data = [newMsg, ...draft.success.data]
                    else draft.data = [newMsg]
                  }
                }
              )
            )
            dispatch(
              userApi.util.updateQueryData('getUserChats', undefined, (draft) => {
                const chats = draft?.data ?? draft?.success?.data ?? []
                const idx = chats.findIndex((c) => c._id === currentChat._id)
                if (idx !== -1) {
                  const chat = {
                    ...chats[idx],
                    lastMessage: newMsg,
                    lastMessageAt: newMsg.createdAt || new Date(),
                  }
                  const next = [...chats]
                  next.splice(idx, 1)
                  next.unshift(chat)
                  if (draft?.data) draft.data = next
                  else if (draft?.success?.data) draft.success.data = next
                }
              })
            )
          }
        } else {
          for (let idx = 0; idx < filesToSend.length; idx++) {
            const file = filesToSend[idx]
            const fileId = `file-${Date.now()}-${idx}`
            let fileMessageType = 'file'
            if (file.type.startsWith('image/')) fileMessageType = 'image'
            else if (file.type.startsWith('audio/')) fileMessageType = 'audio'
            setUploadingFiles((prev) => [
              ...prev,
              { id: fileId, name: file.name, type: fileMessageType },
            ])
            setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }))
            const formData = new FormData()
            formData.append('chatId', currentChat._id)
            formData.append(
              'content',
              fileMessageType === 'image'
                ? 'Image'
                : fileMessageType === 'audio'
                  ? 'Voice message'
                  : file.name
            )
            formData.append('messageType', fileMessageType)
            if (replyToMessage?._id)
              formData.append('replyTo', replyToMessage._id)
            formData.append('file', file)
            const xhr = new XMLHttpRequest()
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100)
                setUploadProgress((prev) => ({ ...prev, [fileId]: pct }))
              }
            })
            const response = await new Promise((resolve, reject) => {
              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300)
                  resolve({
                    ok: true,
                    json: () =>
                      Promise.resolve(JSON.parse(xhr.responseText || '{}')),
                  })
                else
                  try {
                    reject({
                      message:
                        JSON.parse(xhr.responseText || '{}').message ||
                        'Failed',
                    })
                  } catch {
                    reject({ message: 'Failed' })
                  }
              }
              xhr.onerror = () => reject({ message: 'Network error' })
              xhr.open('POST', `${getApiUrl()}/api/user/chat/message`)
              xhr.withCredentials = true
              xhr.send(formData)
            })
            if (!response.ok) {
              const err = await response.json()
              throw new Error(err.message || 'Failed')
            }
            setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId))
            setUploadProgress((prev) => {
              const next = { ...prev }
              delete next[fileId]
              return next
            })
          }
        }
      }
      if (message.trim()) {
        const result = await sendMessage({
          chatId: currentChat._id,
          content: message.trim(),
          messageType: 'text',
          ...(replyToMessage?._id && { replyTo: replyToMessage._id }),
        }).unwrap()
        // Update cache immediately so sender sees their message without waiting for refetch
        if (result?.data && currentChat?._id) {
          const newMsg = { ...result.data, status: 'sent' }
          dispatch(
            userApi.util.updateQueryData(
              'getChatMessages',
              { chatId: currentChat._id, page: 1, limit: 100 },
              (draft) => {
                const list = draft?.data ?? draft?.success?.data ?? []
                if (!list.some((m) => m._id === newMsg._id)) {
                  if (draft?.data) draft.data = [newMsg, ...draft.data]
                  else if (draft?.success?.data) draft.success.data = [newMsg, ...draft.success.data]
                  else draft.data = [newMsg]
                }
              }
            )
          )
          dispatch(
            userApi.util.updateQueryData('getUserChats', undefined, (draft) => {
              const chats = draft?.data ?? draft?.success?.data ?? []
              const idx = chats.findIndex((c) => c._id === currentChat._id)
              if (idx !== -1) {
                const chat = { ...chats[idx], lastMessage: newMsg, lastMessageAt: newMsg.createdAt || new Date() }
                const next = [...chats]
                next.splice(idx, 1)
                next.unshift(chat)
                if (draft?.data) draft.data = next
                else if (draft?.success?.data) draft.success.data = next
              }
            })
          )
        }
      }
      setMessage('')
      setReplyToMessage(null)
      setSelectedFiles([])
      setPreviewImages([])
      setUploadingFiles([])
      setUploadProgress({})
      refetchMessages()
      refetchChats()
    } catch (err) {
      setUploadingFiles([])
      setUploadProgress({})
      toast({
        title: 'Error',
        description: err?.message || err?.data?.message || 'Failed to send',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      isSendingRef.current = false
      setTimeout(() => messageInputRef.current?.focus(), 0)
    }
  }

  // Instagram-style quick like: send ❤️ as reply to last received message (other person's last message)
  const getSenderId = (m) => String(m.sender?._id ?? m.sender ?? '')
  const getLastMessageFromSender = (list, senderId) => {
    const same = (list || []).filter((m) => getSenderId(m) === senderId)
    if (same.length === 0) return null
    const byNewest = [...same].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
    return byNewest[0] ?? null
  }
  const otherUserId =
    currentChat?.participants?.find((p) => String(p._id) !== String(currentUserId))?._id ??
    currentChat?.otherUser?._id
  const lastReceivedMessage = getLastMessageFromSender(messages, otherUserId)

  const handleQuickHeart = async () => {
    if (isSendingRef.current || isSending || !currentChat?._id) return
    isSendingRef.current = true
    try {
      const result = await sendMessage({
        chatId: currentChat._id,
        content: '❤️',
        messageType: 'text',
        ...(lastReceivedMessage?._id && { replyTo: lastReceivedMessage._id }),
      }).unwrap()
      if (result?.data && currentChat?._id) {
        const newMsg = { ...result.data, status: 'sent' }
        dispatch(
          userApi.util.updateQueryData(
            'getChatMessages',
            { chatId: currentChat._id, page: 1, limit: 100 },
            (draft) => {
              const list = draft?.data ?? draft?.success?.data ?? []
              if (!list.some((m) => m._id === newMsg._id)) {
                if (draft?.data) draft.data = [newMsg, ...draft.data]
                else if (draft?.success?.data) draft.success.data = [newMsg, ...draft.success.data]
                else draft.data = [newMsg]
              }
            }
          )
        )
        dispatch(
          userApi.util.updateQueryData('getUserChats', undefined, (draft) => {
            const chats = draft?.data ?? draft?.success?.data ?? []
            const idx = chats.findIndex((c) => c._id === currentChat._id)
            if (idx !== -1) {
              const chat = { ...chats[idx], lastMessage: newMsg, lastMessageAt: newMsg.createdAt || new Date() }
              const next = [...chats]
              next.splice(idx, 1)
              next.unshift(chat)
              if (draft?.data) draft.data = next
              else if (draft?.success?.data) draft.success.data = next
            }
          })
        )
      }
      refetchMessages()
      refetchChats()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.message || err?.data?.message || 'Failed to send',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      isSendingRef.current = false
    }
  }

  const handleEmojiReaction = async (targetMessage, emoji) => {
    if (isSendingRef.current || isSending || !currentChat?._id) return
    const senderId = String(
      targetMessage?.sender?._id ?? targetMessage?.sender ?? ''
    )
    const lastFromSender = getLastMessageFromSender(messages, senderId)
    const messageToReactTo = lastFromSender ?? targetMessage
    isSendingRef.current = true
    try {
      const result = await sendMessage({
        chatId: currentChat._id,
        content: emoji,
        messageType: 'text',
        ...(messageToReactTo?._id && { replyTo: messageToReactTo._id }),
      }).unwrap()
      if (result?.data && currentChat?._id) {
        const newMsg = { ...result.data, status: 'sent' }
        dispatch(
          userApi.util.updateQueryData(
            'getChatMessages',
            { chatId: currentChat._id, page: 1, limit: 100 },
            (draft) => {
              const list = draft?.data ?? draft?.success?.data ?? []
              if (!list.some((m) => m._id === newMsg._id)) {
                if (draft?.data) draft.data = [newMsg, ...draft.data]
                else if (draft?.success?.data) draft.success.data = [newMsg, ...draft.success.data]
                else draft.data = [newMsg]
              }
            }
          )
        )
        dispatch(
          userApi.util.updateQueryData('getUserChats', undefined, (draft) => {
            const chats = draft?.data ?? draft?.success?.data ?? []
            const idx = chats.findIndex((c) => c._id === currentChat._id)
            if (idx !== -1) {
              const chat = { ...chats[idx], lastMessage: newMsg, lastMessageAt: newMsg.createdAt || new Date() }
              const next = [...chats]
              next.splice(idx, 1)
              next.unshift(chat)
              if (draft?.data) draft.data = next
              else if (draft?.success?.data) draft.success.data = next
            }
          })
        )
      }
      refetchMessages()
      refetchChats()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.message || err?.data?.message || 'Failed to send',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      isSendingRef.current = false
    }
  }

  const handleChatSelect = (chat) => {
    setSelectedUserId(chat.otherUser._id)
    setSelectedChatId(chat._id)
    navigate(`/user/chat/${chat.otherUser._id}`)
  }
  const handleFriendSelect = (friend) => {
    setSelectedUserId(friend._id)
    navigate(`/user/chat/${friend._id}`)
  }
  const handleSuggestionSelect = (user) => {
    setSelectedUserId(user._id)
    navigate(`/user/chat/${user._id}`)
  }

  const handleDeleteChat = useCallback(
    async (targetUserId) => {
      const chat = chats.find((c) => c.otherUser._id === targetUserId)
      if (!chat) return
      try {
        await deleteChat(chat._id).unwrap()
        refetchChats()
        if (selectedUserId === targetUserId) {
          setSelectedUserId(null)
          setSelectedChatId(null)
          navigate('/user/chat', { replace: true })
        }
        toast({ title: 'Chat deleted', status: 'success', duration: 2000, isClosable: true })
      } catch (err) {
        toast({
          title: 'Could not delete chat',
          description: err?.data?.message || err?.message || 'Try again later',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    },
    [chats, deleteChat, refetchChats, selectedUserId, toast, navigate]
  )

  const [unclearChatApi] = useUnclearChatMutation()
  const handleRestoreChat = useCallback(() => {
    if (selectedUserId) {
      unclearChat(selectedUserId)
      refetchMessages()
      toast({ title: 'Messages restored', status: 'success', duration: 2000, isClosable: true })
      unclearChatApi(selectedUserId).catch(() => {})
    }
  }, [selectedUserId, refetchMessages, toast, unclearChatApi])

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji)
    setShowEmojiPicker(false)
  }
  const handleFileSelect = (e, type) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter((file) => {
      if (type === 'image')
        return file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
      return (
        !file.type.startsWith('image/') && file.size <= 50 * 1024 * 1024
      )
    })
    if (validFiles.length === 0) {
      toast({
        title: 'Invalid file',
        description:
          type === 'image'
            ? 'Please select a valid image (max 10MB)'
            : 'Please select a valid file (max 50MB)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    setSelectedFiles((prev) => [...prev, ...validFiles])
    if (type === 'image') {
      validFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreviewImages((prev) => [
            ...prev,
            { file, url: reader.result },
          ])
        }
        reader.readAsDataURL(file)
      })
    }
  }
  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewImages((prev) => prev.filter((_, i) => i !== index))
  }
  const handlePrivacyChange = (setting, value) => {
    setPrivacySettings((prev) => ({ ...prev, [setting]: value }))
  }
  const handleSaveSettings = async () => {
    try {
      await updateProfile({ privacySettings }).unwrap()
      toast({
        title: 'Settings saved',
        description: 'Your chat privacy settings have been updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onSettingsClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to save settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const isCryingMessage = (content) => {
    if (!content || typeof content !== 'string') return false
    const keywords = [
      'crying',
      'cry',
      'i am crying',
      "i'm crying",
      'i am cry',
      "i'm cry",
      'crying 😭',
      '😭',
    ]
    return keywords.some((k) =>
      content.toLowerCase().includes(k.toLowerCase())
    )
  }

  const renderMessageContent = (msg) => {
    // Always use the actual text field: content may be string or (if API shape differs) text/body
    let contentStr =
      typeof msg.content === 'string'
        ? msg.content
        : (msg.text != null && typeof msg.text === 'string'
          ? msg.text
          : msg.body != null && typeof msg.body === 'string'
            ? msg.body
            : '')
    // Never show raw hex/ciphertext in UI (backend should replace; this is a safeguard)
    if (typeof contentStr === 'string' && contentStr.length > 32) {
      const isAllHex = /^[a-f0-9:]+$/i.test(contentStr) && !/[\s.,!?'"]/.test(contentStr)
      const longHex = contentStr.match(/[a-f0-9]{48,}/gi)
      const mostlyHex = longHex && longHex.join('').length > contentStr.length * 0.5
      if (isAllHex || mostlyHex) contentStr = '[Message could not be decrypted]'
    }
    // Single friendly label for any decryption-failed placeholder (backend + legacy strings)
    const undecryptPlaceholders = [
      '[Encrypted message - decryption failed]',
      '[Message could not be decrypted]',
      '[Encrypted Message]',
    ]
    if (undecryptPlaceholders.includes(String(contentStr).trim())) {
      contentStr = 'Message unavailable'
    }
    if (contentStr === 'This message was deleted') {
      return (
        <Text fontStyle="italic" opacity={0.9} fontSize="sm">
          This message was deleted
        </Text>
      )
    }
    if (contentStr === 'Message unavailable') {
      return (
        <Text fontStyle="italic" opacity={0.7} fontSize="sm" color="gray.500">
          Message unavailable
        </Text>
      )
    }
    const isAudioMessage =
      msg.messageType === 'audio' ||
      (msg.messageType === 'file' &&
        msg.attachments?.length > 0 &&
       (msg.attachments[0].type === 'audio' || 
        msg.attachments[0].url?.match(/\.(webm|mp4|ogg|m4a|wav|mp3)$/i) ||
          contentStr === 'Voice message'))
    if (msg.messageType === 'image' && msg.attachments?.length > 0) {
      let card
      try {
        if (contentStr && contentStr.trim().startsWith('{')) {
          card = JSON.parse(contentStr)
        }
      } catch (_) {}
      if (card && typeof card === 'object' && (card.title || card.buttonLabel)) {
        return (
          <RichCardBubble
            imageUrl={msg.attachments[0]?.url}
            title={card.title}
            description={card.description}
            buttonLabel={card.buttonLabel}
            buttonUrl={card.buttonUrl}
            items={Array.isArray(card.items) ? card.items : card.list}
          />
        )
      }
      return <IOSImageBubble attachments={msg.attachments} />
    }
    if (isAudioMessage && msg.attachments?.length > 0) {
      return (
        <VStack spacing={1.5} align="stretch" w="100%">
          {msg.attachments.map((att, idx) => (
            <VStack key={idx} spacing={1} align="stretch" w="100%">
              <VoiceMessageBubble
                src={att.url}
                type={att.type === 'audio' ? 'audio/webm' : att.type || 'audio/webm'}
              />
              {contentStr &&
                contentStr !== 'Voice message' &&
                contentStr !== att.name && (
                <Text fontSize="xs" opacity={0.85}>{contentStr}</Text>
              )}
            </VStack>
          ))}
        </VStack>
      )
    }
    if (msg.messageType === 'file' && msg.attachments?.length > 0) {
      return (
        <VStack spacing={2} align="stretch" w="100%">
          {msg.attachments.map((att, idx) => (
            <HStack
              key={idx}
              p={3}
              bg={cardBg}
              borderRadius="12px"
              spacing={3}
              align="center"
              maxW="280px"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <Box
                p={2}
                borderRadius="10px"
                bg={cardBg}
                flexShrink={0}
              >
                <File size={22} />
              </Box>
              <VStack align="start" spacing={0} flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="600" noOfLines={2}>
                  {att.name}
                </Text>
                <Text fontSize="xs" color={textColor}>
                  Document
                </Text>
              </VStack>
              <Button
                size="xs"
                as="a"
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                aria-label="Download"
                p={1}
                minW="auto"
                h="auto"
                flexShrink={0}
              >
                <Download size={14} />
              </Button>
            </HStack>
          ))}
          {contentStr && contentStr !== msg.attachments[0]?.name && (
            <Text fontSize="sm">{contentStr}</Text>
          )}
        </VStack>
      )
    }
    return (
      <Text
        fontSize="sm"
        whiteSpace="pre-wrap"
        wordBreak="break-word"
        overflowWrap="break-word"
      >
        {contentStr}
      </Text>
    )
  }

  const onDeleteForMe = async (msg) => {
    try {
      await deleteMessage({ messageId: msg._id, deleteFor: 'me' }).unwrap()
      refetchMessages()
      refetchChats()
      toast({ title: 'Deleted for you', status: 'success', duration: 2000 })
    } catch (e) {
      toast({
        title: e?.data?.message || 'Failed to delete',
        status: 'error',
      })
    }
  }
  const onDeleteForEveryone = async (msg) => {
    try {
      await deleteMessage({
        messageId: msg._id,
        deleteFor: 'everyone',
      }).unwrap()
      refetchMessages()
      refetchChats()
      toast({
        title: 'Deleted for everyone',
        status: 'success',
        duration: 2000,
      })
    } catch (e) {
      toast({
        title: e?.data?.message || 'Failed to delete for everyone',
        status: 'error',
        duration: 4000,
      })
    }
  }

  const handleMessageChange = (e) => {
                      setMessage(e.target.value)
                      const socket = getSocket()
    if (
      socket &&
      currentChat?._id &&
      currentChat.participants?.find((p) => p._id !== currentUserId)
    ) {
      const receiverId = currentChat.participants.find(
        (p) => p._id !== currentUserId
      )?._id
                        if (!isTyping && e.target.value.trim()) {
                          setIsTyping(true)
        socket.emit('typing', { chatId: currentChat._id, receiverId })
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
                        typingTimeoutRef.current = setTimeout(() => {
                          if (isTyping) {
                            setIsTyping(false)
                            socket.emit('stop-typing', {
                              chatId: currentChat._id,
            receiverId,
                            })
                          }
                        }, 3000)
                      }
  }
  const handleMessageBlur = () => {
                      const socket = getSocket()
                      if (socket && currentChat?._id && isTyping) {
      const receiverId = currentChat.participants.find(
        (p) => p._id !== currentUserId
      )?._id
                        setIsTyping(false)
                        socket.emit('stop-typing', {
                          chatId: currentChat._id,
        receiverId,
      })
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }
  const handleInputKeyDown = (e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
      if (isSendingRef.current || isSending) return
      if (isRecording) stopRecording()
                        handleSend()
                        const socket = getSocket()
                        if (socket && currentChat?._id && isTyping) {
        const receiverId = currentChat.participants.find(
          (p) => p._id !== currentUserId
        )?._id
                          setIsTyping(false)
                          socket.emit('stop-typing', {
                            chatId: currentChat._id,
          receiverId,
        })
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }

  const onBack = useCallback(() => {
    if (backNavigateRef.current) return
    backNavigateRef.current = true
    setSelectedUserId(null)
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/user/chat', { replace: true })
    }
    setTimeout(() => { backNavigateRef.current = false }, 500)
  }, [navigate])

  if (chatsLoading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" colorScheme="brand" />
      </Center>
    )
  }

  return (
    <>
    <Flex
        direction="row"
        w="100%"
        maxW="100%"
        h="100%"
        minH={0}
        maxH="100%"
        overflow="hidden"
          sx={{
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          /* no paddingTop here — ChatConversation header owns top safe area only */
          overflowX: 'hidden',
          overflowY: 'hidden',
        }}
      >
        <Box
          display={{
            base: selectedUserId ? 'none' : 'flex',
            md: 'flex',
          }}
          w={{ base: '100%', md: '320px' }}
          minW={{ base: undefined, md: '320px' }}
          flexShrink={0}
          flexDirection="column"
          h="100%"
          minH={0}
          overflow="hidden"
          position="relative"
        >
          <Box
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="280px"
            bg={topLeftGradient}
            pointerEvents="none"
            zIndex={0}
          />
          <ChatListPanel
            chats={chats}
            friends={friends}
            suggestions={suggestions}
            selectedUserId={selectedUserId}
            onChatSelect={handleChatSelect}
            onFriendSelect={handleFriendSelect}
            onSuggestionSelect={handleSuggestionSelect}
            onSettingsOpen={onSettingsOpen}
            onDeleteChat={handleDeleteChat}
            navigate={navigate}
            bgColor={bgColor}
            cardBg={cardBg}
            textColor={textColor}
            borderColor={borderColor}
          />
              </Box>

        <Box
                flex={1}
          minW={0}
          display={{
            base: selectedUserId ? 'flex' : 'none',
            md: 'flex',
          }}
          flexDirection="column"
          h="100%"
          minH={0}
          overflow="hidden"
          overflowX="hidden"
          bg={bgColor}
          w="100%"
          maxW="100%"
        >
          <ChatConversation
            selectedUserId={selectedUserId}
            currentChat={currentChat}
            messages={messages}
            chatLoading={chatLoading}
            messagesLoading={messagesLoading}
            currentUserId={currentUserId}
            chatSettingsData={chatSettingsData}
            borderColor={borderColor}
            cardBg={cardBg}
            textColor={textColor}
            bgColor={bgColor}
            replyToMessage={replyToMessage}
            setReplyToMessage={setReplyToMessage}
            message={message}
            onMessageChange={handleMessageChange}
            onMessageBlur={handleMessageBlur}
            onInputKeyDown={handleInputKeyDown}
            messageInputRef={messageInputRef}
            messagesEndRef={messagesEndRef}
            fileInputRef={fileInputRef}
            imageInputRef={imageInputRef}
            handleSend={handleSend}
            onQuickHeart={handleQuickHeart}
            onEmojiReaction={handleEmojiReaction}
            handleFileSelect={handleFileSelect}
            isSending={isSending}
            isSendingRef={isSendingRef}
            selectedFiles={selectedFiles}
            previewImages={previewImages}
            removeFile={removeFile}
            uploadingFiles={uploadingFiles}
            uploadProgress={uploadProgress}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            onEmojiClick={handleEmojiClick}
            isRecording={isRecording}
            startRecording={startRecording}
            stopRecording={stopRecording}
            isAudioSupported={isAudioSupported}
            formatDuration={formatDuration}
            recordingDuration={recordingDuration}
            audioUrl={audioUrl}
            clearRecording={clearRecording}
            isProcessing={isProcessing}
            audioBlob={audioBlob}
            onDeleteForMe={onDeleteForMe}
            onDeleteForEveryone={onDeleteForEveryone}
            onChatThemeOpen={onChatThemeOpen}
            typingUsers={typingUsers}
            selectedChatId={selectedChatId}
            renderMessageContent={renderMessageContent}
            isCryingMessage={isCryingMessage}
            onBack={onBack}
            isChatCleared={selectedUserId ? isChatCleared(selectedUserId) : false}
            onRestoreChat={handleRestoreChat}
            chatError={chatError}
            refetchChat={refetchChat}
            messagesError={messagesError}
            onRetryMessages={refetchMessages}
            onViewProfile={(id) => navigate(`/user/profile/${id}`)}
          />
              </Box>
    </Flex>

    <ChatDrawers
        isSettingsOpen={isSettingsOpen}
        onSettingsClose={onSettingsClose}
        privacySettings={privacySettings}
        handlePrivacyChange={handlePrivacyChange}
        handleSaveSettings={handleSaveSettings}
        isUpdatingSettings={isUpdatingSettings}
        isChatThemeOpen={isChatThemeOpen}
        onChatThemeClose={onChatThemeClose}
        themes={themes}
        chatSettingsData={chatSettingsData}
        chatIdForSettings={chatIdForSettings}
        updateChatSettings={updateChatSettings}
        createChatThemeOrder={createChatThemeOrder}
        verifyChatThemePayment={verifyChatThemePayment}
        isPurchasingTheme={isPurchasingTheme}
        textColor={textColor}
        cardBg={cardBg}
        toast={toast}
      />
    </>
  )
}

export default UserChat
