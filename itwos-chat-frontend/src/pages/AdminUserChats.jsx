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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
} from '@chakra-ui/react'
import { ArrowLeft, MessageCircle, Eye } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGetUserChatsAdminQuery, useGetChatMessagesAdminQuery } from '../store/api/adminApi'
import AdminLayout from '../components/Admin/AdminLayout'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { useState } from 'react'

const AdminUserChats = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const bgColor = useColorModeValue('white', 'gray.800')
  const cardBg = useColorModeValue('gray.50', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  const [selectedChatId, setSelectedChatId] = useState(null)

  const { data, isLoading, error } = useGetUserChatsAdminQuery(userId)
  const { data: messagesData, isLoading: messagesLoading } = useGetChatMessagesAdminQuery(
    { chatId: selectedChatId, page: 1, limit: 100 },
    { skip: !selectedChatId }
  )

  const chats = data?.data || []
  const messages = messagesData?.data || []

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
          <Text color="red.500">Error loading chats: {error.message}</Text>
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
            <MessageCircle size={24} />
            <Heading size="lg">User Chats</Heading>
            <Badge colorScheme="green" fontSize="md" px={3} py={1}>
              {chats.length} {chats.length === 1 ? 'Chat' : 'Chats'}
            </Badge>
          </HStack>

          {chats.length === 0 ? (
            <EmptyState
              title="No Chats"
              description="This user has no chats yet"
            />
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {chats.map((chat) => {
                const otherUser = chat.otherUser
                const isSelected = selectedChatId === chat._id
                return (
                  <Card
                    key={chat._id}
                    bg={isSelected ? cardBg : 'transparent'}
                    border="1px"
                    borderColor={isSelected ? 'brand.500' : borderColor}
                    cursor="pointer"
                    onClick={() => setSelectedChatId(chat._id)}
                    _hover={{ bg: cardBg }}
                  >
                    <CardBody>
                      <VStack spacing={3} align="stretch">
                        <HStack spacing={3}>
                          <Avatar size="md" name={otherUser.name} src={otherUser.profileImage} />
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontWeight="bold">{otherUser.name}</Text>
                            <Text fontSize="sm" color={textColor}>
                              {otherUser.email}
                            </Text>
                          </VStack>
                        </HStack>
                        {chat.lastMessage && (
                          <>
                            <Divider />
                            <Text fontSize="sm" color={textColor} noOfLines={2}>
                              {chat.lastMessage.content}
                            </Text>
                            <Text fontSize="xs" color={textColor}>
                              {new Date(chat.lastMessageAt).toLocaleString()}
                            </Text>
                          </>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>
                )
              })}
            </SimpleGrid>
          )}

          {selectedChatId && (
            <Box mt={6} p={4} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
              <HStack spacing={2} mb={4}>
                <Eye size={18} />
                <Heading size="md">Chat Messages</Heading>
              </HStack>
              {messagesLoading ? (
                <Center minH="200px">
                  <Spinner size="md" colorScheme="brand" />
                </Center>
              ) : messages.length === 0 ? (
                <Text color={textColor}>No messages in this chat</Text>
              ) : (
                <VStack spacing={2} align="stretch" maxH="400px" overflowY="auto">
                  {messages.map((msg) => {
                    const isFromUser = msg.sender._id === userId
                    return (
                      <Box
                        key={msg._id}
                        p={3}
                        bg={isFromUser ? useColorModeValue('blue.50', 'blue.900') : useColorModeValue('gray.100', 'gray.700')}
                        borderRadius="md"
                        alignSelf={isFromUser ? 'flex-end' : 'flex-start'}
                        maxW="80%"
                      >
                        <HStack spacing={2} mb={1}>
                          <Avatar size="xs" name={msg.sender.name} src={msg.sender.profileImage} />
                          <Text fontSize="xs" fontWeight="bold">
                            {msg.sender.name}
                          </Text>
                        </HStack>
                        <Text fontSize="sm">{msg.content}</Text>
                        <Text fontSize="xs" color={textColor} mt={1}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </Text>
                      </Box>
                    )
                  })}
                </VStack>
              )}
            </Box>
          )}
        </Box>
      </VStack>
    </AdminLayout>
  )
}

export default AdminUserChats

