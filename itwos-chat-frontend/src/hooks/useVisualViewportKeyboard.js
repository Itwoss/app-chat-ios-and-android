import { useState, useEffect, useCallback, useRef } from 'react'

const KEYBOARD_THRESHOLD_PX = 100
const THROTTLE_MS = 50

/**
 * Keyboard-aware layout for chat/comment input bars on iOS and Android.
 * Uses window.visualViewport resize/scroll so the input bar can stick to the top of the keyboard
 * and avoid gaps from safe-area insets when the keyboard is open.
 * Throttles updates to reduce lag during resize/scroll storms.
 *
 * @returns {{ keyboardOffset: number, isKeyboardOpen: boolean }}
 */
export function useVisualViewportKeyboard() {
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  const lastUpdateRef = useRef(0)
  const rafRef = useRef(null)

  const update = useCallback(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const full = window.innerHeight
    const vh = window.visualViewport.height
    const diff = full - vh
    const value = diff > KEYBOARD_THRESHOLD_PX ? diff : 0

    const now = Date.now()
    if (now - lastUpdateRef.current >= THROTTLE_MS) {
      lastUpdateRef.current = now
      setKeyboardOffset(value)
      return
    }
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        lastUpdateRef.current = Date.now()
        const vh2 = window.visualViewport?.height ?? window.innerHeight
        const diff2 = window.innerHeight - vh2
        setKeyboardOffset(diff2 > KEYBOARD_THRESHOLD_PX ? diff2 : 0)
      })
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    update()
    window.visualViewport.addEventListener('resize', update)
    window.visualViewport.addEventListener('scroll', update)
    return () => {
      window.visualViewport.removeEventListener('resize', update)
      window.visualViewport.removeEventListener('scroll', update)
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [update])

  return {
    keyboardOffset,
    isKeyboardOpen: keyboardOffset > KEYBOARD_THRESHOLD_PX,
  }
}
