import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  useColorModeValue,
  Text,
  Box,
  HStack,
  Image,
  IconButton,
} from '@chakra-ui/react'
import { useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { useCreateMemoryMutation } from '../../store/api/userApi'
import { useUserProfile } from './UserProfileContext'

export default function AddMemoryModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast()
  const textColor = useColorModeValue('#000000', 'rgba(255, 255, 255, 1)')
  const subtextColor = useColorModeValue('rgba(0, 0, 0, 0.6)', 'rgba(255, 255, 255, 0.6)')
  const borderColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)')
  const inputBg = useColorModeValue('gray.50', 'whiteAlpha.50')

  const fileInputRef = useRef(null)
  const [caption, setCaption] = useState('')
  const [memoryDate, setMemoryDate] = useState('')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])

  const [createMemory, { isLoading }] = useCreateMemoryMutation()

  const handleFileChange = (e) => {
    const chosen = Array.from(e.target.files || [])
    const valid = chosen.filter((f) => f.type.startsWith('image/')).slice(0, 10)
    setFiles(valid)
    const urls = valid.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => {
      prev.forEach((u) => URL.revokeObjectURL(u))
      return urls
    })
  }

  const removePreview = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const reset = () => {
    setCaption('')
    setMemoryDate('')
    setFiles([])
    setPreviews((p) => {
      p.forEach((u) => URL.revokeObjectURL(u))
      return []
    })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!memoryDate.trim()) {
      toast({ title: 'Pick a date', description: 'When is this memory from?', status: 'warning', isClosable: true })
      return
    }
    if (files.length === 0) {
      toast({ title: 'Add at least one photo', description: 'Select one or more images.', status: 'warning', isClosable: true })
      return
    }

    const formData = new FormData()
    formData.append('caption', caption.trim())
    formData.append('memoryDate', memoryDate)
    files.forEach((file) => formData.append('files', file))

    try {
      await createMemory(formData).unwrap()
      toast({ title: 'Memory added', status: 'success', isClosable: true })
      reset()
      onClose()
      onSuccess?.()
    } catch (err) {
      toast({
        title: 'Could not add memory',
        description: err?.data?.message || 'Please try again.',
        status: 'error',
        isClosable: true,
      })
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent bg={useColorModeValue('#FFFFFF', '#171717')} border="1px solid" borderColor={borderColor}>
        <ModalHeader color={textColor}>Add memory</ModalHeader>
        <ModalCloseButton color={textColor} />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel color={subtextColor} fontSize="sm">When is this from? (date / year)</FormLabel>
              <Input
                type="date"
                value={memoryDate}
                onChange={(e) => setMemoryDate(e.target.value)}
                bg={inputBg}
                color={textColor}
                borderColor={borderColor}
              />
            </FormControl>
            <FormControl>
              <FormLabel color={subtextColor} fontSize="sm">Caption (optional)</FormLabel>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a short caption..."
                maxLength={500}
                rows={2}
                bg={inputBg}
                color={textColor}
                borderColor={borderColor}
              />
            </FormControl>
            <FormControl>
              <FormLabel color={subtextColor} fontSize="sm">Photos</FormLabel>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Button
                leftIcon={<Camera size={18} />}
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                borderColor={borderColor}
                color={textColor}
              >
                Choose photos (up to 10)
              </Button>
              {previews.length > 0 && (
                <HStack wrap="wrap" gap={2} mt={2}>
                  {previews.map((url, i) => (
                    <Box key={i} position="relative">
                      <Image src={url} alt={`Preview ${i + 1}`} w="60px" h="60px" objectFit="cover" borderRadius="md" />
                      <IconButton
                        aria-label="Remove"
                        icon={<X size={14} />}
                        size="xs"
                        position="absolute"
                        top={-1}
                        right={-1}
                        borderRadius="full"
                        colorScheme="red"
                        onClick={() => removePreview(i)}
                      />
                    </Box>
                  ))}
                </HStack>
              )}
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor={borderColor}>
          <Button variant="ghost" mr={3} onClick={handleClose} color={textColor}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading} loadingText="Adding...">
            Add memory
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
