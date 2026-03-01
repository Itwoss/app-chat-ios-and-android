/**
 * Color Extraction Utility for Story Rings
 * Extracts dominant colors from profile images to create adaptive story rings
 */

/**
 * Extracts the dominant color from an image
 * @param {string} imageUrl - URL of the image to analyze
 * @param {number} sampleSize - Number of pixels to sample (default: 100)
 * @returns {Promise<string>} - Hex color string (e.g., "#FF5733")
 */
export const extractDominantColor = async (imageUrl, sampleSize = 100) => {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      resolve('#8E8E8E') // Default gray if no image
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Use a smaller canvas for faster processing
        const maxSize = 200
        let width = img.width
        let height = img.height
        
        // Scale down if image is too large
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
        
        canvas.width = width
        canvas.height = height
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // Sample pixels from the image
        const imageData = ctx.getImageData(0, 0, width, height)
        const pixels = imageData.data
        const colorCounts = {}
        
        // Sample pixels (skip some for performance)
        const step = Math.max(1, Math.floor((width * height) / sampleSize))
        
        for (let i = 0; i < pixels.length; i += step * 4) {
          const r = pixels[i]
          const g = pixels[i + 1]
          const b = pixels[i + 2]
          const a = pixels[i + 3]
          
          // Skip transparent pixels
          if (a < 128) continue
          
          // Quantize colors to reduce variations (group similar colors)
          const quantizedR = Math.floor(r / 10) * 10
          const quantizedG = Math.floor(g / 10) * 10
          const quantizedB = Math.floor(b / 10) * 10
          
          const colorKey = `${quantizedR},${quantizedG},${quantizedB}`
          colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1
        }
        
        // Find the most common color
        let maxCount = 0
        let dominantColor = null
        
        for (const [colorKey, count] of Object.entries(colorCounts)) {
          if (count > maxCount) {
            maxCount = count
            dominantColor = colorKey
          }
        }
        
        if (dominantColor) {
          const [r, g, b] = dominantColor.split(',').map(Number)
          const hex = rgbToHex(r, g, b)
          
          // Adjust brightness for better contrast
          const adjustedColor = adjustColorForContrast(hex)
          resolve(adjustedColor)
        } else {
          resolve('#8E8E8E') // Default gray
        }
      } catch (error) {
        console.error('Error extracting color:', error)
        resolve('#8E8E8E') // Default gray on error
      }
    }

    img.onerror = () => {
      resolve('#8E8E8E') // Default gray on error
    }

    img.src = imageUrl
  })
}

/**
 * Converts RGB to Hex
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} - Hex color string
 */
const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, x)).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

/**
 * Adjusts color brightness for better contrast and accessibility
 * @param {string} hex - Hex color string
 * @param {number} brightnessAdjustment - Brightness adjustment (-15 to +15)
 * @returns {string} - Adjusted hex color string
 */
const adjustColorForContrast = (hex, brightnessAdjustment = 0) => {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Calculate brightness (luminance)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  
  // If color is too light, darken it
  // If color is too dark, lighten it
  let adjustedR = r
  let adjustedG = g
  let adjustedB = b
  
  if (brightness > 200) {
    // Too light - darken by 20%
    adjustedR = Math.max(0, r - 50)
    adjustedG = Math.max(0, g - 50)
    adjustedB = Math.max(0, b - 50)
  } else if (brightness < 50) {
    // Too dark - lighten by 20%
    adjustedR = Math.min(255, r + 50)
    adjustedG = Math.min(255, g + 50)
    adjustedB = Math.min(255, b + 50)
  }
  
  // Apply brightness adjustment
  if (brightnessAdjustment !== 0) {
    const factor = 1 + (brightnessAdjustment / 100)
    adjustedR = Math.max(0, Math.min(255, Math.floor(adjustedR * factor)))
    adjustedG = Math.max(0, Math.min(255, Math.floor(adjustedG * factor)))
    adjustedB = Math.max(0, Math.min(255, Math.floor(adjustedB * factor)))
  }
  
  return rgbToHex(adjustedR, adjustedG, adjustedB)
}

/**
 * Creates a gradient color variation of the base color
 * @param {string} baseColor - Base hex color
 * @param {number} variation - Brightness variation percentage (-15 to +15)
 * @returns {string} - Gradient color string
 */
export const createGradientColor = (baseColor, variation = 10) => {
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  const factor = 1 + (variation / 100)
  const adjustedR = Math.max(0, Math.min(255, Math.floor(r * factor)))
  const adjustedG = Math.max(0, Math.min(255, Math.floor(g * factor)))
  const adjustedB = Math.max(0, Math.min(255, Math.floor(b * factor)))
  
  return rgbToHex(adjustedR, adjustedG, adjustedB)
}

/**
 * Brightens and saturates a color for vibrant display
 * @param {string} baseColor - Base hex color
 * @returns {string} - Brightened hex color string
 */
export const brightenColor = (baseColor) => {
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  // Increase saturation and brightness
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  
  // Increase brightness by 30% and saturation by 40%
  let newR = r
  let newG = g
  let newB = b
  
  if (delta > 0) {
    // Increase saturation
    const factor = 1.4
    newR = Math.min(255, Math.floor(r + (r - (r + g + b) / 3) * (factor - 1)))
    newG = Math.min(255, Math.floor(g + (g - (r + g + b) / 3) * (factor - 1)))
    newB = Math.min(255, Math.floor(b + (b - (r + g + b) / 3) * (factor - 1)))
  }
  
  // Increase brightness
  const brightnessFactor = 1.3
  newR = Math.min(255, Math.floor(newR * brightnessFactor))
  newG = Math.min(255, Math.floor(newG * brightnessFactor))
  newB = Math.min(255, Math.floor(newB * brightnessFactor))
  
  return rgbToHex(newR, newG, newB)
}

/**
 * Creates a gradient string for the story ring
 * @param {string} baseColor - Base hex color
 * @returns {string} - CSS gradient string
 */
export const createRingGradient = (baseColor) => {
  const lighter = createGradientColor(baseColor, 12)
  const darker = createGradientColor(baseColor, -8)
  
  return `linear-gradient(135deg, ${lighter} 0%, ${baseColor} 50%, ${darker} 100%)`
}

