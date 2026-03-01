import { useState, useRef, useCallback, useEffect } from 'react';
import { Box, IconButton } from '@chakra-ui/react';
import { Play, Volume2, VolumeX } from 'lucide-react';

const RATIO_MAP = {
  '1:1': '1 / 1',
  '4:5': '4 / 5',
  '16:9': '16 / 9',
  '9:16': '9 / 16',
};


/**
 * Video player for post feed: click to play, when playing only pause + mute visible.
 * When autoplayWhenVisible (reels): show thumbnail + play icon + circular loading for 1s, then autoplay.
 * @param {string} videoUrl - Cloudinary video URL
 * @param {string} [thumbnailUrl] - Optional thumbnail URL (from post.videoThumbnail)
 * @param {string} [videoRatio] - '1:1' | '4:5' | '16:9' | '9:16', default '4:5'
 * @param {(playing: boolean) => void} [onPlayingChange] - Called when play/pause/end
 * @param {boolean} [autoplayWhenVisible] - Reels: autoplay immediately when visible (no loading delay)
 * @param {() => void} [onUserRequestPlay] - When provided, user click opens full-screen elsewhere (e.g. feed) instead of playing here
 * @param {boolean} [soundOn] - When true, play video with sound (unmuted); controlled by feed for reels
 * @param {() => void} [onRequestSound] - Reels: when user taps speaker, notify feed to set this reel as sound source
 * @param {() => void} [onRequestMute] - Reels: when user taps mute, notify feed to clear session sound
 * @param {boolean} [showMuteControl] - When false, hide the mute overlay (use when post has no added music; default true)
 */
