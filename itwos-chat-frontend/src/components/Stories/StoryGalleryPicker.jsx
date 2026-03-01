import React, { useRef, useState, useCallback } from 'react';
import {
  Box,
  SimpleGrid,
  Text,
  IconButton,
  Center,
  useBreakpointValue,
} from '@chakra-ui/react';
import { Camera, ImagePlus, X } from 'lucide-react';

const GRID_COLS = 3;
const GAP = 2;
const ASPECT_RATIO = 1;

/**
 * Instagram-style gallery picker for Create Story.
 * - 3-column grid, latest first (newest at top-left after Camera).
 * - First tile: Camera.
 * - Support photos and videos; smooth scrolling.
 * - On desktop, camera tile triggers file input (no getUserMedia required for picker).
 */
export default function StoryGalleryPicker({
  onSelect,
  onClose,
}) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleGalleryClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleGalleryChange = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    const valid = files.filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    const withUrls = valid.map((f) => ({ file: f, url: URL.createObjectURL(f) }));
    setSelectedFiles((prev) => {
      const combined = [...withUrls, ...prev];
      combined.sort((a, b) => (b.file.lastModified || 0) - (a.file.lastModified || 0));
      return combined.slice(0, 50);
    });
  }, []);

  const handleCameraClick = useCallback(() => {
    cameraInputRef.current?.click();
  }, []);

  const handleCameraInputChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        onSelect?.(file, URL.createObjectURL(file));
      }
    },
    [onSelect]
  );

  const handleFileSelect = useCallback(
    (file, existingUrl) => {
      onSelect?.(file, existingUrl || URL.createObjectURL(file));
    },
    [onSelect]
  );

  const gridItems = [
    { type: 'camera', key: 'camera' },
    { type: 'gallery', key: 'gallery' },
    ...selectedFiles.map((item, i) => ({ type: 'file', file: item.file, url: item.url, key: `file-${i}-${item.file.name}` })),
  ];

  return (
    <Box
      w="100%"
      h="100%"
      display="flex"
      flexDirection="column"
      bg="black"
      overflow="hidden"
    >
      {/* Header */}
      <Box
        px={4}
        py={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth="1px"
        borderColor="whiteAlpha.200"
        flexShrink={0}
      >
        <Text color="white" fontWeight="600" fontSize="lg">
          New story
        </Text>
        <IconButton
          aria-label="Close"
          icon={<X size={22} />}
          variant="ghost"
          color="white"
          size="lg"
          borderRadius="full"
          _hover={{ bg: 'whiteAlpha.200' }}
          onClick={onClose}
        />
      </Box>

      {/* Scrollable 3-column grid */}
      <Box
        flex={1}
        overflowY="auto"
        overflowX="hidden"
        px={GAP}
        py={GAP}
        sx={{
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
        }}
      >
        <SimpleGrid columns={GRID_COLS} spacing={GAP} minChildWidth="0">
          {gridItems.map((item) => {
            if (item.type === 'camera') {
              return (
                <Box
                  key={item.key}
                  aspectRatio={ASPECT_RATIO}
                  borderRadius="md"
                  overflow="hidden"
                  bg="whiteAlpha.200"
                  onClick={handleCameraClick}
                  cursor="pointer"
                  _active={{ opacity: 0.9 }}
                  transition="opacity 0.2s"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Center flexDirection="column" gap={2}>
                    <Box
                      p={3}
                      borderRadius="full"
                      bg="whiteAlpha.300"
                    >
                      <Camera size={28} color="white" />
                    </Box>
                    <Text color="white" fontSize="xs" fontWeight="500">
                      Camera
                    </Text>
                  </Center>
                </Box>
              );
            }
            if (item.type === 'gallery') {
              return (
                <Box
                  key={item.key}
                  aspectRatio={ASPECT_RATIO}
                  borderRadius="md"
                  overflow="hidden"
                  bg="whiteAlpha.150"
                  onClick={handleGalleryClick}
                  cursor="pointer"
                  _active={{ opacity: 0.9 }}
                  transition="opacity 0.2s"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  borderStyle="dashed"
                >
                  <Center flexDirection="column" gap={2}>
                    <ImagePlus size={28} color="rgba(255,255,255,0.8)" />
                    <Text color="whiteAlpha.800" fontSize="xs" fontWeight="500">
                      Gallery
                    </Text>
                  </Center>
                </Box>
              );
            }
            const isVideo = item.file.type.startsWith('video/');
            return (
              <Box
                key={item.key}
                aspectRatio={ASPECT_RATIO}
                borderRadius="md"
                overflow="hidden"
                cursor="pointer"
                _active={{ opacity: 0.9 }}
                transition="transform 0.2s, opacity 0.2s"
                _hover={{ transform: 'scale(0.98)' }}
                onClick={() => handleFileSelect(item.file, item.url)}
                position="relative"
              >
                {isVideo ? (
                  <Box
                    as="video"
                    src={item.url}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <Box
                    as="img"
                    src={item.url}
                    alt=""
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                )}
                {isVideo && (
                  <Box
                    position="absolute"
                    bottom={1}
                    right={1}
                    px={1}
                    py={0.5}
                    borderRadius="sm"
                    bg="blackAlpha.600"
                  >
                    <Text color="white" fontSize="2xs">
                      Video
                    </Text>
                  </Box>
                )}
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleGalleryChange}
        style={{ display: 'none' }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture={isMobile ? 'environment' : undefined}
        onChange={handleCameraInputChange}
        style={{ display: 'none' }}
      />
    </Box>
  );
}
