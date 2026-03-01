import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  IconButton,
  Image,
  useColorModeValue,
  Spinner,
  Center,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Divider,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { X, ChevronLeft, ChevronRight, Music, Eye, Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGetStoriesFeedQuery, useViewStoryMutation, useGetStoryViewersQuery, useGetCurrentUserQuery } from '../../store/api/userApi';
import { useAudioManager } from '../../contexts/AudioManagerContext';
import VerifiedBadge from '../VerifiedBadge/VerifiedBadge';
import { getUserInfo } from '../../utils/auth';
import { buildYouTubeEmbedUrl } from '../../utils/youtubeEmbed';
import useAmbientColors from '../../hooks/useAmbientColors';
import { ReelSkeleton } from '../Skeletons';

const DEFAULT_STORY_DURATION_MS = 10000; // 10 seconds (image-only default)
const STORY_WITH_SONG_DURATION_MS = 30000; // 30 seconds when story has music/sound

/** Instagram-style story time: "5m", "2h", "1d" */
function formatStoryTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 1) return 'Just now';
  if (diffM < 60) return `${diffM}m`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD < 7) return `${diffD}d`;
  return `${Math.floor(diffD / 7)}w`;
}

const StoryViewer = () => {
  const bgColor = useColorModeValue('black', 'gray.900');
  const textColor = useColorModeValue('white', 'gray.100');
  // Extract all useColorModeValue calls to top level to prevent hooks order issues
  const viewerSectionBg = useColorModeValue('gray.50', 'gray.700');
  const viewerSectionText = useColorModeValue('gray.700', 'gray.200');
  const viewerHoverBg = useColorModeValue('gray.50', 'gray.700');
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Get stories from navigation state (Instagram-style ordering)
  const storiesFromState = location.state?.stories || [];
  const initialUserIndexFromState = location.state?.initialUserIndex ?? 0;

  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndexFromState);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEntering, setIsEntering] = useState(true); // For shared element transition

  const [isViewersOpen, setIsViewersOpen] = useState(false);
  const [isSongExpanded, setIsSongExpanded] = useState(false);
  const [swipeStartY, setSwipeStartY] = useState(null);

  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const youtubeIframeRef = useRef(null);
  const storySoundStartRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const lastTouchEndTime = useRef(0);

  const { data: storiesData, isLoading, refetch: refetchStories } = useGetStoriesFeedQuery();
  const [viewStory] = useViewStoryMutation();
  const { stopYouTube, registerYouTubeIframe } = useAudioManager();
  
  // Get current user to check if they own the story
  const { data: currentUserData } = useGetCurrentUserQuery();
  const userInfo = getUserInfo();
  const currentUserId = currentUserData?.data?._id || userInfo?.id;

  // Use stories from navigation state if available, otherwise fallback to API data
  const stories = storiesFromState.length > 0 ? storiesFromState : (storiesData?.data || []);
  
  // Initialize currentUserIndex from state if available
  useEffect(() => {
    if (storiesFromState.length > 0 && initialUserIndexFromState >= 0) {
      setCurrentUserIndex(initialUserIndexFromState);
      setCurrentStoryIndex(0);
      // Trigger shared element transition animation
      setIsEntering(true);
      setTimeout(() => setIsEntering(false), 300);
    }
  }, [storiesFromState.length, initialUserIndexFromState]);

  const currentStory = stories[currentUserIndex]?.stories?.[currentStoryIndex];

  // Story display duration: backend duration, or 30s if has song/music, else 10s default
  const hasStorySound =
    (currentStory?.sound && (currentStory.sound.preview_url || currentStory.sound.video_id)) ||
    (currentStory?.musicUrl && typeof currentStory.musicUrl === 'string' && currentStory.musicUrl.trim() !== '');
  const storyDurationMs =
    currentStory?.duration != null && currentStory.duration > 0
      ? currentStory.duration * 1000
      : hasStorySound
        ? STORY_WITH_SONG_DURATION_MS
        : DEFAULT_STORY_DURATION_MS;

  // Get story media URL for ambient background (must be at top level before early returns)
  const storyMediaUrl = currentStory?.mediaUrl || null;
  const ambientGradient = useAmbientColors(storyMediaUrl);
  
  // Determine if user is story owner (needed for viewers query)
  const isStoryOwner = currentStory?.user?._id?.toString() === currentUserId?.toString() || 
                       currentStory?.user?.toString() === currentUserId?.toString();
  
  // Get viewers data if story owner (must be before useEffect that uses refetchViewers)
  const { data: viewersData, refetch: refetchViewers } = useGetStoryViewersQuery(
    currentStory?._id,
    { skip: !isStoryOwner || !currentStory?._id }
  );
  
  const viewersPayload = viewersData?.data;
  const viewers = Array.isArray(viewersPayload) ? viewersPayload : (viewersPayload?.viewers || []);
  const viewCount =
    (viewersPayload && !Array.isArray(viewersPayload) && viewersPayload.viewCount != null)
      ? viewersPayload.viewCount
      : (currentStory?.viewCount ?? viewers.length ?? 0);
  const likeCount = viewersData?.data?.likeCount ?? currentStory?.likeCount ?? 0;
  
  // Record story view when story changes (no delay – immediate so viewers list updates on time)
  useEffect(() => {
    if (!currentStory?._id) return;

    viewStory({
      id: currentStory._id,
      duration: 0, // Will be updated when story completes
    })
      .then(() => {
        if (isStoryOwner && currentStory?._id && refetchViewers) {
          // Defer to avoid "Cannot update component while rendering" (BrowserRouter)
          setTimeout(() => {
            try {
              refetchViewers();
            } catch (_) {
              // Query may be skipped (not started); ignore
            }
          }, 0);
        }
      })
      .catch((err) => {
        console.error('Error recording story view:', err);
      });
  }, [currentStory?._id, viewStory, isStoryOwner, refetchViewers]);
  
  // Close viewers modal when switching to another story (so previous story's viewers don't show on next user)
  useEffect(() => {
    setIsViewersOpen(false);
  }, [currentStory?._id]);

  // Collapse song when switching story
  useEffect(() => {
    setIsSongExpanded(false);
  }, [currentStory?._id]);

  // Refetch viewers when modal opens or story changes (real-time updates)
  useEffect(() => {
    if (isViewersOpen && isStoryOwner && currentStory?._id && refetchViewers) {
      try {
        refetchViewers();
      } catch (_) {
        // Query may be skipped; ignore
      }
      const interval = setInterval(() => {
        try {
          if (refetchViewers) refetchViewers();
        } catch (_) {}
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isViewersOpen, isStoryOwner, currentStory?._id, refetchViewers]);

  // Handle story navigation
  const handleNext = () => {
    // Record view before moving
    if (currentStory?._id) {
      viewStory({
        id: currentStory._id,
        duration: elapsedTime / 1000 // Convert to seconds
      }).then(() => {
        try {
          refetchStories();
        } catch (_) {}
        window.dispatchEvent(new CustomEvent('refetchStories'));
        if (isStoryOwner && currentStory?._id) {
          try {
            refetchViewers();
          } catch (_) {}
        }
      }).catch(console.error);
    }
    
    if (currentStoryIndex < (stories[currentUserIndex]?.stories?.length || 0) - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
      setElapsedTime(0);
    } else if (currentUserIndex < stories.length - 1) {
      setCurrentUserIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
      setProgress(0);
      setElapsedTime(0);
    } else {
      // All stories finished - return to previous page (Instagram behavior)
      try {
        refetchStories();
      } catch (_) {}
      window.dispatchEvent(new CustomEvent('refetchStories'));
      const returnPath = location.state?.returnPath || '/user/home';
      navigate(returnPath);
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
      setElapsedTime(0);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(prev => prev - 1);
      const prevUserStories = stories[prev - 1]?.stories || [];
      setCurrentStoryIndex(prevUserStories.length - 1);
      setProgress(0);
      setElapsedTime(0);
    }
  };

  // Handle pause/resume
  const handlePause = () => {
    setIsPaused(true);
    if (videoRef.current) videoRef.current.pause();
    if (audioRef.current) audioRef.current.pause();
    if (youtubeIframeRef.current?.contentWindow) {
      youtubeIframeRef.current.contentWindow.postMessage(
        '{"event":"command","func":"pauseVideo","args":[]}',
        '*'
      );
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    if (videoRef.current) videoRef.current.play().catch(console.error);
    if (audioRef.current) audioRef.current.play().catch(console.error);
    if (youtubeIframeRef.current?.contentWindow) {
      youtubeIframeRef.current.contentWindow.postMessage(
        '{"event":"command","func":"unMute","args":[]}',
        '*'
      );
      youtubeIframeRef.current.contentWindow.postMessage(
        '{"event":"command","func":"setVolume","args":[100]}',
        '*'
      );
      youtubeIframeRef.current.contentWindow.postMessage(
        '{"event":"command","func":"playVideo","args":[]}',
        '*'
      );
    }
  };

  // Progress tracking
  useEffect(() => {
    if (isPaused) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    progressIntervalRef.current = setInterval(() => {
      setElapsedTime(prev => {
        const newElapsed = prev + 50;
        const newProgress = Math.min((newElapsed / storyDurationMs) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          // Record final view duration before moving to next
          if (currentStory?._id) {
            viewStory({
              id: currentStory._id,
              duration: storyDurationMs / 1000 // Convert to seconds
            }).then(() => {
              try {
                refetchStories();
              } catch (_) {}
              window.dispatchEvent(new CustomEvent('refetchStories'));
            }).catch(console.error);
          }
          handleNext();
          return 0;
        }
        return newElapsed;
      });
    }, 50);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [isPaused, currentStory?._id, storyDurationMs]);

  // Handle story media and audio
  useEffect(() => {
    if (!currentStory) return;

    setProgress(0);
    setElapsedTime(0);
    setIsPaused(false);

    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (youtubeIframeRef.current?.contentWindow) {
      stopYouTube(currentStory._id);
    }

    // Handle video – when added music exists, mute video so only the added music plays
    const hasAddedMusic = !!(
      (currentStory.sound && currentStory.sound.source === 'youtube' && (currentStory.sound.preview_url || currentStory.sound.video_id)) ||
      (currentStory.musicUrl && typeof currentStory.musicUrl === 'string' && currentStory.musicUrl.trim() !== '') ||
      (currentStory.musicFile && typeof currentStory.musicFile === 'string' && currentStory.musicFile.trim() !== '')
    );
    const videoVol = hasAddedMusic ? 0 : Math.max(0, Math.min(1, Number(currentStory.videoVolume) || 1));
    if (currentStory.mediaType === 'video' && videoRef.current) {
      videoRef.current.muted = hasAddedMusic;
      videoRef.current.volume = videoVol;
      videoRef.current.currentTime = 0;
      videoRef.current.load();
      setTimeout(() => {
        if (videoRef.current && !isPaused) {
          videoRef.current.muted = hasAddedMusic;
          videoRef.current.volume = videoVol;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    }

    // Handle YouTube sound – play immediately when iframe is ready (onLoad or already has contentWindow)
    const hasYouTubeSound =
      currentStory.sound &&
      currentStory.sound.source === 'youtube' &&
      (currentStory.sound.preview_url || currentStory.sound.video_id);
    let storySoundUnmuteTimer = null;
    const startYouTubeStorySound = () => {
      if (!youtubeIframeRef.current?.contentWindow || isPaused) return;
      const startTime = currentStory.sound.startTime || 0;
      const win = youtubeIframeRef.current.contentWindow;
      const iframeEl = youtubeIframeRef.current;
      registerYouTubeIframe(currentStory._id, iframeEl);
      win.postMessage(`{"event":"command","func":"seekTo","args":[${startTime},true]}`, '*');
      win.postMessage('{"event":"command","func":"playVideo","args":[]}', '*');
      const raw = Number(currentStory.musicVolume);
      const musicVol = Math.max(0, Math.min(100, Number.isFinite(raw) ? Math.round(raw * 100) : 100));
      storySoundUnmuteTimer = setTimeout(() => {
        if (!youtubeIframeRef.current?.contentWindow) return;
        const yt = youtubeIframeRef.current.contentWindow;
        yt.postMessage('{"event":"command","func":"unMute","args":[]}', '*');
        setTimeout(() => {
          if (youtubeIframeRef.current?.contentWindow) {
            youtubeIframeRef.current.contentWindow.postMessage(`{"event":"command","func":"setVolume","args":[${musicVol}]}`, '*');
          }
        }, 150);
      }, 600);
    };
    storySoundStartRef.current = startYouTubeStorySound;
    if (hasYouTubeSound && youtubeIframeRef.current?.contentWindow) {
      startYouTubeStorySound();
    }
    const youTubeStartRetry = hasYouTubeSound ? setTimeout(() => storySoundStartRef.current?.(), 1200) : null;

    // Handle uploaded audio – play immediately (backend returns musicUrl, not musicFile)
    const musicSourceUrl = currentStory.musicUrl || currentStory.musicFile;
    const hasUploadedAudio = !!(musicSourceUrl && typeof musicSourceUrl === 'string' && musicSourceUrl.trim() !== '');
    if (hasUploadedAudio && audioRef.current) {
      const startTime = currentStory.musicStartTime || 0;
      const raw = Number(currentStory.musicVolume);
      const musicVol = Math.max(0, Math.min(1, Number.isFinite(raw) ? raw : 1));
      const el = audioRef.current;
      el.volume = musicVol;
      el.currentTime = startTime;
      el.src = musicSourceUrl;
      if (currentStory.musicEndTime) {
        el.ontimeupdate = () => {
          if (audioRef.current && audioRef.current.currentTime >= currentStory.musicEndTime) {
            audioRef.current.currentTime = startTime;
          }
        };
      }
      const playWhenReady = () => {
        if (audioRef.current && !isPaused) {
          audioRef.current.currentTime = startTime;
          audioRef.current.volume = musicVol;
          audioRef.current.play().catch(() => {});
        }
      };
      el.oncanplay = playWhenReady;
      el.load();
      if (!isPaused) {
        const playTimer = setTimeout(playWhenReady, 100);
        return () => {
          storySoundStartRef.current = null;
          clearTimeout(playTimer);
          if (storySoundUnmuteTimer) clearTimeout(storySoundUnmuteTimer);
          if (el) {
            el.oncanplay = null;
            el.pause();
          }
          if (videoRef.current) videoRef.current.pause();
          if (youtubeIframeRef.current?.contentWindow) {
            stopYouTube(currentStory._id);
          }
        };
      }
    }

    return () => {
      storySoundStartRef.current = null;
      if (storySoundUnmuteTimer) clearTimeout(storySoundUnmuteTimer);
      if (youTubeStartRetry) clearTimeout(youTubeStartRetry);
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      if (youtubeIframeRef.current?.contentWindow) {
        stopYouTube(currentStory._id);
      }
    };
  }, [currentStory?._id, isPaused, registerYouTubeIframe, stopYouTube]);

  // Tap: left = previous, right = next, center = pause/resume (Instagram).
  const handleScreenTap = (clientX) => {
    if (typeof window === 'undefined') return;
    const w = window.visualViewport?.width ?? window.innerWidth ?? document.documentElement.clientWidth;
    const third = w / 3;
    if (clientX < third) {
      handlePrevious();
    } else if (clientX > 2 * third) {
      handleNext();
    } else {
      if (isPaused) handleResume();
      else handlePause();
    }
  };

  // Touch handlers for swipe (including swipe-up for viewers)
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwipeStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchStartY.current || swipeStartY === null) return;

    const target = e.target;
    if (target?.closest?.('[data-story-header]')) {
      touchStartX.current = null;
      touchStartY.current = null;
      setSwipeStartY(null);
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = swipeStartY - touchEndY;

    // Swipe down to close (Instagram)
    if (diffY < -50 && Math.abs(diffY) > Math.abs(diffX)) {
      handleClose();
      touchStartX.current = null;
      touchStartY.current = null;
      setSwipeStartY(null);
      return;
    }

    // Swipe up to open viewers (story owner only)
    if (diffY > 50 && Math.abs(diffY) > Math.abs(diffX) && isStoryOwner) {
      setIsViewersOpen(true);
      handlePause();
    } else if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) handleNext();
      else handlePrevious();
    } else {
      // Short tap: left = previous, right = next, center = pause/resume (Instagram)
      lastTouchEndTime.current = Date.now();
      handleScreenTap(touchEndX);
    }

    touchStartX.current = null;
    touchStartY.current = null;
    setSwipeStartY(null);
  };

  if (isLoading) {
    return (
      <Box h="100vh" w="100%" bg="blackAlpha.800">
        <ReelSkeleton />
      </Box>
    );
  }

  // Handle close/back navigation (Instagram behavior: return to same screen)
  const handleClose = () => {
    const returnPath = location.state?.returnPath || location.pathname.replace('/stories/view', '') || '/user/home';
    navigate(returnPath);
  };

  if (!currentStory) {
    return (
      <Center h="100vh" bg="transparent">
        <VStack spacing={4}>
          <Text color={textColor} fontSize="lg">No stories available</Text>
          <IconButton
            icon={<X size={24} />}
            onClick={handleClose}
            aria-label="Close"
            colorScheme="gray"
          />
        </VStack>
      </Center>
    );
  }

  const hasYouTubeSound =
    currentStory.sound &&
    currentStory.sound.source === 'youtube' &&
    (currentStory.sound.title || currentStory.sound.preview_url || currentStory.sound.video_id);
  const hasUploadedAudio =
    (currentStory.musicUrl || currentStory.musicFile) &&
    typeof (currentStory.musicUrl || currentStory.musicFile) === 'string' &&
    (currentStory.musicUrl || currentStory.musicFile).trim() !== '';
  const user = stories[currentUserIndex]?.user || currentStory.user;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      sx={{
        // Shared element transition - zoom-in morph animation
        animation: isEntering ? 'zoomInMorph 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards' : 'none',
        '@keyframes zoomInMorph': {
          '0%': {
            opacity: 0,
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: 1,
            transform: 'scale(1)',
          },
        },
      }}
      right={0}
      bottom={0}
      bg="transparent"
      zIndex={9999}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient Blur Background */}
      {storyMediaUrl && (
        <Box
          position="absolute"
          top="-10px"
          left="-10px"
          right="-10px"
          bottom="-10px"
          zIndex={0}
          background={ambientGradient}
          filter="blur(40px)"
          transform="scale(1.1)"
          opacity={0.4}
          transition="background 0.5s ease-in-out"
          pointerEvents="none"
          overflow="hidden"
        />
      )}
      
      {/* Content Layer */}
      <Box position="relative" zIndex={1} w="full" h="full">
      {/* Progress Bars */}
      <HStack spacing={1} p={2} position="absolute" top={0} left={0} right={0} zIndex={10} pointerEvents="none">
        {stories[currentUserIndex]?.stories?.map((_, index) => (
          <Box
            key={index}
            flex="1"
            h="2px"
            bg={index < currentStoryIndex ? 'white' : 'whiteAlpha.300'}
            position="relative"
            overflow="hidden"
          >
            {index === currentStoryIndex && (
              <Box
                h="100%"
                bg="white"
                w={`${progress}%`}
                transition="width 0.05s linear"
              />
            )}
          </Box>
        ))}
      </HStack>

      {/* Header: user line + song avatar in same row; click song to expand (hides user line) */}
      <Box
        data-story-header
        position="absolute"
        top={4}
        left={4}
        right={4}
        zIndex={10}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        alignContent="center"
        gap={3}
        overflow="visible"
      >
        {isSongExpanded && (hasYouTubeSound || hasUploadedAudio) ? (
          /* Expanded song pill: same layout as user row (avatar + title), slides in from right */
          <HStack
              spacing={3}
              flex={1}
              maxW="calc(100% - 56px)"
              bg={useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.1)')}
              borderRadius="full"
              px={3}
              py={1}
              border="1px solid"
              borderColor={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
              sx={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                animation: 'storySongSlideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                '@keyframes storySongSlideIn': {
                  '0%': { opacity: 0, transform: 'translateX(100%)' },
                  '100%': { opacity: 1, transform: 'translateX(0)' },
                },
              }}
            >
              {(hasYouTubeSound || hasUploadedAudio) ? (
                <Box position="relative" boxSize="24px" flexShrink={0} display="flex" alignItems="center" justifyContent="center" overflow="visible">
                  {hasYouTubeSound && currentStory.sound?.thumbnail ? (
                    <Image
                      src={currentStory.sound.thumbnail}
                      alt=""
                      boxSize="24px"
                      borderRadius="full"
                      objectFit="cover"
                      position="absolute"
                      inset={0}
                      zIndex={1}
                    />
                  ) : (
                    <Center position="absolute" inset={0} boxSize="24px" borderRadius="full" bg="blackAlpha.500" zIndex={1}>
                      <Music size={12} color={textColor} />
                    </Center>
                  )}
                </Box>
              ) : (
                <Center boxSize="24px" flexShrink={0} borderRadius="full" bg="whiteAlpha.200">
                  <Music size={12} color={textColor} />
                </Center>
              )}
              <Box flex={1} minW={0} overflow="hidden">
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  color={textColor}
                  noOfLines={1}
                  title={hasYouTubeSound ? (currentStory.sound?.title || currentStory.sound?.artist || 'Song') : 'Background Music'}
                >
                  {hasYouTubeSound
                    ? [currentStory.sound?.title, currentStory.sound?.artist].filter(Boolean).join(' · ') || 'Song'
                    : 'Background Music'}
                </Text>
              </Box>
              <IconButton
                icon={<X size={24} />}
                aria-label="Close song"
                variant="ghost"
                color={textColor}
                borderRadius="full"
                flexShrink={0}
                bg={useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.1)')}
                border="1px solid"
                borderColor={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
                sx={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSongExpanded(false);
                }}
              />
          </HStack>
        ) : (
          /* Normal: user name line + song avatar only (in same row) */
          <>
            <HStack
              spacing={3}
              bg={useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.1)')}
              border="1px solid"
              borderColor={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
              borderRadius="full"
              px={2}
              py={1.5}
              sx={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <Box position="relative" flexShrink={0}>
                <Avatar boxSize="40px" name={user?.name} src={user?.profileImage || user?.profilePicture} />
                {user?.subscription?.badgeType && (
                  <Box
                    position="absolute"
                    bottom="-1px"
                    right="-1px"
                  >
                    <VerifiedBadge badgeType={user.subscription.badgeType} size={12} />
                  </Box>
                )}
              </Box>
              <HStack spacing={2} align="center" flexWrap="wrap">
                <Text color={textColor} fontWeight="bold" fontSize="sm">
                  {user?.name}
                </Text>
                <Text color={textColor} fontSize="xs" opacity={0.8}>
                  {formatStoryTime(currentStory.createdAt)}
                </Text>
              </HStack>
              {(hasYouTubeSound || hasUploadedAudio) && (
                <Tooltip
                  label={hasYouTubeSound ? (currentStory.sound?.title || 'Tap to see song') : 'Background Music'}
                  placement="bottom"
                  hasArrow
                  bg="blackAlpha.800"
                  color="white"
                  openDelay={300}
                >
                  <Box
                    as="button"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSongExpanded(true);
                    }}
                    cursor="pointer"
                    flexShrink={0}
                    borderRadius="full"
                    overflow="visible"
                    border="none"
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                    aria-label="Show song"
                    position="relative"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxSize="24px"
                    minW="24px"
                    minH="24px"
                  >
                    {hasYouTubeSound && currentStory.sound?.thumbnail ? (
                      <Image
                        src={currentStory.sound.thumbnail}
                        alt="Song"
                        position="absolute"
                        inset={0}
                        boxSize="24px"
                        borderRadius="full"
                        objectFit="cover"
                        zIndex={1}
                      />
                    ) : (
                      <Center position="absolute" inset={0} boxSize="24px" borderRadius="full" bg="blackAlpha.600" zIndex={1}>
                        <Music size={12} color={textColor} />
                      </Center>
                    )}
                  </Box>
                </Tooltip>
              )}
            </HStack>
          </>
        )}
        <IconButton
          icon={<X size={24} />}
          onClick={handleClose}
          aria-label="Close"
          variant="ghost"
          color={textColor}
          _hover={{ bg: 'whiteAlpha.200' }}
          flexShrink={0}
          bg={useColorModeValue('rgba(255, 255, 255, 0.1)', 'rgba(0, 0, 0, 0.1)')}
          border="1px solid"
          borderColor={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
          borderRadius="full"
          sx={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        />
      </Box>

      {/* Story Content - full height: mobile 100vw×100vh, desktop 9:16 frame at 100vh height */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display={{ base: 'block', md: 'flex' }}
        alignItems={{ md: 'center' }}
        justifyContent={{ md: 'center' }}
        data-story-media
      >
        <Box
          position={{ base: 'absolute', md: 'relative' }}
          top={{ base: 0, md: undefined }}
          left={{ base: 0, md: undefined }}
          right={{ base: 0, md: undefined }}
          bottom={{ base: 0, md: undefined }}
          w={{ base: '100vw', md: '56.25vh' }}
          h={{ base: '100vh', md: '100vh' }}
          maxW={{ md: '100vw' }}
          overflow="hidden"
          borderRadius={{ base: 0, md: '16px' }}
        >
          {currentStory.mediaType === 'image' ? (
            <Image
              src={currentStory.mediaUrl}
              alt="Story"
              position="absolute"
              top={0}
              left={0}
              w="100%"
              h="100%"
              objectFit="cover"
              cursor="pointer"
              onClick={(e) => {
                if (e.button !== 0) return;
                if (Date.now() - lastTouchEndTime.current < 400) return;
                handleScreenTap(e.clientX);
              }}
              sx={{
                WebkitTouchCallout: 'default',
                userSelect: 'auto',
                pointerEvents: 'auto',
              }}
            />
          ) : (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              cursor="pointer"
              onClick={(e) => {
                if (e.target.closest('button')) return;
                if (Date.now() - lastTouchEndTime.current < 400) return;
                handleScreenTap(e.clientX);
              }}
            >
              <Box
                as="video"
                ref={videoRef}
                src={currentStory.mediaUrl}
                position="absolute"
                top={0}
                left={0}
                w="100%"
                h="100%"
                objectFit="cover"
                autoPlay
                loop={false}
                playsInline
              />
            </Box>
          )}
        </Box>
      </Box>

        {/* Navigation Buttons */}
        <IconButton
          icon={<ChevronLeft size={24} />}
          position="absolute"
          left={4}
          top="50%"
          transform="translateY(-50%)"
          onClick={handlePrevious}
          aria-label="Previous story"
          variant="ghost"
          color={textColor}
          _hover={{ bg: 'whiteAlpha.200' }}
          display={{ base: 'none', md: 'flex' }}
        />
        <IconButton
          icon={<ChevronRight size={24} />}
          position="absolute"
          right={4}
          top="50%"
          transform="translateY(-50%)"
          onClick={handleNext}
          aria-label="Next story"
          variant="ghost"
          color={textColor}
          _hover={{ bg: 'whiteAlpha.200' }}
          display={{ base: 'none', md: 'flex' }}
        />

        {/* View Count & Viewers Button (Only for story owner) */}
        {isStoryOwner && (
          <HStack
            position="absolute"
            bottom={4}
            right={4}
            spacing={3}
            bg="blackAlpha.700"
            backdropFilter="blur(10px)"
            borderRadius="full"
            px={3}
            py={2}
            cursor="pointer"
            onClick={() => setIsViewersOpen(true)}
            _hover={{ bg: 'blackAlpha.800' }}
            transition="all 0.2s"
            zIndex={10}
          >
            <HStack spacing={1}>
              <Eye size={16} color="white" />
              <Text color="white" fontSize="sm" fontWeight="medium">
                {viewCount}
              </Text>
            </HStack>
            {likeCount > 0 && (
              <>
                <Divider orientation="vertical" h="16px" borderColor="whiteAlpha.300" />
                <HStack spacing={1}>
                  <Heart size={16} color="white" fill="white" />
                  <Text color="white" fontSize="sm" fontWeight="medium">
                    {likeCount}
                  </Text>
                </HStack>
              </>
            )}
          </HStack>
        )}
      </Box>

      {/* Viewers Modal: only show when owner and open; close when switching story */}
      <Modal
        isOpen={isViewersOpen && !!isStoryOwner}
        onClose={() => setIsViewersOpen(false)}
        size="md"
        motionPreset="slideInBottom"
      >
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <ModalContent
          bg={useColorModeValue('white', 'gray.800')}
          borderRadius="16px 16px 0 0"
          maxH="80vh"
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          m={0}
          borderTopRadius="16px"
        >
          <ModalHeader
            borderBottom="1px solid"
            borderColor={useColorModeValue('gray.200', 'gray.600')}
            pb={3}
          >
            <VStack spacing={1} align="stretch">
              <Text fontSize="lg" fontWeight="bold">
                Viewers
              </Text>
              <HStack spacing={4} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                <Text>{viewCount} {viewCount === 1 ? 'view' : 'views'}</Text>
                {likeCount > 0 && (
                  <Text>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
                )}
              </HStack>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0} maxH="60vh" overflowY="auto">
            {viewers.length === 0 ? (
              <Center py={10}>
                <VStack spacing={2}>
                  <Eye size={48} color={useColorModeValue('gray.400', 'gray.500')} />
                  <Text color={useColorModeValue('gray.600', 'gray.400')}>
                    No viewers yet
                  </Text>
                </VStack>
              </Center>
            ) : (
              <VStack spacing={0} align="stretch">
                {/* Likers Section */}
                {viewers.filter(v => v.hasLiked).length > 0 && (
                  <>
                    <Box px={4} py={3} bg={useColorModeValue('gray.50', 'gray.700')}>
                      <HStack spacing={2}>
                        <Heart size={16} color="#ef4444" fill="#ef4444" />
                        <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue('gray.700', 'gray.200')}>
                          Likes
                        </Text>
                      </HStack>
                    </Box>
                    {viewers
                      .filter(v => v.hasLiked)
                      .map((viewer, idx) => (
                        <HStack
                          key={viewer._id || idx}
                          px={4}
                          py={3}
                          _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
                          cursor="pointer"
                          onClick={() => {
                            navigate(`/user/profile/${viewer.viewer._id}`);
                            setIsViewersOpen(false);
                          }}
                        >
                          <Avatar
                            size="sm"
                            name={viewer.viewer?.name}
                            src={viewer.viewer?.profileImage || viewer.viewer?.profilePicture}
                          />
                          <VStack align="start" spacing={0} flex={1}>
                            <HStack spacing={2}>
                              <Text fontWeight="medium" fontSize="sm">
                                {viewer.viewer?.name}
                              </Text>
                              {viewer.emoji && (
                                <Text fontSize="sm">{viewer.emoji}</Text>
                              )}
                            </HStack>
                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                              {new Date(viewer.viewedAt || viewer.createdAt).toLocaleString()}
                            </Text>
                          </VStack>
                        </HStack>
                      ))}
                    <Divider />
                  </>
                )}
                
                {/* Other Viewers Section */}
                {viewers.filter(v => !v.hasLiked).length > 0 && (
                  <>
                    {viewers.filter(v => v.hasLiked).length > 0 && (
                      <Box px={4} py={3} bg={viewerSectionBg}>
                        <Text fontSize="sm" fontWeight="semibold" color={viewerSectionText}>
                          Other viewers
                        </Text>
                      </Box>
                    )}
                    {viewers
                      .filter(v => !v.hasLiked)
                      .map((viewer, idx) => (
                        <HStack
                          key={viewer._id || idx}
                          px={4}
                          py={3}
                          _hover={{ bg: viewerHoverBg }}
                          cursor="pointer"
                          onClick={() => {
                            navigate(`/user/profile/${viewer.viewer._id}`);
                            setIsViewersOpen(false);
                          }}
                        >
                          <Avatar
                            size="sm"
                            name={viewer.viewer?.name}
                            src={viewer.viewer?.profileImage || viewer.viewer?.profilePicture}
                          />
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontWeight="medium" fontSize="sm">
                              {viewer.viewer?.name}
                            </Text>
                            <Text fontSize="xs" color={useColorModeValue('gray.500', 'gray.400')}>
                              {new Date(viewer.viewedAt || viewer.createdAt).toLocaleString()}
                            </Text>
                          </VStack>
                        </HStack>
                      ))}
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Hidden Audio Elements */}
      {hasUploadedAudio && (
        <Box
          as="audio"
          ref={audioRef}
          src={currentStory.musicUrl || currentStory.musicFile}
          loop={!currentStory.musicEndTime}
          preload="auto"
          style={{ display: 'none' }}
        />
      )}

      {/* Hidden YouTube Player */}
      {hasYouTubeSound && (currentStory.sound.preview_url || currentStory.sound.video_id) && (() => {
        const embedUrl = currentStory.sound.preview_url || `https://www.youtube.com/embed/${currentStory.sound.video_id}`;
        const iframeSrc = buildYouTubeEmbedUrl(embedUrl, { start: currentStory.sound.startTime || 0, end: currentStory.sound.endTime ?? undefined, mute: 1 });
        return (
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
            ref={youtubeIframeRef}
            as="iframe"
            width="1"
            height="1"
            src={iframeSrc}
            allow="autoplay; encrypted-media"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ border: 'none' }}
            key={`${currentStory._id}-${currentStory.sound.video_id}`}
            onLoad={() => {
              storySoundStartRef.current?.();
              setTimeout(() => storySoundStartRef.current?.(), 500);
            }}
          />
        </Box>
        );
      })()}
    </Box>
  );
};

export default StoryViewer;