export default function VideoPostPlayer({
  videoUrl,
  thumbnailUrl = null,
  videoRatio = '4:5',
  onPlayingChange = () => {},
  onVideoRef = null,
  autoplayWhenVisible = false,
  onUserRequestPlay = null,
  soundOn = false,
  onRequestSound = null,
  onRequestMute = null,
  showMuteControl = true,
  objectFit = 'cover',
  trimStart: trimStartProp = null,
  trimEnd: trimEndProp = null,
  preload = 'metadata',
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(!soundOn);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const playRef = useRef(() => {});
  const pauseRef = useRef(() => {});
  const autoplayTriggeredAtRef = useRef(0);
  const notifyPlayingRef = useRef(() => {});

  // Each card observes its own viewport (Instagram-style: autoplay when ≥50% visible)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.5),
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (onVideoRef && videoRef.current) onVideoRef(videoRef.current);
    return () => { if (onVideoRef) onVideoRef(null); };
  }, [onVideoRef, videoUrl]);

  const trimStart = trimStartProp != null ? trimStartProp : 0;
  const trimEnd = trimEndProp != null ? trimEndProp : null;
  const hasTrim = trimEnd != null;

  // Derived before any callback that uses it (avoids "before initialization" error)
  const effectiveVisible = autoplayWhenVisible && isInView;

  const aspectRatio = RATIO_MAP[videoRatio] || RATIO_MAP['4:5'];

  const notifyPlaying = useCallback(
    (playing) => {
      setIsPlaying(playing);
      onPlayingChange(playing);
    },
    [onPlayingChange]
  );
  notifyPlayingRef.current = notifyPlaying;

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const wantUnmuted = soundOn;
    video.muted = !wantUnmuted;
    if (wantUnmuted) setIsMuted(false);
    const onPlaySuccess = () => {
      setShowThumbnail(false);
      notifyPlaying(true);
    };
    video.play().then(onPlaySuccess).catch(() => {
      if (wantUnmuted) {
        video.muted = true;
        setIsMuted(true);
        video.play().then(onPlaySuccess).catch(() => {});
      }
    });
  }, [soundOn, notifyPlaying]);
  playRef.current = play;

  const pause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setShowThumbnail(true);
    notifyPlaying(false);
  }, [notifyPlaying]);
  pauseRef.current = pause;

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      play();
    } else {
      pause();
    }
  }, [play, pause]);

  const toggleMute = useCallback((e) => {
    e.stopPropagation();
    if (soundOn && onRequestMute) {
      onRequestMute();
      return;
    }
    if (onRequestSound) {
      onRequestSound();
      return;
    }
    setIsMuted((m) => {
      const video = videoRef.current;
      if (video) video.muted = !m;
      return !m;
    });
  }, [soundOn, onRequestSound, onRequestMute]);

  // Sync muted state when soundOn changes (e.g. reels: only active reel has sound)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const wantUnmuted = soundOn;
    video.muted = !wantUnmuted;
    setIsMuted(!wantUnmuted);
  }, [soundOn]);

  // Reels: when visible → autoplay muted; when not visible → pause + clear sound so next scroll-in is muted
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!autoplayWhenVisible) {
      video.pause();
      video.currentTime = hasTrim ? trimStart : 0;
      setShowThumbnail(true);
      notifyPlayingRef.current(false);
      return;
    }
    if (effectiveVisible) {
      video.muted = !soundOn;
      autoplayTriggeredAtRef.current = Date.now();
      playRef.current?.();
    } else {
      video.pause();
      video.currentTime = hasTrim ? trimStart : 0;
      setShowThumbnail(true);
      notifyPlayingRef.current(false);
    }
  }, [autoplayWhenVisible, effectiveVisible, soundOn, hasTrim, trimStart]);

  const handleEnded = useCallback(() => {
    if (effectiveVisible) {
      const video = videoRef.current;
      if (video) {
        video.currentTime = hasTrim ? trimStart : 0;
        video.play().then(() => {
          setShowThumbnail(false);
          notifyPlaying(true);
        }).catch(() => {
          setShowThumbnail(true);
          notifyPlaying(false);
        });
      }
      return;
    }
    setShowThumbnail(true);
    notifyPlaying(false);
  }, [notifyPlaying, effectiveVisible, hasTrim, trimStart]);

  const handleVideoClick = useCallback(() => {
    if (onUserRequestPlay) {
      onUserRequestPlay();
      return;
    }
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) play();
    else pause();
  }, [onUserRequestPlay, play, pause]);

  // When onUserRequestPlay is set (e.g. homepage), we do NOT capture clicks here so the parent (DoubleTapLike) can handle single-tap = open feed, double-tap = like. Mute button still captures and stops propagation.
  const captureClicks = !onUserRequestPlay;

  return (
    <Box
      ref={containerRef}
      position="relative"
      w="100%"
      h="100%"
      bg="black"
      overflow="hidden"
      cursor={captureClicks ? 'pointer' : undefined}
      onClick={captureClicks ? (e) => { e.stopPropagation(); handleVideoClick(); } : undefined}
      sx={{ '& video': { objectFit } }}
    >
      {/* Thumbnail (hidden when playing): play icon + optional circular loading ring when autoplayWhenVisible */}
      {showThumbnail && (
        <Box
          position="absolute"
          inset={0}
          zIndex={1}
          bg="black"
          onClick={captureClicks ? (e) => {
            e.stopPropagation();
            if (onUserRequestPlay) {
              onUserRequestPlay();
              return;
            }
            play();
          } : undefined}
        >
          {thumbnailUrl ? (
            <Box
              as="img"
              src={thumbnailUrl}
              alt=""
              w="100%"
              h="100%"
              objectFit={objectFit}
              pointerEvents="none"
            />
          ) : null}
          <Box
            position="absolute"
            inset={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bg="blackAlpha.400"
          >
            {/* Play icon (no loading ring – autoplay starts immediately when visible) */}
            <Box position="relative" display="flex" alignItems="center" justifyContent="center">
              <IconButton
                aria-label="Play"
                icon={<Play size={48} fill="currentColor" />}
                size="lg"
                borderRadius="full"
                color="white"
                bg="blackAlpha.6"
                _hover={{ bg: 'blackAlpha.5' }}
                onClick={captureClicks ? (e) => {
                  e.stopPropagation();
                  play();
                } : undefined}
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        preload={preload}
        playsInline
        muted={isMuted}
        style={{ width: '100%', height: '100%', objectFit }}
        onLoadedMetadata={(e) => {
          if (hasTrim && e.target) {
            e.target.currentTime = trimStart;
          }
        }}
        onTimeUpdate={(e) => {
          if (hasTrim && trimEnd != null && e.target && e.target.currentTime >= trimEnd) {
            if (effectiveVisible) {
              e.target.currentTime = trimStart;
              e.target.play().catch(() => {});
              return;
            }
            e.target.pause();
            e.target.currentTime = trimEnd;
            setShowThumbnail(true);
            notifyPlaying(false);
          }
        }}
        onEnded={handleEnded}
        onClick={captureClicks ? (e) => {
          e.stopPropagation();
          handleVideoClick();
        } : undefined}
      />

      {/* Mute overlay (only when video is playing and showMuteControl – e.g. post has added music) */}
      {showMuteControl && isPlaying && (
        <Box
          position="absolute"
          bottom={3}
          right={3}
          zIndex={2}
          pointerEvents="none"
        >
          <Box pointerEvents="auto" onClick={(e) => e.stopPropagation()}>
            <IconButton
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              icon={isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
              size="md"
              borderRadius="full"
              color="white"
              bg="blackAlpha.5"
              _hover={{ bg: 'blackAlpha.6' }}
              onClick={toggleMute}
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}

export { RATIO_MAP };
