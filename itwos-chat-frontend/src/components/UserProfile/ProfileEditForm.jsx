import {
  VStack,
  HStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  IconButton,
  SimpleGrid,
  Select,
  Divider,
  InputGroup,
  InputRightElement,
  Box,
  useColorModeValue,
} from '@chakra-ui/react'
import { X, Check, Eye, EyeOff } from 'lucide-react'
import FileUpload from '../Admin/FileUpload'
import UserProfileBio from '../User/UserProfileBio'
import { useUserProfile } from './UserProfileContext'

const SimpleSelect = ({ options = [], value, onChange, placeholder, isDisabled, isLoading }) => (
  <Select
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    isDisabled={isDisabled}
  >
    {options.map((opt) => (
      <option key={opt.value || opt.name} value={opt.value ?? opt.name}>{opt.name || opt.value}</option>
    ))}
  </Select>
)

export default function ProfileEditForm() {
  const {
    theme,
    formData,
    handleChange,
    handleCountryChange,
    handleStateChange,
    handleCityChange,
    handleSubmit,
    handleCancel,
    countries,
    states,
    cities,
    selectedCountryCode,
    selectedStateCode,
    locationLoading,
    locationError,
    profileImage,
    setProfileImage,
    previewImage,
    setPreviewImage,
    bioInputRef,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isLoading,
    displayedUser,
    isOwnProfile,
    currentUserData,
    getUserInfo,
  } = useUserProfile()

  const { textColor, subtextColor, borderColor, borderColorHover, inputPlaceholder, inputFocusBorder, accentBlue } = theme

  const existingImage = previewImage || displayedUser?.profileImage || (isOwnProfile ? currentUserData?.data?.profileImage : null) || getUserInfo()?.profileImage

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <Heading size="sm" color={textColor} fontWeight="700">Edit Profile</Heading>
          <IconButton icon={<X size={16} />} aria-label="Cancel" onClick={handleCancel} variant="ghost" borderRadius="full" size="sm" />
        </HStack>

        <Divider />

        <FileUpload
          label="Profile Picture"
          accept="image/*"
          value={profileImage}
          onChange={(file) => {
            setProfileImage(file)
            if (file) {
              const reader = new FileReader()
              reader.onloadend = () => setPreviewImage(reader.result)
              reader.readAsDataURL(file)
            } else {
              setPreviewImage(null)
            }
          }}
          maxSize={5}
          helperText="Upload your profile picture"
          existingImage={existingImage}
        />

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <FormControl isRequired>
            <FormLabel color={textColor} fontSize="13px" mb={1}>Name</FormLabel>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              borderRadius="8px"
              size="sm"
              bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
              border="1px solid"
              borderColor={borderColor}
              color={textColor}
              _placeholder={{ color: inputPlaceholder }}
              _focus={{ borderColor: inputFocusBorder, boxShadow: 'none' }}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel color={textColor} fontSize="13px" mb={1}>Email</FormLabel>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              borderRadius="8px"
              size="sm"
              bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
              border="1px solid"
              borderColor={borderColor}
              color={textColor}
              _placeholder={{ color: inputPlaceholder }}
              _focus={{ borderColor: inputFocusBorder, boxShadow: 'none' }}
            />
          </FormControl>
        </SimpleGrid>

        <UserProfileBio
          mode="edit"
          value={formData.bio || ''}
          onChange={(e) => {
            bioInputRef.current = e.target.value
            handleChange(e)
          }}
          textColor={textColor}
          subtextColor={subtextColor}
          borderColor={borderColor}
          placeholderColor={inputPlaceholder}
          focusBorderColor={inputFocusBorder}
        />

        <FormControl isRequired>
          <FormLabel color={textColor} fontSize="13px" mb={1}>Phone Number</FormLabel>
          <HStack>
            <Input
              w="30%"
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              borderRadius="8px"
              size="sm"
              bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
              border="1px solid"
              borderColor={borderColor}
              color={textColor}
              _placeholder={{ color: inputPlaceholder }}
              _focus={{ borderColor: inputFocusBorder, boxShadow: 'none' }}
            />
            <Input
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              borderRadius="8px"
              size="sm"
              bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
              border="1px solid"
              borderColor={borderColor}
              color={textColor}
              _placeholder={{ color: inputPlaceholder }}
              _focus={{ borderColor: inputFocusBorder, boxShadow: 'none' }}
            />
          </HStack>
        </FormControl>

        <Divider />

        <Box data-address-section>
          <Heading size="sm" mb={2} color={textColor} fontWeight="700">Address Information</Heading>
          <Text color={subtextColor} fontSize="12px" mb={3}>
            Add your address to discover people near you (Required)
          </Text>
        </Box>

        <FormControl>
          <FormLabel color={textColor} fontSize="13px" mb={1}>Street Address</FormLabel>
          <Input
            name="address.street"
            value={formData.address.street}
            onChange={handleChange}
            placeholder="Street address, apartment, suite, etc."
            borderRadius="8px"
            size="sm"
            bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
            border="1px solid"
            borderColor={borderColor}
            color={textColor}
            _placeholder={{ color: inputPlaceholder }}
            _focus={{ borderColor: inputFocusBorder, boxShadow: 'none' }}
          />
        </FormControl>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <FormControl isRequired>
            <FormLabel color={textColor} fontSize="13px" mb={1}>Country</FormLabel>
            <SimpleSelect
              options={countries}
              value={selectedCountryCode}
              onChange={handleCountryChange}
              placeholder="Search and select country..."
              isDisabled={locationLoading.countries}
              isLoading={locationLoading.countries}
            />
            {locationLoading.countries && <Text fontSize="xs" color={textColor} mt={1}>Loading countries...</Text>}
            {countries.length === 0 && !locationLoading.countries && locationError && <Text fontSize="xs" color="red.500" mt={1}>{locationError}</Text>}
            {countries.length === 0 && !locationLoading.countries && !locationError && <Text fontSize="xs" color={textColor} mt={1}>No countries available. Please refresh the page.</Text>}
          </FormControl>
          <FormControl isRequired>
            <FormLabel color={textColor} fontSize="13px" mb={1}>State / Province</FormLabel>
            <SimpleSelect
              options={states}
              value={selectedStateCode}
              onChange={handleStateChange}
              placeholder={selectedCountryCode ? 'Search and select state...' : 'Select Country First'}
              isDisabled={!selectedCountryCode || locationLoading.states}
              isLoading={locationLoading.states}
            />
            {locationLoading.states && <Text fontSize="xs" color={textColor} mt={1}>Loading states...</Text>}
            {!selectedCountryCode && <Text fontSize="xs" color={textColor} mt={1}>Please select a country first</Text>}
          </FormControl>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <FormControl isRequired>
            <FormLabel color={textColor} fontSize="13px" mb={1}>City / District</FormLabel>
            <SimpleSelect
              options={cities.map((city) => ({ name: city.name, value: city.name }))}
              value={formData.address.district}
              onChange={handleCityChange}
              placeholder={selectedStateCode ? 'Search and select city...' : 'Select State First'}
              isDisabled={!selectedStateCode || locationLoading.cities}
              isLoading={locationLoading.cities}
            />
            {locationLoading.cities && <Text fontSize="xs" color={textColor} mt={1}>Loading cities...</Text>}
            {!selectedStateCode && cities.length === 0 && <Text fontSize="xs" color={textColor} mt={1}>Select a state to see cities</Text>}
            {selectedStateCode && cities.length === 0 && !locationLoading.cities && <Text fontSize="xs" color={textColor} mt={1}>No cities available for this state</Text>}
          </FormControl>
          <FormControl>
            <FormLabel color={textColor} fontSize="13px" mb={1}>Pin Code / Postal Code</FormLabel>
            <Input
              name="address.pinCode"
              value={formData.address.pinCode}
              onChange={handleChange}
              placeholder="Pin Code / Postal Code"
              borderRadius="8px"
              size="sm"
              bg={useColorModeValue('rgba(0, 0, 0, 0.05)', 'rgba(255, 255, 255, 0.05)')}
              border="1px solid"
              borderColor={borderColor}
              color={textColor}
              _placeholder={{ color: inputPlaceholder }}
              _focus={{ borderColor: inputFocusBorder, boxShadow: 'none' }}
            />
          </FormControl>
        </SimpleGrid>

        <Divider />

        <FormControl>
          <FormLabel color={textColor} fontSize="13px" mb={1}>Account Type</FormLabel>
          <Select
            name="accountType"
            value={formData.accountType}
            onChange={handleChange}
            borderRadius="8px"
            size="sm"
            bg="rgba(255, 255, 255, 0.05)"
            border="1px solid"
            borderColor={borderColor}
            color={textColor}
            _placeholder={{ color: useColorModeValue('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.3)') }}
            _focus={{ borderColor: borderColorHover, boxShadow: 'none' }}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </Select>
        </FormControl>

        <Divider />

        <Text fontWeight="600" fontSize="14px" color={textColor} mb={2}>
          Change Password (leave blank to keep current password)
        </Text>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
          <FormControl>
            <FormLabel color={textColor} fontSize="13px" mb={1}>New Password</FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current"
                borderRadius="8px"
                size="sm"
                bg={useColorModeValue('white', 'gray.700')}
                border="1px solid"
                borderColor={borderColor}
                _focus={{ borderColor: accentBlue, boxShadow: `0 0 0 1px ${accentBlue}` }}
              />
              <InputRightElement>
                <IconButton size="xs" variant="ghost" onClick={() => setShowPassword(!showPassword)} icon={showPassword ? <EyeOff size={14} /> : <Eye size={14} />} borderRadius="full" />
              </InputRightElement>
            </InputGroup>
          </FormControl>
          <FormControl>
            <FormLabel color={textColor} fontSize="13px" mb={1}>Confirm Password</FormLabel>
            <InputGroup>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                borderRadius="8px"
                size="sm"
                bg={useColorModeValue('white', 'gray.700')}
                border="1px solid"
                borderColor={borderColor}
                _focus={{ borderColor: accentBlue, boxShadow: `0 0 0 1px ${accentBlue}` }}
              />
              <InputRightElement>
                <IconButton size="xs" variant="ghost" onClick={() => setShowConfirmPassword(!showConfirmPassword)} icon={showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />} borderRadius="full" />
              </InputRightElement>
            </InputGroup>
          </FormControl>
        </SimpleGrid>

        <HStack justify="flex-end" pt={3}>
          <Button variant="ghost" onClick={handleCancel} borderRadius="full" px={4} size="sm" fontSize="13px" isDisabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            bgGradient="linear(to-r, #007AFF, #5856D6)"
            color={textColor}
            leftIcon={<Check size={16} />}
            borderRadius="full"
            px={4}
            size="sm"
            fontSize="13px"
            isLoading={isLoading}
            loadingText="Updating..."
            _hover={{ transform: 'scale(1.05)', boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)' }}
            _active={{ transform: 'scale(0.98)' }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            Save Changes
          </Button>
        </HStack>
      </VStack>
    </form>
  )
}
