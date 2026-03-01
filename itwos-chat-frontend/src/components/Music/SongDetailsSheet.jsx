import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  IconButton,
  Button,
} from '@chakra-ui/react';
import { Bookmark, BookmarkCheck, Music, X } from 'lucide-react';
import { useSongDetails } from '../../contexts/SongDetailsContext';
import { saveSong, unsaveSong, getSavedSongs } from '../../utils/savedSongs';

export default function SongDetailsSheet() {
  const { sound, closeSongDetails } = useSongDetails();
  const [isSavedSong, setIsSavedSong] = useState(false);

  const isOpen = !!sound;
  const videoId = sound?.video_id ?? sound?.id;

  useEffect(() => {
    if (!videoId) {
      setIsSavedSong(false);
      return;
    }
    let cancelled = false;
    getSavedSongs().then((list) => {
      if (!cancelled) setIsSavedSong(list.some((s) => (s.id || s.video_id) === videoId));
    });
    return () => { cancelled = true; };
  }, [videoId]);

  const handleSave = async () => {
    if (!sound || !videoId) return;
    if (isSavedSong) {
      await unsaveSong(videoId);
      setIsSavedSong(false);
    } else {
      await saveSong(sound);
      setIsSavedSong(true);
    }
  };

  if (!sound) return null;

  return (
    <>
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={1400}
        transform={isOpen ? 'translateY(0)' : 'translateY(100%)'}
        transition="transform 0.3s ease-out"
        bg="rgba(28, 28, 30, 0.98)"
        borderTopLeftRadius="24px"
        borderTopRightRadius="24px"
        borderTop="1px solid"
        borderColor="whiteAlpha.200"
        paddingBottom="env(safe-area-inset-bottom)"
        sx={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        maxH="85vh"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        <HStack justify="space-between" p={4} borderBottom="1px solid" borderColor="whiteAlpha.100">
          <Text color="white" fontWeight="600" fontSize="lg">Song</Text>
          <IconButton
            aria-label="Close"
            icon={<X size={20} />}
            variant="ghost"
            color="white"
            borderRadius="full"
            onClick={closeSongDetails}
            _hover={{ bg: 'whiteAlpha.200' }}
          />
        </HStack>

        <VStack spacing={4} p={6} align="stretch" flex="1" overflowY="auto">
          <HStack spacing={4} align="center">
            {sound.thumbnail ? (
              <Image
                src={sound.thumbnail}
                alt={sound.title}
                w="96px"
                h="96px"
                borderRadius="xl"
                objectFit="cover"
                flexShrink={0}
              />
            ) : (
              <Box w="96px" h="96px" borderRadius="xl" bg="whiteAlpha.200" display="flex" alignItems="center" justifyContent="center">
                <Music size={40} color="white" />
              </Box>
            )}
            <VStack align="start" spacing={0} flex="1" minW={0}>
              <Text color="white" fontSize="lg" fontWeight="700" noOfLines={2}>{sound.title}</Text>
              {sound.artist && (
                <Text color="whiteAlpha.700" fontSize="md" noOfLines={1}>{sound.artist}</Text>
              )}
            </VStack>
          </HStack>

          <Button
            leftIcon={isSavedSong ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            variant="outline"
            borderColor="whiteAlpha.300"
            color="white"
            w="full"
            onClick={handleSave}
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            {isSavedSong ? 'Saved' : 'Save'}
          </Button>
        </VStack>
      </Box>

      {isOpen && (
        <Box
          position="fixed"
          inset={0}
          zIndex={1390}
          bg="blackAlpha.600"
          onClick={closeSongDetails}
          sx={{ animation: 'fadeIn 0.2s ease-out' }}
        />
      )}
    </>
  );
}
