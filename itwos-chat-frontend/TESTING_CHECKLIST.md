# Testing checklist

Use this to smoke-test the app locally (frontend + backend).

---

## Prerequisites

- **Backend** running on port **5001** (e.g. `cd backend && npm run dev`).
- **Frontend** `.env` has `VITE_API_URL=http://localhost:5001`.
- If you run the frontend on **port 5174**, ensure backend CORS includes `http://localhost:5174` (see `backend/server.js` `allowedOrigins`) and restart the backend after changing it.

---

## 1. Backend

- [ ] `curl http://localhost:5001/api/health` returns `200` and `"success":true`.
- [ ] **Automated smoke test:** `cd backend && npm run test:smoke` passes (pings `/api/health` and `/api/user/me`).

---

## 2. Frontend build

- [ ] `cd frontend && npm run build` completes with no errors.

---

## 3. Frontend dev server

- [ ] `cd frontend && npm run dev` — app opens at http://localhost:5173 (or the port Vite prints).
- [ ] No CORS errors in the browser console when the app loads.

---

## 4. Auth & home

- [ ] **Login** — sign in with a test user; redirect to home/feed.
- [ ] **Home / Feed** — posts or empty state load without errors.

---

## 5. Chat (refactored ChatConversation)

- [ ] Open **Chat** from the app (e.g. chat list or conversation route).
- [ ] **Conversation** loads; messages show with correct alignment (own vs other).
- [ ] **Send** a new text message; it appears in the thread.
- [ ] **Reply** — use reply on a message; reply preview appears above input; send reply; thread shows reply block.
- [ ] **Bubbles** — rich card / image / text bubbles render; timestamps or long-press to show time works if implemented.
- [ ] No console errors while switching chats or sending messages.

---

## 6. Profile & settings

- [ ] Open **Profile** (own or another user); profile and posts load.
- [ ] Open **Settings**; page loads; change a setting and save (if applicable).

---

## 7. Other flows (optional)

- [ ] **Stories** — view/create if the app has stories.
- [ ] **Notifications** — if implemented.
- [ ] **Logout** — sign out and sign back in.

---

## Quick commands

```bash
# Terminal 1 – backend
cd backend && npm run dev

# Terminal 2 – frontend
cd frontend && npm run dev
```

Then open http://localhost:5173 (or the port Vite shows) and run through the checklist above.
