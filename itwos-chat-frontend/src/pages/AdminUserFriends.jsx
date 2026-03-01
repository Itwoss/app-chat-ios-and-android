import {
  VStack,
  HStack,
  Heading,
  Text,
  Box,
  Avatar,
  useColorModeValue,
  Spinner,
  Center,
  Badge,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  useToast,
} from '@chakra-ui/react'
import { ArrowLeft, Users, Globe, Lock, Circle } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetUserFriendsAdminQuery } from '../store/api/adminApi'
import AdminLayout from '../components/Admin/AdminLayout'
import { EmptyState } from '../components/EmptyState/EmptyState'

const AdminUserFriends = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const bgColor = useColorModeValue('white', 'gray.800')
  const cardBg = useColorModeValue('gray.50', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()

  const { data, isLoading, error } = useGetUserFriendsAdminQuery(userId)

  const friends = data?.data || []
  const friendsCount = data?.count || friends.length

  const getOnlineStatus = (user) => {
    if (user.onlineStatus === 'online') {
      return { color: 'green.500', label: 'Online' }
    }
    if (user.lastSeen) {
      const lastSeen = new Date(user.lastSeen)
      const now = new Date()
      const diffMinutes = Math.floor((now - lastSeen) / 60000)
      if (diffMinutes < 5) return { color: 'green.400', label: 'Just now' }
      if (diffMinutes < 60) return { color: 'yellow.500', label: `${diffMinutes}m ago` }
      if (diffMinutes < 1440) return { color: 'gray.500', label: `${Math.floor(diffMinutes / 60)}h ago` }
    }
    return { color: 'gray.400', label: 'Offline' }
  }

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
          <Text color="red.500">Error loading friends: {error.message}</Text>
        </Center>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <HStack>
          <Button
            leftIcon={<ArrowLeft size={18} />}
            variant="ghost"
            onClick={() => navigate('/admin/users')}
          >
            Back to Users
          </Button>
        </HStack>

        <Box bg={bgColor} p={6} borderRadius="lg" border="1px" borderColor={borderColor} boxShadow="sm">
          <HStack spacing={3} mb={6}>
            <Users size={24} />
            <Heading size="lg">User Friends</Heading>
            <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
              {friendsCount} {friendsCount === 1 ? 'Friend' : 'Friends'}
            </Badge>
          </HStack>

          {friends.length === 0 ? (
            <EmptyState
              title="No Friends"
              description="This user has no friends yet"
            />
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {friends.map((friend) => {
                const status = getOnlineStatus(friend)
                return (
                  <Card key={friend._id} bg={cardBg}>
                    <CardBody>
                      <VStack spacing={3}>
                        <Box position="relative">
                          <Avatar
                            size="lg"
                            name={friend.name}
                            src={friend.profileImage}
                          />
                          <Box
                            position="absolute"
                            bottom={0}
                            right={0}
                            w={4}
                            h={4}
                            bg={status.color}
                            borderRadius="full"
                            border="2px"
                            borderColor={bgColor}
                          />
                        </Box>
                        <VStack spacing={1}>
                          <Text fontWeight="bold">{friend.name}</Text>
                          <Text fontSize="sm" color={textColor}>
                            {friend.email}
                          </Text>
                          <HStack spacing={2}>
                            {friend.accountType === 'private' ? (
                              <Lock size={14} />
                            ) : (
                              <Globe size={14} />
                            )}
                            <Text fontSize="xs" color={status.color}>
                              {status.label}
                            </Text>
                          </HStack>
                          {friend.createdAt && (
                            <Text fontSize="xs" color={textColor}>
                              Friends since: {new Date(friend.createdAt).toLocaleDateString()}
                            </Text>
                          )}
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                )
              })}
            </SimpleGrid>
          )}
        </Box>
      </VStack>
    </AdminLayout>
  )
}

export default AdminUserFriends

