import {
  Modal,
  ModalOverlay,
  ModalContent,
} from '@chakra-ui/react'

const overlaySx = {
  animation: 'blurModalFade 0.3s ease-out',
  '@keyframes blurModalFade': { from: { opacity: 0 }, to: { opacity: 1 } },
}

const defaultContentSx = {
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: 'none',
}

const contentNonePresetSx = {
  animation: 'blurModalContentIn 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
  '@keyframes blurModalContentIn': {
    from: { opacity: 0, transform: 'translate3d(0, 16px, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
}

/**
 * Reusable glass/blur modal: Modal + ModalOverlay + ModalContent with transparent bg, blur, and border.
 * Pass children (e.g. ModalHeader, ModalBody, ModalCloseButton). Override via overlayProps, contentProps.
 */
export default function BlurModal({
  isOpen,
  onClose,
  children,
  size = 'md',
  isCentered = true,
  motionPreset = 'none',
  blockScrollOnMount = true,
  overlayBg = 'blackAlpha.600',
  overlayProps = {},
  borderColor = 'rgba(255, 255, 255, 0.2)',
  contentProps = {},
  ...modalProps
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      isCentered={isCentered}
      motionPreset={motionPreset}
      blockScrollOnMount={blockScrollOnMount}
      {...modalProps}
    >
      <ModalOverlay bg={overlayBg} sx={overlaySx} {...overlayProps} />
      <ModalContent
        bg="transparent"
        border="1px solid"
        borderColor={borderColor}
        overflow="hidden"
        borderRadius={{ base: '20px', md: '24px' }}
        sx={motionPreset === 'none' ? { ...defaultContentSx, ...contentNonePresetSx } : defaultContentSx}
        {...contentProps}
      >
        {children}
      </ModalContent>
    </Modal>
  )
}
