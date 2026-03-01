import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { Play, Pause } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { buildYouTubeEmbedUrl } from '../../utils/youtubeEmbed';

/** Fixed clip length in seconds (Instagram-style: user picks start, clip is always 30s). */
const TRIM_CLIP_LENGTH = 30;

const SongTrimmer = ({ track, onConfirm, onCancel, defaultStartTime = 0, defaultEndTime, maxDuration = 300, onPreviewStart, onPreviewEnd }) => {
  const borderColor = useColorModeValue('rgba(0, 0, 0, 0.08)', 'rgba(255, 255, 255, 0.12)');
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)');
  const handleBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.2)');

  // Max start so that start + 30 <= maxDuration (hard stop at 30s clip)
  const maxStart = Math.max(0, maxDuration - TRIM_CLIP_LENGTH);
  const effectiveClipLength = maxDuration < TRIM_CLIP_LENGTH ? maxDuration : TRIM_CLIP_LENGTH;

  const [startTime, setStartTime] = useState(() => {
    const start = Math.max(0, Math.min(defaultStartTime, maxStart));
    return start;
  });
  const endTime = Math.min(maxDuration, startTime + effectiveClipLength);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [waveform, setWaveform] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);
  const [isIframeReady, setIsIframeReady] = useState(false);

  const containerRef = useRef(null);
  const playTimeoutRef = useRef(null);
  const youtubeIframeRef = useRef(null);
  const postMessageTimeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const startHandleRef = useRef(null);
  const latestStartTimeRef = useRef(startTime);
  const wasDraggingRef = useRef(false);
  const onPreviewEndRef = useRef(onPreviewEnd);
  onPreviewEndRef.current = onPreviewEnd;
  const onPreviewStartRef = useRef(onPreviewStart);
  onPreviewStartRef.current = onPreviewStart;

  useEffect(() => {
    const validStart = Math.max(0, Math.min(defaultStartTime, maxStart));
    if (Math.abs(startTime - validStart) > 0.1) {
      setStartTime(validStart);
      setCurrentTime(validStart);
    }
  }, [defaultStartTime, maxStart]);

  useEffect(() => {
    const bars = 100;
    setWaveform(Array.from({ length: bars }, () => Math.random() * 100));
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /** Display time with one decimal (e.g. 12.5s, 29.8s) for dragging feedback. */
  const formatTimeSeconds = (seconds) => {
    return `${Number(seconds.toFixed(1))}s`;
  };

  const startPercent = maxDuration > 0 ? (startTime / maxDuration) * 100 : 0;
  const endPercent = maxDuration > 0 ? (endTime / maxDuration) * 100 : 100;
  const trimWidth = endPercent - startPercent;

  const debouncedPostMessage = useCallback((message, delay = 50) => {
    if (postMessageTimeoutRef.current) clearTimeout(postMessageTimeoutRef.current);
    postMessageTimeoutRef.current = setTimeout(() => {
      if (youtubeIframeRef.current?.contentWindow && isIframeReady && !isProcessingRef.current) {
        try {
          isProcessingRef.current = true;
          youtubeIframeRef.current.contentWindow.postMessage(message, '*');
          setTimeout(() => { isProcessingRef.current = false; }, 100);
        } catch (e) {
          isProcessingRef.current = false;
        }
      }
    }, delay);
  }, [isIframeReady]);

  const setStartTimeClamped = useCallback((value) => {
    const newStart = Math.max(0, Math.min(value, maxStart));
    latestStartTimeRef.current = newStart;
    setStartTime(newStart);
    setCurrentTime(newStart);
    if (youtubeIframeRef.current?.contentWindow && isIframeReady) {
      debouncedPostMessage(`{"event":"command","func":"seekTo","args":[${newStart},true]}`, 50);
    }
  }, [maxStart, isIframeReady, debouncedPostMessage]);

  const handleMouseDown = useCallback((e) => {
    if (e.type === 'mousedown') e.preventDefault();
    wasDraggingRef.current = false;
    setIsDragging(true);
    setDragStartX(e.clientX ?? e.touches?.[0]?.clientX ?? 0);
    setDragStartTime(startTime);
  }, [startTime]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    wasDraggingRef.current = true;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const deltaX = currentX - dragStartX;
    const deltaTime = (deltaX / rect.width) * maxDuration;
    const newStart = Math.max(0, Math.min(dragStartTime + deltaTime, maxStart));
    setStartTimeClamped(newStart);
  }, [isDragging, dragStartX, dragStartTime, maxDuration, setStartTimeClamped]);

  // Unmute after 500ms so autoplay (which requires mute=1) can start, then sound is audible
  const scheduleUnmuteAfterPlay = useCallback(() => {
    if (postMessageTimeoutRef.current) clearTimeout(postMessageTimeoutRef.current);
    postMessageTimeoutRef.current = setTimeout(() => {
      if (youtubeIframeRef.current?.contentWindow) {
        try {
          youtubeIframeRef.current.contentWindow.postMessage('{"event":"command","func":"unMute","args":[]}', '*');
        } catch (_) {}
      }
    }, 500);
  }, []);

  // On drag release: auto-play from selected position; use direct postMessage so isProcessingRef doesn't block
  const startPreviewAfterDrag = useCallback(() => {
    if (!youtubeIframeRef.current?.contentWindow || !isIframeReady) return;
    const start = latestStartTimeRef.current;
    const win = youtubeIframeRef.current.contentWindow;
    try {
      onPreviewStartRef.current?.();
      win.postMessage(`{"event":"command","func":"seekTo","args":[${start},true]}`, '*');
      setTimeout(() => {
        if (youtubeIframeRef.current?.contentWindow) {
          youtubeIframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":[]}', '*');
          setIsPlaying(true);
          setCurrentTime(start);
          scheduleUnmuteAfterPlay();
        }
      }, 150);
    } catch (_) {}
  }, [isIframeReady, scheduleUnmuteAfterPlay]);

  const handleMouseUp = useCallback(() => {
    const hadDrag = wasDraggingRef.current;
    setIsDragging(false);
    if (hadDrag) {
      wasDraggingRef.current = false;
      setTimeout(() => startPreviewAfterDrag(), 0);
    }
  }, [startPreviewAfterDrag]);

  useEffect(() => {
    if (!isDragging) return;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove, { passive: false });
    document.addEventListener('touchend', handleMouseUp, { passive: false });
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const el = startHandleRef.current;
    if (!el) return;
    const onTouch = (e) => {
      e.preventDefault();
      e.stopPropagation();
      wasDraggingRef.current = false;
      setIsDragging(true);
      setDragStartX(e.touches[0].clientX);
      setDragStartTime(startTime);
    };
    el.addEventListener('touchstart', onTouch, { passive: false });
    return () => el.removeEventListener('touchstart', onTouch);
  }, [startTime]);

  useEffect(() => {
    latestStartTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    if (!isPlaying || !youtubeIframeRef.current || !isIframeReady) return;
    const handleMessage = (event) => {
      if (event.origin !== 'https://www.youtube.com' || !youtubeIframeRef.current) return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.event === 'onStateChange' && data.info === 0) {
          if (!isProcessingRef.current) {
            debouncedPostMessage(`{"event":"command","func":"seekTo","args":[${startTime},true]}`, 100);
            setTimeout(() => {
              debouncedPostMessage('{"event":"command","func":"playVideo","args":[]}', 100);
              setCurrentTime(startTime);
            }, 200);
          }
        }
        if (data.event === 'infoDelivery' && data.info?.currentTime !== undefined) {
          let current = Math.max(startTime, Math.min(data.info.currentTime, endTime));
          setCurrentTime(current);
          if (current >= endTime - 0.5 && !isProcessingRef.current) {
            debouncedPostMessage('{"event":"command","func":"pauseVideo","args":[]}', 50);
            setTimeout(() => {
              debouncedPostMessage(`{"event":"command","func":"seekTo","args":[${startTime},true]}`, 50);
              setCurrentTime(startTime);
              setIsPlaying(false);
              onPreviewEndRef.current?.();
            }, 100);
          }
        }
      } catch (_) {}
    };
    window.addEventListener('message', handleMessage);
    const interval = setInterval(() => {
      if (youtubeIframeRef.current?.contentWindow && isPlaying && !isProcessingRef.current) {
        try {
          youtubeIframeRef.current.contentWindow.postMessage('{"event":"listening","func":"getCurrentTime"}', '*');
        } catch (_) {}
      }
    }, 1000);
    const duration = (endTime - startTime) * 1000;
    playTimeoutRef.current = setTimeout(() => {
      if (youtubeIframeRef.current?.contentWindow && !isProcessingRef.current) {
        debouncedPostMessage('{"event":"command","func":"pauseVideo","args":[]}', 50);
        setTimeout(() => {
          debouncedPostMessage(`{"event":"command","func":"seekTo","args":[${startTime},true]}`, 50);
          setIsPlaying(false);
          setCurrentTime(startTime);
          onPreviewEndRef.current?.();
        }, 100);
      }
    }, duration);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(interval);
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    };
  }, [isPlaying, startTime, endTime, isIframeReady, debouncedPostMessage]);

  const handlePlayPause = useCallback(() => {
    if (!track?.preview_url || !youtubeIframeRef.current?.contentWindow || !isIframeReady || isProcessingRef.current) return;
    try {
      if (isPlaying) {
        debouncedPostMessage('{"event":"command","func":"pauseVideo","args":[]}', 0);
        setIsPlaying(false);
        onPreviewEndRef.current?.();
      } else {
        onPreviewStartRef.current?.();
        debouncedPostMessage(`{"event":"command","func":"seekTo","args":[${startTime},true]}`, 0);
        setTimeout(() => {
          if (youtubeIframeRef.current?.contentWindow && !isProcessingRef.current) {
            debouncedPostMessage('{"event":"command","func":"playVideo","args":[]}', 0);
            setIsPlaying(true);
            setCurrentTime(startTime);
            scheduleUnmuteAfterPlay();
          }
        }, 150);
      }
    } catch (e) {
      isProcessingRef.current = false;
    }
  }, [isPlaying, track, startTime, isIframeReady, debouncedPostMessage, scheduleUnmuteAfterPlay]);

  const trimDuration = endTime - startTime;
  const currentPercent = trimDuration > 0 ? ((currentTime - startTime) / trimDuration) * 100 : 0;

  const handleConfirm = useCallback(() => {
    if (!track || !onConfirm) return;
    onConfirm({
      video_id: track.id || track.video_id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      preview_url: track.preview_url,
      source: 'youtube',
      startTime,
      endTime,
    });
  }, [track, startTime, endTime, onConfirm]);

  useEffect(() => {
    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      if (postMessageTimeoutRef.current) clearTimeout(postMessageTimeoutRef.current);
      isProcessingRef.current = false;
    };
  }, []);

  if (!track) return null;

  return (
    <Box w="full">
      <VStack spacing={4} align="stretch">
        <Text fontSize="sm" color="whiteAlpha.800">
          Drag the handle to choose start. Clip is fixed at {effectiveClipLength}s (0–{formatTimeSeconds(maxDuration)}).
        </Text>

        <Box
          ref={containerRef}
          position="relative"
          w="full"
          h={{ base: '100px', md: '120px' }}
          bg={cardBg}
          borderRadius="lg"
          p={{ base: 2, md: 4 }}
          overflow="hidden"
          userSelect="none"
          border="0.5px solid"
          borderColor={borderColor}
          onMouseDown={(e) => {
            if (e.target !== startHandleRef.current && !startHandleRef.current?.contains(e.target)) {
              const rect = containerRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const time = Math.max(0, Math.min((x / rect.width) * maxDuration, maxStart));
              setStartTimeClamped(time);
            }
          }}
        >
          <HStack spacing="1px" h={{ base: '60px', md: '80px' }} align="flex-end" justify="flex-start" position="relative" zIndex={1} overflow="hidden">
            {waveform.map((height, index) => {
              const barPercent = (index / waveform.length) * 100;
              const isInTrim = barPercent >= startPercent && barPercent <= endPercent;
              const currentBarPercent = startPercent + (currentPercent * trimWidth) / 100;
              const isCurrent = Math.abs(barPercent - currentBarPercent) < 1.5 && isPlaying;
              return (
                <Box
                  key={index}
                  w="2px"
                  minH="4px"
                  h={`${Math.max(height, 5)}%`}
                  bg={isCurrent ? 'blue.500' : isInTrim ? 'blue.400' : 'gray.400'}
                  borderRadius="sm"
                  opacity={isInTrim ? 1 : 0.4}
                />
              );
            })}
          </HStack>

          <Box
            position="absolute"
            left={`${startPercent}%`}
            width={`${trimWidth}%`}
            top={0}
            bottom={0}
            bg="linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)"
            borderLeft="2px solid"
            borderRight="2px solid"
            borderColor="blue.400"
            borderRadius="md"
            pointerEvents="none"
            zIndex={2}
          />

          {isPlaying && (
            <Box
              position="absolute"
              left={`${startPercent + (currentPercent * trimWidth) / 100}%`}
              top={0}
              bottom={0}
              w="2px"
              bg="blue.500"
              zIndex={3}
              boxShadow="0 0 8px rgba(59, 130, 246, 0.8)"
            />
          )}

          {/* Single draggable start handle – cannot move past maxStart (30s boundary) */}
          <Box
            ref={startHandleRef}
            position="absolute"
            left={`${startPercent}%`}
            top="50%"
            transform="translate(-50%, -50%)"
            w={{ base: '28px', md: '32px' }}
            h={{ base: '28px', md: '32px' }}
            bg={handleBg}
            borderRadius="full"
            border="3px solid"
            borderColor="blue.500"
            boxShadow="0 2px 12px rgba(59, 130, 246, 0.4)"
            cursor="grab"
            zIndex={4}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e);
            }}
            _active={{ cursor: 'grabbing', transform: 'translate(-50%, -50%) scale(1.1)' }}
            _hover={{ transform: 'translate(-50%, -50%) scale(1.05)' }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            transition="transform 0.1s ease-out"
            sx={{ touchAction: 'none' }}
          >
            <Box w={{ base: '10px', md: '12px' }} h={{ base: '10px', md: '12px' }} bg="blue.500" borderRadius="full" />
          </Box>

          {/* Current time position (e.g. 12.5s, 29.8s) – visible while dragging and always above handle */}
          <Box
            position="absolute"
            left={`${startPercent}%`}
            top="-24px"
            transform="translateX(-50%)"
            bg="rgba(0, 0, 0, 0.85)"
            color="white"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="sm"
            fontWeight="600"
            whiteSpace="nowrap"
            zIndex={5}
            sx={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          >
            {isDragging ? formatTimeSeconds(startTime) : formatTime(startTime)}
          </Box>
        </Box>

        <HStack justify="space-between" px={2}>
          <Text fontSize="xs" color="white">
            Start: {isDragging ? formatTimeSeconds(startTime) : formatTime(startTime)} · Clip: {formatTimeSeconds(trimDuration)}
          </Text>
          <Text fontSize="xs" color="white">
            {isPlaying ? formatTimeSeconds(currentTime - startTime) : '0.0s'} / {formatTimeSeconds(trimDuration)}
          </Text>
        </HStack>

        <HStack spacing={3} justify="center" flexWrap="wrap">
          <IconButton
            icon={isPlaying ? <Pause size={20} /> : <Play size={20} />}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePlayPause(); }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            colorScheme="blue"
            size={{ base: 'md', md: 'lg' }}
            borderRadius="full"
            isDisabled={!track || !isIframeReady}
          />
          <Button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleConfirm(); }}
            bg="blue.500"
            color="white"
            size={{ base: 'sm', md: 'md' }}
            px={{ base: 4, md: 6 }}
            fontWeight="600"
            isDisabled={!track}
            _hover={{ bg: 'blue.600' }}
          >
            Use This Sound
          </Button>
          {onCancel && (
            <Button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCancel(); }} variant="ghost" size={{ base: 'sm', md: 'md' }} color="white" _hover={{ bg: 'whiteAlpha.200' }}>
              Cancel
            </Button>
          )}
        </HStack>

        {track?.preview_url && (
          <Box position="absolute" width="1px" height="1px" overflow="hidden" opacity={0} pointerEvents="none" zIndex={-1} top={0} left={0}>
            <Box
              key={track.id || track.video_id}
              ref={youtubeIframeRef}
              as="iframe"
              width="1"
              height="1"
              src={buildYouTubeEmbedUrl(`https://www.youtube.com/embed/${track.id || track.video_id}`, { start: 0, end: maxDuration, mute: 1 })}
              allow="autoplay; encrypted-media"
              referrerPolicy="strict-origin-when-cross-origin"
              style={{ border: 'none' }}
              onLoad={() => {
                setTimeout(() => {
                  setIsIframeReady(true);
                  if (youtubeIframeRef.current?.contentWindow) {
                    try {
                      youtubeIframeRef.current.contentWindow.postMessage('{"event":"listening","func":"getCurrentTime"}', '*');
                    } catch (_) {}
                  }
                }, 1500);
              }}
            />
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default SongTrimmer;
