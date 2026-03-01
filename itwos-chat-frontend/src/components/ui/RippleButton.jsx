import React, { useCallback, useEffect, useState } from 'react'
import { Box } from '@chakra-ui/react'

/**
 * Button (or any element via `as`) that shows a ripple effect on click.
 * Pass Chakra props (e.g. as={HStack}, onClick, px, py, ...) and optional rippleColor, duration.
 */
export const RippleButton = React.forwardRef(function RippleButton(
  {
    children,
    rippleColor = 'rgba(255, 255, 255, 0.4)',
    duration = '600ms',
    onClick,
    as = 'button',
    ...props
  },
  ref
) {
  const [ripples, setRipples] = useState(() => [])

  const createRipple = useCallback((e) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    const key = Date.now()
    setRipples((prev) => [...prev, { x, y, size, key }])
  }, [])

  const handleClick = useCallback(
    (e) => {
      createRipple(e)
      onClick?.(e)
    },
    [createRipple, onClick]
  )

  useEffect(() => {
    if (ripples.length === 0) return
    const last = ripples[ripples.length - 1]
    const ms = parseInt(duration, 10) || 600
    const t = setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.key !== last.key))
    }, ms)
    return () => clearTimeout(t)
  }, [ripples, duration])

  return (
    <Box
      ref={ref}
      as={as}
      position="relative"
      overflow="hidden"
      cursor="pointer"
      onClick={handleClick}
      {...props}
    >
      <Box
        position="relative"
        zIndex={10}
        display="inline-flex"
        alignItems="center"
        sx={{ gap: 1.5 }}
      >
        {children}
      </Box>
      <Box
        as="span"
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        pointerEvents="none"
        zIndex={0}
      >
        {ripples.map((r) => (
          <Box
            as="span"
            key={r.key}
            className="ripple-effect"
            position="absolute"
            borderRadius="full"
            bg={rippleColor}
            w={`${r.size}px`}
            h={`${r.size}px`}
            top={`${r.y}px`}
            left={`${r.x}px`}
            sx={{
              transform: 'scale(0)',
              animation: `rippling ${duration} ease-out forwards`,
            }}
          />
        ))}
      </Box>
    </Box>
  )
})

RippleButton.displayName = 'RippleButton'
