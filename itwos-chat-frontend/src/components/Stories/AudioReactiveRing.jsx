import { Box } from '@chakra-ui/react';
import { useEffect, useId, useRef, useState } from 'react';

const POINTS = 180;
const TEAL_NEON = '#19f6ff';
const TEAL_GLOW = '#00E5CC';

/**
 * Full 360° circular waveform around the song avatar.
 * - Local <audio>: createMediaElementSource + AnalyserNode.
 * - YouTube: tries captureStream (iframe); falls back to idle wave if unsupported.
 * - Smooth radial distortion, neon glow, syncs with play/pause.
 */
export default function AudioReactiveRing({
  audioRef,
  youtubeIframeRef = null,
  isYouTube = false,
  size = 40,
  isPlaying = true,
  strokeColor = TEAL_NEON,
  strokeWidth = 2.2,
  smoothing = 0.6,
  strength = 10,
}) {
  const filterId = useId().replace(/:/g, '');
  const polylineRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const youtubeStreamRef = useRef(null);
  const [hasAnalyser, setHasAnalyser] = useState(false);
  const idleTRef = useRef(0);

  const r = size / 2 - strokeWidth - 1;
  const cx = size / 2;
  const cy = size / 2;

  const setupUploadedAudio = () => {
    const el = audioRef?.current;
    if (!el || (el.tagName !== 'AUDIO' && el.tagName !== 'VIDEO')) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      const source = ctx.createMediaElementSource(el);
      sourceRef.current = source;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = smoothing;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      setHasAnalyser(true);
    } catch (err) {
      setHasAnalyser(false);
    }
  };

  const setupYouTubeAudio = async () => {
    if (!youtubeIframeRef?.current) {
      setHasAnalyser(false);
      return;
    }
    try {
      // captureStream exists on HTMLMediaElement/HTMLCanvasElement, not on iframe in standard browsers
      const iframe = youtubeIframeRef.current;
      const stream = iframe.captureStream ? iframe.captureStream() : null;
      if (!stream) {
        setHasAnalyser(false);
        return;
      }
      youtubeStreamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = smoothing;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      setHasAnalyser(true);
    } catch (err) {
      setHasAnalyser(false);
    }
  };

  const drawWaveform = () => {
    const polyline = polylineRef.current;
    const analyser = analyserRef.current;
    const data = dataArrayRef.current;

    if (!polyline) return;

    if (analyser && data && hasAnalyser) {
      analyser.getByteFrequencyData(data);
      const points = [];
      for (let i = 0; i < POINTS; i++) {
        const angle = (i / POINTS) * Math.PI * 2;
        const audioIndex = Math.floor((i / POINTS) * data.length);
        const amplitude = (data[audioIndex] / 255) * strength;
        const radius = r + amplitude;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      polyline.setAttribute('points', points.join(' '));
    } else {
      // Idle: full 360° gentle wave when no analyser (YouTube or not playing)
      idleTRef.current += 0.04;
      const t = idleTRef.current;
      const points = [];
      for (let i = 0; i < POINTS; i++) {
        const angle = (i / POINTS) * Math.PI * 2;
        const amplitude = (Math.sin(angle * 6 + t) * 0.5 + 0.5) * strength * 0.4 + strength * 0.15;
        const radius = r + amplitude;
        const x = cx + radius * Math.cos(angle);
        const y = cy + radius * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      polyline.setAttribute('points', points.join(' '));
    }
  };

  useEffect(() => {
    setHasAnalyser(false);
    if (isYouTube) {
      setupYouTubeAudio();
    } else {
      setupUploadedAudio();
    }
    return () => {
      if (sourceRef.current && audioContextRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (_) {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      analyserRef.current = null;
      audioContextRef.current = null;
      sourceRef.current = null;
    };
  }, [isYouTube, isPlaying]);

  useEffect(() => {
    let frameId = null;
    const animate = () => {
      drawWaveform();
      frameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frameId);
  }, [hasAnalyser, isPlaying, strength]);

  return (
    <Box
      as="span"
      display="inline-block"
      width={size}
      height={size}
      minWidth={size}
      minHeight={size}
      position="relative"
      flexShrink={0}
      sx={{
        '& svg': { display: 'block', overflow: 'visible', verticalAlign: 'middle' },
        isolation: 'isolate',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible', pointerEvents: 'none' }}
      >
        <defs>
          <filter id={`audioRingGlow-${filterId}`} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
            <feFlood floodColor={TEAL_GLOW} floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polyline
          ref={polylineRef}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#audioRingGlow-${filterId})`}
          points=""
        />
      </svg>
    </Box>
  );
}
