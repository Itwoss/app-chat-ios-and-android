import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, VStack, HStack, Text, Avatar, IconButton, useToast } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ChevronLeft, Heart, MessageCircle, Trash2, Share2, Bookmark, BookmarkCheck, Volume2, VolumeX, ShoppingBag, Link as LinkIcon, ChevronDown, ChevronUp, Image as ImageIcon, Video } from 'lucide-react';
import UserName from '../User/UserName';
import AvatarZoomPreview from '../User/AvatarZoomPreview';
import { useLongPress } from '../../hooks/useLongPress';

function formatViewCount(count) {
  if (count == null || count === 0) return '0';
  if (count < 1000) return String(count);
  if (count < 1_000_000) return (count / 1000).toFixed(1) + 'K';
  return (count / 1_000_000).toFixed(1) + 'M';
}

/** Show URL as short domain only, e.g. https://chatgpt.com/ → chatgpt.com */
function getShortLinkDisplayUrl(url) {
  if (!url || typeof url !== 'string') return url || '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return u.hostname.replace(/^www\./i, '');
  } catch {
    return trimmed;
  }
}

function getRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

// Default vibrant palette when video is unavailable (image post or CORS)
const DEFAULT_HEART_COLORS = ['#ed4956', '#ff6b6b', '#ff8e53', '#ffd93d', '#6bcb77', '#4d96ff', '#9d4edd', '#ff2d55'];

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) h = s = 0;
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) r = g = b = l;
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function hue2rgb(p, q, t) {
  if (t < 0) t += 1; if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const h = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
}

function extractVibrantColorsFromImageData(data, width, height) {
  const step = Math.max(2, Math.floor(Math.min(width, height) / 24));
  const buckets = Array(12).fill(null).map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 128) continue;
      const [h, s, l] = rgbToHsl(r, g, b);
      if (s < 20 || l < 15 || l > 92) continue;
      const bucket = Math.min(11, Math.floor(h / 30));
      buckets[bucket].r += r; buckets[bucket].g += g; buckets[bucket].b += b;
      buckets[bucket].count++;
    }
  }
  const colors = buckets
    .filter(b => b.count > 0)
    .map(b => ({
      r: b.r / b.count, g: b.g / b.count, b: b.b / b.count,
      count: b.count,
      vibrancy: rgbToHsl(b.r / b.count, b.g / b.count, b.b / b.count)[1],
    }))
    .sort((a, b) => (b.vibrancy * 0.7 + Math.min(b.count, 50) * 0.3) - (a.vibrancy * 0.7 + Math.min(a.count, 50) * 0.3))
    .slice(0, 8)
    .map(c => rgbToHex(c.r, c.g, c.b));
  return colors.length ? colors : DEFAULT_HEART_COLORS;
}

function getColorsFromVideoFrame(video, canvasRef) {
  const v = video;
  if (!v || v.readyState < 2 || v.videoWidth === 0) return null;
  let canvas = canvasRef.current;
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    canvasRef.current = canvas;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  try {
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return extractVibrantColorsFromImageData(id.data, canvas.width, canvas.height);
  } catch (e) {
    return null;
  }
}

