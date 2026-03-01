import {
  Box,
  VStack,
  HStack,
  Button,
  IconButton,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Spinner,
  Center,
  Flex,
  Input,
  useDisclosure,
  Image,
  Tooltip,
} from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'
import { 
  X, 
  Image as ImageIcon, 
  Music, 
  Scissors, 
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
} from 'lucide-react'
import { generateVideoThumbnail } from '../../hooks/useVideoThumbnail'
import MusicSearch from '../Music/MusicSearch'

const ASPECT_RATIOS = [
  { value: 'original', label: 'Original' },
  { value: '9:16', label: '9:16' },
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: '16:9', label: '16:9' },
]

const VideoEditor = ({ 
  isOpen, 
  onClose, 
  videoFile, 
  initialRatio, 
  initialTrim, 
  initialSelectedSound, 
  onSave, 
  onCancel 
}) => {
  const videoRef = useRef(null)
  const timelineContainerRef = useRef(null)
  const trimStartHandleRef = useRef(null)
  const trimEndHandleRef = useRef(null)
  const isDraggingRef = useRef(null) // 'start', 'end', or 'playhead'
  const videoPreviewContainerRef = useRef(null)
  const dragStartRef = useRef({ x: 0, y: 0, cropX: 0, cropY: 0 })
  
  const { isOpen: isMusicSearchOpen, onOpen: onMusicSearchOpen, onClose: onMusicSearchClose } = useDisclosure()
  
  const [videoUrl, setVideoUrl] = useState(null)
  const [ratio, setRatio] = useState(initialRatio || 'original')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState(null)
  const [thumbnailLoading, setThumbnailLoading] = useState(false)
  
  // Video metadata
  const [duration, setDuration] = useState(0)
  const [originalWidth, setOriginalWidth] = useState(0)
  const [originalHeight, setOriginalHeight] = useState(0)
  
  // Trim state
  const [trimStart, setTrimStart] = useState(initialTrim?.trimStart ?? 0)
  const [trimEnd, setTrimEnd] = useState(initialTrim?.trimEnd ?? null)
  const [playheadTime, setPlayheadTime] = useState(0)
  
  // Music
  const [selectedSound, setSelectedSound] = useState(initialSelectedSound ?? null)
  
  // Crop position when ratio is not original (percentage, 0 = center); drag to reposition
  const [cropPositionX, setCropPositionX] = useState(0)
  const [cropPositionY, setCropPositionY] = useState(0)
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  // Zoom when ratio is not original (1 = 100%, range e.g. 0.5–2.5)
  const [cropZoom, setCropZoom] = useState(1)

  // UI state
  const [showTrimControls, setShowTrimControls] = useState(false)
  const [showThumbnailTimeline, setShowThumbnailTimeline] = useState(false)
  const [thumbnailPickTime, setThumbnailPickTime] = useState(0)

  // Calculate aspect ratio CSS
  const originalRatioCss = originalWidth && originalHeight ? `${originalWidth} / ${originalHeight}` : '16 / 9'
  const aspectRatioCss = ratio === 'original' ? originalRatioCss : ratio.replace(':', ' /')
  const isOriginalRatio = ratio === 'original'
  const thumbnailRatio = isOriginalRatio ? 'original' : ratio

  const aspectRatioValue = ratio === 'original' && originalWidth && originalHeight
    ? originalWidth / originalHeight
    : ratio === 'original'
      ? 16 / 9
      : (() => {
          const [w, h] = ratio.split(':').map(Number)
          return w / h
        })()

  // Max pan in % when video is cropped to frame aspect (so we don't show empty space)
  const videoAspect = originalWidth && originalHeight ? originalWidth / originalHeight : 16 / 9
  const frameAspect = aspectRatioValue
  const maxPanXPercent = ratio !== 'original' && videoAspect > frameAspect
    ? 50 * (videoAspect / frameAspect - 1)
    : 0
  const maxPanYPercent = ratio !== 'original' && videoAspect < frameAspect
    ? 50 * (frameAspect / videoAspect - 1)
    : 0
  // Effective pan range increases with zoom (scaled video overflows more)
  const effectiveMaxPanX = maxPanXPercent + 50 * Math.max(0, cropZoom - 1)
  const effectiveMaxPanY = maxPanYPercent + 50 * Math.max(0, cropZoom - 1)

  const effectiveTrimEnd = trimEnd ?? duration

  // Reset crop position and zoom when ratio changes
  useEffect(() => {
    setCropPositionX(0)
    setCropPositionY(0)
    setCropZoom(1)
  }, [ratio])

  // Initialize video
  useEffect(() => {
    if (!videoFile || !isOpen) return
    setLoading(true)
    const url = URL.createObjectURL(videoFile)
    setVideoUrl(url)
    setRatio(initialRatio || 'original')
    setTrimStart(initialTrim?.trimStart ?? 0)
    setTrimEnd(initialTrim?.trimEnd ?? null)
    setSelectedSound(initialSelectedSound ?? null)
    setThumbnailFile(null)
    setIsPlaying(false)
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl)
    }
    setThumbnailPreviewUrl(null)
    setDuration(0)
    setOriginalWidth(0)
    setOriginalHeight(0)
    setLoading(false)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [videoFile, isOpen])

  // Load video metadata
  const handleVideoLoadedMetadata = () => {
    const v = videoRef.current
    if (!v) return
    const dur = v.duration || 0
    setDuration(dur)
    setOriginalWidth(v.videoWidth || 0)
    setOriginalHeight(v.videoHeight || 0)
    setTrimEnd((prev) => (prev == null || prev <= 0 || prev > dur ? dur : prev))
    setTrimStart((prev) => Math.min(prev, dur))
    setPlayheadTime(initialTrim?.trimStart ?? 0)
    if (v) v.currentTime = initialTrim?.trimStart ?? 0
  }

  // Sync video playback with trim range
  useEffect(() => {
    const v = videoRef.current
    if (!v || duration <= 0) return
    
    const onTimeUpdate = () => {
      const currentTime = v.currentTime
      setPlayheadTime(currentTime)
      
      // Loop within trim range
      if (currentTime >= effectiveTrimEnd) {
        v.currentTime = trimStart
        setPlayheadTime(trimStart)
      }
      if (currentTime < trimStart) {
        v.currentTime = trimStart
        setPlayheadTime(trimStart)
      }
    }
    
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      setIsPlaying(false)
      v.currentTime = trimStart
      setPlayheadTime(trimStart)
    }
    
    v.addEventListener('timeupdate', onTimeUpdate)
    v.addEventListener('play', onPlay)
    v.addEventListener('pause', onPause)
    v.addEventListener('ended', onEnded)
    
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate)
      v.removeEventListener('play', onPlay)
      v.removeEventListener('pause', onPause)
      v.removeEventListener('ended', onEnded)
    }
  }, [duration, trimStart, effectiveTrimEnd])

  // Play/Pause toggle
  const togglePlayPause = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
    } else {
      v.pause()
    }
  }

  // Seek to time
  const seekTo = (time) => {
    const v = videoRef.current
    if (!v) return
    const clamped = Math.max(0, Math.min(duration, time))
    v.currentTime = clamped
    setPlayheadTime(clamped)
  }

  // Timeline interactions
  const getTimeFromPosition = (clientX) => {
    if (!timelineContainerRef.current) return 0
    const rect = timelineContainerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
    return (x / rect.width) * duration
  }

  const handleTimelineMouseDown = (e) => {
    if (!timelineContainerRef.current || duration <= 0) return
    
    // Check if clicking on handles
    const target = e.target
    if (target.dataset.handle === 'start') {
      isDraggingRef.current = 'start'
      e.preventDefault()
      return
    }
    if (target.dataset.handle === 'end') {
      isDraggingRef.current = 'end'
      e.preventDefault()
      return
    }
    
    // Otherwise, seek playhead
    const time = getTimeFromPosition(e.clientX)
    seekTo(time)
    isDraggingRef.current = 'playhead'
    e.preventDefault()
  }

  const handleTimelineMouseMove = (e) => {
    if (!isDraggingRef.current) return
    e.preventDefault()
    
    const time = getTimeFromPosition(e.clientX)
    
    if (isDraggingRef.current === 'start') {
      const newStart = Math.max(0, Math.min(time, effectiveTrimEnd - 0.1))
      setTrimStart(newStart)
      if (playheadTime < newStart) {
        seekTo(newStart)
      }
    } else if (isDraggingRef.current === 'end') {
      const newEnd = Math.max(trimStart + 0.1, Math.min(time, duration))
      setTrimEnd(newEnd)
      if (playheadTime > newEnd) {
        seekTo(newEnd)
      }
    } else if (isDraggingRef.current === 'playhead') {
      seekTo(time)
    }
  }

  const handleTimelineMouseUp = () => {
    isDraggingRef.current = null
  }

  // Add global mouse listeners for dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleTimelineMouseMove(e)
    const handleGlobalMouseUp = () => handleTimelineMouseUp()
    
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [trimStart, effectiveTrimEnd, playheadTime, duration])

  // Touch support for timeline
  const handleTimelineTouchStart = (e) => {
    if (!timelineContainerRef.current || duration <= 0) return
    const touch = e.touches[0]
    
    const target = e.target
    if (target.dataset.handle === 'start') {
      isDraggingRef.current = 'start'
      e.preventDefault()
      return
    }
    if (target.dataset.handle === 'end') {
      isDraggingRef.current = 'end'
      e.preventDefault()
      return
    }
    
    const time = getTimeFromPosition(touch.clientX)
    seekTo(time)
    isDraggingRef.current = 'playhead'
    e.preventDefault()
  }

  const handleTimelineTouchMove = (e) => {
    if (!isDraggingRef.current) return
    e.preventDefault()
    
    const touch = e.touches[0]
    const time = getTimeFromPosition(touch.clientX)
    
    if (isDraggingRef.current === 'start') {
      const newStart = Math.max(0, Math.min(time, effectiveTrimEnd - 0.1))
      setTrimStart(newStart)
      if (playheadTime < newStart) {
        seekTo(newStart)
      }
    } else if (isDraggingRef.current === 'end') {
      const newEnd = Math.max(trimStart + 0.1, Math.min(time, duration))
      setTrimEnd(newEnd)
      if (playheadTime > newEnd) {
        seekTo(newEnd)
      }
    } else if (isDraggingRef.current === 'playhead') {
      seekTo(time)
    }
  }

  const handleTimelineTouchEnd = () => {
    isDraggingRef.current = null
  }

  // Quick trim actions
  const handleCutStart = () => {
    setTrimStart(playheadTime)
    if (videoRef.current) {
      videoRef.current.currentTime = playheadTime
    }
  }

  const handleCutEnd = () => {
    setTrimEnd(playheadTime)
    if (videoRef.current) {
      videoRef.current.currentTime = playheadTime
    }
  }

  const handleResetTrim = () => {
    setTrimStart(0)
    setTrimEnd(duration)
    seekTo(0)
  }

  // Cut middle section - keeps start and end, removes middle
  const handleCutMiddle = () => {
    if (playheadTime <= trimStart || playheadTime >= effectiveTrimEnd) return
    // For now, we'll keep the portion from start to playhead
    // (cutting middle fully requires multiple segments which is complex)
    // So we'll just cut from playhead to end
    setTrimEnd(playheadTime)
    seekTo(trimStart)
  }

  // Step frame by frame
  const stepBackward = () => {
    const newTime = Math.max(0, playheadTime - 0.033) // ~1 frame at 30fps
    seekTo(newTime)
  }

  const stepForward = () => {
    const newTime = Math.min(duration, playheadTime + 0.033)
    seekTo(newTime)
  }

  // Crop position drag (when ratio is not original)
  const handleCropDragStart = (clientX, clientY) => {
    if (ratio === 'original' || !videoPreviewContainerRef.current) return
    setIsDraggingCrop(true)
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      cropX: cropPositionX,
      cropY: cropPositionY,
    }
  }

  const handleCropDragMove = (clientX, clientY) => {
    if (ratio === 'original' || !videoPreviewContainerRef.current) return
    const el = videoPreviewContainerRef.current
    const rect = el.getBoundingClientRect()
    const dx = clientX - dragStartRef.current.x
    const dy = clientY - dragStartRef.current.y
    const dxPercent = (dx / rect.width) * 100
    const dyPercent = (dy / rect.height) * 100
    setCropPositionX((prev) => Math.max(-effectiveMaxPanX, Math.min(effectiveMaxPanX, dragStartRef.current.cropX + dxPercent)))
    setCropPositionY((prev) => Math.max(-effectiveMaxPanY, Math.min(effectiveMaxPanY, dragStartRef.current.cropY + dyPercent)))
  }

  const handleCropDragEnd = () => {
    setIsDraggingCrop(false)
    dragStartRef.current = { x: 0, y: 0, cropX: 0, cropY: 0 }
  }

  const onCropMouseDown = (e) => {
    if (ratio === 'original') return
    if (e.target.closest('[data-playback-line]')) return // don't drag when clicking progress bar
    e.preventDefault()
    handleCropDragStart(e.clientX, e.clientY)
    const onMove = (e2) => handleCropDragMove(e2.clientX, e2.clientY)
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      handleCropDragEnd()
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const onCropTouchStart = (e) => {
    if (ratio === 'original') return
    if (e.target.closest('[data-playback-line]')) return
    const touch = e.touches[0]
    if (!touch) return
    handleCropDragStart(touch.clientX, touch.clientY)
  }

  const onCropTouchMove = (e) => {
    const touch = e.touches[0]
    if (touch) handleCropDragMove(touch.clientX, touch.clientY)
  }

  const onCropTouchEnd = () => {
    handleCropDragEnd()
  }

  // Thumbnail generation
  const generateThumbnailAtTime = async (time) => {
    if (!videoFile) return
    setThumbnailLoading(true)
    if (thumbnailPreviewUrl) {
      URL.revokeObjectURL(thumbnailPreviewUrl)
    }
    setThumbnailPreviewUrl(null)
    
    try {
      const { blob, url } = await generateVideoThumbnail(videoFile, thumbnailRatio, time)
      setThumbnailPreviewUrl(url)
      setThumbnailFile(new File([blob], `video-thumb-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    } catch (e) {
      console.error('Thumbnail generation failed:', e)
    } finally {
      setThumbnailLoading(false)
    }
  }

  const handleUseTrimStart = () => {
    generateThumbnailAtTime(trimStart)
  }

  const handleUsePlayhead = () => {
    generateThumbnailAtTime(playheadTime)
  }

  const handleUseTrimEnd = () => {
    generateThumbnailAtTime(effectiveTrimEnd)
  }

  const handleOpenThumbnailTimeline = () => {
    setShowThumbnailTimeline(true)
    setThumbnailPickTime(playheadTime)
  }

  const handleConfirmThumbnailTime = async () => {
    await generateThumbnailAtTime(thumbnailPickTime)
    setShowThumbnailTimeline(false)
  }

  const handleCancelThumbnailTimeline = () => {
    setShowThumbnailTimeline(false)
  }

  const handleThumbnailUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (thumbnailPreviewUrl) URL.revokeObjectURL(thumbnailPreviewUrl)
    setThumbnailPreviewUrl(URL.createObjectURL(file))
    setThumbnailFile(file)
    if (e.target) e.target.value = ''
  }

  // Save
  const handleSave = () => {
    setProcessing(true)
    const end = trimEnd ?? duration
    
    // Prepare edit data
    const editData = {
      ratio,
      thumbnailFile: thumbnailFile || undefined,
      trimStart: trimStart > 0 || (end > 0 && end < duration) ? trimStart : undefined,
      trimEnd: end > 0 && end < duration ? end : undefined,
      selectedSound: selectedSound || undefined,
      cropPositionX: ratio !== 'original' && (cropPositionX !== 0 || cropPositionY !== 0) ? cropPositionX : undefined,
      cropPositionY: ratio !== 'original' && (cropPositionX !== 0 || cropPositionY !== 0) ? cropPositionY : undefined,
      cropZoom: ratio !== 'original' && cropZoom !== 1 ? cropZoom : undefined,
    }
    
    // Call onSave with video file and all edit data
    onSave(videoFile, editData)
    setProcessing(false)
    onClose()
  }

  // Format time as MM:SS
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="full" motionPreset="none" closeOnOverlayClick={false}>
        <ModalOverlay bg="rgba(0, 0, 0, 0.95)" />
        <ModalContent
          m={0}
          maxW="100%"
          maxH="100%"
          h="100vh"
          borderRadius={0}
          overflow="hidden"
          bg="#000"
        >
          <Flex
            direction="column"
            h="100%"
            w="100%"
            sx={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)',
            }}
          >
            {/* Header */}
            <HStack
              flexShrink={0}
              justify="space-between"
              align="center"
              px={4}
              py={3}
              bg="rgba(0, 0, 0, 0.8)"
              borderBottom="1px solid rgba(255, 255, 255, 0.1)"
              sx={{ backdropFilter: 'blur(20px)' }}
            >
              <IconButton
                icon={<X size={22} />}
                size="sm"
                variant="ghost"
                onClick={onCancel || onClose}
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                aria-label="Close"
              />
              
              <Text 
                fontSize="17px" 
                fontWeight="600" 
                color="white"
                letterSpacing="-0.3px"
              >
                Edit Video
              </Text>
              
              <Button
                size="sm"
                bg="#FF0050"
                color="white"
                fontWeight="600"
                px={5}
                onClick={handleSave}
                isLoading={processing}
                loadingText="Saving"
                _hover={{ bg: '#E6004A' }}
                _active={{ transform: 'scale(0.96)' }}
                borderRadius="full"
                fontSize="12px"
              >
                Save Edit
              </Button>
            </HStack>

            {/* Video Preview */}
            <Flex 
              flex={1} 
              minH={0} 
              align="center" 
              justify="center" 
              bg="#000" 
              position="relative"
              overflow="hidden"
              py={4}
            >
              {loading ? (
                <Center flexDirection="column">
                  <Spinner size="xl" color="#FF0050" thickness="3px" />
                  <Text mt={4} color="whiteAlpha.600" fontSize="15px">Loading video...</Text>
                </Center>
              ) : videoUrl ? (
                <Box
                  ref={videoPreviewContainerRef}
                  position="relative"
                  maxW="85%"
                  maxH="85%"
                  aspectRatio={aspectRatioCss}
                  flexShrink={0}
                  overflow="hidden"
                  bg="#000"
                  borderRadius="12px"
                  boxShadow="0 8px 32px rgba(0, 0, 0, 0.6)"
                  border={ratio !== 'original' && isDraggingCrop ? '1px solid rgba(255, 255, 255, 0.22)' : 'none'}
                  transition="border 0.15s ease"
                  onMouseDown={onCropMouseDown}
                  onTouchStart={onCropTouchStart}
                  onTouchMove={onCropTouchMove}
                  onTouchEnd={onCropTouchEnd}
                  onTouchCancel={onCropTouchEnd}
                  cursor={ratio !== 'original' ? 'grab' : undefined}
                  _active={ratio !== 'original' ? { cursor: 'grabbing' } : undefined}
                >
                  <Box
                    as="video"
                    ref={videoRef}
                    src={videoUrl}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                    playsInline
                    muted
                    onLoadedMetadata={handleVideoLoadedMetadata}
                    style={{
                      display: 'block',
                      ...(ratio !== 'original'
                        ? {
                            transformOrigin: 'center center',
                            transform: `translate(${cropPositionX}%, ${cropPositionY}%) scale(${cropZoom})`,
                          }
                        : {}),
                    }}
                  />
                  {/* Edit grid overlay – rule-of-thirds, always visible when cropping */}
                  {ratio !== 'original' && (
                    <Box
                      position="absolute"
                      inset={0}
                      pointerEvents="none"
                      zIndex={1}
                    >
                      <Box position="absolute" left="33.333%" top={0} bottom={0} w="1px" maxW="1px" minW="1px" borderLeft="1px solid rgba(255, 255, 255, 0.22)" />
                      <Box position="absolute" left="66.666%" top={0} bottom={0} w="1px" maxW="1px" minW="1px" borderLeft="1px solid rgba(255, 255, 255, 0.22)" />
                      <Box position="absolute" top="33.333%" left={0} right={0} h="1px" maxH="1px" minH="1px" borderTop="1px solid rgba(255, 255, 255, 0.22)" />
                      <Box position="absolute" top="66.666%" left={0} right={0} h="1px" maxH="1px" minH="1px" borderTop="1px solid rgba(255, 255, 255, 0.22)" />
                    </Box>
                  )}
                  {/* Stronger grid when dragging to reposition */}
                  {ratio !== 'original' && isDraggingCrop && (
                    <Box
                      position="absolute"
                      inset={0}
                      pointerEvents="none"
                      zIndex={2}
                    >
                      <Box position="absolute" left="33.333%" top={0} bottom={0} w="1px" borderLeft="1px solid rgba(255, 255, 255, 0.4)" />
                      <Box position="absolute" left="66.666%" top={0} bottom={0} w="1px" borderLeft="1px solid rgba(255, 255, 255, 0.4)" />
                      <Box position="absolute" top="33.333%" left={0} right={0} h="1px" borderTop="1px solid rgba(255, 255, 255, 0.4)" />
                      <Box position="absolute" top="66.666%" left={0} right={0} h="1px" borderTop="1px solid rgba(255, 255, 255, 0.4)" />
                    </Box>
                  )}
                  {/* Playback line at video bottom border */}
                  {duration > 0 && (
                    <Box
                      data-playback-line
                      position="absolute"
                      left={0}
                      right={0}
                      bottom={0}
                      h="4px"
                      bg="rgba(255,255,255,0.15)"
                      cursor="pointer"
                      zIndex={2}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!videoRef.current || !duration) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = (e.clientX - rect.left) / rect.width;
                        const t = Math.max(0, Math.min(duration, x * duration));
                        videoRef.current.currentTime = t;
                        setPlayheadTime(t);
                      }}
                    >
                      <Box
                        position="absolute"
                        left={0}
                        top={0}
                        bottom={0}
                        w={`${(playheadTime / duration) * 100}%`}
                        bg="#FF0050"
                      />
                    </Box>
                  )}
                </Box>
              ) : null}
            </Flex>

            {/* Playback controls only - progress line is on the video bottom */}
            {duration > 0 && videoUrl && (
              <Box flexShrink={0} w="full" px={4} py={2} bg="rgba(0,0,0,0.3)">
                <HStack justify="space-between" spacing={2}>
                  <HStack spacing={0} flex={1}>
                    <Text fontSize="9px" color="whiteAlpha.600" fontWeight="500" mr={2}>Playback</Text>
                    <Tooltip label="Step back">
                      <IconButton icon={<ChevronLeft size={14} />} size="xs" variant="ghost" color="white" onClick={stepBackward} aria-label="Step back" minW="28px" h="28px" _hover={{ bg: 'whiteAlpha.200' }} />
                    </Tooltip>
                    <Tooltip label={isPlaying ? 'Pause' : 'Play'}>
                      <IconButton icon={isPlaying ? <Pause size={16} /> : <Play size={16} />} size="xs" variant="ghost" color="white" onClick={togglePlayPause} aria-label={isPlaying ? 'Pause' : 'Play'} bg="whiteAlpha.200" minW="28px" h="28px" _hover={{ bg: 'whiteAlpha.300' }} />
                    </Tooltip>
                    <Tooltip label="Step forward">
                      <IconButton icon={<ChevronRight size={14} />} size="xs" variant="ghost" color="white" onClick={stepForward} aria-label="Step forward" minW="28px" h="28px" _hover={{ bg: 'whiteAlpha.200' }} />
                    </Tooltip>
                  </HStack>
                  <Text fontSize="10px" color="whiteAlpha.800" fontWeight="600" minW="72px" textAlign="right">
                    {formatTime(playheadTime)} / {formatTime(duration)}
                  </Text>
                </HStack>
              </Box>
            )}

            {/* Trim timeline only - separate strip below playback (trim path, not playback) */}
            {duration > 0 && videoUrl && (
              <Box
                flexShrink={0}
                w="full"
                px={4}
                py={3}
                bg="rgba(18, 18, 18, 0.98)"
                borderTop="1px solid rgba(255, 255, 255, 0.08)"
                sx={{ backdropFilter: 'blur(12px)' }}
              >
                <HStack justify="space-between" mb={2}>
                  <HStack spacing={2}>
                    <Scissors size={12} color="#FF0050" />
                    <Text fontSize="11px" fontWeight="600" color="white">
                      Trim
                    </Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Tooltip label="Set trim start">
                      <Button size="xs" variant="ghost" color="white" onClick={handleCutStart} isDisabled={playheadTime <= trimStart || playheadTime >= effectiveTrimEnd} fontSize="9px" px={1.5} h="20px" _hover={{ bg: 'whiteAlpha.200' }}>Start</Button>
                    </Tooltip>
                    <Tooltip label="Cut middle">
                      <Button size="xs" variant="ghost" color="white" onClick={handleCutMiddle} isDisabled={playheadTime <= trimStart || playheadTime >= effectiveTrimEnd} fontSize="9px" px={1.5} h="20px" _hover={{ bg: 'whiteAlpha.200' }}>Mid</Button>
                    </Tooltip>
                    <Tooltip label="Set trim end">
                      <Button size="xs" variant="ghost" color="white" onClick={handleCutEnd} isDisabled={playheadTime <= trimStart || playheadTime >= effectiveTrimEnd} fontSize="9px" px={1.5} h="20px" _hover={{ bg: 'whiteAlpha.200' }}>End</Button>
                    </Tooltip>
                    <Tooltip label="Reset trim">
                      <IconButton icon={<RotateCcw size={10} />} size="xs" variant="ghost" color="whiteAlpha.600" onClick={handleResetTrim} aria-label="Reset trim" h="20px" minW="20px" _hover={{ bg: 'whiteAlpha.200', color: 'white' }} />
                    </Tooltip>
                  </HStack>
                </HStack>
                <Box
                  ref={timelineContainerRef}
                  position="relative"
                  w="100%"
                  h="40px"
                  bg="rgba(255, 255, 255, 0.06)"
                  borderRadius="6px"
                  overflow="visible"
                  cursor="pointer"
                  onMouseDown={handleTimelineMouseDown}
                  onTouchStart={handleTimelineTouchStart}
                  onTouchMove={handleTimelineTouchMove}
                  onTouchEnd={handleTimelineTouchEnd}
                  userSelect="none"
                >
                  <Box position="absolute" left={0} top={0} bottom={0} w={`${(trimStart / duration) * 100}%`} bg="rgba(0, 0, 0, 0.6)" borderRadius="6px 0 0 6px" />
                  <Box position="absolute" left={`${(effectiveTrimEnd / duration) * 100}%`} top={0} bottom={0} right={0} bg="rgba(0, 0, 0, 0.6)" borderRadius="0 6px 6px 0" />
                  <Box position="absolute" left={`${(trimStart / duration) * 100}%`} top={0} bottom={0} w={`${((effectiveTrimEnd - trimStart) / duration) * 100}%`} bg="rgba(255, 0, 80, 0.2)" borderLeft="2px solid #FF0050" borderRight="2px solid #FF0050" />
                  <Box ref={trimStartHandleRef} data-handle="start" position="absolute" left={`${(trimStart / duration) * 100}%`} top="50%" transform="translate(-50%, -50%)" w="20px" h="36px" bg="#FF0050" borderRadius="4px" cursor="ew-resize" zIndex={3} display="flex" alignItems="center" justifyContent="center" boxShadow="0 2px 6px rgba(255, 0, 80, 0.4)" _hover={{ bg: '#FF1A5E' }}>
                    <Box w="2px" h="14px" bg="white" borderRadius="full" mr="1px" /><Box w="2px" h="14px" bg="white" borderRadius="full" />
                  </Box>
                  <Box ref={trimEndHandleRef} data-handle="end" position="absolute" left={`${(effectiveTrimEnd / duration) * 100}%`} top="50%" transform="translate(-50%, -50%)" w="20px" h="36px" bg="#FF0050" borderRadius="4px" cursor="ew-resize" zIndex={3} display="flex" alignItems="center" justifyContent="center" boxShadow="0 2px 6px rgba(255, 0, 80, 0.4)" _hover={{ bg: '#FF1A5E' }}>
                    <Box w="2px" h="14px" bg="white" borderRadius="full" mr="1px" /><Box w="2px" h="14px" bg="white" borderRadius="full" />
                  </Box>
                  <Box position="absolute" left={`${(playheadTime / duration) * 100}%`} top={0} bottom={0} w="2px" bg="white" transform="translateX(-1px)" zIndex={2} pointerEvents="none" boxShadow="0 0 6px rgba(255,255,255,0.6)">
                    <Box position="absolute" top="-4px" left="50%" transform="translateX(-50%)" w="8px" h="8px" bg="white" borderRadius="full" boxShadow="0 1px 4px rgba(0,0,0,0.3)" />
                  </Box>
                </Box>
                <HStack justify="space-between" mt={1} fontSize="9px" color="whiteAlpha.600" fontWeight="500">
                  <Text>Start: {formatTime(trimStart)}</Text>
                  <Text>Duration: {formatTime(effectiveTrimEnd - trimStart)}</Text>
                  <Text>End: {formatTime(effectiveTrimEnd)}</Text>
                </HStack>
              </Box>
            )}

            {/* Bottom Controls - ratio, thumbnail, music only (scrollable) */}
            <Box
              flexShrink={0}
              minH={0}
              maxH="40vh"
              overflowY="auto"
              overflowX="hidden"
              bg="rgba(18, 18, 18, 0.95)"
              borderTop="1px solid rgba(255, 255, 255, 0.1)"
              sx={{
                backdropFilter: 'blur(20px)',
                WebkitOverflowScrolling: 'touch',
              }}
            >
            <VStack 
              spacing={0} 
              w="full"
              pb={4}
            >
              {/* Aspect Ratio Selector */}
              <HStack
                w="full"
                justify="center"
                py={3}
                px={4}
                spacing={2}
                borderBottom="1px solid rgba(255, 255, 255, 0.05)"
              >
                <Text fontSize="11px" color="whiteAlpha.600" fontWeight="500" mr={1}>
                  Ratio
                </Text>
                {ASPECT_RATIOS.map((r) => (
                  <Button
                    key={r.value}
                    size="xs"
                    variant={ratio === r.value ? 'solid' : 'ghost'}
                    bg={ratio === r.value ? '#FF0050' : 'transparent'}
                    color={ratio === r.value ? 'white' : 'whiteAlpha.700'}
                    onClick={() => setRatio(r.value)}
                    fontSize="11px"
                    fontWeight="600"
                    px={2.5}
                    h="28px"
                    minW="fit-content"
                    borderRadius="6px"
                    border={ratio === r.value ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'}
                    _hover={{ 
                      bg: ratio === r.value ? '#E6004A' : 'whiteAlpha.100',
                      borderColor: 'whiteAlpha.200'
                    }}
                    _active={{ transform: 'scale(0.95)' }}
                  >
                    {r.label}
                  </Button>
                ))}
              </HStack>

              {/* Zoom (only when crop ratio is selected) */}
              {ratio !== 'original' && (
                <Box w="full" py={3} px={4} borderBottom="1px solid rgba(255, 255, 255, 0.05)">
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="11px" color="whiteAlpha.600" fontWeight="500">
                      Zoom
                    </Text>
                    <Text fontSize="11px" color="white" fontWeight="600">
                      {Math.round(cropZoom * 100)}%
                    </Text>
                  </HStack>
                  <HStack spacing={2} align="center">
                    <Tooltip label="Zoom out">
                      <IconButton
                        icon={<Text fontSize="14px" fontWeight="700">−</Text>}
                        size="xs"
                        variant="ghost"
                        color="white"
                        onClick={() => setCropZoom((z) => Math.max(0.5, z - 0.1))}
                        aria-label="Zoom out"
                        minW="32px"
                        h="28px"
                        _hover={{ bg: 'whiteAlpha.200' }}
                      />
                    </Tooltip>
                    <Slider
                      min={0.5}
                      max={2.5}
                      step={0.05}
                      value={cropZoom}
                      onChange={(val) => setCropZoom(val)}
                      flex={1}
                      size="sm"
                      colorScheme="pink"
                      sx={{ '& .chakra-slider__track': { bg: 'whiteAlpha.200' }, '& .chakra-slider__filled-track': { bg: '#FF0050' }, '& .chakra-slider__thumb': { bg: '#FF0050' } }}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb boxSize={4} />
                    </Slider>
                    <Tooltip label="Zoom in">
                      <IconButton
                        icon={<Text fontSize="14px" fontWeight="700">+</Text>}
                        size="xs"
                        variant="ghost"
                        color="white"
                        onClick={() => setCropZoom((z) => Math.min(2.5, z + 0.1))}
                        aria-label="Zoom in"
                        minW="32px"
                        h="28px"
                        _hover={{ bg: 'whiteAlpha.200' }}
                      />
                    </Tooltip>
                  </HStack>
                </Box>
              )}

              {/* Thumbnail Section */}
              <Box w="full" px={4} py={4} borderBottom="1px solid rgba(255, 255, 255, 0.05)">
                {showThumbnailTimeline ? (
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <ImageIcon size={14} color="#FF0050" />
                        <Text fontSize="12px" fontWeight="600" color="white">
                          Select Thumbnail
                        </Text>
                      </HStack>
                      <IconButton
                        icon={<X size={16} />}
                        size="xs"
                        variant="ghost"
                        color="white"
                        onClick={handleCancelThumbnailTimeline}
                        aria-label="Close"
                        _hover={{ bg: 'whiteAlpha.200' }}
                      />
                    </HStack>
                    
                    <Text fontSize="10px" color="whiteAlpha.600">
                      Drag to select thumbnail frame
                    </Text>
                    
                    {/* Thumbnail timeline scrubber */}
                    <Box position="relative">
                      <Slider
                        value={thumbnailPickTime}
                        min={0}
                        max={duration}
                        step={0.1}
                        onChange={(val) => {
                          setThumbnailPickTime(val)
                          if (videoRef.current) {
                            videoRef.current.currentTime = val
                          }
                        }}
                      >
                        <SliderTrack bg="whiteAlpha.200" h="6px" borderRadius="3px">
                          <SliderFilledTrack bg="#FF0050" />
                        </SliderTrack>
                        <SliderThumb boxSize={5} bg="#FF0050" />
                      </Slider>
                      <HStack justify="space-between" mt={1} fontSize="9px" color="whiteAlpha.500">
                        <Text>0:00</Text>
                        <Text>{formatTime(thumbnailPickTime)}</Text>
                        <Text>{formatTime(duration)}</Text>
                      </HStack>
                    </Box>
                    
                    <HStack spacing={2}>
                      <Button
                        flex={1}
                        size="sm"
                        variant="ghost"
                        color="white"
                        onClick={handleCancelThumbnailTimeline}
                        fontSize="11px"
                        h="32px"
                        _hover={{ bg: 'whiteAlpha.200' }}
                      >
                        Cancel
                      </Button>
                      <Button
                        flex={1}
                        size="sm"
                        bg="#FF0050"
                        color="white"
                        onClick={handleConfirmThumbnailTime}
                        isLoading={thumbnailLoading}
                        fontSize="11px"
                        h="32px"
                        fontWeight="600"
                        _hover={{ bg: '#E6004A' }}
                      >
                        Confirm
                      </Button>
                    </HStack>
                  </VStack>
                ) : thumbnailPreviewUrl ? (
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <ImageIcon size={14} color="#FF0050" />
                        <Text fontSize="12px" fontWeight="600" color="white">
                          Thumbnail
                        </Text>
                      </HStack>
                      
                      <Input
                        type="file"
                        accept="image/*"
                        display="none"
                        id="video-editor-thumb-upload"
                        onChange={handleThumbnailUpload}
                      />
                      <Button
                        size="xs"
                        variant="ghost"
                        color="whiteAlpha.700"
                        leftIcon={<ImageIcon size={12} />}
                        onClick={() => document.getElementById('video-editor-thumb-upload')?.click()}
                        fontSize="10px"
                        h="22px"
                        px={2}
                        _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                      >
                        Upload
                      </Button>
                    </HStack>
                    
                    <HStack 
                      spacing={3} 
                      p={2.5} 
                      bg="rgba(255, 255, 255, 0.05)" 
                      borderRadius="8px"
                      cursor="pointer"
                      onClick={handleOpenThumbnailTimeline}
                      _hover={{ bg: 'rgba(255, 255, 255, 0.08)' }}
                      transition="background 0.2s"
                    >
                      <Box
                        w="50px"
                        aspectRatio={aspectRatioCss}
                        borderRadius="6px"
                        overflow="hidden"
                        border="2px solid #FF0050"
                        flexShrink={0}
                      >
                        <Image
                          src={thumbnailPreviewUrl}
                          alt="Thumbnail preview"
                          w="100%"
                          h="100%"
                          objectFit="cover"
                        />
                      </Box>
                      <VStack align="start" spacing={0.5} flex={1}>
                        <HStack spacing={1}>
                          <Check size={12} color="#00FF88" />
                          <Text fontSize="11px" color="white" fontWeight="600">
                            Thumbnail set
                          </Text>
                        </HStack>
                        <Text fontSize="9px" color="whiteAlpha.500">
                          Tap to change
                        </Text>
                      </VStack>
                    </HStack>
                  </VStack>
                ) : (
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <ImageIcon size={14} color="#FF0050" />
                        <Text fontSize="12px" fontWeight="600" color="white">
                          Thumbnail
                        </Text>
                      </HStack>
                      
                      <Input
                        type="file"
                        accept="image/*"
                        display="none"
                        id="video-editor-thumb-upload"
                        onChange={handleThumbnailUpload}
                      />
                      <Button
                        size="xs"
                        variant="ghost"
                        color="whiteAlpha.700"
                        leftIcon={<ImageIcon size={12} />}
                        onClick={() => document.getElementById('video-editor-thumb-upload')?.click()}
                        fontSize="10px"
                        h="22px"
                        px={2}
                        _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                      >
                        Upload
                      </Button>
                    </HStack>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      borderColor="whiteAlpha.300"
                      color="white"
                      onClick={handleOpenThumbnailTimeline}
                      fontSize="11px"
                      h="36px"
                      fontWeight="500"
                      _hover={{ bg: 'whiteAlpha.100', borderColor: 'whiteAlpha.400' }}
                    >
                      Select from timeline
                    </Button>
                  </VStack>
                )}
              </Box>

              {/* Music Section */}
              <Box w="full" px={4} py={4}>
                <HStack justify="space-between" mb={3}>
                  <HStack spacing={2}>
                    <Music size={14} color="#FF0050" />
                    <Text fontSize="12px" fontWeight="600" color="white">
                      Music
                    </Text>
                  </HStack>
                </HStack>

                {selectedSound ? (
                  <Flex
                    align="center"
                    justify="space-between"
                    p={3}
                    borderRadius="8px"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                  >
                    <HStack spacing={3} flex={1} minW={0}>
                      {selectedSound?.thumbnail ? (
                        <Image 
                          src={selectedSound.thumbnail} 
                          alt="" 
                          boxSize="40px" 
                          borderRadius="6px" 
                          objectFit="cover" 
                        />
                      ) : (
                        <Flex
                          w="40px"
                          h="40px"
                          align="center"
                          justify="center"
                          borderRadius="6px"
                          bg="rgba(255, 0, 80, 0.2)"
                        >
                          <Music size={18} color="#FF0050" />
                        </Flex>
                      )}
                      <Box minW={0}>
                        <Text fontSize="12px" fontWeight="600" color="white" noOfLines={1}>
                          {selectedSound?.title}
                        </Text>
                        {selectedSound?.artist && (
                          <Text fontSize="10px" color="whiteAlpha.600" noOfLines={1}>
                            {selectedSound.artist}
                          </Text>
                        )}
                      </Box>
                    </HStack>
                    <IconButton
                      aria-label="Remove music"
                      icon={<X size={14} />}
                      size="xs"
                      variant="ghost"
                      color="white"
                      _hover={{ bg: 'whiteAlpha.200' }}
                      onClick={() => setSelectedSound(null)}
                    />
                  </Flex>
                ) : (
                  <Button
                    size="sm"
                    leftIcon={<Music size={16} />}
                    variant="outline"
                    borderColor="whiteAlpha.300"
                    color="white"
                    w="full"
                    onClick={onMusicSearchOpen}
                    h="40px"
                    fontSize="11px"
                    fontWeight="600"
                    borderRadius="full"
                    _hover={{ bg: 'whiteAlpha.100', borderColor: 'whiteAlpha.400' }}
                  >
                    Add music to video
                  </Button>
                )}
              </Box>
            </VStack>
            </Box>
          </Flex>
        </ModalContent>
      </Modal>

      <MusicSearch
        isOpen={isMusicSearchOpen}
        onClose={onMusicSearchClose}
        onSelectSound={(soundData) => {
          setSelectedSound(soundData)
          onMusicSearchClose()
        }}
        postImages={[]}
      />
    </>
  )
}

export default VideoEditor