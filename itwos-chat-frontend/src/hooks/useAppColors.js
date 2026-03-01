import { useColorModeValue } from '@chakra-ui/react'

/**
 * Centralized app UI tokens (card bg, text secondary, accent, page bg).
 * Values match theme.colors.app in theme.js — use for consistent UI.
 */
export function useAppColors() {
  const cardBg = useColorModeValue('#FFFFFF', '#1C1C1E')
  const textSecondary = useColorModeValue('#6C6C70', '#98989D')
  const accent = useColorModeValue('#007AFF', '#0A84FF')
  const bg = useColorModeValue('#F2F2F7', '#000000')
  const isDark = useColorModeValue(false, true)
  return { cardBg, textSecondary, accent, bg, isDark }
}
