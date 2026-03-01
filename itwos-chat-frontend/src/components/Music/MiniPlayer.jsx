import { Box, IconButton, HStack, Text, useColorModeValue } from '@chakra-ui/react';
import { X, Music } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const MiniPlayer = ({ videoId, onClose, startTime = 0, endTime = null, externalPaused = false }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const [isPlaying, setIsPlaying] = useState(true);
  const iframeRef = useRef(null);
  const progressCheckIntervalRef = useRef(null);

  const prevExternalPausedRef = useRef(externalPaused);
  useEffect(() => {
    if (prevExternalPausedRef.current === externalPaused) return;
    prevExternalPausedRef.current = externalPaused;
    if (!iframeRef.current?.contentWindow) return;
    if (externalPaused) {
      iframeRef.current.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":[]}', '*');
      setIsPlaying(false);
    } else {
      iframeRef.current.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${startTime},true]}`, '*');
      setTimeout(() => {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage('{"event":"command","func":"playVideo","args":[]}', '*');
          setIsPlaying(true);
        }
      }, 100);
    }
  }, [externalPaused, startTime]);

  // Build YouTube URL with start and end times
  const buildYouTubeUrl = () => {
    let url = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1&enablejsapi=1&loop=0`;
    if (startTime > 0) {
      url += `&start=${Math.floor(startTime)}`;
    }
    if (endTime && endTime > startTime) {
      url += `&end=${Math.floor(endTime)}`;
    }
    return url;
  };

  // Monitor playback and enforce trim boundaries
  useEffect(() => {
    if (!isPlaying || !iframeRef.current) return;

    const handleMessage = (event) => {
      if (event.origin !== 'https://www.youtube.com' || !iframeRef.current) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Handle state changes
        if (data.event === 'onStateChange') {
          if (data.info === 0) {
            // Video ended - loop back to startTime
            if (iframeRef.current?.contentWindow) {
              setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage(
                  `{"event":"command","func":"seekTo","args":[${startTime},true]}`,
                  '*'
                );
                setTimeout(() => {
                  if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.postMessage(
                      '{"event":"command","func":"unMute","args":[]}',
                      '*'
                    );
                    iframeRef.current.contentWindow.postMessage(
                      '{"event":"command","func":"setVolume","args":[100]}',
                      '*'
                    );
                    iframeRef.current.contentWindow.postMessage(
                      '{"event":"command","func":"playVideo","args":[]}',
                      '*'
                    );
                  }
                }, 100);
              }, 100);
            }
          }
        }
        
        // Handle current time updates
        if (data.event === 'infoDelivery' && data.info?.currentTime !== undefined) {
          const current = data.info.currentTime;
          
          // Enforce endTime boundary - loop back to start
          if (endTime && current >= endTime - 0.5) {
            if (iframeRef.current?.contentWindow) {
              // Pause first
              iframeRef.current.contentWindow.postMessage(
                '{"event":"command","func":"pauseVideo","args":[]}',
                '*'
              );
              // Then seek to start
              setTimeout(() => {
                if (iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.postMessage(
                    `{"event":"command","func":"seekTo","args":[${startTime},true]}`,
                    '*'
                  );
                  // Resume playback to loop
                  setTimeout(() => {
                    if (iframeRef.current?.contentWindow && isPlaying) {
                      iframeRef.current.contentWindow.postMessage(
                        '{"event":"command","func":"unMute","args":[]}',
                        '*'
                      );
                      iframeRef.current.contentWindow.postMessage(
                        '{"event":"command","func":"setVolume","args":[100]}',
                        '*'
                      );
                      iframeRef.current.contentWindow.postMessage(
                        '{"event":"command","func":"playVideo","args":[]}',
                        '*'
                      );
                    }
                  }, 100);
                }
              }, 50);
            }
          }
          
          // Also enforce startTime - if somehow we're before start, seek to start
          if (current < startTime - 0.5) {
            if (iframeRef.current?.contentWindow) {
              iframeRef.current.contentWindow.postMessage(
                `{"event":"command","func":"seekTo","args":[${startTime},true]}`,
                '*'
              );
            }
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    };

    window.addEventListener('message', handleMessage);

    // Request current time updates more frequently for better boundary enforcement
    const timeUpdateInterval = setInterval(() => {
      if (iframeRef.current?.contentWindow && isPlaying) {
        try {
          iframeRef.current.contentWindow.postMessage(
            '{"event":"listening","func":"getCurrentTime"}',
            '*'
          );
        } catch (e) {
          // Silently fail
        }
      }
    }, 500);

    progressCheckIntervalRef.current = timeUpdateInterval;

    return () => {
      window.removeEventListener('message', handleMessage);
      if (progressCheckIntervalRef.current) {
        clearInterval(progressCheckIntervalRef.current);
      }
    };
  }, [isPlaying, startTime, endTime]);

  useEffect(() => {
    // Auto-play when component mounts or videoId/trim times change
    if (iframeRef.current?.contentWindow && isPlaying) {
      // Wait for iframe to be ready
      const readyCheck = setInterval(() => {
        if (iframeRef.current?.contentWindow) {
          clearInterval(readyCheck);
          try {
            // Seek to startTime first
            iframeRef.current.contentWindow.postMessage(
              `{"event":"command","func":"seekTo","args":[${startTime},true]}`,
              '*'
            );
            // Then play after a short delay
            setTimeout(() => {
              if (iframeRef.current?.contentWindow && isPlaying) {
                iframeRef.current.contentWindow.postMessage(
                  '{"event":"command","func":"unMute","args":[]}',
                  '*'
                );
                iframeRef.current.contentWindow.postMessage(
                  '{"event":"command","func":"setVolume","args":[100]}',
                  '*'
                );
                iframeRef.current.contentWindow.postMessage(
                  '{"event":"command","func":"playVideo","args":[]}',
                  '*'
                );
              }
            }, 300);
          } catch (e) {
            console.error('[MiniPlayer] Error playing:', e);
          }
        }
      }, 100);
      
      // Cleanup interval after 5 seconds max
      setTimeout(() => clearInterval(readyCheck), 5000);
      
      return () => clearInterval(readyCheck);
    }
  }, [videoId, isPlaying, startTime, endTime]);

  const handlePlayPause = () => {
    if (!iframeRef.current?.contentWindow) return;
    
    try {
      if (isPlaying) {
        iframeRef.current.contentWindow.postMessage(
          '{"event":"command","func":"pauseVideo","args":[]}',
          '*'
        );
        setIsPlaying(false);
        if (progressCheckIntervalRef.current) {
          clearInterval(progressCheckIntervalRef.current);
        }
      } else {
        // Seek to startTime before playing
        iframeRef.current.contentWindow.postMessage(
          `{"event":"command","func":"seekTo","args":[${startTime},true]}`,
          '*'
        );
        setTimeout(() => {
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              '{"event":"command","func":"unMute","args":[]}',
              '*'
            );
            iframeRef.current.contentWindow.postMessage(
              '{"event":"command","func":"setVolume","args":[100]}',
              '*'
            );
            iframeRef.current.contentWindow.postMessage(
              '{"event":"command","func":"playVideo","args":[]}',
              '*'
            );
            setIsPlaying(true);
          }
        }, 150);
      }
    } catch (e) {
      console.error('[MiniPlayer] Error controlling playback:', e);
    }
  };

  // Cleanup on unmount - stop playback
  useEffect(() => {
    return () => {
      // Stop playback when component unmounts
      if (iframeRef.current?.contentWindow && isPlaying) {
        try {
          iframeRef.current.contentWindow.postMessage(
            '{"event":"command","func":"pauseVideo","args":[]}',
            '*'
          );
        } catch (e) {
          // Silently fail
        }
      }
      if (progressCheckIntervalRef.current) {
        clearInterval(progressCheckIntervalRef.current);
      }
    };
  }, [isPlaying]);

  if (!videoId) return null;

  return (
    <Box
      position="relative"
      w="full"
      p={3}
      borderRadius="md"
      border="1px"
      borderColor={borderColor}
      bg={bgColor}
    >
      <HStack spacing={3} justify="space-between">
        <HStack spacing={2} flex="1" minW={0}>
          <Box
            boxSize="40px"
            borderRadius="md"
            bg="gray.300"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Music size={20} color="gray" />
          </Box>
          <Box flex="1" minW={0}>
            <Text fontSize="sm" fontWeight="medium" color={textColor} isTruncated>
              Playing audio...
            </Text>
            <Text fontSize="xs" color={textColor} opacity={0.7}>
              Audio only preview
            </Text>
          </Box>
        </HStack>
        <HStack spacing={1}>
          <IconButton
            icon={isPlaying ? <Text fontSize="xs">⏸</Text> : <Text fontSize="xs">▶</Text>}
            size="sm"
            variant="ghost"
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            colorScheme="blue"
          />
          {onClose && (
            <IconButton
              icon={<X size={14} />}
              size="sm"
              onClick={onClose}
              aria-label="Close player"
              variant="ghost"
              colorScheme="gray"
            />
          )}
        </HStack>
      </HStack>
      
      {/* Hidden YouTube iframe for audio-only playback */}
      <Box
        position="absolute"
        width="1px"
        height="1px"
        overflow="hidden"
        opacity={0}
        pointerEvents="none"
        zIndex={-1}
        top={0}
        left={0}
      >
        <Box
          ref={iframeRef}
          as="iframe"
          width="1"
          height="1"
          src={buildYouTubeUrl()}
          allow="autoplay; encrypted-media"
          style={{ border: 'none' }}
          key={`${videoId}-${startTime}-${endTime}`}
        />
      </Box>
    </Box>
  );
};

export default MiniPlayer;
