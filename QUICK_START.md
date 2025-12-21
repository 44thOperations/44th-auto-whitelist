# Quick Start Guide - Public Hosting

## Fastest Method: ngrok (5 minutes)

1. **Install ngrok:**
   - Download from: https://ngrok.com/download
   - Extract and add to PATH, or use the executable directly

2. **Get your authtoken:**
   - Sign up at https://dashboard.ngrok.com/signup (free)
   - Copy your authtoken from the dashboard

3. **Authenticate ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

4. **Start your server:**
   ```bash
   npm install
   npm start
   ```
   You should see: `Ko-fi webhook server listening on port 3000`

5. **Expose it publicly:**
   Open a **new terminal** and run:
   ```bash
   ngrok http 3000
   ```

6. **Copy your public URL:**
   You'll see something like:
   ```
   Forwarding   https://abc123-def456.ngrok-free.app -> http://localhost:3000
   ```
   Copy the HTTPS URL (the one starting with `https://`)

7. **Configure Ko-fi webhook:**
   - Go to your Ko-fi account → Settings → Webhooks
   - Add webhook URL: `https://abc123-def456.ngrok-free.app/webhook/kofi`
   - Save

8. **Test it:**
   - Make a test donation with your SteamID64 in the message
   - Check your server logs to see if it processed correctly

**Note:** Free ngrok URLs change each time you restart. For a permanent URL, upgrade to ngrok's paid plan or use one of the other options below.

---

## Alternative: localtunnel (Free, No Signup)

1. **Install localtunnel:**
   ```bash
   npm install -g localtunnel
   ```

2. **Start your server:**
   ```bash
   npm start
   ```

3. **Expose it:**
   In another terminal:
   ```bash
   lt --port 3000
   ```

4. **Use the URL provided** in your Ko-fi webhook settings

---

## For Production: Deploy to Railway (Free Tier)

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to https://railway.app
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Node.js and deploys
   - Click on your service → Settings → Generate Domain
   - Copy the public URL

3. **Set environment variables** (if needed):
   - In Railway dashboard → Variables tab
   - Add: `PORT=3000`, `API_KEY=...`, etc.

4. **Use the Railway URL** in your Ko-fi webhook settings

---

## Testing Your Webhook

Test locally with curl:
```bash
curl -X POST http://localhost:3000/webhook/kofi \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "data={\"type\":\"Donation\",\"amount\":\"10.00\",\"currency\":\"GBP\",\"message\":\"My SteamID64 is 76561198000000000\",\"from_name\":\"Test User\",\"is_public\":true,\"message_id\":\"test-123\"}"
```

Check health endpoint:
```bash
curl http://localhost:3000/health
```

