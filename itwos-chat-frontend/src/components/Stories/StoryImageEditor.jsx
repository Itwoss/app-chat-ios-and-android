import { Box, Button, HStack, Slider, SliderTrack, SliderFilledTrack, SliderThumb, Text, useBreakpointValue, IconButton } from '@chakra-ui/react';
import { ZoomIn, ZoomOut, Check, Move } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';

const ASPECT = 9 / 16;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

/**
 * Story image editor: zoom, pan, crop.
 * Mobile: pinch to zoom, drag to pan.
 * Desktop: zoom slider + drag to pan.
 * "Done" crops the visible area and returns a blob.
 */
export default function StoryImageEditor({ imageSrc, onDone, onCancel }) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const [pinchStart, setPinchStart] = useState(null);
  const pinchRef = useRef({ dist: 0, scale: 1 });

  const isMobile = useBreakpointValue({ base: true, md: false });

  // Initialize scale so image covers viewport (cover)
  useEffect(() => {
    if (!imageRef.current || !containerRef.current || !imageSrc) return;
    const img = imageRef.current;
    const cont = containerRef.current;
    if (img.naturalWidth && img.naturalHeight) {
      const cw = cont.clientWidth;
      const ch = cont.clientHeight;
      const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      setScale(Math.min(Math.max(s, MIN_SCALE), MAX_SCALE));
      setTranslate({ x: 0, y: 0 });
    }
  }, [imageSrc]);

  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;
    const img = imageRef.current;
    const cont = containerRef.current;
    const cw = cont.clientWidth;
    const ch = cont.clientHeight;
    const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    setScale(Math.min(Math.max(s, MIN_SCALE), MAX_SCALE));
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Mouse/touch pan
  const onPointerDown = (e) => {
    if (e.button !== 0 && e.type !== 'touchstart') return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX ?? e.touches?.[0]?.clientX,
      y: e.clientY ?? e.touches?.[0]?.clientY,
      tx: translate.x,
      ty: translate.y,
    };
  };

  const onPointerMove = (e) => {
    if (pinchStart !== null) {
      const touches = e.touches;
      if (touches.length === 2) {
        const dist = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (pinchRef.current.scale * dist) / pinchRef.current.dist));
        setScale(newScale);
        pinchRef.current = { dist, scale: newScale };
      }
      return;
    }
    if (!isDragging) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX;
    const y = e.clientY ?? e.touches?.[0]?.clientY;
    setTranslate({
      x: dragStart.current.tx + (x - dragStart.current.x),
      y: dragStart.current.ty + (y - dragStart.current.y),
    });
  };

  const onPointerUp = () => {
    setIsDragging(false);
    setPinchStart(null);
  };

  const onTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      pinchRef.current = { dist, scale };
      setPinchStart({ dist, scale });
    } else {
      onPointerDown(e);
    }
  };

  const onTouchEnd = (e) => {
    if (e.touches.length < 2) setPinchStart(null);
    if (e.touches.length === 0) onPointerUp();
  };

  const handleZoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + 0.25));
  const handleZoomOut = () => setScale((s) => Math.max(MIN_SCALE, s - 0.25));

  const handleDone = useCallback(() => {
    if (!containerRef.current || !imageRef.current || !imageSrc) return;
    const img = imageRef.current;
    const cont = containerRef.current;
    const cw = cont.clientWidth;
    const ch = cont.clientHeight;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const fit = Math.min(cw / nw, ch / nh);
    // Map viewport (0,0)-(cw,ch) to source image rect. Image is displayed at
    // center with size (nw*fit*scale, nh*fit*scale) then translated by (translate.x, translate.y).
    const leftScaled = (nw * fit * scale) / 2 - cw / 2 - translate.x;
    const topScaled = (nh * fit * scale) / 2 - ch / 2 - translate.y;
    const sw = cw / (fit * scale);
    const sh = ch / (fit * scale);
    let sx = leftScaled / (fit * scale);
    let sy = topScaled / (fit * scale);
    // Clamp to image bounds so we never sample outside
    const swSafe = Math.min(sw, nw);
    const shSafe = Math.min(sh, nh);
    sx = Math.max(0, Math.min(nw - swSafe, sx));
    sy = Math.max(0, Math.min(nh - shSafe, sy));
    const swClamp = Math.min(swSafe, nw - sx);
    const shClamp = Math.min(shSafe, nh - sy);

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img, sx, sy, swClamp, shClamp, 0, 0, cw, ch);

    canvas.toBlob(
      (blob) => {
        if (blob) onDone(blob);
      },
      'image/jpeg',
      0.92
    );
  }, [imageSrc, scale, translate, onDone]);

  return (
    <Box w="100%">
      <HStack mb={2} spacing={3} flexWrap="wrap" color="whiteAlpha.800" fontSize="sm">
        {isMobile ? (
          <Text>Drag to move, pinch to zoom</Text>
        ) : (
          <>
            <HStack spacing={1.5}>
              <Move size={16} />
              <Text>Drag image to move</Text>
            </HStack>
            <HStack spacing={1.5}>
              <ZoomIn size={16} />
              <Text>Use slider below to zoom</Text>
            </HStack>
          </>
        )}
      </HStack>

      <Box
        ref={containerRef}
        position="relative"
        w="100%"
        maxH="70vh"
        aspectRatio={ASPECT}
        overflow="hidden"
        bg="black"
        borderRadius="lg"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
        touchAction="none"
        onMouseDown={onPointerDown}
        onMouseMove={onPointerMove}
        onMouseUp={onPointerUp}
        onMouseLeave={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onPointerMove}
        onTouchEnd={onTouchEnd}
        cursor={isDragging ? 'grabbing' : 'grab'}
        userSelect="none"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          w="100%"
          h="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop"
            draggable={false}
            onLoad={handleImageLoad}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              pointerEvents: 'none',
              transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
              transformOrigin: 'center center',
            }}
          />
        </Box>
      </Box>

      {/* Desktop: zoom slider + move hint */}
      {!isMobile && (
        <Box mt={4} p={3} borderRadius="md" bg="whiteAlpha.100" borderWidth="1px" borderColor="whiteAlpha.200">
          <Text color="white" fontSize="xs" fontWeight="600" mb={3}>
            Zoom &amp; move
          </Text>
          <HStack spacing={4} align="center">
            <IconButton
              aria-label="Zoom out"
              icon={<ZoomOut size={18} />}
              size="sm"
              variant="outline"
              color="white"
              borderColor="whiteAlpha.300"
              onClick={handleZoomOut}
            />
            <Slider
              aria-label="Zoom"
              value={scale}
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.1}
              onChange={(v) => setScale(v)}
              flex={1}
            >
              <SliderTrack bg="whiteAlpha.300">
                <SliderFilledTrack bg="blue.400" />
              </SliderTrack>
              <SliderThumb />
            </Slider>
            <IconButton
              aria-label="Zoom in"
              icon={<ZoomIn size={18} />}
              size="sm"
              variant="outline"
              color="white"
              borderColor="whiteAlpha.300"
              onClick={handleZoomIn}
            />
          </HStack>
          <Text color="whiteAlpha.700" fontSize="xs" mt={2}>
            Drag the image above to reposition
          </Text>
        </Box>
      )}

      <HStack mt={4} spacing={3} justify="flex-end">
        <Button size="sm" variant="ghost" color="white" onClick={onCancel}>
          Cancel
        </Button>
        <Button leftIcon={<Check size={16} />} size="sm" colorScheme="blue" onClick={handleDone}>
          Done
        </Button>
      </HStack>
    </Box>
  );
}
