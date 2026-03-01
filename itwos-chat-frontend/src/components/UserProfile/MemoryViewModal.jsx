import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Box,
  Image,
  Text,
  useColorModeValue,
  IconButton,
  HStack,
} from '@chakra-ui/react'
import { Trash2 } from 'lucide-react'
import { useDeleteMemoryMutation } from '../../store/api/userApi'

function formatMemoryDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function MemoryViewModal({ memory, isOpen, onClose, onDeleted }) {
  const textColor = useColorModeValue('#000000', 'rgba(255, 255, 255, 1)')
  const borderColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)')
  const [deleteMemory, { isLoading }] = useDeleteMemoryMutation()

  const handleDelete = async () => {
    if (!memory?._id) return
    try {
      await deleteMemory(memory._id).unwrap()
      onDeleted?.()
      onClose()
    } catch (e) {
      // toast optional
    }
  }

  if (!memory) return null

  const images = memory.images || []
  const caption = memory.caption?.trim()
  const dateLabel = formatMemoryDate(memory.memoryDate)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent bg={useColorModeValue('#FFFFFF', '#171717')} border="1px solid" borderColor={borderColor} maxH="90vh">
        <ModalCloseButton color={textColor} />
        <ModalBody p={4} overflowY="auto">
          {images.length > 0 && (
            <Box mb={3}>
              {images.length === 1 ? (
                <Image src={images[0]} alt="Memory" w="full" maxH="60vh" objectFit="contain" borderRadius="md" />
              ) : (
                <HStack spacing={2} overflowX="auto" pb={2} align="flex-start">
                  {images.map((url, i) => (
                    <Image key={i} src={url} alt={`Memory ${i + 1}`} maxH="50vh" objectFit="contain" borderRadius="md" flexShrink={0} />
                  ))}
                </HStack>
              )}
            </Box>
          )}
          <Text color={textColor} fontSize="sm" fontWeight="600">{dateLabel}</Text>
          {caption && <Text color={textColor} fontSize="sm" mt={1}>{caption}</Text>}
          <Box mt={3}>
            <IconButton
              aria-label="Delete memory"
              icon={<Trash2 size={18} />}
              size="sm"
              colorScheme="red"
              onClick={handleDelete}
              isLoading={isLoading}
            >
              Delete memory
            </IconButton>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
