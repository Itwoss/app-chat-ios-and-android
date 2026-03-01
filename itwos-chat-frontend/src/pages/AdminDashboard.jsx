import {
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Box,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  HStack,
  Badge,
  Divider,
  Spinner,
  Center,
  Progress,
} from '@chakra-ui/react'
import {
  Users,
  FolderKanban,
  UserCheck,
  Calendar,
  Briefcase,
  Video,
  MessageSquare,
  TrendingUp,
  Activity,
  FileText,
  Image,
  Crown,
  Bell,
  CreditCard,
  DollarSign,
  Eye,
  Heart,
  MessageCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGetAdminStatsQuery } from '../store/api/adminApi'
import AdminLayout from '../components/Admin/AdminLayout'
import { getAdminInfo, getUserInfo } from '../utils/auth'

const AdminDashboard = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('gray.50', 'gray.600')
  const navigate = useNavigate()
  const adminInfo = getAdminInfo()
  const userInfo = getUserInfo()
  const role = adminInfo?.role || userInfo?.role

  // Only fetch admin stats if user is actually an admin
  const { data: statsData, isLoading, error } = useGetAdminStatsQuery(undefined, {
    skip: role !== 'admin'
  })

  if (isLoading) {
    return (
      <AdminLayout>
        <Center minH="400px">
          <Spinner size="xl" colorScheme="brand" />
        </Center>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <Center minH="400px">
          <Text color="red.500">Error loading dashboard stats</Text>
        </Center>
      </AdminLayout>
    )
  }

  const stats = statsData?.data || {}

  const StatCard = ({ icon: Icon, label, value, helpText, colorScheme, onClick, trend }) => (
    <Card
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      _hover={onClick ? { transform: 'translateY(-2px)', boxShadow: 'md' } : {}}
      transition="all 0.2s"
    >
      <CardBody>
        <Stat>
          <HStack justify="space-between" mb={2}>
            <Box
              p={2}
              borderRadius="md"
              bg={`${colorScheme}.100`}
              color={`${colorScheme}.600`}
              _dark={{ bg: `${colorScheme}.900`, color: `${colorScheme}.300` }}
            >
              <Icon size={24} />
            </Box>
            {trend && (
              <StatArrow type={trend > 0 ? 'increase' : 'decrease'} />
            )}
          </HStack>
          <StatLabel>{label}</StatLabel>
          <StatNumber fontSize="2xl">{value || 0}</StatNumber>
          {helpText && <StatHelpText>{helpText}</StatHelpText>}
        </Stat>
      </CardBody>
    </Card>
  )

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>
            Welcome back, {adminInfo?.name || 'Admin'}!
          </Heading>
          <Text color={textColor}>
            Here's an overview of your platform statistics and recent activity.
          </Text>
        </Box>

        {/* Main Stats Grid */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.users?.total}
            helpText={`${stats.users?.active || 0} active`}
            colorScheme="blue"
            onClick={() => navigate('/admin/users')}
            trend={stats.users?.recent}
          />
          <StatCard
            icon={FolderKanban}
            label="Projects"
            value={stats.projects?.total}
            helpText={`${stats.projects?.active || 0} active`}
            colorScheme="purple"
            onClick={() => navigate('/admin/projects')}
            trend={stats.projects?.recent}
          />
          <StatCard
            icon={Calendar}
            label="Bookings"
            value={stats.bookings?.total}
            helpText={`${stats.bookings?.pending || 0} pending`}
            colorScheme="orange"
            onClick={() => navigate('/admin/bookings')}
            trend={stats.bookings?.recent}
          />
          <StatCard
            icon={Briefcase}
            label="Client Projects"
            value={stats.clientProjects?.total}
            helpText={`${stats.clientProjects?.active || 0} active`}
            colorScheme="green"
            onClick={() => navigate('/admin/client-projects')}
          />
        </SimpleGrid>

        {/* Secondary Stats Grid - Social & Content */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
          <StatCard
            icon={MessageSquare}
            label="Active Chats"
            value={stats.social?.totalChats}
            helpText={`${stats.social?.totalMessages || 0} messages`}
            colorScheme="pink"
            onClick={() => navigate('/admin/chats')}
          />
          <StatCard
            icon={FileText}
            label="Posts"
            value={stats.posts?.total}
            helpText={`${stats.posts?.totalLikes || 0} likes`}
            colorScheme="cyan"
            onClick={() => navigate('/admin/posts')}
          />
          <StatCard
            icon={Image}
            label="Stories"
            value={stats.stories?.active}
            helpText={`${stats.stories?.totalViews || 0} views`}
            colorScheme="purple"
            onClick={() => navigate('/admin/stories')}
          />
          <StatCard
            icon={Crown}
            label="Subscriptions"
            value={stats.subscriptions?.active}
            helpText={`${stats.subscriptions?.total || 0} total`}
            colorScheme="yellow"
            onClick={() => navigate('/admin/subscriptions')}
          />
        </SimpleGrid>

        {/* Tertiary Stats Grid */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={4}>
          <StatCard
            icon={UserCheck}
            label="Team Members"
            value={stats.teams?.total}
            helpText={`${stats.teams?.active || 0} active`}
            colorScheme="teal"
            onClick={() => navigate('/admin/teams')}
          />
          <StatCard
            icon={Video}
            label="Meetings"
            value={stats.meetings?.total}
            helpText={`${stats.meetings?.pending || 0} pending`}
            colorScheme="red"
            onClick={() => navigate('/admin/meetings')}
          />
          <StatCard
            icon={Bell}
            label="Notifications"
            value={stats.notifications?.total}
            helpText={`${stats.notifications?.unread || 0} unread`}
            colorScheme="orange"
          />
          <StatCard
            icon={CreditCard}
            label="Payments"
            value={stats.payments?.successful}
            helpText={`₹${(stats.payments?.totalAmount || 0).toLocaleString('en-IN')}`}
            colorScheme="green"
          />
        </SimpleGrid>

        {/* Detailed Stats Cards */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {/* Users Overview */}
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Users Overview</Heading>
                <Badge colorScheme="blue" fontSize="md">
                  {stats.users?.total || 0}
                </Badge>
              </HStack>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Active Users</Text>
                  <Text fontWeight="bold">{stats.users?.active || 0}</Text>
                </HStack>
                <Progress
                  value={stats.users?.total ? (stats.users.active / stats.users.total) * 100 : 0}
                  colorScheme="blue"
                  size="sm"
                  borderRadius="md"
                />
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Inactive Users</Text>
                  <Text fontWeight="bold">{stats.users?.inactive || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>New (Last 7 days)</Text>
                  <Badge colorScheme="green">{stats.users?.recent || 0}</Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Bookings Overview */}
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Bookings Overview</Heading>
                <Badge colorScheme="orange" fontSize="md">
                  {stats.bookings?.total || 0}
                </Badge>
              </HStack>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Confirmed</Text>
                  <Text fontWeight="bold" color="green.500">
                    {stats.bookings?.confirmed || 0}
                  </Text>
                </HStack>
                <Progress
                  value={
                    stats.bookings?.total
                      ? (stats.bookings.confirmed / stats.bookings.total) * 100
                      : 0
                  }
                  colorScheme="green"
                  size="sm"
                  borderRadius="md"
                />
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Pending</Text>
                  <Text fontWeight="bold" color="orange.500">
                    {stats.bookings?.pending || 0}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>New (Last 7 days)</Text>
                  <Badge colorScheme="blue">{stats.bookings?.recent || 0}</Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Projects Overview */}
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Projects Overview</Heading>
                <Badge colorScheme="purple" fontSize="md">
                  {stats.projects?.total || 0}
                </Badge>
              </HStack>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Active Projects</Text>
                  <Text fontWeight="bold">{stats.projects?.active || 0}</Text>
                </HStack>
                <Progress
                  value={
                    stats.projects?.total
                      ? (stats.projects.active / stats.projects.total) * 100
                      : 0
                  }
                  colorScheme="purple"
                  size="sm"
                  borderRadius="md"
                />
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Inactive Projects</Text>
                  <Text fontWeight="bold">{stats.projects?.inactive || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>New (Last 7 days)</Text>
                  <Badge colorScheme="green">{stats.projects?.recent || 0}</Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Social Activity */}
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Social Activity</Heading>
                <Badge colorScheme="pink" fontSize="md">
                  Active
                </Badge>
              </HStack>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Active Chats</Text>
                  <Text fontWeight="bold">{stats.social?.totalChats || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Total Messages</Text>
                  <Text fontWeight="bold">{stats.social?.totalMessages || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Unread Messages</Text>
                  <Text fontWeight="bold" color="orange.500">{stats.social?.unreadMessages || 0}</Text>
                </HStack>
                <Divider />
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Total Friendships</Text>
                  <Text fontWeight="bold">{stats.social?.totalFriends || 0}</Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Posts Overview */}
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Posts Overview</Heading>
                <Badge colorScheme="cyan" fontSize="md">
                  {stats.posts?.total || 0}
                </Badge>
              </HStack>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Active Posts</Text>
                  <Text fontWeight="bold">{stats.posts?.active || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>With Images</Text>
                  <Text fontWeight="bold">{stats.posts?.withImages || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Total Likes</Text>
                  <HStack spacing={1}>
                    <Heart size={14} />
                    <Text fontWeight="bold">{stats.posts?.totalLikes || 0}</Text>
                  </HStack>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Total Comments</Text>
                  <HStack spacing={1}>
                    <MessageCircle size={14} />
                    <Text fontWeight="bold">{stats.posts?.totalComments || 0}</Text>
                  </HStack>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>New (Last 7 days)</Text>
                  <Badge colorScheme="green">{stats.posts?.recent || 0}</Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Stories Overview */}
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Stories Overview</Heading>
                <Badge colorScheme="purple" fontSize="md">
                  {stats.stories?.active || 0} active
                </Badge>
              </HStack>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Total Stories</Text>
                  <Text fontWeight="bold">{stats.stories?.total || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Expired</Text>
                  <Text fontWeight="bold">{stats.stories?.expired || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Total Views</Text>
                  <HStack spacing={1}>
                    <Eye size={14} />
                    <Text fontWeight="bold">{stats.stories?.totalViews || 0}</Text>
                  </HStack>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Total Likes</Text>
                  <HStack spacing={1}>
                    <Heart size={14} />
                    <Text fontWeight="bold">{stats.stories?.totalLikes || 0}</Text>
                  </HStack>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>New (Last 7 days)</Text>
                  <Badge colorScheme="green">{stats.stories?.recent || 0}</Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Subscriptions & Revenue */}
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Subscriptions & Revenue</Heading>
                <Badge colorScheme="yellow" fontSize="md">
                  {stats.subscriptions?.active || 0}
                </Badge>
              </HStack>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Active Subscriptions</Text>
                  <Text fontWeight="bold" color="green.500">{stats.subscriptions?.active || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Total Revenue</Text>
                  <HStack spacing={1}>
                    <DollarSign size={14} />
                    <Text fontWeight="bold" color="green.500">
                      ₹{(stats.subscriptions?.totalRevenue || 0).toLocaleString('en-IN')}
                    </Text>
                  </HStack>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Monthly Revenue</Text>
                  <Text fontWeight="bold" color="blue.500">
                    ₹{(stats.subscriptions?.monthlyRevenue || 0).toLocaleString('en-IN')}
                  </Text>
                </HStack>
                <Divider />
                {stats.subscriptions?.byBadge && (
                  <>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color={textColor}>Blue Badges</Text>
                      <Badge colorScheme="blue">{stats.subscriptions.byBadge.blue || 0}</Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color={textColor}>Yellow Badges</Text>
                      <Badge colorScheme="yellow">{stats.subscriptions.byBadge.yellow || 0}</Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color={textColor}>Pink Badges</Text>
                      <Badge colorScheme="pink">{stats.subscriptions.byBadge.pink || 0}</Badge>
                    </HStack>
                  </>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Users Enhanced Details */}
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Users Enhanced Details</Heading>
                <Badge colorScheme="blue" fontSize="md">
                  {stats.users?.total || 0}
                </Badge>
              </HStack>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>With Location</Text>
                  <Text fontWeight="bold">{stats.users?.withLocation || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>With Subscriptions</Text>
                  <Text fontWeight="bold">{stats.users?.withSubscriptions || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>New (Last 7 days)</Text>
                  <Badge colorScheme="green">{stats.users?.recent || 0}</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>New (Last 30 days)</Text>
                  <Badge colorScheme="blue">{stats.users?.last30Days || 0}</Badge>
                </HStack>
                <Progress
                  value={stats.users?.total ? (stats.users.active / stats.users.total) * 100 : 0}
                  colorScheme="blue"
                  size="sm"
                  borderRadius="md"
                />
              </VStack>
            </CardBody>
          </Card>

          {/* Banners & Notifications */}
          <Card bg={bgColor} border="1px" borderColor={borderColor}>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Banners & Notifications</Heading>
                <Badge colorScheme="purple" fontSize="md">
                  {stats.banners?.total || 0}
                </Badge>
              </HStack>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Active Banners</Text>
                  <Text fontWeight="bold">{stats.banners?.active || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Total Purchases</Text>
                  <Text fontWeight="bold">{stats.banners?.totalPurchases || 0}</Text>
                </HStack>
                <Divider />
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Total Notifications</Text>
                  <Text fontWeight="bold">{stats.notifications?.total || 0}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={textColor}>Unread</Text>
                  <Text fontWeight="bold" color="orange.500">{stats.notifications?.unread || 0}</Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Quick Actions */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>
              Quick Actions
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
              <Box
                p={4}
                bg={cardBg}
                borderRadius="md"
                cursor="pointer"
                onClick={() => navigate('/admin/users')}
                _hover={{ bg: 'gray.100', _dark: { bg: 'gray.600' } }}
                transition="all 0.2s"
              >
                <VStack spacing={2}>
                  <Users size={24} />
                  <Text fontSize="sm" fontWeight="medium">Manage Users</Text>
                </VStack>
              </Box>
              <Box
                p={4}
                bg={cardBg}
                borderRadius="md"
                cursor="pointer"
                onClick={() => navigate('/admin/projects')}
                _hover={{ bg: 'gray.100', _dark: { bg: 'gray.600' } }}
                transition="all 0.2s"
              >
                <VStack spacing={2}>
                  <FolderKanban size={24} />
                  <Text fontSize="sm" fontWeight="medium">Manage Projects</Text>
                </VStack>
              </Box>
              <Box
                p={4}
                bg={cardBg}
                borderRadius="md"
                cursor="pointer"
                onClick={() => navigate('/admin/bookings')}
                _hover={{ bg: 'gray.100', _dark: { bg: 'gray.600' } }}
                transition="all 0.2s"
              >
                <VStack spacing={2}>
                  <Calendar size={24} />
                  <Text fontSize="sm" fontWeight="medium">View Bookings</Text>
                </VStack>
              </Box>
              <Box
                p={4}
                bg={cardBg}
                borderRadius="md"
                cursor="pointer"
                onClick={() => navigate('/admin/teams')}
                _hover={{ bg: 'gray.100', _dark: { bg: 'gray.600' } }}
                transition="all 0.2s"
              >
                <VStack spacing={2}>
                  <UserCheck size={24} />
                  <Text fontSize="sm" fontWeight="medium">Manage Teams</Text>
                </VStack>
              </Box>
              <Box
                p={4}
                bg={cardBg}
                borderRadius="md"
                cursor="pointer"
                onClick={() => navigate('/admin/subscriptions')}
                _hover={{ bg: 'gray.100', _dark: { bg: 'gray.600' } }}
                transition="all 0.2s"
              >
                <VStack spacing={2}>
                  <Crown size={24} />
                  <Text fontSize="sm" fontWeight="medium">Subscriptions</Text>
                </VStack>
              </Box>
              <Box
                p={4}
                bg={cardBg}
                borderRadius="md"
                cursor="pointer"
                onClick={() => navigate('/admin/stories')}
                _hover={{ bg: 'gray.100', _dark: { bg: 'gray.600' } }}
                transition="all 0.2s"
              >
                <VStack spacing={2}>
                  <Image size={24} />
                  <Text fontSize="sm" fontWeight="medium">Stories</Text>
                </VStack>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      </VStack>
    </AdminLayout>
  )
}

export default AdminDashboard
