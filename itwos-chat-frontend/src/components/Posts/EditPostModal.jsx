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
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { Music, X, Image as ImageIconLucide } from 'lucide-react';
import { useUpdatePostMutation } from '../../store/api/userApi';
import MusicSearch from '../Music/MusicSearch';
import ImageEditor from '../ImageEditor/ImageEditor';
import { useCreatePost } from '../../contexts/CreatePostContext';

const EditPostModal = ({ isOpen, onClose, onSuccess, post }) => {
  const { openEditPostModal, closeEditPostModal } = useCreatePost();
  
  // Sync close to context when modal closes
  useEffect(() => {
    if (!isOpen) {
      closeEditPostModal();
    }
  }, [isOpen, closeEditPostModal]);
  const toast = useToast();
  const [updatePost, { isLoading: isUpdating }] = useUpdatePostMutation();
  const fileInputRef = useRef(null);
  const videoThumbnailInputRef = useRef(null);

  // Form state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [postImageMetadata, setPostImageMetadata] = useState([]);
  const [currentEditingImage, setCurrentEditingImage] = useState(null);
  const [currentEditingIndex, setCurrentEditingIndex] = useState(-1);
  const [postSong, setPostSong] = useState(null);
  const [selectedSound, setSelectedSound] = useState(null);
  const [videoThumbnailFile, setVideoThumbnailFile] = useState(null);
  const [videoThumbnailPreviewUrl, setVideoThumbnailPreviewUrl] = useState(null);
  const [postLinks, setPostLinks] = useState([
    { name: '', url: '' },
    { name: '', url: '' },
    { name: '', url: '' },
  ]);
  
  // Modal states
  const { isOpen: isMusicSearchOpen, onOpen: onMusicSearchOpen, onClose: onMusicSearchClose } = useDisclosure();
  const { isOpen: isImageEditorOpen, onOpen: onImageEditorOpen, onClose: onImageEditorClose } = useDisclosure();

  // Initialize form with post data
  useEffect(() => {
    if (post && isOpen) {
      setPostTitle(post.title || '');
      setPostContent(post.content || '');
      setExistingImages(post.images || []);
      setPostImages([]);
      setPostImageMetadata([]);
      setVideoThumbnailFile(null);
      setVideoThumbnailPreviewUrl(null);
      if (post.sound) {
        setSelectedSound(post.sound);
        setPostSong(null);
      } else if (post.song) {
        setPostSong(null); // Will need to handle existing song
        setSelectedSound(null);
      } else {
        setPostSong(null);
        setSelectedSound(null);
      }
      const rawLinks = post.links && Array.isArray(post.links) ? post.links : [];
      setPostLinks([
        { name: rawLinks[0]?.name ?? '', url: rawLinks[0]?.url ?? '' },
        { name: rawLinks[1]?.name ?? '', url: rawLinks[1]?.url ?? '' },
        { name: rawLinks[2]?.name ?? '', url: rawLinks[2]?.url ?? '' },
      ]);
    }
  }, [post, isOpen]);

  const handleVideoThumbnailFile = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (videoThumbnailPreviewUrl) URL.revokeObjectURL(videoThumbnailPreviewUrl);
    setVideoThumbnailFile(file);
    setVideoThumbnailPreviewUrl(URL.createObjectURL(file));
    if (videoThumbnailInputRef.current) videoThumbnailInputRef.current.value = '';
  };
  
  const isVideoPost = !!post?.video;
  const isImagePost = !post?.video && (post?.images?.length > 0);

  const handleUpdatePost = async () => {
    if (!post?._id) return;
    const hasTitle = postTitle.trim();
    if (!hasTitle) {
      toast({
        title: 'Error',
        description: 'Please add a title to your post',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', postTitle.trim());
      // Preserve existing content (we don't allow editing it in limited-edit mode)
      formData.append('content', (post.content || '').trim());

      if (isImagePost) {
        // Image post: only title is editable. Send existing images so backend keeps them.
        if (existingImages.length > 0) {
          formData.append('existingImages', JSON.stringify(existingImages));
        }
      } else if (isVideoPost) {
        // Video post: only title + thumbnail editable.
        if (videoThumbnailFile) {
          formData.append('videoThumbnail', videoThumbnailFile);
        }
        // Do not send existingImages so backend does not change post.images
      }

      const linksToSend = postLinks
        .map((l) => ({ name: (l.name || '').trim(), url: (l.url || '').trim() }))
        .filter((l) => l.name || l.url);
      if (linksToSend.length > 0) {
        formData.append('links', JSON.stringify(linksToSend.slice(0, 3)));
      }

      await updatePost({ postId: post._id, data: formData }).unwrap();
      toast({
        title: 'Success',
        description: 'Post updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Reset form
      setPostTitle('');
      setPostContent('');
      setPostImages([]);
      setExistingImages([]);
      setPostImageMetadata([]);
      setPostSong(null);
      setSelectedSound(null);
      setVideoThumbnailFile(null);
      if (videoThumbnailPreviewUrl) URL.revokeObjectURL(videoThumbnailPreviewUrl);
      setVideoThumbnailPreviewUrl(null);
      setPostLinks([{ name: '', url: '' }, { name: '', url: '' }, { name: '', url: '' }]);
      
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error?.data?.message || 'Failed to update post',
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

  const handleClose = () => {
    setPostContent('');
    setPostImages([]);
    setExistingImages([]);
    setPostImageMetadata([]);
    setPostSong(null);
    setSelectedSound(null);
    setCurrentEditingImage(null);
    setCurrentEditingIndex(-1);
    setPostLinks([{ name: '', url: '' }, { name: '', url: '' }, { name: '', url: '' }]);
    onClose();
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + postImages.length;
    if (totalImages + files.length > 5) {
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
      const availableSlots = 5 - (existingImages.length + currentImages.length);
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

  const removeExistingImage = (index) => {
    const newImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(newImages);
  };

  const allImages = [...existingImages, ...postImages];

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose} 
        size={{ base: "full", md: "md" }}
        isCentered
        motionPreset="none"
        closeOnOverlayClick={true}
      >
        <ModalOverlay 
          bg="blackAlpha.600"
          sx={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
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
            py={{ base: 2.5, md: 3 }}
            px={{ base: 3, md: 4 }}
            fontSize={{ base: "15px", md: "17px" }}
            fontWeight="600"
            color="white"
            borderBottom="1px solid"
            borderColor="whiteAlpha.100"
            bg="transparent"
          >
            Edit Post
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
            <VStack spacing={{ base: 1.5, md: 3 }} align="stretch">
              {/* Title – editable for both image and video posts */}
              <FormControl>
                <Input
                  placeholder="Title"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  fontSize={{ base: "14px", md: "15px" }}
                  fontFamily="Raleway, sans-serif"
                  fontWeight="bold"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  borderRadius={{ base: "8px", md: "12px" }}
                  bg="transparent"
                  color="white"
                  _placeholder={{ color: 'whiteAlpha.500' }}
                  _focus={{
                    borderColor: 'whiteAlpha.300',
                    boxShadow: 'none',
                  }}
                  p={{ base: 2, md: 3 }}
                />
              </FormControl>

              {/* Links (up to 3 per post) */}
              <FormControl>
                <Text as="label" fontSize="xs" fontWeight="bold" color="whiteAlpha.700" display="block" mb={2}>Links (optional, up to 3)</Text>
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

              {/* Video post only: thumbnail edit */}
              {isVideoPost && (
                <Box>
                  <Text fontSize="xs" color="whiteAlpha.800" mb={2}>Thumbnail</Text>
                  <HStack spacing={2} align="flex-start" flexWrap="wrap">
                    <Box
                      w="120px"
                      flexShrink={0}
                      aspectRatio={(post.videoRatio || '4:5').replace(':', ' /')}
                      borderRadius="8px"
                      overflow="hidden"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      bg="black"
                    >
                      <Image
                        src={videoThumbnailPreviewUrl || post.videoThumbnail || post.images?.[0]}
                        alt="Thumbnail"
                        w="100%"
                        h="100%"
                        objectFit="cover"
                      />
                    </Box>
                    <VStack align="stretch" spacing={1}>
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
                        Change thumbnail
                      </Button>
                      {videoThumbnailPreviewUrl && (
                        <Text fontSize="xs" color="green.400">New thumbnail selected</Text>
                      )}
                    </VStack>
                  </HStack>
                </Box>
              )}

              {/* Image post: caption not editable; show hint */}
              {isImagePost && (
                <Text fontSize="xs" color="whiteAlpha.500">
                  Only the title can be edited for image posts.
                </Text>
              )}

              {/* Video post: only title + thumbnail editable */}
              {isVideoPost && !videoThumbnailPreviewUrl && !videoThumbnailFile && (
                <Text fontSize="xs" color="whiteAlpha.500">
                  You can edit the title and thumbnail only.
                </Text>
              )}

            </VStack>
          </ModalBody>
          
          <ModalFooter
            px={{ base: 3, md: 4 }}
            py={{ base: 2, md: 3 }}
            borderTop="1px solid"
            borderColor="whiteAlpha.100"
            bg="transparent"
          >
            <HStack spacing={{ base: 1, md: 2 }} w="full">
              <Button 
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
              >
                Cancel
              </Button>
              <Button
                size={{ base: "xs", md: "sm" }}
                onClick={handleUpdatePost}
                isLoading={isUpdating}
                loadingText="Updating..."
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
              >
                Update
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <MusicSearch
        isOpen={isMusicSearchOpen}
        onClose={onMusicSearchClose}
        onSelectSound={handleSelectSound}
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
    </>
  );
};

export default EditPostModal;
