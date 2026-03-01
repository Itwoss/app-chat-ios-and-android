import { useEffect, useRef } from 'react';

const SAMPLE_SIZE = 80;
const GLOW_SCALE = 1.4;
const GLOW_OPACITY = 0.75;

/**
 * Ambient glow engine (YouTube-style): samples media into a small offscreen canvas,
 * draws it scaled + centered onto the glow canvas; CSS blur + saturate does the rest.
 * Canvas is sized to its container; opacity is set when first drawn for fade-in.
 *
 * @param {React.RefObject<HTMLImageElement|HTMLVideoElement|null>} mediaRef - ref to img or video
 * @param {React.RefObject<HTMLCanvasElement|null>} canvasRef - ref to the glow canvas
 * @param {{ type: 'image' | 'video'; isPlaying?: boolean; fps?: number; sampleSize?: number }} options
 */
export function useAmbientGlow(mediaRef, canvasRef, options = {}) {
  const { type, isPlaying = false, fps = type === 'video' ? 24 : 6, sampleSize = SAMPLE_SIZE, enabled = true, glowOpacity = GLOW_OPACITY } = options;
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const timeoutRef = useRef(null);
  const interval = 1000 / fps;
  const offscreenRef = useRef(null);
  const offCtxRef = useRef(null);

  useEffect(() => {
    if (!enabled || !canvasRef?.current || !mediaRef?.current) {
      if (canvasRef?.current) canvasRef.current.style.opacity = '0';
      return;
    }
    const media = mediaRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    if (!container) return;

    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = sampleSize;
      off.height = sampleSize;
      offscreenRef.current = off;
      offCtxRef.current = off.getContext('2d');
    }
    const offscreen = offscreenRef.current;
    const offCtx = offCtxRef.current;
    if (!offCtx) return;

    const draw = () => {
      if (media.tagName === 'VIDEO' && (media.readyState < 2 || (media.paused && media.currentTime === 0))) return;
      if (media.tagName === 'IMG' && !media.complete) return;

      const W = container.offsetWidth;
      const H = container.offsetHeight;
      if (!W || !H) return;

      try {
        offCtx.drawImage(media, 0, 0, sampleSize, sampleSize);
      } catch (_) {
        offCtx.fillStyle = '#333';
        offCtx.fillRect(0, 0, sampleSize, sampleSize);
      }

      canvas.width = W;
      canvas.height = H;
      const scale = GLOW_SCALE;
      const sw = W * scale;
      const sh = H * scale;
      const ox = (W - sw) / 2;
      const oy = (H - sh) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(offscreen, ox, oy, sw, sh);
      canvas.style.opacity = String(glowOpacity);
    };

    if (type === 'image') {
      const run = () => {
        rafRef.current = requestAnimationFrame((ts) => {
          run();
          if (ts - lastTimeRef.current < interval) return;
          lastTimeRef.current = ts;
          draw();
        });
      };
      const stop = () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        draw();
      };
      if (media.tagName === 'IMG' && media.complete) {
        run();
        timeoutRef.current = setTimeout(stop, 2000);
        return () => {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        };
      }
      const onLoad = () => {
        run();
        timeoutRef.current = setTimeout(stop, 2000);
      };
      media.addEventListener('load', onLoad);
      return () => {
        media.removeEventListener('load', onLoad);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      };
    }

    if (!isPlaying) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    const loop = (ts) => {
      rafRef.current = requestAnimationFrame(loop);
      if (ts - lastTimeRef.current < interval) return;
      lastTimeRef.current = ts;
      draw();
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [mediaRef, canvasRef, type, isPlaying, fps, sampleSize, enabled, glowOpacity]);
}
