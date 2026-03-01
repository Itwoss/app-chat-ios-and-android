import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Avatar,
  Badge,
  Button,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { Lock, Globe, MessageCircle, UserPlus, UserX, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@chakra-ui/react'
import VerifiedBadge from '../VerifiedBadge/VerifiedBadge'
import UserProfileBio from '../User/UserProfileBio'
import { useUserProfile } from './UserProfileContext'

/**
 * Profile hero: banner, avatar, name, badges, stats (followers/following/friends/posts), follow/edit/message, bio.
 */
export default function ProfileHero() {
  const navigate = useNavigate()
  const toast = useToast()
  const {
    theme,
    displayData,
    displayBio,
    isOwnProfile,
    profileUserId,
    displayedStats,
    statsData,
    postsData,
    equippedBanner,
    isEditing,
    handleEdit,
    onFollowersOpen,
    onFollowingOpen,
    refetchProfile,
    followUser,
    unfollowUser,
    isFollowing,
    isUnfollowing,
    sendFriendRequest,
    isSendingRequest,
    hasPendingRequestToProfile,
    refetchSentRequests,
    displayedUser,
  } = useUserProfile()

  const {
    cardBg,
    textColor,
    subtextColor,
    borderColor,
    borderColorHover,
    shadowColor,
    overlayBg,
    avatarShadow,
    textShadowColor,
    hoverBgLight,
    hoverBorderLight,
    hoverBgMedium,
    hoverBorderMedium,
  } = theme

  const postsCount = (postsData?.data || postsData?.success?.data || []).length
  const followingBtnHover = {
    bg: useColorModeValue('rgba(0, 0, 0, 0.08)', 'rgba(255, 255, 255, 0.1)'),
    borderColor: borderColorHover,
  }
  const editIconBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(0, 0, 0, 0.4)')
  const editIconBgHover = useColorModeValue('rgba(255, 255, 255, 1)', 'rgba(0, 0, 0, 0.5)')

  const isPrivateAccount = displayedUser?.accountType === 'private'
  const [requestJustSent, setRequestJustSent] = useState(false)
  useEffect(() => {
    setRequestJustSent(false)
  }, [profileUserId])
  const showRequested = isPrivateAccount && (hasPendingRequestToProfile || requestJustSent)

  const followUnfollowButton = (!isEditing && isOwnProfile === false) && (
    showRequested ? (
      <Button
        size="sm"
        flex={1}
        maxW="50%"
        leftIcon={<UserPlus size={14} />}
        height="32px"
        fontSize="13px"
        bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
        border="1px solid"
        borderColor={borderColorHover}
        color={textColor}
        borderRadius="8px"
        isDisabled
      >
        Requested
      </Button>
    ) : displayedUser?.relationship?.isFollowing ? (
      <Button
        size="sm"
        flex={1}
        maxW="50%"
        leftIcon={<UserX size={14} />}
        height="32px"
        fontSize="13px"
        bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
        border="1px solid"
        borderColor={borderColorHover}
        color={textColor}
        borderRadius="8px"
        backdropFilter="blur(10px)"
        _hover={followingBtnHover}
        _active={{ transform: 'scale(0.98)' }}
        transition="all 0.2s"
        onClick={async () => {
          try {
            await unfollowUser(profileUserId).unwrap()
            toast({ title: 'Unfollowed', description: `You are no longer following ${displayedUser?.name}`, status: 'success', duration: 3000, isClosable: true })
            if (profileUserId && !isOwnProfile) refetchProfile()
          } catch (error) {
            toast({ title: 'Error', description: error?.data?.message || 'Failed to unfollow user', status: 'error', duration: 3000, isClosable: true })
          }
        }}
        isLoading={isUnfollowing}
        loadingText="…"
      >
        Following
      </Button>
    ) : (
      <Button
        size="sm"
        flex={1}
        maxW="50%"
        leftIcon={<UserPlus size={14} />}
        height="32px"
        fontSize="13px"
        bgGradient="linear(to-r, #007AFF, #5856D6)"
        border="1px solid"
        borderColor={borderColor}
        color="white"
        borderRadius="8px"
        _hover={{ opacity: 0.95, boxShadow: '0 2px 8px rgba(0, 122, 255, 0.25)' }}
        _active={{ transform: 'scale(0.98)' }}
        transition="all 0.2s"
        onClick={async () => {
          if (isPrivateAccount) {
            try {
              await sendFriendRequest({ toUserId: profileUserId }).unwrap()
              setRequestJustSent(true)
              toast({ title: 'Request sent', description: `Follow request sent to ${displayedUser?.name}`, status: 'success', duration: 3000, isClosable: true })
              refetchSentRequests?.()
              if (profileUserId && !isOwnProfile) refetchProfile()
            } catch (error) {
              if (error?.data?.message?.includes('already sent') || error?.data?.message?.includes('Already friends')) {
                if (profileUserId && !isOwnProfile) refetchProfile()
                return
              }
              toast({ title: 'Error', description: error?.data?.message || 'Failed to send request', status: 'error', duration: 3000, isClosable: true })
            }
            return
          }
          try {
            const result = await followUser(profileUserId).unwrap()
            if (result.alreadyFollowing || result.alreadyFriends || result.message?.includes('Already following') || result.message?.includes('Already friends')) {
              if (profileUserId && !isOwnProfile) refetchProfile()
              return
            }
            toast({ title: result.isMutualFollow ? 'You are now friends!' : 'Following', description: result.isMutualFollow ? "You're now friends!" : `Following ${displayedUser?.name}`, status: 'success', duration: 3000, isClosable: true })
            if (profileUserId && !isOwnProfile) refetchProfile()
          } catch (error) {
            if (error?.data?.message?.includes('Already friends') || error?.data?.message?.includes('Already following')) { if (profileUserId && !isOwnProfile) refetchProfile(); return }
            toast({ title: 'Error', description: error?.data?.message || 'Failed to follow user', status: 'error', duration: 3000, isClosable: true })
          }
        }}
        isLoading={isPrivateAccount ? isSendingRequest : isFollowing}
        loadingText="…"
      >
        Follow
      </Button>
    )
  )

  const messageButton = (!isEditing && isOwnProfile === false) && (
    <Button
      size="sm"
      flex={1}
      maxW="50%"
      leftIcon={<MessageCircle size={14} />}
      height="32px"
      fontSize="13px"
      bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
      border="1px solid"
      borderColor={borderColorHover}
      color={textColor}
      borderRadius="8px"
      backdropFilter="blur(10px)"
      _hover={{ bg: hoverBgMedium, borderColor: hoverBorderMedium }}
      _active={{ transform: 'scale(0.98)' }}
      transition="all 0.2s"
      onClick={() => navigate(`/user/chat?userId=${profileUserId}`)}
    >
      Message
    </Button>
  )

  return (
    <Box
      className="profile-header"
      position="relative"
      borderRadius={{ base: 0, md: '16px' }}
      overflow="hidden"
      bgGradient={equippedBanner ? undefined : useColorModeValue('linear(135deg, #E8E8F0 0%, #D8D8E8 100%)', 'linear(135deg, #667eea 0%, #764ba2 100%)')}
      bg={equippedBanner ? undefined : useColorModeValue(cardBg, undefined)}
      px={{ base: 3, md: 6 }}
      py={{ base: 4, md: 6 }}
      boxShadow={`0 12px 40px ${shadowColor}`}
      backgroundImage={equippedBanner ? `url(${equippedBanner.profileImageUrl || equippedBanner.imageUrl})` : undefined}
      backgroundSize="cover"
      backgroundPosition="center"
      sx={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {equippedBanner && (
        <Box position="absolute" top={0} left={0} right={0} bottom={0} bg={overlayBg} />
      )}

      {/* Edit profile icon – top right (own profile only) */}
      {isOwnProfile && !isEditing && (
        <IconButton
          position="absolute"
          top={{ base: 4, md: 6 }}
          right={{ base: 3, md: 6 }}
          zIndex={2}
          size="sm"
          borderRadius="full"
          aria-label="Edit profile"
          icon={<Pencil size={18} />}
          bg={editIconBg}
          color={textColor}
          _hover={{ bg: editIconBgHover }}
          _active={{ transform: 'scale(0.96)' }}
          onClick={handleEdit}
        />
      )}

      <VStack position="relative" zIndex={1} spacing={3} align="stretch" w="100%" pt={{ base: 6, md: 2 }}>
        {/* Row 1: Avatar + name */}
        <HStack justify="flex-start" align="start" w="100%">
          <HStack spacing={4} flex={1} minW={0}>
            <Avatar
              size="xl"
              name={displayData.name || 'User'}
              src={displayData.profileImage || undefined}
              border="3px solid"
              borderColor={borderColorHover}
              boxShadow={`0 6px 24px ${avatarShadow}`}
              flexShrink={0}
              sx={{ transition: 'transform 0.3s', _hover: { transform: 'scale(1.02)' } }}
            />
            <VStack align="start" spacing={1} flex={1} minW={0}>
              <HStack spacing={2}>
                <Heading size="lg" color={textColor} textShadow={`0 2px 10px ${textShadowColor}`} fontWeight="bold" noOfLines={1}>
                  {displayData.name || 'User'}
                </Heading>
                {displayData.subscription?.badgeType && <VerifiedBadge badgeType={displayData.subscription.badgeType} size={16} />}
              </HStack>
              <Text color={subtextColor} fontSize="sm" noOfLines={1}>{displayData.email || ''}</Text>
              <Badge fontSize="xs" px={2} py={0.5} borderRadius="full" bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.1)')} backdropFilter="blur(10px)" color={textColor} border="1px solid" borderColor={borderColor}>
                {displayData.accountType === 'private' ? <Lock size={10} style={{ display: 'inline', marginRight: 3 }} /> : <Globe size={10} style={{ display: 'inline', marginRight: 3 }} />}
                {displayData.accountType === 'private' ? 'Private' : 'Public'}
              </Badge>
            </VStack>
          </HStack>
        </HStack>

        {/* Row 2: Stats (followers, following, friends, posts) */}
        <HStack spacing={6} pt={1} w="100%" justify="flex-start">
          <Box as="button" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFollowersOpen(); }} p={2} cursor="pointer" bg="transparent" border="none" outline="none" textAlign="left" _hover={{ opacity: 0.9 }} _focus={{ outline: 'none' }} _active={{ opacity: 0.95 }}>
            <VStack spacing={0} align="start">
              <Text fontWeight="bold" fontSize="lg" color={textColor}>{displayedStats?.followers ?? statsData?.data?.followers ?? 0}</Text>
              <Text fontSize="xs" color={subtextColor}>Followers</Text>
            </VStack>
          </Box>
          <Box as="button" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFollowingOpen(); }} p={2} cursor="pointer" bg="transparent" border="none" outline="none" textAlign="left" _hover={{ opacity: 0.9 }} _focus={{ outline: 'none' }} _active={{ opacity: 0.95 }}>
            <VStack spacing={0} align="start">
              <Text fontWeight="bold" fontSize="lg" color={textColor}>{displayedStats?.following ?? statsData?.data?.following ?? 0}</Text>
              <Text fontSize="xs" color={subtextColor}>Following</Text>
            </VStack>
          </Box>
          <VStack spacing={0} p={2}>
            <Text fontWeight="bold" fontSize="lg" color={textColor}>{displayedStats?.friends ?? statsData?.data?.friends ?? 0}</Text>
            <Text fontSize="xs" color={subtextColor}>Friends</Text>
          </VStack>
          <VStack spacing={0} p={2}>
            <Text fontWeight="bold" fontSize="lg" color={textColor}>{displayedStats?.totalPosts ?? postsCount}</Text>
            <Text fontSize="xs" color={subtextColor}>Posts</Text>
          </VStack>
        </HStack>

        {/* Row 3: Follow + Message (Instagram-style, below stats, small) */}
        {(followUnfollowButton || messageButton) && (
          <HStack w="100%" spacing={2} pt={1}>
            {followUnfollowButton}
            {messageButton}
          </HStack>
        )}

        {!isEditing && (
          <UserProfileBio mode="view" bio={displayBio} textColor={textColor} subtextColor={subtextColor} />
        )}
      </VStack>
    </Box>
  )
}
