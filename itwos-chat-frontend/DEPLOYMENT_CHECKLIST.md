# Deployment checklist

Use this as a step-by-step list when deploying the Chat App (frontend + backend) to a VPS (e.g. DigitalOcean Droplet).

---

## 1. Prerequisites

- [ ] Node.js (v18+) on the server
- [ ] MongoDB connection string (or local MongoDB)
- [ ] Domains or IPs for frontend and API (if using HTTPS, certificates ready)

---

## 2. Frontend (static build)

1. **On your machine or CI:**
   ```bash
   cd frontend
   npm ci
   npm run build
   ```
2. **Upload** the contents of `frontend/dist/` to the server (e.g. to `/usr/share/nginx/html` or your chosen docroot).
3. **Nginx** should serve that directory. Example (already in repo as `nginx.conf`):
   - `root /usr/share/nginx/html;`
   - `index index.html;`
   - `location / { try_files $uri $uri/ /index.html; }` (SPA routing)
   - `location /assets/` with long cache if desired.

---

## 3. Backend (Node API)

1. **Upload** the `backend/` folder to the server (excluding `node_modules`).
2. **Install and run:**
   ```bash
   cd backend
   npm ci --production
   ```
3. **Environment:** Create `.env` (see `.env.example` and `.env.production.example`). At minimum:
   - `MONGODB_URI` – MongoDB connection string
   - `PORT` – e.g. `5001` (default in code)
   - `JWT_SECRET` – secret for auth tokens
   - `FRONTEND_URL` – production frontend URL (used for CORS)
   - Add any other keys your app uses (Razorpay, Cloudinary, encryption, etc.)
4. **Run the server:**
   ```bash
   node server.js
   ```
   Or use a process manager (e.g. **pm2**):
   ```bash
   pm2 start server.js --name chat-api
   pm2 save && pm2 startup
   ```

---

## 4. Frontend environment (build-time)

Before running `npm run build`, set production env so the built bundle points to the real API:

- **`VITE_API_URL`** – e.g. `https://api.yourdomain.com` or `https://yourdomain.com/api`
- **`VITE_FRONTEND_URL`** – e.g. `https://yourdomain.com`
- Other `VITE_*` vars as needed (Razorpay, Cloudinary, etc.)

These are baked into the frontend at build time.

---

## 5. CORS

Backend `server.js` uses an `allowedOrigins` list. Ensure your production frontend URL is included (e.g. `https://yourdomain.com`) or set `FRONTEND_URL` in backend `.env` and have it in that list.

---

## 6. Optional: API under same domain (reverse proxy)

If you serve the API at e.g. `https://yourdomain.com/api`:

- In Nginx, add a `location /api/` that proxies to `http://127.0.0.1:5001` (or your `PORT`).
- Set **`VITE_API_URL=https://yourdomain.com/api`** when building the frontend.

---

## 7. Post-deploy checks

- [ ] Frontend loads at the production URL; no 404s on refresh (SPA routing).
- [ ] Login/register and API calls work (check Network tab; no CORS errors).
- [ ] Cookies/auth work (same-site / secure if using HTTPS).
- [ ] WebSocket (chat) connects if your backend uses Socket.IO and the frontend is configured for the same API origin.

---

## Quick reference

| Item            | Where / How |
|-----------------|-------------|
| Frontend build  | `frontend/` → `npm run build` → upload `dist/` |
| Frontend env    | `VITE_*` set before build |
| Backend env     | `.env` in `backend/` (see examples) |
| Backend port    | `PORT` in `.env` or default `5001` |
| Nginx config    | `nginx.conf` in repo (docroot + SPA fallback) |
| CORS            | `allowedOrigins` in `backend/server.js` + `FRONTEND_URL` |
