import {
  Box,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Image,
  Text,
  Spinner,
  Center,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  IconButton,
} from '@chakra-ui/react';
import { Search, Music, Scissors, Play, Pause, X, ChevronDown, Bookmark, BookmarkCheck } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { getApiUrl } from '../../utils/apiUrl';
import MiniPlayer from './MiniPlayer';
import SoundTrimModal from './SoundTrimModal';
import { useSound } from '../../contexts/SoundContext';
import { useAudioManager } from '../../contexts/AudioManagerContext';
import { getSavedSongs, saveSong, unsaveSong } from '../../utils/savedSongs';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';

function TrackRow({ track, playingVideoId, onPlayPreview, onUseSound, onToggleSave, isSaved }) {
  const trackId = track.id ?? track.video_id;
  return (
    <Box
      w="full"
      py={3}
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
      bg={playingVideoId === trackId ? 'whiteAlpha.100' : 'transparent'}
      _hover={{ bg: 'whiteAlpha.100' }}
      _active={{ transform: 'scale(0.98)' }}
      transition="all 0.12s"
      cursor="pointer"
      onClick={() => onPlayPreview(track)}
      display="flex"
      alignItems="center"
      textAlign="left"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlayPreview(track);
        }
      }}
      sx={{ '&:hover .play-icon-overlay': { opacity: '1 !important' } }}
    >
      <HStack spacing={3} flex="1" minW={0}>
        {track.thumbnail ? (
          <Box position="relative" boxSize="56px" borderRadius="md" overflow="hidden" flexShrink={0}>
            <Image src={track.thumbnail} alt={track.title} boxSize="56px" borderRadius="md" objectFit="cover" />
            <Box
              className="play-icon-overlay"
              position="absolute"
              inset={0}
              bg="blackAlpha.400"
              display="flex"
              alignItems="center"
              justifyContent="center"
              opacity={playingVideoId === trackId ? 1 : 0}
              transition="opacity 0.2s"
              pointerEvents="none"
            >
              <Box bg="blackAlpha.700" borderRadius="full" p={2}>
                {playingVideoId === trackId ? (
                  <Pause size={16} color="white" fill="white" />
                ) : (
                  <Play size={16} color="white" fill="white" />
                )}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box boxSize="56px" borderRadius="md" bg="gray.300" display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
            <Music size={24} color="gray" />
          </Box>
        )}
        <VStack align="start" spacing={0} flex="1" minW={0}>
          <Text fontSize="sm" fontWeight="bold" color="white" isTruncated w="full">{track.title}</Text>
          <Text fontSize="xs" color="whiteAlpha.700" isTruncated w="full">{track.artist}</Text>
        </VStack>
        <IconButton
          aria-label={isSaved ? 'Unsave' : 'Save'}
          icon={isSaved ? <BookmarkCheck size={20} color="white" /> : <Bookmark size={20} color="white" />}
          variant="ghost"
          color="white"
          size="sm"
          flexShrink={0}
          _hover={{ bg: 'whiteAlpha.200' }}
          onClick={(e) => onToggleSave(track, e)}
        />
        <Button
          size="sm"
          bg="blue.500"
          color="white"
          onClick={(e) => {
            e.stopPropagation();
            onUseSound(track);
          }}
          borderRadius="full"
          flexShrink={0}
          fontWeight="600"
          _hover={{ bg: 'blue.600' }}
        >
          Use
        </Button>
      </HStack>
    </Box>
  );
}

