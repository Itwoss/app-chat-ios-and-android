import {
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Box,
  SimpleGrid,
  Button,
  HStack,
  Badge,
  Avatar,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { Trophy, TrendingUp, TrendingDown, Globe, Award, BarChart3, Users, FileText, MessageCircle, Calendar, Briefcase, Heart, Eye, Share2, Image as ImageIcon, Video, Music } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getUserInfo } from '../utils/auth'
import UserAvatar from '../components/User/UserAvatar'
import UserName from '../components/User/UserName'
import { DashboardSkeleton } from '../components/Skeletons'
import { useGetLeaderboardQuery } from '../store/api/leaderboardApi'
import { useGetCurrentUserQuery, useGetUserPostsQuery, useGetFollowStatsQuery, useGetUserBookingsQuery, useGetUserClientProjectsQuery } from '../store/api/userApi'

const UserDashboard = () => {
  // Apple App Store Color Palette
  const isDark = useColorModeValue(false, true)
  const bgColor = useColorModeValue('#F2F2F7', '#000000')
  const cardBg = useColorModeValue('#FFFFFF', '#1C1C1E')
  const textColor = useColorModeValue('#6C6C70', '#98989D')
  const textPrimary = useColorModeValue('#000000', '#FFFFFF')
  const borderColor = useColorModeValue('#E5E5EA', '#2C2C2E')
  const accentBlue = useColorModeValue('#007AFF', '#0A84FF')
  const successGreen = useColorModeValue('#34C759', '#30D158')
  
  const userInfo = getUserInfo()
  const navigate = useNavigate()
  const hasLocalAuth = !!userInfo
  const userId = userInfo?.id

  const { data: currentUserData, isLoading: isLoadingUser } = useGetCurrentUserQuery(undefined, {
    skip: !hasLocalAuth
  })

  const { data: leaderboardData, error: leaderboardError, isLoading: isLoadingLeaderboard } = useGetLeaderboardQuery(
    { 
      type: 'monthly', 
      region: 'global',
      page: 1,
      limit: 100
    },
    {
      skip: !hasLocalAuth
    }
  )
  
  const { data: postsData } = useGetUserPostsQuery(
    { userId, page: 1, limit: 10 },
    { skip: !userId }
  )
  
  const { data: followStatsData } = useGetFollowStatsQuery(undefined, {
    skip: !userId
  })
  
  const { data: bookingsData } = useGetUserBookingsQuery(
    { page: 1, limit: 100 },
    { skip: !userId }
  )
  
  const { data: projectsData } = useGetUserClientProjectsQuery(
    { page: 1, limit: 100 },
    { skip: !userId }
  )
  
  const userStats = currentUserData?.data?.stats || {}
  const userRank = leaderboardData?.data?.userRank || null
  const aboveUsers = leaderboardData?.data?.aboveUsers || []
  const belowUsers = leaderboardData?.data?.belowUsers || []
  const filters = leaderboardData?.data?.filters || {}
  const pagination = leaderboardData?.data?.pagination || {}
  
  // Calculate additional stats
  const totalPosts = userStats.totalPosts || 0
  const totalFriends = userStats.totalFriends || 0
  const totalBookings = userStats.totalBookings || 0
  const totalProjects = userStats.totalClientProjects || 0
  const totalFollowers = followStatsData?.data?.followers || 0
  const totalFollowing = followStatsData?.data?.following || 0
  
  // Calculate post engagement
  const posts = postsData?.data || []
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0)
  const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0)
  
  // Calculate booking stats
  const pendingBookings = bookingsData?.data?.filter(b => b.status === 'pending').length || 0
  const activeBookings = bookingsData?.data?.filter(b => b.status === 'confirmed' || b.status === 'completed').length || 0
  
  // Calculate project stats
  const activeProjects = projectsData?.data?.filter(p => {
    const hasPendingMeetings = p.meetings?.some(m => m.status === 'pending')
    const hasPendingSteps = p.workSteps?.some(s => s.status === 'pending' || s.status === 'in-progress')
    return hasPendingMeetings || hasPendingSteps
  }).length || 0
  
  // Show loading state
  if (isLoadingLeaderboard || isLoadingUser) {
    return (
      <Box minH="100vh" bg={bgColor} py={6} px={{ base: 4, md: 6 }}>
        <Box maxW="1400px" mx="auto">
          <DashboardSkeleton />
        </Box>
      </Box>
    )
  }
  
  // Show error state if authentication failed
  if (leaderboardError && leaderboardError.status === 401) {
    return (
      <VStack spacing={6} align="stretch">
          <Box
            bg={bgColor}
            borderRadius="16px"
            border="1px solid"
            borderColor={borderColor}
            p={12}
            textAlign="center"
          >
            <Text color={textColor} fontSize="16px" mb={4}>
              Authentication required. Please refresh the page or log in again.
            </Text>
            <Button
              bg={accentBlue}
              color="white"
              borderRadius="12px"
              fontSize="15px"
              fontWeight="600"
              onClick={() => window.location.reload()}
              _hover={{ 
                bg: isDark ? '#0A84FF' : '#0051D5',
                transform: 'translateY(-1px)',
                boxShadow: 'lg'
              }}
              transition="all 0.2s"
            >
              Refresh Page
            </Button>
          </Box>
        </VStack>
    )
  }

  // Format rank display
  const getRankDisplay = (rank) => {
    if (!rank) return '—'
    const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'
    return `#${rank}${suffix}`
  }

  // Get rank badge color
  const getRankBadgeColor = (rank) => {
    if (!rank) return textColor
    if (rank === 1) return '#FFD700' // Gold
    if (rank === 2) return '#C0C0C0' // Silver
    if (rank === 3) return '#CD7F32' // Bronze
    return accentBlue
  }

  return (
    <Box minH="100vh" bg={bgColor} py={6} px={{ base: 4, md: 6 }}>
      <VStack spacing={6} align="stretch" maxW="1400px" mx="auto">
          {/* Welcome Header */}
          <Box
            bg={cardBg}
            borderRadius="20px"
            p={6}
            border="1px solid"
            borderColor={borderColor}
            shadow="sm"
          >
            <HStack spacing={4} align="center">
              <Avatar size="xl" name={userInfo?.name || 'User'} src={userInfo?.profileImage} />
              <Box flex={1}>
                <Heading size="xl" mb={2} color={textPrimary} fontWeight="700" letterSpacing="-0.5px">
                  Welcome back, {userInfo?.name || 'User'}! 👋
                </Heading>
                <Text color={textColor} fontSize="16px">
                  Here's your activity overview and statistics
                </Text>
                {(currentUserData?.data?.bio || userInfo?.bio) && (
                  <Text
                    color={textColor}
                    fontSize="14px"
                    mt={2}
                    lineHeight="1.5"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                  >
                    {currentUserData?.data?.bio || userInfo?.bio}
                  </Text>
                )}
              </Box>
            </HStack>
          </Box>

          {/* Quick Stats Grid */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px" shadow="sm">
              <CardBody>
                <Stat>
                  <HStack spacing={3} mb={2}>
                    <Box p={2} bg={accentBlue + '20'} borderRadius="8px">
                      <FileText size={20} color={accentBlue} />
                    </Box>
                    <StatLabel color={textColor} fontSize="13px" fontWeight="600">Posts</StatLabel>
                  </HStack>
                  <StatNumber color={textPrimary} fontSize="32px" fontWeight="700">
                    {totalPosts}
                  </StatNumber>
                  <StatHelpText color={textColor} fontSize="12px" mb={0}>
                    Total published
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px" shadow="sm">
              <CardBody>
                <Stat>
                  <HStack spacing={3} mb={2}>
                    <Box p={2} bg={successGreen + '20'} borderRadius="8px">
                      <Users size={20} color={successGreen} />
                    </Box>
                    <StatLabel color={textColor} fontSize="13px" fontWeight="600">Friends</StatLabel>
                  </HStack>
                  <StatNumber color={textPrimary} fontSize="32px" fontWeight="700">
                    {totalFriends}
                  </StatNumber>
                  <StatHelpText color={textColor} fontSize="12px" mb={0}>
                    Connections
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px" shadow="sm">
              <CardBody>
                <Stat>
                  <HStack spacing={3} mb={2}>
                    <Box p={2} bg="#FF950020" borderRadius="8px">
                      <Heart size={20} color="#FF9500" />
                    </Box>
                    <StatLabel color={textColor} fontSize="13px" fontWeight="600">Likes</StatLabel>
                  </HStack>
                  <StatNumber color={textPrimary} fontSize="32px" fontWeight="700">
                    {totalLikes}
                  </StatNumber>
                  <StatHelpText color={textColor} fontSize="12px" mb={0}>
                    Total received
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px" shadow="sm">
              <CardBody>
                <Stat>
                  <HStack spacing={3} mb={2}>
                    <Box p={2} bg={accentBlue + '20'} borderRadius="8px">
                      <MessageCircle size={20} color={accentBlue} />
                    </Box>
                    <StatLabel color={textColor} fontSize="13px" fontWeight="600">Comments</StatLabel>
                  </HStack>
                  <StatNumber color={textPrimary} fontSize="32px" fontWeight="700">
                    {totalComments}
                  </StatNumber>
                  <StatHelpText color={textColor} fontSize="12px" mb={0}>
                    Total received
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Detailed Stats Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {/* Social Stats */}
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px" shadow="sm">
              <CardBody>
                <Heading size="sm" mb={4} color={textPrimary} fontWeight="600">
                  Social Activity
                </Heading>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Users size={18} color={textColor} />
                      <Text color={textColor} fontSize="15px">Followers</Text>
                    </HStack>
                    <Text color={textPrimary} fontSize="18px" fontWeight="600">{totalFollowers}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Users size={18} color={textColor} />
                      <Text color={textColor} fontSize="15px">Following</Text>
                    </HStack>
                    <Text color={textPrimary} fontSize="18px" fontWeight="600">{totalFollowing}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Users size={18} color={textColor} />
                      <Text color={textColor} fontSize="15px">Friends</Text>
                    </HStack>
                    <Text color={textPrimary} fontSize="18px" fontWeight="600">{totalFriends}</Text>
                  </HStack>
                </VStack>
                <Button
                  mt={4}
                  size="sm"
                  bg={accentBlue}
                  color="white"
                  w="full"
                  onClick={() => navigate('/user/friends')}
                  _hover={{ bg: isDark ? '#0A84FF' : '#0051D5' }}
                >
                  Manage Friends
                </Button>
              </CardBody>
            </Card>

            {/* Bookings Stats */}
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px" shadow="sm">
              <CardBody>
                <Heading size="sm" mb={4} color={textPrimary} fontWeight="600">
                  Bookings
                </Heading>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Calendar size={18} color={textColor} />
                      <Text color={textColor} fontSize="15px">Total</Text>
                    </HStack>
                    <Text color={textPrimary} fontSize="18px" fontWeight="600">{totalBookings}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Badge colorScheme="yellow" borderRadius="6px" px={2} py={1}>Pending</Badge>
                      <Text color={textColor} fontSize="15px">Pending</Text>
                    </HStack>
                    <Text color={textPrimary} fontSize="18px" fontWeight="600">{pendingBookings}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Badge colorScheme="green" borderRadius="6px" px={2} py={1}>Active</Badge>
                      <Text color={textColor} fontSize="15px">Active</Text>
                    </HStack>
                    <Text color={textPrimary} fontSize="18px" fontWeight="600">{activeBookings}</Text>
                  </HStack>
                </VStack>
                <Button
                  mt={4}
                  size="sm"
                  bg={accentBlue}
                  color="white"
                  w="full"
                  onClick={() => navigate('/user/projects')}
                  _hover={{ bg: isDark ? '#0A84FF' : '#0051D5' }}
                >
                  View Bookings
                </Button>
              </CardBody>
            </Card>

            {/* Projects Stats */}
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="16px" shadow="sm">
              <CardBody>
                <Heading size="sm" mb={4} color={textPrimary} fontWeight="600">
                  Projects
                </Heading>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Briefcase size={18} color={textColor} />
                      <Text color={textColor} fontSize="15px">Total</Text>
                    </HStack>
                    <Text color={textPrimary} fontSize="18px" fontWeight="600">{totalProjects}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Badge colorScheme="blue" borderRadius="6px" px={2} py={1}>Active</Badge>
                      <Text color={textColor} fontSize="15px">Active</Text>
                    </HStack>
                    <Text color={textPrimary} fontSize="18px" fontWeight="600">{activeProjects}</Text>
                  </HStack>
                </VStack>
                <Button
                  mt={4}
                  size="sm"
                  bg={accentBlue}
                  color="white"
                  w="full"
                  onClick={() => navigate('/user/client-projects')}
                  _hover={{ bg: isDark ? '#0A84FF' : '#0051D5' }}
                >
                  View Projects
                </Button>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Detailed Leaderboard Section */}
          <Box
            bg={cardBg}
            borderRadius="16px"
            border="1px solid"
            borderColor={borderColor}
            overflow="hidden"
            boxShadow="sm"
          >
          {/* Header */}
          <Box
            px={6}
            py={5}
            borderBottom="1px solid"
            borderColor={borderColor}
            bgGradient={isDark 
              ? 'linear(to-r, rgba(10, 132, 255, 0.1), rgba(10, 132, 255, 0.05))'
              : 'linear(to-r, rgba(0, 122, 255, 0.1), rgba(0, 122, 255, 0.05))'
            }
          >
            <HStack justify="space-between" align="center" mb={3}>
              <HStack spacing={3}>
                <Box
                  p={3}
                  bg={accentBlue}
                  borderRadius="12px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Trophy size={24} color="white" />
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" color={textPrimary} fontWeight="700" letterSpacing="-0.5px">
                    Leaderboard
                  </Heading>
                  <Text fontSize="13px" color={textColor} mt={1}>
                    {filters.type ? filters.type.charAt(0).toUpperCase() + filters.type.slice(1) : 'Monthly'} Rankings
                    {filters.region && filters.region !== 'global' && ` • ${filters.region}`}
                  </Text>
                </VStack>
              </HStack>
            <Button
              size="sm"
                rightIcon={<BarChart3 size={16} />}
                bg={accentBlue}
                color="white"
                borderRadius="12px"
                fontSize="14px"
                fontWeight="600"
                onClick={() => navigate('/user/leaderboard')}
                _hover={{ 
                  bg: isDark ? '#0A84FF' : '#0051D5',
                  transform: 'translateY(-1px)',
                  boxShadow: 'lg'
                }}
                transition="all 0.2s"
              >
                View Full Leaderboard
            </Button>
          </HStack>
          </Box>

          {/* Main Leaderboard Content */}
          <Box p={6}>
            {userRank ? (
              <VStack spacing={6} align="stretch">
                {/* User's Current Rank - Large Display */}
                <Box
                  bgGradient={isDark 
                    ? 'linear(to-br, rgba(10, 132, 255, 0.15), rgba(10, 132, 255, 0.05))'
                    : 'linear(to-br, rgba(0, 122, 255, 0.15), rgba(0, 122, 255, 0.05))'
                  }
                  borderRadius="16px"
                  p={6}
                  border="1px solid"
                  borderColor={isDark ? 'rgba(10, 132, 255, 0.3)' : 'rgba(0, 122, 255, 0.3)'}
                >
                  <HStack justify="space-between" align="center" mb={4}>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="13px" fontWeight="600" color={textColor} textTransform="uppercase" letterSpacing="0.5px">
                        Your Current Rank
                      </Text>
                      <HStack spacing={3} align="baseline">
                        <Text
                          fontSize="56px"
                          fontWeight="700"
                          color={getRankBadgeColor(userRank.rank)}
                          lineHeight="1"
                          letterSpacing="-2px"
                        >
                          {userRank.rank}
                        </Text>
                        <Text fontSize="20px" color={textColor} fontWeight="500">
                          {getRankDisplay(userRank.rank)}
                        </Text>
                      </HStack>
                    </VStack>
                    <Box
                      p={4}
                      bg={cardBg}
                      borderRadius="12px"
                      border="1px solid"
                      borderColor={borderColor}
                      textAlign="center"
                      minW="120px"
                    >
                      <Text fontSize="13px" fontWeight="600" color={textColor} mb={1}>
                        Points
                      </Text>
                      <Text fontSize="32px" fontWeight="700" color={textPrimary}>
                        {userRank.count || 0}
                      </Text>
                    </Box>
                  </HStack>

                  {/* Stats Grid */}
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={4}>
                    <Box
                      p={3}
                      bg={cardBg}
                      borderRadius="12px"
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <HStack spacing={2} mb={2}>
                        <Globe size={16} color={textColor} />
                        <Text fontSize="12px" fontWeight="600" color={textColor} textTransform="uppercase">
                          Region
                        </Text>
                      </HStack>
                      <Text fontSize="16px" fontWeight="600" color={textPrimary}>
                        {filters.region === 'global' ? 'Global' : filters.region || 'Global'}
                      </Text>
                    </Box>

                    <Box
                      p={3}
                      bg={cardBg}
                      borderRadius="12px"
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <HStack spacing={2} mb={2}>
                        <BarChart3 size={16} color={textColor} />
                        <Text fontSize="12px" fontWeight="600" color={textColor} textTransform="uppercase">
                          Type
                        </Text>
                      </HStack>
                      <Text fontSize="16px" fontWeight="600" color={textPrimary}>
                        {filters.type ? filters.type.charAt(0).toUpperCase() + filters.type.slice(1) : 'Monthly'}
                      </Text>
                    </Box>

                    <Box
                      p={3}
                      bg={cardBg}
                      borderRadius="12px"
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <HStack spacing={2} mb={2}>
                        <Users size={16} color={textColor} />
                        <Text fontSize="12px" fontWeight="600" color={textColor} textTransform="uppercase">
                          Total Players
                        </Text>
                        </HStack>
                      <Text fontSize="16px" fontWeight="600" color={textPrimary}>
                        {pagination.total || 0}
                      </Text>
                    </Box>

                    <Box
                      p={3}
                      bg={cardBg}
                      borderRadius="12px"
                      border="1px solid"
                      borderColor={borderColor}
                    >
                      <HStack spacing={2} mb={2}>
                        <Award size={16} color={textColor} />
                        <Text fontSize="12px" fontWeight="600" color={textColor} textTransform="uppercase">
                          Percentile
                        </Text>
                      </HStack>
                      <Text fontSize="16px" fontWeight="600" color={textPrimary}>
                        {pagination.total ? Math.round(((pagination.total - userRank.rank + 1) / pagination.total) * 100) : 0}%
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Nearby Rankings */}
                {(aboveUsers.length > 0 || belowUsers.length > 0) && (
                  <Box>
                    <Text fontSize="15px" fontWeight="600" color={textPrimary} mb={4}>
                      Nearby Rankings
                    </Text>
                    <VStack spacing={2} align="stretch">
                      {/* Users Above */}
                      {aboveUsers.slice().reverse().map((user, index) => (
                        <Box
                          key={user._id || index}
                          p={4}
                          bg={cardBg}
                          borderRadius="12px"
                          border="1px solid"
                          borderColor={borderColor}
                          _hover={{
                            borderColor: accentBlue,
                            transform: 'translateX(4px)'
                          }}
                          transition="all 0.2s"
                        >
                          <HStack justify="space-between" align="center">
                            <HStack spacing={3}>
                              <Text fontSize="18px" fontWeight="700" color={textColor} minW="40px">
                                #{user.rank}
                              </Text>
                              <UserAvatar
                                userId={user._id || user.userId}
                                name={user.name}
                                src={user.profileImage}
                                size="sm"
                                subscription={user.subscription}
                              />
                              <UserName
                                userId={user._id || user.userId}
                                name={user.name}
                                subscription={user.subscription}
                                fontSize="15px"
                                fontWeight="500"
                                color={textPrimary}
                              />
                            </HStack>
                            <HStack spacing={4}>
                              <VStack align="end" spacing={0}>
                                <Text fontSize="13px" color={textColor}>Points</Text>
                                <Text fontSize="16px" fontWeight="600" color={textPrimary}>
                                  {user.count || 0}
                        </Text>
                      </VStack>
                              <TrendingUp size={18} color={textColor} />
                            </HStack>
                          </HStack>
                        </Box>
                      ))}

                      {/* Current User - Highlighted */}
                      <Box
                        p={4}
                        bgGradient={isDark 
                          ? 'linear(to-r, rgba(10, 132, 255, 0.2), rgba(10, 132, 255, 0.1))'
                          : 'linear(to-r, rgba(0, 122, 255, 0.2), rgba(0, 122, 255, 0.1))'
                        }
                        borderRadius="12px"
                        border="2px solid"
                        borderColor={accentBlue}
                        boxShadow="sm"
                      >
                        <HStack justify="space-between" align="center">
                          <HStack spacing={3}>
                            <Text fontSize="18px" fontWeight="700" color={accentBlue} minW="40px">
                              #{userRank.rank}
                            </Text>
                            <Avatar size="sm" name={userInfo?.name || 'You'} src={userInfo?.profileImage} borderRadius="8px" />
                            <Text fontSize="15px" fontWeight="600" color={textPrimary}>
                              You
                            </Text>
                            <Badge
                              bg={accentBlue}
                              color="white"
                              borderRadius="6px"
                              px={2}
                              py={1}
                              fontSize="11px"
                              fontWeight="600"
                            >
                              Current
                      </Badge>
                    </HStack>
                          <HStack spacing={4}>
                            <VStack align="end" spacing={0}>
                              <Text fontSize="13px" color={textColor}>Points</Text>
                              <Text fontSize="16px" fontWeight="700" color={accentBlue}>
                                {userRank.count || 0}
                              </Text>
                            </VStack>
                            <Trophy size={18} color={accentBlue} />
                          </HStack>
                        </HStack>
                      </Box>

                      {/* Users Below */}
                      {belowUsers.map((user, index) => (
                        <Box
                          key={user._id || index}
                          p={4}
                          bg={cardBg}
                          borderRadius="12px"
                          border="1px solid"
                          borderColor={borderColor}
                          _hover={{
                            borderColor: accentBlue,
                            transform: 'translateX(4px)'
                          }}
                          transition="all 0.2s"
                        >
                          <HStack justify="space-between" align="center">
                            <HStack spacing={3}>
                              <Text fontSize="18px" fontWeight="700" color={textColor} minW="40px">
                                #{user.rank}
                              </Text>
                              <UserAvatar
                                userId={user._id || user.userId}
                                name={user.name}
                                src={user.profileImage}
                                size="sm"
                                subscription={user.subscription}
                              />
                              <UserName
                                userId={user._id || user.userId}
                                name={user.name}
                                subscription={user.subscription}
                                fontSize="15px"
                                fontWeight="500"
                                color={textPrimary}
                              />
                            </HStack>
                            <HStack spacing={4}>
                              <VStack align="end" spacing={0}>
                                <Text fontSize="13px" color={textColor}>Points</Text>
                                <Text fontSize="16px" fontWeight="600" color={textPrimary}>
                                  {user.count || 0}
                          </Text>
                              </VStack>
                              <TrendingDown size={18} color={textColor} />
                            </HStack>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                    )}
                  </VStack>
            ) : (
              <Box textAlign="center" py={12}>
                <Box
                  p={6}
                  bg={isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'}
                  borderRadius="16px"
                  display="inline-block"
                  mb={4}
                >
                  <Trophy size={48} color={textColor} />
                </Box>
                <Text fontSize="18px" fontWeight="600" color={textPrimary} mb={2}>
                  No Leaderboard Rank Yet
                </Text>
                <Text fontSize="14px" color={textColor} mb={6} maxW="400px" mx="auto">
                  Start engaging with the platform to earn points and climb the leaderboard!
            </Text>
                <Button
                  bg={accentBlue}
                  color="white"
                  borderRadius="12px"
                  fontSize="15px"
                  fontWeight="600"
                  px={6}
                  onClick={() => navigate('/user/home')}
                  _hover={{ 
                    bg: isDark ? '#0A84FF' : '#0051D5',
                    transform: 'translateY(-1px)',
                    boxShadow: 'lg'
                  }}
                  transition="all 0.2s"
                >
                  Get Started
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </VStack>
    </Box>
  )
}

export default UserDashboard


