import { extendTheme } from '@chakra-ui/react'

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
  disableTransitionOnChange: false,
}

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#f0f0f0',
      100: '#d0d0d0',
      200: '#a0a0a0',
      300: '#707070',
      400: '#404040',
      500: '#1a1a1a',
      600: '#151515',
      700: '#101010',
      800: '#0a0a0a',
      900: '#050505',
    },
    gray: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#000000', // Pure black for dark mode components
      900: '#000000', // Pure black for dark mode
    },
    // Semantic tokens for consistent UI (use in useColorModeValue or theme.colors.app)
    app: {
      cardBg: {
        light: '#FFFFFF',
        dark: '#1C1C1E',
      },
      textSecondary: {
        light: '#6C6C70',
        dark: '#98989D',
      },
      accent: {
        light: '#007AFF',
        dark: '#0A84FF',
      },
      bg: {
        light: '#F2F2F7',
        dark: '#000000',
      },
    },
  },
  // Type scale: caption / body / subtitle / title for consistent hierarchy
  fontSizes: {
    caption: '12px',
    body: '14px',
    subtitle: '16px',
    title: '18px',
    display: '20px',
  },
  components: {
    Button: {
      baseStyle: {
        _focusVisible: {
          boxShadow: '0 0 0 2px var(--chakra-colors-blue-400)',
          outline: 'none',
        },
      },
      defaultProps: {
        colorScheme: 'brand',
      },
      variants: {
        solid: (props) => {
          const isDark = props.colorMode === 'dark'
          return {
            bg: isDark 
              ? 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)'
              : 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
            color: 'white',
            _hover: {
              bg: isDark
                ? 'linear-gradient(135deg, #5a5a5a 0%, #3a3a3a 100%)'
                : 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
              _disabled: {
                bg: isDark
                  ? 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)'
                  : 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
              },
            },
            _active: {
              bg: isDark
                ? 'linear-gradient(135deg, #3a3a3a 0%, #1a1a1a 100%)'
                : 'linear-gradient(135deg, #0a0a0a 0%, #050505 100%)',
            },
          }
        },
        // Primary CTA: solid blue (matches app.accent, use for auth and main actions)
        primary: (props) => {
          const isDark = props.colorMode === 'dark'
          const bg = isDark ? '#0A84FF' : '#007AFF'
          return {
            bg,
            color: 'white',
            _hover: { bg: isDark ? '#2090FF' : '#0066DD', _disabled: { bg } },
            _active: { bg: isDark ? '#0066CC' : '#0055BB' },
          }
        },
      },
    },
    IconButton: {
      baseStyle: {
        _focusVisible: {
          boxShadow: '0 0 0 2px var(--chakra-colors-blue-400)',
          outline: 'none',
        },
      },
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#000000' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.900',
      },
    }),
  },
})

export default theme