const MusicSearch = ({ isOpen, onClose, onSelectSound, postImages = [] }) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(false);
  const [savedSongs, setSavedSongs] = useState([]);
  const [savedListOpen, setSavedListOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [isTrimModalOpen, setIsTrimModalOpen] = useState(false);
  const [trackToTrim, setTrackToTrim] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [minimizedTrack, setMinimizedTrack] = useState(null);
  const [trimPreviewActive, setTrimPreviewActive] = useState(false);
  const scrollContainerRef = useRef(null);

  const { selectSound } = useSound();
  const { stopAll: stopBackgroundAudio } = useAudioManager();

  useEffect(() => {
    if (isOpen) {
      stopBackgroundAudio();
    }
  }, [isOpen, stopBackgroundAudio]);

  const refreshSavedSongs = useCallback(async () => {
    const list = await getSavedSongs();
    setSavedSongs(list);
  }, []);

  useEffect(() => {
    if (isOpen) refreshSavedSongs();
  }, [isOpen, refreshSavedSongs]);

  // Fetch Today's Top 20 Trending when modal opens and no search query
  useEffect(() => {
    if (!isOpen) return;
    setTrendingLoading(true);
    const baseUrl = getApiUrl();
    const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/music/trending` : '/api/music/trending';
    axios.get(url, { params: { limit: 20 } })
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setTrendingTracks(res.data.data);
        }
      })
      .catch(() => setTrendingTracks([]))
      .finally(() => setTrendingLoading(false));
  }, [isOpen]);

  const handleToggleSave = useCallback(async (track, e) => {
    e?.stopPropagation();
    const id = track.id ?? track.video_id;
    const saved = savedSongs.some((s) => (s.id || s.video_id) === id);
    if (saved) {
      await unsaveSong(id);
    } else {
      await saveSong(track);
    }
    refreshSavedSongs();
  }, [refreshSavedSongs, savedSongs]);

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      
      const handleWheel = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const maxScroll = scrollHeight - clientHeight;
        const isAtTop = scrollTop <= 1;
        const isAtBottom = scrollTop >= maxScroll - 1;
        
        const canScrollDown = e.deltaY > 0 && !isAtBottom;
        const canScrollUp = e.deltaY < 0 && !isAtTop;
        
        if (canScrollDown || canScrollUp) {
          e.preventDefault();
          e.stopPropagation();
          container.scrollTop += e.deltaY;
        } else {
          e.stopPropagation();
        }
      };

      container.addEventListener('wheel', handleWheel, { passive: false });
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setTracks([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Auto-scroll to top when a song starts playing
  useEffect(() => {
    if (playingVideoId && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [playingVideoId]);

  const handleSearch = async (query) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchError(null);
    try {
      const baseUrl = getApiUrl();
      const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/api/music/search` : '/api/music/search';
      const response = await axios.get(url, {
        params: { q: query.trim() },
      });

      // Support multiple response shapes: { data: [] }, { tracks: [] }, or array at top level
      let list = [];
      if (response.data?.success) {
        const raw = response.data.data ?? response.data.tracks ?? response.data;
        list = Array.isArray(raw) ? raw : [];
      }
      // Normalize so every track has .id (for key, play state, use sound)
      const normalized = list.map((t) => ({
        ...t,
        id: t.id ?? t.video_id,
        title: t.title ?? t.name ?? '',
        artist: t.artist ?? t.channelTitle ?? '',
        thumbnail: t.thumbnail ?? t.thumbnails?.default ?? t.thumbnails?.medium ?? null,
        preview_url: t.preview_url ?? (t.id || t.video_id ? `https://www.youtube.com/embed/${t.id || t.video_id}` : null),
      })).filter((t) => t.id);
      setTracks(normalized);
    } catch (error) {
      console.error('Error searching music:', error);
      setTracks([]);
      setSearchError(error.response?.status === 404 ? 'Music search is not available.' : 'Search failed. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPreview = (track) => {
    const trackId = track.id ?? track.video_id;
    if (playingVideoId === trackId) {
      setPlayingVideoId(null);
      setSelectedTrack(null);
    } else {
      setPlayingVideoId(trackId);
      setSelectedTrack(track);
    }
  };

  const handleUseSound = (track, skipTrim = false) => {
    // Stop playback when Use or Trim is clicked
    setPlayingVideoId(null);
    setSelectedTrack(null);
    
    if (!skipTrim) {
      setTrackToTrim(track);
      setMinimizedTrack(track);
      setIsMinimized(true);
      setIsTrimModalOpen(true);
      return;
    }

    const soundData = {
      video_id: track.id ?? track.video_id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      preview_url: track.preview_url,
      source: 'youtube',
      startTime: 0,
      endTime: null,
    };

    selectSound(soundData);
    if (onSelectSound) {
      onSelectSound(soundData);
    }
    setIsMinimized(false);
    setMinimizedTrack(null);
    onClose();
  };

  const handleTrimConfirm = (trimmedSoundData) => {
    if (selectedTrack && selectedTrack.id === trimmedSoundData.video_id) {
      setSelectedTrack({
        ...selectedTrack,
        startTime: trimmedSoundData.startTime,
        endTime: trimmedSoundData.endTime,
      });
    }
    
    selectSound(trimmedSoundData);
    if (onSelectSound) {
      onSelectSound(trimmedSoundData);
    }
    setIsTrimModalOpen(false);
    setTrackToTrim(null);
    setIsMinimized(false);
    setMinimizedTrack(null);
    onClose();
  };

  const handleExpand = () => {
    setIsMinimized(false);
  };

  const handleMinimizeClose = () => {
    setIsMinimized(false);
    setMinimizedTrack(null);
    setTrackToTrim(null);
    setIsTrimModalOpen(false);
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setTracks([]);
    setSearchError(null);
    setPlayingVideoId(null);
    setSelectedTrack(null);
    setIsMinimized(false);
    setMinimizedTrack(null);
    onClose();
  };

  // Reset minimized state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsMinimized(false);
      setMinimizedTrack(null);
    }
  }, [isOpen]);

  return (
    <>
      {/* Minimized Floating Bar (Dynamic Island style) */}
      {isMinimized && minimizedTrack && (
        <Box
          position="fixed"
          top={{ base: 4, md: 6 }}
          left="50%"
          transform="translateX(-50%)"
          zIndex={1500}
          maxW={{ base: "calc(100% - 32px)", md: "400px" }}
          w="auto"
          sx={{
            animation: 'slideDown 0.3s ease-out',
            '@keyframes slideDown': {
              from: {
                opacity: 0,
                transform: 'translateX(-50%) translateY(-20px)',
              },
              to: {
                opacity: 1,
                transform: 'translateX(-50%) translateY(0)',
              },
            },
          }}
        >
          <Box
            bg="rgba(0, 0, 0, 0.8)"
            borderRadius="full"
            px={4}
            py={2.5}
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.2)"
            sx={{
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
            cursor="pointer"
            onClick={handleExpand}
            _hover={{
              bg: 'rgba(0, 0, 0, 0.9)',
              transform: 'scale(1.02)',
            }}
            transition="all 0.2s"
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
          >
            <HStack spacing={3} align="center">
              {minimizedTrack.thumbnail ? (
                <Image
                  src={minimizedTrack.thumbnail}
                  alt={minimizedTrack.title}
                  boxSize="32px"
                  borderRadius="full"
                  objectFit="cover"
                />
              ) : (
                <Box
                  boxSize="32px"
                  borderRadius="full"
                  bg="whiteAlpha.200"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Music size={16} color="white" />
                </Box>
              )}
              <VStack align="start" spacing={0} flex="1" minW={0}>
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color="white"
                  isTruncated
                  w="full"
                >
                  {minimizedTrack.title}
                </Text>
                <Text
                  fontSize="xs"
                  color="whiteAlpha.700"
                  isTruncated
                  w="full"
                >
                  {minimizedTrack.artist}
                </Text>
              </VStack>
              <IconButton
                icon={<X size={14} />}
                size="xs"
                variant="ghost"
                color="white"
                borderRadius="full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMinimizeClose();
                }}
                _hover={{
                  bg: 'whiteAlpha.200',
                }}
                aria-label="Close"
              />
            </HStack>
          </Box>
        </Box>
      )}

      <Modal 
        isOpen={isOpen && !isMinimized} 
        onClose={handleClose} 
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
        maxW={{ base: "calc(100% - 48px)", md: "600px" }}
        h={{ base: "auto", md: "auto" }}
        maxH={{ base: "calc(100vh - 48px)", md: "90vh" }}
        borderRadius={{ base: "20px", md: "24px" }}
        overflow="hidden"
        bg="transparent"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.2)"
        display="flex" 
        flexDirection="column"
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
          flexShrink={0}
        >
          <HStack justify="space-between" w="full">
            <HStack spacing={2}>
              <Music size={20} color="white" />
              <Text color="white">Search Music</Text>
              <IconButton
                aria-label="Saved songs"
                icon={<BookmarkCheck size={20} color="white" />}
                variant="ghost"
                color="white"
                size="sm"
                borderRadius="full"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={() => setSavedListOpen(true)}
              />
            </HStack>
            <ModalCloseButton 
              color="white"
              borderRadius="full"
              size="sm"
              _hover={{
                bg: 'whiteAlpha.200',
              }}
            />
          </HStack>
        </ModalHeader>
        <Box 
          ref={scrollContainerRef}
          flex="1" 
          minH="0"
          h="100%"
          overflowY="auto" 
          overflowX="hidden"
          position="relative"
          tabIndex={0}
          onMouseEnter={(e) => {
            e.currentTarget.focus();
          }}
          style={{
            scrollBehavior: 'smooth',
          }}
          css={{
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            height: '100%',
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
            '&:focus': {
              outline: 'none',
            },
          }}
        >
          <VStack spacing={0} align="stretch" w="full">
            {/* Search Input */}
            <Box px={{ base: 3, md: 4 }} pt={4} pb={3} flexShrink={0}>
              <InputGroup>
                <InputLeftElement pointerEvents="none" pl={4}>
                  <Search size={18} color="rgba(255, 255, 255, 0.5)" />
                </InputLeftElement>
                <Input
                  placeholder="Search music..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="lg"
                  autoFocus
                  borderRadius="full"
                  bg="transparent"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  color="white"
                  pl={12}
                  _placeholder={{ color: 'whiteAlpha.500' }}
                  _focus={{
                    bg: 'transparent',
                    borderColor: 'whiteAlpha.300',
                    boxShadow: 'none',
                  }}
                  _hover={{
                    bg: 'transparent',
                    borderColor: 'whiteAlpha.200',
                  }}
                />
              </InputGroup>
            </Box>

            {/* Sticky Mini Player */}
            {playingVideoId && selectedTrack && (
              <Box
                position="sticky"
                top={0}
                zIndex={10}
                bg="transparent"
                borderBottom="1px solid"
                borderColor="whiteAlpha.100"
                flexShrink={0}
                sx={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <VStack spacing={0} align="stretch">
                  <Box px={{ base: 3, md: 4 }} py={3}>
                    <MiniPlayer
                      videoId={playingVideoId}
                      startTime={selectedTrack.startTime || 0}
                      endTime={selectedTrack.endTime || null}
                      onClose={() => {
                        setPlayingVideoId(null);
                        setSelectedTrack(null);
                      }}
                      externalPaused={trimPreviewActive}
                    />
                  </Box>
                  <HStack spacing={2} px={{ base: 3, md: 4 }} pb={3}>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Scissors size={14} />}
                      onClick={() => {
                        // Stop playback when Trim is clicked
                        setPlayingVideoId(null);
                        setSelectedTrack(null);
                        setTrackToTrim(selectedTrack);
                        setIsTrimModalOpen(true);
                      }}
                      flex="1"
                      borderRadius="full"
                      bg="transparent"
                      border="1px solid"
                      borderColor="whiteAlpha.100"
                      color="white"
                      _hover={{
                        bg: 'whiteAlpha.100',
                      }}
                    >
                      Trim
                    </Button>
                    <Button
                      size="sm"
                      bg="blue.500"
                      color="white"
                      onClick={() => {
                        // Stop playback when Use is clicked
                        handleUseSound(selectedTrack, true);
                      }}
                      flex="1"
                      borderRadius="full"
                      fontWeight="600"
                      _hover={{
                        bg: 'blue.600',
                      }}
                    >
                      Use
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            )}

            {/* Search: show results / loading / empty right below input so they are always visible */}
            {searchQuery && (
              <>
                {isLoading && (
                  <Center py={6} flexShrink={0}>
                    <Spinner size="lg" color="blue.500" thickness="3px" />
                  </Center>
                )}
                {!isLoading && tracks.length > 0 && (
                  <Box flexShrink={0} px={{ base: 3, md: 4 }} pb={4}>
                    <Text fontSize="md" fontWeight="700" color="white" mb={3}>
                      Search results
                    </Text>
                    <VStack spacing={0} align="stretch">
                      {tracks.map((track) => (
                        <TrackRow
                          key={track.id ?? track.video_id}
                          track={track}
                          playingVideoId={playingVideoId}
                          onPlayPreview={handlePlayPreview}
                          onUseSound={(t) => {
                            setPlayingVideoId(null);
                            setSelectedTrack(null);
                            handleUseSound(t);
                          }}
                          onToggleSave={handleToggleSave}
                          isSaved={savedSongs.some((s) => (s.id || s.video_id) === (track.id ?? track.video_id))}
                        />
                      ))}
                    </VStack>
                  </Box>
                )}
                {!isLoading && tracks.length === 0 && (
                  <Center py={6} flexShrink={0}>
                    <VStack spacing={2}>
                      <Music size={40} color="rgba(255, 255, 255, 0.5)" />
                      <Text color="white" fontSize="sm">
                        {searchError || 'No results found'}
                      </Text>
                      <Text color="whiteAlpha.600" fontSize="xs">
                        {searchError ? 'Try again or check back later.' : 'Try a different search term'}
                      </Text>
                    </VStack>
                  </Center>
                )}
              </>
            )}

            {/* Today's Top 20 Trending Songs - always visible (above or below search results) */}
            <Box flexShrink={0} px={{ base: 3, md: 4 }} pb={4}>
              <Text fontSize="md" fontWeight="700" color="white" mb={3}>
                Today&apos;s Top 20 Trending Songs
              </Text>
              {trendingLoading ? (
                <Center py={6}><Spinner size="md" color="blue.500" /></Center>
              ) : trendingTracks.length > 0 ? (
                <VStack spacing={0} align="stretch">
                  {trendingTracks.map((track) => (
                        <TrackRow
                          key={track.id ?? track.video_id}
                          track={track}
                          playingVideoId={playingVideoId}
                          onPlayPreview={handlePlayPreview}
                          onUseSound={(t) => {
                            setPlayingVideoId(null);
                            setSelectedTrack(null);
                            handleUseSound(t);
                          }}
                          onToggleSave={handleToggleSave}
                          isSaved={savedSongs.some((s) => (s.id || s.video_id) === (track.id ?? track.video_id))}
                        />
                      ))}
                </VStack>
              ) : (
                <Text fontSize="sm" color="whiteAlpha.600">No trending tracks right now.</Text>
              )}
            </Box>

            {/* Initial State - when no trending yet and no search */}
            {!trendingLoading && trendingTracks.length === 0 && !searchQuery && (
              <Center py={8} flexShrink={0}>
                <VStack spacing={2}>
                  <Music size={48} color="rgba(255, 255, 255, 0.5)" />
                  <Text color="white" fontSize="sm">
                    Search for music or check trending above
                  </Text>
                </VStack>
              </Center>
            )}
          </VStack>
        </Box>
      </ModalContent>
      </Modal>

      <SoundTrimModal
        isOpen={isTrimModalOpen}
        onClose={() => {
          setIsTrimModalOpen(false);
          setTrackToTrim(null);
          setTrimPreviewActive(false);
        }}
        sound={trackToTrim}
        onTrimConfirm={handleTrimConfirm}
        postImages={postImages}
        onPreviewStart={() => setTrimPreviewActive(true)}
        onPreviewEnd={() => setTrimPreviewActive(false)}
      />

      {/* Saved songs list - bottom sheet / drawer */}
      <Drawer
        isOpen={savedListOpen}
        placement="bottom"
        onClose={() => setSavedListOpen(false)}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent
          bg="rgba(28, 28, 30, 0.98)"
          borderTopRadius="24px"
          borderTop="1px solid"
          borderColor="whiteAlpha.200"
          maxH="85vh"
          sx={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          <DrawerHeader borderBottom="1px solid" borderColor="whiteAlpha.100" py={4}>
            <HStack justify="space-between">
              <HStack spacing={2}>
                <BookmarkCheck size={22} color="white" />
                <Text color="white" fontWeight="600">Saved Songs</Text>
              </HStack>
              <DrawerCloseButton color="white" borderRadius="full" _hover={{ bg: 'whiteAlpha.200' }} />
            </HStack>
          </DrawerHeader>
          <DrawerBody overflowY="auto" pb={8}>
            {savedSongs.length === 0 ? (
              <Center py={10}>
                <VStack spacing={2}>
                  <Bookmark size={40} color="rgba(255,255,255,0.5)" />
                  <Text color="whiteAlpha.600" fontSize="sm">No saved songs yet</Text>
                  <Text color="whiteAlpha.500" fontSize="xs">Save songs from search to see them here</Text>
                </VStack>
              </Center>
            ) : (
              <VStack spacing={0} align="stretch" py={2}>
                {savedSongs.map((s) => {
                  const track = { id: s.id ?? s.video_id, title: s.title, artist: s.artist, thumbnail: s.thumbnail, preview_url: s.preview_url, source: s.source };
                  return (
                    <TrackRow
                      key={track.id}
                      track={track}
                      playingVideoId={playingVideoId}
                      onPlayPreview={handlePlayPreview}
                      onUseSound={(t) => {
                        setPlayingVideoId(null);
                        setSelectedTrack(null);
                        handleUseSound(t);
                        setSavedListOpen(false);
                      }}
                      onToggleSave={(t, e) => {
                        handleToggleSave(t, e);
                        refreshSavedSongs();
                      }}
                      isSaved={true}
                    />
                  );
                })}
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MusicSearch;
