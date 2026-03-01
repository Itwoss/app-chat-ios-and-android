import { useEffect, useRef, useState, useCallback } from 'react';
import { useIncrementPostViewMutation } from '../store/api/userApi';
import { getSocket } from '../utils/socket';

// Session-wide: avoid duplicate view API calls for the same post (e.g. scroll away and back, or observer re-firing)
const viewedPostIdsThisSession = new Set();

/**
 * Hook to track post views with:
 * - Total view count (lifetime, with cooldown)
 * - Live view count (real-time viewers)
 *
 * @param {string} postId - The post ID to track
 * @param {boolean} enabled - Whether tracking is enabled
 * @param {number} minViewDuration - Minimum seconds to count as a view (default: 2)
 * @param {number} cooldownHours - Hours before same user can count another view (default: 24)
 */
const usePostViewTracker = (postId, enabled = true, minViewDuration = 2, cooldownHours = 24) => {
  const [liveViewCount, setLiveViewCount] = useState(0);
  const [totalViewCount, setTotalViewCount] = useState(0);
  const [hasCountedView, setHasCountedView] = useState(false);

  const viewStartTimeRef = useRef(null);
  const viewTimerRef = useRef(null);
  const observerRef = useRef(null);
  const postElementRef = useRef(null);
  const isVisibleRef = useRef(false);
  const socketRef = useRef(null);
  const hasJoinedRoomRef = useRef(false);
  const isMountedRef = useRef(true);

  const [incrementView] = useIncrementPostViewMutation();

  // Track view duration and count view; skip API call if we already sent view for this post this session
  const countView = useCallback(async (duration) => {
    if (!postId || hasCountedView || duration < minViewDuration) return;
    const idStr = String(postId);
    if (viewedPostIdsThisSession.has(idStr)) return;

    try {
      viewedPostIdsThisSession.add(idStr);
      const result = await incrementView({
        postId,
        viewDuration: duration
      }).unwrap();

      if (!isMountedRef.current) return;
      if (result.data?.counted) {
        setHasCountedView(true);
        setTotalViewCount(result.data.viewCount || 0);
      } else if (result.data?.viewCount) {
        setTotalViewCount(result.data.viewCount);
      }
    } catch (error) {
      viewedPostIdsThisSession.delete(idStr); // allow retry on next visibility
      if (!isMountedRef.current) return;
      if (error?.status !== 404) {
        console.error('Error counting post view:', error);
      }
    }
  }, [postId, hasCountedView, minViewDuration, incrementView]);

  // Handle post entering viewport
  const handleViewStart = useCallback(() => {
    if (!enabled || !postId || isVisibleRef.current) return;
    
    isVisibleRef.current = true;
    viewStartTimeRef.current = Date.now();

    // Join Socket.IO room for live view tracking
    const socket = getSocket();
    if (socket && !hasJoinedRoomRef.current) {
      socketRef.current = socket;
      socket.emit('join-post-view', { postId });
      hasJoinedRoomRef.current = true;
    }

    // Start timer to count view after minimum duration
    viewTimerRef.current = setTimeout(() => {
      const duration = (Date.now() - viewStartTimeRef.current) / 1000;
      countView(duration);
    }, minViewDuration * 1000);
  }, [enabled, postId, minViewDuration, countView]);

  // Handle post leaving viewport
  const handleViewEnd = useCallback(() => {
    if (!enabled || !postId || !isVisibleRef.current) return;
    
    isVisibleRef.current = false;

    // Leave Socket.IO room
    const socket = socketRef.current || getSocket();
    if (socket && hasJoinedRoomRef.current) {
      socket.emit('leave-post-view', { postId });
      hasJoinedRoomRef.current = false;
      socketRef.current = null;
    }

    // Clear view timer
    if (viewTimerRef.current) {
      clearTimeout(viewTimerRef.current);
      viewTimerRef.current = null;
    }

    // Count view if minimum duration was met
    if (viewStartTimeRef.current) {
      const duration = (Date.now() - viewStartTimeRef.current) / 1000;
      if (duration >= minViewDuration && !hasCountedView) {
        countView(duration);
      }
      viewStartTimeRef.current = null;
    }
  }, [enabled, postId, minViewDuration, hasCountedView, countView]);

  // Set up IntersectionObserver
  useEffect(() => {
    if (!enabled || !postId || !postElementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            handleViewStart();
          } else {
            handleViewEnd();
          }
        });
      },
      {
        threshold: 0.5, // Post must be at least 50% visible
        rootMargin: '0px'
      }
    );

    observer.observe(postElementRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      handleViewEnd();
    };
  }, [enabled, postId, handleViewStart, handleViewEnd]);

  // Listen for live view count updates
  useEffect(() => {
    if (!enabled || !postId) return;

    const socket = getSocket();
    if (!socket) return;

    const handleLiveViewsUpdate = (data) => {
      if (data.postId === postId) {
        setLiveViewCount(data.liveViewCount || 0);
      }
    };

    socket.on('post-live-views-updated', handleLiveViewsUpdate);

    return () => {
      socket.off('post-live-views-updated', handleLiveViewsUpdate);
    };
  }, [enabled, postId]);

  // Handle page visibility (background/foreground)
  useEffect(() => {
    if (!enabled || !postId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is in background, leave live view
        handleViewEnd();
      } else if (isVisibleRef.current) {
        // Page is in foreground and post is visible, rejoin
        handleViewStart();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, postId, handleViewStart, handleViewEnd]);

  // Mark unmounted so countView and others don't setState after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
      }
      handleViewEnd();
    };
  }, [handleViewEnd]);

  return {
    postElementRef,
    liveViewCount,
    totalViewCount,
    setTotalViewCount, // Allow parent to update from API
    hasCountedView
  };
};

export default usePostViewTracker;


