# Modal & Drawer Testing Checklist

Use this after changing overlay behavior (e.g. `motionPreset="none"`, CSS animations) to confirm modals and the drawer still open/close correctly.

## UserHome

- [ ] **Create Post** — Tap "Create Post" → modal opens with short slide-up (CSS only, no framer-motion).
- [ ] **Edit post** — Open edit on a post → Edit modal opens with slide-up.
- [ ] **Delete post** — Delete a post → "Delete Post" alert opens instantly.
- [ ] **My Stories** — Tap stories/avatar to open My Stories → full-screen BlurModal opens with slide-up.

## Create Post flow

- [ ] **Main Create Post modal** — Opens with slide-up animation.
- [ ] **Adjust border radius** (if available) — Opens with slide-up.

## UserLayout (mobile / narrow viewport)

- [ ] **Menu drawer** — Open hamburger/menu → drawer opens with slide-in from left.

## Post details

- [ ] **Post details modal** — Open a post (e.g. from feed) → BlurModal opens with slide-up.

## Notes

- All overlays use `motionPreset="none"` with CSS-only entrance (`modalContentIn`, `drawerContentIn`, `blurModalContentIn`).
- Framer-motion is not used at runtime for these; it remains in the bundle only as a Chakra peer dependency.
