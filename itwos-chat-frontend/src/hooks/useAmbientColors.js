import { useState, useEffect, useRef } from 'react';
import { extractDominantColor, createGradientColor } from '../utils/colorExtractor';

/**
 * Hook to extract ambient colors from an image and create a gradient background
 * @param {string} imageUrl - URL of the image to extract colors from
 * @returns {string} - CSS gradient string for background
 */
const useAmbientColors = (imageUrl) => {
  const [gradient, setGradient] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const extractingRef = useRef(false);
  const lastImageUrlRef = useRef(null);

  useEffect(() => {
    // Skip if same image URL or already extracting
    if (!imageUrl || imageUrl === lastImageUrlRef.current || extractingRef.current) {
      if (!imageUrl) {
        setGradient('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
      }
      return;
    }

    lastImageUrlRef.current = imageUrl;
    extractingRef.current = true;

    const extractColors = async () => {
      try {
        const dominantColor = await extractDominantColor(imageUrl);
        const lighterColor = createGradientColor(dominantColor, 15);
        const darkerColor = createGradientColor(dominantColor, -10);
        
        // Create a gradient with the extracted colors
        const newGradient = `linear-gradient(135deg, ${lighterColor} 0%, ${dominantColor} 50%, ${darkerColor} 100%)`;
        setGradient(newGradient);
      } catch (error) {
        console.error('Error extracting ambient colors:', error);
        setGradient('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
      } finally {
        extractingRef.current = false;
      }
    };

    extractColors();
  }, [imageUrl]);

  return gradient;
};

export default useAmbientColors;
