import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  useColorModeValue,
  Box,
  Button,
} from '@chakra-ui/react'
import { User, Mail, Phone, Shield, CheckCircle, XCircle, Users, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ViewUserModal = ({ isOpen, onClose, user }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const navigate = useNavigate()

  if (!user) return null

  const handleViewFriends = () => {
    onClose()
    navigate(`/admin/users/${user._id}/friends`)
  }

  const handleViewChats = () => {
    onClose()
    navigate(`/admin/users/${user._id}/chats`)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>User Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Box p={4} bg={bgColor} borderRadius="md" border="1px" borderColor={borderColor}>
              <HStack spacing={3} mb={3}>
                <User size={20} />
                <Text fontWeight="bold" fontSize="lg">{user.name}</Text>
              </HStack>
              <Divider mb={3} />
              <VStack spacing={3} align="stretch">
                <HStack>
                  <Mail size={18} />
                  <Text flex="1">Email:</Text>
                  <Text fontWeight="medium">{user.email}</Text>
                </HStack>
                {user.countryCode && user.phoneNumber && (
                  <HStack>
                    <Phone size={18} />
                    <Text flex="1">Phone:</Text>
                    <Text fontWeight="medium">+{user.countryCode} {user.phoneNumber}</Text>
                  </HStack>
                )}
                <HStack>
                  <Shield size={18} />
                  <Text flex="1">Role:</Text>
                  <Badge colorScheme={user.role === 'admin' ? 'purple' : 'blue'}>
                    {user.role}
                  </Badge>
                </HStack>
                <HStack>
                  {user.isActive ? <CheckCircle size={18} /> : <XCircle size={18} />}
                  <Text flex="1">Status:</Text>
                  <Badge colorScheme={user.isActive ? 'green' : 'red'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </HStack>
                {user.createdAt && (
                  <HStack>
                    <Text flex="1">Created:</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Box>
            <HStack spacing={3} justify="center" pt={4}>
              <Button
                leftIcon={<Users size={18} />}
                colorScheme="blue"
                onClick={handleViewFriends}
              >
                View Friends
              </Button>
              <Button
                leftIcon={<MessageCircle size={18} />}
                colorScheme="green"
                onClick={handleViewChats}
              >
                View Chats
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default ViewUserModal

