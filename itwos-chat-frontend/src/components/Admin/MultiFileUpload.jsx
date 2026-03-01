import {
  Box,
  Button,
  Text,
  HStack,
  IconButton,
  useColorModeValue,
  Image,
  SimpleGrid,
  FormControl,
  FormLabel,
} from '@chakra-ui/react'
import { Upload, X, File as FileIcon } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'

const MultiFileUpload = ({
  accept = 'image/*,application/pdf,.doc,.docx',
  value = [],
  onChange,
  maxSize = 10,
  maxFiles = 10,
  label,
  helperText,
  error,
}) => {
  const inputRef = useRef(null)
  const [files, setFiles] = useState(value || [])

  const borderColor = useColorModeValue('gray.300', 'gray.600')
  const bgColor = useColorModeValue('gray.50', 'gray.600')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const handleFile = (newFiles) => {
    if (!newFiles || newFiles.length === 0) return

    const fileArray = Array.from(newFiles)
    const validFiles = []

    fileArray.forEach((file) => {
      const fileSize = file.size / 1024 / 1024
      if (fileSize > maxSize || files.length + validFiles.length >= maxFiles) {
        return
      }
      validFiles.push(file)
    })

    const updatedFiles = [...files, ...validFiles]
    setFiles(updatedFiles)
    onChange(updatedFiles)
  }

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files)
    }
  }

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onChange(updatedFiles)
  }

  useEffect(() => {
    if (value && Array.isArray(value) && value.length !== files.length) {
      setFiles(value)
    }
  }, [value])

  return (
    <FormControl>
      {label && <FormLabel mb={2}>{label}</FormLabel>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {files.length > 0 && (
        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2} mb={3}>
          {files.map((file, idx) => {
            const isFileObject = file && typeof file === 'object' && file.constructor && file.constructor.name === 'File'
            const isImage = (isFileObject && file.type?.startsWith('image/')) || (typeof file === 'string' && /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            const previewUrl = isFileObject && file.type?.startsWith('image/')
              ? URL.createObjectURL(file)
              : typeof file === 'string' && /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
              ? file
              : null

            return (
              <Box key={idx} position="relative" w="full">
                <Box
                  border="1px solid"
                  borderColor={borderColor}
                  borderRadius="md"
                  overflow="hidden"
                  h="80px"
                  w="full"
                  bg={bgColor}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt={`Preview ${idx + 1}`}
                      h="80px"
                      w="full"
                      objectFit="cover"
                    />
                  ) : (
                    <FileIcon size={24} />
                  )}
                </Box>
                <IconButton
                  icon={<X size={12} />}
                  size="xs"
                  colorScheme="red"
                  variant="solid"
                  position="absolute"
                  top={0}
                  right={0}
                  onClick={() => removeFile(idx)}
                  aria-label="Remove file"
                />
              </Box>
            )
          })}
        </SimpleGrid>
      )}

      <Button
        leftIcon={<Upload size={16} />}
        onClick={() => inputRef.current?.click()}
        variant="outline"
        w="full"
        size="sm"
        isDisabled={files.length >= maxFiles}
      >
        {files.length > 0 ? `Add More Files (${files.length}/${maxFiles})` : 'Select Files'}
      </Button>
      
      {helperText && (
        <Text fontSize="xs" color={textColor} mt={1}>
          {helperText} (Max {maxSize}MB per file, {maxFiles} files max)
        </Text>
      )}

      {error && (
        <Text fontSize="sm" color="red.500" mt={1}>
          {error}
        </Text>
      )}
    </FormControl>
  )
}

export default MultiFileUpload
