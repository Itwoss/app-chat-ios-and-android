import { Box, Container, Heading, Text, VStack, useColorModeValue } from '@chakra-ui/react'

const About = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <Box as="main" minH="100vh" py={4}>
      <Container maxW="1200px" py={10}>
        <VStack spacing={8} align="stretch">
          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading size="lg" mb={4}>
              About Us
            </Heading>
            <Text color={textColor} lineHeight="tall">
              Welcome to Chat App! We are dedicated to providing a seamless 
              communication experience for users worldwide. Our platform is built 
              with modern technologies to ensure reliability, security, and 
              user-friendly interfaces.
            </Text>
          </Box>

          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading size="lg" mb={4}>
              Our Mission
            </Heading>
            <Text color={textColor} lineHeight="tall">
              To connect people and facilitate meaningful conversations through 
              innovative technology and exceptional user experience.
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default About

