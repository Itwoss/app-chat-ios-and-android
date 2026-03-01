import {
  Box,
  VStack,
  HStack,
  Button,
  IconButton,
  Text,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  useToast,
  Spinner,
  Center,
  Flex,
  Input,
} from '@chakra-ui/react'
import { useState, useRef, useEffect } from 'react'
import {
  X,
  Check,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Undo,
  Redo,
  RefreshCw,
  Sun,
  Contrast,
  Droplet,
  Grid3X3,
} from 'lucide-react'

const ASPECT_RATIOS = [
  { value: '4:5', label: '4:5', w: 4, h: 5 },
  { value: '1:1', label: '1:1', w: 1, h: 1 },
  { value: '9:16', label: '9:16', w: 9, h: 16 },
  { value: '16:9', label: '16:9', w: 16, h: 9 },
]

const ADJUSTMENTS = [
  { id: 'brightness', label: 'Brightness', icon: Sun, min: -100, max: 100, default: 0 },
  { id: 'contrast', label: 'Contrast', icon: Contrast, min: -100, max: 100, default: 0 },
  { id: 'saturation', label: 'Saturation', icon: Droplet, min: -100, max: 100, default: 0 },
]

const TOOLS = [
  { id: 'adjust', label: 'Adjust', icon: Sliders },
  { id: 'rotate', label: 'Rotate', icon: RotateCw },
  { id: 'flip', label: 'Flip', icon: FlipHorizontal },
]


