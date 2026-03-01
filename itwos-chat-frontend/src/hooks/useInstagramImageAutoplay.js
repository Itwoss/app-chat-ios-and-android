import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Instagram-style autoplay for image posts with music.
 *
 * - User taps play once → sessionSoundOn = true → next posts autoplay when they become top-visible.
 * - Only the single overall top-visible post plays (same as YouTube); if it's this image+music post, play it.
 * - visibilityVersion from context bumps on every visibility update so this effect re-runs and can autoplay the next song.
 */
export default function useInstagramImageAutoplay({
  postId,
  hasMusic,
  playMusic,
  stopMusic,
  setSessionSoundOn,
  sessionSoundOn,
  getTopVisibleImageMusic,
  getTopVisiblePostId,
  getTopVisibleVisibility,
  getTopVisibleVisibilitySecond,
  visibilityVersion,
  setVisibility,
  clearVisibility,
  registerImageMusic,
  unregisterImageMusic,
  rootRef = null,
}) {
  const ref = useRef(null);
  const [element, setElement] = useState(null);

  const playRef = useRef(playMusic);
  const stopRef = useRef(stopMusic);
  playRef.current = playMusic;
  stopRef.current = stopMusic;

  // Never call setElement(null) on unmount — it triggers state updates during teardown and causes DOM/remount loops.
  const refCallback = useCallback((node) => {
    ref.current = node;
    if (node !== null) setElement(node);
  }, []);

  /* IntersectionObserver: report visibility so context map + visibilityVersion update */
  useEffect(() => {
    if (!hasMusic || !element) return;
    if (!setVisibility || !registerImageMusic || !unregisterImageMusic) return;

    const root = rootRef?.current ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const percent = entry.intersectionRatio * 100;
          setVisibility(postId, percent);
        });
      },
      { threshold: [0, 0.25, 0.5, 0.65, 0.8, 1], root }
    );

    observer.observe(element);

    registerImageMusic(postId, {
      playMusic: (id, opts) => playRef.current?.(id, opts),
      stopMusic: (id) => stopRef.current?.(id),
    });

    return () => {
      unregisterImageMusic(postId);
      observer.disconnect();
      clearVisibility?.(postId);
    };
  }, [
    postId,
    hasMusic,
    element,
    rootRef,
    setVisibility,
    clearVisibility,
    registerImageMusic,
    unregisterImageMusic,
  ]);

  /* Autoplay only when this post is the single dominant visible post; auto-off when not visible or when multiple posts visible. */
  useEffect(() => {
    if (!hasMusic || !getTopVisiblePostId || !getTopVisibleVisibility) return;

    let cancelled = false;
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        const overallTopId = getTopVisiblePostId();
        const topVis = getTopVisibleVisibility?.() ?? 0;
        const secondVis = getTopVisibleVisibilitySecond?.() ?? 0;
        const idStr = String(postId);
        const isOverallTop = overallTopId != null && String(overallTopId) === idStr;
        // Only autoplay when ONE post is clearly dominant (no song in multi-post area e.g. Trending + feed)
        const minVisible = 65;
        const maxSecondVisible = 25;

        if (isOverallTop && topVis >= minVisible && secondVis < maxSecondVisible && sessionSoundOn) {
          playRef.current?.(postId, { startMuted: false });
        } else {
          stopRef.current?.(postId);
        }
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [visibilityVersion, sessionSoundOn, getTopVisiblePostId, getTopVisibleVisibility, getTopVisibleVisibilitySecond, postId, hasMusic]);

  const handlePlay = useCallback(() => {
    setSessionSoundOn?.(true);
    playRef.current?.(postId, { startMuted: false });
  }, [postId, setSessionSoundOn]);

  const handleStop = useCallback(() => {
    setSessionSoundOn?.(false);
    stopRef.current?.(postId);
  }, [postId, setSessionSoundOn]);

  return { ref: refCallback, handlePlay, handleStop };
}
