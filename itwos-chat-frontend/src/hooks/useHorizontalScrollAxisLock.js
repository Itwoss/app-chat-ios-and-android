import { useEffect, useRef } from 'react'

const LOCK_THRESHOLD_PX = 8

/**
 * Locks touch gestures on a horizontal scroll element to one axis:
 * - Horizontal swipes scroll the element only (carousel).
 * - Vertical swipes scroll the page (we do not preventDefault so the browser can scroll).
 *
 * We only use touchstart to detect gesture direction; touch-action: pan-x on the element
 * tells the browser to only handle horizontal pan on this element, so vertical scroll
 * goes to the page. We do not call preventDefault on vertical so page scroll works.
 *
 * @param {React.RefObject<HTMLElement | null>} ref - Ref to the horizontal scroll container
 */
export function useHorizontalScrollAxisLock(ref) {
  const lockRef = useRef(null) // 'x' | 'y' | null
  const startRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const el = ref?.current
    if (!el) return

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return
      lockRef.current = null
      startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }

    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return
      const { x: startX, y: startY } = startRef.current
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY

      if (lockRef.current === null) {
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        if (absDx > LOCK_THRESHOLD_PX || absDy > LOCK_THRESHOLD_PX) {
          lockRef.current = absDx >= absDy ? 'x' : 'y'
        }
      }
      // Do not preventDefault when lock is 'y' so vertical scroll can reach the page.
      // touch-action: pan-x on the element already limits this element to horizontal pan.
    }

    const handleTouchEnd = () => {
      lockRef.current = null
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [ref])
}
