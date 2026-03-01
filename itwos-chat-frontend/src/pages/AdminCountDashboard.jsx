import { Box, Container, VStack, HStack, Text, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, Card, CardBody, useColorModeValue, Spinner, Center } from '@chakra-ui/react';
import { TrendingUp, Users, Calendar, Award } from 'lucide-react';
import AdminRuleManagement from '../components/Admin/AdminRuleManagement';
import AdminEventManagement from '../components/Admin/AdminEventManagement';
import AdminAbuseControl from '../components/Admin/AdminAbuseControl';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import AdminLayout from '../components/Admin/AdminLayout';
import { useGetCountDashboardStatsQuery } from '../store/api/countApi';

const AdminCountDashboard = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  
  const { data: statsData, isLoading: statsLoading } = useGetCountDashboardStatsQuery();
  
  const stats = statsData?.data || {
    totalUsers: 0,
    thisMonthTotalCounts: 0,
    activeEvents: 0,
    topChattersCount: 0
  };

  return (
    <AdminLayout>
      <Container maxW="7xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header Stats */}
        {statsLoading ? (
          <Center py={8}>
            <Spinner size="lg" />
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Card bg={bgColor}>
              <CardBody>
                <Stat>
                  <StatLabel>
                    <HStack spacing={1}>
                      <Users size={16} />
                      <Text>Total Users</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color="blue.500">
                    {stats.totalUsers.toLocaleString()}
                  </StatNumber>
                  <StatHelpText>With count system</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={bgColor}>
              <CardBody>
                <Stat>
                  <StatLabel>
                    <HStack spacing={1}>
                      <TrendingUp size={16} />
                      <Text>This Month</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color="green.500">
                    {stats.thisMonthTotalCounts.toLocaleString()}
                  </StatNumber>
                  <StatHelpText>Total counts generated</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={bgColor}>
              <CardBody>
                <Stat>
                  <StatLabel>
                    <HStack spacing={1}>
                      <Calendar size={16} />
                      <Text>Active Events</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color="purple.500">
                    {stats.activeEvents.toLocaleString()}
                  </StatNumber>
                  <StatHelpText>Currently running</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={bgColor}>
              <CardBody>
                <Stat>
                  <StatLabel>
                    <HStack spacing={1}>
                      <Award size={16} />
                      <Text>Top Chatters</Text>
                    </HStack>
                  </StatLabel>
                  <StatNumber color="yellow.500">
                    {stats.topChattersCount.toLocaleString()}
                  </StatNumber>
                  <StatHelpText>This month</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Tabs */}
        <Tabs colorScheme="blue">
          <TabList>
            <Tab>Rules</Tab>
            <Tab>Events</Tab>
            <Tab>Abuse Control</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <AdminRuleManagement />
            </TabPanel>
            <TabPanel>
              <AdminEventManagement />
            </TabPanel>
            <TabPanel>
              <AdminAbuseControl />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
    </AdminLayout>
  );
};

export default AdminCountDashboard;

