import { useRef, useEffect, useCallback } from 'react';
import { Box } from '@chakra-ui/react';

/**
 * Minimal reel video: play when visible, pause and reset when not.
 * Single tap on video toggles play/pause (feed page; no double-tap like on feed).
 * Calls onProgress(0-1) for playback timeline.
 */
export default function ReelVideo({ videoUrl, isVisible, muted = true, loop = true, objectFit = 'cover', onProgress, videoRef: externalVideoRef }) {
  const internalRef = useRef(null);
  const videoRef = externalVideoRef ?? internalRef;

  // Force video to reflow on orientation/resize so it fills the new viewport (fixes stuck portrait)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const forceReflow = () => {
      video.style.width = '99%';
      video.style.height = '99%';
      requestAnimationFrame(() => {
        video.style.width = '100%';
        video.style.height = '100%';
      });
    };
    window.addEventListener('resize', forceReflow);
    window.addEventListener('orientationchange', forceReflow);
    return () => {
      window.removeEventListener('resize', forceReflow);
      window.removeEventListener('orientationchange', forceReflow);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isVisible) {
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
      onProgress?.(0);
    }
  }, [isVisible, onProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onProgress) return;
    const update = () => {
      const d = video.duration;
      if (!d || !isFinite(d)) return;
      const p = Math.min(1, video.currentTime / d);
      onProgress(p);
    };
    const onEnded = () => onProgress(1);
    video.addEventListener('timeupdate', update);
    video.addEventListener('loadedmetadata', update);
    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('timeupdate', update);
      video.removeEventListener('loadedmetadata', update);
      video.removeEventListener('ended', onEnded);
    };
  }, [onProgress, videoUrl]);

  const handleVideoClick = useCallback((e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  return (
    <Box
      w="100%"
      h="100%"
      minH={0}
      cursor="pointer"
      onClick={handleVideoClick}
      sx={{ '& video': { pointerEvents: 'none', width: '100%', height: '100%', objectFit } }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        muted={muted}
        loop={loop}
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit,
        }}
      />
    </Box>
  );
}
