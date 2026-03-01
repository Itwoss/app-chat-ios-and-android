import {
  Box,
  HStack,
  Text,
  Image,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { X, Music } from 'lucide-react';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SoundBadge = ({ sound, onRemove }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!sound) return null;

  return (
    <Box
      p={3}
      borderRadius="md"
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
    >
      <HStack spacing={3}>
        {sound.thumbnail ? (
          <Image
            src={sound.thumbnail}
            alt={sound.title}
            boxSize="50px"
            borderRadius="md"
            objectFit="cover"
          />
        ) : (
          <Box
            boxSize="50px"
            borderRadius="md"
            bg="gray.300"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Music size={24} color="gray" />
          </Box>
        )}
        <Box flex="1" minW={0}>
          <Text
            fontSize="sm"
            fontWeight="medium"
            color={textColor}
            isTruncated
          >
            {sound.title}
          </Text>
          <Text fontSize="xs" color={textColor} opacity={0.7} isTruncated>
            {sound.artist}
          </Text>
          {(sound.startTime > 0 || sound.endTime) && (
            <Text fontSize="2xs" color={textColor} opacity={0.6}>
              {formatTime(sound.startTime || 0)} - {sound.endTime ? formatTime(sound.endTime) : 'End'}
            </Text>
          )}
        </Box>
        {onRemove && (
          <IconButton
            icon={<X size={16} />}
            size="sm"
            variant="ghost"
            onClick={onRemove}
            aria-label="Remove sound"
            colorScheme="red"
          />
        )}
      </HStack>
    </Box>
  );
};

export default SoundBadge;

