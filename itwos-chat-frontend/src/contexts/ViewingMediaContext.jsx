import { createContext, useContext, useState, useCallback } from 'react'

const ViewingMediaContext = createContext(null)

export function ViewingMediaProvider({ children }) {
  const [viewingMedia, setViewingMedia] = useState(null)
  const value = { viewingMedia, setViewingMedia }
  return (
    <ViewingMediaContext.Provider value={value}>
      {children}
    </ViewingMediaContext.Provider>
  )
}

export function useViewingMedia() {
  const ctx = useContext(ViewingMediaContext)
  if (!ctx) {
    return { viewingMedia: null, setViewingMedia: () => {} }
  }
  return ctx
}

export default ViewingMediaContext
