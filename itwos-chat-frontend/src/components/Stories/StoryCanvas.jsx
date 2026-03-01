import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Box, Text, IconButton, Center } from '@chakra-ui/react';
import { X, Volume2 } from 'lucide-react';

const MIN_IMAGE_SCALE = 0.5;
const MAX_IMAGE_SCALE = 4;

/**
 * Story canvas: full-screen background image (object-fit: cover) with drag-to-pan
 * and pinch-to-zoom, plus draggable overlays (text, emoji, mention).
 */
export default function StoryCanvas({
  imageUrl,
  mediaType = 'image',
  layers = [],
  onLayerMove,
  onLayerRemove,
  onLayerSelect,
  selectedLayerId,
  editable = true,
  containerRef,
  videoVolume = 1,
  onVideoVolumeChange,
  previewPaused = false,
}) {
  const isVideo = mediaType === 'video';
  const [draggingId, setDraggingId] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const innerRef = useRef(null);

  // Full-screen image: drag to move, pinch to zoom
  const [imageScale, setImageScale] = useState(1);
  const [imageTranslate, setImageTranslate] = useState({ x: 0, y: 0 });
  const [isPanningImage, setIsPanningImage] = useState(false);
  const imagePanStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [pinchStart, setPinchStart] = useState(null);
  const pinchRef = useRef({ dist: 0, scale: 1 });
  const imageWrapRef = useRef(null);
  const videoRef = useRef(null);
  const [videoMutedByPolicy, setVideoMutedByPolicy] = useState(false);

  // When preview is paused (e.g. music modal open), pause video and mute
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    if (previewPaused) {
      videoRef.current.pause();
      videoRef.current.muted = true;
    }
  }, [isVideo, previewPaused]);

  // Start video playback with sound when not paused; if browser blocks, mute and play then show "Tap for sound"
  useEffect(() => {
    if (!isVideo || !imageUrl || !videoRef.current || previewPaused) return;
    const video = videoRef.current;
    const playWithSound = () => {
      video.muted = false;
      video.play().then(() => setVideoMutedByPolicy(false)).catch(() => {
        video.muted = true;
        setVideoMutedByPolicy(true);
        video.play().catch(() => {});
      });
    };
    if (video.readyState >= 2) playWithSound();
    else video.addEventListener('loadeddata', playWithSound, { once: true });
    return () => {
      video.removeEventListener('loadeddata', playWithSound);
      setVideoMutedByPolicy(false);
    };
  }, [isVideo, imageUrl, previewPaused]);

  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
    if (previewPaused) return;
    const vol = Math.max(0, Math.min(1, videoVolume));
    videoRef.current.muted = vol === 0;
    videoRef.current.volume = vol;
  }, [isVideo, videoVolume, previewPaused]);

  const handleUnmuteVideo = useCallback(() => {
    if (!videoRef.current || !videoMutedByPolicy) return;
    videoRef.current.muted = false;
    videoRef.current.play().catch(() => {});
    setVideoMutedByPolicy(false);
  }, [videoMutedByPolicy]);

  const getBounds = useCallback(() => {
    const el = containerRef?.current || innerRef.current;
    if (!el) return { width: 400, height: 700 };
    return { width: el.clientWidth, height: el.clientHeight };
  }, [containerRef]);

  const handlePointerDown = useCallback(
    (e, layer) => {
      if (!editable || e.button !== 0) return;
      e.preventDefault();
      setDraggingId(layer.id);
      setDragStart({ x: e.clientX, y: e.clientY });
      onLayerSelect?.(layer.id);
    },
    [editable, onLayerSelect]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!draggingId || !onLayerMove) return;
      const { width, height } = getBounds();
      const dx = ((e.clientX - dragStart.x) / width) * 100;
      const dy = ((e.clientY - dragStart.y) / height) * 100;
      onLayerMove(draggingId, dx, dy);
      setDragStart((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
    },
    [draggingId, dragStart.x, dragStart.y, onLayerMove, getBounds]
  );

  const handlePointerUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (!draggingId) return;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingId, handlePointerMove, handlePointerUp]);

  // Reset image zoom/pan when media changes
  useEffect(() => {
    setImageScale(1);
    setImageTranslate({ x: 0, y: 0 });
  }, [imageUrl, mediaType]);

  // Image pan (drag to move)
  const onImagePointerDown = useCallback(
    (e) => {
      if (e.button !== 0 && e.pointerType !== 'touch' && !e.touches?.length) return;
      if (draggingId) return;
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      setIsPanningImage(true);
      imagePanStart.current = {
        x,
        y,
        tx: imageTranslate.x,
        ty: imageTranslate.y,
      };
    },
    [draggingId, imageTranslate.x, imageTranslate.y]
  );

  const onImagePointerMove = useCallback(
    (e) => {
      const touches = e.touches;
      if (pinchStart !== null && touches?.length === 2) {
        e.preventDefault?.();
        const dist = Math.hypot(
          touches[0].clientX - touches[1].clientX,
          touches[0].clientY - touches[1].clientY
        );
        const newScale = Math.min(
          MAX_IMAGE_SCALE,
          Math.max(MIN_IMAGE_SCALE, (pinchRef.current.scale * dist) / pinchRef.current.dist)
        );
        setImageScale(newScale);
        pinchRef.current = { dist, scale: newScale };
        return;
      }
      if (!isPanningImage) return;
      e.preventDefault?.();
      const x = e.clientX ?? touches?.[0]?.clientX ?? imagePanStart.current.x;
      const y = e.clientY ?? touches?.[0]?.clientY ?? imagePanStart.current.y;
      setImageTranslate({
        x: imagePanStart.current.tx + (x - imagePanStart.current.x),
        y: imagePanStart.current.ty + (y - imagePanStart.current.y),
      });
    },
    [isPanningImage, pinchStart]
  );

  const onImagePointerUp = useCallback(() => {
    setIsPanningImage(false);
    setPinchStart(null);
  }, []);

  const onImageTouchStart = useCallback(
    (e) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchRef.current = { dist, scale: imageScale };
        setPinchStart(true);
      } else {
        onImagePointerDown(e);
      }
    },
    [imageScale, onImagePointerDown]
  );

  const onImageTouchEnd = useCallback(
    (e) => {
      if (e.touches.length < 2) setPinchStart(null);
      if (e.touches.length === 0) onImagePointerUp();
    },
    [onImagePointerUp]
  );

  useEffect(() => {
    if (!isPanningImage && pinchStart === null) return;
    const move = (e) => onImagePointerMove(e);
    const up = () => onImagePointerUp();
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [isPanningImage, pinchStart, onImagePointerMove, onImagePointerUp]);

  return (
    <Box
      ref={containerRef || innerRef}
      position="relative"
      w="100%"
      h="100%"
      overflow="hidden"
      bg="black"
      sx={{ touchAction: draggingId || isPanningImage || pinchStart ? 'none' : 'auto' }}
    >
      {/* Full-screen background image or video — edge-to-edge, object-fit cover */}
      {imageUrl && (
        <Box
          ref={imageWrapRef}
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          cursor={isPanningImage ? 'grabbing' : 'grab'}
          onPointerDown={onImagePointerDown}
          onTouchStart={onImageTouchStart}
          onTouchEnd={onImageTouchEnd}
          pointerEvents="auto"
          userSelect="none"
        >
          {isVideo ? (
            <>
              <Box
                ref={videoRef}
                as="video"
                src={imageUrl}
                position="absolute"
                top="0"
                left="0"
                w="100%"
                h="100%"
                objectFit="cover"
                objectPosition="center"
                pointerEvents="none"
                transformOrigin="center center"
                transform={`translate(${imageTranslate.x}px, ${imageTranslate.y}px) scale(${imageScale})`}
                transition={isPanningImage || pinchStart ? 'none' : 'transform 0.1s ease-out'}
                playsInline
                loop
                autoPlay
              />
              {videoMutedByPolicy && (
                <Center
                  position="absolute"
                  bottom="80px"
                  right="16px"
                  zIndex={5}
                  w="44px"
                  h="44px"
                  borderRadius="full"
                  bg="blackAlpha.600"
                  cursor="pointer"
                  onClick={handleUnmuteVideo}
                  _hover={{ bg: 'blackAlpha.700' }}
                  pointerEvents="auto"
                  title="Tap for sound"
                >
                  <Volume2 size={22} color="white" />
                </Center>
              )}
            </>
          ) : (
            <Box
              as="img"
              src={imageUrl}
              alt="Story"
              position="absolute"
              top="0"
              left="0"
              w="100%"
              h="100%"
              objectFit="cover"
              objectPosition="center"
              pointerEvents="none"
              transformOrigin="center center"
              transform={`translate(${imageTranslate.x}px, ${imageTranslate.y}px) scale(${imageScale})`}
              transition={isPanningImage || pinchStart ? 'none' : 'transform 0.1s ease-out'}
            />
          )}
        </Box>
      )}

      {/* Draggable overlays — positions in % */}
      {layers.map((layer) => (
        <Box
          key={layer.id}
          position="absolute"
          left={`${layer.x}%`}
          top={`${layer.y}%`}
          transform={`translate(-50%, -50%) rotate(${layer.rotation ?? 0}deg)`}
          cursor={editable ? (draggingId === layer.id ? 'grabbing' : 'grab') : 'default'}
          onPointerDown={(e) => handlePointerDown(e, layer)}
          pointerEvents="auto"
          zIndex={selectedLayerId === layer.id ? 20 : 10}
          outline={selectedLayerId === layer.id ? '2px solid white' : 'none'}
          outlineOffset="2px"
          borderRadius="4px"
          minW="24px"
          minH="24px"
        >
          {layer.type === 'text' && (
            <Text
              fontSize={`${layer.fontSize ?? 24}px`}
              color={layer.color ?? '#ffffff'}
              fontFamily={layer.fontFamily ?? 'inherit'}
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              textShadow="0 1px 2px rgba(0,0,0,0.8)"
              maxW="80vw"
            >
              {layer.content}
            </Text>
          )}
          {layer.type === 'emoji' && (
            <Text fontSize={`${layer.fontSize ?? 48}px`} lineHeight="1">
              {layer.content}
            </Text>
          )}
          {layer.type === 'mention' && (
            <Text
              fontSize={`${layer.fontSize ?? 20}px`}
              color={layer.color ?? '#7dd3fc'}
              fontWeight="600"
              textShadow="0 1px 2px rgba(0,0,0,0.8)"
            >
              @{layer.content}
            </Text>
          )}

          {editable && (
            <IconButton
              aria-label="Remove"
              icon={<X size={14} />}
              size="xs"
              position="absolute"
              top="-8px"
              right="-8px"
              borderRadius="full"
              bg="blackAlpha.800"
              color="white"
              _hover={{ bg: 'blackAlpha.900' }}
              onClick={(e) => {
                e.stopPropagation();
                onLayerRemove?.(layer.id);
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
}

