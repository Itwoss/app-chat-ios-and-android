import {
  VStack,
  HStack,
  Flex,
  Text,
  Box,
  Avatar,
  Button,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
  Center,
  Badge,
  IconButton,
  Tooltip,
  Card,
  CardBody,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react'
import { UserPlus, Users, UserCheck, UserX, X, Check, MessageCircle, Lock, Globe, MapPin, Search, ChevronLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import {
  useGetUserSuggestionsQuery,
  useGetUsersNearYouQuery,
  useGetFriendRequestsQuery,
  useGetUserFriendsQuery,
  useSendFriendRequestMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useCancelFriendRequestMutation,
  useUnfriendMutation,
} from '../store/api/userApi'
import UserAvatar from '../components/User/UserAvatar'
import UserName from '../components/User/UserName'
import UserCard from '../components/User/UserCard'
import VerifiedBadge from '../components/VerifiedBadge/VerifiedBadge'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { useNavigate } from 'react-router-dom'
import { getSocket } from '../utils/socket'

const UserFriends = () => {
  const bgColor = useColorModeValue('#F2F2F7', '#0c0c0c')
  const cardBg = useColorModeValue('#FFFFFF', '#171717')
  const textColor = useColorModeValue('#1a1a1a', 'rgba(255, 255, 255, 0.95)')
  const subtextColor = useColorModeValue('rgba(0, 0, 0, 0.55)', 'rgba(255, 255, 255, 0.55)')
  const borderColor = useColorModeValue('rgba(0, 0, 0, 0.08)', 'rgba(255, 255, 255, 0.08)')
  const borderColorHover = useColorModeValue('rgba(0, 0, 0, 0.12)', 'rgba(255, 255, 255, 0.12)')
  const rowHoverBg = useColorModeValue('rgba(0, 0, 0, 0.04)', 'rgba(255, 255, 255, 0.06)')
  const backBtnHoverBg = useColorModeValue('blackAlpha.100', 'whiteAlpha.100')
  const inputBg = useColorModeValue('rgba(0, 0, 0, 0.04)', 'rgba(255, 255, 255, 0.06)')
  const inputPlaceholder = useColorModeValue('rgba(0, 0, 0, 0.45)', 'rgba(255, 255, 255, 0.45)')
  const toast = useToast()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: suggestionsData, isLoading: suggestionsLoading, refetch: refetchSuggestions } = useGetUserSuggestionsQuery({ limit: 20 })
  const { data: nearYouData, isLoading: nearYouLoading, refetch: refetchNearYou } = useGetUsersNearYouQuery({ limit: 20 })
  const { data: receivedRequestsData, isLoading: receivedLoading, refetch: refetchReceived } = useGetFriendRequestsQuery('received')
  const { data: sentRequestsData, isLoading: sentLoading, refetch: refetchSent } = useGetFriendRequestsQuery('sent')
  const { data: friendsData, isLoading: friendsLoading, refetch: refetchFriends } = useGetUserFriendsQuery()

  const [sendRequest] = useSendFriendRequestMutation()
  const [followUser] = useFollowUserMutation()
  const [unfollowUser] = useUnfollowUserMutation()
  const [acceptRequest] = useAcceptFriendRequestMutation()
  const [rejectRequest] = useRejectFriendRequestMutation()
  const [cancelRequest] = useCancelFriendRequestMutation()
  const [unfriend] = useUnfriendMutation()

  const suggestions = suggestionsData?.data || []
  const nearYou = nearYouData?.data || []
  const receivedRequests = receivedRequestsData?.data || []
  const sentRequests = sentRequestsData?.data || []
  const friends = friendsData?.data || []

  const handleSendRequest = async (userId, accountType) => {
    try {
      if (accountType === 'public') {
        // For public accounts, follow directly
        const result = await followUser(userId).unwrap()
        if (result.isMutualFollow) {
          // Check if it's "Already following" message
          if (result.message?.includes('Already following')) {
            // Silently refresh data - already following/friends
            refetchFriends()
            refetchSuggestions()
            refetchNearYou()
            return
          }
          toast({
            title: 'You are now friends!',
            description: 'You both follow each other - you\'re now friends!',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
          // Refresh both friends list and suggestions
          refetchFriends()
      refetchNearYou()
          refetchSuggestions()
        } else {
          toast({
            title: 'Following',
            description: 'You are now following this user',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        }
          refetchSuggestions()
        refetchNearYou()
      } else {
        // For private accounts, send friend request
        await sendRequest({ toUserId: userId }).unwrap()
        toast({
          title: 'Request sent',
          description: 'Friend request sent successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        refetchSent()
      }
      refetchSuggestions()
      refetchNearYou()
    } catch (err) {
      // Handle "Already friends" or "Already following" errors gracefully
      if (err?.data?.message?.includes('Already friends') || 
          err?.data?.message?.includes('already following') ||
          err?.data?.message?.includes('Already following')) {
        // Silently refresh data - user is already friends/following
        refetchFriends()
        refetchSuggestions()
        refetchNearYou()
        return
      }
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to send request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleAccept = async (requestId) => {
    try {
      const result = await acceptRequest(requestId).unwrap()
      toast({
        title: result.isMutualFollow ? 'You are now friends!' : 'Request accepted',
        description: result.isMutualFollow 
          ? 'You both follow each other - you\'re now friends!'
          : 'Friend request accepted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      refetchReceived()
      refetchFriends()
      refetchNearYou()
      refetchSuggestions()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to accept request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleReject = async (requestId) => {
    try {
      await rejectRequest(requestId).unwrap()
      toast({
        title: 'Request rejected',
        description: 'Friend request rejected',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      refetchReceived()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to reject request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleCancel = async (requestId) => {
    try {
      await cancelRequest(requestId).unwrap()
      toast({
        title: 'Request cancelled',
        description: 'Friend request cancelled',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      refetchSent()
      refetchSuggestions()
      refetchNearYou()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to cancel request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleUnfriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to unfriend this user?')) return

    try {
      await unfriend(friendId).unwrap()
      toast({
        title: 'Unfriended',
        description: 'User unfriended successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      refetchFriends()
      refetchNearYou()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to unfriend',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Filter users based on search query
  const filterUsers = (users) => {
    if (!searchQuery.trim()) return users
    const query = searchQuery.toLowerCase()
    return users.filter(user => 
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.username?.toLowerCase().includes(query)
    )
  }

  const filteredFriends = filterUsers(friends)
  const filteredSuggestions = filterUsers(suggestions)
  const filteredNearYou = filterUsers(nearYou)
  const filteredReceivedRequests = filterUsers(receivedRequests)
  const filteredSentRequests = filterUsers(sentRequests)

  // Calculate total pending requests (only received requests count as notifications)
  const pendingRequestsCount = receivedRequests.length

  // Listen for real-time friend request updates via Socket.IO
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleFriendRequestReceived = (data) => {
      // Refetch received requests when a new friend request is received
      refetchReceived()
    }

    const handleNewNotification = (notification) => {
      // If it's a friend request notification, refetch received requests
      if (notification.type === 'friend_request') {
        refetchReceived()
      }
    }

    socket.on('friend-request-received', handleFriendRequestReceived)
    socket.on('new-notification', handleNewNotification)

    return () => {
      socket.off('friend-request-received', handleFriendRequestReceived)
      socket.off('new-notification', handleNewNotification)
    }
  }, [refetchReceived])

  return (
    <VStack
      spacing={0}
      align="stretch"
      px={{ base: 0, md: 0 }}
      sx={{
        paddingTop: { base: 'max(12px, env(safe-area-inset-top, 0px))', md: 0 },
        paddingBottom: { base: 'env(safe-area-inset-bottom, 0px)', md: 0 },
      }}
    >
      {/* Header: back + search in title place (no separate Friends title) */}
      <Box px={{ base: 3, md: 0 }} pb={3}>
        <HStack spacing={1} align="center">
          <IconButton
            aria-label="Back"
            icon={<ChevronLeft size={20} />}
            variant="ghost"
            size="sm"
            color={textColor}
            flexShrink={0}
            ml={{ base: -2, md: 0 }}
            onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/user/home') }}
            _hover={{ bg: backBtnHoverBg }}
            sx={{ touchAction: 'manipulation' }}
          />
          <InputGroup size="sm" flex={1}>
            <InputLeftElement pointerEvents="none" height="8" pl={2}>
              <Box as="span" color={inputPlaceholder} display="inline-flex">
                <Search size={14} />
              </Box>
            </InputLeftElement>
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg={inputBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="full"
              color={textColor}
              _placeholder={{ color: inputPlaceholder }}
              _focus={{ borderColor: borderColorHover, boxShadow: 'none' }}
              _hover={{ borderColor: borderColorHover }}
              fontSize="sm"
              height="8"
              pl={8}
              overflow="hidden"
              textOverflow="ellipsis"
            />
          </InputGroup>
          {pendingRequestsCount > 0 && (
            <Badge
              bg="rgba(59, 130, 246, 0.15)"
              color="blue.500"
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="md"
              fontWeight="600"
              flexShrink={0}
            >
              {pendingRequestsCount}
            </Badge>
          )}
        </HStack>
      </Box>

      <Tabs index={activeTab} onChange={setActiveTab} variant="unstyled" size="sm">
        {/* Tabs below search, horizontal; Requests icon-only on the right */}
        <TabList
          px={{ base: 3, md: 0 }}
          pt={0}
          pb={2}
          borderBottom="1px solid"
          borderColor={borderColor}
          mb={2}
          gap={0}
          display="flex"
          flexDirection="row"
          flexWrap="nowrap"
          alignItems="center"
          overflowX="auto"
          sx={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}
        >
          <Tab
            color={subtextColor}
            _selected={{ color: textColor, borderColor: 'blue.500', borderBottomWidth: '2px' }}
            fontSize={{ base: 'xs', md: 'sm' }}
            px={{ base: 2, md: 3 }}
            py={2}
            whiteSpace="nowrap"
            minW="fit-content"
            flex="0 0 auto"
            justifyContent="center"
            borderBottomWidth="2px"
            borderColor="transparent"
          >
            <HStack spacing={1.5} justify="center">
              <Users size={12} />
              <Text noOfLines={1}>Friends ({filteredFriends.length})</Text>
            </HStack>
          </Tab>
          <Tab
            color={subtextColor}
            _selected={{ color: textColor, borderColor: 'blue.500', borderBottomWidth: '2px' }}
            fontSize={{ base: 'xs', md: 'sm' }}
            px={{ base: 2, md: 3 }}
            py={2}
            whiteSpace="nowrap"
            minW="fit-content"
            flex="0 0 auto"
            justifyContent="center"
            borderBottomWidth="2px"
            borderColor="transparent"
          >
            <HStack spacing={1.5} justify="center">
              <UserPlus size={12} />
              <Text noOfLines={1}>Suggestions ({filteredSuggestions.length})</Text>
            </HStack>
          </Tab>
          <Tab
            color={subtextColor}
            _selected={{ color: textColor, borderColor: 'blue.500', borderBottomWidth: '2px' }}
            fontSize={{ base: 'xs', md: 'sm' }}
            px={{ base: 2, md: 3 }}
            py={2}
            whiteSpace="nowrap"
            minW="fit-content"
            flex="0 0 auto"
            justifyContent="center"
            borderBottomWidth="2px"
            borderColor="transparent"
          >
            <HStack spacing={1.5} justify="center">
              <MapPin size={12} />
              <Text noOfLines={1}>Near You ({filteredNearYou.length})</Text>
            </HStack>
          </Tab>
          <Tab
            ml="auto"
            color={filteredReceivedRequests.length > 0 ? 'blue.400' : subtextColor}
            _selected={{
              color: filteredReceivedRequests.length > 0 ? 'blue.400' : textColor,
              borderColor: 'blue.500',
              borderBottomWidth: '2px',
            }}
            fontSize={{ base: 'xs', md: 'sm' }}
            px={2}
            py={2}
            flex="0 0 auto"
            justifyContent="center"
            borderBottomWidth="2px"
            borderColor="transparent"
            title={`Requests (${filteredReceivedRequests.length + filteredSentRequests.length})`}
          >
            <UserCheck size={16} />
          </Tab>
        </TabList>

      <Box
        p={{ base: 3, md: 4 }}
        px={{ base: 3, md: 4 }}
        borderRadius={{ base: 0, md: '16px' }}
        borderWidth="1px"
        borderColor={borderColor}
        borderLeftWidth={{ base: 0, md: 1 }}
        borderRightWidth={{ base: 0, md: 1 }}
        bg={useColorModeValue('white', 'rgba(23, 23, 23, 0.6)')}
        flex={1}
        w="100%"
        sx={{
          '@media (max-width: 767px)': {
            paddingLeft: 'max(12px, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(12px, env(safe-area-inset-right, 0px))',
          },
        }}
      >
            <TabPanels>
              {/* Friends Tab */}
              <TabPanel px={0} pt={4} pb={0}>
                {friendsLoading ? (
                  <Center minH="160px">
                    <Spinner size="lg" color={textColor} />
                  </Center>
                ) : filteredFriends.length === 0 ? (
                  <EmptyState
                    title="No Friends Yet"
                    description="Start adding friends to see them here"
                  />
                ) : (
                  <VStack spacing={0} align="stretch">
                    {filteredFriends.map((friend) => (
                        <Flex
                          key={friend._id}
                          align="center"
                          justify="space-between"
                          py={2}
                          px={1}
                          gap={2}
                          _hover={{ bg: rowHoverBg }}
                          borderRadius="md"
                          cursor="pointer"
                          borderBottom="1px solid"
                          borderColor={borderColor}
                          _last={{ borderBottom: 'none' }}
                          onClick={() => navigate(`/user/profile/${friend._id}`)}
                        >
                          <HStack flex={1} minW={0} spacing={2.5}>
                            <UserAvatar
                              userId={friend._id}
                              name={friend.name}
                              src={friend.profileImage}
                              size="sm"
                              subscription={friend.subscription}
                            />
                            <VStack align="flex-start" spacing={0} flex={1} minW={0}>
                              <UserName
                                userId={friend._id}
                                name={friend.name}
                                subscription={friend.subscription}
                                fontSize="sm"
                                fontWeight="600"
                                color={textColor}
                                noOfLines={1}
                                _hover={{ textDecoration: 'none' }}
                              />
                            </VStack>
                          </HStack>
                          <HStack spacing={1.5} flexShrink={0} onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="xs"
                              bg="blue.500"
                              color="white"
                              leftIcon={<MessageCircle size={12} />}
                              onClick={() => navigate(`/user/chat/${friend._id}`)}
                              fontSize="xs"
                              _hover={{ bg: 'blue.600' }}
                            >
                              Message
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              color="red.500"
                              onClick={() => handleUnfriend(friend._id)}
                              fontSize="xs"
                              _hover={{ bg: 'red.50' }}
                            >
                              Unfriend
                            </Button>
                          </HStack>
                        </Flex>
                    ))}
                  </VStack>
                )}
              </TabPanel>

              {/* Suggestions Tab */}
              <TabPanel px={0} pt={4} pb={0}>
                {suggestionsLoading ? (
                  <Center minH="160px">
                    <Spinner size="lg" color={textColor} />
                  </Center>
                ) : filteredSuggestions.length === 0 ? (
                  <EmptyState
                    title={searchQuery ? "No Suggestions Found" : "No Suggestions"}
                    description={searchQuery ? `No suggestions match "${searchQuery}"` : "No user suggestions available at the moment"}
                  />
                ) : (
                  <VStack spacing={0} align="stretch">
                    {filteredSuggestions.map((user) => (
                      <Flex
                        key={user._id}
                        align="center"
                        justify="space-between"
                        py={2}
                        px={1}
                        gap={2}
                        _hover={{ bg: rowHoverBg }}
                        borderRadius="md"
                        cursor="pointer"
                        borderBottom="1px solid"
                        borderColor={borderColor}
                        _last={{ borderBottom: 'none' }}
                        onClick={() => navigate(`/user/profile/${user._id}`)}
                      >
                        <HStack flex={1} minW={0} spacing={2.5}>
                          <UserAvatar
                            userId={user._id}
                            name={user.name}
                            src={user.profileImage}
                            size="sm"
                            subscription={user.subscription}
                          />
                          <VStack align="flex-start" spacing={0} flex={1} minW={0}>
                            <UserName
                              userId={user._id}
                              name={user.name}
                              subscription={user.subscription}
                              fontSize="sm"
                              fontWeight="600"
                              color={textColor}
                              noOfLines={1}
                              _hover={{ textDecoration: 'none' }}
                            />
                            <Text fontSize="xs" color={subtextColor} noOfLines={1}>
                              {user.accountType === 'private' ? 'Private account' : 'Public account'}
                            </Text>
                          </VStack>
                        </HStack>
                        <Box flexShrink={0} onClick={(e) => e.stopPropagation()}>
                          {user.accountType === 'private' ? (
                            <Button
                              size="xs"
                              bg="blue.500"
                              color="white"
                              leftIcon={<UserPlus size={12} />}
                              onClick={() => handleSendRequest(user._id, 'private')}
                              fontSize="xs"
                              _hover={{ bg: 'blue.600' }}
                            >
                              Add Friend
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              bg="green.500"
                              color="white"
                              leftIcon={<UserPlus size={12} />}
                              onClick={() => handleSendRequest(user._id, 'public')}
                              fontSize="xs"
                              _hover={{ bg: 'green.600' }}
                            >
                              Follow
                            </Button>
                          )}
                        </Box>
                      </Flex>
                    ))}
                  </VStack>
                )}
              </TabPanel>

              {/* Discover People Near You Tab */}
              <TabPanel px={0} pt={4} pb={0}>
                {nearYouLoading ? (
                  <Center minH="160px">
                    <Spinner size="lg" color={textColor} />
                  </Center>
                ) : filteredNearYou.length === 0 ? (
                  <EmptyState
                    title={searchQuery ? "No Users Found" : "No Users Near You"}
                    description={searchQuery ? `No users match "${searchQuery}"` : (nearYouData?.message || "Update your address in profile settings to discover people near you")}
                  />
                ) : (
                  <VStack spacing={0} align="stretch">
                    {filteredNearYou.map((user) => {
                      const locationInfo = user.address
                        ? [user.address.district, user.address.state, user.address.country].filter(Boolean).join(', ')
                        : 'Location not specified'
                      return (
                        <Flex
                          key={user._id}
                          align="center"
                          justify="space-between"
                          py={2}
                          px={1}
                          gap={2}
                          _hover={{ bg: rowHoverBg }}
                          borderRadius="md"
                          cursor="pointer"
                          borderBottom="1px solid"
                          borderColor={borderColor}
                          _last={{ borderBottom: 'none' }}
                          onClick={() => navigate(`/user/profile/${user._id}`)}
                        >
                          <HStack flex={1} minW={0} spacing={2.5}>
                            <UserAvatar
                              userId={user._id}
                              name={user.name}
                              src={user.profileImage}
                              size="sm"
                              subscription={user.subscription}
                            />
                            <VStack align="flex-start" spacing={0} flex={1} minW={0}>
                              <UserName
                                userId={user._id}
                                name={user.name}
                                subscription={user.subscription}
                                fontSize="sm"
                                fontWeight="600"
                                color={textColor}
                                noOfLines={1}
                                _hover={{ textDecoration: 'none' }}
                              />
                              <HStack spacing={1} fontSize="xs" color={subtextColor}>
                                <MapPin size={10} />
                                <Text noOfLines={1}>{locationInfo}</Text>
                              </HStack>
                            </VStack>
                          </HStack>
                          <Box flexShrink={0} onClick={(e) => e.stopPropagation()}>
                            {user.accountType === 'private' ? (
                              <Button
                                size="xs"
                                bg="blue.500"
                                color="white"
                                leftIcon={<UserPlus size={12} />}
                                onClick={() => handleSendRequest(user._id, 'private')}
                                fontSize="xs"
                                _hover={{ bg: 'blue.600' }}
                              >
                                Add Friend
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                bg="green.500"
                                color="white"
                                leftIcon={<UserPlus size={12} />}
                                onClick={() => handleSendRequest(user._id, 'public')}
                                fontSize="xs"
                                _hover={{ bg: 'green.600' }}
                              >
                                Follow
                              </Button>
                            )}
                          </Box>
                        </Flex>
                      )
                    })}
                  </VStack>
                )}
              </TabPanel>

              {/* Requests Tab */}
              <TabPanel px={0} pt={4} pb={0}>
                {receivedLoading || sentLoading ? (
                  <Center minH="160px">
                    <Spinner size="lg" color={textColor} />
                  </Center>
                ) : filteredReceivedRequests.length === 0 && filteredSentRequests.length === 0 ? (
                  <EmptyState
                    title={searchQuery ? "No Requests Found" : "No Requests"}
                    description={searchQuery ? `No requests match "${searchQuery}"` : "You have no pending friend requests"}
                  />
                ) : (
                  <VStack spacing={4} align="stretch">
                    {filteredReceivedRequests.length > 0 && (
                      <Box>
                        <Text fontWeight="600" mb={2} fontSize="xs" color={subtextColor}>
                          Received ({filteredReceivedRequests.length})
                        </Text>
                        <VStack spacing={0} align="stretch">
                          {filteredReceivedRequests.map((request) => {
                            const user = request.fromUser
                            return (
                              <Flex
                                key={request._id}
                                align="center"
                                justify="space-between"
                                py={2}
                                px={1}
                                gap={2}
                                _hover={{ bg: rowHoverBg }}
                                borderRadius="md"
                                cursor="pointer"
                                borderBottom="1px solid"
                                borderColor={borderColor}
                                _last={{ borderBottom: 'none' }}
                                onClick={() => navigate(`/user/profile/${user._id}`)}
                              >
                                <HStack flex={1} minW={0} spacing={2.5}>
                                  <UserAvatar
                                    userId={user._id}
                                    name={user.name}
                                    src={user.profileImage}
                                    size="sm"
                                    subscription={user.subscription}
                                  />
                                  <VStack align="flex-start" spacing={0} flex={1} minW={0}>
                                    <UserName
                                      userId={user._id}
                                      name={user.name}
                                      subscription={user.subscription}
                                      fontSize="sm"
                                      fontWeight="600"
                                      color={textColor}
                                      noOfLines={1}
                                      _hover={{ textDecoration: 'none' }}
                                    />
                                    <Text fontSize="xs" color={subtextColor} noOfLines={1}>
                                      Wants to be friends
                                    </Text>
                                  </VStack>
                                </HStack>
                                <HStack spacing={1.5} flexShrink={0} onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="xs"
                                    bg="green.500"
                                    color="white"
                                    leftIcon={<Check size={12} />}
                                    onClick={() => handleAccept(request._id)}
                                    fontSize="xs"
                                    _hover={{ bg: 'green.600' }}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    color="red.500"
                                    onClick={() => handleReject(request._id)}
                                    fontSize="xs"
                                    _hover={{ bg: 'red.50' }}
                                  >
                                    Reject
                                  </Button>
                                </HStack>
                              </Flex>
                            )
                          })}
                        </VStack>
                      </Box>
                    )}

                    {filteredSentRequests.length > 0 && (
                      <Box>
                        <Text fontWeight="600" mb={2} fontSize="xs" color={subtextColor}>
                          Sent ({filteredSentRequests.length})
                        </Text>
                        <VStack spacing={0} align="stretch">
                          {filteredSentRequests.map((request) => {
                            const user = request.toUser
                            return (
                              <Flex
                                key={request._id}
                                align="center"
                                justify="space-between"
                                py={2}
                                px={1}
                                gap={2}
                                _hover={{ bg: rowHoverBg }}
                                borderRadius="md"
                                cursor="pointer"
                                borderBottom="1px solid"
                                borderColor={borderColor}
                                _last={{ borderBottom: 'none' }}
                                onClick={() => navigate(`/user/profile/${user._id}`)}
                              >
                                <HStack flex={1} minW={0} spacing={2.5}>
                                  <UserAvatar
                                    userId={user._id}
                                    name={user.name}
                                    src={user.profileImage}
                                    size="sm"
                                    subscription={user.subscription}
                                  />
                                  <VStack align="flex-start" spacing={0} flex={1} minW={0}>
                                    <UserName
                                      userId={user._id}
                                      name={user.name}
                                      subscription={user.subscription}
                                      fontSize="sm"
                                      fontWeight="600"
                                      color={textColor}
                                      noOfLines={1}
                                      _hover={{ textDecoration: 'none' }}
                                    />
                                    <Text fontSize="xs" color={subtextColor} noOfLines={1}>
                                      Request sent
                                    </Text>
                                  </VStack>
                                </HStack>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  color="red.500"
                                  leftIcon={<X size={12} />}
                                  onClick={() => handleCancel(request._id)}
                                  fontSize="xs"
                                  flexShrink={0}
                                  _hover={{ bg: 'red.50' }}
                                >
                                  Cancel
                                </Button>
                              </Flex>
                            )
                          })}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                )}
              </TabPanel>
            </TabPanels>
      </Box>
      </Tabs>
      </VStack>
  )
}

export default UserFriends

