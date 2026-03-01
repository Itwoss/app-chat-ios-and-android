import {
  Box,
  VStack,
  HStack,
  Button,
  Image,
  Input,
  Textarea,
  Select,
  useToast,
  Spinner,
  Center,
  IconButton,
  Text,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
  Badge,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  DrawerFooter,
  InputGroup,
  InputLeftElement,
  useDisclosure,
} from '@chakra-ui/react';
import { X, Upload, Music, ArrowLeft, Search, Users, Pencil, Eye, Link2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useCreateStoryMutation, useGetFollowingQuery } from '../../store/api/userApi';
import FileUpload from '../Admin/FileUpload';
import { getUserInfo } from '../../utils/auth';
import { useAudioManager } from '../../contexts/AudioManagerContext';
import MusicSearch from '../Music/MusicSearch';
import StoryImageEditor from './StoryImageEditor';
import StoryImageViewer from './StoryImageViewer';
import { useSound } from '../../contexts/SoundContext';

const previewLabelFontSize = { base: '11px', md: 'sm' };
const captionLabelSx = { fontSize: previewLabelFontSize, fontWeight: 'semibold', mb: 1, color: 'white' };
const captionTextSx = { fontSize: previewLabelFontSize, color: 'whiteAlpha.600' };
const border1px = '1px solid';
const modalFooterSx = { borderTop: border1px, borderColor: 'whiteAlpha.100', bg: 'transparent' };
const footerHStackProps = { spacing: { base: 1, md: 2 }, w: 'full' };

