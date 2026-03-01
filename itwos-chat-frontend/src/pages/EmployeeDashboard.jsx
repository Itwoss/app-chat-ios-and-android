import {
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Box,
  SimpleGrid,
  Spinner,
  Center,
  HStack,
  Button,
  Badge,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Progress,
} from '@chakra-ui/react'
import { Briefcase, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { useGetEmployeeProjectsQuery, useUpdateWorkStepMutation } from '../store/api/employeeApi'
import { useGetCurrentUserQuery } from '../store/api/userApi'
import { EmptyState } from '../components/EmptyState/EmptyState'

const EmployeeDashboard = () => {
  const textColor = useColorModeValue('gray.600', 'gray.300')
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const cardBg = useColorModeValue('gray.50', 'gray.700')
  const toast = useToast()
  
  const { data, isLoading, refetch } = useGetEmployeeProjectsQuery({ page: 1, limit: 50 })
  const { data: currentUserData } = useGetCurrentUserQuery()
  const [updateWorkStep, { isLoading: isUpdating }] = useUpdateWorkStepMutation()
  
  const currentEmployeeId = currentUserData?.data?._id
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedStep, setSelectedStep] = useState(null)
  const [updateData, setUpdateData] = useState({ status: '', progress: '', notes: '' })

  const projects = data?.data || []

  // Calculate statistics
  const stats = {
    total: projects.length,
    inProgress: projects.filter(p => p.status === 'in-progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
    pending: projects.filter(p => p.status === 'planning').length,
  }

  const handleUpdateStep = (step, project) => {
    setSelectedStep({ ...step, projectId: project._id, projectTitle: project.projectTitle })
    setUpdateData({
      status: step.status,
      progress: step.progress || 0,
      notes: step.notes || ''
    })
    onOpen()
  }

  const handleSubmitUpdate = async () => {
    try {
      await updateWorkStep({
        projectId: selectedStep.projectId,
        stepNumber: selectedStep.stepNumber,
        ...updateData
      }).unwrap()
      
      toast({
        title: 'Success',
        description: 'Work step updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      refetch()
      onClose()
      setSelectedStep(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to update work step',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  if (isLoading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" colorScheme="brand" />
      </Center>
    )
  }

  return (
    <Box p={{ base: 4, md: 6, lg: 8 }}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            My Dashboard
          </Heading>
          <Text color={textColor}>
            Track your assigned projects and work steps
          </Text>
        </Box>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm">
            <VStack align="start" spacing={2}>
              <HStack>
                <Briefcase size={20} />
                <Text fontSize="sm" color={textColor}>Total Projects</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold">{stats.total}</Text>
            </VStack>
          </Box>

          <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm">
            <VStack align="start" spacing={2}>
              <HStack>
                <Clock size={20} />
                <Text fontSize="sm" color={textColor}>In Progress</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">{stats.inProgress}</Text>
            </VStack>
          </Box>

          <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm">
            <VStack align="start" spacing={2}>
              <HStack>
                <CheckCircle size={20} />
                <Text fontSize="sm" color={textColor}>Completed</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.completed}</Text>
            </VStack>
          </Box>

          <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm">
            <VStack align="start" spacing={2}>
              <HStack>
                <AlertCircle size={20} />
                <Text fontSize="sm" color={textColor}>Pending</Text>
              </HStack>
              <Text fontSize="2xl" fontWeight="bold" color="gray.500">{stats.pending}</Text>
            </VStack>
          </Box>
        </SimpleGrid>

        {/* Projects List */}
        {projects.length === 0 ? (
          <Box p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm">
            <EmptyState
              title="No assigned projects"
              description="You don't have any assigned projects yet. Once admin assigns you to a project, it will appear here."
              icon={<Briefcase size={48} />}
            />
          </Box>
        ) : (
          <VStack spacing={4} align="stretch">
            {projects.map((project) => {
              const myWorkSteps = project.workSteps?.filter(
                step => step.assignedTo && step.assignedTo._id?.toString() === currentEmployeeId?.toString()
              ) || []
              
              return (
                <Box key={project._id} p={4} borderRadius="md" borderWidth="1px" borderColor={borderColor} bg={cardBg} boxShadow="sm">
                  <VStack align="stretch" spacing={4}>
                    {/* Project Header */}
                    <HStack justify="space-between" flexWrap="wrap">
                      <VStack align="start" spacing={1}>
                        <Heading size="md">{project.projectTitle}</Heading>
                        <Text fontSize="sm" color={textColor}>
                          {project.description || 'No description'}
                        </Text>
                      </VStack>
                      <Badge colorScheme={project.status === 'completed' ? 'green' : project.status === 'in-progress' ? 'blue' : 'gray'} fontSize="xs">{project.status}</Badge>
                    </HStack>

                    {/* Project Progress */}
                    <Progress value={project.progress || 0} size="md" colorScheme="blue" borderRadius="full" />

                    {/* My Work Steps */}
                    {myWorkSteps.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" mb={3} color={textColor}>
                          My Work Steps ({myWorkSteps.length})
                        </Text>
                        <VStack spacing={3} align="stretch">
                          {myWorkSteps.map((step) => (
                            <Box
                              key={step.stepNumber}
                              p={3}
                              bg={useColorModeValue('gray.50', 'gray.700')}
                              borderRadius="md"
                              border="1px solid"
                              borderColor={useColorModeValue('gray.200', 'gray.600')}
                            >
                              <HStack justify="space-between" mb={2}>
                                <HStack>
                                  <Text fontWeight="medium">Step {step.stepNumber}: {step.title}</Text>
                                  <Badge colorScheme={step.status === 'completed' ? 'green' : step.status === 'in-progress' ? 'blue' : 'gray'} fontSize="xs">{step.status}</Badge>
                                </HStack>
                                <Button
                                  size="xs"
                                  colorScheme="brand"
                                  onClick={() => handleUpdateStep(step, project)}
                                >
                                  Update
                                </Button>
                              </HStack>
                              {step.description && (
                                <Text fontSize="xs" color={textColor} mb={2}>
                                  {step.description}
                                </Text>
                              )}
                              <Progress value={step.progress || 0} size="sm" colorScheme="blue" borderRadius="full" />
                              {step.notes && (
                                <Text fontSize="xs" color={textColor} mt={2} fontStyle="italic">
                                  Notes: {step.notes}
                                </Text>
                              )}
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )
            })}
          </VStack>
        )}
      </VStack>

      {/* Update Work Step Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Work Step</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Box w="full">
                <Text fontWeight="bold" mb={2}>
                  {selectedStep?.projectTitle} - Step {selectedStep?.stepNumber}
                </Text>
                <Text fontSize="sm" color={textColor}>
                  {selectedStep?.title}
                </Text>
              </Box>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="blocked">Blocked</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Progress (%)</FormLabel>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={updateData.progress}
                  onChange={(e) => setUpdateData({ ...updateData, progress: parseInt(e.target.value) || 0 })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={updateData.notes}
                  onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })}
                  placeholder="Add notes about this work step..."
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleSubmitUpdate}
              isLoading={isUpdating}
            >
              Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default EmployeeDashboard

