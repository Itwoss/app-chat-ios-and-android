import { useState, useCallback } from 'react'

/**
 * Stub hook for location data (countries, states, cities).
 * Returns empty data; replace with real API when needed.
 */
export function useLocationData() {
  const [countries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStates = useCallback((_countryCode) => {
    setStates([])
  }, [])

  const fetchCities = useCallback((_countryCode, _stateCode) => {
    setCities([])
  }, [])

  return {
    countries,
    states,
    cities,
    loading,
    error,
    fetchStates,
    fetchCities,
  }
}

export default useLocationData
