import PostDetailsModal from './PostDetailsModal'

const formatViewCount = (count) => {
  if (count < 1000) return count.toString()
  if (count < 1000000) return (count / 1000).toFixed(1) + 'K'
  return (count / 1000000).toFixed(1) + 'M'
}

/**
 * Sheet-style wrapper around PostDetailsModal for profile view.
 * Maps PostDetailsSheet props to PostDetailsModal and calls onAfterArchive/onAfterDelete on close.
 */
export default function PostDetailsSheet({ post, isOpen, onClose, onAfterArchive, onAfterDelete }) {
  const handleClose = () => {
    onClose?.()
    onAfterArchive?.()
    onAfterDelete?.()
  }

  const hasMusic = Boolean(post?.song || (post?.sound && post.sound.source === 'youtube'))
  const hasYouTubeSound = Boolean(post?.sound && post.sound.source === 'youtube')
  const songName = post?.sound?.title || (post?.song ? 'Background Music' : '')
  const isLiked = post?.likes?.some((l) => {
    const id = typeof l === 'object' ? l._id : l
    return id
  })

  return (
    <PostDetailsModal
      isOpen={isOpen}
      onClose={handleClose}
      post={post}
      isLiked={!!isLiked}
      liveViewCount={0}
      totalViewCount={post?.viewCount ?? 0}
      songName={songName}
      hasMusic={hasMusic}
      hasYouTubeSound={hasYouTubeSound}
      postSound={post?.sound}
      formatViewCount={formatViewCount}
    />
  )
}
