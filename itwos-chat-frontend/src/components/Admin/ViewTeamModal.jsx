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
  Avatar,
  Link,
  SimpleGrid,
} from '@chakra-ui/react'
import { User, Mail, Briefcase, FileText, ExternalLink } from 'lucide-react'

const ViewTeamModal = ({ isOpen, onClose, team }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  if (!team) return null

  const socialLinks = typeof team.socialLinks === 'string' 
    ? JSON.parse(team.socialLinks) 
    : team.socialLinks || {}

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={{ base: 'full', md: 'lg' }} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Team Member Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Box p={4} bg={bgColor} borderRadius="md" border="1px" borderColor={borderColor}>
              <HStack spacing={4} mb={4} justify="center">
                <Avatar size="xl" src={team.image} name={team.name} />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold" fontSize="xl">{team.name}</Text>
                  <Badge colorScheme="blue">{team.role}</Badge>
                </VStack>
              </HStack>
              <Divider mb={4} />
              <VStack spacing={3} align="stretch">
                {team.email && (
                  <HStack>
                    <Mail size={18} />
                    <Text flex="1">Email:</Text>
                    <Text fontWeight="medium">{team.email}</Text>
                  </HStack>
                )}
                {team.bio && (
                  <Box>
                    <HStack mb={2}>
                      <FileText size={18} />
                      <Text fontWeight="medium">Bio:</Text>
                    </HStack>
                    <Text pl={6} fontSize="sm" color="gray.600">
                      {team.bio}
                    </Text>
                  </Box>
                )}
                {(socialLinks.linkedin || socialLinks.github || socialLinks.portfolio) && (
                  <Box>
                    <Text fontWeight="medium" mb={2}>Social Links:</Text>
                    <SimpleGrid columns={1} spacing={2} pl={4}>
                      {socialLinks.linkedin && (
                        <Link href={socialLinks.linkedin} isExternal color="blue.500">
                          <HStack>
                            <ExternalLink size={16} />
                            <Text>LinkedIn</Text>
                          </HStack>
                        </Link>
                      )}
                      {socialLinks.github && (
                        <Link href={socialLinks.github} isExternal color="blue.500">
                          <HStack>
                            <ExternalLink size={16} />
                            <Text>GitHub</Text>
                          </HStack>
                        </Link>
                      )}
                      {socialLinks.portfolio && (
                        <Link href={socialLinks.portfolio} isExternal color="blue.500">
                          <HStack>
                            <ExternalLink size={16} />
                            <Text>Portfolio</Text>
                          </HStack>
                        </Link>
                      )}
                    </SimpleGrid>
                  </Box>
                )}
                {team.createdAt && (
                  <HStack>
                    <Text flex="1">Created:</Text>
                    <Text fontSize="sm" color="gray.500">
                      {new Date(team.createdAt).toLocaleDateString()}
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

export default ViewTeamModal

