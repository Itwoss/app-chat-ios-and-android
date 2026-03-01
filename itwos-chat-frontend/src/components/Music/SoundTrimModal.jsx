import { useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useColorModeValue,
  Box,
  Image,
} from '@chakra-ui/react';
import SongTrimmer from './SongTrimmer';
import { useAudioManager } from '../../contexts/AudioManagerContext';

const SoundTrimModal = ({ isOpen, onClose, sound, onTrimConfirm, postImages = [], onPreviewStart, onPreviewEnd }) => {
  const { stopAll: stopBackgroundAudio } = useAudioManager();

  useEffect(() => {
    if (isOpen) {
      stopBackgroundAudio();
    }
  }, [isOpen, stopBackgroundAudio]);
  const handleConfirm = (trimmedSound) => {
    if (onTrimConfirm) {
      onTrimConfirm(trimmedSound);
    }
    onClose();
  };

  if (!sound) return null;

  // Map sound to track format expected by SongTrimmer
  const track = {
    id: sound.video_id || sound.id,
    video_id: sound.video_id || sound.id,
    title: sound.title,
    artist: sound.artist,
    thumbnail: sound.thumbnail,
    preview_url: sound.preview_url,
    duration: sound.duration || 300, // Default to 5 minutes if not provided
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={{ base: "md", md: "xl" }}
      isCentered
      motionPreset="scale"
      closeOnOverlayClick={true}
    >
      <ModalOverlay 
        bg="blackAlpha.600"
        sx={{
          animation: 'fadeIn 0.3s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 }
          }
        }}
      />
      <ModalContent
        mx={{ base: 6, md: 4 }}
        my={{ base: 6, md: 4 }}
        maxW={{ base: "calc(100% - 48px)", md: "700px" }}
        h={{ base: "auto", md: "auto" }}
        maxH={{ base: "calc(100vh - 48px)", md: "90vh" }}
        borderRadius={{ base: "20px", md: "24px" }}
        overflow="hidden"
        bg="transparent"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.2)"
        sx={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'none',
        }}
      >
        <ModalHeader
          py={{ base: 2.5, md: 3 }}
          px={{ base: 3, md: 4 }}
          fontSize={{ base: "15px", md: "17px" }}
          fontWeight="600"
          color="white"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          bg="transparent"
        >
          Trim Sound
        </ModalHeader>
        
        <ModalCloseButton 
          top={{ base: 2, md: 3 }}
          right={{ base: 2.5, md: 4 }}
          color="white"
          borderRadius="full"
          size="sm"
          _hover={{
            bg: 'whiteAlpha.200',
          }}
        />
        
        <ModalBody
          px={{ base: 3, md: 4 }}
          py={{ base: 2, md: 3 }}
          overflowY="auto"
          maxH="calc(100vh - 120px)"
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
            },
          }}
        >
          {/* Post Image Preview */}
          {postImages && postImages.length > 0 && (
            <Box
              mb={4}
              borderRadius="24px"
              overflow="hidden"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.2)"
              bg="transparent"
              w="100%"
              aspectRatio="1"
            >
              <Image
                src={URL.createObjectURL(postImages[0])}
                alt="Post preview"
                w="100%"
                h="100%"
                objectFit="cover"
                display="block"
              />
            </Box>
          )}
          
          <SongTrimmer
            track={track}
            onConfirm={handleConfirm}
            onCancel={onClose}
            defaultStartTime={sound.startTime != null ? Math.min(sound.startTime, Math.max(0, (sound.duration || 300) - 30)) : 0}
            maxDuration={sound.duration || 300}
            onPreviewStart={onPreviewStart}
            onPreviewEnd={onPreviewEnd}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SoundTrimModal;
