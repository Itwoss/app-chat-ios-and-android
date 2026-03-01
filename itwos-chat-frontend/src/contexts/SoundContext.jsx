import { createContext, useContext, useState, useCallback } from 'react'

const SoundContext = createContext(null)

export function SoundProvider({ children }) {
  const [selectedSound, setSelectedSound] = useState(null)
  const selectSound = useCallback((sound) => {
    setSelectedSound(sound ?? null)
  }, [])
  const value = { selectSound, selectedSound }
  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  const ctx = useContext(SoundContext)
  if (!ctx) {
    return {
      selectSound: () => {},
      selectedSound: null,
    }
  }
  return ctx
}

export default SoundContext
