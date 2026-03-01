/**
 * Lightweight performance utilities for low-end devices.
 * - Throttle by requestAnimationFrame or by time interval
 * - Passive event listeners for scroll/touch
 * - No layout thrashing: batch reads then writes
 */

/**
 * Throttle fn to once per animation frame (for scroll/resize/touch).
 * Use for visual updates that can skip frames on slow devices.
 */
export function throttleRAF(fn) {
  let raf = null
  return function throttled(...args) {
    if (raf !== null) return
    raf = requestAnimationFrame(() => {
      raf = null
      fn.apply(this, args)
    })
  }
}

/**
 * Throttle fn to at most once every `intervalMs` (for resize, orientation).
 */
export function throttleMs(fn, intervalMs) {
  let last = 0
  let timer = null
  return function throttled(...args) {
    const now = Date.now()
    const elapsed = now - last
    if (elapsed >= intervalMs) {
      if (timer) clearTimeout(timer)
      timer = null
      last = now
      fn.apply(this, args)
    } else if (timer === null) {
      timer = setTimeout(() => {
        timer = null
        last = Date.now()
        fn.apply(this, args)
      }, intervalMs - elapsed)
    }
  }
}

/**
 * Add an event listener with passive: true (for touch/scroll).
 * Returns remove function.
 */
export function addPassiveListener(target, event, handler) {
  target.addEventListener(event, handler, { passive: true })
  return () => target.removeEventListener(event, handler)
}

/**
 * Batch a read (measure) and then a write (update) to avoid layout thrashing.
 * Runs the write in the next frame after the read.
 */
export function readThenWrite(readFn, writeFn) {
  const value = readFn()
  requestAnimationFrame(() => writeFn(value))
}
