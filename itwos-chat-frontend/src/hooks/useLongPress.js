import { useRef, useCallback } from 'react'

const DEFAULT_MS = 500

/**
 * @param {Function} onLongPress - called after hold for ms
 * @param {Function} [onClick] - called on short tap (if no long press)
 * @param {number} [ms]
 * @returns {{ onTouchStart, onTouchEnd, onTouchMove, onMouseDown, onMouseUp, onMouseLeave }}
 */
export function useLongPress(onLongPress, onClick, ms = DEFAULT_MS) {
  const timerRef = useRef(null)
  const didLongPressRef = useRef(false)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    didLongPressRef.current = false
  }, [])

  const start = useCallback(
    (e) => {
      didLongPressRef.current = false
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        didLongPressRef.current = true
        onLongPress(e)
      }, ms)
    },
    [onLongPress, ms]
  )

  const end = useCallback(
    (e) => {
      clear()
      if (!didLongPressRef.current && onClick) onClick(e)
    },
    [clear, onClick]
  )

  return {
    onTouchStart: start,
    onTouchEnd: end,
    onTouchMove: clear,
    onTouchCancel: clear,
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: clear,
  }
}
