import { VStack, Heading, Text, useColorModeValue } from '@chakra-ui/react'
import { getAdminInfo } from '../utils/auth'
import AdminLayout from '../components/Admin/AdminLayout'
import UsersManagement from '../components/Admin/UsersManagement'

const AdminUsers = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const adminInfo = getAdminInfo()

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" mb={2}>
          User Management
        </Heading>
        <Text color={textColor}>
          Manage users, their roles, and access permissions.
        </Text>
        <UsersManagement />
      </VStack>
    </AdminLayout>
  )
}

export default AdminUsers

