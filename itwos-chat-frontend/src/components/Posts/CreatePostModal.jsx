import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  HStack,
  Text,
  SimpleGrid,
  Box,
  Image,
  IconButton,
  useToast,
  useDisclosure,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
  useColorModeValue,
  Code,
  Textarea as ChakraTextarea,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';
import { useState, useRef, useMemo, useEffect } from 'react';
import { Music, X, Image as ImageIconLucide, Video, Heart, MessageCircle, Send, Settings } from 'lucide-react';
import { useCreatePostMutation } from '../../store/api/userApi';
import MusicSearch from '../Music/MusicSearch';
import ImageEditor from '../ImageEditor/ImageEditor';
import VideoEditor from '../VideoEditor/VideoEditor';
import { useCreatePost } from '../../contexts/CreatePostContext';
import UserAvatarWithBanner from '../User/UserAvatarWithBanner';
import { getUserInfo } from '../../utils/auth';
import { useVideoThumbnail, RATIO_VALUES } from '../../hooks/useVideoThumbnail';
import { RippleButton } from '../ui/RippleButton';

const CreatePostModal = ({ isOpen, onClose, onSuccess }) => {
  const { isEditPostOpen } = useCreatePost();
  const toast = useToast();
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const fileInputRef = useRef(null);
  
  // Form state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState([]);
  const [postImageMetadata, setPostImageMetadata] = useState([]);
  const [currentEditingImage, setCurrentEditingImage] = useState(null);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(-1);
  const [postSong, setPostSong] = useState(null);
  const [postVideo, setPostVideo] = useState(null);
  const [videoRatio, setVideoRatio] = useState('original');
  const [videoTrimStart, setVideoTrimStart] = useState(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState(null);
  const [videoOriginalAspect, setVideoOriginalAspect] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [selectedSound, setSelectedSound] = useState(null);
  const [videoVolume, setVideoVolume] = useState(1);
  const [musicVolume, setMusicVolume] = useState(1);
  const [postLinks, setPostLinks] = useState([
    { name: '', url: '' },
    { name: '', url: '' },
    { name: '', url: '' },
  ]);
  const videoInputRef = useRef(null);
  const videoThumbnailInputRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const {
    previewUrl: videoThumbnailPreviewUrl,
    thumbnailFile: videoThumbnailFile,
    setManualFile: setVideoThumbnailFile,
    generateFromFirstFrame: generateVideoThumbnailFromFirstFrame,
    clearThumbnail: clearVideoThumbnail,
    loading: videoThumbnailLoading,
    error: videoThumbnailError,
  } = useVideoThumbnail(postVideo, videoRatio);
  
  // Modal states
  const { isOpen: isMusicSearchOpen, onOpen: onMusicSearchOpen, onClose: onMusicSearchClose } = useDisclosure();
  const { isOpen: isImageEditorOpen, onOpen: onImageEditorOpen, onClose: onImageEditorClose } = useDisclosure();
  const { isOpen: isVideoEditorOpen, onOpen: onVideoEditorOpen, onClose: onVideoEditorClose } = useDisclosure();
  const { isOpen: isAdjustOpen, onOpen: onAdjustOpen, onClose: onAdjustClose } = useDisclosure();
  
  // Track if Create Post was open before Music Search opened
  const [wasCreatePostOpen, setWasCreatePostOpen] = useState(false);
  
  // Preview and adjust state
  const [customRadius, setCustomRadius] = useState('24px');
  const [cssCode, setCssCode] = useState('border-radius: 24px;');
  const [showPreview, setShowPreview] = useState(false);
  
  // Get current user info for preview
  const currentUser = getUserInfo();
  
  // Reset preview when images and video are removed
  useEffect(() => {
    if (postImages.length === 0 && !postVideo) {
      setShowPreview(false);
    }
  }, [postImages.length, postVideo]);

  // Stable video preview URL: create when postVideo is set, revoke when cleared (so video always shows and we don't leak)
  useEffect(() => {
    if (!postVideo) {
      setVideoPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setVideoOriginalAspect(null);
      return;
    }
    const url = URL.createObjectURL(postVideo);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [postVideo]);

  useEffect(() => {
    if (!videoPreviewRef.current) return;
    videoPreviewRef.current.volume = Math.max(0, Math.min(1, videoVolume));
  }, [videoVolume]);

  const handleCreatePost = async () => {
    if (!postTitle || !postTitle.trim()) {
      toast({
        title: 'Title required',
        description: 'Please add a title to your post',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!postContent.trim() && postImages.length === 0 && !postSong && !selectedSound && !postVideo) {
      toast({
        title: 'Error',
        description: 'Please add some content, images, a video, or a song to your post',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', postTitle.trim());
      formData.append('content', postContent ? postContent.trim() : '');
      const linksToSend = postLinks
        .map((l) => ({ name: (l.name || '').trim(), url: (l.url || '').trim() }))
        .filter((l) => l.name || l.url);
      formData.append('links', JSON.stringify(linksToSend.slice(0, 3)));
      postImages.forEach((file) => {
        formData.append('files', file);
      });
      if (postSong) {
        formData.append('files', postSong);
      }
      if (postVideo) {
        formData.append('files', postVideo);
        formData.append('videoRatio', videoRatio);
        if (videoThumbnailFile) {
          formData.append('videoThumbnail', videoThumbnailFile);
        }
        if (videoTrimStart > 0 || videoTrimEnd != null) {
          formData.append('videoTrimStart', String(videoTrimStart));
          formData.append('videoTrimEnd', String(videoTrimEnd ?? ''));
        }
        formData.append('videoVolume', String(videoVolume));
      }
      if (selectedSound) {
        formData.append('sound', JSON.stringify(selectedSound));
        formData.append('musicVolume', String(musicVolume));
      }
      if (postImageMetadata && postImageMetadata.length > 0) {
        formData.append('imageEditMetadata', JSON.stringify(postImageMetadata));
      }

      // Add custom border radius to metadata
      if (customRadius) {
        formData.append('borderRadius', customRadius);
      }

      await createPost(formData).unwrap();
      toast({
        title: 'Success',
        description: 'Post created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form
      setPostTitle('');
      setPostContent('');
      setPostImages([]);
      setPostImageMetadata([]);
      setPostSong(null);
      setPostVideo(null);
      setVideoRatio('original');
      setVideoTrimStart(0);
      setVideoTrimEnd(null);
      clearVideoThumbnail();
      setSelectedSound(null);
      setCustomRadius('24px');
      setCssCode('border-radius: 24px;');
      setShowPreview(false);
      setPostLinks([{ name: '', url: '' }, { name: '', url: '' }, { name: '', url: '' }]);
      
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to create post',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSelectSound = (soundData) => {
    setSelectedSound(soundData);
    onMusicSearchClose();
  };

  const handleMusicSearchOpen = () => {
    // Remember that Create Post was open
    if (isOpen) {
      setWasCreatePostOpen(true);
    }
    onMusicSearchOpen();
  };

  const handleMusicSearchClose = () => {
    onMusicSearchClose();
    // Reset the flag
    setWasCreatePostOpen(false);
  };

  const handleClose = () => {
    setPostContent('');
    setPostImages([]);
    setPostImageMetadata([]);
    setPostSong(null);
    setPostVideo(null);
    setVideoRatio('original');
    setVideoTrimStart(0);
    setVideoTrimEnd(null);
    clearVideoThumbnail();
    setSelectedSound(null);
    setCurrentEditingImage(null);
    setCurrentEditingIndex(-1);
    setPostLinks([{ name: '', url: '' }, { name: '', url: '' }, { name: '', url: '' }]);
    onClose();
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Error',
        description: 'Please select a video file (MP4, WebM, etc.)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const maxVideoSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxVideoSize) {
      toast({
        title: 'Error',
        description: 'Video must be less than 50MB',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    setPostVideo(file);
    setVideoRatio('original');
    setVideoTrimStart(0);
    setVideoTrimEnd(null);
    clearVideoThumbnail();
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleVideoThumbnailFile = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setVideoThumbnailFile(file);
    }
    if (videoThumbnailInputRef.current) videoThumbnailInputRef.current.value = '';
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 5) {
      toast({
        title: 'Error',
        description: 'Maximum 5 images allowed',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const validFiles = [];
    files.forEach((file) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Error',
          description: `${file.name} is not a supported format`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: `${file.name} exceeds 10MB limit`,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      validFiles.push(file);
    });
    
    if (validFiles.length > 0) {
      const currentImages = [...postImages];
      const availableSlots = 5 - currentImages.length;
      const imagesToAdd = validFiles.slice(0, availableSlots);
      
      if (imagesToAdd.length > 0) {
        const newImages = [...currentImages, ...imagesToAdd];
        setPostImages(newImages);
        setPostImageMetadata([...postImageMetadata, ...new Array(imagesToAdd.length).fill(null)]);
        
        setCurrentEditingImage(imagesToAdd[0]);
        setCurrentEditingIndex(currentImages.length);
        onImageEditorOpen();
      }
      
      if (validFiles.length > availableSlots) {
        toast({
          title: 'Limit Reached',
          description: `Only ${availableSlots} images added (max 5 total)`,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <>
      <Modal 
        isOpen={isOpen && !isMusicSearchOpen && !isEditPostOpen && !isImageEditorOpen && !isVideoEditorOpen} 
        onClose={handleClose} 
        size={{ base: "md", md: "md" }}
        isCentered
        motionPreset="none"
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
           maxW={{ base: "calc(100% - 48px)", md: "480px" }}
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
             animation: 'modalContentIn 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
           }}
         >
          <ModalHeader
            // Reduced padding for mobile
            py={{ base: 2.5, md: 3 }}
            px={{ base: 3, md: 4 }}
            fontSize={{ base: "15px", md: "17px" }}
            fontWeight="600"
            color="white"
            borderBottom="1px solid"
            borderColor="whiteAlpha.100"
            bg="transparent"
          >
            <Tabs index={showPreview ? 1 : 0} onChange={(index) => setShowPreview(index === 1)} w="100%" colorScheme="blue">
              <TabList border="none" gap={2}>
                <Tab 
                  color="white" 
                  _selected={{ color: 'white', borderBottom: '2px solid', borderColor: 'blue.400' }}
                  fontSize={{ base: "13px", md: "15px" }}
                  px={3}
                  py={2}
                >
                  Create
                </Tab>
                {(postImages.length > 0 || postVideo) && (
                  <Tab 
                    color="white" 
                    _selected={{ color: 'white', borderBottom: '2px solid', borderColor: 'blue.400' }}
                    fontSize={{ base: "13px", md: "15px" }}
                    px={3}
                    py={2}
                  >
                    Preview
                  </Tab>
                )}
              </TabList>
            </Tabs>
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
            // Reduced max height for content area
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
            <Tabs index={showPreview ? 1 : 0} onChange={(index) => setShowPreview(index === 1)} w="100%">
              <TabPanels>
                {/* Create Tab */}
                <TabPanel px={0} py={0}>
                  <VStack spacing={{ base: 1.5, md: 3 }} align="stretch">
              {/* Post Title - Required */}
              <FormControl isRequired>
                <FormLabel fontSize="xs" fontWeight="bold" color="whiteAlpha.700">Title</FormLabel>
                <Input
                  placeholder="Add a title"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  fontSize={{ base: "12px", md: "13px" }}
                  fontWeight="bold"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  borderRadius={{ base: "8px", md: "12px" }}
                  bg="transparent"
                  color="white"
                  _placeholder={{ color: 'whiteAlpha.500', fontWeight: '300' }}
                  _focus={{
                    borderColor: 'whiteAlpha.300',
                    boxShadow: 'none',
                  }}
                  p={{ base: 2, md: 3 }}
                />
              </FormControl>
              {/* Text Area */}
              <FormControl>
                <Textarea
                  placeholder="What's on your mind?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={{ base: 3, md: 4 }}
                  resize="none"
                  fontSize={{ base: "12px", md: "13px" }}
                  fontWeight="300"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  borderRadius={{ base: "8px", md: "12px" }}
                  bg="transparent"
                  color="white"
                  _placeholder={{ color: 'whiteAlpha.500', fontWeight: '300' }}
                  _focus={{
                    borderColor: 'whiteAlpha.300',
                    boxShadow: 'none',
                  }}
                  p={{ base: 2, md: 3 }}
                />
              </FormControl>
              
              {/* Links (up to 3 per post) – Link name → Link URL */}
              <FormControl>
                <FormLabel fontSize="xs" fontWeight="bold" color="whiteAlpha.700">Links (optional, up to 3)</FormLabel>
                <VStack spacing={2} align="stretch">
                  {[0, 1, 2].map((i) => (
                    <HStack key={i} spacing={2} align="center">
                      <Input
                        placeholder="Link name"
                        value={postLinks[i]?.name ?? ''}
                        onChange={(e) => {
                          const next = [...postLinks];
                          next[i] = { ...(next[i] || { name: '', url: '' }), name: e.target.value };
                          setPostLinks(next);
                        }}
                        fontSize="xs"
                        fontFamily="Raleway, sans-serif"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        borderRadius="8px"
                        bg="transparent"
                        color="white"
                        _placeholder={{ color: 'whiteAlpha.500' }}
                        flex={1}
                        size="sm"
                      />
                      <Text color="whiteAlpha.600" flexShrink={0}>→</Text>
                      <Input
                        placeholder="https://..."
                        value={postLinks[i]?.url ?? ''}
                        onChange={(e) => {
                          const next = [...postLinks];
                          next[i] = { ...(next[i] || { name: '', url: '' }), url: e.target.value };
                          setPostLinks(next);
                        }}
                        fontSize="xs"
                        fontFamily="Raleway, sans-serif"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        borderRadius="8px"
                        bg="transparent"
                        color="white"
                        _placeholder={{ color: 'whiteAlpha.500' }}
                        flex={1}
                        size="sm"
                      />
                    </HStack>
                  ))}
                </VStack>
              </FormControl>
              
              {/* Image Previews */}
              {postImages.length > 0 && (
                <Box>
                  <SimpleGrid 
                    columns={postImages.length === 1 ? 1 : postImages.length <= 2 ? 2 : 3} 
                    spacing={1.5}
                  >
                    {postImages.map((file, index) => (
                      <Box
                        key={index}
                        position="relative"
                        borderRadius="8px"
                        overflow="hidden"
                        border="1px solid"
                        borderColor="whiteAlpha.100"
                        bg="whiteAlpha.50"
                        aspectRatio={postImages.length === 1 ? "16/9" : "1"}
                      >
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          w="full"
                          h="full"
                          objectFit="cover"
                          cursor="pointer"
                          onClick={() => {
                            setCurrentEditingImage(file);
                            setCurrentEditingIndex(index);
                            onImageEditorOpen();
                          }}
                        />
                        <IconButton
                          icon={<X size={14} />}
                          size="xs"
                          position="absolute"
                          top={1}
                          right={1}
                          bg="blackAlpha.600"
                          color="white"
                          borderRadius="full"
                          minW="22px"
                          h="22px"
                          _hover={{
                            bg: 'blackAlpha.700',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const newImages = postImages.filter((_, i) => i !== index);
                            const newMetadata = postImageMetadata.filter((_, i) => i !== index);
                            setPostImages(newImages);
                            setPostImageMetadata(newMetadata);
                          }}
                          aria-label="Remove image"
                        />
                      </Box>
                    ))}
                  </SimpleGrid>
                  <Text fontSize={{ base: "11px", md: "xs" }} color="whiteAlpha.600" mt={1}>
                    {postImages.length}/5 images • Click to edit
                  </Text>
                </Box>
              )}
              
              {/* Media Attachment Buttons - Made more compact */}
              <HStack spacing={{ base: 1, md: 2 }} mt={postImages.length > 0 ? 0 : -0.5}>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleImageUpload}
                  display="none"
                />
                <RippleButton
                  as={Button}
                  leftIcon={<ImageIconLucide size={16} />}
                  size={{ base: "xs", md: "sm" }}
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  flex={1}
                  fontSize={{ base: "11px", md: "14px" }}
                  bg="transparent"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  color="white"
                  py={{ base: 3, md: 2 }}
                  _hover={{
                    bg: 'whiteAlpha.100',
                  }}
                  rippleColor="rgba(255,255,255,0.3)"
                  duration="600ms"
                >
                  {postImages.length > 0 ? 'Add More' : 'Images'}
                </RippleButton>
                
                <Input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                  onChange={handleVideoUpload}
                  display="none"
                />
                <RippleButton
                  as={Button}
                  leftIcon={<Video size={16} />}
                  size={{ base: "xs", md: "sm" }}
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  flex={1}
                  fontSize={{ base: "11px", md: "14px" }}
                  bg="transparent"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  color="white"
                  py={{ base: 3, md: 2 }}
                  _hover={{
                    bg: 'whiteAlpha.100',
                  }}
                  rippleColor="rgba(255,255,255,0.3)"
                  duration="600ms"
                >
                  Video
                </RippleButton>
                {(postImages.length > 0 || postVideo) && (
                  <RippleButton
                    as={Button}
                    leftIcon={<Music size={16} />}
                    size={{ base: "xs", md: "sm" }}
                    variant="outline"
                    onClick={handleMusicSearchOpen}
                    flex={1}
                    fontSize={{ base: "11px", md: "14px" }}
                    bg="transparent"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    color="white"
                    py={{ base: 3, md: 2 }}
                    _hover={{
                      bg: 'whiteAlpha.100',
                    }}
                    rippleColor="rgba(255,255,255,0.3)"
                    duration="600ms"
                  >
                    Music
                  </RippleButton>
                )}
              </HStack>
              
              {/* Video preview + ratio & thumbnail */}
              {postVideo && (
                <VStack align="stretch" spacing={3}>
                  <Box
                    position="relative"
                    borderRadius="8px"
                    overflow="hidden"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    bg="black"
                    w="100%"
                    maxH="200px"
                    aspectRatio={videoRatio === 'original' && videoOriginalAspect ? videoOriginalAspect : (videoRatio.replace(':', ' /'))}
                  >
                    <video
                      ref={videoPreviewRef}
                      src={videoPreviewUrl ?? undefined}
                      controls
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      playsInline
                      onLoadedMetadata={(e) => {
                        const v = e.target;
                        if (v.videoWidth && v.videoHeight) setVideoOriginalAspect(`${v.videoWidth} / ${v.videoHeight}`);
                        v.volume = videoVolume;
                      }}
                    />
                    <RippleButton
                      as={Box}
                      role="button"
                      aria-label="Remove video"
                      size="xs"
                      position="absolute"
                      top={1}
                      right={1}
                      bg="blackAlpha.600"
                      color="white"
                      borderRadius="full"
                      minW="22px"
                      h="22px"
                      _hover={{ bg: 'blackAlpha.700' }}
                      onClick={(e) => { e.stopPropagation(); setPostVideo(null); }}
                      rippleColor="rgba(255,255,255,0.3)"
                      duration="600ms"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <X size={14} />
                    </RippleButton>
                    <Text fontSize="xs" color="whiteAlpha.600" position="absolute" bottom={1} left={2}>
                      {postVideo.name} ({(postVideo.size / 1024 / 1024).toFixed(2)} MB)
                    </Text>
                  </Box>
                  <Button
                    size="sm"
                    w="full"
                    bg="blue.500"
                    color="white"
                    _hover={{ bg: 'blue.600' }}
                    leftIcon={<Video size={14} />}
                    onClick={onVideoEditorOpen}
                  >
                    Edit video
                  </Button>
                  {/* Video ratio (quick set; full edit in Edit video) */}
                  <Box>
                    <Text fontSize="xs" color="whiteAlpha.800" mb={1}>Aspect ratio</Text>
                    <HStack spacing={2} flexWrap="wrap">
                      <Button
                        size="xs"
                        variant={videoRatio === 'original' ? 'solid' : 'outline'}
                        colorScheme={videoRatio === 'original' ? 'blue' : 'gray'}
                        onClick={() => { setVideoRatio('original'); clearVideoThumbnail(); }}
                      >
                        Original
                      </Button>
                      {Object.entries(RATIO_VALUES).map(([key]) => (
                        <Button
                          key={key}
                          size="xs"
                          variant={videoRatio === key ? 'solid' : 'outline'}
                          colorScheme={videoRatio === key ? 'blue' : 'gray'}
                          onClick={() => { setVideoRatio(key); clearVideoThumbnail(); }}
                        >
                          {key}
                        </Button>
                      ))}
                    </HStack>
                  </Box>
                  {/* Thumbnail: first frame or upload */}
                  <Box>
                    <Text fontSize="xs" color="whiteAlpha.800" mb={1}>Thumbnail</Text>
                    <HStack spacing={2} mb={2}>
                      <Button
                        size="xs"
                        variant="outline"
                        borderColor="whiteAlpha.300"
                        color="white"
                        isLoading={videoThumbnailLoading}
                        onClick={generateVideoThumbnailFromFirstFrame}
                      >
                        Use first frame
                      </Button>
                      <Input
                        ref={videoThumbnailInputRef}
                        type="file"
                        accept="image/*"
                        display="none"
                        onChange={handleVideoThumbnailFile}
                      />
                      <Button
                        size="xs"
                        variant="outline"
                        borderColor="whiteAlpha.300"
                        color="white"
                        onClick={() => videoThumbnailInputRef.current?.click()}
                      >
                        Upload thumbnail
                      </Button>
                    </HStack>
                    {videoThumbnailError && (
                      <Text fontSize="xs" color="red.400" mb={1}>{videoThumbnailError}</Text>
                    )}
                    {videoThumbnailPreviewUrl && (
                      <Box
                        w="100%"
                        maxW="160px"
                        aspectRatio={videoRatio === 'original' && videoOriginalAspect ? videoOriginalAspect : (videoRatio.replace(':', ' /'))}
                        borderRadius="8px"
                        overflow="hidden"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        bg="black"
                      >
                        <Image
                          src={videoThumbnailPreviewUrl}
                          alt="Thumbnail"
                          w="100%"
                          h="100%"
                          objectFit="cover"
                        />
                      </Box>
                    )}
                  </Box>
                </VStack>
              )}
              
              {/* Music path: only show when user has image(s) or video (after select/edit/save) */}
              {(postImages.length > 0 || postVideo) && (
                <>
              {/* File Upload Section - Reduced spacing */}
              <Box>
                <Input
                  type="file"
                  accept="audio/*"
                  fontSize={{ base: "11px", md: "13px" }}
                  py={{ base: 2.5, md: 2 }}
                  px={{ base: 2, md: 3 }}
                  border="1px dashed"
                  borderColor="whiteAlpha.100"
                  borderRadius={{ base: "6px", md: "10px" }}
                  bg="transparent"
                  color="white"
                  _hover={{
                    bg: 'whiteAlpha.50',
                  }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: 'Error',
                          description: 'Audio file must be less than 10MB',
                          status: 'error',
                          duration: 3000,
                          isClosable: true,
                        });
                        return;
                      }
                      setPostSong(file);
                      setSelectedSound(null);
                    }
                  }}
                />
                <Text fontSize={{ base: "10px", md: "xs" }} color="whiteAlpha.500" mt={0.5} textAlign="center">
                  Or upload audio file (Max 10MB)
                </Text>
              </Box>
              
              {/* Selected Music Preview - Reduced padding */}
              {(selectedSound || postSong) && (
                <Box 
                  p={{ base: 2, md: 3 }}
                  borderRadius={{ base: "6px", md: "10px" }}
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  bg="whiteAlpha.50"
                >
                  <Flex align="center" justify="space-between">
                    <HStack spacing={2}>
                      {selectedSound?.thumbnail ? (
                        <Image
                          src={selectedSound.thumbnail}
                          alt={selectedSound.title}
                          boxSize={{ base: "36px", md: "40px" }}
                          borderRadius="6px"
                          objectFit="cover"
                        />
                      ) : (
                        <Box
                          p={1.5}
                          borderRadius="6px"
                          bg="whiteAlpha.100"
                        >
                          <Music size={18} color="white" />
                        </Box>
                      )}
                      <Box>
                        <Text fontSize={{ base: "13px", md: "sm" }} fontWeight="500" noOfLines={1} color="white">
                          {selectedSound?.title || postSong?.name}
                        </Text>
                        {selectedSound?.artist && (
                          <Text fontSize={{ base: "11px", md: "xs" }} color="whiteAlpha.600" noOfLines={1}>
                            {selectedSound.artist}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                    <IconButton
                      icon={<X size={14} />}
                      size="xs"
                      variant="ghost"
                      borderRadius="full"
                      color="white"
                      minW="24px"
                      h="24px"
                      _hover={{
                        bg: 'whiteAlpha.200',
                      }}
                      onClick={() => {
                        setPostSong(null);
                        setSelectedSound(null);
                      }}
                      aria-label="Remove music"
                    />
                  </Flex>
                </Box>
              )}
              {/* Sound balance: when both video and music are present */}
              {postVideo && (selectedSound || postSong) && (
                <Box
                  p={3}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  bg="whiteAlpha.50"
                >
                  <Text fontSize="xs" fontWeight="600" color="white" mb={2}>Sound balance</Text>
                  <HStack spacing={2} mb={2}>
                    <Text fontSize="xs" color="whiteAlpha.800" w="50px">Video</Text>
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
                  <HStack spacing={2}>
                    <Text fontSize="xs" color="whiteAlpha.800" w="50px">Music</Text>
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
                </Box>
              )}
                </>
              )}
                  </VStack>
                </TabPanel>
                
                {/* Preview Tab */}
                {(postImages.length > 0 || postVideo) && (
                  <TabPanel px={0} py={0}>
                    <PostPreview 
                      postContent={postContent}
                      postTitle={postTitle}
                      postImages={postImages}
                      postVideo={postVideo}
                      videoPreviewUrl={videoPreviewUrl}
                      videoRatio={videoRatio}
                      videoOriginalAspect={videoOriginalAspect}
                      videoThumbnailPreviewUrl={videoThumbnailPreviewUrl}
                      videoTrimStart={videoTrimStart}
                      videoTrimEnd={videoTrimEnd}
                      selectedSound={selectedSound}
                      postSong={postSong}
                      customRadius={customRadius}
                      onAdjustClick={onAdjustOpen}
                    />
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>
          </ModalBody>
          
          <ModalFooter
            px={{ base: 3, md: 4 }}
            py={{ base: 2, md: 3 }}
            borderTop="1px solid"
            borderColor="whiteAlpha.100"
            bg="transparent"
          >
            <HStack spacing={{ base: 1, md: 2 }} w="full">
              <RippleButton
                as={Button}
                size={{ base: "xs", md: "sm" }}
                onClick={handleClose}
                flex={1}
                variant="ghost"
                color="white"
                fontSize={{ base: "12px", md: "14px" }}
                py={{ base: 2.5, md: 2 }}
                _hover={{
                  bg: 'whiteAlpha.200',
                }}
                rippleColor="rgba(255,255,255,0.3)"
                duration="600ms"
              >
                Cancel
              </RippleButton>
              <RippleButton
                as={Button}
                size={{ base: "xs", md: "sm" }}
                onClick={handleCreatePost}
                isLoading={isCreating}
                loadingText="Posting..."
                flex={1}
                bg="blue.500"
                color="white"
                fontWeight="600"
                fontSize={{ base: "12px", md: "14px" }}
                py={{ base: 2.5, md: 2 }}
                _hover={{
                  bg: 'blue.600',
                }}
                _active={{
                  transform: 'scale(0.98)',
                }}
                rippleColor="rgba(255,255,255,0.3)"
                duration="600ms"
              >
                Post
              </RippleButton>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <MusicSearch
        isOpen={isMusicSearchOpen}
        onClose={handleMusicSearchClose}
        onSelectSound={handleSelectSound}
        postImages={postImages}
      />

      <ImageEditor
        isOpen={isImageEditorOpen}
        onClose={onImageEditorClose}
        imageFile={currentEditingImage}
        onSave={(editedFile, editMetadata) => {
          const newImages = [...postImages];
          newImages[currentEditingIndex] = editedFile;
          
          const newMetadata = [...postImageMetadata];
          newMetadata[currentEditingIndex] = editMetadata;
          
          setPostImages(newImages);
          setPostImageMetadata(newMetadata);
          onImageEditorClose();
          
          // After saving, go back to Create Post page (not Preview)
          setShowPreview(false);
          
          if (currentEditingIndex < postImages.length - 1) {
            setCurrentEditingIndex(currentEditingIndex + 1);
            setCurrentEditingImage(newImages[currentEditingIndex + 1]);
            setTimeout(() => onImageEditorOpen(), 300);
          } else {
            setCurrentEditingImage(null);
            setCurrentEditingIndex(-1);
          }
        }}
        onCancel={() => {
          onImageEditorClose();
          setCurrentEditingImage(null);
          setCurrentEditingIndex(-1);
        }}
      />

      <VideoEditor
        isOpen={isVideoEditorOpen}
        onClose={onVideoEditorClose}
        videoFile={postVideo}
        initialRatio={videoRatio}
        initialTrim={{ trimStart: videoTrimStart, trimEnd: videoTrimEnd }}
        initialSelectedSound={selectedSound}
        onSave={(file, { ratio, thumbnailFile: thumbFile, trimStart: ts, trimEnd: te, selectedSound: sound }) => {
          setVideoRatio(ratio);
          if (thumbFile) setVideoThumbnailFile(thumbFile);
          setVideoTrimStart(ts ?? 0);
          setVideoTrimEnd(te ?? null);
          if (sound !== undefined) setSelectedSound(sound ?? null);
          onVideoEditorClose();
        }}
        onCancel={onVideoEditorClose}
      />

      {/* Adjust Modal */}
      <AdjustModal 
        isOpen={isAdjustOpen} 
        onClose={onAdjustClose} 
        cssCode={cssCode}
        setCssCode={setCssCode}
        customRadius={customRadius}
        setCustomRadius={setCustomRadius}
        toast={toast}
      />
    </>
  );
};

// Adjust Modal Component
const AdjustModal = ({ isOpen, onClose, cssCode, setCssCode, customRadius, setCustomRadius, toast }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered motionPreset="none">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent
        mx={{ base: 4, md: 4 }}
        borderRadius="24px"
        bg="transparent"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.2)"
        sx={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          animation: 'modalContentIn 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        }}
      >
        <ModalHeader color="white" borderBottom="1px solid" borderColor="whiteAlpha.100">
          Adjust Border Radius
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody py={4}>
            <VStack spacing={4} align="stretch">
              <Text color="whiteAlpha.700" fontSize="sm">
                Edit the CSS code to adjust the border radius. Only radius properties are allowed.
              </Text>
              
              <Box>
                <Text color="white" fontSize="sm" mb={2} fontWeight="500">
                  CSS Code:
                </Text>
                <ChakraTextarea
                  value={cssCode}
                  onChange={(e) => {
                    const newCode = e.target.value;
                    // Only allow radius-related properties
                    const allowedProps = ['border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius'];
                    const propRegex = /([a-zA-Z-]+)\s*:/g;
                    const matches = [...newCode.matchAll(propRegex)];
                    
                    let hasInvalidProps = false;
                    for (const match of matches) {
                      const prop = match[1].toLowerCase();
                      if (!allowedProps.includes(prop)) {
                        hasInvalidProps = true;
                        break;
                      }
                    }
                    
                    if (!hasInvalidProps) {
                      setCssCode(newCode);
                      // Extract radius value from border-radius
                      const radiusMatch = newCode.match(/border-radius\s*:\s*([^;]+)/i);
                      if (radiusMatch) {
                        setCustomRadius(radiusMatch[1].trim());
                      }
                    } else {
                      toast({
                        title: 'Invalid Property',
                        description: 'Only border-radius properties are allowed',
                        status: 'error',
                        duration: 2000,
                        isClosable: true,
                      });
                    }
                  }}
                  fontFamily="mono"
                  fontSize="sm"
                  bg="rgba(0, 0, 0, 0.3)"
                  color="white"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  borderRadius="8px"
                  minH="150px"
                  _focus={{
                    borderColor: 'blue.400',
                    boxShadow: '0 0 0 1px blue.400',
                  }}
                  placeholder="border-radius: 24px;"
                />
              </Box>
              
              <Box>
                <Text color="white" fontSize="sm" mb={2} fontWeight="500">
                  Preview:
                </Text>
                <Box
                  w="100px"
                  h="100px"
                  bg="blue.500"
                  borderRadius={customRadius}
                  style={{
                    borderRadius: customRadius,
                  }}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="whiteAlpha.100">
            <Button
              onClick={() => {
                setCssCode('border-radius: 24px;');
                setCustomRadius('24px');
              }}
              variant="ghost"
              color="white"
              mr={2}
            >
              Reset
            </Button>
            <Button onClick={onClose} bg="blue.500" color="white" _hover={{ bg: 'blue.600' }}>
              Apply
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
  );
};

// Post Preview Component
const PostPreview = ({ postContent, postTitle, postImages, postVideo, videoPreviewUrl, videoRatio = 'original', videoOriginalAspect, videoThumbnailPreviewUrl, videoTrimStart = 0, videoTrimEnd = null, selectedSound, postSong, customRadius, onAdjustClick }) => {
  const currentUser = getUserInfo();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const imageContainerRef = useRef(null);
  const previewVideoRef = useRef(null);
  const trimEnd = videoTrimEnd != null ? videoTrimEnd : null;

  // Apply trim to preview video: start at trimStart, stop at trimEnd
  useEffect(() => {
    const v = previewVideoRef.current;
    if (!v || !postVideo) return;
    if (trimEnd != null && (videoTrimStart > 0 || trimEnd < 1e9)) {
      v.currentTime = videoTrimStart;
    }
  }, [postVideo, videoPreviewUrl, videoTrimStart, trimEnd]);

  const textPrimaryColor = useColorModeValue('#262626', '#fafafa');
  const textSecondaryColor = useColorModeValue('#8e8e8e', '#a8a8a8');
  const actionButtonHoverBg = useColorModeValue('rgba(0,0,0,0.05)', 'rgba(255,255,255,0.1)');
  const actionButtonIconColor = useColorModeValue('#262626', '#fafafa');
  
  const postImage = useMemo(() => {
    return postImages.length > 0 ? URL.createObjectURL(postImages[currentImageIndex]) : null;
  }, [postImages, currentImageIndex]);
  
  const songTitle = selectedSound?.title || (postSong ? 'Audio' : null);
  
  const getRelativeTime = () => {
    return 'just now';
  };

  const mediaBoxProps = {
    borderRadius: 'xl',
    overflow: 'hidden',
    position: 'relative',
    bg: 'black',
    w: '100%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    style: { borderRadius: customRadius },
  };
  
  return (
    <Box w="100%" position="relative">
      {/* USER HEADER */}
      <Box
        mb={2}
        borderRadius="full"
        display="flex"
        alignItems="center"
        overflow="hidden"
        bg={useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.1)')}
        border="1px solid"
        borderColor={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
        sx={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <UserAvatarWithBanner
          userId={currentUser?.id}
          name={currentUser?.name || "You"}
          src={currentUser?.profileImage}
          subscription={currentUser?.subscription}
          fontSize="sm"
          fontWeight={600}
          avatarSize="md"
          px={3}
          py={2}
          bg="transparent"
          border="none"
        >
          <Text fontSize="2xs" color={textSecondaryColor} mt={0.5}>
            {getRelativeTime()}
          </Text>
        </UserAvatarWithBanner>
      </Box>

      {/* Post title in preview */}
      {postTitle && (
        <Text px={2} py={1} fontSize="sm" fontFamily="Raleway, sans-serif" fontWeight="bold" color={textPrimaryColor} noOfLines={1} mb={1}>
          {postTitle}
        </Text>
      )}

      {/* POST CARD - Video or Image */}
      {postVideo ? (
        <Box {...mediaBoxProps} aspectRatio={videoRatio === 'original' && videoOriginalAspect ? videoOriginalAspect : (videoRatio.replace(':', ' /'))}>
          {videoThumbnailPreviewUrl && (
            <Box position="absolute" inset={0} zIndex={0}>
              <Image src={videoThumbnailPreviewUrl} alt="" w="100%" h="100%" objectFit="cover" />
            </Box>
          )}
          <video
            ref={previewVideoRef}
            src={videoPreviewUrl || URL.createObjectURL(postVideo)}
            controls
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            muted
            playsInline
            onLoadedMetadata={(e) => {
              const v = e.target;
              if (trimEnd != null && (videoTrimStart > 0 || trimEnd < v.duration)) {
                v.currentTime = videoTrimStart;
              }
            }}
            onTimeUpdate={(e) => {
              const v = e.target;
              if (trimEnd != null && v.currentTime >= trimEnd) {
                v.pause();
                v.currentTime = trimEnd;
              }
            }}
          />
        </Box>
      ) : postImage ? (
        <Box {...mediaBoxProps} aspectRatio="4/5">
          <Image
            src={postImage}
            w="100%"
            h="100%"
            objectFit="cover"
            position="absolute"
            top={0}
            left={0}
            zIndex={0}
          />
          
          {/* Dot Indicators for multiple images */}
          {postImages.length > 1 && (
            <HStack
              position="absolute"
              bottom="8px"
              left="50%"
              transform="translateX(-50%)"
              zIndex={9}
              spacing={1}
              bg="rgba(0, 0, 0, 0.3)"
              px={2}
              py={1}
              borderRadius="full"
            >
              {postImages.map((_, index) => (
                <Box
                  key={index}
                  w={currentImageIndex === index ? '6px' : '4px'}
                  h={currentImageIndex === index ? '6px' : '4px'}
                  borderRadius="full"
                  bg={currentImageIndex === index ? 'white' : 'rgba(255, 255, 255, 0.5)'}
                  cursor="pointer"
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </HStack>
          )}
          
          {/* Song Badge */}
          {songTitle && (
            <Box
              position="absolute"
              top={4}
              left={4}
              zIndex={2}
              px={3}
              py={1.5}
              borderRadius="full"
              bg="white"
              boxShadow="0 2px 8px rgba(0,0,0,0.2)"
              display="flex"
              alignItems="center"
              gap={1.5}
            >
              <Music size={14} color="#000" />
              <Text fontSize="xs" fontWeight="600" color="black">
                {songTitle}
              </Text>
            </Box>
          )}
        </Box>
      ) : (
        <Box
          borderRadius="xl"
          p={8}
          bg={useColorModeValue('gray.100', 'gray.800')}
          border="2px dashed"
          borderColor={useColorModeValue('gray.300', 'gray.600')}
          textAlign="center"
          style={{
            borderRadius: customRadius,
          }}
        >
          <Text color={textSecondaryColor}>No image preview</Text>
        </Box>
      )}

      {/* Post Content */}
      {postContent && (
        <Box mt={3} px={2}>
          <Text color={textPrimaryColor} fontSize="sm">
            {postContent}
          </Text>
        </Box>
      )}

      {/* Action Buttons */}
      <Box
        px={2}
        py={1.5}
        mt={2}
        borderRadius="full"
        bg="transparent"
        border="1px solid"
        borderColor={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
        display="flex"
        alignItems="center"
        justifyContent="space-around"
        w="100%"
      >
        <HStack spacing={1} px={2} py={1} borderRadius="full" flex={1} justify="center">
          <Heart size={16} fill="#ed4956" color="#ed4956" />
          <Text fontSize="xs" fontWeight="500" color={actionButtonIconColor}>
            1M
          </Text>
        </HStack>

        <HStack spacing={1} px={2} py={1} borderRadius="full" flex={1} justify="center">
          <MessageCircle size={16} color={actionButtonIconColor} />
          <Text fontSize="xs" fontWeight="500" color={actionButtonIconColor}>
            0
          </Text>
        </HStack>
      </Box>

      {/* Adjust Button */}
      <RippleButton
        as={Button}
        leftIcon={<Settings size={16} />}
        onClick={onAdjustClick}
        mt={3}
        w="100%"
        size="sm"
        variant="outline"
        borderColor="whiteAlpha.200"
        color="white"
        _hover={{ bg: 'whiteAlpha.100' }}
        rippleColor="rgba(255,255,255,0.2)"
        duration="600ms"
      >
        Adjust Border Radius
      </RippleButton>
    </Box>
  );
};

export default CreatePostModal;