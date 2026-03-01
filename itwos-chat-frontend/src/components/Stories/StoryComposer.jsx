import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  IconButton,
  Button,
  useToast,
  useDisclosure,
  Text,
  VStack,
  HStack,
  Avatar,
  Input,
  InputGroup,
  InputLeftElement,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';
import { X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useCreateStoryMutation, useGetFollowingQuery } from '../../store/api/userApi';
import { getUserInfo } from '../../utils/auth';
import { buildYouTubeEmbedUrl } from '../../utils/youtubeEmbed';
import { useSound } from '../../contexts/SoundContext';
import { useAudioManager } from '../../contexts/AudioManagerContext';
import useStoryLayers from '../../hooks/useStoryLayers';
import StoryGalleryPicker from './StoryGalleryPicker';
import StoryCanvas from './StoryCanvas';
import StoryToolbar from './StoryToolbar';
import PermissionDeniedAlert from './PermissionDeniedAlert';
import MusicSearch from '../Music/MusicSearch';
import PostVisibilityModal from './PostVisibilityModal';

const DEFAULT_DURATION = 15;

/**
 * Create Story flow: gallery picker → full-screen editor (canvas + text/emoji/mention + story length).
 * Uses blur/glass modals for Add text, Add emoji, Mention. Shares with PostVisibilityModal then API.
 */
