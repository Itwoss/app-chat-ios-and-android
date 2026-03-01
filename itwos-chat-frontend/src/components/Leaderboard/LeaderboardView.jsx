import {
  Box,
  VStack,
  HStack,
  Text,
  Select,
  Button,
  Card,
  CardBody,
  Avatar,
  Badge,
  useColorModeValue,
  Spinner,
  Center,
  Input,
  SimpleGrid,
} from '@chakra-ui/react';
import { Trophy, Medal, Award, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useGetLeaderboardQuery } from '../../store/api/leaderboardApi';

const LeaderboardView = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');

  const [type, setType] = useState('monthly');
  const [region, setRegion] = useState('global');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');

  const { data, isLoading, error } = useGetLeaderboardQuery({
    type,
    region,
    country: country || undefined,
    state: state || undefined,
    district: district || undefined,
    page: 1,
    limit: 1000, // Show up to 1000 users (all users in system, not just friends)
  });

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy size={20} color="#FFD700" />;
    if (rank === 2) return <Medal size={20} color="#C0C0C0" />;
    if (rank === 3) return <Medal size={20} color="#CD7F32" />;
    return <Award size={16} />;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'yellow';
    if (rank === 2) return 'gray';
    if (rank === 3) return 'orange';
    return 'blue';
  };

  if (isLoading) {
    return (
      <Center py={8}>
        <Spinner size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={8}>
        <Text color="red.500">Failed to load leaderboard</Text>
      </Center>
    );
  }

  const leaderboard = data?.data?.leaderboard || [];
  const userRank = data?.data?.userRank;
  const aboveUsers = data?.data?.aboveUsers || [];
  const belowUsers = data?.data?.belowUsers || [];

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Filters */}
        <Card bg={bgColor} border="1px" borderColor={borderColor}>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                  Time Period
                </Text>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="lifetime">Lifetime</option>
                </Select>
              </Box>

              <Box>
                <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                  Region
                </Text>
                <Select value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option value="global">Global</option>
                  <option value="country">Country</option>
                  <option value="state">State</option>
                  <option value="district">District</option>
                </Select>
              </Box>

              {region === 'country' && (
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                    Country
                  </Text>
                  <Input
                    placeholder="Enter country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </Box>
              )}

              {region === 'state' && (
                <>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                      Country
                    </Text>
                    <Input
                      placeholder="Enter country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                      State
                    </Text>
                    <Input
                      placeholder="Enter state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </Box>
                </>
              )}

              {region === 'district' && (
                <>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                      Country
                    </Text>
                    <Input
                      placeholder="Enter country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                      State
                    </Text>
                    <Input
                      placeholder="Enter state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color={textColor} mb={2}>
                      District
                    </Text>
                    <Input
                      placeholder="Enter district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                    />
                  </Box>
                </>
              )}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* User Rank Card */}
        {userRank && (
          <Card bg="blue.50" border="2px" borderColor="blue.500">
            <CardBody>
              <HStack spacing={4}>
                <Box>
                  <Text fontSize="xs" color="blue.600" fontWeight="medium">
                    YOUR RANK
                  </Text>
                  <HStack spacing={2}>
                    {getRankIcon(userRank.rank)}
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      #{userRank.rank}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="blue.600">
                    {userRank.count.toLocaleString()} points
                  </Text>
                </Box>
                {userRank.user && (
                  <HStack spacing={2} ml="auto">
                    <Avatar size="sm" src={userRank.user.profileImage} name={userRank.user.name} />
                    <Text fontWeight="medium" color="blue.600">
                      {userRank.user.name}
                    </Text>
                  </HStack>
                )}
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Users Above */}
        {aboveUsers.length > 0 && (
          <Box>
            <Text fontSize="sm" color={textColor} opacity={0.7} mb={2}>
              Users Above You
            </Text>
            <VStack spacing={2}>
              {aboveUsers.map((user, index) => (
                <Card
                  key={index}
                  w="full"
                  bg={cardBg}
                  border="1px"
                  borderColor={borderColor}
                  _hover={{ bg: hoverBg }}
                >
                  <CardBody>
                    <HStack spacing={4}>
                      <HStack spacing={2}>
                        {getRankIcon(user.rank)}
                        <Text fontWeight="bold" color={textColor}>
                          #{user.rank}
                        </Text>
                      </HStack>
                      <Avatar size="sm" src={user.profileImage} name={user.name} />
                      <Text flex="1" color={textColor}>
                        {user.name}
                      </Text>
                      <Badge colorScheme={getRankColor(user.rank)}>
                        {user.count.toLocaleString()}
                      </Badge>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </Box>
        )}

        {/* Leaderboard */}
        <Box>
          <Text fontSize="lg" fontWeight="bold" color={textColor} mb={4}>
            Leaderboard
          </Text>
          <VStack spacing={2}>
            {leaderboard.map((user, index) => (
              <Card
                key={user._id || index}
                w="full"
                bg={userRank?.rank === user.rank ? 'blue.50' : bgColor}
                border={userRank?.rank === user.rank ? '2px' : '1px'}
                borderColor={userRank?.rank === user.rank ? 'blue.500' : borderColor}
                _hover={{ bg: hoverBg }}
              >
                <CardBody>
                  <HStack spacing={4}>
                    <HStack spacing={2}>
                      {getRankIcon(user.rank)}
                      <Text fontWeight="bold" color={textColor} minW="50px">
                        #{user.rank}
                      </Text>
                    </HStack>
                    <Avatar size="md" src={user.profileImage} name={user.name} />
                    <VStack align="start" spacing={0} flex="1">
                      <Text fontWeight="medium" color={textColor}>
                        {user.name}
                      </Text>
                      {user.address && (
                        <HStack spacing={1}>
                          <MapPin size={12} />
                          <Text fontSize="xs" color={textColor} opacity={0.7}>
                            {[user.address.district, user.address.state, user.address.country]
                              .filter(Boolean)
                              .join(', ')}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                    <Badge colorScheme={getRankColor(user.rank)} fontSize="md" px={3} py={1}>
                      {user.count.toLocaleString()}
                    </Badge>
                    {user.isTopChatter && (
                      <Badge colorScheme="yellow">Top Chatter</Badge>
                    )}
                    {user.popularityBadge && (
                      <Badge colorScheme={user.popularityBadge === 'platinum' ? 'purple' : user.popularityBadge === 'gold' ? 'yellow' : user.popularityBadge === 'silver' ? 'gray' : 'orange'}>
                        {user.popularityBadge}
                      </Badge>
                    )}
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Box>

        {/* Users Below */}
        {belowUsers.length > 0 && (
          <Box>
            <Text fontSize="sm" color={textColor} opacity={0.7} mb={2}>
              Users Below You
            </Text>
            <VStack spacing={2}>
              {belowUsers.map((user, index) => (
                <Card
                  key={index}
                  w="full"
                  bg={cardBg}
                  border="1px"
                  borderColor={borderColor}
                  _hover={{ bg: hoverBg }}
                >
                  <CardBody>
                    <HStack spacing={4}>
                      <HStack spacing={2}>
                        {getRankIcon(user.rank)}
                        <Text fontWeight="bold" color={textColor}>
                          #{user.rank}
                        </Text>
                      </HStack>
                      <Avatar size="sm" src={user.profileImage} name={user.name} />
                      <Text flex="1" color={textColor}>
                        {user.name}
                      </Text>
                      <Badge colorScheme={getRankColor(user.rank)}>
                        {user.count.toLocaleString()}
                      </Badge>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default LeaderboardView;

