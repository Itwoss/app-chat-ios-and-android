import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  useColorModeValue,
  Box,
  Link,
  SimpleGrid,
  Image,
  Avatar,
  AvatarGroup,
  Flex,
} from '@chakra-ui/react'
import { Globe, FileText, Calendar, ExternalLink, Users, Code } from 'lucide-react'

const ViewProjectModal = ({ isOpen, onClose, project }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  if (!project) return null

  const statusColors = {
    'planning': 'gray',
    'in-progress': 'blue',
    'completed': 'green',
    'on-hold': 'yellow',
    'cancelled': 'red'
  }

  const statusLabels = {
    'planning': 'Planning',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'on-hold': 'On Hold',
    'cancelled': 'Cancelled'
  }

  const techStack = Array.isArray(project.techStack) ? project.techStack : []
  const teamMembers = Array.isArray(project.teamMembers) ? project.teamMembers : []
  const images = Array.isArray(project.images) ? project.images : []
  const files = Array.isArray(project.files) ? project.files : []

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={{ base: 'full', md: '2xl', lg: '3xl' }} 
      isCentered
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>Project Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} overflowY="auto">
          <VStack spacing={4} align="stretch">
            <Box p={4} bg={bgColor} borderRadius="md" border="1px" borderColor={borderColor}>
              <HStack justify="space-between" mb={3}>
                <Text fontWeight="bold" fontSize="xl">{project.websiteTitle}</Text>
                <Badge colorScheme={statusColors[project.status] || 'gray'} fontSize="sm">
                  {statusLabels[project.status] || project.status}
                </Badge>
              </HStack>
              <Divider mb={3} />
              <VStack spacing={3} align="stretch">
                {project.link && (
                  <HStack>
                    <Globe size={18} />
                    <Text flex="1">Website:</Text>
                    <Link href={project.link} isExternal color="blue.500">
                      <HStack>
                        <Text>{project.link}</Text>
                        <ExternalLink size={14} />
                      </HStack>
                    </Link>
                  </HStack>
                )}
                {project.description && (
                  <Box>
                    <HStack mb={2}>
                      <FileText size={18} />
                      <Text fontWeight="medium">Description:</Text>
                    </HStack>
                    <Text pl={6} fontSize="sm" color="gray.600">
                      {project.description}
                    </Text>
                  </Box>
                )}
                {techStack.length > 0 && (
                  <Box>
                    <HStack mb={2}>
                      <Code size={18} />
                      <Text fontWeight="medium">Tech Stack:</Text>
                    </HStack>
                    <Flex wrap="wrap" gap={2} pl={6}>
                      {techStack.map((tech, index) => (
                        <Badge key={index} colorScheme="purple">{tech}</Badge>
                      ))}
                    </Flex>
                  </Box>
                )}
                {teamMembers.length > 0 && (
                  <Box>
                    <HStack mb={2}>
                      <Users size={18} />
                      <Text fontWeight="medium">Team Members:</Text>
                    </HStack>
                    <HStack pl={6} spacing={2}>
                      <AvatarGroup size="sm" max={5}>
                        {teamMembers.map((member) => (
                          <Avatar
                            key={member._id || member}
                            name={typeof member === 'object' ? member.name : 'Member'}
                            src={typeof member === 'object' ? member.image : null}
                          />
                        ))}
                      </AvatarGroup>
                      <Text fontSize="sm" color="gray.500">
                        {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                      </Text>
                    </HStack>
                  </Box>
                )}
                {(project.startDate || project.endDate) && (
                  <HStack>
                    <Calendar size={18} />
                    <Text flex="1">Timeline:</Text>
                    <Text fontSize="sm">
                      {project.startDate && new Date(project.startDate).toLocaleDateString()}
                      {project.startDate && project.endDate && ' - '}
                      {project.endDate && new Date(project.endDate).toLocaleDateString()}
                    </Text>
                  </HStack>
                )}
                {images.length > 0 && (
                  <Box>
                    <Text fontWeight="medium" mb={2}>Images:</Text>
                    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                      {images.map((img, index) => (
                        <Image
                          key={index}
                          src={img}
                          alt={`Project image ${index + 1}`}
                          borderRadius="md"
                          maxH="200px"
                          objectFit="cover"
                        />
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
                {files.length > 0 && (
                  <Box>
                    <Text fontWeight="medium" mb={2}>Files:</Text>
                    <VStack align="stretch" spacing={2}>
                      {files.map((file, index) => (
                        <Link key={index} href={file} isExternal color="blue.500">
                          <HStack>
                            <ExternalLink size={16} />
                            <Text fontSize="sm">File {index + 1}</Text>
                          </HStack>
                        </Link>
                      ))}
                    </VStack>
                  </Box>
                )}
                {project.createdAt && (
                  <HStack>
                    <Text flex="1">Created:</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default ViewProjectModal

