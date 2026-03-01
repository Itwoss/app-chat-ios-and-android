import { Box, HStack, VStack, IconButton, Text, Avatar, Button, useDisclosure, Popover, PopoverTrigger, PopoverContent, PopoverBody } from '@chakra-ui/react';
import { ArrowLeft, Type, Smile, AtSign, Music, Clock } from 'lucide-react';

const toolButtons = [
  { key: 'text', label: 'Add text', icon: Type, onClickKey: 'onAddText' },
  { key: 'emoji', label: 'Add emoji', icon: Smile, onClickKey: 'onAddEmoji' },
  { key: 'mention', label: 'Add mention', icon: AtSign, onClickKey: 'onAddMention' },
  { key: 'song', label: 'Add song', icon: Music, onClickKey: 'onAddSong' },
];

const DURATION_OPTIONS = [10, 15, 20];

/**
 * Story composer toolbar.
 * Top: back, username, profile.
 * Left side (vertical): Add Text, Emoji, Mention, Song; Timing (clock icon) — click to choose 10s / 15s / 20s (default 15s).
 */
export default function StoryToolbar({
  onBack,
  userName,
  userAvatar,
  onAddText,
  onAddEmoji,
  onAddMention,
  onAddSong,
  showDurationSelector = false,
  imageOnlyDuration = 15,
  onDurationChange,
}) {
  const handlers = { onAddText, onAddEmoji, onAddMention, onAddSong };
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      {/* Top bar: back, username, avatar */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        zIndex={30}
        px={{ base: 3, md: 4 }}
        py={3}
        bgGradient="linear(to-b, blackAlpha.700 0%, transparent 70%)"
        pointerEvents="none"
      >
        <Box pointerEvents="auto">
          <HStack spacing={3}>
            <IconButton
              aria-label="Back"
              icon={<ArrowLeft size={22} />}
              variant="ghost"
              color="white"
              size="lg"
              borderRadius="full"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={onBack}
            />
            <Text color="white" fontWeight="600" fontSize="md" noOfLines={1}>
              {userName || 'Your story'}
            </Text>
            <Avatar
              size="sm"
              name={userName}
              src={userAvatar}
              borderWidth="2px"
              borderColor="white"
            />
          </HStack>
        </Box>
      </Box>

      {/* Left side: vertical Text, Emoji, Mention, Song + Story length (with clock icon) below */}
      <VStack
        position="absolute"
        left={{ base: 2, md: 3 }}
        top="50%"
        transform="translateY(-50%)"
        zIndex={30}
        spacing={2}
        align="stretch"
        pointerEvents="auto"
      >
        {toolButtons.map(({ key, label, icon: Icon, onClickKey }) => (
          <IconButton
            key={key}
            aria-label={label}
            icon={<Icon size={22} />}
            variant="ghost"
            color="white"
            size="lg"
            borderRadius="full"
            bg="blackAlpha.400"
            _hover={{ bg: 'whiteAlpha.25' }}
            onClick={handlers[onClickKey]}
          />
        ))}
        {showDurationSelector && onDurationChange && (
          <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="right" isLazy>
            <PopoverTrigger>
              <IconButton
                aria-label="Story timing"
                icon={<Clock size={22} />}
                variant="ghost"
                color="white"
                size="lg"
                borderRadius="full"
                bg="blackAlpha.400"
                _hover={{ bg: 'whiteAlpha.25' }}
                title={`${imageOnlyDuration}s`}
              />
            </PopoverTrigger>
            <PopoverContent
              w="auto"
              bg="transparent"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.2)"
              borderRadius="2xl"
              boxShadow="none"
              _focus={{ boxShadow: 'none' }}
              sx={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <PopoverBody py={3} px={3}>
                <Text color="white" fontSize="sm" fontWeight="600" mb={2}>Story length</Text>
                <VStack spacing={1} align="stretch">
                  {DURATION_OPTIONS.map((sec) => (
                    <Button
                      key={sec}
                      size="sm"
                      variant={imageOnlyDuration === sec ? 'solid' : 'ghost'}
                      colorScheme="blue"
                      onClick={() => {
                        onDurationChange(sec);
                        onClose();
                      }}
                    >
                      {sec}s
                    </Button>
                  ))}
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        )}
      </VStack>
    </>
  );
}