export default function ReelOverlay({
  post,
  isLiked,
  triggerHeartAnimation,
  isAuthor,
  showDelete,
  hasSound,
  hasAddedMusic = false,
  onRequestSound,
  onLike,
  onDelete,
  onOpenComments,
  onSave,
  isSaved,
  playProgress = 0,
  userInfo,
  userData,
  isVideoPost = true,
  videoRef = null,
  showFeedModeSwitch = false,
  feedMode = 'video',
  onFeedModeSwitch,
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [heartHiddenByShop, setHeartHiddenByShop] = useState(false);
  const [heartColors, setHeartColors] = useState(DEFAULT_HEART_COLORS);
  const canvasRef = useRef(null);
  const [bursts, setBursts] = useState([]); // each item: { id, target: { x, y } | null }; hearts travel to like counter
  const burstIdRef = useRef(0);
  const burstContainerRef = useRef(null);
  const likeCounterRef = useRef(null);

  const getTravelTarget = () => {
    if (!burstContainerRef.current || !likeCounterRef.current) return null;
    const br = burstContainerRef.current.getBoundingClientRect();
    const lr = likeCounterRef.current.getBoundingClientRect();
    const cx = br.left + br.width / 2;
    const cy = br.top + br.height / 2;
    const lx = lr.left + lr.width / 2;
    const ly = lr.top + lr.height / 2;
    return { x: lx - cx, y: ly - cy };
  };
  const authorId = post.author?._id || post.author?.id;
  const likeCount = post.likes?.length ?? 0;
  const commentCount = post.comments?.length ?? 0;
  const progress = typeof playProgress === 'number' ? playProgress : 0;
  const [avatarZoomOpen, setAvatarZoomOpen] = useState(false);
  const [linksExpanded, setLinksExpanded] = useState(false);
  const avatarLongPress = useLongPress(() => setAvatarZoomOpen(true));
  const closeAvatarPreview = () => setAvatarZoomOpen(false);

  // Real-time color extraction from video frame; update heart burst colors to match video tone
  useEffect(() => {
    if (!isVideoPost || !videoRef?.current) {
      setHeartColors(DEFAULT_HEART_COLORS);
      return;
    }
    const video = videoRef.current;
    const tick = () => {
      const colors = getColorsFromVideoFrame(video, canvasRef);
      if (colors) setHeartColors(colors);
    };
    tick();
    const interval = setInterval(tick, 400);
    return () => clearInterval(interval);
  }, [isVideoPost, videoRef]);

  // When parent triggers heart (e.g. double-tap), add a burst and travel to like counter
  useEffect(() => {
    if (triggerHeartAnimation) {
      const id = ++burstIdRef.current;
      const target = getTravelTarget();
      setBursts((prev) => [...prev, { id, target }]);
      const t = setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 1200);
      return () => clearTimeout(t);
    }
  }, [triggerHeartAnimation]);

  const addBurst = () => {
    const id = ++burstIdRef.current;
    const target = getTravelTarget();
    setBursts((prev) => [...prev, { id, target }]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 1200);
  };

  const handleFloatingHeartClick = (e) => {
    e.stopPropagation();
    onLike(post._id);
    addBurst(); // every click adds a burst (fast click = more hearts)
  };

  const handleShopClick = (e) => {
    e.stopPropagation();
    setHeartHiddenByShop(true);
    navigate('/user/store');
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/user/post/${post._id}`;
    if (navigator.share) {
      navigator.share({ title: post.title || 'Post', url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).then(() => {
        toast({ title: 'Link copied', status: 'success', duration: 2000 });
      });
    }
  };

  return (
    <>
      {/* Video playback timeline - full bottom, no safe area (only for video) */}
      {isVideoPost && (
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        zIndex={11}
        h="2px"
        bg="rgba(255, 0, 80, 0.3)"
        overflow="hidden"
      >
        <Box
          h="100%"
          w={`${progress * 100}%`}
          bg="#FF0050"
          transition="width 0.15s linear"
        />
      </Box>
      )}
      {/* Center-right: heart icon – stays visible on like; hide only when user clicks Shop; color from video */}
      {!heartHiddenByShop && (
      <Box
        position="absolute"
        right="18%"
        top="50%"
        transform="translateY(-50%)"
        zIndex={10}
        onClick={(e) => e.stopPropagation()}
      >
        <Box
          as="button"
          aria-label="Like"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={0}
          bg="transparent"
          border="none"
          cursor="pointer"
          _hover={{ opacity: 0.9 }}
          _active={{ transform: 'scale(0.95)' }}
          transition="all 0.2s"
          onClick={handleFloatingHeartClick}
        >
          <Heart
            size={36}
            strokeWidth={1}
            fill={heartColors[0]}
            color={heartColors[0]}
          />
        </Box>
      </Box>
      )}
      {/* Heart burst: hearts radiate out then smoothly travel to like counter */}
      <Box
        ref={burstContainerRef}
        position="absolute"
        right="18%"
        top="50%"
        w="140px"
        h="140px"
        zIndex={9}
        pointerEvents="none"
        sx={{ transform: 'translate(50%, -50%)' }}
      >
        {bursts.map((burst) => (
          <Box key={burst.id} position="absolute" left="50%" top="50%" w={0} h={0} sx={{ transform: 'translate(-50%, -50%)' }}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const r = 52;
              const x = Math.cos(rad) * r;
              const y = Math.sin(rad) * r;
              const hasTravel = burst.target != null;
              const endX = hasTravel ? burst.target.x : x;
              const endY = hasTravel ? burst.target.y : y;
              const heartColor = heartColors[i % heartColors.length];
              return (
                <motion.div
                  key={`${burst.id}-${angle}`}
                  initial={{ scale: 0.2, opacity: 0.95, x: 0, y: 0 }}
                  animate={{
                    scale: hasTravel ? [0.2, 1.2, 0.4] : [0.2, 1.35, 1.1],
                    opacity: hasTravel ? [0.95, 0.9, 0] : [0.95, 0.85, 0],
                    x: hasTravel ? [0, x * 0.5, endX] : [0, x * 0.6, x],
                    y: hasTravel ? [0, y * 0.5, endY] : [0, y * 0.6, y],
                  }}
                  transition={{
                    duration: hasTravel ? 1.05 : 0.75,
                    times: hasTravel ? [0, 0.25, 1] : [0, 0.4, 1],
                    ease: [0.25, 0.1, 0.25, 1],
                    delay: i * 0.03,
                  }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    pointerEvents: 'none',
                  }}
                >
                  <Heart
                    size={44}
                    strokeWidth={1}
                    fill={heartColor}
                    color={heartColor}
                    style={{ filter: `drop-shadow(0 2px 8px ${heartColor}99)`, transform: 'translate(-50%, -50%)' }}
                  />
                </motion.div>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Top: Back (top-left) + profile pill + sound + delete — header size unchanged */}
      <Box
        position="absolute"
        zIndex={10}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        maxW="min(280px, 88%)"
        mr={2}
        sx={{
          top: 'calc(env(safe-area-inset-top, 0px) + 0.5rem)',
          left: 'env(safe-area-inset-left, 0px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <HStack flex={1} minW={0} spacing={1.5} align="center">
          <IconButton
            aria-label="Back"
            icon={<ChevronLeft size={24} />}
            size="sm"
            variant="ghost"
            color="whiteAlpha.700"
            flexShrink={0}
            ml={0}
            pl={0}
            _hover={{ bg: 'whiteAlpha.2' }}
            onClick={(e) => { e.stopPropagation(); if (window.history.length > 1) navigate(-1); else navigate('/user/home'); }}
          />
        <HStack
          flex={1}
          minW={0}
          bg="transparent"
          borderRadius="full"
          px={2}
          py={1.5}
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.2)"
          spacing={2}
          sx={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <Box {...avatarLongPress} flexShrink={0} cursor="pointer">
            <Avatar
              name={post.author?.name || 'Unknown'}
              src={post.author?.profileImage}
              sx={{
                width: '28px',
                height: '28px',
                minWidth: '28px',
                minHeight: '28px',
              }}
            />
          </Box>
          <AvatarZoomPreview
            isOpen={avatarZoomOpen}
            onClose={closeAvatarPreview}
            name={post.author?.name || 'Unknown'}
            src={post.author?.profileImage}
          />
          <UserName
            userId={authorId}
            name={post.author?.name || 'Unknown'}
            subscription={post.author?.subscription}
            fontSize="xs"
            fontWeight={500}
            color="white"
            noOfLines={1}
            _hover={{ color: 'white', textDecoration: 'none' }}
            _active={{ color: 'white', textDecoration: 'none' }}
          />
          </HStack>
        </HStack>
        <HStack
          spacing={1}
          flexShrink={0}
          ml={1.5}
          bg="transparent"
          borderRadius="full"
          px={1}
          py={0.5}
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.2)"
          sx={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {isVideoPost && hasAddedMusic && (
          <IconButton
            aria-label={hasSound ? 'Mute' : 'Unmute'}
            icon={hasSound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            size="xs"
            variant="ghost"
            color="white"
            _hover={{ bg: 'whiteAlpha.2' }}
            onClick={(e) => { e.stopPropagation(); onRequestSound?.(); }}
          />
          )}
          {showDelete && (
            <IconButton
              aria-label="Delete"
              icon={<Trash2 size={14} />}
              size="xs"
              variant="ghost"
              color="white"
              _hover={{ bg: 'red.500' }}
              onClick={(e) => { e.stopPropagation(); onDelete(post._id); }}
            />
          )}
          {showFeedModeSwitch && onFeedModeSwitch && (
            <IconButton
              aria-label={feedMode === 'video' ? 'Switch to image feed' : 'Switch to video feed'}
              icon={feedMode === 'video' ? <ImageIcon size={16} /> : <Video size={16} />}
              size="xs"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.2' }}
              onClick={(e) => { e.stopPropagation(); onFeedModeSwitch(); }}
            />
          )}
        </HStack>
      </Box>

      {/* Bottom-left L-shape: full to screen on bottom + left; transparent blur only on top + right */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        zIndex={9}
        pt={16}
        pb={0}
        pl={0}
        pr={3}
        pointerEvents="none"
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
      >
        <Box
          maxW="78%"
          px={3}
          py={2}
          pb={3}
          bg="rgba(0, 0, 0, 0.16)"
          sx={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            maskImage: 'linear-gradient(to top, black 0%, rgba(0,0,0,0.7) 25%, transparent 100%), linear-gradient(to right, black 0%, rgba(0,0,0,0.7) 80%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 0%, rgba(0,0,0,0.7) 25%, transparent 100%), linear-gradient(to right, black 0%, rgba(0,0,0,0.7) 80%, transparent 100%)',
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
          pointerEvents="auto"
          onClick={(e) => e.stopPropagation()}
        >
          {post.title && (
            <Text
              as="span"
              display="block"
              noOfLines={titleExpanded ? undefined : 1}
              mb={1}
              cursor="pointer"
              textShadow="0 0 1px rgba(0,0,0,1), 0 1px 3px rgba(0,0,0,0.9)"
              onClick={(e) => {
                e.stopPropagation();
                setTitleExpanded((prev) => !prev);
              }}
              sx={{
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSize: '15px',
                lineHeight: '21px',
                fontWeight: 400,
                letterSpacing: 'normal',
                color: '#F3F5F7',
              }}
            >
              {post.title}
            </Text>
          )}
          {post.content && (
            <Text color="whiteAlpha.900" fontSize="xs" noOfLines={2} mb={1}>
              {post.content}
            </Text>
          )}
          {post.links && Array.isArray(post.links) && post.links.length > 0 && (() => {
            const validLinks = post.links.filter((l) => (l?.name || l?.url || '').toString().trim());
            const visibleLinks = validLinks.length > 2 && !linksExpanded ? validLinks.slice(0, 2) : validLinks;
            const showMoreOption = validLinks.length > 2;
            return (
            <Box mb={1}>
              <VStack align="stretch" spacing={0.5} w="100%">
                {visibleLinks.map((link, idx) => (
                  <HStack
                    key={idx}
                    align="center"
                    spacing={2}
                    w="100%"
                    sx={{
                      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                      fontSize: '15px',
                      lineHeight: '21px',
                      fontWeight: 400,
                      letterSpacing: 'normal',
                      color: '#F3F5F7',
                    }}
                  >
                    <Box as="span" color="gray.400" display="inline-flex" alignItems="center" aria-hidden><LinkIcon size={14} /></Box>
                    <Text as="span" color="gray.400" noOfLines={1} fontSize="15px">{link.name || 'Link'}</Text>
                    <Text as="span" color="gray.400" fontSize="15px" flexShrink={0}>→</Text>
                    <Text
                      as="a"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      color="blue.400"
                      noOfLines={1}
                      fontSize="15px"
                      flex={1}
                      minW={0}
                      textDecoration="none"
                      _hover={{ textDecoration: 'none', color: 'blue.300' }}
                      _active={{ textDecoration: 'none' }}
                      sx={{
                        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                        fontSize: '15px',
                        lineHeight: '21px',
                        fontWeight: 400,
                        letterSpacing: 'normal',
                      }}
                    >
                      {getShortLinkDisplayUrl(link.url)}
                    </Text>
                    {showMoreOption && idx === visibleLinks.length - 1 && (
                      <Box
                        as="button"
                        type="button"
                        flexShrink={0}
                        display="inline-flex"
                        alignItems="center"
                        justifyContent="center"
                        aria-label={linksExpanded ? 'Show less links' : 'Show more links'}
                        onClick={(e) => { e.stopPropagation(); setLinksExpanded((prev) => !prev); }}
                        color="gray.400"
                        _hover={{ color: 'gray.300' }}
                        p={0.5}
                      >
                        {linksExpanded ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                      </Box>
                    )}
                  </HStack>
                ))}
              </VStack>
            </Box>
            );
          })()}
          <HStack spacing={2} color="whiteAlpha.800" fontSize="2xs" flexWrap="wrap" align="center">
            <HStack
              ref={likeCounterRef}
              as="button"
              spacing={1}
              onClick={(e) => { e.stopPropagation(); onLike(post._id, { showBurst: false }); }}
              _hover={{ opacity: 0.9 }}
              aria-label="Like"
            >
              <Heart size={14} strokeWidth={1} fill={isLiked ? '#ed4956' : 'none'} color={isLiked ? '#ed4956' : 'white'} />
              <Text>{likeCount}</Text>
            </HStack>
            <Text>•</Text>
            <Text>{formatViewCount(post.viewCount ?? 0)} views</Text>
            {post.createdAt && (
              <>
                <Text>•</Text>
                <Text>{getRelativeTime(post.createdAt)}</Text>
              </>
            )}
          </HStack>
        </Box>
      </Box>

      {/* Bottom-right: reel header–style blur buttons (comment, share, save) – horizontal, no safe area */}
      <Box
        position="absolute"
        right={2}
        bottom={2}
        zIndex={10}
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-end"
        gap={1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Shop – hides floating heart and goes to store */}
            <IconButton
          aria-label="Shop"
          icon={<ShoppingBag size={16} strokeWidth={1} color="white" />}
          size="xs"
          w="32px"
          h="32px"
          minW="32px"
          minH="32px"
          borderRadius="full"
          bg="transparent"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.2)"
              color="white"
              _hover={{ bg: 'whiteAlpha.2' }}
          sx={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          onClick={handleShopClick}
            />
        {/* Comment */}
            <IconButton
              aria-label="Comment"
          icon={<MessageCircle size={16} strokeWidth={1} color="white" />}
          size="xs"
          w="32px"
          h="32px"
          minW="32px"
          minH="32px"
          borderRadius="full"
          bg="transparent"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.2)"
              color="white"
              _hover={{ bg: 'whiteAlpha.2' }}
          sx={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
              onClick={(e) => { e.stopPropagation(); onOpenComments?.(post._id); }}
            />
        {/* Share */}
          <IconButton
            aria-label="Share"
          icon={<Share2 size={16} strokeWidth={1} color="white" />}
          size="xs"
          w="32px"
          h="32px"
          minW="32px"
          minH="32px"
          borderRadius="full"
          bg="transparent"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.2)"
            color="white"
            _hover={{ bg: 'whiteAlpha.2' }}
          sx={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
            onClick={handleShare}
          />
        {/* Save */}
          {onSave && (
              <IconButton
                aria-label={isSaved ? 'Unsave' : 'Save'}
            icon={isSaved ? <BookmarkCheck size={16} strokeWidth={1} fill="white" color="white" /> : <Bookmark size={16} strokeWidth={1} color="white" />}
            size="xs"
            w="32px"
            h="32px"
            minW="32px"
            minH="32px"
            borderRadius="full"
            bg="transparent"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.2)"
                color="white"
                _hover={{ bg: 'whiteAlpha.2' }}
            sx={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                onClick={(e) => { e.stopPropagation(); onSave(post._id); }}
              />
          )}
      </Box>
    </>
  );
}