export default function StoryComposer({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const userInfo = getUserInfo();
  const { selectSound, selectedSound: contextSound } = useSound();
  const { stopAll: stopBackgroundAudio } = useAudioManager();
  const [createStory, { isLoading }] = useCreateStoryMutation();
  const { data: followingData } = useGetFollowingQuery({});
  const followingList = followingData?.data || [];

  const [step, setStep] = useState('gallery'); // 'gallery' | 'editor'
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [storyDuration, setStoryDuration] = useState(DEFAULT_DURATION);
  const [postVisibility, setPostVisibility] = useState('followers');
  const [selectedSound, setSelectedSound] = useState(null);
  const [videoVolume, setVideoVolume] = useState(1);
  const [musicVolume, setMusicVolume] = useState(1);

  const { isOpen: isVisibilityOpen, onOpen: onVisibilityOpen, onClose: onVisibilityClose } = useDisclosure();
  const { isOpen: isTextOpen, onOpen: onTextOpen, onClose: onTextClose } = useDisclosure();
  const { isOpen: isEmojiOpen, onOpen: onEmojiOpen, onClose: onEmojiClose } = useDisclosure();
  const { isOpen: isMentionOpen, onOpen: onMentionOpen, onClose: onMentionClose } = useDisclosure();
  const { isOpen: isMusicOpen, onOpen: onMusicOpen, onClose: onMusicClose } = useDisclosure();

  const [textInput, setTextInput] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const containerRef = useRef(null);
  const composerMusicIframeRef = useRef(null);

  const { layers, addLayer, removeLayer, moveLayer, clearLayers, updateLayer } = useStoryLayers({ defaultFontSize: 24 });
  const [selectedLayerId, setSelectedLayerId] = useState(null);

  const handleGallerySelect = useCallback((file, url) => {
    if (!file) return;
    const resolvedUrl = url || (typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(file) : null);
    setMediaFile(file);
    setMediaUrl(resolvedUrl);
    setMediaType(file.type?.startsWith('video/') ? 'video' : 'image');
    setStep('editor');
  }, []);

  const handleBackFromEditor = useCallback(() => {
    setStep('gallery');
    setMediaFile(null);
    setMediaUrl(null);
    clearLayers();
    setSelectedSound(null);
    setVideoVolume(1);
    setMusicVolume(1);
  }, [clearLayers]);

  const handleAddText = useCallback(() => {
    onTextOpen();
  }, [onTextOpen]);

  const onAddTextSubmit = useCallback(() => {
    if (!textInput.trim()) return;
    addLayer({ type: 'text', content: textInput.trim() });
    setTextInput('');
    onTextClose();
  }, [textInput, addLayer, onTextClose]);

  const onEmojiClick = useCallback(
    (emojiData) => {
      addLayer({ type: 'emoji', content: emojiData.emoji, fontSize: 48 });
      onEmojiClose();
    },
    [addLayer, onEmojiClose]
  );

  const onMentionSelect = useCallback(
    (user) => {
      addLayer({ type: 'mention', content: user.username || user.name || '' });
      onMentionClose();
      setMentionSearch('');
    },
    [addLayer, onMentionClose]
  );

  const handleSelectSound = useCallback(
    (sound) => {
      setSelectedSound(sound);
      selectSound(sound);
      onMusicClose();
      setVideoVolume(0);
    },
    [selectSound, onMusicClose]
  );

  const hasYouTubeMusic =
    step === 'editor' &&
    selectedSound &&
    (selectedSound.source === 'youtube' || selectedSound.preview_url || selectedSound.video_id) &&
    (selectedSound.preview_url || selectedSound.video_id);

  const startComposerMusic = useCallback(() => {
    const win = composerMusicIframeRef.current?.contentWindow;
    if (!win || !selectedSound) return;
    const startTime = selectedSound.startTime || 0;
    win.postMessage(`{"event":"command","func":"seekTo","args":[${startTime},true]}`, '*');
    win.postMessage('{"event":"command","func":"playVideo","args":[]}', '*');
    setTimeout(() => {
      if (!composerMusicIframeRef.current?.contentWindow) return;
      composerMusicIframeRef.current.contentWindow.postMessage('{"event":"command","func":"unMute","args":[]}', '*');
      setTimeout(() => {
        if (composerMusicIframeRef.current?.contentWindow) {
          const vol = Math.max(0, Math.min(100, Math.round(musicVolume * 100)));
          composerMusicIframeRef.current.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":[${vol}]}`, '*');
        }
      }, 150);
    }, 600);
  }, [selectedSound, musicVolume]);

  // When Search Music modal opens: mute all background (feed + story preview video + composer YouTube). When it closes: resume composer music if any.
  useEffect(() => {
    if (isMusicOpen) {
      stopBackgroundAudio();
      const win = composerMusicIframeRef.current?.contentWindow;
      if (win) {
        try {
          win.postMessage('{"event":"command","func":"pauseVideo","args":[]}', '*');
          win.postMessage('{"event":"command","func":"mute","args":[]}', '*');
        } catch (_) {}
      }
    } else {
      if (hasYouTubeMusic && composerMusicIframeRef.current?.contentWindow) {
        const t = setTimeout(() => startComposerMusic(), 300);
        return () => clearTimeout(t);
      }
    }
  }, [isMusicOpen, stopBackgroundAudio, hasYouTubeMusic, startComposerMusic]);

  useEffect(() => {
    if (!hasYouTubeMusic || !composerMusicIframeRef.current?.contentWindow) return;
    const vol = Math.max(0, Math.min(100, Math.round(musicVolume * 100)));
    composerMusicIframeRef.current.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":[${vol}]}`, '*');
  }, [musicVolume, hasYouTubeMusic]);

  const handlePublishStory = useCallback(
    (visibility) => {
      setPostVisibility(visibility);
      onVisibilityClose();
      if (!mediaFile) return;
      const formData = new FormData();
      formData.append('file', mediaFile);
      formData.append('caption', '');
      formData.append('privacy', visibility);
      formData.append('duration', selectedSound ? 30 : storyDuration);
      if (selectedSound) formData.append('sound', JSON.stringify(selectedSound));
      formData.append('videoVolume', String(videoVolume));
      formData.append('musicVolume', String(musicVolume));
      createStory(formData)
        .unwrap()
        .then(() => {
          toast({ title: 'Story created!', status: 'success', duration: 3000, isClosable: true });
          handleClose();
          onSuccess?.();
        })
        .catch((err) => {
          toast({
            title: 'Failed to create story',
            description: err?.data?.message || 'Please try again',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        });
    },
    [mediaFile, selectedSound, storyDuration, videoVolume, musicVolume, createStory, toast, onSuccess, onVisibilityClose]
  );

  const handleClose = useCallback(() => {
    setStep('gallery');
    setMediaFile(null);
    setMediaUrl(null);
    clearLayers();
    setSelectedSound(null);
    setVideoVolume(1);
    setMusicVolume(1);
    setTextInput('');
    setMentionSearch('');
    onTextClose();
    onEmojiClose();
    onMentionClose();
    onMusicClose();
    onVisibilityClose();
    onClose();
  }, [clearLayers, onClose, onTextClose, onEmojiClose, onMentionClose, onMusicClose, onVisibilityClose]);

  const filteredFollowing = followingList.filter((user) => {
    if (!mentionSearch.trim()) return true;
    const q = mentionSearch.toLowerCase();
    return user.name?.toLowerCase().includes(q) || user.username?.toLowerCase().includes(q);
  });

  const showGallery = isOpen && step === 'gallery';
  const showEditor = isOpen && step === 'editor' && mediaUrl;

  return (
    <>
      {/* Gallery step: pick photo/video — blur over layout and sections */}
      <Modal isOpen={showGallery} onClose={handleClose} size="full" isCentered>
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(12px)" />
        <ModalContent
          maxW="500px"
          maxH="90vh"
          mx="auto"
          mt="5vh"
          bg="transparent"
          boxShadow="none"
          border="1px solid"
          borderColor="rgba(255,255,255,0.15)"
          borderRadius="2xl"
          overflow="hidden"
          sx={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          <ModalBody p={0} overflow="hidden">
            <Box
              h="full"
              overflow="hidden"
              bg="transparent"
              sx={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              <StoryGalleryPicker
                onSelect={handleGallerySelect}
                onClose={handleClose}
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Editor step: mobile-size frame on desktop/tablet, full screen on mobile */}
      <Modal isOpen={showEditor} onClose={handleBackFromEditor} size="full" isCentered>
        <ModalOverlay bg="black" />
        <ModalContent bg="black" maxW="100%" maxH="100%" borderRadius={0} margin={0}>
          <ModalBody
            p={0}
            overflow="hidden"
            position="relative"
            h="100vh"
            w="100vw"
            display={{ base: 'block', md: 'flex' }}
            alignItems={{ md: 'center' }}
            justifyContent={{ md: 'center' }}
          >
            {/* Mobile: full screen. Desktop/tablet: phone-frame (max 400px, 9:16) centered. */}
            <Box
              ref={containerRef}
              position={{ base: 'absolute', md: 'relative' }}
              top={{ base: 0, md: 'auto' }}
              left={{ base: 0, md: 'auto' }}
              right={{ base: 0, md: 'auto' }}
              bottom={{ base: 0, md: 'auto' }}
              w="100%"
              h={{ base: '100%', md: 'auto' }}
              maxW={{ base: 'none', md: '400px' }}
              maxH={{ base: 'none', md: 'min(90vh, 711px)' }}
              aspectRatio={{ base: 'auto', md: '9 / 16' }}
              flexShrink={0}
              overflow="hidden"
              bg="black"
              borderRadius={{ base: 0, md: '16px' }}
              boxShadow={{ base: 'none', md: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            >
              <Box position="absolute" top={0} left={0} right={0} bottom={0} w="100%" h="100%">
                <StoryCanvas
                  containerRef={containerRef}
                  imageUrl={mediaUrl}
                  mediaType={mediaType}
                  layers={layers}
                  onLayerMove={moveLayer}
                  onLayerRemove={removeLayer}
                  onLayerSelect={setSelectedLayerId}
                  selectedLayerId={selectedLayerId}
                  editable
                  videoVolume={videoVolume}
                  onVideoVolumeChange={setVideoVolume}
                  previewPaused={isMusicOpen}
                />
              </Box>
              {hasYouTubeMusic && (selectedSound.preview_url || selectedSound.video_id) && (
                <Box
                  position="absolute"
                  width="1px"
                  height="1px"
                  overflow="hidden"
                  opacity={0}
                  pointerEvents="none"
                  zIndex={-1}
                >
                  <Box
                    ref={composerMusicIframeRef}
                    as="iframe"
                    width="1"
                    height="1"
                    src={(() => {
                      const embedUrl = selectedSound.preview_url || `https://www.youtube.com/embed/${selectedSound.video_id}`;
                      return buildYouTubeEmbedUrl(embedUrl, { start: selectedSound.startTime || 0, end: selectedSound.endTime ?? undefined, mute: 1 });
                    })()}
                    allow="autoplay; encrypted-media"
                    referrerPolicy="strict-origin-when-cross-origin"
                    style={{ border: 'none' }}
                    key={selectedSound.video_id || selectedSound.preview_url || 'composer-music'}
                    onLoad={() => {
                      startComposerMusic();
                      setTimeout(() => startComposerMusic(), 500);
                    }}
                  />
                </Box>
              )}
              {(mediaType === 'video' || selectedSound) && (
                <Box
                  position="absolute"
                  bottom="72px"
                  left="50%"
                  transform="translateX(-50%)"
                  zIndex={25}
                  pointerEvents="auto"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={2}
                  bg="blackAlpha.600"
                  borderRadius="xl"
                  px={4}
                  py={3}
                >
                  {mediaType === 'video' && (
                    <HStack spacing={3} w="full" minW="180px">
                      <Text color="white" fontSize="xs" fontWeight="600" w="48px">Video</Text>
                      <Slider
                        aria-label="Video volume"
                        value={Math.round(videoVolume * 100)}
                        min={0}
                        max={100}
                        onChange={(v) => setVideoVolume(v / 100)}
                        size="sm"
                        flex={1}
                      >
                        <SliderTrack bg="whiteAlpha.300">
                          <SliderFilledTrack bg="white" />
                        </SliderTrack>
                        <SliderThumb boxSize={3} bg="white" />
                      </Slider>
                    </HStack>
                  )}
                  {selectedSound && (
                    <HStack spacing={3} w="full" minW="180px">
                      <Text color="white" fontSize="xs" fontWeight="600" w="48px">Music</Text>
                      <Slider
                        aria-label="Music volume"
                        value={Math.round(musicVolume * 100)}
                        min={0}
                        max={100}
                        onChange={(v) => setMusicVolume(v / 100)}
                        size="sm"
                        flex={1}
                      >
                        <SliderTrack bg="whiteAlpha.300">
                          <SliderFilledTrack bg="white" />
                        </SliderTrack>
                        <SliderThumb boxSize={3} bg="white" />
                      </Slider>
                    </HStack>
                  )}
                </Box>
              )}
              <StoryToolbar
                onBack={handleBackFromEditor}
                userName={userInfo?.name}
                userAvatar={userInfo?.profileImage}
                onAddText={handleAddText}
                onAddEmoji={onEmojiOpen}
                onAddMention={onMentionOpen}
                onAddSong={onMusicOpen}
                showDurationSelector
                imageOnlyDuration={storyDuration}
                onDurationChange={setStoryDuration}
              />
              <Box position="absolute" bottom={6} left="50%" transform="translateX(-50%)" zIndex={30}>
                <Button
                  colorScheme="blue"
                  size="lg"
                  borderRadius="full"
                  px={8}
                  isLoading={isLoading}
                  onClick={onVisibilityOpen}
                >
                  Share story
                </Button>
              </Box>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Add text modal — blur over layout and section */}
      <Modal isOpen={isTextOpen} onClose={onTextClose} isCentered size="xs">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
        <ModalContent
          maxW="280px"
          bg="transparent"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.2)"
          borderRadius="xl"
          mx={4}
          sx={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          <ModalBody py={3} px={4}>
            <Box
              borderRadius="lg"
              p={3}
              bg="transparent"
              sx={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              <Text color="white" fontWeight="600" fontSize="md" mb={2}>Add text</Text>
              <Input
                placeholder="Type something..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAddTextSubmit()}
                size="sm"
                bg="transparent"
                borderColor="rgba(255,255,255,0.25)"
                color="white"
                _placeholder={{ color: 'whiteAlpha.500' }}
                mb={2}
              />
              <Button size="sm" w="full" colorScheme="blue" onClick={onAddTextSubmit}>Add</Button>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Add emoji modal — aligned on all screens: responsive width, centered, emoji grid correct */}
      <Modal isOpen={isEmojiOpen} onClose={onEmojiClose} isCentered size="xs">
        <ModalOverlay bg="blackAlpha.500" sx={{ backdropFilter: 'blur(2px)' }} />
        <ModalContent
          maxW={{ base: 'min(360px, 92vw)', sm: '360px' }}
          w="full"
          maxH={{ base: '88vh', sm: '85vh' }}
          minH={{ base: '380px', sm: '420px' }}
          bg="transparent"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.16)"
          borderRadius="3xl"
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.35)"
          mx={{ base: 3, sm: 4 }}
          overflow="hidden"
          display="flex"
          flexDirection="column"
          sx={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
        >
          {/* iOS-style grab handle */}
          <Box pt={3} pb={1} display="flex" justifyContent="center" flexShrink={0}>
            <Box w="9" h="1" borderRadius="full" bg="whiteAlpha.400" />
          </Box>
          <ModalCloseButton
            color="whiteAlpha.800"
            top={2}
            right={3}
            size="sm"
            borderRadius="full"
            _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
          />
          <ModalBody
            px={{ base: 3, sm: 4 }}
            pt={0}
            pb={{ base: 3, sm: 4 }}
            flex={1}
            minH={0}
            display="flex"
            flexDirection="column"
            alignItems="stretch"
            overflow="hidden"
          >
            <Box
              w="full"
              flex={1}
              minH={0}
              display="flex"
              flexDirection="column"
              borderRadius="2xl"
              overflow="hidden"
              bg="transparent"
              sx={{
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                '& .EmojiPickerReact': {
                  width: '100%', height: '100%', minHeight: '360px', maxHeight: '100%', display: 'flex', flexDirection: 'column', margin: '0 auto',
                  '--epr-dark-category-label-bg-color': 'transparent !important',
                  '--epr-category-label-bg-color': 'transparent !important',
                  '--epr-dark-bg-color': 'transparent !important',
                  '--epr-bg-color': 'transparent !important',
                },
                '& .epr-main': {
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'transparent',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: 'none',
                },
                '& .epr-header': {
                  backgroundColor: 'transparent',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  padding: '10px 0 14px',
                  paddingLeft: 0,
                  paddingRight: 0,
                  flexShrink: 0,
                },
                '& .epr-search-container input': {
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(100, 180, 255, 0.5)',
                  borderRadius: 'full',
                  padding: '10px 14px 10px 36px',
                  color: 'white',
                  fontSize: '15px',
                  _placeholder: { color: 'whiteAlpha.600' },
                  _focus: { borderColor: 'rgba(100, 180, 255, 0.8)', boxShadow: '0 0 0 1px rgba(100, 180, 255, 0.3)' },
                },
                '& .epr-body': {
                  flex: 1,
                  minHeight: 0,
                  backgroundColor: 'transparent',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  overflowY: 'scroll',
                  overflowX: 'hidden',
                  scrollBehavior: 'smooth',
                  WebkitOverflowScrolling: 'touch',
                  marginTop: '6px',
                  visibility: 'visible',
                  touchAction: 'pan-y',
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 255, 255, 0.2)', borderRadius: 'full' },
                },
                '& .epr-category-nav': {
                  backgroundColor: 'transparent',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  padding: '10px 0 4px',
                  borderTop: 'none',
                  flexShrink: 0,
                },
                '& .epr-preview': { display: 'none !important' },
                '& .epr-emoji-category-label': {
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: 'transparent !important',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                },
                '& .epr-emoji-list': { backgroundColor: 'transparent', paddingBottom: '12px', margin: 0, paddingLeft: 0, paddingRight: 0, visibility: 'visible', display: 'block' },
                '& .epr-emoji': { visibility: 'visible' },
                '& .epr-emoji-category-content': { backgroundColor: 'transparent', justifyItems: 'center' },
                '& .epr-emoji-category': { width: '100%', boxSizing: 'border-box' },
                '& button.epr-emoji:hover': { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '8px' },
                '& .epr-skin-tones': { display: 'none !important' },
                '& .epr-btn-clear-search': { backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)' },
                '& .epr-cat-btn': { filter: 'brightness(0) invert(1)', opacity: 0.9, borderRadius: '8px' },
                '& .epr-cat-btn.epr-active': { filter: 'brightness(0) saturate(100%) invert(55%) sepia(70%) saturate(800%) hue-rotate(190deg)', opacity: 1, boxShadow: '0 0 0 2px rgba(100, 180, 255, 0.6)' },
                '& .epr-cat-btn:focus': { outline: 'none' },
                '& .epr-cat-btn:focus::before': { display: 'none !important' },
              }}
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                width="100%"
                theme="dark"
                height={420}
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
              />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Mention modal — blur over layout and section */}
      <Modal isOpen={isMentionOpen} onClose={onMentionClose} isCentered size="xs">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(8px)" />
        <ModalContent
          maxW="280px"
          maxH="85vh"
          bg="transparent"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.2)"
          borderRadius="xl"
          mx={4}
          overflow="hidden"
          sx={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        >
          <ModalBody pb={3} pt={3} overflow="hidden" display="flex" flexDirection="column">
            <Box
              flex={1}
              minH={0}
              display="flex"
              flexDirection="column"
              borderRadius="lg"
              p={3}
              bg="transparent"
              sx={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              <Text color="white" fontWeight="600" fontSize="md" mb={2}>Mention someone</Text>
              <InputGroup size="sm" mb={2}>
                <InputLeftElement pointerEvents="none"><Text color="whiteAlpha.600">@</Text></InputLeftElement>
                <Input
                  placeholder="Search..."
                  value={mentionSearch}
                  onChange={(e) => setMentionSearch(e.target.value)}
                  bg="transparent"
                  borderColor="rgba(255,255,255,0.25)"
                  color="white"
                  _placeholder={{ color: 'whiteAlpha.500' }}
                />
              </InputGroup>
              <Box
                flex={1}
                minH={0}
                overflowY="auto"
                maxH="200px"
                borderRadius="md"
                bg="transparent"
                sx={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              >
                <VStack align="stretch" spacing={0}>
                  {filteredFollowing.slice(0, 20).map((user) => (
                    <HStack
                      key={user._id}
                      as="button"
                      w="100%"
                      p={2}
                      borderRadius="md"
                      onClick={() => onMentionSelect(user)}
                      color="white"
                      textAlign="left"
                      type="button"
                    >
                      <Avatar size="xs" name={user.name} src={user.profileImage} />
                      <Text fontSize="sm" fontWeight="500">{user.name || user.username}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>

      <MusicSearch isOpen={isMusicOpen} onClose={onMusicClose} onSelectSound={handleSelectSound} />
      <PostVisibilityModal
        isOpen={isVisibilityOpen}
        onClose={onVisibilityClose}
        currentValue={postVisibility}
        onSelect={handlePublishStory}
      />
    </>
  );
}
