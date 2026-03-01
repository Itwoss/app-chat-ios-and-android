import { VStack, Heading, Text, useColorModeValue } from '@chakra-ui/react'
import { getAdminInfo } from '../utils/auth'
import AdminLayout from '../components/Admin/AdminLayout'
import TeamsManagement from '../components/Admin/TeamsManagement'

const AdminTeams = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const adminInfo = getAdminInfo()

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" mb={2}>
          Team Management
        </Heading>
        <Text color={textColor}>
          Manage team members and their profiles.
        </Text>
        <TeamsManagement />
      </VStack>
    </AdminLayout>
  )
}

export default AdminTeams

