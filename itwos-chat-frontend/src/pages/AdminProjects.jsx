import { VStack, Heading, Text, useColorModeValue } from '@chakra-ui/react'
import { getAdminInfo } from '../utils/auth'
import AdminLayout from '../components/Admin/AdminLayout'
import ProjectsManagement from '../components/Admin/ProjectsManagement'

const AdminProjects = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const adminInfo = getAdminInfo()

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <Heading size="lg" mb={2}>
          Project Management
        </Heading>
        <Text color={textColor}>
          Manage projects, showcase your work, and assign team members.
        </Text>
        <ProjectsManagement />
      </VStack>
    </AdminLayout>
  )
}

export default AdminProjects

