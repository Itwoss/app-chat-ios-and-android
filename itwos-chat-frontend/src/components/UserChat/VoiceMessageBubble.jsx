import { useState, useRef, useEffect } from 'react'
import { Box, HStack, Text } from '@chakra-ui/react'
import { Play, Pause } from 'lucide-react'

/**
 * Instagram-style voice message: play/pause circle + waveform bar + duration.
 */
export default function VoiceMessageBubble({ src, type = 'audio/webm', ...rest }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onLoadedMetadata = () => setDuration(audio.duration)
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    if (audio.duration) setDuration(audio.duration)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [src])

  const togglePlay = (e) => {
    if (e) e.stopPropagation()
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }
    const playPromise = audio.play()
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => { setIsPlaying(false) })
    } else {
      setIsPlaying(true)
    }
  }

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? currentTime / duration : 0

  const isRemote = typeof src === 'string' && (src.startsWith('http:') || src.startsWith('https:'))

  return (
    <HStack spacing={3} align="center" w="100%" minW="120px" maxW="240px" {...rest}>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        crossOrigin={isRemote ? 'anonymous' : undefined}
        playsInline
      >
        <source src={src} type={type} />
      </audio>

      <Box
        as="button"
        type="button"
        onClick={togglePlay}
        w="36px"
        h="36px"
        borderRadius="full"
        bg="blackAlpha.200"
        _hover={{ bg: 'blackAlpha.300' }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
        color="inherit"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause size={16} fill="currentColor" stroke="currentColor" />
        ) : (
          <Play size={16} fill="currentColor" stroke="currentColor" style={{ marginLeft: '2px' }} />
        )}
      </Box>

      {/* Waveform-style progress bar (Instagram-like) */}
      <Box flex={1} minW={0} h="24px" display="flex" alignItems="center" gap="2px" color="inherit">
        {[...Array(24)].map((_, i) => {
          const barProgress = (i + 1) / 24
          const filled = barProgress <= progress
          const height = 4 + (Math.sin(i * 0.5) * 0.5 + 0.5) * 14
          return (
            <Box
              key={i}
              w="3px"
              minH="4px"
              h={`${height}px`}
              maxH="18px"
              borderRadius="full"
              bg="currentColor"
              opacity={filled ? 0.7 : 0.2}
              transition="opacity 0.15s"
            />
          )
        })}
      </Box>

      <Text fontSize="xs" whiteSpace="nowrap" opacity={0.9}>
        {formatTime(isPlaying ? currentTime : duration)}
      </Text>
    </HStack>
  )
}
