import {
  Box,
  VStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Image,
  HStack,
  Flex,
  useColorModeValue,
  Center,
  Spinner,
  Button,
  useDisclosure,
  ButtonGroup,
} from '@chakra-ui/react'
import { Heart, MessageCircle, Music, Image as ImageIcon } from 'lucide-react'
import { useUserProfile } from './UserProfileContext'
import { PostCardSkeleton } from '../Skeletons'
import AddMemoryModal from './AddMemoryModal'
import MemoryCard from './MemoryCard'

/**
 * Posts section: Tabs (All Posts, Archived, Saved), post grids.
 */
export default function ProfilePostsSection() {
  const {
    theme,
    postsData,
    savedPostsData,
    memoriesData,
    memoriesLoading,
    refetchMemories,
    memorySortOrder,
    setMemorySortOrder,
    activeTab,
    setActiveTab,
    isOwnProfile,
    postsLoading,
    savedPostsLoading,
    setSelectedPost,
    onViewPostOpen,
  } = useUserProfile()

  const { isOpen: isAddMemoryOpen, onOpen: onAddMemoryOpen, onClose: onAddMemoryClose } = useDisclosure()

  const {
    cardBg,
    textColor,
    subtextColor,
    borderColor,
    borderColorHover,
    radialGradientColor,
    borderGlowColor,
    gradientOverlay,
    textShadowDark,
    shadowColor,
  } = theme

  const allPosts = postsData?.data || postsData?.success?.data || []
  const isPrivateProfile = !!postsData?.isPrivateProfile
  const archivedPosts = activeTab === 1 ? (postsData?.data || []) : []
  const savedPosts = savedPostsData?.data?.savedPosts || []
  const memories = memoriesData?.data || []

  // Group memories by year and month for timeline (key: "YYYY-MM" or "YYYY" for display)
  const getMemoryTimelineGroups = () => {
    if (!memories.length) return []
    const byYearMonth = {}
    memories.forEach((m) => {
      const d = new Date(m.memoryDate)
      if (Number.isNaN(d.getTime())) return
      const year = d.getFullYear()
      const month = d.getMonth()
      const key = `${year}-${String(month + 1).padStart(2, '0')}`
      if (!byYearMonth[key]) byYearMonth[key] = { year, month, label: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), items: [] }
      byYearMonth[key].items.push(m)
    })
    const keys = Object.keys(byYearMonth).sort()
    const ordered = memorySortOrder === 'asc' ? keys : [...keys].reverse()
    return ordered.map((key) => byYearMonth[key])
  }
  const timelineGroups = getMemoryTimelineGroups()

  const postCardSx = {
    aspectRatio: '1 / 1',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 0,
      background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), ${radialGradientColor}, transparent 40%)`,
      opacity: 0,
      transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'none',
      zIndex: 3,
    },
    '&:hover::before': { opacity: 1 },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 0,
      opacity: 0,
      transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      pointerEvents: 'none',
      zIndex: 4,
      boxShadow: `0 0 20px ${borderGlowColor}`,
    },
    '&:hover::after': { opacity: 1 },
  }

  const renderPostCard = (post, extraSx = {}) => (
    <Box
      key={post._id}
      className="post-card"
      position="relative"
      borderRadius={0}
      overflow="hidden"
      cursor="pointer"
      onClick={() => {
        setSelectedPost(post)
        onViewPostOpen()
      }}
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{ borderColor: borderColorHover }}
      sx={{ ...postCardSx, ...extraSx }}
    >
      {post.images && post.images.length > 0 ? (
        <Box position="relative" w="full" h="full" zIndex={0}>
          <Image src={post.images[0]} alt="Post" w="full" h="full" objectFit="cover" />
          <Box position="absolute" bottom={0} left={0} right={0} h="60%" bgGradient="linear(to-t, rgba(0,0,0,0.8), rgba(0,0,0,0))" pointerEvents="none" zIndex={1} />
          {post.content && (
            <Text position="absolute" bottom={3} left={3} right={3} fontSize="13px" fontWeight="600" color={textColor} noOfLines={2} textShadow={`0 2px 8px ${textShadowDark}`} zIndex={11}>
              {post.content}
            </Text>
          )}
        </Box>
      ) : post.song ? (
        <Box w="full" h="full" bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)" display="flex" flexDirection="column" alignItems="center" justifyContent="center" position="relative" zIndex={0}>
          <Music size={40} color={textColor} />
          {post.content && (
            <Text position="absolute" bottom={3} left={3} right={3} fontSize="13px" fontWeight="600" color={textColor} noOfLines={2} textAlign="center" textShadow={`0 2px 8px ${textShadowDark}`} zIndex={11}>
              {post.content}
            </Text>
          )}
        </Box>
      ) : (
        <Box w="full" h="full" bg={cardBg} display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4} position="relative" zIndex={0}>
          <Text color={textColor} fontSize="14px" fontWeight="500" textAlign="center" noOfLines={4} lineHeight="1.4" zIndex={11}>
            {post.content || 'No content'}
          </Text>
        </Box>
      )}
      <Box position="absolute" bottom={2} right={2} bg="rgba(0, 0, 0, 0.6)" backdropFilter="blur(20px)" borderRadius="full" px={3} py={1.5} zIndex={5}>
        <HStack fontSize="11px" color={textColor} spacing={3}>
          <HStack spacing={1}>
            <Heart size={14} fill="currentColor" />
            <Text fontWeight="600">{post.likes?.length || 0}</Text>
          </HStack>
          <HStack spacing={1}>
            <MessageCircle size={14} />
            <Text fontWeight="600">{post.comments?.length || 0}</Text>
          </HStack>
        </HStack>
      </Box>
    </Box>
  )

  const renderArchivedCard = (post) => (
    <Box
      key={post._id}
      className="post-card"
      position="relative"
      borderRadius={0}
      overflow="hidden"
      cursor="pointer"
      onClick={() => { setSelectedPost(post); onViewPostOpen() }}
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{ borderColor: borderColorHover }}
      sx={postCardSx}
    >
      {post.images && post.images.length > 0 ? (
        <Box position="relative" w="full" h="full">
          <Image src={post.images[0]} alt="Post" w="full" h="full" objectFit="cover" />
          <Box position="absolute" bottom={0} left={0} right={0} h="60%" bgGradient={gradientOverlay} pointerEvents="none" />
          {post.content && (
            <Text position="absolute" bottom={3} left={3} right={3} fontSize="13px" fontWeight="600" color={textColor} noOfLines={2} textShadow="0 2px 8px rgba(0,0,0,0.8)">
              {post.content}
            </Text>
          )}
        </Box>
      ) : post.song ? (
        <Box w="full" h="full" bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)" display="flex" flexDirection="column" alignItems="center" justifyContent="center" position="relative">
          <Music size={40} color={textColor} />
          {post.content && (
            <Text position="absolute" bottom={3} left={3} right={3} fontSize="13px" fontWeight="600" color={textColor} noOfLines={2} textAlign="center" textShadow="0 2px 8px rgba(0,0,0,0.8)">
              {post.content}
            </Text>
          )}
        </Box>
      ) : (
        <Box w="full" h="full" bg={cardBg} display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4} position="relative">
          <Text color={useColorModeValue('#FFFFFF', '#FFFFFF')} fontSize="14px" fontWeight="500" textAlign="center" noOfLines={4} lineHeight="1.4">
            {post.content || 'No content'}
          </Text>
        </Box>
      )}
      <Box position="absolute" bottom={2} right={2} bg="rgba(0, 0, 0, 0.6)" backdropFilter="blur(20px)" borderRadius="full" px={3} py={1.5} zIndex={5}>
        <HStack fontSize="11px" color={textColor} spacing={3}>
          <HStack spacing={1}><Heart size={14} fill="currentColor" /><Text fontWeight="600">{post.likes?.length || 0}</Text></HStack>
          <HStack spacing={1}><MessageCircle size={14} /><Text fontWeight="600">{post.comments?.length || 0}</Text></HStack>
        </HStack>
      </Box>
    </Box>
  )

  return (
    <Box
      sx={{
        '@media (max-width: 1023px)': { width: '100vw', position: 'relative', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', bg: cardBg },
        '@media (min-width: 1024px)': { width: '100%' },
      }}
    >
      <Box
        p={0}
        borderRadius={{ base: 0, lg: '12px' }}
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        sx={{ '@media (max-width: 1023px)': { borderRadius: 0 } }}
      >
        <VStack spacing={3} align="stretch" p={{ base: 3, md: 4, lg: 4 }} px={{ base: 0, md: 4 }}>
          <Tabs index={activeTab} onChange={setActiveTab} variant="unstyled" w="100%">
            <TabList gap={{ base: 4, md: 6 }} borderBottom="1px solid" borderColor={borderColor} px={{ base: 4, md: 0 }} pb={2}>
              <Tab
                fontSize="sm"
                fontWeight="500"
                color={subtextColor}
                _selected={{ color: 'blue.500', fontWeight: '700', borderBottom: '2px solid', borderColor: 'blue.500', mb: '-2px' }}
                px={0}
                py={1}
                bg="transparent"
                borderRadius={0}
              >
                All Posts
              </Tab>
              {isOwnProfile && (
                <>
                  <Tab
                    fontSize="sm"
                    fontWeight="500"
                    color={subtextColor}
                    _selected={{ color: 'blue.500', fontWeight: '700', borderBottom: '2px solid', borderColor: 'blue.500', mb: '-2px' }}
                    px={0}
                    py={1}
                    bg="transparent"
                    borderRadius={0}
                  >
                    Archived
                  </Tab>
                  <Tab
                    fontSize="sm"
                    fontWeight="500"
                    color={subtextColor}
                    _selected={{ color: 'blue.500', fontWeight: '700', borderBottom: '2px solid', borderColor: 'blue.500', mb: '-2px' }}
                    px={0}
                    py={1}
                    bg="transparent"
                    borderRadius={0}
                  >
                    Saved
                  </Tab>
                  <Tab
                    fontSize="sm"
                    fontWeight="500"
                    color={subtextColor}
                    _selected={{ color: 'blue.500', fontWeight: '700', borderBottom: '2px solid', borderColor: 'blue.500', mb: '-2px' }}
                    px={0}
                    py={1}
                    bg="transparent"
                    borderRadius={0}
                  >
                    Memories
                  </Tab>
                </>
              )}
            </TabList>

            <TabPanels>
              <TabPanel px={0} py={0}>
                {postsLoading ? (
                  <Center py={10}><Spinner size="xl" colorScheme="brand" /></Center>
                ) : isPrivateProfile && !isOwnProfile ? (
                  <Text color={subtextColor} textAlign="center" py={8} fontSize="sm">
                    This account is private. Send a follow request to see their posts.
                  </Text>
                ) : allPosts.length > 0 ? (
                  <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={0}>
                    {allPosts.map((post) => renderPostCard(post))}
                  </SimpleGrid>
                ) : (
                  <Text color={textColor} textAlign="center" py={8}>No posts yet</Text>
                )}
              </TabPanel>

              <TabPanel px={0} py={0}>
                {isPrivateProfile && !isOwnProfile ? (
                  <Text color={subtextColor} textAlign="center" py={8} fontSize="sm">
                    This account is private. Send a follow request to see their posts.
                  </Text>
                ) : postsData?.data && postsData.data.length > 0 ? (
                  <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={0}>
                    {postsData.data.map((post) => renderArchivedCard(post))}
                  </SimpleGrid>
                ) : (
                  <Text color={textColor} textAlign="center" py={8}>No archived posts</Text>
                )}
              </TabPanel>

              {isOwnProfile && (
                <TabPanel px={0} py={0}>
                  {savedPostsLoading ? (
                    <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={2}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <PostCardSkeleton key={i} borderRadius="12px" />
                    ))}
                  </SimpleGrid>
                  ) : savedPosts.length > 0 ? (
                    <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={0}>
                      {savedPosts.map((savedPost) => {
                        const post = savedPost.post
                        if (!post) return null
                        return (
                          <Box
                            key={post._id}
                            className="post-card"
                            position="relative"
                            borderRadius={{ base: 0, lg: '16px' }}
                            overflow="hidden"
                            cursor="pointer"
                            onClick={() => { setSelectedPost(post); onViewPostOpen() }}
                            transition="all 0.3s"
                            _hover={{ transform: 'scale(1.05) translateY(-4px)', boxShadow: `0 16px 48px ${shadowColor}` }}
                          >
                            {post.images && post.images.length > 0 ? (
                              <Image src={post.images[0]} alt="Post" w="full" h="150px" objectFit="cover" />
                            ) : post.song ? (
                              <Box w="full" h="150px" bgGradient="linear(135deg, #667eea 0%, #764ba2 100%)" display="flex" alignItems="center" justifyContent="center">
                                <Music size={36} color={textColor} />
                              </Box>
                            ) : (
                              <Box w="full" h="150px" bg={useColorModeValue('gray.200', 'gray.700')} display="flex" alignItems="center" justifyContent="center" p={3}>
                                <Text color={textColor} fontSize="xs" textAlign="center">{post.content?.substring(0, 40)}...</Text>
                              </Box>
                            )}
                            <Box position="absolute" bottom={0} left={0} right={0} bg="blackAlpha.600" backdropFilter="blur(10px)" p={1.5}>
                              <HStack fontSize="10px" color={textColor} justify="space-around" spacing={1.5}>
                                <HStack spacing={0.5}><Heart size={12} fill="currentColor" /><Text>{post.likes?.length || 0}</Text></HStack>
                                <HStack spacing={0.5}><MessageCircle size={12} /><Text>{post.comments?.length || 0}</Text></HStack>
                              </HStack>
                            </Box>
                          </Box>
                        )
                      })}
                    </SimpleGrid>
                  ) : (
                    <Text color={textColor} textAlign="center" py={8}>No saved posts yet</Text>
                  )}
                </TabPanel>
              )}
              {isOwnProfile && (
                <TabPanel px={0} py={0}>
                  <VStack align="stretch" spacing={4}>
                    <HStack justify="space-between" wrap="wrap" gap={2}>
                      <ButtonGroup size="sm" isAttached variant="outline">
                        <Button
                          isActive={memorySortOrder === 'desc'}
                          onClick={() => setMemorySortOrder('desc')}
                          borderColor={borderColor}
                          color={textColor}
                        >
                          Newest first
                        </Button>
                        <Button
                          isActive={memorySortOrder === 'asc'}
                          onClick={() => setMemorySortOrder('asc')}
                          borderColor={borderColor}
                          color={textColor}
                        >
                          Oldest first
                        </Button>
                      </ButtonGroup>
                      <Button
                        leftIcon={<ImageIcon size={18} />}
                        size="sm"
                        colorScheme="blue"
                        onClick={onAddMemoryOpen}
                      >
                        Add memory
                      </Button>
                    </HStack>
                    {memoriesLoading ? (
                      <Center py={10}><Spinner size="xl" colorScheme="brand" /></Center>
                    ) : memories.length > 0 ? (
                      <Box
                        position="relative"
                        pl={{ base: 8, md: 10 }}
                        pb={4}
                        sx={{
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: { base: '11px', md: '15px' },
                            top: '12px',
                            bottom: '12px',
                            width: '2px',
                            bg: borderColor,
                            borderRadius: '1px',
                            zIndex: 0,
                          },
                        }}
                      >
                        {timelineGroups.map((group, index) => (
                          <Flex
                            key={`${group.year}-${group.month}`}
                            position="relative"
                            align="flex-start"
                            gap={0}
                            mb={index < timelineGroups.length - 1 ? 8 : 0}
                            zIndex={1}
                          >
                            <Box
                              position="absolute"
                              left={{ base: '-29px', md: '-33px' }}
                              top="2px"
                              w={{ base: '20px', md: '24px' }}
                              h={{ base: '20px', md: '24px' }}
                              borderRadius="full"
                              bg="blue.500"
                              borderWidth="3px"
                              borderStyle="solid"
                              borderColor={cardBg}
                              flexShrink={0}
                            />
                            <Box flex={1} minW={0}>
                              <Text
                                fontSize="sm"
                                fontWeight="700"
                                color={textColor}
                                mb={3}
                                textTransform="uppercase"
                                letterSpacing="wider"
                              >
                                {group.label}
                              </Text>
                              <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={3}>
                                {group.items.map((memory) => (
                                  <MemoryCard
                                    key={memory._id}
                                    memory={memory}
                                    onDeleted={refetchMemories}
                                  />
                                ))}
                              </SimpleGrid>
                            </Box>
                          </Flex>
                        ))}
                      </Box>
                    ) : (
                      <Box textAlign="center" py={10}>
                        <ImageIcon size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                        <Text color={textColor} mb={2}>No memories yet</Text>
                        <Text color={subtextColor} fontSize="sm" mb={4}>Add photos with a date to revisit them here. Only you can see these.</Text>
                        <Button leftIcon={<ImageIcon size={18} />} size="sm" colorScheme="blue" onClick={onAddMemoryOpen}>
                          Add your first memory
                        </Button>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </VStack>
      </Box>
      <AddMemoryModal
        isOpen={isAddMemoryOpen}
        onClose={onAddMemoryClose}
        onSuccess={refetchMemories}
      />
    </Box>
  )
}
