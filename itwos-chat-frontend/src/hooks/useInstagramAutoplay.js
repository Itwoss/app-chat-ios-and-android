import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Instagram-style autoplay for YouTube (and similar) posts:
 * - Only the most visible post (≥65%) plays when sessionSoundOn is true.
 * - When sessionSoundOn is false, no autoplay (user must tap to play).
 * - Scrolling swaps autoplay between posts when sound is on.
 */
export default function useInstagramAutoplay({
  postId,
  hasMusic,
  play,
  stop,
  sessionSoundOn = false,
  setVisibility,
  clearVisibility,
  getTopVisiblePostId,
  getTopVisibleVisibility,
  getTopVisibleVisibilitySecond,
  rootRef = null,
}) {
  const ref = useRef(null);
  const [element, setElement] = useState(null);

  const playRef = useRef(play);
  const stopRef = useRef(stop);
  const getTopRef = useRef(getTopVisiblePostId);
  const getTopVisRef = useRef(getTopVisibleVisibility);
  const getSecondVisRef = useRef(getTopVisibleVisibilitySecond);
  const sessionSoundOnRef = useRef(sessionSoundOn);

  playRef.current = play;
  stopRef.current = stop;
  getTopRef.current = getTopVisiblePostId;
  getTopVisRef.current = getTopVisibleVisibility;
  getSecondVisRef.current = getTopVisibleVisibilitySecond;
  sessionSoundOnRef.current = sessionSoundOn;

  // Never call setElement(null) on unmount — it triggers state updates during teardown and causes DOM/remount loops.
  const refCallback = useCallback((node) => {
    ref.current = node;
    if (node !== null) setElement(node);
  }, []);

  useEffect(() => {
    if (!hasMusic || !element) return;
    if (!setVisibility || !getTopVisiblePostId) return;

    const idStr = String(postId);
    const root = rootRef?.current ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const percent = entry.intersectionRatio * 100;

          // Update global visibility map
          setVisibility(postId, percent);

          // Wait until after visibility map updates + scroll settles
          Promise.resolve().then(() => {
            requestAnimationFrame(() => {
              const getTop = getTopRef.current;
              const getTopVis = getTopVisRef.current;
              const getSecondVis = getSecondVisRef.current;

              if (!getTop) return;

              const topPost = getTop();
              const topVis = getTopVis ? getTopVis() : 0;
              const secondVis = getSecondVis ? getSecondVis() : 0;

              const isTop = topPost != null && String(topPost) === idStr;
              const soundOn = sessionSoundOnRef.current;
              // Only autoplay when ONE post is clearly dominant (avoids song in multi-post area e.g. Trending + feed)
              const minVisible = 65;
              const maxSecondVisible = 25; // no other post should have 25%+ visible
              const shouldPlay = soundOn && isTop && topVis >= minVisible && secondVis < maxSecondVisible;

              if (shouldPlay) {
                playRef.current?.(postId);
              } else {
                // Auto-off: stop whenever this post is not the single dominant one (e.g. scrolled away or multi-post visible)
                stopRef.current?.(postId);
              }
            });
          });
        });
      },
      {
        threshold: [0, 0.25, 0.5, 0.65, 1],
        root,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      clearVisibility?.(postId);
    };
  }, [
    postId,
    hasMusic,
    sessionSoundOn,
    setVisibility,
    clearVisibility,
    getTopVisiblePostId,
    getTopVisibleVisibility,
    getTopVisibleVisibilitySecond,
    element,
    rootRef,
  ]);

  return refCallback;
}
