import {
  VStack,
  HStack,
  Text,
  useColorModeValue,
  Box,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  Spinner,
  Center,
  SimpleGrid,
} from '@chakra-ui/react'
import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { useGetCurrentUserQuery, useGetUserByIdQuery, useUpdateUserProfileMutation, useGetFollowStatsQuery, useGetFollowersQuery, useGetFollowingQuery, useGetFriendRequestsQuery, useGetUserPostsQuery, useArchivePostMutation, useUnarchivePostMutation, useDeletePostMutation, useGetSavedPostsQuery, useGetMemoriesQuery, useUnfollowUserMutation, useFollowUserMutation, useSendFriendRequestMutation } from '../store/api/userApi'
import { getUserInfo, setAuthData } from '../utils/auth'
import { SESSION_KEYS } from '../utils/storageKeys'
import { useGetUserEquippedBannerQuery } from '../store/api/userApi'
import { useDebounce } from '../hooks/useDebounce'
import { useLocationData } from '../hooks/useLocationData'
import { UserProfileProvider, ProfileHero, ProfileEditForm, ProfilePostsSection, ProfileModals } from '../components/UserProfile'
import PostDetailsSheet from '../components/Posts/PostDetailsSheet'
import EditPostModal from '../components/Posts/EditPostModal'
import { useCreatePost } from '../contexts/CreatePostContext'
import { ProfileSkeleton, PostCardSkeleton } from '../components/Skeletons'

