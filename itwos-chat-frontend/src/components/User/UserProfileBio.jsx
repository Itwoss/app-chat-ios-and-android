import { Box, Text, FormControl, FormLabel, Textarea, useColorModeValue } from '@chakra-ui/react'

const BIO_MAX_LENGTH = 500

/**
 * UserProfileBio - Bio display (view) and bio field (edit) for user profile.
 * View: Instagram-style full-width block below stats.
 * Edit: Form field with character count.
 */
const UserProfileBio = ({
  mode = 'view',
  /** For view mode: bio text to display */
  bio = '',
  /** For edit mode: controlled value */
  value = '',
  /** For edit mode: change handler (e) => void */
  onChange,
  /** Theme: text color */
  textColor,
  /** Theme: secondary text color */
  subtextColor,
  /** Theme: border color */
  borderColor,
  /** Theme: placeholder color */
  placeholderColor,
  /** Theme: focus border color */
  focusBorderColor,
}) => {
  const inputBg = useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')

  if (mode === 'view') {
    const displayBio = (bio ?? '').trim()
    if (!displayBio) return null
    return (
      <Box w="100%" textAlign="start" pt={3} pb={1} px={0}>
        <Text
          color={textColor}
          fontSize="sm"
          lineHeight="1.6"
          whiteSpace="pre-wrap"
          wordBreak="break-word"
        >
          {displayBio}
        </Text>
      </Box>
    )
  }

  // Edit mode
  const bioValue = value ?? ''
  return (
    <FormControl>
      <FormLabel color={textColor} fontSize="13px" mb={1}>Bio</FormLabel>
      <Textarea
        name="bio"
        value={bioValue}
        onChange={onChange}
        placeholder="Tell others about yourself (max 500 characters)"
        maxLength={BIO_MAX_LENGTH}
        rows={3}
        borderRadius="8px"
        size="sm"
        bg={inputBg}
        border="1px solid"
        borderColor={borderColor}
        color={textColor}
        _placeholder={{ color: placeholderColor }}
        _focus={{ borderColor: focusBorderColor, boxShadow: 'none' }}
      />
      <Text fontSize="xs" color={subtextColor} mt={1}>
        {bioValue.length}/{BIO_MAX_LENGTH}
      </Text>
    </FormControl>
  )
}

export default UserProfileBio
export { BIO_MAX_LENGTH }
