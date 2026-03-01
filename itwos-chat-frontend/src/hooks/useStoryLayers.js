import { useState, useCallback } from 'react'

/**
 * Minimal stub for story layers (text, emoji, mention overlays).
 * Returns layers array and CRUD helpers.
 */
export default function useStoryLayers({ defaultFontSize = 24 } = {}) {
  const [layers, setLayers] = useState([])

  const addLayer = useCallback((layer) => {
    const id = `layer-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setLayers((prev) => [...prev, { ...layer, id, fontSize: layer.fontSize ?? defaultFontSize }])
  }, [defaultFontSize])

  const removeLayer = useCallback((id) => {
    setLayers((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const moveLayer = useCallback((id, direction) => {
    setLayers((prev) => {
      const i = prev.findIndex((l) => l.id === id)
      if (i < 0) return prev
      const next = [...prev]
      const j = direction === 'up' ? i - 1 : i + 1
      if (j < 0 || j >= next.length) return prev
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }, [])

  const clearLayers = useCallback(() => setLayers([]), [])

  const updateLayer = useCallback((id, updates) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    )
  }, [])

  return {
    layers,
    addLayer,
    removeLayer,
    moveLayer,
    clearLayers,
    updateLayer,
  }
}