const UserProfile = () => {
  // Origami Project Design System - Theme-aware colors
  const bgColor = useColorModeValue('#F2F2F7', '#0c0c0c') // Light gray / Dark near-black background
  const cardBg = useColorModeValue('#FFFFFF', '#171717') // White / Dark gray card background
  const textColor = useColorModeValue('#000000', 'rgba(255, 255, 255, 1)') // Black / White text
  const subtextColor = useColorModeValue('rgba(0, 0, 0, 0.6)', 'rgba(255, 255, 255, 0.6)') // Dark / White with 60% opacity
  const borderColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)') // Dark / White border with 10% opacity
  const borderColorHover = useColorModeValue('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.3)') // Dark / White border with 30% opacity on hover
  const accentBlue = '#007AFF' // iOS blue
  const accentPurple = '#5856D6' // iOS purple
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.5)') // Light / Dark shadow
  const postHoverShadow = '0.6' // Post hover shadow opacity
  const scrollbarThumb = useColorModeValue('rgba(0, 0, 0, 0.2)', 'rgba(255, 255, 255, 0.2)')
  // Additional theme-aware colors for overlays, shadows, and effects
  const overlayBg = useColorModeValue('rgba(255, 255, 255, 0.3)', 'rgba(0, 0, 0, 0.2)') // Banner overlay - lighter in light mode for better text visibility
  const avatarShadow = useColorModeValue('rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.2)') // Avatar shadow
  const textShadowColor = useColorModeValue('rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.3)') // Text shadow
  const textShadowDark = useColorModeValue('rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.8)') // Dark text shadow for images
  const hoverBgLight = useColorModeValue('rgba(0, 0, 0, 0.08)', 'rgba(255, 255, 255, 0.15)') // Light hover background
  const hoverBgMedium = useColorModeValue('rgba(0, 0, 0, 0.08)', 'rgba(255, 255, 255, 0.1)') // Medium hover background
  const hoverBorderLight = useColorModeValue('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.3)') // Light hover border
  const hoverBorderMedium = useColorModeValue('rgba(0, 0, 0, 0.4)', 'rgba(255, 255, 255, 0.4)') // Medium hover border
  const radialGradientColor = useColorModeValue('rgba(0, 0, 0, 0.15)', 'rgba(255, 255, 255, 0.15)') // Radial gradient for hover
  const borderGlowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.1)') // Border glow
  const gradientOverlay = useColorModeValue('linear(to-t, rgba(0,0,0,0.8), rgba(0,0,0,0))', 'linear(to-t, rgba(0,0,0,0.8), rgba(0,0,0,0))') // Image gradient overlay
  const modalCloseHover = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(255, 255, 255, 0.2)') // Modal close button hover
  const inputPlaceholder = useColorModeValue('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.5)') // Input placeholder
  const inputFocusBorder = useColorModeValue('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.3)') // Input focus border
  const toast = useToast()
  const { userId: routeUserId } = useParams() // Get userId from route params (/user/profile/:userId)
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isOnProfilePage = location.pathname === '/user/profile' || location.pathname.startsWith('/user/profile/')
  const queryUserId = searchParams.get('userId') // Legacy support for query params

  // Scroll to top when profile opens (e.g. from home post click) so profile is not shown in middle of screen
  useEffect(() => {
    window.scrollTo(0, 0)
    const main = document.querySelector('[data-user-layout-main]')
    if (main) main.scrollTo(0, 0)
  }, [routeUserId, queryUserId])

  // Body class for profile-only CSS (e.g. hide .back-row, safe-area-only header)
  useEffect(() => {
    document.body.classList.add('profile-page')
    return () => document.body.classList.remove('profile-page')
  }, [])

  // Get current user data (for own profile and comparison)
  const { data: currentUserData, refetch } = useGetCurrentUserQuery()
  const userInfo = getUserInfo()
  const currentUserId = currentUserData?.success && currentUserData?.data?._id 
    ? currentUserData.data._id 
    : userInfo?.id
  
  // Determine which userId to display
  const profileUserId = routeUserId || queryUserId || currentUserId
  
  // Check if viewing own profile (normalize IDs to string to avoid type mismatch)
  const isOwnProfile = Boolean(
    profileUserId != null && currentUserId != null && String(profileUserId) === String(currentUserId)
  ) || Boolean(
    currentUserData?.success && currentUserData?.data?._id != null && profileUserId != null &&
    String(profileUserId) === String(currentUserData.data._id)
  )
  
  // Fetch profile data: use getUserById for other users, getCurrentUser for own profile
  const { data: profileUserData, isLoading: isLoadingProfile, error: profileError, refetch: refetchProfile } = useGetUserByIdQuery(
    profileUserId,
    { skip: !profileUserId || isOwnProfile } // Skip if own profile
  )
  
  // Use appropriate data source
  const profileData = isOwnProfile 
    ? currentUserData 
    : profileUserData
  
  const displayedUser = profileData?.success ? profileData.data : null
  
  // Get stats - use follow stats for own profile, or from profileData for others
  const { data: statsData } = useGetFollowStatsQuery(undefined, {
    skip: !isOwnProfile || !currentUserId
  })
  
  const displayedStats = isOwnProfile 
    ? statsData?.data 
    : displayedUser?.stats
  
  const [updateProfile, { isLoading }] = useUpdateUserProfileMutation()
  const [activeTab, setActiveTab] = useState(0) // 0 = All Posts, 1 = Archived, 2 = Saved, 3 = Memories
  const [memorySortOrder, setMemorySortOrder] = useState('desc') // 'desc' = newest first, 'asc' = oldest first
  
  // Use profileUserId for all queries
  const userId = profileUserId
  
  // Fetch equipped banner for the profile user
  const { data: bannerData, refetch: refetchBanner } = useGetUserEquippedBannerQuery(userId, {
    skip: !userId,
    refetchOnMountOrArgChange: true, // Refetch when component mounts or userId changes
  })
  const equippedBanner = bannerData?.data?.equippedBanner || null
    
  const { data: postsData, refetch: refetchPosts, isLoading: postsLoading } = useGetUserPostsQuery(
    { userId: userId, archived: activeTab === 1 },
    { skip: !userId || activeTab === 2 || activeTab === 3 } // Skip when Saved or Memories tab
  )
  
  // Fetch saved posts (only for own profile)
  const { data: savedPostsData, refetch: refetchSavedPosts, isLoading: savedPostsLoading } = useGetSavedPostsQuery(
    undefined,
    { skip: !isOwnProfile || activeTab !== 2 } // Only fetch for own profile and when saved tab is active
  )

  const { data: memoriesData, refetch: refetchMemories, isLoading: memoriesLoading } = useGetMemoriesQuery(
    { sort: memorySortOrder },
    { skip: !isOwnProfile || activeTab !== 3 } // Only fetch for own profile when Memories tab is active
  )
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const [archivePost] = useArchivePostMutation()
  const [unarchivePost] = useUnarchivePostMutation()
  const [deletePost] = useDeletePostMutation()
  const { isOpen: isViewPostOpen, onOpen: onViewPostOpen, onClose: onViewPostClose } = useDisclosure()
  const { isEditPostOpen, postToEdit, closeEditPostModal } = useCreatePost()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const { isOpen: isArchiveOpen, onOpen: onArchiveOpen, onClose: onArchiveClose } = useDisclosure()
  const { isOpen: isUnarchiveOpen, onOpen: onUnarchiveOpen, onClose: onUnarchiveClose } = useDisclosure()
  const [selectedPost, setSelectedPost] = useState(null)
  const [actionPostId, setActionPostId] = useState(null)
  const [actionType, setActionType] = useState(null)
  const cancelRef = useRef()
  
  // Followers/Following modals
  const { isOpen: isFollowersOpen, onOpen: onFollowersOpen, onClose: onFollowersClose } = useDisclosure()
  const { isOpen: isFollowingOpen, onOpen: onFollowingOpen, onClose: onFollowingClose } = useDisclosure()
  const [followersSearch, setFollowersSearch] = useState('')
  const [followingSearch, setFollowingSearch] = useState('')
  const debouncedFollowersSearch = useDebounce(followersSearch, 500)
  const debouncedFollowingSearch = useDebounce(followingSearch, 500)
  const { data: followersData, isLoading: followersLoading } = useGetFollowersQuery(
    { search: debouncedFollowersSearch },
    { skip: !isFollowersOpen }
  )
  const { data: followingData, isLoading: followingLoading, refetch: refetchFollowing } = useGetFollowingQuery(
    { search: debouncedFollowingSearch },
    { skip: !isFollowingOpen }
  )
  
  const { refetch: statsRefetch } = useGetFollowStatsQuery(undefined, {
    skip: !isOwnProfile || !currentUserId
  })
  
  const [unfollowUser, { isLoading: isUnfollowing }] = useUnfollowUserMutation()
  const [followUser, { isLoading: isFollowing }] = useFollowUserMutation()
  const [sendFriendRequest, { isLoading: isSendingRequest }] = useSendFriendRequestMutation()
  const { data: sentRequestsData, refetch: refetchSentRequests } = useGetFriendRequestsQuery('sent', {
    skip: isOwnProfile || !profileUserId,
    refetchOnMountOrArgChange: true,
  })
  const sentRequests = (() => {
    const raw = sentRequestsData
    if (Array.isArray(raw)) return raw
    if (raw?.data && Array.isArray(raw.data)) return raw.data
    if (raw?.success?.data && Array.isArray(raw.success.data)) return raw.success.data
    return []
  })()
  const normalizeId = (v) => (v == null ? '' : (typeof v === 'object' && v !== null && '_id' in v ? v._id : v).toString?.() ?? String(v))
  const hasPendingRequestToProfile = sentRequests.some(
    (r) => normalizeId(r.toUser) === normalizeId(profileUserId)
  )
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    countryCode: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    accountType: 'public',
    address: {
      street: '',
      district: '',
      state: '',
      country: '',
      pinCode: '',
    },
  })
  const [profileImage, setProfileImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const bioInputRef = useRef('') // always has latest bio from input (avoids stale state on submit)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  // Location data
  const {
    countries,
    states,
    cities,
    loading: locationLoading,
    error: locationError,
    fetchStates,
    fetchCities,
  } = useLocationData()
  
  // Track selected country and state codes for API calls
  const [selectedCountryCode, setSelectedCountryCode] = useState('')
  const [selectedStateCode, setSelectedStateCode] = useState('')
  
  // Check if user needs to update location (new user or missing address)
  const { isOpen: isLocationAlertOpen, onOpen: onLocationAlertOpen, onClose: onLocationAlertClose } = useDisclosure()
  const locationAlertCancelRef = useRef()
  
  // Check if address is incomplete (must be before early returns)
  const isAddressIncomplete = !displayedUser?.address?.country || 
                               !displayedUser?.address?.state || 
                               !displayedUser?.address?.district
  
  // Refetch posts when tab changes or userId changes
  useEffect(() => {
    if (userId && activeTab !== 2 && activeTab !== 3) {
      refetchPosts()
    } else if (activeTab === 2 && isOwnProfile) {
      refetchSavedPosts()
    } else if (activeTab === 3 && isOwnProfile) {
      refetchMemories()
    }
  }, [activeTab, userId, refetchPosts, refetchSavedPosts, refetchMemories, isOwnProfile])
  
  // Refetch posts when profile data is loaded
  useEffect(() => {
    if (displayedUser?._id && userId) {
      refetchPosts()
    }
  }, [displayedUser?._id, userId, refetchPosts])
  
  // Show alert for users without location only when they are on the profile page (not on homepage/feed)
  useEffect(() => {
    if (!isOnProfilePage) return
    if (displayedUser && !isEditing && isAddressIncomplete && isOwnProfile) {
      const userId = displayedUser._id || displayedUser.id
      const alertKey = SESSION_KEYS.locationAlert(userId)
      const hasShownAlert = sessionStorage.getItem(alertKey)
      
      // Show alert if location is incomplete and we haven't shown it in this session
      if (!hasShownAlert) {
        setTimeout(() => {
          onLocationAlertOpen()
          sessionStorage.setItem(alertKey, 'true')
        }, 1000) // Show after 1 second
      }
    }
  }, [isOnProfilePage, displayedUser, isAddressIncomplete, isEditing, isOwnProfile, onLocationAlertOpen])

  // Close location alert when user navigates away from profile (e.g. swipe to home)
  useEffect(() => {
    if (!isOnProfilePage) onLocationAlertClose()
  }, [isOnProfilePage, onLocationAlertClose])

  // Mouse tracking for post cards only
  useEffect(() => {
    const postCards = document.querySelectorAll('.post-card')
    
    const handlePointerMove = (e) => {
      // Track post cards
      postCards.forEach((postCard) => {
        const rect = postCard.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        postCard.style.setProperty('--mouse-x', `${x}px`)
        postCard.style.setProperty('--mouse-y', `${y}px`)
      })
    }
    
    document.addEventListener('pointermove', handlePointerMove)
    
    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
    }
  }, [postsData]) // Re-run when data changes

  useEffect(() => {
    // Only initialize once when userData is first loaded
    if (displayedUser && !isInitialized && isOwnProfile) {
      const address = displayedUser.address || {
        street: '',
        district: '',
        state: '',
        country: '',
        pinCode: '',
      }
      
      const bio = displayedUser.bio ?? (isOwnProfile ? getUserInfo()?.bio : null) ?? ''
      bioInputRef.current = typeof bio === 'string' ? bio : ''
      setFormData({
        name: displayedUser.name || '',
        email: isOwnProfile ? (currentUserData?.data?.email || '') : '',
        bio,
        countryCode: isOwnProfile ? (currentUserData?.data?.countryCode || '') : '',
        phoneNumber: isOwnProfile ? (currentUserData?.data?.phoneNumber || '') : '',
        password: '',
        confirmPassword: '',
        accountType: displayedUser.accountType || 'public',
        address: address,
      })
      
      // Note: Country/state selection will be set when countries are loaded
      
      setIsInitialized(true)
    } else if (!displayedUser && !isInitialized && isOwnProfile) {
      // Fallback to localStorage if API data not available yet
      const userInfo = getUserInfo()
      if (userInfo) {
        const bio = userInfo.bio || ''
        bioInputRef.current = bio
        setFormData({
          name: userInfo.name || '',
          email: userInfo.email || '',
          bio,
          countryCode: userInfo.countryCode || '',
          phoneNumber: userInfo.phoneNumber || '',
          password: '',
          confirmPassword: '',
          accountType: userInfo.accountType || 'public',
          address: userInfo.address || {
            street: '',
            district: '',
            state: '',
            country: '',
            pinCode: '',
          },
        })
        setIsInitialized(true)
      }
    }
  }, [displayedUser, isInitialized, isOwnProfile, currentUserData])

  // Initialize location selects when countries are loaded and address exists
  useEffect(() => {
    if (countries.length > 0 && displayedUser?.address?.country && !selectedCountryCode && isOwnProfile) {
      const country = countries.find(c => 
        c.name.toLowerCase() === displayedUser.address.country.toLowerCase()
      )
      if (country) {
        setSelectedCountryCode(country.iso2)
        fetchStates(country.iso2)
      }
    }
  }, [countries, displayedUser?.address?.country, selectedCountryCode, fetchStates, isOwnProfile])

  // Initialize state select when states are loaded
  useEffect(() => {
    if (states.length > 0 && displayedUser?.address?.state && !selectedStateCode && selectedCountryCode && isOwnProfile) {
      const state = states.find(s => 
        s.name.toLowerCase() === displayedUser.address.state.toLowerCase()
      )
      if (state) {
        setSelectedStateCode(state.iso2)
        fetchCities(selectedCountryCode, state.iso2)
      }
    }
  }, [states, displayedUser?.address?.state, selectedStateCode, selectedCountryCode, fetchCities, isOwnProfile])

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // Early returns for loading/error states (after all hooks)
  if (isLoadingProfile && !isOwnProfile) {
    return (
      <Box minH="100vh" bg={bgColor}>
        <ProfileSkeleton />
        <Box p={4}>
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PostCardSkeleton key={i} />
            ))}
          </SimpleGrid>
        </Box>
      </Box>
    )
  }
  
  if (profileError && !isOwnProfile) {
    return (
      <Center py={20} px={4}>
        <VStack spacing={4}>
          <Text color={textColor} fontSize="lg">
            User not found
          </Text>
          <Text color={subtextColor} fontSize="sm" textAlign="center">
            The user you're looking for doesn't exist or has been removed.
          </Text>
          <HStack spacing={3}>
            <Button size="sm" colorScheme="blue" onClick={() => refetchProfile()}>
              Try again
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </HStack>
        </VStack>
      </Center>
    )
  }
  
  if (!displayedUser && isOwnProfile && !currentUserData) {
    return (
      <Box minH="100vh" bg={bgColor}>
        <ProfileSkeleton />
        <Box p={4}>
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PostCardSkeleton key={i} />
            ))}
          </SimpleGrid>
        </Box>
      </Box>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleCountryChange = (e) => {
    const countryCode = e.target.value
    setSelectedCountryCode(countryCode)
    setSelectedStateCode('')
    
    const selectedCountry = countries.find(c => c.iso2 === countryCode)
    const countryName = selectedCountry ? selectedCountry.name : ''
    
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        country: countryName,
        state: '',
        district: '',
      },
    })
    
    if (countryCode) {
      fetchStates(countryCode)
    }
  }

  const handleStateChange = (e) => {
    const stateCode = e.target.value
    setSelectedStateCode(stateCode)
    
    const selectedState = states.find(s => s.iso2 === stateCode)
    const stateName = selectedState ? selectedState.name : ''
    
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        state: stateName,
        district: '',
      },
    })
    
    if (stateCode && selectedCountryCode) {
      fetchCities(selectedCountryCode, stateCode)
    }
  }

  const handleCityChange = (e) => {
    const cityName = e.target.value
    setFormData({
      ...formData,
      address: {
        ...formData.address,
        district: cityName,
      },
    })
  }

  const handleCountryCodeChange = (code) => {
    setFormData({
      ...formData,
      countryCode: code,
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
    // Sync form from latest profile data so edit form (including bio) always shows current values
    const source = displayedUser || (isOwnProfile ? currentUserData?.data : null) || getUserInfo() || {}
    const address = source.address || { street: '', district: '', state: '', country: '', pinCode: '' }
    const bio = source.bio ?? ''
    bioInputRef.current = typeof bio === 'string' ? bio : ''
    setFormData(prev => ({
      name: source.name ?? prev.name,
      email: isOwnProfile ? (currentUserData?.data?.email ?? source.email ?? prev.email) : (source.email ?? prev.email),
      bio,
      countryCode: source.countryCode ?? prev.countryCode,
      phoneNumber: source.phoneNumber ?? prev.phoneNumber,
      password: '',
      confirmPassword: '',
      accountType: source.accountType ?? prev.accountType,
      address,
    }))
  }

  const handleCancel = () => {
    setIsEditing(false)
    setProfileImage(null)
    // Reset to original values (must include bio so it's never lost)
    if (displayedUser && isOwnProfile) {
      setFormData({
        name: displayedUser?.name || (isOwnProfile ? (currentUserData?.data?.name || '') : ''),
        email: isOwnProfile ? (currentUserData?.data?.email || '') : '',
        bio: displayedUser?.bio ?? currentUserData?.data?.bio ?? '',
        countryCode: isOwnProfile ? (currentUserData?.data?.countryCode || '') : '',
        phoneNumber: isOwnProfile ? (currentUserData?.data?.phoneNumber || '') : '',
        password: '',
        confirmPassword: '',
        accountType: displayedUser?.accountType || 'public',
        address: displayedUser?.address || {
          street: '',
          district: '',
          state: '',
          country: '',
          pinCode: '',
        },
      })
    } else {
      const userInfo = getUserInfo()
      if (userInfo) {
        setFormData({
          name: userInfo.name || '',
          email: userInfo.email || '',
          bio: userInfo.bio ?? '',
          countryCode: userInfo.countryCode || '',
          phoneNumber: userInfo.phoneNumber || '',
          password: '',
          confirmPassword: '',
          accountType: userInfo.accountType || 'public',
          address: userInfo.address || {
            street: '',
            district: '',
            state: '',
            country: '',
            pinCode: '',
          },
        })
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: 'Password mismatch',
        description: 'Passwords do not match',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (formData.password && formData.password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    if (!formData.countryCode || !formData.phoneNumber) {
      toast({
        title: 'Phone number required',
        description: 'Please provide both country code and phone number',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    try {
      // Use ref so we always send the latest typed bio (formData can be stale)
      const rawBio = bioInputRef.current ?? formData.bio ?? ''
      const bioToSend = (typeof rawBio === 'string' ? rawBio : String(rawBio)).trim().slice(0, 500)

      const isFormData = profileImage !== null
      let updateData

      if (isFormData) {
        updateData = new FormData()
        updateData.append('name', formData.name)
        updateData.append('email', formData.email)
        updateData.append('bio', bioToSend || '') // REQUIRED – backend expects key "bio"
        updateData.append('countryCode', formData.countryCode)
        updateData.append('phoneNumber', formData.phoneNumber)
        updateData.append('accountType', formData.accountType)
        updateData.append('address[street]', formData.address.street || '')
        updateData.append('address[district]', formData.address.district || '')
        updateData.append('address[state]', formData.address.state || '')
        updateData.append('address[country]', formData.address.country || '')
        updateData.append('address[pinCode]', formData.address.pinCode || '')
        if (formData.password) {
          updateData.append('password', formData.password)
        }
        updateData.append('file', profileImage)
      } else {
        updateData = {
          name: formData.name,
          email: formData.email,
          bio: bioToSend || '', // REQUIRED – backend expects key "bio"
          countryCode: formData.countryCode,
          phoneNumber: formData.phoneNumber,
          accountType: formData.accountType,
          address: formData.address,
        }
        if (formData.password) {
          updateData.password = formData.password
        }
      }

      const result = await updateProfile(updateData).unwrap()
      
      if (result.data) {
        setAuthData(result.data, 'user')
        setFormData(prev => ({
          ...prev,
          bio: result.data.bio ?? prev.bio ?? '',
          password: '',
          confirmPassword: '',
        }))
        setProfileImage(null)
        setIsEditing(false)
        // Trigger custom event to update UserLayout
        window.dispatchEvent(new CustomEvent('userInfoUpdated'))
        // Refetch to get latest data
        refetch()
        
        // Clear the location alert flag if location was just completed
        const userId = result.data?.id || result.data?._id
        if (userId && result.data?.address?.country && result.data?.address?.state && result.data?.address?.district) {
          sessionStorage.removeItem(SESSION_KEYS.locationAlert(userId))
        }
        
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err?.data?.message || 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const displayData = displayedUser || (isOwnProfile ? (currentUserData?.data || getUserInfo() || {}) : {})
  // Bio: prefer API (displayedUser), then on own profile use stored userInfo so bio shows after refresh
  const displayBio = (displayedUser?.bio ?? (isOwnProfile ? (currentUserData?.data?.bio ?? getUserInfo()?.bio) : null) ?? '').trim()

  const theme = {
    bgColor,
    cardBg,
    textColor,
    subtextColor,
    borderColor,
    borderColorHover,
    accentBlue,
    accentPurple,
    shadowColor,
    scrollbarThumb,
    overlayBg,
    avatarShadow,
    textShadowColor,
    textShadowDark,
    hoverBgLight,
    hoverBgMedium,
    hoverBorderLight,
    hoverBorderMedium,
    radialGradientColor,
    borderGlowColor,
    gradientOverlay,
    modalCloseHover,
    inputPlaceholder,
    inputFocusBorder,
  }

  const contextValue = {
    theme,
    displayData,
    displayBio,
    isOwnProfile: Boolean(isOwnProfile),
    profileUserId,
    displayedStats,
    statsData,
    postsData,
    savedPostsData,
    memoriesData,
    memoriesLoading,
    refetchMemories,
    memorySortOrder,
    setMemorySortOrder,
    equippedBanner,
    displayedUser,
    currentUserData,
    activeTab,
    setActiveTab,
    isEditing,
    formData,
    setFormData,
    profileImage,
    setProfileImage,
    previewImage,
    setPreviewImage,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    selectedPost,
    setSelectedPost,
    actionPostId,
    setActionPostId,
    actionType,
    setActionType,
    handleChange,
    handleCountryChange,
    handleStateChange,
    handleCityChange,
    handleEdit,
    handleCancel,
    handleSubmit,
    countries,
    states,
    cities,
    selectedCountryCode,
    selectedStateCode,
    locationLoading,
    locationError,
    bioInputRef,
    getUserInfo,
    isLoading,
    isViewPostOpen,
    onViewPostOpen,
    onViewPostClose,
    isFollowersOpen,
    onFollowersOpen,
    onFollowersClose,
    isFollowingOpen,
    onFollowingOpen,
    onFollowingClose,
    followersSearch,
    setFollowersSearch,
    followingSearch,
    setFollowingSearch,
    isDeleteOpen,
    onDeleteOpen,
    onDeleteClose,
    isArchiveOpen,
    onArchiveOpen,
    onArchiveClose,
    isUnarchiveOpen,
    onUnarchiveOpen,
    onUnarchiveClose,
    refetchProfile,
    followUser,
    unfollowUser,
    isFollowing,
    isUnfollowing,
    sendFriendRequest,
    isSendingRequest,
    hasPendingRequestToProfile,
    refetchSentRequests,
    refetchPosts,
    refetchSavedPosts,
    archivePost,
    unarchivePost,
    deletePost,
    followersData,
    followersLoading,
    followingData,
    followingLoading,
    refetchFollowing,
    statsRefetch,
    cancelRef,
  }

  return (
    <>
      {/* Location Update Modal with Create Post design */}
      <Modal
        isOpen={isLocationAlertOpen}
        onClose={() => {}} // Prevent closing by clicking outside
        isCentered
        closeOnOverlayClick={false}
        closeOnEsc={false}
        size={{ base: "md", md: "md" }}
        motionPreset="scale"
      >
        <ModalOverlay 
          bg="blackAlpha.600"
          sx={{
            animation: 'fadeIn 0.3s ease-out',
            '@keyframes fadeIn': {
              from: { opacity: 0 },
              to: { opacity: 1 }
            }
          }}
        />
        <ModalContent
          mx={{ base: 6, md: 4 }}
          my={{ base: 6, md: 4 }}
          maxW={{ base: "calc(100% - 48px)", md: "480px" }}
          h={{ base: "auto", md: "auto" }}
          maxH={{ base: "calc(100vh - 48px)", md: "90vh" }}
          borderRadius={{ base: "20px", md: "24px" }}
          overflow="hidden"
          bg="transparent"
                  border="1px solid"
                  borderColor={borderColor}
                  sx={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: 'none',
          }}
        >
          <ModalHeader
            py={{ base: 2.5, md: 3 }}
            px={{ base: 3, md: 4 }}
            fontSize={{ base: "15px", md: "17px" }}
            fontWeight="600"
            color={textColor}
            borderBottom="1px solid"
            borderColor={borderColor}
            bg="transparent"
          >
              Update Your Location
          </ModalHeader>
          <ModalCloseButton 
            top={{ base: 2, md: 3 }}
            right={{ base: 2.5, md: 4 }}
            color={textColor}
            borderRadius="full"
            size="sm"
            _hover={{
              bg: modalCloseHover,
            }}
            onClick={onLocationAlertClose}
          />
          <ModalBody
            px={{ base: 3, md: 4 }}
            py={{ base: 2, md: 3 }}
            overflowY="auto"
            maxH="calc(100vh - 120px)"
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: scrollbarThumb,
                borderRadius: '20px',
              },
            }}
          >
              <VStack spacing={3} align="stretch">
              <Text color={textColor} fontSize={{ base: "14px", md: "15px" }}>
                  To discover and connect with people near you, please update your location in your profile.
                </Text>
              <Text 
                fontWeight="semibold" 
                color="blue.400"
                fontSize={{ base: "13px", md: "14px" }}
              >
                  Location fields (Country, State, and City) are required.
                </Text>
              </VStack>
          </ModalBody>
          <ModalFooter
            px={{ base: 3, md: 4 }}
            py={{ base: 2, md: 3 }}
            borderTop="1px solid"
            borderColor={borderColor}
            bg="transparent"
          >
              <Button 
                onClick={() => {
                  onLocationAlertClose()
                  setIsEditing(true)
                  // Scroll to address section after a brief delay to ensure form is rendered
                  setTimeout(() => {
                    const addressSection = document.querySelector('[data-address-section]')
                    if (addressSection) {
                      addressSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }
                  }, 300)
                }}
                w="full"
              size={{ base: "sm", md: "md" }}
              bgGradient="linear(to-r, #007AFF, #5856D6)"
              color={textColor}
              fontWeight="600"
              fontSize={{ base: "14px", md: "15px" }}
              py={{ base: 2.5, md: 2 }}
              borderRadius="full"
              _hover={{
                bgGradient: 'linear(to-r, #0051D5, #4A47C4)',
                transform: 'translateY(-1px)',
              }}
              _active={{
                transform: 'scale(0.98)',
              }}
              >
                Update Now
              </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Remove sidebar margin for edge-to-edge layout */}
      <Box
        ml={{ base: 0, lg: 0 }}
        w="100%"
        sx={{
          '@media (min-width: 1024px)': {
            marginLeft: '0 !important',
          },
        }}
      >
      <UserProfileProvider value={contextValue}>
      {/* Motion Design System - Global Styles */}
      <Box
        as="style"
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes profileBannerEntry {
              from {
                opacity: 0;
                transform: translateY(12px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes profileContentStagger {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes buttonPress {
              0% { transform: scale(1); }
              50% { transform: scale(0.96); }
              100% { transform: scale(1); }
            }
            @keyframes shimmer {
              0% { background-position: -1000px 0; }
              100% { background-position: 1000px 0; }
            }
            @keyframes subtleShake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-6px); }
              75% { transform: translateX(6px); }
            }
            .motion-safe {
              animation-duration: 220ms;
              animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
              animation-fill-mode: both;
            }
            .motion-reduce {
              animation: none !important;
              transition: opacity 200ms ease !important;
            }
            @media (prefers-reduced-motion: reduce) {
              .motion-safe {
                animation: none !important;
                transition: opacity 200ms ease !important;
              }
            }
          `
        }}
      />
      
      <Box className="page-container profile-top-section" minH="100vh" bg={bgColor} pt="env(safe-area-inset-top, 0px)" px={{ base: 0, md: 4 }} pb={{ base: 0, md: 4 }}>
        <Box maxW="1200px" mx="auto" w="100%" px={{ base: 0, md: 0 }}>
          <VStack spacing={{ base: 0, md: 4 }} align="stretch" w="100%">
            <ProfileHero />

            {isEditing ? (
              <Box borderRadius={{ base: 0, md: '12px' }} p={{ base: 4, md: 6 }} bg={cardBg} borderWidth="1px" borderColor={borderColor}>
                <ProfileEditForm />
              </Box>
            ) : (
              <ProfilePostsSection />
            )}
          </VStack>
        </Box>
      </Box>

            <ProfileModals />
            {selectedPost && (
              <PostDetailsSheet
                post={selectedPost}
                isOpen={isViewPostOpen}
                onClose={onViewPostClose}
                onAfterArchive={refetchPosts}
                onAfterDelete={refetchPosts}
              />
            )}
            <EditPostModal
              isOpen={isEditPostOpen}
              post={postToEdit}
              onClose={closeEditPostModal}
              onSuccess={refetchPosts}
            />
      </UserProfileProvider>
      </Box>
    </>
  )
}

export default UserProfile

