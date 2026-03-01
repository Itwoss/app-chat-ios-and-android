import { createContext, useContext, useState, useCallback } from 'react'

export const SLIDE_ORDER = ['/user/home', '/user/feed', '/user/chat', '/user/dashboard', '/user/profile']

export function pathToSlideIndex(pathname) {
  if (!pathname?.startsWith('/user')) return 0
  const i = SLIDE_ORDER.findIndex(
    (base) => pathname === base || pathname.startsWith(base + '/')
  )
  return i >= 0 ? i : 0
}

export const SlideNavigatorContext = createContext({
  currentIndex: 0,
  totalPages: SLIDE_ORDER.length,
  /** -1 to 1: progress from current to next (positive = dragging toward next) */
  dragProgress: 0,
  goToIndex: () => {},
})

export function useSlideNavigator() {
  return useContext(SlideNavigatorContext)
}
