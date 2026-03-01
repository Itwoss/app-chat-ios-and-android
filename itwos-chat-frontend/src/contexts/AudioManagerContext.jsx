import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { STORAGE_KEYS } from '../utils/storageKeys';

const AudioManagerContext = createContext(null);

function readSoundOnFromStorage() {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.AUDIO_SOUND_ON);
    return v === 'true';
  } catch {
    return false;
  }
}

export const AudioManagerProvider = ({ children }) => {
  // --- SINGLE SOURCE OF TRUTH (no local mute state anywhere) ---
  const [activePostId, setActivePostId] = useState(null);
  const [sessionSoundOn, setSessionSoundOnState] = useState(readSoundOnFromStorage);

  const activePostIdRef = useRef(null);
  const sessionSoundOnRef = useRef(sessionSoundOn);
  sessionSoundOnRef.current = sessionSoundOn;
  activePostIdRef.current = activePostId;

  // One shared Audio for uploaded music (reused per post to satisfy autoplay policy)
  const audioRef = useRef(null);
  const currentAudioUrlRef = useRef(null); // which post's url is loaded
  const youtubeIframesRef = useRef(new Map());

  // Visibility + image-music autoplay (unchanged)
  const visibilityMapRef = useRef(new Map());
  const [visibilityVersion, setVisibilityVersion] = useState(0);
  const imageMusicTickScheduledRef = useRef(false);
  const imageMusicTickTimeoutRef = useRef(null);
  const imageMusicHandlersRef = useRef(new Map());
  const playLockRef = useRef(false);

  const setSessionSoundOn = useCallback((on) => {
    const value = !!on;
    setSessionSoundOnState(value);
    try {
      if (value) localStorage.setItem(STORAGE_KEYS.AUDIO_SOUND_ON, 'true');
      else localStorage.setItem(STORAGE_KEYS.AUDIO_SOUND_ON, 'false');
    } catch (_) {}
  }, []);

  // --- STOP ALL EXCEPT (strict) ---
  const stopAllExcept = useCallback((keepPostId) => {
    const keep = keepPostId != null ? String(keepPostId) : null;

    // Stop uploaded audio if it's not the one we're keeping
    if (audioRef.current && currentAudioUrlRef.current !== keep) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        if (keep === null) {
          audioRef.current.src = '';
          audioRef.current.load();
          currentAudioUrlRef.current = null;
        }
      } catch (e) { /* ignore */ }
    }

    // Stop all YouTube iframes except keepPostId
    youtubeIframesRef.current.forEach((iframe, postId) => {
      if (String(postId) === keep) return;
      if (iframe?.contentWindow) {
        try {
          iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":[]}', '*');
          iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":[]}', '*');
        } catch (e) { /* ignore */ }
      }
    });

    if (keep === null) {
      setActivePostId(null);
      activePostIdRef.current = null;
    }
  }, []);

  // --- APPLY MUTED TO ACTIVE (direct DOM, no React) ---
  const applyMutedToActive = useCallback((soundOn) => {
    const id = activePostIdRef.current;
    if (id == null) return;
    const muted = !soundOn;

    const iframe = youtubeIframesRef.current.get(id);
    if (iframe?.contentWindow) {
      try {
        if (muted) {
          iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":[]}', '*');
        } else {
          iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":[]}', '*');
          iframe.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[100]}', '*');
        }
      } catch (e) { /* ignore */ }
      return;
    }

    if (audioRef.current && currentAudioUrlRef.current === String(id)) {
      audioRef.current.muted = muted;
    }
  }, []);

  // --- TOGGLE SOUND (direct DOM first, then state) ---
  const toggleSessionSound = useCallback(() => {
    const newState = !sessionSoundOnRef.current;
    applyMutedToActive(newState);
    setSessionSoundOnState(newState);
    try {
      if (newState) localStorage.setItem(STORAGE_KEYS.AUDIO_SOUND_ON, 'true');
      else localStorage.setItem(STORAGE_KEYS.AUDIO_SOUND_ON, 'false');
    } catch (_) {}
  }, [applyMutedToActive]);

  // --- PLAY POST (strict: always set audio.muted = !sessionSoundOn) ---
  const playPost = useCallback(async (postId, options = {}) => {
    const { audioUrl, isYouTube, iframeRef } = options;
    const idStr = String(postId);
    if (playLockRef.current) return;
    playLockRef.current = true;

    try {
      stopAllExcept(postId);

      if (isYouTube && (iframeRef?.current || youtubeIframesRef.current.get(postId))) {
        const iframe = iframeRef?.current || youtubeIframesRef.current.get(postId);
        if (iframe) youtubeIframesRef.current.set(postId, iframe);
        if (!iframe?.contentWindow) {
          playLockRef.current = false;
          return;
        }
        const soundOn = sessionSoundOnRef.current;
        try {
          if (soundOn) {
            iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":[]}', '*');
            iframe.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[100]}', '*');
          } else {
            iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":[]}', '*');
          }
          const iframeSrc = iframe.src || '';
          const startMatch = iframeSrc.match(/[?&]start=(\d+)/);
          const startTime = startMatch ? parseInt(startMatch[1], 10) : 0;
          if (startTime > 0) {
            iframe.contentWindow.postMessage(`{"event":"command","func":"seekTo","args":[${startTime},true]}`, '*');
          }
          iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":[]}', '*');
        } catch (e) {
          console.error('[AudioManager] YouTube play error:', e);
        }
        setActivePostId(postId);
        activePostIdRef.current = postId;
        playLockRef.current = false;
        return;
      }

      if (audioUrl) {
        const soundOn = sessionSoundOnRef.current;
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        const audio = audioRef.current;
        if (typeof audioUrl === 'string' && audioUrl.length > 0) {
          audio.src = audioUrl;
          audio.currentTime = 0;
          audio.muted = !soundOn;
          currentAudioUrlRef.current = idStr;
          await audio.play();
          setActivePostId(postId);
          activePostIdRef.current = postId;
        }
      }
    } catch (error) {
      if (error?.name !== 'NotAllowedError' && error?.name !== 'AbortError') {
        console.error('[AudioManager] playPost error:', error);
      }
      setActivePostId(null);
      activePostIdRef.current = null;
      currentAudioUrlRef.current = null;
    } finally {
      playLockRef.current = false;
    }
  }, [stopAllExcept]);

  // --- STOP THIS POST ---
  const stopPost = useCallback((postId) => {
    const idStr = String(postId);
    if (currentAudioUrlRef.current === idStr && audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current.load();
      } catch (e) { /* ignore */ }
      currentAudioUrlRef.current = null;
    }
    const iframe = youtubeIframesRef.current.get(postId);
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":[]}', '*');
        iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":[]}', '*');
      } catch (e) { /* ignore */ }
    }
    if (activePostIdRef.current === postId || String(activePostIdRef.current) === idStr) {
      setActivePostId(null);
      activePostIdRef.current = null;
    }
  }, []);

  // --- STOP ALL (for route controller / tab hide) ---
  const stopAll = useCallback(() => {
    stopAllExcept(null);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current.load();
      } catch (e) { /* ignore */ }
      currentAudioUrlRef.current = null;
    }
  }, [stopAllExcept]);

  // --- LEGACY: playAudio / playYouTube (delegate to playPost) ---
  const playAudio = useCallback((postId, audioUrl) => {
    playPost(postId, { audioUrl });
  }, [playPost]);

  const playYouTube = useCallback((postId, iframeRef, opts = {}) => {
    playPost(postId, { isYouTube: true, iframeRef });
  }, [playPost]);

  const stopAudio = useCallback(() => {
    if (currentAudioUrlRef.current != null) {
      const id = currentAudioUrlRef.current;
      stopPost(id);
    }
  }, [stopPost]);

  const stopYouTube = useCallback((postId) => {
    stopPost(postId);
  }, [stopPost]);

  // --- Visibility + autoplay tick (unchanged logic) ---
  const toRatio = (v) => (v != null && typeof v === 'object' && typeof v.ratio === 'number' ? v.ratio : typeof v === 'number' ? v : 0);

  const getTopVisiblePostId = useCallback(() => {
    const map = visibilityMapRef.current;
    const MIN = 45;
    let topmostId = null;
    let topmostTop = Infinity;
    let maxRatioId = null;
    let maxRatio = 0;
    map.forEach((v, id) => {
      const ratio = toRatio(v);
      const top = (v != null && typeof v === 'object' && typeof v.top === 'number') ? v.top : Infinity;
      if (ratio >= MIN && top < topmostTop) {
        topmostTop = top;
        topmostId = id;
      }
      if (ratio > maxRatio) {
        maxRatio = ratio;
        maxRatioId = id;
      }
    });
    return topmostId != null ? topmostId : maxRatioId;
  }, []);

  const getTopVisibleVisibility = useCallback(() => {
    const topId = getTopVisiblePostId();
    if (topId == null) return 0;
    return toRatio(visibilityMapRef.current.get(topId));
  }, [getTopVisiblePostId]);

  const getTopVisibleVisibilitySecond = useCallback(() => {
    let first = 0;
    let second = 0;
    visibilityMapRef.current.forEach((v) => {
      const r = toRatio(v);
      if (r > first) {
        second = first;
        first = r;
      } else if (r > second) second = r;
    });
    return second;
  }, []);

  const getTopVisibleImageMusic = useCallback(() => {
    const map = visibilityMapRef.current;
    const handlers = imageMusicHandlersRef.current;
    const MIN = 45;
    let topmostId = null;
    let topmostTop = Infinity;
    let topmostVis = 0;
    let maxVisId = null;
    let maxVis = 0;
    handlers.forEach((_, postId) => {
      const v = map.get(String(postId));
      const vis = toRatio(v);
      const top = (v != null && typeof v === 'object' && typeof v.top === 'number') ? v.top : Infinity;
      if (vis >= MIN && top < topmostTop) {
        topmostTop = top;
        topmostVis = vis;
        topmostId = postId;
      }
      if (vis > maxVis) {
        maxVis = vis;
        maxVisId = postId;
      }
    });
    const postId = topmostId != null ? topmostId : maxVisId;
    const visibility = topmostId != null ? topmostVis : maxVis;
    return { postId, visibility };
  }, []);

  const MIN_VISIBLE = 45;

  const runImageMusicTick = useCallback(() => {
    imageMusicTickScheduledRef.current = false;
    const map = visibilityMapRef.current;
    const handlers = imageMusicHandlersRef.current;
    const MIN = MIN_VISIBLE;
    let overallTopId = null;
    let overallTopVis = 0;
    let topmostTop = Infinity;
    handlers.forEach((_, postId) => {
      const v = map.get(String(postId));
      const vis = toRatio(v);
      const top = (v != null && typeof v === 'object' && typeof v.top === 'number') ? v.top : Infinity;
      if (vis >= MIN && top < topmostTop) {
        topmostTop = top;
        overallTopVis = vis;
        overallTopId = postId;
      } else if (overallTopId == null && vis > 0) {
        overallTopVis = vis;
        overallTopId = postId;
      }
    });
    const sessionOn = sessionSoundOnRef.current;
    const overallIdStr = overallTopId != null ? String(overallTopId) : null;
    const isImageMusicPost = overallIdStr != null && handlers.has(overallIdStr);
    const shouldPlay = sessionOn && isImageMusicPost && overallTopVis >= MIN;
    handlers.forEach((h, postId) => {
      const idStr = String(postId);
      if (shouldPlay && idStr === overallIdStr) {
        h.playMusic?.(postId, { startMuted: false });
      } else {
        h.stopMusic?.(postId);
      }
    });
  }, []);

  const scheduleImageMusicTick = useCallback(() => {
    if (imageMusicTickTimeoutRef.current != null) {
      cancelAnimationFrame(imageMusicTickTimeoutRef.current);
      imageMusicTickTimeoutRef.current = null;
    }
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        imageMusicTickTimeoutRef.current = null;
        runImageMusicTick();
      });
      imageMusicTickTimeoutRef.current = raf2;
    });
    imageMusicTickTimeoutRef.current = raf1;
  }, [runImageMusicTick]);

  const registerImageMusic = useCallback((postId, handlers) => {
    if (postId == null) return;
    const key = typeof postId === 'string' ? postId : String(postId);
    imageMusicHandlersRef.current.set(key, handlers);
  }, []);

  const unregisterImageMusic = useCallback((postId) => {
    if (postId == null) return;
    const key = typeof postId === 'string' ? postId : String(postId);
    imageMusicHandlersRef.current.delete(key);
  }, []);

  const setPostVisibility = useCallback((postId, pct, top) => {
    if (postId == null) return;
    const key = typeof postId === 'string' ? postId : String(postId);
    const ratio = typeof pct === 'number' ? pct : 0;
    const topVal = typeof top === 'number' ? top : Infinity;
    visibilityMapRef.current.set(key, { ratio, top: topVal });
    setVisibilityVersion((ver) => ver + 1);
    scheduleImageMusicTick();
  }, [scheduleImageMusicTick]);

  const clearPostVisibility = useCallback((postId) => {
    if (postId == null) return;
    const key = typeof postId === 'string' ? postId : String(postId);
    visibilityMapRef.current.delete(key);
  }, []);

  const registerYouTubeIframe = useCallback((postId, iframeElement) => {
    if (iframeElement) youtubeIframesRef.current.set(postId, iframeElement);
  }, []);

  useEffect(() => {
    return () => {
      if (imageMusicTickTimeoutRef.current != null) {
        cancelAnimationFrame(imageMusicTickTimeoutRef.current);
        imageMusicTickTimeoutRef.current = null;
      }
      stopAll();
    };
  }, [stopAll]);

  const value = {
    activePostId,
    currentPlayingPostId: activePostId,
    sessionSoundOn,
    setSessionSoundOn,
    playPost,
    stopPost,
    stopAllExcept,
    stopAll,
    toggleSessionSound,
    playAudio,
    playYouTube,
    stopAudio,
    stopYouTube,
    setPostVisibility,
    clearPostVisibility,
    getTopVisiblePostId,
    getTopVisibleVisibility,
    getTopVisibleVisibilitySecond,
    getTopVisibleImageMusic,
    visibilityVersion,
    registerImageMusic,
    unregisterImageMusic,
    registerYouTubeIframe,
    youtubeIframesRef,
    audioRef,
  };

  return (
    <AudioManagerContext.Provider value={value}>
      {children}
    </AudioManagerContext.Provider>
  );
};

export const useAudioManager = () => {
  const context = useContext(AudioManagerContext);
  if (!context) {
    throw new Error('useAudioManager must be used within AudioManagerProvider');
  }
  return context;
};