const ImageEditor = ({ isOpen, onClose, imageFile, onSave, onCancel }) => {
  const toast = useToast()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  
  const [img, setImg] = useState(null)
  const [ratio, setRatio] = useState('4:5')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  // Transform states
  const [scale, setScale] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  
  // Drag states
  const [isDragging, setIsDragging] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  
  // Adjustments
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(0)
  const [saturation, setSaturation] = useState(0)
  
  // UI state
  const [activeTool, setActiveTool] = useState('adjust')
  const [showGrid, setShowGrid] = useState(false)
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const isDark = useColorModeValue(false, true)
  const bgDark = '#000000'
  const bgLight = '#FFFFFF'

  // CSS aspect-ratio from selected ratio (e.g. '9:16' -> '9 / 16') so preview frame matches crop ratio
  const aspectRatioCss = ratio.replace(':', ' /')
  // Glassmorphism colors matching CreatePostModal
  const glassLight = 'rgba(255, 255, 255, 0.95)'
  const glassDark = 'rgba(28, 28, 30, 0.95)'
  const borderLight = 'rgba(0, 0, 0, 0.08)'
  const borderDark = 'rgba(255, 255, 255, 0.12)'
  const cardBg = useColorModeValue('rgba(255,255,255,0.5)', 'rgba(255,255,255,0.05)')
  const borderColor = useColorModeValue(borderLight, borderDark)
  const textColor = useColorModeValue('#000000', '#FFFFFF')
  const textSecondary = useColorModeValue('#6C6C70', '#98989D')
  const accentColor = '#007AFF'
  
  // Load image
  useEffect(() => {
    if (imageFile && isOpen) {
      setLoading(true)
      const reader = new FileReader()
      reader.onload = (e) => {
        const image = new Image()
        image.onload = () => {
          setImg(image)
          resetTransform()
          setLoading(false)
        }
        image.src = e.target.result
      }
      reader.readAsDataURL(imageFile)
    }
  }, [imageFile, isOpen])
  
  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setImg(null)
      setHistory([])
      setHistoryIndex(-1)
    }
  }, [isOpen])
  
  const resetTransform = () => {
    setScale(1)
    setOffsetX(0)
    setOffsetY(0)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setBrightness(0)
    setContrast(0)
    setSaturation(0)
  }
  
  const saveHistory = () => {
    const state = { scale, offsetX, offsetY, rotation, flipH, flipV, brightness, contrast, saturation }
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(state)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }
  
  const undo = () => {
    if (historyIndex > 0) {
      const state = history[historyIndex - 1]
      setScale(state.scale)
      setOffsetX(state.offsetX)
      setOffsetY(state.offsetY)
      setRotation(state.rotation)
      setFlipH(state.flipH)
      setFlipV(state.flipV)
      setBrightness(state.brightness)
      setContrast(state.contrast)
      setSaturation(state.saturation)
      setHistoryIndex(historyIndex - 1)
    }
  }
  
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const state = history[historyIndex + 1]
      setScale(state.scale)
      setOffsetX(state.offsetX)
      setOffsetY(state.offsetY)
      setRotation(state.rotation)
      setFlipH(state.flipH)
      setFlipV(state.flipV)
      setBrightness(state.brightness)
      setContrast(state.contrast)
      setSaturation(state.saturation)
      setHistoryIndex(historyIndex + 1)
    }
  }
  
  // Draw canvas
  useEffect(() => {
    if (!img || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const selected = ASPECT_RATIOS.find(r => r.value === ratio)
    
    // Set canvas size based on ratio
    const maxSize = 1080
    const w = maxSize
    const h = (maxSize * selected.h) / selected.w
    canvas.width = w
    canvas.height = h
    
    // Clear and fill background
    ctx.fillStyle = isDark ? bgDark : bgLight
    ctx.fillRect(0, 0, w, h)
    
    // Save context
    ctx.save()
    
    // Move to center
    ctx.translate(w / 2, h / 2)
    
    // Apply transforms
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    ctx.scale(scale, scale)
    ctx.translate(offsetX, offsetY)
    
    // Calculate image fit to cover entire canvas
    const imgRatio = img.width / img.height
    const canvasRatio = w / h
    
    let drawW, drawH
    if (imgRatio > canvasRatio) {
      // Image is wider - fit height and extend width
      drawH = h
      drawW = drawH * imgRatio
    } else {
      // Image is taller - fit width and extend height
      drawW = w
      drawH = drawW / imgRatio
    }
    
    // Apply filters
    let filters = []
    if (brightness !== 0) filters.push(`brightness(${1 + brightness / 100})`)
    if (contrast !== 0) filters.push(`contrast(${1 + contrast / 100})`)
    if (saturation !== 0) filters.push(`saturate(${1 + saturation / 100})`)
    ctx.filter = filters.join(' ') || 'none'
    
    // Draw image centered
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()
  }, [img, ratio, scale, offsetX, offsetY, rotation, flipH, flipV, brightness, contrast, saturation, isDark])
  
  // Mouse/Touch handlers
  const handleStart = (e) => {
    e.preventDefault()
    const point = e.touches ? e.touches[0] : e
    setIsDragging(true)
    setLastPos({ x: point.clientX, y: point.clientY })
  }
  
  const handleMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const point = e.touches ? e.touches[0] : e
    const dx = point.clientX - lastPos.x
    const dy = point.clientY - lastPos.y
    setOffsetX(prev => prev + dx / scale)
    setOffsetY(prev => prev + dy / scale)
    setLastPos({ x: point.clientX, y: point.clientY })
  }
  
  const handleEnd = () => {
    if (isDragging) {
      setIsDragging(false)
      saveHistory()
    }
  }
  
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)))
    saveHistory()
  }
  
  // Pinch zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    let lastDist = 0
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastDist = Math.sqrt(dx * dx + dy * dy)
      }
    }
    
    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const delta = (dist - lastDist) * 0.01
        setScale(prev => Math.max(0.5, Math.min(3, prev + delta)))
        lastDist = dist
      }
    }
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
    }
  }, [])
  
  const handleSave = async () => {
    if (!canvasRef.current) return
    setProcessing(true)
    
    canvasRef.current.toBlob((blob) => {
      const file = new File([blob], 'edited.png', { type: 'image/png' })
      const metadata = { ratio, scale, offsetX, offsetY, rotation, flipH, flipV, brightness, contrast, saturation }
      onSave(file, metadata)
      setProcessing(false)
    }, 'image/png', 0.95)
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      motionPreset="fade"
      closeOnOverlayClick={false}
    >
      <ModalOverlay bg="black" />
      <ModalContent
        m={0}
        maxW="100%"
        maxH="100%"
        h="100vh"
        borderRadius={0}
        overflow="hidden"
        bg="black"
      >
        <Flex direction="column" h="100%" w="100%" sx={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
          {/* Header: close, title, undo/redo/reset */}
          <HStack
            flexShrink={0}
            justify="space-between"
            align="center"
            px={{ base: 2, md: 4 }}
            py={3}
            borderBottom="1px solid"
            borderColor="whiteAlpha.200"
            bg="blackAlpha.600"
            sx={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          >
            <HStack spacing={1}>
              <IconButton
                icon={<Undo size={18} />}
                size="sm"
                variant="ghost"
                onClick={undo}
                isDisabled={historyIndex <= 0}
                opacity={historyIndex <= 0 ? 0.4 : 1}
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                aria-label="Undo"
              />
              <IconButton
                icon={<Redo size={18} />}
                size="sm"
                variant="ghost"
                onClick={redo}
                isDisabled={historyIndex >= history.length - 1}
                opacity={historyIndex >= history.length - 1 ? 0.4 : 1}
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                aria-label="Redo"
              />
            <IconButton
              icon={<RefreshCw size={18} />}
              size="sm"
              variant="ghost"
              onClick={resetTransform}
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              aria-label="Reset"
            />
            <IconButton
              icon={<Grid3X3 size={18} />}
              size="sm"
              variant="ghost"
              onClick={() => setShowGrid((g) => !g)}
              bg={showGrid ? 'whiteAlpha.200' : 'transparent'}
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              aria-label={showGrid ? 'Hide grid' : 'Show grid'}
              title={showGrid ? 'Hide composition grid' : 'Show composition grid'}
            />
            </HStack>
            <Text fontSize="16px" fontWeight="600" color="white">
              Edit Image
            </Text>
            <IconButton
              icon={<X size={20} />}
              size="sm"
              variant="ghost"
              onClick={onCancel || onClose}
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              aria-label="Close"
            />
          </HStack>

          {/* Aspect ratio selector - always visible */}
          <HStack
            flexShrink={0}
            justify="center"
            py={2}
            px={2}
            spacing={1}
            bg="blackAlpha.500"
            sx={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          >
            {ASPECT_RATIOS.map((r) => (
              <Button
                key={r.value}
                size="sm"
                variant="ghost"
                bg={ratio === r.value ? 'blue.500' : 'whiteAlpha.100'}
                color="white"
                onClick={() => {
                  setRatio(r.value)
                  resetTransform()
                }}
                fontSize="13px"
                fontWeight="600"
                px={4}
                borderRadius="full"
                _hover={{ bg: ratio === r.value ? 'blue.500' : 'whiteAlpha.200' }}
              >
                {r.label}
              </Button>
            ))}
          </HStack>

          {/* Full-screen preview area - edge-to-edge, respects aspect ratio (Instagram stories/reels style) */}
          <Flex
            ref={containerRef}
            flex={1}
            minH={0}
            align="center"
            justify="center"
            bg="black"
            overflow="hidden"
          >
            {loading ? (
              <Center flexDirection="column">
                <Spinner size="xl" color="blue.500" thickness="3px" />
                <Text mt={4} color="whiteAlpha.600" fontSize="15px">Loading...</Text>
              </Center>
            ) : (
              <Box
                w="100%"
                maxW="100%"
                h="100%"
                maxH="100%"
                aspectRatio={aspectRatioCss}
                flexShrink={0}
                overflow="hidden"
                cursor="grab"
                sx={{ touchAction: 'none', minHeight: 0 }}
                _active={{ cursor: 'grabbing' }}
                position="relative"
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                  onMouseDown={handleStart}
                  onMouseMove={handleMove}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onTouchStart={handleStart}
                  onTouchMove={handleMove}
                  onTouchEnd={handleEnd}
                  onWheel={handleWheel}
                />
                {/* Edit grid overlay – rule-of-thirds, toggleable */}
                {showGrid && (
                  <Box
                    position="absolute"
                    inset={0}
                    pointerEvents="none"
                    zIndex={1}
                  >
                    <Box position="absolute" left="33.333%" top={0} bottom={0} w="1px" borderLeft="1px solid rgba(255, 255, 255, 0.35)" />
                    <Box position="absolute" left="66.666%" top={0} bottom={0} w="1px" borderLeft="1px solid rgba(255, 255, 255, 0.35)" />
                    <Box position="absolute" top="33.333%" left={0} right={0} h="1px" borderTop="1px solid rgba(255, 255, 255, 0.35)" />
                    <Box position="absolute" top="66.666%" left={0} right={0} h="1px" borderTop="1px solid rgba(255, 255, 255, 0.35)" />
                  </Box>
                )}
              </Box>
            )}
          </Flex>

          {/* Bottom: editing options (tools + sliders) + Save/Cancel */}
          <VStack flexShrink={0} align="stretch" spacing={0} bg="blackAlpha.700" sx={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
            {/* Tool Tabs */}
            <HStack
              px={{ base: 3, md: 4 }}
              py={2}
              spacing={1}
              justify="center"
              borderTop="1px solid"
              borderColor="whiteAlpha.200"
            >
              {TOOLS.map((tool) => (
                <Button
                  key={tool.id}
                  size="sm"
                  variant="ghost"
                  leftIcon={<tool.icon size={16} />}
                  bg={activeTool === tool.id ? 'whiteAlpha.200' : 'transparent'}
                  color="white"
                  onClick={() => setActiveTool(tool.id)}
                  fontSize="13px"
                  fontWeight="600"
                  _hover={{ bg: 'whiteAlpha.200' }}
                >
                  {tool.label}
                </Button>
              ))}
            </HStack>

            {/* Dynamic Tool Content */}
            <Box
              px={{ base: 3, md: 4 }}
              py={3}
              maxH="160px"
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: 'rgba(255, 255, 255, 0.2)', borderRadius: '20px' },
              }}
            >
            {activeTool === 'adjust' && (
              <VStack spacing={4} align="stretch">
                {ADJUSTMENTS.map((adj) => {
                  const value = adj.id === 'brightness' ? brightness : adj.id === 'contrast' ? contrast : saturation
                  const setValue = adj.id === 'brightness' ? setBrightness : adj.id === 'contrast' ? setContrast : setSaturation
                  
                  return (
                    <Box key={adj.id}>
                      <HStack justify="space-between" mb={2}>
                        <HStack spacing={2}>
                          <adj.icon size={16} color="white" />
                          <Text fontSize={{ base: '13px', md: '14px' }} fontWeight="500" color="white">{adj.label}</Text>
                        </HStack>
                        <Text fontSize={{ base: '13px', md: '14px' }} color="whiteAlpha.600" fontWeight="500" minW="35px" textAlign="right">
                          {value}
                        </Text>
                      </HStack>
                      <Slider
                        value={value}
                        min={adj.min}
                        max={adj.max}
                        onChange={setValue}
                        onChangeEnd={saveHistory}
                      >
                        <SliderTrack bg="whiteAlpha.100" h="2px">
                          <SliderFilledTrack bg="blue.500" />
                        </SliderTrack>
                        <SliderThumb boxSize={5} bg="blue.500" />
                      </Slider>
                    </Box>
                  )
                })}
              </VStack>
            )}
            
            {activeTool === 'rotate' && (
              <VStack spacing={3} align="stretch">
                <Text fontSize={{ base: '13px', md: '14px' }} fontWeight="500" mb={2} color="white">
                  Rotation: {rotation}°
                </Text>
                <HStack spacing={3} justify="center">
                  <Button
                    size={{ base: "xs", md: "sm" }}
                    variant="outline"
                    leftIcon={<RotateCw size={16} />}
                    onClick={() => { setRotation(r => (r - 90) % 360); saveHistory() }}
                    borderColor="whiteAlpha.100"
                    color="white"
                    bg="transparent"
                    _hover={{ bg: 'whiteAlpha.200' }}
                  >
                    -90°
                  </Button>
                  <Button
                    size={{ base: "xs", md: "sm" }}
                    variant="outline"
                    leftIcon={<RotateCw size={16} />}
                    onClick={() => { setRotation(r => (r + 90) % 360); saveHistory() }}
                    borderColor="whiteAlpha.100"
                    color="white"
                    bg="transparent"
                    _hover={{ bg: 'whiteAlpha.200' }}
                  >
                    +90°
                  </Button>
                </HStack>
              </VStack>
            )}

            {activeTool === 'flip' && (
              <VStack spacing={3} align="stretch">
                <Text fontSize={{ base: '13px', md: '14px' }} fontWeight="500" mb={2} color="white">
                  Flip Image
                </Text>
                <HStack spacing={3} justify="center">
                  <Button
                    size={{ base: "xs", md: "sm" }}
                    variant={flipH ? "solid" : "outline"}
                    leftIcon={<FlipHorizontal size={16} />}
                    onClick={() => { setFlipH(!flipH); saveHistory() }}
                    bg={flipH ? 'blue.500' : 'transparent'}
                    color="white"
                    borderColor="whiteAlpha.100"
                    _hover={{ bg: flipH ? 'blue.500' : 'whiteAlpha.200' }}
                  >
                    Horizontal
                  </Button>
                  <Button
                    size={{ base: "xs", md: "sm" }}
                    variant={flipV ? "solid" : "outline"}
                    leftIcon={<FlipVertical size={16} />}
                    onClick={() => { setFlipV(!flipV); saveHistory() }}
                    bg={flipV ? 'blue.500' : 'transparent'}
                    color="white"
                    borderColor="whiteAlpha.100"
                    _hover={{ bg: flipV ? 'blue.500' : 'whiteAlpha.200' }}
                  >
                    Vertical
                  </Button>
                    </HStack>
              </VStack>
            )}
            </Box>

            {/* Save / Cancel */}
            <HStack
              px={{ base: 3, md: 4 }}
              py={3}
              spacing={3}
              w="full"
              borderTop="1px solid"
              borderColor="whiteAlpha.200"
            >
              <Button
                flex={1}
                size="md"
                variant="ghost"
                color="white"
                onClick={onCancel || onClose}
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                size="md"
                bg="blue.500"
                color="white"
                fontWeight="600"
                onClick={handleSave}
                isLoading={processing}
                loadingText="Saving..."
                _hover={{ bg: 'blue.600' }}
                _active={{ transform: 'scale(0.98)' }}
              >
                Save
              </Button>
            </HStack>
          </VStack>
        </Flex>
      </ModalContent>
    </Modal>
  )
}

export default ImageEditor