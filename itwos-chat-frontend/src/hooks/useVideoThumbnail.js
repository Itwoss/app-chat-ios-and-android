import { useState, useCallback } from 'react'

export const RATIO_VALUES = ['4:5', '1:1', '16:9', '9:16']

/**
 * Generate a video thumbnail (stub). Returns null url/blob.
 * Replace with real canvas capture when needed.
 */
export async function generateVideoThumbnail(_videoFile, _ratio, _time) {
  return { blob: null, url: null }
}

/**
 * Stub hook for video thumbnail generation. Returns safe defaults.
 * Replace with real canvas/video-frame implementation when needed.
 */
export function useVideoThumbnail(videoFile, _videoRatio) {
  const [previewUrl, setPreviewUrl] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const setManualFile = useCallback((file) => {
    setThumbnailFile(file ?? null)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
    setError(null)
  }, [])

  const generateFromFirstFrame = useCallback(() => {
    setLoading(true)
    setError(null)
    return Promise.resolve().then(() => {
      setLoading(false)
    })
  }, [])

  const clearThumbnail = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setThumbnailFile(null)
    setError(null)
  }, [previewUrl])

  return {
    previewUrl,
    thumbnailFile,
    setManualFile,
    generateFromFirstFrame,
    clearThumbnail,
    loading,
    error,
  }
}

export default useVideoThumbnail
