import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  IconButton,
  useDisclosure,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
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
  Text,
  VStack,
  Heading
} from '@chakra-ui/react'
import { Search, Plus, Edit, Trash2, UserCheck, UserX, Eye } from 'lucide-react'
import { useState, useRef } from 'react'
import { useGetAllUsersQuery, useDeleteUserMutation, useToggleUserStatusMutation } from '../../store/api/adminApi'
import { useDebounce } from '../../hooks/useDebounce'
import CreateUserModal from './CreateUserModal'
import EditUserModal from './EditUserModal'
import ViewUserModal from './ViewUserModal'
import { EmptyState } from '../EmptyState/EmptyState'

const UsersManagement = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()
  
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [deleteUserId, setDeleteUserId] = useState(null)
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure()
  const cancelRef = useRef()

  const { data, isLoading, error, refetch } = useGetAllUsersQuery({
    page,
    limit: 10,
    search: debouncedSearch,
    role: roleFilter,
    isActive: statusFilter,
  })

  const [deleteUser] = useDeleteUserMutation()
  const [toggleUserStatus] = useToggleUserStatusMutation()

  const handleEdit = (user) => {
    setSelectedUser(user)
    onEditOpen()
  }

  const handleDelete = (userId) => {
    setDeleteUserId(userId)
    onDeleteOpen()
  }

  const confirmDelete = async () => {
    try {
      await deleteUser(deleteUserId).unwrap()
      toast({
        title: 'User deleted',
        description: 'User has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onDeleteClose()
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to delete user',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleToggleStatus = async (userId) => {
    try {
      await toggleUserStatus(userId).unwrap()
      toast({
        title: 'Status updated',
        description: 'User status has been updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to update status',
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
    setSelectedUser(null)
    refetch()
  }

  return (
    <VStack spacing={6} align="stretch">
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
        <Heading size="md">User Management</Heading>
        <Button
          leftIcon={<Plus size={18} />}
          colorScheme="brand"
          onClick={onCreateOpen}
          size={{ base: 'sm', md: 'md' }}
        >
          Create User
        </Button>
      </Flex>

      {/* Filters */}
      <Box
        bg={bgColor}
        p={4}
        borderRadius="lg"
        border="1px"
        borderColor={borderColor}
        boxShadow="sm"
      >
        <VStack spacing={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Search size={18} color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
            />
          </InputGroup>
          <HStack spacing={4} w="full" flexWrap="wrap">
            <Select
              placeholder="All Roles"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              maxW="200px"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Select>
            <Select
              placeholder="All Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              maxW="200px"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </HStack>
        </VStack>
      </Box>

      {/* Users Table */}
      <Box
        bg={bgColor}
        p={6}
        borderRadius="lg"
        border="1px"
        borderColor={borderColor}
        boxShadow="sm"
        overflowX="auto"
      >
        {isLoading ? (
          <Center py={10}>
            <Spinner size="xl" />
          </Center>
        ) : error ? (
          <Text color="red.500">Error loading users</Text>
        ) : (
          <>
            <TableContainer>
              <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th display={{ base: 'none', md: 'table-cell' }}>Email</Th>
                    <Th>Role</Th>
                    <Th display={{ base: 'none', lg: 'table-cell' }}>Phone</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data?.data?.length > 0 ? (
                    data.data.map((user) => (
                      <Tr key={user._id}>
                        <Td>{user.name}</Td>
                        <Td display={{ base: 'none', md: 'table-cell' }}>{user.email}</Td>
                        <Td>
                          <Badge colorScheme={user.role === 'admin' ? 'purple' : 'blue'}>
                            {user.role}
                          </Badge>
                        </Td>
                        <Td display={{ base: 'none', lg: 'table-cell' }}>+{user.countryCode} {user.phoneNumber}</Td>
                        <Td>
                          <Badge colorScheme={user.isActive ? 'green' : 'red'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<Eye size={16} />}
                              size="sm"
                              colorScheme="gray"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(user)
                                onViewOpen()
                              }}
                              aria-label="View user"
                            />
                            <IconButton
                              icon={<Edit size={16} />}
                              size="sm"
                              colorScheme="brand"
                              variant="ghost"
                              onClick={() => handleEdit(user)}
                              aria-label="Edit user"
                            />
                            <IconButton
                              icon={<Trash2 size={16} />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              onClick={() => handleDelete(user._id)}
                              aria-label="Delete user"
                              isDisabled={user.role === 'admin'}
                            />
                            <IconButton
                              icon={user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                              size="sm"
                              colorScheme={user.isActive ? 'red' : 'green'}
                              variant="outline"
                              onClick={() => handleToggleStatus(user._id)}
                              isDisabled={user.role === 'admin'}
                              aria-label={user.isActive ? 'Disable user' : 'Enable user'}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={6} textAlign="center" py={8}>
                        <EmptyState
                          title="No users found"
                          description="Try adjusting your search or filters to find users."
                        />
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>

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
      </Box>

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={handleCreateSuccess}
      />

      {selectedUser && (
        <>
          <EditUserModal
            isOpen={isEditOpen}
            onClose={onEditClose}
            user={selectedUser}
            onSuccess={handleEditSuccess}
          />
          <ViewUserModal isOpen={isViewOpen} onClose={onViewClose} user={selectedUser} />
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
              Delete User
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

export default UsersManagement

