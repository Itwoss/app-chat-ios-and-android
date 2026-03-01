import { useState, useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import ReelVideo from './ReelVideo';
import ReelOverlay from './ReelOverlay';

/** Resolve image URL: use as-is if absolute, else prepend API base (for relative paths from backend). */
function getImageSrc(url) {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = import.meta.env.VITE_API_URL || '';
  const baseClean = (base || '').replace(/\/+$/, '');
  const path = url.replace(/^\/+/, '');
  return baseClean ? `${baseClean}/${path}` : url;
}

/**
 * Clean reel card: one IntersectionObserver, native video or image, no audio context.
 * Feed passes hasSound + onRequestSound so only one reel has sound (video only).
 * Supports video posts (post.video) and image-only posts (post.images).
 */
export default function ReelCard({
  post,
  onLike,
  triggerHeartAnimation,
  onDelete,
  onAddComment,
  onOpenComments,
  onSave,
  isSaved,
  hasSound,
  onRequestSound,
  userInfo,
  userData,
  scrollRootRef,
  showFeedModeSwitch = false,
  feedMode = 'video',
  onFeedModeSwitch,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  const authorId = post.author?._id || post.author?.id;
  const isAuthor =
    post.author?._id?.toString() === userInfo?.id?.toString() ||
    post.author?._id?.toString() === userData?.data?._id?.toString();
  const isLiked = post.likes?.some(
    (l) => (typeof l === 'object' ? l._id : l)?.toString() === userInfo?.id?.toString() ||
           (typeof l === 'object' ? l._id : l)?.toString() === userData?.data?._id?.toString()
  );

  useEffect(() => {
    const el = containerRef.current;
    const root = scrollRootRef?.current ?? null;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { root, threshold: 0.7 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRootRef]);

  const isVideoPost = !!post?.video;
  const imageList = post?.images ?? post?.imageUrls ?? [];
  const isImagePost = !post?.video && imageList?.length > 0;
  if (!isVideoPost && !isImagePost) return null;

  const hasUploadedSong = Boolean(post?.song);
  const hasYouTubeSound = Boolean(
    post?.sound && post.sound.source === 'youtube'
  );
  const hasVideoWithOwnAudio = Boolean(post?.video);
  let hasAddedMusic = hasUploadedSong || hasYouTubeSound;
  if (hasVideoWithOwnAudio && !hasUploadedSong && !hasYouTubeSound) {
    hasAddedMusic = false;
  }

  const imageUrl = isImagePost ? getImageSrc(imageList[0]) : null;
  // Use uploaded aspect ratio from metadata: "what ratio I upload, that ratio show"
  const meta = post?.imageEditMetadata;
  const firstMeta = Array.isArray(meta) ? meta[0] : meta;
  const imageRatio = (isImagePost && firstMeta?.ratio) ? firstMeta.ratio : '9:16';
  const aspectRatioCss = String(imageRatio).replace(':', ' /');

  return (
    <Box
      ref={containerRef}
      position="relative"
      w="100%"
      h="100%"
      bg="black"
      overflow="hidden"
    >
      {isVideoPost ? (
        <ReelVideo
          videoRef={videoRef}
          videoUrl={post.video}
          isVisible={isVisible}
          muted={!hasSound}
          loop
          objectFit="cover"
          onProgress={setPlayProgress}
        />
      ) : (
        <Box
          w="100%"
          h="100%"
          minH={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="black"
        >
          {imageUrl && (
            <Box
              as="span"
              display="block"
              h="100%"
              maxW="100%"
              aspectRatio={aspectRatioCss}
              margin="0 auto"
              sx={{ '& img': { width: '100%', height: '100%', objectFit: 'contain' } }}
            >
              <img
                src={imageUrl}
                alt=""
                decoding="async"
                loading="lazy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>
          )}
        </Box>
      )}
      <ReelOverlay
        post={post}
        isLiked={!!isLiked}
        triggerHeartAnimation={!!triggerHeartAnimation}
        isAuthor={!!isAuthor}
        showDelete={!!isAuthor}
        hasSound={hasSound}
        hasAddedMusic={hasAddedMusic}
        onRequestSound={onRequestSound}
        onLike={onLike}
        onDelete={onDelete}
        onOpenComments={onOpenComments}
        onSave={onSave}
        isSaved={!!isSaved}
        playProgress={playProgress}
        userInfo={userInfo}
        userData={userData}
        isVideoPost={isVideoPost}
        videoRef={isVideoPost ? videoRef : null}
        showFeedModeSwitch={showFeedModeSwitch}
        feedMode={feedMode}
        onFeedModeSwitch={onFeedModeSwitch}
      />
    </Box>
  );
}
