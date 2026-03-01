import { useState, useRef, useCallback, useEffect } from 'react'
import { throttleMs } from '../../utils/performance'
import { useNavigate, useLocation } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import UserHome from '../../pages/UserHome'
import UserFeed from '../../pages/UserFeed'
import UserChat from '../../pages/UserChat'
import UserDashboard from '../../pages/UserDashboard'
import UserProfile from '../../pages/UserProfile'
import { SLIDE_ORDER, pathToSlideIndex } from '../../contexts/SlideNavigatorContext'

const TOTAL = SLIDE_ORDER.length
const VELOCITY_THRESHOLD_PX_MS = 0.2
const SNAP_RATIO = 0.3
const HORIZONTAL_RATIO = 1.5
const VELOCITY_WINDOW_MS = 100
const SNAP_DURATION_MS = 280
const MAX_RUBBER = 80
const EASE_OUT = `cubic-bezier(0.25, 0.46, 0.45, 0.94)`

const PAGES = [UserHome, UserFeed, UserChat, UserDashboard, UserProfile]

export default function HorizontalSlideNavigator({ currentIndex, onIndexChange, onDragProgress }) {
  const navigate = useNavigate()
  const location = useLocation()

  const containerRef = useRef(null)
  const trackRef = useRef(null)

  // All drag state in refs — zero React re-renders during drag
  const drag = useRef({
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    isHorizontal: null,
    pointerId: null,
    velocitySamples: [],
    currentIndex: 0,
    vwPx: 0,
  })

  const [vwPx, setVwPx] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 375
  )
  const vwPxRef = useRef(vwPx)

  // Keep drag ref and vwPxRef in sync with latest values
  useEffect(() => {
    vwPxRef.current = vwPx
    drag.current.vwPx = vwPx
  }, [vwPx])

  useEffect(() => {
    drag.current.currentIndex = currentIndex
  }, [currentIndex])

  // Throttled resize for low-end devices
  useEffect(() => {
    const handler = throttleMs(() => setVwPx(window.innerWidth), 150)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = throttleMs(() => {
      const w = el.offsetWidth
      if (w > 0) setVwPx(w)
    }, 150)
    const ro = new ResizeObserver(handler)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Route sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    const i = pathToSlideIndex(location.pathname)
    if (i >= 0 && i < TOTAL && !drag.current.active) {
      onIndexChange?.(i)
    }
  }, [location.pathname]) // eslint-disable-line

  // ── Direct DOM helpers ────────────────────────────────────────────────────
  const setTrackTransform = useCallback((index, offsetPx, animate) => {
    const el = trackRef.current
    if (!el) return
    const vw = vwPxRef.current
    const tx = -index * vw + offsetPx
    el.style.transition = animate
      ? `transform ${SNAP_DURATION_MS}ms ${EASE_OUT}`
      : 'none'
    el.style.transform = `translate3d(${tx}px, 0, 0)`
  }, [])

  // ── Velocity helpers ──────────────────────────────────────────────────────
  const addSample = (dx) => {
    const arr = drag.current.velocitySamples
    arr.push({ x: dx, t: Date.now() })
    if (arr.length > 16) arr.shift()
  }

  const getVelocity = () => {
    const arr = drag.current.velocitySamples
    if (arr.length < 2) return 0
    const cutoff = Date.now() - VELOCITY_WINDOW_MS
    const recent = arr.filter((s) => s.t >= cutoff)
    if (recent.length < 2) return 0
    let weightedSum = 0, weightSum = 0
    for (let i = 0; i < recent.length - 1; i++) {
      const dt = recent[i + 1].t - recent[i].t
      if (dt <= 0) continue
      const v = (recent[i + 1].x - recent[i].x) / dt
      const recency = recent[i + 1].t - cutoff
      const w = dt * recency
      weightedSum += v * w
      weightSum += w
    }
    return weightSum > 0 ? weightedSum / weightSum : 0
  }

  // ── Rubber band ───────────────────────────────────────────────────────────
  const rubberClamp = (offset, index) => {
    if (index <= 0 && offset > 0)
      return Math.sign(offset) * Math.min(Math.sqrt(Math.abs(offset)) * 4, MAX_RUBBER)
    if (index >= TOTAL - 1 && offset < 0)
      return Math.sign(offset) * Math.min(Math.sqrt(Math.abs(offset)) * 4, MAX_RUBBER)
    return offset
  }

  // ── Pointer handlers (stable refs, never recreated) ───────────────────────
  const handlePointerDown = useCallback((e) => {
    const x = e.clientX ?? e.touches?.[0]?.clientX
    const y = e.clientY ?? e.touches?.[0]?.clientY
    if (x == null) return

    const d = drag.current
    d.active = true
    d.startX = x
    d.startY = y
    d.currentX = x
    d.isHorizontal = null
    d.pointerId = e.touches ? (e.touches[0]?.identifier ?? 'touch') : 'mouse'
    d.velocitySamples = [{ x: 0, t: Date.now() }]

    // Kill any in-flight snap animation immediately
    setTrackTransform(d.currentIndex, 0, false)

    const el = containerRef.current
    if (el) el.style.touchAction = 'pan-y'
  }, [setTrackTransform])

  const handlePointerMove = useCallback((e) => {
    const d = drag.current
    if (!d.active) return

    const pid = e.changedTouches?.[0]?.identifier
      ?? e.touches?.[0]?.identifier
      ?? (e.type?.startsWith('mouse') ? 'mouse' : e.pointerId)
    if (d.pointerId != null && pid !== d.pointerId) return

    const x = e.clientX ?? e.changedTouches?.[0]?.clientX ?? e.touches?.[0]?.clientX
    const y = e.clientY ?? e.changedTouches?.[0]?.clientY ?? e.touches?.[0]?.clientY
    if (x == null) return

    const dx = x - d.startX
    const dy = y - d.startY

    // Determine gesture direction once
    if (d.isHorizontal === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        d.isHorizontal = Math.abs(dx) >= Math.abs(dy) * HORIZONTAL_RATIO
        if (d.isHorizontal) d.velocitySamples = [{ x: dx, t: Date.now() }]
      }
    }

    if (d.isHorizontal !== true) return

    const el = containerRef.current
    if (el) el.style.touchAction = 'none'
    e.preventDefault()

    d.currentX = x
    addSample(dx)

    const offset = rubberClamp(dx, d.currentIndex)

    // ✅ Direct DOM write — no setState, no re-render
    setTrackTransform(d.currentIndex, offset, false)

    const progress = d.vwPx > 0 ? Math.max(-1, Math.min(1, -offset / d.vwPx)) : 0
    onDragProgress?.(progress)
  }, [setTrackTransform, onDragProgress])

  const handlePointerUp = useCallback((e) => {
    const d = drag.current
    if (!d.active) return

    const pid = e.changedTouches?.[0]?.identifier
      ?? (e.type?.startsWith('mouse') ? 'mouse' : e.pointerId ?? e.identifier)
    if (d.pointerId != null && pid !== d.pointerId) {
      onDragProgress?.(0)
      return
    }

    d.active = false
    d.pointerId = null
    const el = containerRef.current
    if (el) el.style.touchAction = 'pan-y'
    onDragProgress?.(0)

    if (d.isHorizontal !== true) {
      setTrackTransform(d.currentIndex, 0, false)
      return
    }

    const dx = d.currentX - d.startX
    const velocity = getVelocity()
    const vw = d.vwPx

    let targetIndex = d.currentIndex
    if (Math.abs(velocity) >= VELOCITY_THRESHOLD_PX_MS) {
      targetIndex = velocity > 0
        ? Math.max(0, d.currentIndex - 1)
        : Math.min(TOTAL - 1, d.currentIndex + 1)
    } else {
      if (dx > vw * SNAP_RATIO) targetIndex = Math.max(0, d.currentIndex - 1)
      else if (dx < -vw * SNAP_RATIO) targetIndex = Math.min(TOTAL - 1, d.currentIndex + 1)
    }

    // Snap with CSS transition directly on the DOM element
    setTrackTransform(targetIndex, 0, true)

    if (targetIndex !== d.currentIndex) {
      onIndexChange?.(targetIndex)
      navigate(SLIDE_ORDER[targetIndex], { replace: true })
    }

    d.velocitySamples = []
  }, [setTrackTransform, navigate, onIndexChange, onDragProgress])

  // ── Event listeners (attached once) ──────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const opts = { passive: false, capture: true }
    el.addEventListener('touchstart', handlePointerDown, opts)
    el.addEventListener('touchmove', handlePointerMove, opts)
    el.addEventListener('touchend', handlePointerUp, opts)
    el.addEventListener('touchcancel', handlePointerUp, opts)
    el.addEventListener('mousedown', handlePointerDown)
    return () => {
      el.removeEventListener('touchstart', handlePointerDown, opts)
      el.removeEventListener('touchmove', handlePointerMove, opts)
      el.removeEventListener('touchend', handlePointerUp, opts)
      el.removeEventListener('touchcancel', handlePointerUp, opts)
      el.removeEventListener('mousedown', handlePointerDown)
    }
  }, [handlePointerDown, handlePointerMove, handlePointerUp])

  useEffect(() => {
    const onMove = (e) => { if (drag.current.pointerId === 'mouse') handlePointerMove(e) }
    const onUp = (e) => { if (drag.current.pointerId === 'mouse') handlePointerUp(e) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [handlePointerMove, handlePointerUp])

  // ── Sync track position when currentIndex changes from outside (nav, route) ─
  useEffect(() => {
    if (!drag.current.active) {
      setTrackTransform(currentIndex, 0, true)
    }
  }, [currentIndex, setTrackTransform])

  // ── Initial paint ─────────────────────────────────────────────────────────
  useEffect(() => {
    setTrackTransform(currentIndex, 0, false)
  }, []) // eslint-disable-line

  return (
    <Box
      ref={containerRef}
      w="100%"
      h="100%"
      minH={0}
      overflow="hidden"
      position="relative"
      sx={{ touchAction: 'pan-y', minHeight: '100dvh' }}
      data-user-scroll-main
    >
      <Box
        ref={trackRef}
        display="flex"
        flexDirection="row"
        w={`${TOTAL * vwPx}px`}
        h="100%"
        minH={0}
        overflowX="visible"
        overflowY="hidden"
        // ✅ No React-controlled transform or transition here — DOM-driven only
        style={{ willChange: 'transform' }}
      >
        {PAGES.map((Page, i) => (
          <Box
            key={SLIDE_ORDER[i]}
            flex="0 0 auto"
            w={`${vwPx}px`}
            minW={`${vwPx}px`}
            maxW="100%"
            h="100%"
            minH={0}
            overflowY="auto"
            overflowX="hidden"
            sx={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-y',
              overscrollBehaviorY: 'contain',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          >
            <Page />
          </Box>
        ))}
      </Box>
    </Box>
  )
}