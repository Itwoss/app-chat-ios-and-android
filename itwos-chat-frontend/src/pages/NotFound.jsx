import { Box, Container, VStack, Heading, Text, Button, useColorModeValue } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box minH="100vh" bg={bgColor} py={20}>
      <Container maxW="md" centerContent>
        <VStack spacing={6} textAlign="center">
          <Heading size="2xl" color={textColor}>
            404
          </Heading>
          <Heading size="lg" color={textColor}>
            Page Not Found
          </Heading>
          <Text color={textColor} fontSize="lg">
            The page you're looking for doesn't exist or has been moved.
          </Text>
          <Button
            leftIcon={<Home size={20} />}
            colorScheme="blue"
            size="lg"
            onClick={() => navigate('/')}
          >
            Go Home
          </Button>
        </VStack>
      </Container>
    </Box>
  );
};

export default NotFound;

