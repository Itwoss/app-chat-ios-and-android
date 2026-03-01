import { useEffect, useRef, useState } from 'react'
import { throttleMs } from '../utils/performance'

const RESIZE_THROTTLE_MS = 150

/**
 * Throttled resize listener to avoid layout thrashing on low-end devices.
 * Calls setValue with the result of getValue() (e.g. () => window.innerWidth).
 */
export function useThrottledResize(getValue, setValue) {
  const setValueRef = useRef(setValue)
  setValueRef.current = setValue
  const getValueRef = useRef(getValue)
  getValueRef.current = getValue

  useEffect(() => {
    const handler = throttleMs(() => {
      const v = getValueRef.current?.()
      if (v !== undefined) setValueRef.current?.(v)
    }, RESIZE_THROTTLE_MS)
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler)
    }
  }, [])
}

/**
 * useThrottledResize for common case: setIsMobile(window.innerWidth < 768).
 */
export function useIsMobileThrottled() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  )
  useThrottledResize(
    () => window.innerWidth < 768,
    setIsMobile
  )
  return isMobile
}
