import { useLocation, Outlet, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import UserLayout from './UserLayout'
import HorizontalSlideNavigator from './HorizontalSlideNavigator'
import { SlideHandledByParentContext } from './SlideTransitionContext'
import { SlideNavigatorContext, SLIDE_ORDER, pathToSlideIndex } from '../../contexts/SlideNavigatorContext'

const BASE_SLIDE_PATHS = ['/user/home', '/user/feed', '/user/chat', '/user/dashboard', '/user/profile']

function isBaseSlidePath(pathname) {
  return pathname && BASE_SLIDE_PATHS.includes(pathname)
}

/**
 * Single layout for all /user routes. For the 5 main tabs we use HorizontalSlideNavigator
 * and provide SlideNavigatorContext so nav (e.g. dot indicator) can read index/dragProgress.
 */
export default function UserArea() {
  const location = useLocation()
  const navigate = useNavigate()
  // HorizontalSlideNavigator handles gestures ONLY on the main 5 pages (home, feed, chat, dashboard, profile).
  const useHorizontalStrip = isBaseSlidePath(location.pathname)

  const [currentIndex, setCurrentIndex] = useState(() => pathToSlideIndex(location.pathname))
  const [dragProgress, setDragProgress] = useState(0)

  useEffect(() => {
    if (useHorizontalStrip) {
      const i = pathToSlideIndex(location.pathname)
      setCurrentIndex(i)
    }
  }, [location.pathname, useHorizontalStrip])

  const goToIndex = (index) => {
    const next = Math.max(0, Math.min(SLIDE_ORDER.length - 1, index))
    setCurrentIndex(next)
    setDragProgress(0)
    navigate(SLIDE_ORDER[next], { replace: true })
  }

  const contextValue = useHorizontalStrip
    ? {
        currentIndex,
        totalPages: SLIDE_ORDER.length,
        dragProgress,
        goToIndex,
      }
    : { currentIndex: 0, totalPages: SLIDE_ORDER.length, dragProgress: 0, goToIndex: () => {} }

  return (
    <SlideNavigatorContext.Provider value={contextValue}>
      <SlideHandledByParentContext.Provider value={useHorizontalStrip}>
        <UserLayout>
          {useHorizontalStrip ? (
            <HorizontalSlideNavigator
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              onDragProgress={setDragProgress}
            />
          ) : (
            <Outlet />
          )}
        </UserLayout>
      </SlideHandledByParentContext.Provider>
    </SlideNavigatorContext.Provider>
  )
}
