import { Box, Container, Heading, Text, VStack, Button, useColorModeValue } from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState/EmptyState'

const Home = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <Box as="main" minH="100vh" py={4}>
      <Container maxW="1200px" py={10}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" py={10}>
            <Heading size="2xl" mb={4}>
              Welcome to Chat App
            </Heading>
            <Text fontSize="xl" color={textColor} mb={6}>
              Connect with people around the world
            </Text>
            <Button as={Link} to="/register" colorScheme="blue" size="lg">
              Get Started
            </Button>
          </Box>

          <Box bg={bgColor} p={8} borderRadius="lg" boxShadow="md">
            <Heading size="lg" mb={4}>
              Features
            </Heading>
            <Text color={textColor}>
              This is a modern chat application built with MERN stack. 
              More features coming soon!
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}

export default Home

