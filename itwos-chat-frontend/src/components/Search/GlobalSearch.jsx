import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Box,
  Text,
  useColorModeValue,
  HStack,
  Avatar,
  Badge,
  Divider,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Link,
} from '@chakra-ui/react';
import { SearchResultsSkeleton } from '../Skeletons';
import { Search, User, FileText, MessageSquare, ExternalLink } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useGlobalSearchQuery } from '../../store/api/userApi';
import { useNavigate } from 'react-router-dom';
import { navigateToProfile } from '../../utils/profileNavigation';
import UserAvatar from '../User/UserAvatar';
import UserName from '../User/UserName';
import VerifiedBadge from '../VerifiedBadge/VerifiedBadge';
import { format } from 'date-fns';

const GlobalSearch = ({ isOpen, onClose }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const navigate = useNavigate();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, isFetching, error } = useGlobalSearchQuery(
    { q: debouncedQuery, limit: 20 },
    { skip: !debouncedQuery || debouncedQuery.length < 2 }
  );

  // Support both { data: { results, counts } } and direct { results, counts }
  const raw = data?.data ?? data;
  const results = raw?.results ?? {};
  const counts = raw?.counts ?? {};

  // Debug: Log errors and query
  useEffect(() => {
    if (error) {
      console.error('[GlobalSearch] Search error:', error);
    }
    if (debouncedQuery.length >= 2) {
      console.log('[GlobalSearch] Searching for:', debouncedQuery);
    }
  }, [error, debouncedQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleUserClick = (userId) => {
    navigateToProfile(navigate, userId);
    onClose();
  };

  const handlePostClick = (postId) => {
    navigate(`/user/home`);
    onClose();
  };

  const handleTicketClick = (ticketId) => {
    navigate(`/user/support`);
    onClose();
  };

  const totalCount = Number(counts.total) || 0;
  const hasResults = debouncedQuery.length >= 2 && (totalCount > 0 || isLoading || isFetching);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor} maxH="80vh">
        <ModalHeader color={textColor}>Global Search</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Search size={18} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search users, posts, tickets..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                autoFocus
                borderColor={borderColor}
                _focus={{ borderColor: 'blue.500' }}
              />
            </InputGroup>

            {error ? (
              <Box>
                <Text color="red.500" fontSize="sm" textAlign="center" py={8}>
                  Error: {error?.data?.message || error?.message || 'Failed to search. Please try again.'}
                </Text>
              </Box>
            ) : isLoading || isFetching ? (
              <SearchResultsSkeleton rows={6} />
            ) : hasResults ? (
              <Tabs index={selectedTab} onChange={setSelectedTab} colorScheme="blue">
                <TabList>
                  <Tab>
                    All ({totalCount})
                  </Tab>
                  {counts.users > 0 && (
                    <Tab>
                      Users ({counts.users})
                    </Tab>
                  )}
                  {counts.posts > 0 && (
                    <Tab>
                      Posts ({counts.posts})
                    </Tab>
                  )}
                  {counts.tickets > 0 && (
                    <Tab>
                      Tickets ({counts.tickets})
                    </Tab>
                  )}
                </TabList>

                <TabPanels>
                  {/* All Results */}
                  <TabPanel px={0}>
                    <VStack spacing={3} align="stretch">
                      {counts.users > 0 && (
                        <>
                          <Text fontSize="sm" fontWeight="bold" color={textColor} px={2}>
                            Users
                          </Text>
                          {results.users?.slice(0, 5).map((user) => (
                            <Box
                              key={user.id}
                              p={3}
                              bg={cardBg}
                              borderRadius="md"
                              _hover={{ bg: hoverBg, cursor: 'pointer' }}
                              onClick={() => handleUserClick(user.id)}
                            >
                              <HStack spacing={3}>
                                <UserAvatar
                                  userId={user.id}
                                  name={user.name}
                                  src={user.profileImage}
                                  size="sm"
                                  subscription={user.badgeType ? { badgeType: user.badgeType } : null}
                                />
                                <VStack align="start" spacing={0} flex="1">
                                  <UserName
                                    userId={user.id}
                                    name={user.name}
                                    subscription={user.badgeType ? { badgeType: user.badgeType } : null}
                                    fontSize="sm"
                                    fontWeight="medium"
                                    color={textColor}
                                  />
                                  <Text fontSize="xs" color={textColor} opacity={0.7}>
                                    {user.email}
                                  </Text>
                                </VStack>
                                <User size={16} color="gray.400" />
                              </HStack>
                            </Box>
                          ))}
                          {counts.users > 5 && (
                            <Text fontSize="xs" color={textColor} opacity={0.6} px={2}>
                              +{counts.users - 5} more users
                            </Text>
                          )}
                          {(counts.posts > 0 || counts.tickets > 0) && <Divider />}
                        </>
                      )}

                      {counts.posts > 0 && (
                        <>
                          <Text fontSize="sm" fontWeight="bold" color={textColor} px={2}>
                            Posts
                          </Text>
                          {results.posts?.slice(0, 5).map((post) => (
                            <Box
                              key={post.id}
                              p={3}
                              bg={cardBg}
                              borderRadius="md"
                              _hover={{ bg: hoverBg, cursor: 'pointer' }}
                              onClick={() => handlePostClick(post.id)}
                            >
                              <VStack align="start" spacing={2}>
                                <HStack spacing={2} w="full">
                                  <Avatar size="xs" src={post.author?.profileImage} name={post.author?.name} />
                                  <Text fontSize="xs" color={textColor} opacity={0.7}>
                                    {post.author?.name ?? 'Unknown'}
                                  </Text>
                                  {post.author?.badgeType && (
                                    <VerifiedBadge badgeType={post.author.badgeType} size={10} />
                                  )}
                                </HStack>
                                <Text fontSize="sm" color={textColor} noOfLines={2}>
                                  {post.content}
                                </Text>
                                <HStack spacing={2} fontSize="xs" color={textColor} opacity={0.6}>
                                  <Text>❤️ {post.likes}</Text>
                                  <Text>💬 {post.comments}</Text>
                                  {post.hasImages && <Badge size="sm">Images</Badge>}
                                  {(post.hasSong || post.hasSound) && <Badge size="sm">Music</Badge>}
                                </HStack>
                              </VStack>
                            </Box>
                          ))}
                          {counts.posts > 5 && (
                            <Text fontSize="xs" color={textColor} opacity={0.6} px={2}>
                              +{counts.posts - 5} more posts
                            </Text>
                          )}
                          {counts.tickets > 0 && <Divider />}
                        </>
                      )}

                      {counts.tickets > 0 && (
                        <>
                          <Text fontSize="sm" fontWeight="bold" color={textColor} px={2}>
                            Support Tickets
                          </Text>
                          {results.tickets?.slice(0, 5).map((ticket) => (
                            <Box
                              key={ticket.id}
                              p={3}
                              bg={cardBg}
                              borderRadius="md"
                              _hover={{ bg: hoverBg, cursor: 'pointer' }}
                              onClick={() => handleTicketClick(ticket.id)}
                            >
                              <VStack align="start" spacing={2}>
                                <HStack spacing={2} w="full" justify="space-between">
                                  <Text fontWeight="medium" color={textColor} fontSize="sm">
                                    {ticket.subject}
                                  </Text>
                                  <Badge colorScheme={ticket.status === 'resolved' ? 'green' : ticket.status === 'open' ? 'blue' : 'yellow'}>
                                    {ticket.status}
                                  </Badge>
                                </HStack>
                                <Text fontSize="xs" color={textColor} noOfLines={2} opacity={0.8}>
                                  {ticket.message}
                                </Text>
                                <HStack spacing={2} fontSize="xs" color={textColor} opacity={0.6}>
                                  <Badge size="sm">{ticket.category}</Badge>
                                  <Badge size="sm" colorScheme={ticket.priority === 'urgent' ? 'red' : ticket.priority === 'high' ? 'orange' : 'blue'}>
                                    {ticket.priority}
                                  </Badge>
                                </HStack>
                              </VStack>
                            </Box>
                          ))}
                          {counts.tickets > 5 && (
                            <Text fontSize="xs" color={textColor} opacity={0.6} px={2}>
                              +{counts.tickets - 5} more tickets
                            </Text>
                          )}
                        </>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Users Only */}
                  <TabPanel px={0}>
                    <VStack spacing={2} align="stretch">
                      {results.users?.map((user) => (
                        <Box
                          key={user.id}
                          p={3}
                          bg={cardBg}
                          borderRadius="md"
                          _hover={{ bg: hoverBg, cursor: 'pointer' }}
                          onClick={() => handleUserClick(user.id)}
                        >
                          <HStack spacing={3}>
                            <UserAvatar
                              userId={user.id}
                              name={user.name}
                              src={user.profileImage}
                              size="sm"
                              subscription={user.badgeType ? { badgeType: user.badgeType } : null}
                            />
                            <VStack align="start" spacing={0} flex="1">
                              <UserName
                                userId={user.id}
                                name={user.name}
                                subscription={user.badgeType ? { badgeType: user.badgeType } : null}
                                fontSize="sm"
                                fontWeight="medium"
                                color={textColor}
                              />
                              <Text fontSize="xs" color={textColor} opacity={0.7}>
                                {user.email}
                              </Text>
                            </VStack>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </TabPanel>

                  {/* Posts Only */}
                  <TabPanel px={0}>
                    <VStack spacing={2} align="stretch">
                      {results.posts?.map((post) => (
                        <Box
                          key={post.id}
                          p={3}
                          bg={cardBg}
                          borderRadius="md"
                          _hover={{ bg: hoverBg, cursor: 'pointer' }}
                          onClick={() => handlePostClick(post.id)}
                        >
                          <VStack align="start" spacing={2}>
                            <HStack spacing={2} w="full">
                              <Avatar size="xs" src={post.author?.profileImage} name={post.author?.name} />
                              <Text fontSize="xs" color={textColor} opacity={0.7}>
                                {post.author?.name ?? 'Unknown'}
                              </Text>
                              {post.author?.badgeType && (
                                <VerifiedBadge badgeType={post.author.badgeType} size={10} />
                              )}
                            </HStack>
                            <Text fontSize="sm" color={textColor} noOfLines={3}>
                              {post.content}
                            </Text>
                            <HStack spacing={2} fontSize="xs" color={textColor} opacity={0.6}>
                              <Text>❤️ {post.likes}</Text>
                              <Text>💬 {post.comments}</Text>
                              {post.hasImages && <Badge size="sm">Images</Badge>}
                              {(post.hasSong || post.hasSound) && <Badge size="sm">Music</Badge>}
                              {post.createdAt && <Text>• {format(new Date(post.createdAt), 'MMM dd, yyyy')}</Text>}
                            </HStack>
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </TabPanel>

                  {/* Tickets Only */}
                  <TabPanel px={0}>
                    <VStack spacing={2} align="stretch">
                      {results.tickets?.map((ticket) => (
                        <Box
                          key={ticket.id}
                          p={3}
                          bg={cardBg}
                          borderRadius="md"
                          _hover={{ bg: hoverBg, cursor: 'pointer' }}
                          onClick={() => handleTicketClick(ticket.id)}
                        >
                          <VStack align="start" spacing={2}>
                            <HStack spacing={2} w="full" justify="space-between">
                              <Text fontWeight="medium" color={textColor} fontSize="sm">
                                {ticket.subject}
                              </Text>
                              <Badge colorScheme={ticket.status === 'resolved' ? 'green' : ticket.status === 'open' ? 'blue' : 'yellow'}>
                                {ticket.status}
                              </Badge>
                            </HStack>
                            <Text fontSize="xs" color={textColor} noOfLines={2} opacity={0.8}>
                              {ticket.message}
                            </Text>
                            <HStack spacing={2} fontSize="xs" color={textColor} opacity={0.6}>
                              <Badge size="sm">{ticket.category}</Badge>
                              <Badge size="sm" colorScheme={ticket.priority === 'urgent' ? 'red' : ticket.priority === 'high' ? 'orange' : 'blue'}>
                                {ticket.priority}
                              </Badge>
                              {ticket.user?.name && (
                                <Text>• {ticket.user.name}</Text>
                              )}
                              {ticket.createdAt && <Text>• {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</Text>}
                            </HStack>
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            ) : debouncedQuery.length >= 2 ? (
              <Box>
                <Text color={textColor} fontSize="sm" opacity={0.7} textAlign="center" py={8}>
                  No results found for "{debouncedQuery}"
                </Text>
              </Box>
            ) : (
              <Box>
                <Text color={textColor} fontSize="sm" opacity={0.7} textAlign="center" py={8}>
                  Start typing to search users, posts, and tickets...
                </Text>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default GlobalSearch;
