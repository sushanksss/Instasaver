# Insta Own Media Downloader (Compliant)

A simple full‑stack example that lets a user authenticate with Instagram's **Basic Display API** and download **their own** photos/videos.

## Why compliant?
- It does **not** scrape Instagram.
- It avoids bypassing Instagram's technical restrictions.
- It accesses only the authenticated user's media via official endpoints.
- It shows direct `media_url` links for lawful personal backup.

## Prerequisites
- Node.js 18+
- An Instagram App (Basic Display) on [developers.facebook.com](https://developers.facebook.com/)

## Instagram App Setup (Basic Display)
1. Create an app -> **Consumer** -> **Instagram Basic Display**.
2. Add a product: **Instagram Basic Display**.
3. Configure a valid OAuth Redirect URI: `http://localhost:3000/callback` (must match `.env`).
4. Get **App ID** and **App Secret**.
5. Add/enable permissions: `user_profile`, `user_media`.
6. Add your Instagram account as a tester. Accept the invite from Instagram app (Settings → Security → Apps and Websites → Tester Invites).

## Local development
```bash
npm install
cp .env.example .env
# fill IG_APP_ID, IG_APP_SECRET, IG_REDIRECT_URI, SESSION_SECRET
npm run start
# visit http://localhost:3000
```

## How it works
- `/auth` -> Redirects to Instagram OAuth.
- `/callback` -> Exchanges code for short‑lived `access_token`.
- `/media` -> Calls `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp` and renders a gallery with **Download** links.

## Notes
- For production, convert to a **long‑lived token** and refresh it periodically (`/refresh-token` route provided).
- This demo stores the token only in a session (server memory). For real apps, use a DB.
- Respect copyright and creator rights. Download only content you uploaded or have permission to download.
