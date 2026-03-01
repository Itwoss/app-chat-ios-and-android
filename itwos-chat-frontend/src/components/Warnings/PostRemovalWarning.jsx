import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  VStack,
  Text,
  Box,
  HStack,
  useColorModeValue,
  Button,
  Divider,
} from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarkAsReadMutation } from '../../store/api/userApi';

const PostRemovalWarning = ({ isOpen, onClose, notification }) => {
  const cancelRef = useRef();
  const navigate = useNavigate();
  const [markAsRead] = useMarkAsReadMutation();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('red.200', 'red.800');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  const handleClose = useCallback(() => {
    // Mark notification as read when dialog is closed
    if (notification && !notification.isRead) {
      markAsRead(notification._id).catch(console.error);
    }
    onClose();
  }, [notification, markAsRead, onClose]);

  useEffect(() => {
    if (isOpen && notification && !notification.isRead) {
      // Mark notification as read when dialog opens
      markAsRead(notification._id).catch(console.error);
    }
  }, [isOpen, notification, markAsRead]);

  useEffect(() => {
    if (isOpen && notification) {
      // Auto-close after 30 seconds if user doesn't interact
      const timer = setTimeout(() => {
        handleClose();
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, notification, handleClose]);

  const handleGoToProfile = () => {
    handleClose();
    if (notification?.link) {
      navigate(notification.link);
    } else {
      navigate('/user/profile');
    }
  };

  if (!notification) return null;

  // Extract reason from message if available
  const messageLines = notification.message?.split('\n') || [];
  let reason = 'Policy violation';
  
  // Try to find reason in different formats
  const reasonLine = messageLines.find(line => 
    line.includes('Reason:') || line.includes('reason:')
  );
  
  if (reasonLine) {
    reason = reasonLine.replace(/Reason:/i, '').trim();
  } else if (notification.message) {
    // If no explicit reason line, try to extract from message
    const reasonMatch = notification.message.match(/Reason:\s*(.+?)(?:\n|$)/i);
    if (reasonMatch) {
      reason = reasonMatch[1].trim();
    }
  }

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={handleClose}
      closeOnOverlayClick={false}
      closeOnEsc={true}
      size="lg"
      isCentered
    >
      <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <AlertDialogContent bg={bgColor} border="2px" borderColor="red.500">
        <AlertDialogHeader
          bg="red.50"
          _dark={{ bg: 'red.900' }}
          borderBottom="2px"
          borderColor="red.200"
          pb={4}
        >
          <VStack spacing={3} align="stretch">
            <HStack spacing={3}>
              <Box
                p={2}
                borderRadius="full"
                bg="red.100"
                color="red.600"
                _dark={{ bg: 'red.800', color: 'red.200' }}
              >
                <AlertTriangle size={24} />
              </Box>
              <VStack align="start" spacing={0} flex="1">
                <Text fontSize="lg" fontWeight="bold" color="red.600" _dark={{ color: 'red.200' }}>
                  {notification.title || 'Post Removed'}
                </Text>
                <Text fontSize="sm" color="red.500" _dark={{ color: 'red.300' }}>
                  Policy Violation Warning
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </AlertDialogHeader>

        <AlertDialogBody py={6}>
          <VStack spacing={4} align="stretch">
            <Box
              p={4}
              borderRadius="md"
              bg="red.50"
              border="1px"
              borderColor="red.200"
              _dark={{ bg: 'red.900', borderColor: 'red.700' }}
            >
              <Text fontSize="sm" fontWeight="bold" color="red.700" _dark={{ color: 'red.200' }} mb={2}>
                Removal Reason:
              </Text>
              <Text fontSize="sm" color="red.600" _dark={{ color: 'red.300' }} whiteSpace="pre-line">
                {reason}
              </Text>
            </Box>

            <Divider />

            <VStack spacing={2} align="stretch">
              <Text fontSize="sm" color={textColor} fontWeight="medium">
                What this means:
              </Text>
              <Box as="ul" pl={4} fontSize="sm" color={textColor} spacing={1}>
                <Box as="li" mb={1}>
                  Your post has been removed from all public views
                </Box>
                <Box as="li" mb={1}>
                  Other users can no longer see or interact with this post
                </Box>
                <Box as="li" mb={1}>
                  This action has been recorded in your account
                </Box>
              </Box>
            </VStack>

            <Box
              p={3}
              borderRadius="md"
              bg="yellow.50"
              border="1px"
              borderColor="yellow.200"
              _dark={{ bg: 'yellow.900', borderColor: 'yellow.700' }}
            >
              <Text fontSize="xs" color="yellow.700" _dark={{ color: 'yellow.200' }} fontWeight="medium">
                ⚠️ Important: Repeated violations may result in account restrictions or suspension.
              </Text>
            </Box>
          </VStack>
        </AlertDialogBody>

        <AlertDialogFooter borderTop="1px" borderColor={borderColor} pt={4}>
          <Button ref={cancelRef} onClick={handleClose} variant="ghost" mr={3}>
            I Understand
          </Button>
          <Button colorScheme="red" onClick={handleGoToProfile}>
            View My Profile
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PostRemovalWarning;

