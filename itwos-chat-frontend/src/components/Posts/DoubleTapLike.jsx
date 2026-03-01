import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import { Box } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart } from 'lucide-react'

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315]
const BURST_DURATION = 0.75
const TRAVEL_DURATION = 1.05
// Match reel/feed video style: larger burst and hearts that travel to like counter
const BURST_RADIUS = 52
const HEART_SIZE = 44
const HEART_COLOR = '#ed4956'

/**
 * Heart burst in feed/reel video style: radiate out then travel to like counter and hide.
 * Same sizing and animation as ReelOverlay (BURST_RADIUS 52, HEART_SIZE 44, duration 1.05).
 */
function HeartBurstSmall({ travelTarget }) {
  const hasTravel = travelTarget != null
  return (
    <Box
      position="absolute"
      top="50%"
      left="50%"
      w={`${BURST_RADIUS * 2 + HEART_SIZE}px`}
      h={`${BURST_RADIUS * 2 + HEART_SIZE}px`}
      marginLeft={-(BURST_RADIUS + HEART_SIZE / 2)}
      marginTop={-(BURST_RADIUS + HEART_SIZE / 2)}
      pointerEvents="none"
      overflow="visible"
      zIndex={10}
    >
      <Box position="absolute" left="50%" top="50%" w={0} h={0} sx={{ transform: 'translate(-50%, -50%)' }}>
        {BURST_ANGLES.map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const x = Math.cos(rad) * BURST_RADIUS
          const y = Math.sin(rad) * BURST_RADIUS
          const endX = hasTravel ? travelTarget.x : x
          const endY = hasTravel ? travelTarget.y : y
          return (
            <motion.div
              key={angle}
              initial={{ scale: 0.2, opacity: 0.95, x: 0, y: 0 }}
              animate={{
                scale: hasTravel ? [0.2, 1.2, 0.4] : [0.2, 1.35, 1.1],
                opacity: hasTravel ? [0.95, 0.9, 0] : [0.95, 0.85, 0],
                x: hasTravel ? [0, x * 0.5, endX] : [0, x * 0.6, x],
                y: hasTravel ? [0, y * 0.5, endY] : [0, y * 0.6, y],
              }}
              transition={{
                duration: hasTravel ? TRAVEL_DURATION : BURST_DURATION,
                times: hasTravel ? [0, 0.25, 1] : [0, 0.4, 1],
                ease: [0.25, 0.1, 0.25, 1],
                delay: i * 0.03,
              }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                pointerEvents: 'none',
              }}
            >
              <Heart
                size={HEART_SIZE}
                strokeWidth={1}
                fill={HEART_COLOR}
                color={HEART_COLOR}
                style={{
                  filter: `drop-shadow(0 2px 8px ${HEART_COLOR}99)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </motion.div>
          )
        })}
      </Box>
    </Box>
  )
}

/**
 * Instagram-style double-tap like with heart burst animation.
 * On double-tap: burst appears, hearts travel along "like path" to the like counter, then hide. Post is liked.
 * Single tap does not trigger like or animation.
 *
 * @param {React.ReactNode} children - Image, video, or any media content
 * @param {React.RefObject<HTMLElement>} [likeCounterRef] - Ref to the like button/counter element; hearts travel to it and hide
 * @param {() => void} [onLike] - Called when user double-taps (like)
 * @param {() => void} [onSingleTap] - Called when user single-taps (e.g. music toggle). Fired after ~260ms if no second tap.
 */
export default function DoubleTapLike({ children, likeCounterRef, onLike, onSingleTap, allowGlowOverflow = false }) {
  const [showHeartBurst, setShowHeartBurst] = useState(false)
  const [burstPosition, setBurstPosition] = useState({ x: '50%', y: '50%' })
  const [travelTarget, setTravelTarget] = useState(null)
  const lastTap = useRef(0)
  const singleTapTimer = useRef(null)
  const handledByTouchCount = useRef(0)
  const burstContainerRef = useRef(null)
  const containerRef = useRef(null)
  const tapPositionRef = useRef({ x: 0, y: 0 })
  const hideTimeoutRef = useRef(null)
  const touchStartRef = useRef(null)
  const TAP_MOVE_THRESHOLD_PX = 12

  const getTravelTarget = useCallback(() => {
    if (!burstContainerRef.current || !likeCounterRef?.current) return null
    const br = burstContainerRef.current.getBoundingClientRect()
    const lr = likeCounterRef.current.getBoundingClientRect()
    const cx = br.left + br.width / 2
    const cy = br.top + br.height / 2
    const lx = lr.left + lr.width / 2
    const ly = lr.top + lr.height / 2
    return { x: lx - cx, y: ly - cy }
  }, [likeCounterRef])

  const triggerDoubleTap = useCallback(() => {
    if (singleTapTimer.current) {
      clearTimeout(singleTapTimer.current)
      singleTapTimer.current = null
    }
    setTravelTarget(null)
    const { x, y } = tapPositionRef.current
    setBurstPosition({
      x: `${x}px`,
      y: `${y}px`,
    })
    setShowHeartBurst(true)
    // Defer onLike to next frame so we measure travel target before like count updates (avoids layout shift / shake)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        onLike?.()
      })
    })
  }, [onLike])

  // When burst is shown, compute travel target after layout stabilizes, then schedule hide
  useLayoutEffect(() => {
    if (!showHeartBurst) return
    let rafId
    rafId = requestAnimationFrame(() => {
      const target = getTravelTarget()
      setTravelTarget(target)
      const duration = target != null ? TRAVEL_DURATION * 1000 + 50 : BURST_DURATION * 1000 + 150
      hideTimeoutRef.current = setTimeout(() => {
        setShowHeartBurst(false)
        setTravelTarget(null)
      }, duration)
    })
    return () => {
      cancelAnimationFrame(rafId)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }
    }
  }, [showHeartBurst, getTravelTarget])

  const handleTap = useCallback(
    (e) => {
      if (
        e.target.closest('[aria-label="Post details"]') ||
        e.target.closest('[aria-label="Delete post"]') ||
        e.target.closest('[data-three-dot-menu]') ||
        e.target.closest('[aria-label="Mute"]') ||
        e.target.closest('[aria-label="Unmute"]') ||
        e.target.closest('[data-music-control]')
      ) {
        return
      }
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        tapPositionRef.current = {
          x: Math.max(0, Math.min(rect.width, x)),
          y: Math.max(0, Math.min(rect.height, y)),
        }
      }
      if (handledByTouchCount.current > 0) {
        handledByTouchCount.current--
        return
      }
      const now = Date.now()
      if (now - lastTap.current < 250) {
        triggerDoubleTap()
      } else {
        singleTapTimer.current = setTimeout(() => {
          onSingleTap?.()
          singleTapTimer.current = null
        }, 260)
      }
      lastTap.current = now
    },
    [onLike, onSingleTap, triggerDoubleTap]
  )

  const handleTouchEnd = useCallback(
    (e) => {
      if (
        e.target.closest('[aria-label="Post details"]') ||
        e.target.closest('[aria-label="Delete post"]') ||
        e.target.closest('[data-three-dot-menu]') ||
        e.target.closest('[aria-label="Mute"]') ||
        e.target.closest('[aria-label="Unmute"]') ||
        e.target.closest('[data-music-control]')
      ) {
        touchStartRef.current = null
        return false
      }
      const start = touchStartRef.current
      touchStartRef.current = null
      if (e.changedTouches?.[0] && start) {
        const t = e.changedTouches[0]
        const dx = t.clientX - start.x
        const dy = t.clientY - start.y
        const moved = Math.sqrt(dx * dx + dy * dy)
        if (moved > TAP_MOVE_THRESHOLD_PX) {
          if (singleTapTimer.current) {
            clearTimeout(singleTapTimer.current)
            singleTapTimer.current = null
          }
          return false
        }
      }
      if (containerRef.current && e.changedTouches?.[0]) {
        const rect = containerRef.current.getBoundingClientRect()
        const t = e.changedTouches[0]
        const x = t.clientX - rect.left
        const y = t.clientY - rect.top
        tapPositionRef.current = {
          x: Math.max(0, Math.min(rect.width, x)),
          y: Math.max(0, Math.min(rect.height, y)),
        }
      }
      const now = Date.now()
      const isDoubleTap = now - lastTap.current < 250
      lastTap.current = now
      if (isDoubleTap) {
        handledByTouchCount.current = 2
        triggerDoubleTap()
      } else {
        singleTapTimer.current = setTimeout(() => {
          onSingleTap?.()
          singleTapTimer.current = null
        }, 260)
      }
      return isDoubleTap
    },
    [onLike, onSingleTap, triggerDoubleTap]
  )

  const handleTouchStart = useCallback((e) => {
    if (e.touches?.[0]) {
      touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }, [])

  return (
    <Box
      ref={containerRef}
      position="relative"
      w="100%"
      h="100%"
      minH={0}
      overflow={allowGlowOverflow ? 'visible' : 'hidden'}
      onClick={handleTap}
      onTouchStartCapture={handleTouchStart}
      onTouchEndCapture={(e) => {
        const isMuteOrMusic = e.target.closest('[aria-label="Mute"]') != null ||
          e.target.closest('[aria-label="Unmute"]') != null ||
          e.target.closest('[data-music-control]') != null
        const wasDoubleTap = handleTouchEnd(e)
        if (!isMuteOrMusic && wasDoubleTap) e.preventDefault()
      }}
      userSelect="none"
      sx={{ WebkitUserSelect: 'none', touchAction: 'manipulation' }}
    >
      {children}

      <div
        ref={burstContainerRef}
        style={{
          position: 'absolute',
          left: burstPosition.x,
          top: burstPosition.y,
          width: 0,
          height: 0,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 20,
        }}
      >
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              key="heart-burst"
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.25 }}
              style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, overflow: 'visible' }}
            >
              <HeartBurstSmall travelTarget={travelTarget} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Box>
  )
}
