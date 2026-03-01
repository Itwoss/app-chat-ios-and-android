import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Box, Avatar, VStack, Text, Image } from '@chakra-ui/react';

const DURATION_MS = 280;
const EASING = 'ease-in-out';

/**
 * Modal-style avatar preview: strong frosted-glass blur, centered zoomed avatar.
 * Renders via portal into document.body so it's always full-screen and centered
 * (avoids feed/scroll/transform stacking context). Tap outside to close.
 */
export default function AvatarZoomPreview({ isOpen, onClose, name, src }) {
  const [closing, setClosing] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!isOpen || closing) return;
    setEntered(false);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => cancelAnimationFrame(t);
  }, [isOpen, closing]);

  useEffect(() => {
    if (!isOpen) return;
    setClosing(false);
    setEntered(false);
  }, [isOpen]);

  const handleClose = () => {
    if (!isOpen || closing) return;
    setClosing(true);
  };

  useEffect(() => {
    if (!closing) return;
    const id = setTimeout(() => {
      onClose();
      setClosing(false);
      setEntered(false);
    }, DURATION_MS);
    return () => clearTimeout(id);
  }, [closing, onClose]);

  if (!isOpen) return null;

  const overlay = (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={99999}
      onClick={handleClose}
      onTouchEnd={(e) => { e.preventDefault(); handleClose(); }}
      sx={{
        background: closing ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.5)',
        backdropFilter: closing ? 'blur(0px)' : 'blur(32px)',
        WebkitBackdropFilter: closing ? 'blur(0px)' : 'blur(32px)',
        opacity: closing ? 0 : (entered ? 1 : 0),
        transition: `opacity ${DURATION_MS}ms ${EASING}, background ${DURATION_MS}ms ${EASING}, backdrop-filter ${DURATION_MS}ms ${EASING}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
        isolation: 'isolate',
      }}
    >
      <VStack
        onClick={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        spacing={4}
        align="center"
        justify="center"
        flex="1"
        pb={{ base: 8, md: 6 }}
      >
        <Box
          sx={{
            width: 'min(240px, 72vw)',
            height: 'min(240px, 72vw)',
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            transform: closing ? 'scale(0.6)' : (entered ? 'scale(1)' : 'scale(0.6)'),
            opacity: closing ? 0 : (entered ? 1 : 0),
            transition: `transform ${DURATION_MS}ms ${EASING}, opacity ${DURATION_MS}ms ${EASING}`,
          }}
        >
          {src ? (
            <Image
              src={src}
              alt={name || 'Avatar'}
              width="100%"
              height="100%"
              borderRadius="50%"
              objectFit="cover"
              sx={{ width: '100%', height: '100%', display: 'block' }}
            />
          ) : (
            <Avatar
              name={name || 'Unknown'}
              src={src}
              sx={{ width: '100%', height: '100%', borderRadius: '50%' }}
            />
          )}
        </Box>
        <Text
          color="white"
          fontSize={{ base: 'lg', md: 'xl' }}
          fontWeight={500}
          textAlign="center"
          noOfLines={1}
          px={4}
          sx={{
            opacity: closing ? 0 : (entered ? 1 : 0),
            transition: `opacity ${DURATION_MS}ms ${EASING}`,
          }}
        >
          {name || 'Unknown'}
        </Text>
      </VStack>
    </Box>
  );

  return createPortal(overlay, document.body);
}
