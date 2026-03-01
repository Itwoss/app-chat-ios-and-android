import {
  Box,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Image,
  Badge,
  IconButton,
  useDisclosure,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Spinner,
  Center,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import { Search, Plus, Edit, Trash2, Users, Eye } from 'lucide-react'
import { useState, useRef } from 'react'
import { useGetAllTeamsQuery, useDeleteTeamMutation } from '../../store/api/adminApi'
import { useDebounce } from '../../hooks/useDebounce'
import CreateTeamModal from './CreateTeamModal'
import EditTeamModal from './EditTeamModal'
import ViewTeamModal from './ViewTeamModal'
import { EmptyState } from '../EmptyState/EmptyState'

const TeamsManagement = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [deleteTeamId, setDeleteTeamId] = useState(null)
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const cancelRef = useRef()

  const { data, isLoading, error, refetch } = useGetAllTeamsQuery({
    page,
    limit: 12,
    search: debouncedSearch,
  })

  const [deleteTeam] = useDeleteTeamMutation()

  const handleEdit = (team) => {
    setSelectedTeam(team)
    onEditOpen()
  }

  const handleDelete = (teamId) => {
    setDeleteTeamId(teamId)
    onDeleteOpen()
  }

  const confirmDelete = async () => {
    try {
      await deleteTeam(deleteTeamId).unwrap()
      toast({
        title: 'Team member deleted',
        description: 'Team member has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onDeleteClose()
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to delete team member',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleCreateSuccess = () => {
    onCreateClose()
    refetch()
  }

  const handleEditSuccess = () => {
    onEditClose()
    setSelectedTeam(null)
    refetch()
  }

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
        <Heading size="md">Team Management</Heading>
        <Button
          leftIcon={<Plus size={18} />}
          colorScheme="brand"
          onClick={onCreateOpen}
          size={{ base: 'sm', md: 'md' }}
        >
          Add Team Member
        </Button>
      </Flex>

      {/* Search */}
      <Box
        bg={bgColor}
        p={4}
        borderRadius="lg"
        border="1px"
        borderColor={borderColor}
        boxShadow="sm"
      >
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Search size={18} color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Search team members..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
            />
          </InputGroup>
      </Box>

      {/* Team Cards */}
      {isLoading ? (
        <Center py={10}>
          <Spinner size="xl" />
        </Center>
      ) : error ? (
        <Text color="red.500">Error loading team members</Text>
      ) : (
        <>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
            {data?.data?.length > 0 ? (
              data.data.map((team) => (
                <Card key={team._id} bg={bgColor} border="1px" borderColor={borderColor}>
                  <CardHeader>
                    <Box position="relative">
                      <Image
                        src={team.image || 'https://via.placeholder.com/150'}
                        alt={team.name}
                        borderRadius="full"
                        boxSize="100px"
                        mx="auto"
                        objectFit="cover"
                      />
                      <Badge
                        position="absolute"
                        top={2}
                        right={2}
                        colorScheme={team.isActive ? 'green' : 'red'}
                      >
                        {team.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Box>
                  </CardHeader>
                  <CardBody pt={0}>
                    <VStack spacing={2} align="stretch">
                      <Heading size="sm" textAlign="center">
                        {team.name}
                      </Heading>
                      <Text fontSize="sm" color={textColor} textAlign="center">
                        {team.role}
                      </Text>
                      {team.email && (
                        <Text fontSize="xs" color={textColor} textAlign="center">
                          {team.email}
                        </Text>
                      )}
                      <HStack justify="center" spacing={2} mt={2}>
                        <IconButton
                          icon={<Eye size={16} />}
                          size="sm"
                          colorScheme="gray"
                          variant="ghost"
                          onClick={() => {
                            setSelectedTeam(team)
                            onViewOpen()
                          }}
                          aria-label="View team member"
                        />
                        <IconButton
                          icon={<Edit size={16} />}
                          size="sm"
                          colorScheme="brand"
                          variant="ghost"
                          onClick={() => handleEdit(team)}
                          aria-label="Edit team member"
                        />
                        <IconButton
                          icon={<Trash2 size={16} />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDelete(team._id)}
                          aria-label="Delete team member"
                        />
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))
            ) : (
              <Box gridColumn="1 / -1">
                <EmptyState
                  title="No team members found"
                  description="Create your first team member to get started."
                  icon={<Users size={48} />}
                  actionLabel="Add Team Member"
                  onAction={onCreateOpen}
                />
              </Box>
            )}
          </SimpleGrid>

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <HStack justify="center" mt={4} spacing={2}>
              <Button
                size="sm"
                onClick={() => setPage(page - 1)}
                isDisabled={page === 1}
              >
                Previous
              </Button>
              <Text>
                Page {data.pagination.page} of {data.pagination.pages}
              </Text>
              <Button
                size="sm"
                onClick={() => setPage(page + 1)}
                isDisabled={page >= data.pagination.pages}
              >
                Next
              </Button>
            </HStack>
          )}
        </>
      )}

      {/* Modals */}
      <CreateTeamModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={handleCreateSuccess}
      />

      {selectedTeam && (
        <>
          <EditTeamModal
            isOpen={isEditOpen}
            onClose={onEditClose}
            team={selectedTeam}
            onSuccess={handleEditSuccess}
          />
          <ViewTeamModal
            isOpen={isViewOpen}
            onClose={onViewClose}
            team={selectedTeam}
          />
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Team Member
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure? You can't undo this action afterwards.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  )
}

export default TeamsManagement

