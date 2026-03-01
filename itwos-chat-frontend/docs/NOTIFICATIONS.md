# Notification UX (Instagram-like behavior)

This doc explains how in-app and system notifications work and how to change them.

---

## Current design

| App state | In-app (bell / toast) | System (phone) notification |
|-----------|------------------------|------------------------------|
| **App open & visible** (e.g. homepage) | ✅ Shown | ❌ Not shown (we skip it to avoid duplicate) |
| **App in background / locked** | N/A | ✅ Shown |
| **App closed** | N/A | ✅ Shown (when supported) |

- **Backend:** On every new chat message it sends both a Socket.IO event and a Web Push.
- **Frontend (socket):** `HomepageNotificationBell` and `NotificationBell` listen to `new-message` and show an in-app notification (bell badge + toast/banner).
- **Frontend (service worker):** In `public/sw.js`, we only call `showNotification()` when the app is **not** in the foreground (`visibilityState !== 'visible'` and not `focused`). So when you’re on the homepage with the app open, you see the bell notification only; when you background the app, you get the system notification.

This avoids showing both an in-app toast and a system notification at the same time when the user is already in the app.

---

## Why system notification doesn’t show when app is open

1. **Our choice:** We intentionally skip `showNotification()` in the service worker when a window is visible/focused so the user isn’t notified twice (in-app + system).
2. **Platform (e.g. iOS):** Even if we always called `showNotification()`, iOS often suppresses or downgrades system notifications when the app is in the foreground. So you can’t fully get “always system notification in foreground” like a native app (e.g. Instagram) without going native.

---

## How to test

- **In-app when open:** Open the app, stay on homepage (or any page), have someone send you a message → you should see the bell / in-app notification only.
- **System when backgrounded:** Open the app, press Home (or switch app / lock device), then have someone send you a message → you should get a system notification.

If system notifications don’t appear when the app is **backgrounded**, check: notification permission, push subscription (Settings → Notifications), and backend logs for “Push delivered”.

---

## Options to change behavior (Instagram-like)

### Option A – Keep current (recommended)

- In-app when app is open, system when app is closed/background.
- Single clear surface: no duplicate in-app + system when you’re already in the app.

### Option B – Always try to show system notification

- In `public/sw.js`, remove the “app in foreground” check and always call `showNotification()`.
- **Result:** On desktop/Android you may get both in-app and system when the app is open. On iOS, the system may still suppress the notification in foreground, so behavior can differ by platform.

### Option C – System notification as primary, in-app only as badge

- In the service worker: always call `showNotification()` (as in B).
- In the app: on `new-message` only update unread count / badge; do **not** show the in-app toast for new messages (or make it very subtle).
- **Result:** User relies on system notification; in-app is mainly for badge/list. On iOS, in-foreground system notification may still be suppressed.

### Option D – In-app toast only when not in that chat

- Keep current service worker (system only when not in foreground).
- In-app: when you receive a message and you’re **not** in that chat, show a small toast (already done by `NotificationBell` / `HomepageNotificationBell`). When you’re **in** that chat, only update the thread (no toast). This is already the intended behavior.

---

## Where to change the logic

| What | Where |
|------|--------|
| When to show **system** notification | `frontend/public/sw.js` → `push` listener (foreground check). |
| When to show **in-app** notification (bell/toast) | `frontend/src/components/Notifications/NotificationBell.jsx` and `HomepageNotificationBell.jsx` → socket `new-message` handler and queue logic. |
| Backend: send push on message | `backend/controllers/chatController.js` → after saving message, `sendPushToUser(...)`. |

---

## Bottom line

The current setup is “Instagram-like” in spirit: one clear notification when you’re in the app (in-app), and system notification when you’re not. To get native-app-level control over system notifications in foreground, you’d need a native app (e.g. React Native or native iOS/Android).
