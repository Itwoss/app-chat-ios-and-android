import { useState, useCallback, useRef, useEffect } from 'react'

function getSupportedMimeType() {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

function checkSupport() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false
  const mime = getSupportedMimeType()
  return !!mime
}

/**
 * Voice recording with MediaRecorder. Hold mic to record, then tap send to upload.
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioError, setAudioError] = useState(null)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const streamRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const durationIntervalRef = useRef(null)
  const blobResolveRef = useRef(null)
  const blobReadyRef = useRef(false)
  const isSupported = checkSupport()

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setAudioError(new Error('Recording not supported in this browser'))
      return
    }
    setAudioError(null)
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingDuration(0)
    chunksRef.current = []
    blobResolveRef.current = null
    blobReadyRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = getSupportedMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const stream = streamRef.current
        if (stream) {
          stream.getTracks().forEach((t) => t.stop())
          streamRef.current = null
        }
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current)
          durationIntervalRef.current = null
        }
        setIsRecording(false)
        const chunks = chunksRef.current
        if (chunks.length === 0) {
          setAudioError(new Error('No audio recorded'))
          setIsProcessing(false)
          blobResolveRef.current?.(false)
          return
        }
        const blob = new Blob(chunks, { type: mimeType || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        blobReadyRef.current = true
        setIsProcessing(false)
        blobResolveRef.current?.(true)
      }
      recorder.onerror = () => {
        setIsRecording(false)
        setAudioError(new Error('Recording failed'))
        setIsProcessing(false)
        blobResolveRef.current?.(false)
      }

      mediaRecorderRef.current = recorder
      recorder.start(200)
      setIsRecording(true)
      setIsProcessing(true)

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((s) => s + 1)
      }, 1000)
    } catch (err) {
      setAudioError(err?.message ? new Error(err.message) : new Error('Microphone access denied'))
      setIsRecording(false)
      setIsProcessing(false)
    }
  }, [isSupported])

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
      mediaRecorderRef.current = null
    } else {
      setIsRecording(false)
      setIsProcessing(false)
    }
  }, [])

  const clearRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    blobReadyRef.current = false
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingDuration(0)
    setAudioError(null)
  }, [audioUrl])

  const getAudioFile = useCallback(() => {
    if (!audioBlob) return null
    const ext = audioBlob.type.includes('ogg') ? 'ogg' : 'webm'
    return new File([audioBlob], `voice.${ext}`, { type: audioBlob.type })
  }, [audioBlob])

  const waitForAudioBlob = useCallback((timeoutMs = 3000) => {
    if (blobReadyRef.current && audioBlob) return Promise.resolve(true)
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        blobResolveRef.current = null
        resolve(false)
      }, timeoutMs)
      blobResolveRef.current = (value) => {
        clearTimeout(t)
        blobResolveRef.current = null
        resolve(!!value)
      }
      if (blobReadyRef.current) blobResolveRef.current(true)
    })
  }, [audioBlob])

  const formatDuration = useCallback((seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [])

  return {
    isRecording,
    isSupported,
    error: audioError,
    audioBlob,
    audioUrl,
    recordingDuration,
    isProcessing,
    startRecording,
    stopRecording,
    clearRecording,
    getAudioFile,
    waitForAudioBlob,
    formatDuration,
  }
}

export default useAudioRecorder
