import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { Users, Star, Globe } from 'lucide-react';

const OPTIONS = [
  { value: 'followers', label: 'Followers Only', icon: Users },
  { value: 'close_friends', label: 'Close Friends', icon: Star, isCloseFriends: true },
  { value: 'public', label: 'Public', icon: Globe },
];

/**
 * Popup-style "Who can see your story?" modal.
 * Centered, rounded card with header and close button.
 */
export default function PostVisibilityModal({ isOpen, onClose, onSelect, currentValue }) {
  const contentBg = useColorModeValue('white', 'gray.800');
  const rowBg = useColorModeValue('gray.50', 'gray.700');
  const rowHover = useColorModeValue('gray.100', 'gray.600');
  const textColor = useColorModeValue('gray.800', 'white');
  const headerBorder = useColorModeValue('gray.200', 'gray.600');
  const closeHoverBg = useColorModeValue('gray.100', 'gray.600');
  const iconCircleBg = useColorModeValue('gray.100', 'gray.600');

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
      <ModalOverlay bg="blackAlpha.500" backdropFilter="blur(4px)" />
      <ModalContent
        bg={contentBg}
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="xl"
        mx={4}
      >
        <ModalHeader
          py={4}
          borderBottomWidth="1px"
          borderColor={headerBorder}
          fontWeight="600"
          fontSize="lg"
        >
          Who can see your story?
        </ModalHeader>
        <ModalCloseButton
          top={3}
          right={3}
          borderRadius="full"
          _hover={{ bg: closeHoverBg }}
        />
        <ModalBody py={0} px={0}>
          <VStack spacing={0} align="stretch">
            {OPTIONS.map((opt) => (
              <Box
                key={opt.value}
                as="button"
                w="100%"
                py={4}
                px={5}
                bg={currentValue === opt.value ? rowHover : rowBg}
                _hover={{ bg: rowHover }}
                _active={{ bg: rowHover }}
                onClick={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                textAlign="left"
                borderBottomWidth={opt.value !== OPTIONS[OPTIONS.length - 1].value ? '1px' : 0}
                borderColor={headerBorder}
              >
                <HStack spacing={4}>
                  <Box
                    p={2}
                    borderRadius="full"
                    bg={opt.isCloseFriends ? 'green.50' : iconCircleBg}
                  >
                    <Icon
                      as={opt.icon}
                      boxSize={5}
                      color={opt.isCloseFriends ? 'green.500' : 'gray.600'}
                    />
                  </Box>
                  <Text fontWeight="600" color={textColor} fontSize="md">
                    {opt.label}
                  </Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
