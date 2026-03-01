import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
  Input,
  useColorModeValue,
  Select,
  Text,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react'
import { useState, useEffect } from 'react'
import { useCreateDemoBookingMutation } from '../../store/api/userApi'
import { getUserInfo } from '../../utils/auth'

const PreBookDemoModal = ({ isOpen, onClose, project, onSuccess }) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const userInfo = getUserInfo()
  const [formData, setFormData] = useState({
    requirements: '',
    preferredDate: '',
    preferredTime: '',
    projectType: '',
    budget: '',
    deadline: '',
    contactPhone: '',
    contactEmail: '',
    additionalContactInfo: '',
  })
  const [errors, setErrors] = useState({})
  const toast = useToast()
  const [createBooking, { isLoading }] = useCreateDemoBookingMutation()

  // Pre-fill contact details from user info when modal opens
  useEffect(() => {
    if (isOpen && userInfo) {
      setFormData(prev => ({
        ...prev,
        contactEmail: userInfo.email || '',
        contactPhone: userInfo.phoneNumber || '',
      }))
    }
  }, [isOpen, userInfo])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      })
    }
  }


  const validateForm = () => {
    const newErrors = {}

    if (!formData.requirements.trim()) {
      newErrors.requirements = 'Requirements are required'
    } else if (formData.requirements.trim().length < 10) {
      newErrors.requirements = 'Requirements must be at least 10 characters'
    }

    if (!formData.projectType.trim()) {
      newErrors.projectType = 'Project type is required'
    }

    if (!formData.budget.trim()) {
      newErrors.budget = 'Budget is required'
    }

    if (!formData.deadline) {
      newErrors.deadline = 'Deadline is required'
    } else {
      const deadlineDate = new Date(formData.deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (deadlineDate < today) {
        newErrors.deadline = 'Deadline must be a future date'
      }
    }

    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please provide a valid email'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: 'Validation failed',
        description: 'Please fix the errors in the form',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
      const bookingData = {
        projectId: project._id,
        requirements: formData.requirements,
        projectType: formData.projectType,
        budget: formData.budget,
        deadline: formData.deadline,
      }

      if (formData.preferredDate) {
        bookingData.preferredDate = formData.preferredDate
      }

      if (formData.preferredTime) {
        bookingData.preferredTime = formData.preferredTime
      }

      if (formData.contactPhone) {
        bookingData.contactPhone = formData.contactPhone
      }

      if (formData.contactEmail) {
        bookingData.contactEmail = formData.contactEmail
      }

      if (formData.additionalContactInfo) {
        bookingData.additionalContactInfo = formData.additionalContactInfo
      }

      await createBooking(bookingData).unwrap()
      toast({
        title: 'Booking request submitted',
        description: 'Your demo booking request has been submitted successfully. We will contact you soon.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      setFormData({
        requirements: '',
        preferredDate: '',
        preferredTime: '',
        projectType: '',
        budget: '',
        deadline: '',
        contactPhone: '',
        contactEmail: userInfo?.email || '',
        additionalContactInfo: '',
      })
      setErrors({})
      onSuccess()
      onClose()
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to submit booking request',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={{ base: 'full', sm: 'md', md: 'lg' }} 
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent 
        maxW={{ base: '100%', sm: '90%', md: '600px' }} 
        m={{ base: 0, sm: 'auto' }} 
        maxH={{ base: '100vh', md: '95vh' }}
        display="flex"
        flexDirection="column"
      >
        <ModalHeader flexShrink={0} px={{ base: 4, md: 6 }}>
          Pre-Book Live Demo - {project?.websiteTitle}
        </ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <ModalBody overflowY="auto" px={{ base: 4, md: 6 }} flex="1" minH={0}>
            <VStack spacing={4} w="full" align="stretch">
              <FormControl isRequired isInvalid={errors.requirements}>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Your Requirements</FormLabel>
                <Textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  placeholder="Please describe your requirements, what you're looking for, and any specific features you'd like to see..."
                  rows={4}
                  size={{ base: 'sm', md: 'md' }}
                />
                {errors.requirements && (
                  <Text fontSize="xs" color="red.500" mt={1}>
                    {errors.requirements}
                  </Text>
                )}
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isRequired isInvalid={errors.projectType}>
                  <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Project Type</FormLabel>
                  <Select
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleChange}
                    placeholder="Select project type"
                    size={{ base: 'sm', md: 'md' }}
                  >
                    <option value="Web Application">Web Application</option>
                    <option value="Mobile Application">Mobile Application</option>
                    <option value="E-commerce Platform">E-commerce Platform</option>
                    <option value="Landing Page">Landing Page</option>
                    <option value="Dashboard/Admin Panel">Dashboard/Admin Panel</option>
                    <option value="API Development">API Development</option>
                    <option value="Full Stack Application">Full Stack Application</option>
                    <option value="Other">Other</option>
                  </Select>
                  {errors.projectType && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {errors.projectType}
                    </Text>
                  )}
                </FormControl>

                <FormControl isRequired isInvalid={errors.budget}>
                  <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Budget</FormLabel>
                  <Input
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="e.g., $5,000 - $10,000"
                    size={{ base: 'sm', md: 'md' }}
                  />
                  {errors.budget && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {errors.budget}
                    </Text>
                  )}
                </FormControl>
              </SimpleGrid>

              <FormControl isRequired isInvalid={errors.deadline}>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Project Deadline</FormLabel>
                <Input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  size={{ base: 'sm', md: 'md' }}
                />
                {errors.deadline && (
                  <Text fontSize="xs" color="red.500" mt={1}>
                    {errors.deadline}
                  </Text>
                )}
              </FormControl>

              <Divider />

              <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('gray.600', 'gray.300')}>
                Contact Details
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={errors.contactEmail}>
                  <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Contact Email</FormLabel>
                  <Input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    size={{ base: 'sm', md: 'md' }}
                  />
                  {errors.contactEmail && (
                    <Text fontSize="xs" color="red.500" mt={1}>
                      {errors.contactEmail}
                    </Text>
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Contact Phone (Optional)</FormLabel>
                  <Input
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="Phone number"
                    size={{ base: 'sm', md: 'md' }}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Additional Contact Info (Optional)</FormLabel>
                <Textarea
                  name="additionalContactInfo"
                  value={formData.additionalContactInfo}
                  onChange={handleChange}
                  placeholder="Any additional contact preferences or information..."
                  rows={2}
                  size={{ base: 'sm', md: 'md' }}
                />
              </FormControl>

              <Divider />

              <Text fontSize="sm" fontWeight="bold" color={useColorModeValue('gray.600', 'gray.300')}>
                Demo Preferences (Optional)
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Preferred Demo Date</FormLabel>
                  <Input
                    type="date"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    size={{ base: 'sm', md: 'md' }}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize={{ base: 'sm', md: 'md' }}>Preferred Demo Time</FormLabel>
                  <Input
                    type="time"
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    size={{ base: 'sm', md: 'md' }}
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </ModalBody>

          <ModalFooter 
            px={{ base: 4, md: 6 }} 
            pb={{ base: 4, md: 6 }} 
            pt={4}
            flexShrink={0}
            borderTop="1px"
            borderColor={borderColor}
            flexDirection={{ base: 'column', sm: 'row' }}
            gap={2}
          >
            <Button 
              variant="ghost" 
              onClick={onClose}
              size={{ base: 'sm', md: 'md' }}
              w={{ base: 'full', sm: 'auto' }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              type="submit"
              isLoading={isLoading}
              loadingText="Submitting..."
              size={{ base: 'sm', md: 'md' }}
              w={{ base: 'full', sm: 'auto' }}
            >
              Submit Request
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}

export default PreBookDemoModal