const StoryCreator = ({ isOpen, onClose, onSuccess }) => {
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const userInfo = getUserInfo();
  
  // Hooks must be called unconditionally at the top level
  const { selectSound, selectedSound: contextSound } = useSound();
  const { stopAll: stopBackgroundAudio } = useAudioManager();
  const [createStory, { isLoading }] = useCreateStoryMutation();
  const fileInputRef = useRef(null);
  const musicInputRef = useRef(null);

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [rawImageForEdit, setRawImageForEdit] = useState(null);
  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [musicFile, setMusicFile] = useState(null);
  const [musicPreview, setMusicPreview] = useState(null);
  const [musicStartTime, setMusicStartTime] = useState(0);
  const [musicEndTime, setMusicEndTime] = useState(null);
  const [selectedSound, setSelectedSound] = useState(null);
  const [isMusicSearchOpen, setIsMusicSearchOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCloseFriends, setSelectedCloseFriends] = useState([]);
  const [closeFriendsSearch, setCloseFriendsSearch] = useState('');
  const [imageOnlyDuration, setImageOnlyDuration] = useState(10); // 10 or 20 sec when no song
  const { isOpen: isCloseFriendsOpen, onOpen: onCloseFriendsOpen, onClose: onCloseFriendsClose } = useDisclosure();
  
  // Fetch following list for close friends selection
  const { data: followingData, isLoading: isLoadingFollowing } = useGetFollowingQuery({});
  const followingList = followingData?.data || [];
  
  // Sync with context sound
  useEffect(() => {
    if (contextSound) {
      setSelectedSound(contextSound);
    }
  }, [contextSound]);

  // Mute background feed/post song when music picker opens
  useEffect(() => {
    if (isMusicSearchOpen) {
      stopBackgroundAudio();
    }
  }, [isMusicSearchOpen, stopBackgroundAudio]);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    if (file.type.startsWith('image/')) {
      setMediaType('image');
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImageForEdit(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image or video file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleImageEditorDone = (blob) => {
    const file = new File([blob], 'story-image.jpg', { type: 'image/jpeg' });
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(blob));
    setRawImageForEdit(null);
  };

  const handleImageEditorCancel = () => {
    setRawImageForEdit(null);
  };

  const handleMusicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('audio/')) {
      setMusicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMusicPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please select an audio file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async () => {
    if (!mediaFile) {
      toast({
        title: 'Media required',
        description: 'Please select an image or video',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', mediaFile); // Backend uploadFields expects 'file' and 'musicFile'
      formData.append('caption', caption);
      formData.append('privacy', privacy);
      formData.append('location', location);
      const hasSong = !!(selectedSound || musicFile);
      formData.append('duration', hasSong ? 30 : imageOnlyDuration);

      // Add close friends if privacy is close_friends
      if (privacy === 'close_friends' && selectedCloseFriends.length > 0) {
        formData.append('closeFriends', JSON.stringify(selectedCloseFriends));
      }

      if (musicFile) {
        formData.append('musicFile', musicFile);
        formData.append('musicStartTime', musicStartTime);
        if (musicEndTime) {
          formData.append('musicEndTime', musicEndTime);
        }
      }
      
      // Add YouTube sound data if selected
      if (selectedSound) {
        formData.append('sound', JSON.stringify(selectedSound));
      }

      const result = await createStory(formData).unwrap();

      toast({
        title: 'Story created!',
        description: 'Your story has been posted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      handleClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: 'Failed to create story',
        description: error?.data?.message || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setRawImageForEdit(null);
    setCaption('');
    setPrivacy('public');
    setMusicFile(null);
    setMusicPreview(null);
    setMusicStartTime(0);
    setMusicEndTime(null);
    setSelectedSound(null);
    setImageOnlyDuration(10);
    setLocation('');
    setActiveTab(0);
    setSelectedCloseFriends([]);
    setCloseFriendsSearch('');
    onClose();
  };
  
  // Filter following list based on search
  const filteredFollowing = followingList.filter(user => {
    if (!closeFriendsSearch.trim()) return true;
    const searchLower = closeFriendsSearch.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });
  
  // Toggle close friend selection
  const toggleCloseFriend = (userId) => {
    setSelectedCloseFriends(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  
  const handleSelectSound = (sound) => {
    setSelectedSound(sound);
    selectSound(sound);
    setIsMusicSearchOpen(false);
  };

  const hasImageSelected = !!(mediaPreview || rawImageForEdit);

  return (
    <>
    <Modal 
      isOpen={isOpen && !isMusicSearchOpen} 
      onClose={handleClose} 
      size={{ base: hasImageSelected ? 'full' : 'md', md: 'md' }}
      isCentered={!hasImageSelected}
      motionPreset='scale'
      closeOnOverlayClick={true}
    >
      <ModalOverlay 
        bg='blackAlpha.600'
        sx={{
          animation: 'fadeIn 0.3s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 }
          }
        }}
      />
      <ModalContent
        mx={{ base: hasImageSelected ? 0 : 6, md: 4 }}
        my={{ base: hasImageSelected ? 0 : 6, md: 4 }}
        maxW={{ base: hasImageSelected ? '100%' : 'calc(100% - 48px)', md: '480px' }}
        w={{ base: hasImageSelected ? '100%' : undefined, md: undefined }}
        h={{ base: hasImageSelected ? '100vh' : 'auto', md: 'auto' }}
        maxH={{ base: hasImageSelected ? '100vh' : 'calc(100vh - 48px)', md: '90vh' }}
        borderRadius={{ base: hasImageSelected ? 0 : '20px', md: '24px' }}
        overflow='hidden'
        bg='transparent'
        border={border1px}
        borderColor='rgba(255, 255, 255, 0.2)'
        sx={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: 'none',
        }}
      >
        <ModalHeader
          py={{ base: hasImageSelected ? 2 : 2.5, md: 3 }}
          px={{ base: hasImageSelected ? 2 : 3, md: 4 }}
          fontSize={{ base: '15px', md: '17px' }}
          fontWeight='600'
          color='white'
          borderBottom={border1px}
          borderColor='whiteAlpha.100'
          bg='transparent'
        >
          <Text>Create New Story</Text>
        </ModalHeader>
        <ModalCloseButton 
          top={{ base: hasImageSelected ? 1.5 : 2, md: 3 }}
          right={{ base: hasImageSelected ? 2 : 2.5, md: 4 }}
          color='white'
          borderRadius='full'
          size='sm'
          _hover={{
            bg: 'whiteAlpha.200',
          }}
        />
        <ModalBody
          px={{ base: hasImageSelected ? 0 : 3, md: 4 }}
          py={{ base: hasImageSelected ? 1 : 2, md: 3 }}
          overflowY='auto'
          overflowX='hidden'
          maxH={{ base: hasImageSelected ? 'calc(100vh - 52px)' : 'calc(100vh - 120px)', md: 'calc(100vh - 120px)' }}
          minW={0}
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
          <Tabs index={activeTab} onChange={setActiveTab}>
            <TabList
              borderBottom={border1px}
              borderColor='whiteAlpha.100'
              mb={4}
            >
              <Tab 
                color='white'
                _selected={{ 
                  color: 'white',
                  borderColor: 'blue.500',
                  borderBottomWidth: '2px'
                }}
                fontSize={{ base: '13px', md: '14px' }}
              >
                Create
              </Tab>
              {mediaPreview && (
                <Tab 
                  color='white'
                  _selected={{ 
                    color: 'white',
                    borderColor: 'blue.500',
                    borderBottomWidth: '2px'
                  }}
                  fontSize={{ base: '13px', md: '14px' }}
                >
                  Live
                </Tab>
              )}
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                {/* Desktop/tablet: constrain to phone-frame width (400px) like mobile wallpaper */}
                <Box maxW={{ base: '100%', md: '400px' }} mx={{ base: 0, md: 'auto' }}>
                <VStack spacing={{ base: 1.5, md: 3 }} align='stretch'>
            {/* Image editor: zoom, pan, crop (images only) */}
            {rawImageForEdit && (
              <StoryImageEditor
                imageSrc={rawImageForEdit}
                onDone={handleImageEditorDone}
                onCancel={handleImageEditorCancel}
              />
            )}

            {/* Media Preview - Instagram-style StoryImageViewer (same layout as Live) */}
            {mediaPreview && !rawImageForEdit && (
              <Box
                position='relative'
                w='full'
                minH={{ base: 'min(56vh, 100dvh - 200px)', md: '320px' }}
                maxH={{ base: 'min(70vh, 100dvh - 160px)', md: 'min(65vh, 711px)' }}
                aspectRatio='9 / 16'
                mx='auto'
                overflow='hidden'
                bg='black'
                borderRadius={{ base: '0', md: '12px' }}
              >
                {mediaType === 'image' ? (
                  <StoryImageViewer
                    embedded
                    storyImage={mediaPreview}
                    userName={userInfo?.name || 'You'}
                    userAvatar={userInfo?.profileImage}
                    timestamp={location ? `📍 ${location}` : undefined}
                    musicTitle={selectedSound ? selectedSound.title : musicPreview ? 'Music' : undefined}
                    musicThumbnail={selectedSound?.thumbnail}
                    musicArtist={selectedSound?.artist}
                    caption={caption || undefined}
                    viewCount={0}
                    storyPath="— (after posting)"
                    privacy={privacy}
                    topRightContent={
                      <HStack spacing={1} flexShrink={0}>
                        <IconButton
                          icon={<Pencil size={14} />}
                          aria-label='Adjust image'
                          onClick={() => setRawImageForEdit(mediaPreview)}
                          bg='blackAlpha.600'
                          color='white'
                          borderRadius='full'
                          size='xs'
                          minW='28px'
                          h='28px'
                          _hover={{ bg: 'blackAlpha.700' }}
                        />
                        <IconButton
                          icon={<X size={14} />}
                          aria-label='Remove'
                          onClick={() => {
                            setMediaFile(null);
                            setMediaPreview(null);
                          }}
                          bg='blackAlpha.600'
                          color='white'
                          borderRadius='full'
                          size='xs'
                          minW='28px'
                          h='28px'
                          _hover={{ bg: 'blackAlpha.700' }}
                        />
                      </HStack>
                    }
                  />
                ) : (
                  <Box position='relative' w='100%' h='100%' bg='black' borderRadius={{ base: 0, md: '12px' }}>
                    <Box
                      as='video'
                      src={mediaPreview}
                      position='absolute'
                      top={0}
                      left={0}
                      w='100%'
                      h='100%'
                      objectFit='cover'
                      controls
                      playsInline
                    />
                  </Box>
                )}
              </Box>
            )}

            {/* Media Upload */}
            {!mediaPreview && !rawImageForEdit && (
              <FormControl>
                <Input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*,video/*'
                  onChange={handleMediaChange}
                  display='none'
                />
                <Button
                  leftIcon={<Upload size={16} />}
                  onClick={() => fileInputRef.current?.click()}
                  w='100%'
                  size={{ base: 'xs', md: 'sm' }}
                  variant='outline'
                  fontSize={{ base: '11px', md: '14px' }}
                  bg='transparent'
                  border={border1px}
                  borderColor='whiteAlpha.100'
                  color='white'
                  py={{ base: 3, md: 2 }}
                  _hover={{
                    bg: 'whiteAlpha.100',
                  }}
                >
                  Choose Media
                </Button>
              </FormControl>
            )}

            {/* Caption (hidden while cropping image) */}
            {!rawImageForEdit && (
            <FormControl>
              <Textarea
                placeholder='Write a caption...'
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
                rows={{ base: 3, md: 4 }}
                fontSize={{ base: '14px', md: '15px' }}
                border={border1px}
                borderColor='whiteAlpha.100'
                borderRadius={{ base: '8px', md: '12px' }}
                bg='transparent'
                color='white'
                _placeholder={{ color: 'whiteAlpha.500' }}
                _focus={{
                  borderColor: 'whiteAlpha.300',
                  boxShadow: 'none',
                }}
                p={{ base: 2, md: 3 }}
              />
              <Text fontSize={{ base: '10px', md: 'xs' }} color='whiteAlpha.500' textAlign='right' mt={0.5}>
                {caption.length}/2200
              </Text>
            </FormControl>
            )}

            {/* Privacy */}
            {!rawImageForEdit && (
            <FormControl>
              <Select 
                value={privacy} 
                onChange={(e) => {
                  const newPrivacy = e.target.value;
                  setPrivacy(newPrivacy);
                  if (newPrivacy === 'close_friends') {
                    onCloseFriendsOpen();
                  } else {
                    setSelectedCloseFriends([]);
                  }
                }}
                size={{ base: 'xs', md: 'sm' }}
                fontSize={{ base: '12px', md: '14px' }}
                border={border1px}
                borderColor='whiteAlpha.100'
                borderRadius={{ base: '8px', md: '12px' }}
                bg='transparent'
                color='white'
                _hover={{
                  borderColor: 'whiteAlpha.300',
                }}
                _focus={{
                  borderColor: 'whiteAlpha.300',
                  boxShadow: 'none',
                }}
                sx={{
                  '& option': {
                    bg: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                  }
                }}
              >
                <option value='public'>Public</option>
                <option value='followers'>Followers Only</option>
                <option value='close_friends'>Close Friends</option>
              </Select>
              {privacy === 'close_friends' && (
                <Button
                  leftIcon={<Users size={14} />}
                  onClick={onCloseFriendsOpen}
                  mt={2}
                  size='xs'
                  variant='outline'
                  fontSize='11px'
                  bg='transparent'
                  border={border1px}
                  borderColor='whiteAlpha.200'
                  color='white'
                  w='100%'
                  _hover={{
                    bg: 'whiteAlpha.100',
                  }}
                >
                  {selectedCloseFriends.length > 0 
                    ? `${selectedCloseFriends.length} Selected` 
                    : 'Select Close Friends'}
                </Button>
              )}
            </FormControl>
            )}

            {/* Story length (image-only): 10 or 20 sec — when no song */}
            {!rawImageForEdit && !selectedSound && !musicFile && (
            <FormControl>
              <FormLabel sx={captionLabelSx}>Story length</FormLabel>
              <Select
                value={imageOnlyDuration}
                onChange={(e) => setImageOnlyDuration(Number(e.target.value))}
                size={{ base: 'xs', md: 'sm' }}
                fontSize={{ base: '12px', md: '14px' }}
                border={border1px}
                borderColor='whiteAlpha.100'
                borderRadius={{ base: '8px', md: '12px' }}
                bg='transparent'
                color='white'
                sx={{ '& option': { bg: 'rgba(0, 0, 0, 0.9)', color: 'white' } }}
              >
                <option value={10}>10 seconds</option>
                <option value={20}>20 seconds</option>
              </Select>
              <Text sx={captionTextSx}>With a song, story will be 30 seconds</Text>
            </FormControl>
            )}

            {/* Music - YouTube Search or Upload */}
            {!rawImageForEdit && (
            <FormControl>
              <VStack spacing={{ base: 1, md: 2 }} align='stretch'>
                <HStack spacing={{ base: 1, md: 2 }} minW={0}>
                  <Button
                    leftIcon={<Music size={16} />}
                    onClick={() => setIsMusicSearchOpen(true)}
                    flex={1}
                    minW={0}
                    size={{ base: 'xs', md: 'sm' }}
                    variant='outline'
                    fontSize={{ base: '11px', md: '14px' }}
                    bg='transparent'
                    border={border1px}
                    borderColor='whiteAlpha.100'
                    color='white'
                    py={{ base: 3, md: 2 }}
                    _hover={{
                      bg: 'whiteAlpha.100',
                    }}
                    overflow='hidden'
                  >
                    <Text as='span' noOfLines={1} overflow='hidden' textOverflow='ellipsis' whiteSpace='nowrap' display='block'>
                      {selectedSound ? selectedSound.title : 'Music'}
                    </Text>
                  </Button>
                  {selectedSound && (
                    <IconButton
                      icon={<X size={14} />}
                      aria-label='Remove music'
                      onClick={() => {
                        setSelectedSound(null);
                        selectSound(null);
                      }}
                      size={{ base: 'xs', md: 'sm' }}
                      variant='ghost'
                      color='white'
                      borderRadius='full'
                      minW='24px'
                      h='24px'
                      _hover={{
                        bg: 'whiteAlpha.200',
                      }}
                    />
                  )}
                </HStack>
                
                {/* Upload Audio File Option */}
                <Box>
                  <Input
                    ref={musicInputRef}
                    type='file'
                    accept='audio/*'
                    onChange={handleMusicChange}
                    display='none'
                  />
                  <Input
                    type='file'
                    accept='audio/*'
                    fontSize={{ base: '11px', md: '13px' }}
                    py={{ base: 2.5, md: 2 }}
                    px={{ base: 2, md: 3 }}
                    border='1px dashed'
                    borderColor='whiteAlpha.100'
                    borderRadius={{ base: '6px', md: '10px' }}
                    bg='transparent'
                    color='white'
                    _hover={{
                      bg: 'whiteAlpha.50',
                    }}
                    onChange={handleMusicChange}
                  />
                  <Text fontSize={{ base: '10px', md: 'xs' }} color='whiteAlpha.500' mt={0.5} textAlign='center'>
                    Or upload audio file (Max 10MB)
                  </Text>
                </Box>
                
                {/* Show selected YouTube song info */}
                {(selectedSound || musicFile) && (
                  <Box 
                    p={{ base: 2, md: 3 }}
                    borderRadius={{ base: '6px', md: '10px' }}
                    border={border1px}
                    borderColor='whiteAlpha.100'
                    bg='whiteAlpha.50'
                    minW={0}
                    overflow='hidden'
                  >
                    <HStack spacing={2} minW={0}>
                      {selectedSound?.thumbnail ? (
                        <Image
                          src={selectedSound.thumbnail}
                          alt={selectedSound.title}
                          boxSize={{ base: '36px', md: '40px' }}
                          borderRadius='6px'
                          objectFit='cover'
                          flexShrink={0}
                        />
                      ) : (
                        <Box
                          p={1.5}
                          borderRadius='6px'
                          bg='whiteAlpha.100'
                          flexShrink={0}
                        >
                          <Music size={18} color='white' />
                        </Box>
                      )}
                      <Box flex={1} minW={0} overflow='hidden'>
                        <Text fontSize={{ base: '13px', md: 'sm' }} fontWeight='500' noOfLines={1} color='white' overflow='hidden' textOverflow='ellipsis'>
                          {selectedSound?.title || musicFile?.name}
                        </Text>
                        {selectedSound?.artist && (
                          <Text fontSize={{ base: '11px', md: 'xs' }} color='whiteAlpha.600' noOfLines={1} overflow='hidden' textOverflow='ellipsis'>
                            {selectedSound.artist}
                          </Text>
                        )}
                      </Box>
                      <IconButton
                        icon={<X size={14} />}
                        size='xs'
                        variant='ghost'
                        borderRadius='full'
                        color='white'
                        minW='24px'
                        h='24px'
                        _hover={{
                          bg: 'whiteAlpha.200',
                        }}
                        onClick={() => {
                          if (selectedSound) {
                            setSelectedSound(null);
                            selectSound(null);
                          }
                          if (musicFile) {
                            setMusicFile(null);
                            setMusicPreview(null);
                          }
                        }}
                        aria-label='Remove music'
                      />
                    </HStack>
                  </Box>
                )}
                
              </VStack>
            </FormControl>
            )}

            {/* Location */}
            {!rawImageForEdit && (
            <FormControl>
              <Input
                placeholder='Add location (Optional)'
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                size={{ base: 'xs', md: 'sm' }}
                fontSize={{ base: '12px', md: '14px' }}
                border={border1px}
                borderColor='whiteAlpha.100'
                borderRadius={{ base: '8px', md: '12px' }}
                bg='transparent'
                color='white'
                _placeholder={{ color: 'whiteAlpha.500' }}
                _focus={{
                  borderColor: 'whiteAlpha.300',
                  boxShadow: 'none',
                }}
                p={{ base: 2, md: 3 }}
              />
            </FormControl>
            )}
                </VStack>
                </Box>
              </TabPanel>
              
              {/* Live Tab: same phone-frame width on desktop/tablet */}
              {mediaPreview && (
                <TabPanel px={0} py={0} maxW='100%'>
                  <Box maxW={{ base: '100%', md: '400px' }} mx={{ base: 0, md: 'auto' }}>
                  <Box
                    position='relative'
                    w='full'
                    minH={{ base: 'min(78vh, 100dvh - 100px)', md: '320px' }}
                    maxH={{ base: 'min(88vh, 100dvh - 80px)', md: 'min(75vh, 711px)' }}
                    aspectRatio='9 / 16'
                    mx='auto'
                    overflow='hidden'
                  >
                    {mediaType === 'image' ? (
                      <StoryImageViewer
                        embedded
                        storyImage={mediaPreview}
                        userName={userInfo?.name || 'You'}
                        userAvatar={userInfo?.profileImage}
                        timestamp={location ? `📍 ${location}` : undefined}
                        musicTitle={selectedSound ? selectedSound.title : musicPreview ? 'Music' : undefined}
                        musicThumbnail={selectedSound?.thumbnail}
                        musicArtist={selectedSound?.artist}
                        caption={caption || undefined}
                        viewCount={0}
                        storyPath='— (after posting)'
                        privacy={privacy}
                      />
                    ) : (
                      <Box position='relative' w='100%' h='100%' bg='black' borderRadius={{ base: 0, md: '16px' }}>
                        <Box
                          as='video'
                          src={mediaPreview}
                          position='absolute'
                          top={0}
                          left={0}
                          w='100%'
                          h='100%'
                          objectFit='cover'
                          controls
                          playsInline
                        />
                      </Box>
                    )}
                  </Box>
                  <Text color='whiteAlpha.600' fontSize='xs' mt={2} textAlign='center'>
                    Changes in Create update here instantly
                  </Text>
                  </Box>
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter
          px={{ base: 3, md: 4 }}
          py={{ base: 2, md: 3 }}
          borderTop={modalFooterSx.borderTop}
          borderColor={modalFooterSx.borderColor}
          bg={modalFooterSx.bg}
        >
          <HStack {...footerHStackProps}>
            {activeTab === 1 ? (
              <Button
                leftIcon={<ArrowLeft size={16} />}
                onClick={() => setActiveTab(0)}
                flex={1}
                size={{ base: 'xs', md: 'sm' }}
                variant='ghost'
                color='white'
                fontSize={{ base: '12px', md: '14px' }}
                py={{ base: 2.5, md: 2 }}
                _hover={{
                  bg: 'whiteAlpha.200',
                }}
              >
                Back to Edit
              </Button>
            ) : (
              <Button 
                size={{ base: 'xs', md: 'sm' }}
                onClick={handleClose}
                flex={1}
                variant='ghost'
                color='white'
                fontSize={{ base: '12px', md: '14px' }}
                py={{ base: 2.5, md: 2 }}
                _hover={{
                  bg: 'whiteAlpha.200',
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              size={{ base: 'xs', md: 'sm' }}
              onClick={handleSubmit}
              isLoading={isLoading || isUploading}
              loadingText='Posting...'
              isDisabled={!mediaFile}
              flex={1}
              bg='blue.500'
              color='white'
              fontWeight='600'
              fontSize={{ base: '12px', md: '14px' }}
              py={{ base: 2.5, md: 2 }}
              _hover={{
                bg: 'blue.600',
              }}
              _active={{
                transform: 'scale(0.98)',
              }}
            >
              Post Story
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
    
    {/* Music Search Modal */}
    <MusicSearch
      isOpen={isMusicSearchOpen}
      onClose={() => setIsMusicSearchOpen(false)}
      onSelectSound={handleSelectSound}
    />
    
    {/* Close Friends Selection Drawer */}
    <Drawer
      isOpen={isCloseFriendsOpen}
      placement='bottom'
      onClose={onCloseFriendsClose}
      size='md'
    >
      <DrawerOverlay bg='blackAlpha.600' />
      <DrawerContent
        maxH='80vh'
        bg='transparent'
        borderTopRadius='24px'
        border={border1px}
        borderColor='rgba(255, 255, 255, 0.2)'
        sx={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <DrawerHeader
          color='white'
          borderBottom={border1px}
          borderColor='whiteAlpha.100'
          bg='transparent'
        >
          <HStack spacing={2}>
            <Users size={20} />
            <Text>Select Close Friends</Text>
          </HStack>
        </DrawerHeader>
        <DrawerCloseButton color='white' />
        <DrawerBody px={4} py={4} overflowY='auto'>
          <VStack spacing={4} align='stretch'>
            {/* Search Input */}
            <InputGroup>
              <InputLeftElement pointerEvents='none'>
                <Search size={16} color='white' />
              </InputLeftElement>
              <Input
                placeholder='Search friends...'
                value={closeFriendsSearch}
                onChange={(e) => setCloseFriendsSearch(e.target.value)}
                bg='rgba(0, 0, 0, 0.3)'
                border={border1px}
                borderColor='whiteAlpha.200'
                color='white'
                _placeholder={{ color: 'whiteAlpha.500' }}
                _focus={{
                  borderColor: 'whiteAlpha.400',
                  boxShadow: 'none',
                }}
              />
            </InputGroup>
            
            {/* Friends List */}
            {isLoadingFollowing ? (
              <Center py={8}>
                <Spinner color='white' />
              </Center>
            ) : filteredFollowing.length === 0 ? (
              <Center py={8}>
                <Text color='whiteAlpha.600'>
                  {closeFriendsSearch ? 'No friends found' : 'No following found'}
                </Text>
              </Center>
            ) : (
              <VStack spacing={2} align='stretch' maxH='400px' overflowY='auto'>
                {filteredFollowing.map((user) => {
                  const isSelected = selectedCloseFriends.includes(user._id);
                  return (
                    <HStack
                      key={user._id}
                      p={3}
                      borderRadius='lg'
                      bg={isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.2)'}
                      border={border1px}
                      borderColor={isSelected ? 'rgba(59, 130, 246, 0.5)' : 'whiteAlpha.100'}
                      cursor='pointer'
                      onClick={() => toggleCloseFriend(user._id)}
                      _hover={{
                        bg: isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      }}
                      transition='all 0.2s'
                    >
                      <Avatar
                        size='sm'
                        src={user.profileImage}
                        name={user.name}
                      />
                      <VStack align='start' spacing={0} flex={1}>
                        <Text color='white' fontSize='sm' fontWeight='500'>
                          {user.name}
                        </Text>
                        {user.email && (
                          <Text color='whiteAlpha.600' fontSize='xs'>
                            {user.email}
                          </Text>
                        )}
                      </VStack>
                      <Box
                        w='20px'
                        h='20px'
                        borderRadius='full'
                        border='2px solid'
                        borderColor={isSelected ? 'blue.400' : 'whiteAlpha.300'}
                        bg={isSelected ? 'blue.400' : 'transparent'}
                        display='flex'
                        alignItems='center'
                        justifyContent='center'
                      >
                        {isSelected && (
                          <Text color='white' fontSize='xs'>✓</Text>
                        )}
                      </Box>
                    </HStack>
                  );
                })}
              </VStack>
            )}
          </VStack>
        </DrawerBody>
        <DrawerFooter
          borderTop={border1px}
          borderColor='whiteAlpha.100'
          bg='transparent'
        >
          <HStack spacing={2} w='full'>
            <Button
              variant='ghost'
              color='white'
              onClick={onCloseFriendsClose}
              flex={1}
            >
              Done
            </Button>
          </HStack>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
    </>
  );
};

export default StoryCreator;

