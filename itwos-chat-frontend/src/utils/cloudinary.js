import { Cloudinary } from '@cloudinary/url-gen'

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dm0agfcje'

/**
 * Shared Cloudinary instance using env cloud name.
 * Use with @cloudinary/url-gen and @cloudinary/react AdvancedImage/AdvancedVideo.
 */
export const cld = new Cloudinary({ cloud: { cloudName } })

export { cloudName }
