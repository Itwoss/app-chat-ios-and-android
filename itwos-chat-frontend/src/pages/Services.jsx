import { Box, Container, Heading, Text, VStack, SimpleGrid, useColorModeValue } from '@chakra-ui/react'

const Services = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const services = [
    {
      title: 'Real-time Messaging',
      description: 'Send and receive messages instantly with our real-time messaging system.',
    },
    {
      title: 'Secure Communication',
      description: 'Your conversations are encrypted and secure with industry-standard protocols.',
    },
    {
      title: 'Multi-platform Support',
      description: 'Access your chats from any device, anywhere, anytime.',
    },
  ]

  return (
    <Box as="main" minH="100vh" py={4}>
      <Container maxW="1200px" py={10}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading size="2xl" mb={4}>
              Our Services
            </Heading>
            <Text fontSize="lg" color={textColor}>
              Discover what we offer
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {services.map((service, index) => (
              <Box
                key={index}
                bg={bgColor}
                p={6}
                borderRadius="lg"
                boxShadow="md"
              >
                <Heading size="md" mb={3}>
                  {service.title}
                </Heading>
                <Text color={textColor}>
                  {service.description}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  )
}

export default Services

