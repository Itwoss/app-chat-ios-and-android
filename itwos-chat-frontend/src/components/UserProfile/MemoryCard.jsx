import { Box, Image, Text, useColorModeValue, IconButton, useDisclosure } from '@chakra-ui/react'
import { Trash2 } from 'lucide-react'
import { useDeleteMemoryMutation } from '../../store/api/userApi'
import { useUserProfile } from './UserProfileContext'
import MemoryViewModal from './MemoryViewModal'

function formatMemoryDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function MemoryCard({ memory, onDeleted }) {
  const { theme } = useUserProfile()
  const { textColor = 'inherit', borderColor = 'gray.200', cardBg = 'gray.100' } = theme || {}
  const borderColorHover = useColorModeValue('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.3)')
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [deleteMemory, { isLoading }] = useDeleteMemoryMutation()

  const imageUrl = memory?.images?.[0]
  const caption = memory?.caption?.trim()
  const dateLabel = formatMemoryDate(memory?.memoryDate)

  const handleDelete = async () => {
    if (!memory?._id) return
    try {
      await deleteMemory(memory._id).unwrap()
      onDeleted?.()
    } catch (e) {}
  }

  return (
    <>
      <Box
        position="relative"
        borderRadius="lg"
        overflow="hidden"
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        cursor="pointer"
        onClick={onOpen}
        transition="all 0.2s"
        _hover={{ borderColor: borderColorHover }}
        aspectRatio="1 / 1"
      >
        {imageUrl ? (
          <Image src={imageUrl} alt="Memory" w="full" h="full" objectFit="cover" />
        ) : (
          <Box w="full" h="full" bg={cardBg} display="flex" alignItems="center" justifyContent="center">
            <Text color={textColor} fontSize="sm">No image</Text>
          </Box>
        )}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bgGradient="linear(to-t, rgba(0,0,0,0.85), transparent)"
          p={2}
          pt={6}
        >
          <Text color="white" fontSize="xs" fontWeight="600">{dateLabel}</Text>
          {caption && (
            <Text color="whiteAlpha.900" fontSize="xs" noOfLines={1}>{caption}</Text>
          )}
        </Box>
        <IconButton
          aria-label="Delete memory"
          icon={<Trash2 size={16} />}
          size="xs"
          position="absolute"
          top={2}
          right={2}
          borderRadius="full"
          colorScheme="red"
          opacity={0.9}
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          isLoading={isLoading}
        />
      </Box>
      <MemoryViewModal
        memory={memory}
        isOpen={isOpen}
        onClose={onClose}
        onDeleted={onDeleted}
      />
    </>
  )
}
