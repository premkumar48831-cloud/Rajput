# FFH4X VIP Store & Panel Manager 🚀

Premium VIP Web Store for Free Fire Panels, Aimbot Mods, Bypass, and Instant Key Delivery.

---

## 🌐 Netlify Deployment (Zero 404 Guaranteed)

This project is pre-configured with `netlify.toml` and `public/_redirects` to ensure **ZERO 404 ERRORS** during navigation or refresh.

### Step 1: Push Code to GitHub
1. Create a new repository on GitHub (e.g. `ffh4x-vip-store`).
2. Run in terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - FFH4X VIP Store"
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```

### Step 2: Deploy on Netlify
1. Go to [Netlify](https://app.netlify.com/) and click **"Add new site" > "Import an existing project"**.
2. Choose **GitHub** and select your repository.
3. Verify Build Settings:
   - **Base directory:** (leave empty or `./`)
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Click **Deploy Site**.
5. Your custom live URL will be ready immediately!

---

## ⚡ Zero 404 Configuration Included
- `netlify.toml` - Netlify SPA redirects & build config
- `public/_redirects` - Fallback redirect for static Netlify hosting
- `vercel.json` - Vercel SPA rewrites
- `public/404.html` - GitHub Pages SPA redirection
- `vite.config.ts` - Relative asset URLs (`./assets/...`) so files never fail to load regardless of domain or sub-folder.

---

## 🎬 Video & Demo Features
- **YouTube Support:** Native embedded player with auto-play and responsive layout.
- **Telegram VIP Video Support:** Official channel links (`@Premjodvip`) with direct launch buttons.
- **Direct Video (MP4/WebM):** Native HTML5 video player with full playback controls.
