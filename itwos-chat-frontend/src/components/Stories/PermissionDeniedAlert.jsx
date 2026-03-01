import {
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

/**
 * Shown when user denies camera/photo access.
 * "Allow camera & photos to create a story" + Open Settings.
 */
export default function PermissionDeniedAlert({ isOpen, onClose, onOpenSettings }) {
  const bg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white');

  const handleOpenSettings = () => {
    onOpenSettings?.();
    onClose?.();
  };

  return (
    <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={undefined} isCentered>
      <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <AlertDialogContent bg={bg} borderRadius="2xl" mx={4}>
        <AlertDialogHeader fontSize="lg" fontWeight="600" color={textColor}>
          Camera &amp; photos
        </AlertDialogHeader>
        <AlertDialogBody>
          <Text color={textColor}>
            Allow camera &amp; photos to create a story.
          </Text>
        </AlertDialogBody>
        <AlertDialogFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleOpenSettings}>
            Open Settings
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
