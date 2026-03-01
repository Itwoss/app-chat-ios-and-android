import { createContext, useContext, useEffect, useState } from 'react';
import { useGetCurrentUserQuery } from '../store/api/userApi';

const FontContext = createContext();

export const useFont = () => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};

export const FontProvider = ({ children }) => {
  const [equippedFont, setEquippedFont] = useState(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const { data: currentUserData } = useGetCurrentUserQuery();

  const loadFont = async (font) => {
    if (!font || !font.fileUrl) {
      setFontLoaded(true);
      return;
    }

    try {
      // Check if font is already loaded
      if (document.fonts.check(`1em "${font.fontFamily}"`)) {
        setFontLoaded(true);
        return;
      }

      // Create font face
      const fontFace = new FontFace(
        font.fontFamily,
        `url(${font.fileUrl})`
      );

      // Load font
      await fontFace.load();
      document.fonts.add(fontFace);

      // Set CSS variable for global use
      document.documentElement.style.setProperty(
        '--user-font-family',
        `"${font.fontFamily}", sans-serif`
      );

      // Apply additional CSS styles if any
      if (font.cssStyles) {
        const styleId = 'user-font-styles';
        let styleElement = document.getElementById(styleId);
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        styleElement.textContent = font.cssStyles;
      }

      setFontLoaded(true);
    } catch (error) {
      console.error('Error loading font:', error);
      // Fallback to default
      setFontLoaded(true);
    }
  };

  useEffect(() => {
    // Get equipped font from user data
    const font = currentUserData?.data?.equippedFont;
    
    if (font && font._id) {
      setEquippedFont(font);
      loadFont(font);
    } else {
      // Use default font
      setEquippedFont(null);
      setFontLoaded(true);
      // Set default CSS variable
      document.documentElement.style.setProperty(
        '--user-font-family',
        'sans-serif'
      );
    }
  }, [currentUserData]);

  const getFontFamily = () => {
    if (equippedFont && fontLoaded) {
      return `"${equippedFont.fontFamily}", sans-serif`;
    }
    return 'sans-serif'; // Default fallback
  };

  const value = {
    equippedFont,
    fontLoaded,
    getFontFamily,
    loadFont
  };

  return (
    <FontContext.Provider value={value}>
      {children}
    </FontContext.Provider>
  );
};

