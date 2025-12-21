# Ko-fi Webhook Bot

A webhook server that automatically whitelists players on Squad servers based on Ko-fi donations.

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Expose your server publicly (see options below)

## Public Hosting Options

### Option 1: ngrok (Easiest for Testing)

1. Download ngrok from https://ngrok.com/download
2. Sign up for a free account and get your authtoken
3. Authenticate: `ngrok config add-authtoken YOUR_TOKEN`
4. Start your server: `npm start`
5. In another terminal, run: `ngrok http 3000`
6. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
7. Use this URL in Ko-fi webhook settings: `https://abc123.ngrok.io/webhook/kofi`

**Note**: Free ngrok URLs change each time you restart. For permanent URLs, upgrade to a paid plan.

### Option 2: localtunnel (Free Alternative)

1. Install globally: `npm install -g localtunnel`
2. Start your server: `npm start`
3. In another terminal: `lt --port 3000`
4. Copy the URL provided (e.g., `https://random-name.loca.lt`)
5. Use this URL in Ko-fi webhook settings

### Option 3: Cloudflare Tunnel (Free, Permanent)

1. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Start your server: `npm start`
3. Run: `cloudflared tunnel --url http://localhost:3000`
4. Copy the HTTPS URL provided
5. Use this URL in Ko-fi webhook settings

### Option 4: Deploy to Cloud Service

#### Railway (Easy, Free Tier Available)
1. Push code to GitHub
2. Go to https://railway.app
3. New Project → Deploy from GitHub
4. Select your repo
5. Railway auto-detects Node.js and deploys
6. Get your public URL from Railway dashboard

#### Render (Free Tier Available)
1. Push code to GitHub
2. Go to https://render.com
3. New → Web Service
4. Connect GitHub repo
5. Build command: `npm install`
6. Start command: `npm start`
7. Deploy and get your public URL

#### Heroku
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `git push heroku main`
4. Get URL from Heroku dashboard

## Environment Variables

You can set these environment variables:

- `PORT`: Server port (default: 3000)
- `API_KEY`: Your whitelist API key (currently hardcoded)
- `BASE_URL`: API base URL (currently hardcoded)

## Testing

1. Use the health check endpoint: `GET /health`
2. Test webhook locally using curl:
   ```bash
   curl -X POST http://localhost:3000/webhook/kofi \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "data={\"type\":\"Donation\",\"amount\":\"10.00\",\"currency\":\"GBP\",\"message\":\"My SteamID64 is 76561198000000000\",\"from_name\":\"Test User\",\"is_public\":true,\"message_id\":\"test-123\"}"
   ```

## Ko-fi Webhook Setup

1. Go to your Ko-fi account settings
2. Navigate to "Webhooks" section
3. Add webhook URL: `https://your-public-url/webhook/kofi`
4. Save and test with a small donation

