import {
  Box,
  Button,
  Text,
  HStack,
  IconButton,
  useColorModeValue,
  Image,
  FormControl,
  FormLabel,
} from '@chakra-ui/react'
import { Upload, X } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

const FileUpload = ({
  accept = 'image/*',
  value = null,
  onChange,
  preview = true,
  maxSize = 5,
  label,
  helperText,
  error,
  existingImage = null, // For showing existing image URL
}) => {
  const inputRef = useRef(null)
  const [previewUrl, setPreviewUrl] = useState(existingImage || null)

  const borderColor = useColorModeValue('gray.300', 'gray.600')
  const bgColor = useColorModeValue('gray.50', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const handleFile = (file) => {
    if (!file) return

    const fileSize = file.size / 1024 / 1024
    if (fileSize > maxSize) {
      return
    }

    onChange(file)

    if (preview && accept.includes('image') && file.type?.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }
  
  // Update preview when existingImage changes
  useEffect(() => {
    if (existingImage && !value) {
      setPreviewUrl(existingImage)
    } else if (!value && !existingImage) {
      setPreviewUrl(null)
    }
  }, [existingImage, value])

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleRemove = () => {
    onChange(null)
    setPreviewUrl(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <FormControl>
      {label && <FormLabel mb={2}>{label}</FormLabel>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {preview && previewUrl && (accept.includes('image') || accept === 'image/*') ? (
        <Box position="relative" w="full">
          <Box
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            p={2}
            bg={bgColor}
            w="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Image
              src={previewUrl}
              alt="Preview"
              maxH="120px"
              maxW="100%"
              borderRadius="md"
              objectFit="contain"
            />
          </Box>
          <IconButton
            icon={<X size={14} />}
            size="xs"
            colorScheme="red"
            variant="solid"
            position="absolute"
            top={1}
            right={1}
            onClick={handleRemove}
            aria-label="Remove image"
          />
          <Button
            size="xs"
            mt={2}
            leftIcon={<Upload size={14} />}
            onClick={() => inputRef.current?.click()}
            variant="outline"
            w="full"
          >
            Change Image
          </Button>
        </Box>
      ) : (
        <Box>
          <Button
            leftIcon={<Upload size={16} />}
            onClick={() => inputRef.current?.click()}
            variant="outline"
            w="full"
            size="sm"
          >
            {value ? 'Change File' : 'Select File'}
          </Button>
          {helperText && (
            <Text fontSize="xs" color={textColor} mt={1}>
              {helperText} (Max {maxSize}MB)
            </Text>
          )}
        </Box>
      )}

      {error && (
        <Text fontSize="sm" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </FormControl>
  )
}

export default FileUpload

