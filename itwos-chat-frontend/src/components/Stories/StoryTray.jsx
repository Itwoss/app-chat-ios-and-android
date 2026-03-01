import {
  Box,
  HStack,
  VStack,
  Text,
  useColorModeValue,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useGetStoriesFeedQuery, useGetMyStoriesQuery, useGetCurrentUserQuery } from '../../store/api/userApi';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { getUserInfo } from '../../utils/auth';
import { extractDominantColor, createRingGradient, brightenColor } from '../../utils/colorExtractor';
import useAmbientColors from '../../hooks/useAmbientColors';

// Helper: get profile image URL (API may return profileImage or profilePicture)
const getProfileImageUrl = (user) => {
  if (!user) return null;
  return user.profileImage || user.profilePicture || null;
};

// Separate component for individual story item to properly use hooks
const StoryItem = ({ userStories, index, extractedColors, ringThickness, activeRingThickness, calculateInnerOffset, calculateInnerBorderRadius, avatarBorderColor, textColor, hasUnviewed, isHovered, isActive, hoveredIndex, activeIndex, setHoveredIndex, setActiveIndex, handleStoryClick, currentUserData, userInfo, currentUserId, hasMyStories, myStories, handleCreateStory }) => {
  const firstStoryImage = userStories?.stories && userStories.stories.length > 0
    ? userStories.stories[0]?.mediaUrl
    : null;
  const storyAmbientGradient = useAmbientColors(firstStoryImage || null);
  
  const userId = userStories?.user?._id?.toString();
  const extractedColor = extractedColors[userId];
  const isActiveStory = isActive && hasUnviewed;
  
  // Determine ring style based on state
  let ringStyle = {};
  let ringWidth = hasUnviewed ? ringThickness : '1px';
  
  if (isActiveStory) {
    ringWidth = activeRingThickness;
    if (extractedColor) {
      const brightColor = brightenColor(extractedColor);
      ringStyle = {
        borderColor: brightColor,
      };
    } else {
      ringStyle = {
        borderColor: '#00B4FF',
      };
    }
  } else if (hasUnviewed && extractedColor) {
    const brightColor = brightenColor(extractedColor);
    ringStyle = {
      borderColor: brightColor,
    };
  } else if (hasUnviewed) {
    ringStyle = {
      borderColor: '#00B4FF',
    };
  } else {
    ringStyle = {
      borderColor: 'rgba(142, 142, 142, 0.45)',
    };
  }
  
  return (
    <VStack
      key={userStories.user._id || `story-${index}`}
      spacing={2}
      cursor="pointer"
      onClick={(e) => {
        const target = e.currentTarget;
        target.style.animation = 'ringPulse 0.3s ease-out';
        setTimeout(() => {
          target.style.animation = '';
        }, 300);
        handleStoryClick(userStories);
      }}
      onMouseEnter={() => {
        setHoveredIndex(index);
        setActiveIndex(index);
      }}
      onMouseLeave={() => {
        setHoveredIndex(null);
        setActiveIndex(null);
      }}
      onTouchStart={(e) => {
        const target = e.currentTarget;
        target.style.animation = 'ringPulse 0.3s ease-out';
        setTimeout(() => {
          target.style.animation = '';
        }, 300);
      }}
      minW="76px"
      maxW="76px"
      sx={{
        scrollSnapAlign: 'start',
      }}
    >
      <Box 
        position="relative"
        w="76px"
        h="76px"
        borderRadius={22}
        overflow="hidden"
        sx={{
          animation: 'scaleIn 0.15s ease-out',
          animationDelay: `${index * 0.03}s`,
          '@keyframes scaleIn': {
            '0%': { transform: 'scale(0.8)', opacity: 0 },
            '100%': { transform: 'scale(1)', opacity: 1 },
          },
        }}
      >
        {/* Border Ring */}
        <Box
          position="absolute"
          inset="0"
          borderRadius={22}
          border={ringWidth}
          borderStyle="solid"
          {...ringStyle}
          zIndex={2}
          pointerEvents="none"
        />
        
        {/* Profile Image - inner radius matches ring inner edge */}
        <Box
          position="absolute"
          top={calculateInnerOffset(ringWidth)}
          left={calculateInnerOffset(ringWidth)}
          right={calculateInnerOffset(ringWidth)}
          bottom={calculateInnerOffset(ringWidth)}
          borderRadius={calculateInnerBorderRadius(ringWidth)}
          overflow="hidden"
          bg="transparent"
          zIndex={1}
          flexShrink={0}
        >
          <Box
            position="absolute"
            inset="0"
            borderRadius={calculateInnerBorderRadius(ringWidth)}
            backgroundImage={getProfileImageUrl(userStories.user)
              ? `url(${getProfileImageUrl(userStories.user)})`
              : undefined
            }
            backgroundSize="cover"
            backgroundPosition="center center"
            backgroundRepeat="no-repeat"
          />
        </Box>
      </Box>
      <Text
        fontSize="11px"
        color={textColor}
        textAlign="center"
        noOfLines={1}
        maxW="76px"
        fontWeight={hasUnviewed ? '600' : '500'}
        opacity={hasUnviewed ? 1 : 0.7}
        mt={1}
      >
        {userStories.user?.name || 'User'}
      </Text>
    </VStack>
  );
};

