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
  Heading,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  SimpleGrid,
} from '@chakra-ui/react'
import { Search, Plus, Edit, Trash2, UserPlus } from 'lucide-react'
import { useState, useRef } from 'react'
import {
  useGetAllEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
} from '../store/api/adminApi'
import { useDebounce } from '../hooks/useDebounce'
import { EmptyState } from '../components/EmptyState/EmptyState'
import AdminLayout from '../components/Admin/AdminLayout'
import UnifiedCard from '../components/DesignSystem/UnifiedCard'
import CountryCodeSelector from '../components/CountryCodeSelector/CountryCodeSelector'

const AdminEmployees = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const toast = useToast()

  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 500)
  const [deleteEmployeeId, setDeleteEmployeeId] = useState(null)
  const [editingEmployee, setEditingEmployee] = useState(null)

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = useRef()

  const { data, isLoading, error, refetch } = useGetAllEmployeesQuery({
    page,
    limit: 10,
    search: debouncedSearch,
  })

  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation()
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation()
  const [deleteEmployee] = useDeleteEmployeeMutation()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    countryCode: '',
    phoneNumber: '',
    fullNumber: '',
  })
  const [errors, setErrors] = useState({})

  const employees = data?.data || []

  const handleCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      countryCode: '',
      phoneNumber: '',
      fullNumber: '',
    })
    setErrors({})
    setEditingEmployee(null)
    onCreateOpen()
  }

  const handleEdit = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      countryCode: employee.countryCode,
      phoneNumber: employee.phoneNumber,
      fullNumber: employee.fullNumber,
    })
    setErrors({})
    onEditOpen()
  }

  const handleDelete = (employeeId) => {
    setDeleteEmployeeId(employeeId)
    onDeleteOpen()
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === 'countryCode' || name === 'phoneNumber') {
        updated.fullNumber = (updated.countryCode || '') + (updated.phoneNumber || '')
      }
      return updated
    })
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email'
    }

    if (!editingEmployee && (!formData.password || formData.password.length < 6)) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!formData.countryCode) {
      newErrors.countryCode = 'Please select a country code'
    }

    if (!formData.phoneNumber || !/^\d{6,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 6-15 digits'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      if (editingEmployee) {
        await updateEmployee({
          id: editingEmployee._id,
          ...formData,
          ...(formData.password ? {} : { password: undefined }),
        }).unwrap()
        toast({
          title: 'Success',
          description: 'Employee updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        onEditClose()
      } else {
        await createEmployee(formData).unwrap()
        toast({
          title: 'Success',
          description: 'Employee created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
        onCreateClose()
      }
      setFormData({
        name: '',
        email: '',
        password: '',
        countryCode: '',
        phoneNumber: '',
        fullNumber: '',
      })
      setEditingEmployee(null)
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to save employee',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const confirmDelete = async () => {
    try {
      await deleteEmployee(deleteEmployeeId).unwrap()
      toast({
        title: 'Employee deleted',
        description: 'Employee has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onDeleteClose()
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to delete employee',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <Center minH="400px">
          <Spinner size="xl" colorScheme="brand" />
        </Center>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" mb={2}>
              Employee Management
            </Heading>
            <Text color={textColor}>
              Manage employees and their assignments
            </Text>
          </Box>
          <Button
            leftIcon={<UserPlus size={18} />}
            colorScheme="brand"
            onClick={handleCreate}
          >
            Add Employee
          </Button>
        </Flex>

        {/* Search */}
        <UnifiedCard>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Search size={20} />
            </InputLeftElement>
            <Input
              placeholder="Search employees by name or email..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
            />
          </InputGroup>
        </UnifiedCard>

        {/* Employees Table */}
        {employees.length === 0 ? (
          <UnifiedCard>
            <EmptyState
              title="No employees found"
              description="Create your first employee to get started"
              icon={<UserPlus size={48} />}
            />
          </UnifiedCard>
        ) : (
          <UnifiedCard p={0} overflow="hidden">
            <TableContainer>
              <Table variant="simple">
                <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                  <Tr>
                    <Th>Employee</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {employees.map((employee) => (
                    <Tr key={employee._id}>
                      <Td>
                        <HStack spacing={3}>
                          <Avatar
                            size="sm"
                            name={employee.name}
                            src={employee.profileImage}
                          />
                          <Text fontWeight="medium">{employee.name}</Text>
                        </HStack>
                      </Td>
                      <Td>{employee.email}</Td>
                      <Td>{employee.fullNumber}</Td>
                      <Td>
                        <Badge colorScheme={employee.isActive ? 'green' : 'red'}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<Edit size={16} />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(employee)}
                            aria-label="Edit employee"
                          />
                          <IconButton
                            icon={<Trash2 size={16} />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDelete(employee._id)}
                            aria-label="Delete employee"
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </UnifiedCard>
        )}
      </VStack>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onClose={editingEmployee ? onEditClose : onCreateClose}
        size="lg"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingEmployee ? 'Edit Employee' : 'Create New Employee'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={errors.name}>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Employee name"
                />
                {errors.name && (
                  <Text fontSize="xs" color="red.500" mt={1}>
                    {errors.name}
                  </Text>
                )}
              </FormControl>

              <FormControl isRequired isInvalid={errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="employee@example.com"
                />
                {errors.email && (
                  <Text fontSize="xs" color="red.500" mt={1}>
                    {errors.email}
                  </Text>
                )}
              </FormControl>

              <FormControl isRequired={!editingEmployee} isInvalid={errors.password}>
                <FormLabel>
                  Password {editingEmployee && '(leave blank to keep current)'}
                </FormLabel>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                />
                {errors.password && (
                  <Text fontSize="xs" color="red.500" mt={1}>
                    {errors.password}
                  </Text>
                )}
              </FormControl>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl isRequired isInvalid={errors.countryCode}>
                  <FormLabel>Country Code</FormLabel>
                  <CountryCodeSelector
                    value={formData.countryCode}
                    onChange={(value) =>
                      handleChange({ target: { name: 'countryCode', value } })
                    }
                  />
                  {errors.countryCode && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {errors.countryCode}
                    </Text>
                  )}
                </FormControl>

                <FormControl isRequired isInvalid={errors.phoneNumber}>
                  <FormLabel>Phone Number</FormLabel>
                  <Input
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="1234567890"
                  />
                  {errors.phoneNumber && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {errors.phoneNumber}
                    </Text>
                  )}
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={editingEmployee ? onEditClose : onCreateClose}
            >
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleSubmit}
              isLoading={isCreating || isUpdating}
            >
              {editingEmployee ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Employee
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this employee? This action cannot be undone.
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
    </AdminLayout>
  )
}

export default AdminEmployees











