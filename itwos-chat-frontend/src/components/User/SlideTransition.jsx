import { useRef, useLayoutEffect } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Box } from '@chakra-ui/react'

const SLIDE_ORDER = ['/user/home', '/user/feed', '/user/chat', '/user/dashboard', '/user/profile']

function getSlideKey(pathname) {
  if (!pathname?.startsWith('/user')) return null
  for (const base of SLIDE_ORDER) {
    if (pathname === base || pathname.startsWith(base + '/')) return base
  }
  return null
}

function getOrderIndex(pathname) {
  const key = getSlideKey(pathname)
  if (key == null) return -1
  const i = SLIDE_ORDER.indexOf(key)
  return i >= 0 ? i : -1
}

const EASE = [0.25, 0.46, 0.45, 0.94]
const DURATION = 0.28
const PARALLAX_EXIT = '35%'

/**
 * Wraps <Outlet /> for Instagram-style horizontal slide:
 * - Next screen slides in from the right (forward) or left (back).
 * - Previous screen moves slightly in the opposite direction (parallax).
 */
export default function SlideTransition() {
  const location = useLocation()
  const prevKeyRef = useRef(null)
  const directionRef = useRef('forward')

  const slideKey = getSlideKey(location.pathname)
  const orderIndex = getOrderIndex(location.pathname)
  const prevIndex = prevKeyRef.current == null ? -1 : SLIDE_ORDER.indexOf(prevKeyRef.current)

  if (slideKey != null && prevKeyRef.current !== slideKey) {
    directionRef.current = orderIndex >= prevIndex ? 'forward' : 'back'
  }
  useLayoutEffect(() => {
    if (slideKey != null) prevKeyRef.current = slideKey
  }, [slideKey])

  const direction = directionRef.current
  const isForward = direction === 'forward'

  return (
    <Box
      position="relative"
      w="100%"
      h="100%"
      minH={{ base: '100dvh', lg: 'inherit' }}
      overflow="hidden"
      style={{ touchAction: 'pan-y' }}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={slideKey ?? location.pathname}
          custom={direction}
          initial={{
            x: isForward ? '100%' : '-100%',
          }}
          animate={{
            x: 0,
          }}
          exit={{
            x: isForward ? `-${PARALLAX_EXIT}` : PARALLAX_EXIT,
          }}
          transition={{
            duration: DURATION,
            ease: EASE,
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            minHeight: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
          }}
          data-user-scroll-main=""
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </Box>
  )
}