const StoryTray = ({ onOpenMyStories }) => {
  const bgColor = useColorModeValue('white', '#000000');
  const textColor = useColorModeValue('#262626', '#fafafa');
  const secondaryTextColor = useColorModeValue('#8e8e8e', '#a8a8a8');
  // Glassmorphism colors - extract to top level
  const glassBgLight = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
  const glassBgDark = 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 40, 0.9) 100%)';
  const glassBg = useColorModeValue(glassBgLight, glassBgDark);
  const cardBgLight = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.8) 100%)';
  const cardBgDark = 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)';
  const cardBg = useColorModeValue(cardBgLight, cardBgDark);
  const avatarBorderColor = useColorModeValue('white', 'rgba(255,255,255,0.9)');
  
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [extractedColors, setExtractedColors] = useState({}); // Store extracted colors by user ID
  const [isExtracting, setIsExtracting] = useState({}); // Track extraction status
  const prevStoriesRef = useRef(null);
  const userInfo = getUserInfo();
  const { data: currentUserData } = useGetCurrentUserQuery();
  const currentUserId = currentUserData?.data?._id || userInfo?.id;
  
  // Responsive ring thickness - thin line
  const ringThickness = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? '1px' : '1px'; // Thin line
    }
    return '1px';
  }, []);

  // Active/live story ring thickness (slightly thicker, still thin)
  const activeRingThickness = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? '1.5px' : '1.5px';
    }
    return '1.5px';
  }, []);
  
  // Consistent gap between ring and profile image
  const ringGap = '2px';
  
  const outerRadius = 22;
  // Helper to calculate inner content offset (ringWidth + gap)
  const calculateInnerOffset = (ringWidth) => {
    const width = parseFloat(ringWidth) || 2;
    const gap = parseFloat(ringGap) || 2;
    return `${width + gap}px`;
  };
  // Inner radius so the image corners align with the ring's inner edge (no radius mismatch)
  const calculateInnerBorderRadius = (ringWidth) => {
    const width = parseFloat(ringWidth) || 2;
    const gap = parseFloat(ringGap) || 2;
    return Math.max(0, outerRadius - width - gap);
  };

  const { data: storiesData, isLoading, error, refetch } = useGetStoriesFeedQuery();
  const { data: myStoriesData } = useGetMyStoriesQuery();
  
  const myStories = myStoriesData?.data || [];
  const hasMyStories = myStories.length > 0;
  
  // Refetch stories periodically (increased interval to reduce blinking)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000); // Increased from 30s to 60s to reduce blinking
    return () => clearInterval(interval);
  }, [refetch]);

  // Listen for refetch event from StoryViewer
  useEffect(() => {
    const handleRefetch = () => {
      refetch().then(() => {
        // Stories will automatically reorder
      }).catch((err) => {
        console.error('[StoryTray] Error refetching stories:', err);
      });
    };
    window.addEventListener('refetchStories', handleRefetch);
    return () => {
      window.removeEventListener('refetchStories', handleRefetch);
    };
  }, [refetch]);

  // Extract colors from profile images
  useEffect(() => {
    const extractColorsForStories = async () => {
      const colorsToExtract = {};
      
      // Add current user's profile image
      const currentUserProfileImage = getProfileImageUrl(currentUserData?.data) || getProfileImageUrl(userInfo);
      const userIdString = currentUserId?.toString();
      if (currentUserProfileImage && userIdString && !extractedColors[userIdString] && !isExtracting[userIdString]) {
        colorsToExtract[userIdString] = currentUserProfileImage;
      }
      
      // Add other users' profile images (stories are available after early returns)
      const stories = storiesData?.data || [];
      const otherStoriesList = Array.isArray(stories) ? stories.filter(s => 
        s?.user?._id?.toString() !== userIdString && 
        s?.user?.toString() !== userIdString
      ) : [];
      
      if (Array.isArray(otherStoriesList)) {
        otherStoriesList.forEach((userStories) => {
          const userId = userStories?.user?._id?.toString();
          const profileImage = getProfileImageUrl(userStories?.user);
          if (userId && profileImage && !extractedColors[userId] && !isExtracting[userId]) {
            colorsToExtract[userId] = profileImage;
          }
        });
      }
      
      // Extract colors for all new images
      if (Object.keys(colorsToExtract).length > 0) {
        const extractionPromises = Object.entries(colorsToExtract).map(async ([userId, imageUrl]) => {
          setIsExtracting(prev => ({ ...prev, [userId]: true }));
          try {
            const color = await extractDominantColor(imageUrl);
            setExtractedColors(prev => ({ ...prev, [userId]: color }));
          } catch (error) {
            console.error(`Error extracting color for user ${userId}:`, error);
          } finally {
            setIsExtracting(prev => ({ ...prev, [userId]: false }));
          }
        });
        
        await Promise.all(extractionPromises);
      }
    };
    
    if (!isLoading && (currentUserId || storiesData)) {
      extractColorsForStories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, currentUserId, currentUserData, userInfo, storiesData]);

  // Get stories data - must be before early returns (Rules of Hooks)
  const stories = storiesData?.data || [];
  const otherStories = Array.isArray(stories) ? stories.filter(s => 
    s?.user?._id?.toString() !== currentUserId?.toString() && 
    s?.user?.toString() !== currentUserId?.toString()
  ) : [];
  
  // Extract first story images for ambient backgrounds (must be at top level for hooks)
  const myFirstStoryImage = hasMyStories && myStories.length > 0 
    ? myStories[0]?.mediaUrl 
    : null;
  const myStoryAmbientGradient = useAmbientColors(myFirstStoryImage || null);

  // Early returns AFTER all hooks
  if (isLoading) {
    return (
      <Center py={4}>
        <Spinner size="sm" />
      </Center>
    );
  }
  
  // Always show tray: at least "Your story" (My story) so user can create or view their story
  // (no early return when no other stories or on error without my stories)

  const handleStoryClick = (userStories) => {
    try {
      if (userStories.isMyStory) {
        const myStoryGroup = {
          user: currentUserData?.data || userInfo,
          stories: myStories,
          hasViewed: false,
          isMyStory: true,
        };
        navigate('/user/stories/view', {
          state: {
            stories: [myStoryGroup, ...otherStories],
            initialUserIndex: 0,
            returnPath: window.location.pathname,
          },
        });
        return;
      }
      
      if (!userStories?.user?._id) {
        console.error('[StoryTray] Invalid data for handleStoryClick:', { userStories });
        return;
      }
      
      const clickedUserStories = [userStories];
      const myStoryGroup = hasMyStories ? [{
        user: currentUserData?.data || userInfo,
        stories: myStories,
        hasViewed: false,
        isMyStory: true,
      }] : [];
      
      const remainingStories = otherStories.filter(s => {
        const storyUserId = s?.user?._id?.toString() || s?.user?.toString();
        const clickedUserId = userStories.user._id?.toString();
        return storyUserId !== clickedUserId;
      });
      
      const finalStories = [...clickedUserStories, ...myStoryGroup, ...remainingStories];
      
      navigate('/user/stories/view', {
        state: {
          stories: finalStories,
          initialUserIndex: 0,
          returnPath: window.location.pathname,
        },
      });
    } catch (err) {
      console.error('[StoryTray] Error in handleStoryClick:', err);
    }
  };

  const handleCreateStory = (e) => {
    if (e) {
      e.stopPropagation();
    }
    if (onOpenMyStories) {
      onOpenMyStories();
    } else {
      navigate('/user/stories');
    }
  };

  return (
    <Box
      w="100%"
      py={2}
      px={{ base: 3, md: 4 }}
      position="relative"
      bg="transparent"
      minH="100px"
      data-swipe-lock="true"
    >
      <Box
        overflowX="auto"
        overflowY="hidden"
        w="100%"
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          touchAction: 'pan-x',
          overscrollBehaviorX: 'contain',
        }}
        sx={{
          // Horizontal parallax scroll with momentum
          scrollSnapType: 'x proximity',
        }}
      >
        <HStack 
          spacing={3} 
          align="flex-start" 
          minW="max-content"
          pl={0}
          pr={{ base: 2, md: 0 }}
          py={1}
        >
          {/* Your Story - Rounded Rectangle Card */}
          <VStack
            spacing={2}
            cursor="pointer"
            onClick={(e) => {
              // Pulse animation on tap/click
              const target = e.currentTarget;
              target.style.animation = 'ringPulse 0.3s ease-out';
              setTimeout(() => {
                target.style.animation = '';
              }, 300);
              
              if (hasMyStories) {
                handleStoryClick({ isMyStory: true, user: currentUserData?.data || userInfo });
              } else {
                handleCreateStory(e);
              }
            }}
            onMouseEnter={() => setHoveredIndex(-1)}
            onMouseLeave={() => setHoveredIndex(null)}
            onTouchStart={(e) => {
              // Pulse animation on touch
              const target = e.currentTarget;
              target.style.animation = 'ringPulse 0.3s ease-out';
              setTimeout(() => {
                target.style.animation = '';
              }, 300);
            }}
            minW="76px"
            maxW="76px"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            transform={hoveredIndex === -1 ? 'scale(1.05)' : 'scale(1)'}
            sx={{
              scrollSnapAlign: 'start',
            }}
          >
            {(() => {
              return (
            <Box 
              position="relative"
              w="76px"
              h="76px"
              borderRadius={22}
                  overflow="visible"
              transition="all 0.15s ease-out"
              sx={{
                animation: 'scaleIn 0.15s ease-out',
                '@keyframes scaleIn': {
                  '0%': { transform: 'scale(0.8)', opacity: 0 },
                  '100%': { transform: 'scale(1)', opacity: 1 },
                },
              }}
                >
                  <Box 
                    position="relative"
                    w="76px"
                    h="76px"
                    borderRadius={22}
                    overflow="hidden"
                    zIndex={1}
            >
              {/* Border with adaptive color or gray */}
              {(() => {
                const profileImage = getProfileImageUrl(currentUserData?.data) || getProfileImageUrl(userInfo);
                const userId = currentUserId?.toString();
                const extractedColor = extractedColors[userId];
                const isActive = activeIndex === -1 && hasMyStories;
                const isViewed = !hasMyStories;
                
                // Determine ring style based on state
                let ringStyle = {};
                let ringWidth = ringThickness;
                
                if (isActive) {
                  // Active/live story: thicker ring with glow using extracted color
                  ringWidth = activeRingThickness;
                  if (extractedColor) {
                    const brightColor = brightenColor(extractedColor);
                    ringStyle = {
                      borderColor: brightColor,
                      borderImage: `linear-gradient(135deg, ${createRingGradient(brightColor).replace('linear-gradient(135deg, ', '').replace(')', '')}) 1`,
                    };
                  } else {
                    ringStyle = {
                      borderColor: '#00B4FF',
                    };
                  }
                } else if (hasMyStories && extractedColor) {
                  // Unviewed story: use bright extracted color
                  const brightColor = brightenColor(extractedColor);
                  ringStyle = {
                    borderColor: brightColor,
                  };
                } else if (hasMyStories) {
                  // Unviewed story: bright blue (while extracting)
                  ringStyle = {
                    borderColor: '#00B4FF',
                  };
                } else {
                  // Viewed story: light gray with opacity
                  ringStyle = {
                    borderColor: 'rgba(142, 142, 142, 0.45)',
                  };
                }
                
                return (
                  <>
                    {/* Border Ring — use sx so borderImage is not forwarded as DOM prop */}
                    <Box
                      position="absolute"
                      inset="0"
                      borderRadius={22}
                      border={ringWidth}
                      borderStyle="solid"
                      sx={ringStyle}
                      zIndex={2}
                      pointerEvents="none"
                    />
                    
                    {/* Profile Image - inner radius matches ring inner edge */}
                    <Box
                      position="absolute"
                      top={calculateInnerOffset(ringWidth)}
                      left={calculateInnerOffset(ringWidth)}
                      right={calculateInnerOffset(ringWidth)}
                      bottom={calculateInnerOffset(ringWidth)}
                      borderRadius={calculateInnerBorderRadius(ringWidth)}
                      overflow="hidden"
                      bg="transparent"
                      zIndex={1}
                      flexShrink={0}
                    >
                  <Box
                    position="absolute"
                    inset="0"
                    borderRadius={calculateInnerBorderRadius(ringWidth)}
                    backgroundImage={profileImage ? `url(${profileImage})` : undefined}
                    backgroundSize="cover"
                    backgroundPosition="center center"
                    backgroundRepeat="no-repeat"
                    />
                  
                  {/* Plus icon for adding new story */}
                  {hasMyStories && (
                    <Box
                      position="absolute"
                      bottom="8px"
                      right="8px"
                      bg="#0095f6"
                      color="white"
                      borderRadius="full"
                      w="24px"
                      h="24px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="2px solid"
                      borderColor={avatarBorderColor}
                      cursor="pointer"
                      onClick={handleCreateStory}
                      zIndex={10}
                      _hover={{
                        bg: "#0085e5",
                        transform: 'scale(1.1)'
                      }}
                      transition="all 0.2s"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </Box>
                  )}
                  {!hasMyStories && (
                    <Box
                      position="absolute"
                      bottom="8px"
                      right="8px"
                      bg="#0095f6"
                      color="white"
                      borderRadius="full"
                      w="28px"
                      h="28px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="2px solid"
                      borderColor={avatarBorderColor}
                          zIndex={10}
                    >
                      <Plus size={14} strokeWidth={3} />
                    </Box>
                  )}
                    </Box>
                  </>
                );
              })()}
            </Box>
                </Box>
              );
            })()}
            <Text
              fontSize="11px"
              color={textColor}
              textAlign="center"
              noOfLines={1}
              maxW="76px"
              fontWeight="500"
              mt={1}
            >
              Your story
            </Text>
          </VStack>

          {/* Other Users' Stories - Rounded Rectangle Cards */}
          {Array.isArray(otherStories) && otherStories.map((userStories, index) => {
            if (!userStories || !userStories.user || !Array.isArray(userStories.stories)) {
              return null;
            }

            const hasUnviewed = !userStories.hasViewed;
            const isHovered = hoveredIndex === index;
            const isActive = activeIndex === index;

            return (
              <StoryItem
                key={userStories.user._id || `story-${index}`}
                userStories={userStories}
                index={index}
                extractedColors={extractedColors}
                ringThickness={ringThickness}
                activeRingThickness={activeRingThickness}
                calculateInnerOffset={calculateInnerOffset}
                calculateInnerBorderRadius={calculateInnerBorderRadius}
                avatarBorderColor={avatarBorderColor}
                textColor={textColor}
                hasUnviewed={hasUnviewed}
                isHovered={isHovered}
                isActive={isActive}
                hoveredIndex={hoveredIndex}
                activeIndex={activeIndex}
                setHoveredIndex={setHoveredIndex}
                setActiveIndex={setActiveIndex}
                handleStoryClick={handleStoryClick}
                currentUserData={currentUserData}
                userInfo={userInfo}
                currentUserId={currentUserId}
                hasMyStories={hasMyStories}
                myStories={myStories}
                handleCreateStory={handleCreateStory}
              />
            );
          })}
        </HStack>
      </Box>

      {/* CSS Animations */}
      <style>{`
        @keyframes scaleIn {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes ringPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </Box>
  );
};

export default StoryTray;
