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
  Divider,
  HStack,
  Badge,
  Avatar,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { Settings, User, Mail, Phone, Calendar, Shield, Database } from 'lucide-react'
import { useGetCurrentAdminQuery } from '../store/api/adminApi'
import AdminLayout from '../components/Admin/AdminLayout'
import { getAdminInfo } from '../utils/auth'

const AdminSettings = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const cardBg = useColorModeValue('gray.50', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  
  const { data: adminData, isLoading } = useGetCurrentAdminQuery()
  const adminInfo = getAdminInfo()
  
  if (isLoading) {
    return (
      <AdminLayout>
        <Center minH="400px">
          <Spinner size="xl" colorScheme="brand" />
        </Center>
      </AdminLayout>
    )
  }

  const admin = adminData?.data || adminInfo || {}
  const stats = admin.stats || {}

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="lg">Admin Settings</Heading>
        </HStack>
        <Text color={textColor}>View detailed information about your admin account and platform statistics.</Text>

        {/* Admin Info Card */}
        <Card bg={bgColor} border="1px" borderColor={borderColor} boxShadow="sm">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4}>
                <Avatar size="xl" name={admin.name} src={admin.profileImage} />
                <VStack align="start" spacing={1} flex="1">
                  <HStack>
                    <Heading size="md">{admin.name || 'Admin'}</Heading>
                    <Badge colorScheme="purple" fontSize="sm">ADMIN</Badge>
                  </HStack>
                  <Text color={textColor} fontSize="sm">{admin.email}</Text>
                </VStack>
              </HStack>
              
              <Divider />
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <HStack>
                  <Mail size={20} />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color={textColor}>Email</Text>
                    <Text fontWeight="medium">{admin.email || 'N/A'}</Text>
                  </VStack>
                </HStack>
                
                {admin.phoneNumber && (
                  <HStack>
                    <Phone size={20} />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="xs" color={textColor}>Phone</Text>
                      <Text fontWeight="medium">
                        {admin.countryCode && admin.phoneNumber 
                          ? `+${admin.countryCode} ${admin.phoneNumber}`
                          : 'N/A'}
                      </Text>
                    </VStack>
                  </HStack>
                )}
                
                <HStack>
                  <Calendar size={20} />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color={textColor}>Account Created</Text>
                    <Text fontWeight="medium">
                      {admin.createdAt 
                        ? new Date(admin.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </Text>
                  </VStack>
                </HStack>
                
                <HStack>
                  <Shield size={20} />
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color={textColor}>Status</Text>
                    <Badge colorScheme={admin.isActive ? 'green' : 'red'}>
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </VStack>
                </HStack>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Platform Statistics */}
        <Card bg={bgColor} border="1px" borderColor={borderColor} boxShadow="sm">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack>
                <Database size={24} />
                <Heading size="md">Platform Statistics</Heading>
              </HStack>
              <Divider />
              
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <Stat>
                  <StatLabel>Total Users</StatLabel>
                  <StatNumber>{stats.totalUsersManaged || 0}</StatNumber>
                  <StatHelpText>Registered users</StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Total Projects</StatLabel>
                  <StatNumber>{stats.totalProjectsManaged || 0}</StatNumber>
                  <StatHelpText>All projects</StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Total Bookings</StatLabel>
                  <StatNumber>{stats.totalBookingsManaged || 0}</StatNumber>
                  <StatHelpText>Demo bookings</StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Client Projects</StatLabel>
                  <StatNumber>{stats.totalClientProjectsManaged || 0}</StatNumber>
                  <StatHelpText>Active client projects</StatHelpText>
                </Stat>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Account Information */}
        <Card bg={bgColor} border="1px" borderColor={borderColor} boxShadow="sm">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack>
                <User size={24} />
                <Heading size="md">Account Information</Heading>
              </HStack>
              <Divider />
              
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Box>
                  <Text fontSize="sm" color={textColor} mb={1}>User ID</Text>
                  <Text fontWeight="medium" fontSize="sm" fontFamily="mono">
                    {admin.id || 'N/A'}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color={textColor} mb={1}>Role</Text>
                  <Badge colorScheme="purple">{admin.role || 'admin'}</Badge>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color={textColor} mb={1}>Last Updated</Text>
                  <Text fontWeight="medium">
                    {admin.updatedAt 
                      ? new Date(admin.updatedAt).toLocaleString()
                      : 'N/A'}
                  </Text>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color={textColor} mb={1}>Account Status</Text>
                  <Badge colorScheme={admin.isActive ? 'green' : 'red'}>
                    {admin.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Box>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </AdminLayout>
  )
}

export default AdminSettings

