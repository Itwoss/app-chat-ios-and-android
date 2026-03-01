# 404 on Refresh (SPA Routing Fix)

## What happens

- You log in and navigate to **Home**, **Dashboard**, or any route (e.g. `/user/home`, `/user/dashboard`).
- When you **refresh** the page (F5 or pull-to-refresh), you get **404 – The requested page was not found**.

## Why

This is a **Single Page Application (SPA)**. Routes like `/user/home` exist only in the **client** (React Router). When you click links, the browser URL changes but no new request is sent to the server.

When you **refresh**, the browser sends a **new request** to the server for that URL (e.g. `GET https://yoursite.com/user/home`). The server looks for a file at `/user/home` and finds nothing, so it returns **404**.  
The fix is to tell the server: “For any path that doesn’t match a real file, serve `index.html`” so React can load and handle the route.

---

## Fix by host

### Digital Ocean App Platform

**Option A – App spec (recommended)**  
The repo already has `.do/app.yaml` with:

```yaml
catchall_document: index.html
```

This must be used when the app is created/updated from this spec (e.g. “Import app spec” or deploy from a repo that uses this file). After changing the spec, **redeploy** the app.

**Option B – Set in the console (if spec is not used)**  
If the app was created in the UI and the spec above is not applied:

1. Open [Digital Ocean](https://cloud.digitalocean.com/) → **Apps** → your frontend app.
2. Go to **Settings**.
3. Find the **Static Site** component → **Custom Pages** or **Error Document**.
4. Set **Error document** (or “Catch-all document”) to **`index.html`**.
5. Save and **Redeploy**.

After this, refreshing `/user/home`, `/login`, etc. should load the app instead of 404.

### Other hosts (Netlify, Nginx, Apache, etc.)

- **Netlify:** Add `public/_redirects` with: `/* /index.html 200`
- **Nginx:** `try_files $uri $uri/ /index.html;`
- **Apache:** Enable `mod_rewrite` and add a rule that serves `index.html` for non-file paths.

---

## Quick check

After applying the fix and redeploying:

1. Log in and go to any route (e.g. `/user/home`).
2. Refresh the page (F5 or pull-to-refresh).
3. You should see the app, not 404.

If you still see 404, the host is not serving `index.html` for that path — double-check the setting name (Error document / Catch-all document / SPA fallback) and redeploy.
