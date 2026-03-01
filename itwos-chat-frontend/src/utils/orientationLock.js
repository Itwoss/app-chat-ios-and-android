import { STORAGE_KEYS } from './storageKeys'

const KEY = STORAGE_KEYS.PORTRAIT_LOCK

/** Default: off — allow rotation. Returns true if portrait lock is on. */
export function getPortraitLockPreference() {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch {
    return false
  }
}

/** Set preference and apply. 'on' = lock portrait, 'off' = allow rotation. */
export function setPortraitLockPreference(on) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
    applyOrientationLock(on)
  } catch (_) {}
}

/** Apply current preference: lock to portrait if on, unlock if off. */
export function applyOrientationLock(lockPortrait) {
  if (typeof window === 'undefined' || !window.screen?.orientation) return
  try {
    if (lockPortrait) {
      window.screen.orientation.lock('portrait').catch(() => {
        // Some browsers (e.g. iOS Safari) require fullscreen; ignore failure
      })
    } else {
      window.screen.orientation.unlock()
    }
  } catch (_) {}
}
