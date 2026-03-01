# PWA Icons Required

To complete the PWA setup, you need to add icon files:

## Required Icons

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

## How to Create Icons

1. Create a square image (at least 512x512) with your app logo/icon
2. Use an online tool like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - Or any image editor (Photoshop, GIMP, Canva)

3. Export two sizes:
   - 192x192 pixels → save as `icon-192.png`
   - 512x512 pixels → save as `icon-512.png`

4. Place both files in `/public/icons/` directory

## Icon Guidelines

- Use a simple, recognizable design
- Ensure good contrast for visibility
- Avoid text that's too small
- Test on both light and dark backgrounds
- The icon will be displayed on home screens and app launchers

## Quick Test

After adding icons:
1. Build your app: `npm run build`
2. Serve with HTTPS (use localhost or deploy)
3. Open in browser
4. Check DevTools → Application → Manifest to verify icons load
5. Test "Add to Home Screen" on mobile devices
