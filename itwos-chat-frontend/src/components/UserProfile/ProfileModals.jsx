import { useState } from 'react'
import {
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  Image,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  Center,
  Spinner,
  Avatar,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react'
import { Search, Music, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { useToast } from '@chakra-ui/react'
import VerifiedBadge from '../VerifiedBadge/VerifiedBadge'
import { useUserProfile } from './UserProfileContext'
import BlurModal from '../ui/BlurModal'

const profileModalContentProps = {
  mx: { base: 6, md: 4 },
  my: { base: 6, md: 4 },
  maxW: { base: 'calc(100% - 48px)', md: '480px' },
  maxH: { base: 'calc(100vh - 48px)', md: '90vh' },
}

const scrollbarCss = (scrollbarThumb) => ({
  '&::-webkit-scrollbar': { width: '4px' },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': { background: scrollbarThumb, borderRadius: '20px' },
})

/**
 * View Post, Followers, Following, Delete, Archive, Unarchive modals.
 * Location modal stays in the page so it can render outside UserLayout.
 */
export default function ProfileModals() {
  const toast = useToast()
  const [unfollowingUserId, setUnfollowingUserId] = useState(null)
  const {
    theme,
    isViewPostOpen,
    onViewPostClose,
    selectedPost,
    isOwnProfile,
    setActionPostId,
    onDeleteOpen,
    unarchivePost,
    archivePost,
    deletePost,
    refetchPosts,
    actionPostId,
    setActionType,
    isFollowersOpen,
    onFollowersOpen,
    onFollowersClose,
    followersSearch,
    setFollowersSearch,
    followersData,
    followersLoading,
    isFollowingOpen,
    onFollowingOpen,
    onFollowingClose,
    followingSearch,
    setFollowingSearch,
    followingData,
    followingLoading,
    unfollowUser,
    refetchFollowing,
    statsRefetch,
    isUnfollowing,
    isDeleteOpen,
    onDeleteClose,
    cancelRef,
    isArchiveOpen,
    onArchiveClose,
    onArchiveOpen,
    isUnarchiveOpen,
    onUnarchiveClose,
    onUnarchiveOpen,
  } = useUserProfile()

  const { borderColor, textColor, subtextColor, modalCloseHover, scrollbarThumb, inputPlaceholder, inputFocusBorder } = theme

  return (
    <>
      {/* View Post Modal */}
      <BlurModal isOpen={isViewPostOpen} onClose={onViewPostClose} size="md" borderColor={borderColor} contentProps={profileModalContentProps}>
          <ModalHeader py={{ base: 2.5, md: 3 }} px={{ base: 3, md: 4 }} fontSize={{ base: '15px', md: '17px' }} fontWeight="600" color={textColor} borderBottom="1px solid" borderColor={borderColor} bg="transparent">
            Post Details
          </ModalHeader>
          <ModalCloseButton top={{ base: 2, md: 3 }} right={{ base: 2.5, md: 4 }} color={textColor} borderRadius="full" size="sm" _hover={{ bg: modalCloseHover }} />
          <ModalBody px={{ base: 3, md: 4 }} py={{ base: 2, md: 3 }} overflowY="auto" maxH="calc(100vh - 120px)" css={scrollbarCss(scrollbarThumb)}>
            {selectedPost && (
              <VStack spacing={3} align="stretch">
                {selectedPost.content && (
                  <Box px={3} py={3} bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')} borderRadius={{ base: '8px', md: '12px' }} border="1px solid" borderColor={borderColor}>
                    <Text whiteSpace="pre-wrap" color={textColor} fontSize="sm">{selectedPost.content}</Text>
                  </Box>
                )}
                {selectedPost.images && selectedPost.images.length > 0 && (
                  <Box bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')} borderRadius={{ base: '8px', md: '12px' }} border="1px solid" borderColor={borderColor} p={2}>
                    <SimpleGrid columns={2} spacing={2}>
                      {selectedPost.images.map((image, index) => (
                        <Image key={index} src={image} alt={`Post image ${index + 1}`} borderRadius="md" maxH="300px" objectFit="cover" />
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
                {selectedPost.song && (
                  <Box px={3} py={3} bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')} borderRadius={{ base: '8px', md: '12px' }} border="1px solid" borderColor={borderColor}>
                    <HStack mb={2}>
                      <Music size={20} color={textColor} />
                      <Text fontWeight="bold" color={textColor}>Song</Text>
                    </HStack>
                    <audio controls style={{ width: '100%' }}>
                      <source src={selectedPost.song} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </Box>
                )}
                <Box px={3} py={3} bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')} borderRadius={{ base: '8px', md: '12px' }} border="1px solid" borderColor={borderColor}>
                  <HStack spacing={4} color={textColor}>
                    <Text fontSize="sm" color={textColor}><strong>{selectedPost.likes?.length || 0}</strong> likes</Text>
                    <Text fontSize="sm" color={textColor}><strong>{selectedPost.comments?.length || 0}</strong> comments</Text>
                    <Text fontSize="sm" color={subtextColor}>{new Date(selectedPost.createdAt).toLocaleDateString()}</Text>
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter px={{ base: 3, md: 4 }} py={{ base: 2, md: 3 }} borderTop="1px solid" borderColor={borderColor} bg="transparent">
            <HStack spacing={3} w="full" justify="space-between">
              <Button onClick={onViewPostClose} variant="ghost" color={textColor} _hover={{ bg: modalCloseHover }}>Close</Button>
              {isOwnProfile && selectedPost && (
                <HStack spacing={2}>
                  {selectedPost.isArchived ? (
                    <Button
                      leftIcon={<ArchiveRestore size={16} />}
                      bgGradient="linear(to-r, #34C759, #30D158)"
                      color={textColor}
                      _hover={{ bgGradient: 'linear(to-r, #28A745, #2ECC71)', transform: 'translateY(-1px)' }}
                      onClick={async () => {
                        try {
                          await unarchivePost(selectedPost._id).unwrap()
                          toast({ title: 'Success', description: 'Post unarchived successfully', status: 'success', duration: 3000, isClosable: true })
                          onViewPostClose()
                          refetchPosts()
                        } catch (error) {
                          toast({ title: 'Error', description: 'Failed to unarchive post', status: 'error', duration: 3000, isClosable: true })
                        }
                      }}
                    >
                      Unarchive
                    </Button>
                  ) : (
                    <Button
                      leftIcon={<Archive size={16} />}
                      bgGradient="linear(to-r, #007AFF, #5856D6)"
                      color={textColor}
                      _hover={{ bgGradient: 'linear(to-r, #0051D5, #4A47C4)', transform: 'translateY(-1px)' }}
                      onClick={async () => {
                        try {
                          await archivePost(selectedPost._id).unwrap()
                          toast({ title: 'Success', description: 'Post archived successfully', status: 'success', duration: 3000, isClosable: true })
                          onViewPostClose()
                          refetchPosts()
                        } catch (error) {
                          toast({ title: 'Error', description: 'Failed to archive post', status: 'error', duration: 3000, isClosable: true })
                        }
                      }}
                    >
                      Archive
                    </Button>
                  )}
                  <Button
                    leftIcon={<Trash2 size={16} />}
                    bgGradient="linear(to-r, #FF3B30, #FF453A)"
                    color={textColor}
                    _hover={{ bgGradient: 'linear(to-r, #D70015, #FF2D55)', transform: 'translateY(-1px)' }}
                    onClick={() => {
                      setActionPostId(selectedPost._id)
                      onViewPostClose()
                      onDeleteOpen()
                    }}
                  >
                    Delete
                  </Button>
                </HStack>
              )}
            </HStack>
          </ModalFooter>
      </BlurModal>

      {/* Followers Modal */}
      <BlurModal isOpen={isFollowersOpen} onClose={() => { onFollowersClose(); setFollowersSearch('') }} size="md" borderColor={borderColor} contentProps={profileModalContentProps}>
          <ModalHeader py={{ base: 2.5, md: 3 }} px={{ base: 3, md: 4 }} fontSize={{ base: '15px', md: '17px' }} fontWeight="600" color={textColor} borderBottom="1px solid" borderColor={borderColor} bg="transparent">
            Followers
          </ModalHeader>
          <ModalCloseButton top={{ base: 2, md: 3 }} right={{ base: 2.5, md: 4 }} color={textColor} borderRadius="full" size="sm" _hover={{ bg: modalCloseHover }} />
          <ModalBody px={{ base: 3, md: 4 }} py={{ base: 2, md: 3 }} overflowY="auto" maxH="calc(100vh - 120px)" css={scrollbarCss(scrollbarThumb)}>
            <InputGroup mb={4}>
              <InputLeftElement pointerEvents="none">
                <Search size={18} color={subtextColor} />
              </InputLeftElement>
              <Input
                placeholder="Search followers..."
                value={followersSearch}
                onChange={(e) => setFollowersSearch(e.target.value)}
                border="1px solid"
                borderColor={borderColor}
                borderRadius={{ base: '8px', md: '12px' }}
                bg="transparent"
                color={textColor}
                _placeholder={{ color: inputPlaceholder }}
                _focus={{ borderColor: inputFocusBorder, boxShadow: 'none' }}
              />
            </InputGroup>
            {followersLoading ? (
              <Center minH="200px"><Spinner size="xl" color={textColor} /></Center>
            ) : followersData?.data && followersData.data.length > 0 ? (
              <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                {followersData.data.map((follower) => (
                  <HStack key={follower._id} spacing={3} p={3} borderRadius="12px" border="1px solid" borderColor={borderColor}>
                    <Avatar size="md" name={follower.name} src={follower.profileImage} />
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontWeight="bold" color={textColor}>{follower.name}</Text>
                      <Text fontSize="sm" color={subtextColor}>{follower.email}</Text>
                      {follower.isFriend && <Badge colorScheme="green" fontSize="xs" mt={1}>Friend</Badge>}
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            ) : (
              <Text color={textColor} textAlign="center" py={8}>{followersSearch ? 'No followers found' : 'No followers yet'}</Text>
            )}
          </ModalBody>
      </BlurModal>

      {/* Following Modal */}
      <BlurModal isOpen={isFollowingOpen} onClose={() => { onFollowingClose(); setFollowingSearch('') }} size="md" borderColor={borderColor} contentProps={profileModalContentProps}>
          <ModalHeader py={{ base: 2.5, md: 3 }} px={{ base: 3, md: 4 }} fontSize={{ base: '15px', md: '17px' }} fontWeight="600" color={textColor} borderBottom="1px solid" borderColor={borderColor} bg="transparent">
            Following
          </ModalHeader>
          <ModalCloseButton top={{ base: 2, md: 3 }} right={{ base: 2.5, md: 4 }} color={textColor} borderRadius="full" size="sm" _hover={{ bg: modalCloseHover }} />
          <ModalBody px={{ base: 3, md: 4 }} py={{ base: 2, md: 3 }} overflowY="auto" maxH="calc(100vh - 120px)" css={scrollbarCss(scrollbarThumb)}>
            <InputGroup mb={4}>
              <InputLeftElement pointerEvents="none">
                <Search size={18} color={subtextColor} />
              </InputLeftElement>
              <Input
                placeholder="Search following..."
                value={followingSearch}
                onChange={(e) => setFollowingSearch(e.target.value)}
                border="1px solid"
                borderColor={borderColor}
                borderRadius={{ base: '8px', md: '12px' }}
                bg="transparent"
                color={textColor}
                _placeholder={{ color: inputPlaceholder }}
                _focus={{ borderColor: inputFocusBorder, boxShadow: 'none' }}
              />
            </InputGroup>
            {followingLoading ? (
              <Center minH="200px"><Spinner size="xl" color={textColor} /></Center>
            ) : followingData?.data && followingData.data.length > 0 ? (
              <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                {followingData.data.map((following) => {
                  const handleUnfollow = async () => {
                    setUnfollowingUserId(following._id)
                    try {
                      await unfollowUser(following._id).unwrap()
                      toast({ title: 'Unfollowed', description: `You are no longer following ${following.name}`, status: 'success', duration: 3000, isClosable: true })
                      refetchFollowing()
                      if (statsRefetch) statsRefetch()
                    } catch (error) {
                      toast({ title: 'Error', description: error?.data?.message || 'Failed to unfollow user', status: 'error', duration: 3000, isClosable: true })
                    } finally {
                      setUnfollowingUserId(null)
                    }
                  }
                  const isThisUnfollowing = unfollowingUserId === following._id
                  return (
                    <HStack key={following._id} spacing={3} p={3} borderRadius="12px" border="1px solid" borderColor={borderColor} justify="space-between">
                      <HStack spacing={3} flex={1}>
                        <Avatar size="md" name={following.name} src={following.profileImage} />
                        <VStack align="start" spacing={0} flex={1}>
                          <HStack spacing={2}>
                            <Text fontWeight="bold" color={textColor}>{following.name}</Text>
                            {following.subscription?.badgeType && <VerifiedBadge badgeType={following.subscription.badgeType} size={16} />}
                          </HStack>
                          <Text fontSize="sm" color={subtextColor}>{following.email}</Text>
                          {following.isFriend && (
                            <Badge colorScheme="green" fontSize="xs" mt={1} bg="rgba(34, 197, 94, 0.2)" color="green.300" border="1px solid" borderColor="green.400">Friend</Badge>
                          )}
                        </VStack>
                      </HStack>
                      <Button size="sm" variant="outline" colorScheme="red" onClick={handleUnfollow} isLoading={isThisUnfollowing} loadingText="Unfollowing" fontSize="xs" bg="transparent" border="1px solid" borderColor="red.400" color="red.400" _hover={{ bg: 'rgba(239, 68, 68, 0.2)', borderColor: 'red.500' }}>
                        Unfollow
                      </Button>
                    </HStack>
                  )
                })}
              </VStack>
            ) : (
              <Text color={subtextColor} textAlign="center" py={8}>{followingSearch ? 'No following found' : 'Not following anyone yet'}</Text>
            )}
          </ModalBody>
      </BlurModal>

      {/* Delete Post Modal */}
      <BlurModal isOpen={isDeleteOpen} onClose={onDeleteClose} size="md" borderColor={borderColor} contentProps={profileModalContentProps}>
          <ModalHeader py={{ base: 2.5, md: 3 }} px={{ base: 3, md: 4 }} fontSize={{ base: '15px', md: '17px' }} fontWeight="600" color={textColor} borderBottom="1px solid" borderColor={borderColor} bg="transparent">
            Delete Post
          </ModalHeader>
          <ModalCloseButton top={{ base: 2, md: 3 }} right={{ base: 2.5, md: 4 }} color={textColor} borderRadius="full" size="sm" _hover={{ bg: modalCloseHover }} />
          <ModalBody px={{ base: 3, md: 4 }} py={{ base: 2, md: 3 }} overflowY="auto" maxH="calc(100vh - 120px)" css={scrollbarCss(scrollbarThumb)}>
            <Text color={textColor} fontSize={{ base: '14px', md: '15px' }}>
              Are you sure you want to delete this post? This action cannot be undone.
            </Text>
          </ModalBody>
          <ModalFooter px={{ base: 3, md: 4 }} py={{ base: 2, md: 3 }} borderTop="1px solid" borderColor={borderColor} bg="transparent">
            <Button ref={cancelRef} onClick={onDeleteClose} variant="ghost" color={textColor} _hover={{ bg: 'whiteAlpha.200' }} mr={3}>Cancel</Button>
            <Button
              bgGradient="linear(to-r, #FF3B30, #FF453A)"
              color={textColor}
              _hover={{ bgGradient: 'linear(to-r, #D70015, #FF2D55)', transform: 'translateY(-1px)' }}
              onClick={async () => {
                try {
                  await deletePost(actionPostId).unwrap()
                  toast({ title: 'Success', description: 'Post deleted successfully', status: 'success', duration: 3000, isClosable: true })
                  onDeleteClose()
                  setActionPostId(null)
                  if (setActionType) setActionType(null)
                  refetchPosts()
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to delete post', status: 'error', duration: 3000, isClosable: true })
                }
              }}
            >
              Delete
            </Button>
          </ModalFooter>
      </BlurModal>

      {/* Archive Post Modal */}
      <BlurModal isOpen={isArchiveOpen} onClose={onArchiveClose} size="md" borderColor={borderColor} contentProps={profileModalContentProps}>
          <ModalHeader py={{ base: 2.5, md: 3 }} px={{ base: 3, md: 4 }} fontSize={{ base: '15px', md: '17px' }} fontWeight="600" color={textColor} borderBottom="1px solid" borderColor={borderColor} bg="transparent">
            Archive Post
          </ModalHeader>
          <ModalCloseButton top={{ base: 2, md: 3 }} right={{ base: 2.5, md: 4 }} color={textColor} borderRadius="full" size="sm" _hover={{ bg: modalCloseHover }} />
          <ModalBody px={{ base: 3, md: 4 }} py={{ base: 2, md: 3 }} overflowY="auto" maxH="calc(100vh - 120px)" css={scrollbarCss(scrollbarThumb)}>
            <Text color={textColor} fontSize={{ base: '14px', md: '15px' }}>
              Are you sure you want to archive this post? It will be moved to your archived posts.
            </Text>
          </ModalBody>
          <ModalFooter px={{ base: 3, md: 4 }} py={{ base: 2, md: 3 }} borderTop="1px solid" borderColor={borderColor} bg="transparent">
            <Button ref={cancelRef} onClick={onArchiveClose} variant="ghost" color={textColor} _hover={{ bg: 'whiteAlpha.200' }} mr={3}>Cancel</Button>
            <Button
              bgGradient="linear(to-r, #007AFF, #5856D6)"
              color={textColor}
              _hover={{ bgGradient: 'linear(to-r, #0051D5, #4A47C4)', transform: 'translateY(-1px)' }}
              onClick={async () => {
                try {
                  await archivePost(actionPostId).unwrap()
                  toast({ title: 'Success', description: 'Post archived successfully', status: 'success', duration: 3000, isClosable: true })
                  onArchiveClose()
                  setActionPostId(null)
                  if (setActionType) setActionType(null)
                  refetchPosts()
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to archive post', status: 'error', duration: 3000, isClosable: true })
                }
              }}
            >
              Archive
            </Button>
          </ModalFooter>
      </BlurModal>

      {/* Unarchive Post Modal */}
      <BlurModal isOpen={isUnarchiveOpen} onClose={onUnarchiveClose} size="md" borderColor={borderColor} contentProps={profileModalContentProps}>
          <ModalHeader py={{ base: 2.5, md: 3 }} px={{ base: 3, md: 4 }} fontSize={{ base: '15px', md: '17px' }} fontWeight="600" color={textColor} borderBottom="1px solid" borderColor={borderColor} bg="transparent">
            Unarchive Post
          </ModalHeader>
          <ModalCloseButton top={{ base: 2, md: 3 }} right={{ base: 2.5, md: 4 }} color={textColor} borderRadius="full" size="sm" _hover={{ bg: modalCloseHover }} />
          <ModalBody px={{ base: 3, md: 4 }} py={{ base: 2, md: 3 }} overflowY="auto" maxH="calc(100vh - 120px)" css={scrollbarCss(scrollbarThumb)}>
            <Text color={textColor} fontSize={{ base: '14px', md: '15px' }}>
              Are you sure you want to unarchive this post? It will be moved back to your main posts.
            </Text>
          </ModalBody>
          <ModalFooter px={{ base: 3, md: 4 }} py={{ base: 2, md: 3 }} borderTop="1px solid" borderColor={borderColor} bg="transparent">
            <Button ref={cancelRef} onClick={onUnarchiveClose} variant="ghost" color={textColor} _hover={{ bg: 'whiteAlpha.200' }} mr={3}>Cancel</Button>
            <Button
              bgGradient="linear(to-r, #34C759, #30D158)"
              color={textColor}
              _hover={{ bgGradient: 'linear(to-r, #28A745, #2ECC71)', transform: 'translateY(-1px)' }}
              onClick={async () => {
                try {
                  await unarchivePost(actionPostId).unwrap()
                  toast({ title: 'Success', description: 'Post unarchived successfully', status: 'success', duration: 3000, isClosable: true })
                  onUnarchiveClose()
                  setActionPostId(null)
                  if (setActionType) setActionType(null)
                  refetchPosts()
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to unarchive post', status: 'error', duration: 3000, isClosable: true })
                }
              }}
            >
              Unarchive
            </Button>
          </ModalFooter>
      </BlurModal>
    </>
  )
}
