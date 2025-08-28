# Ocean Infra — Static Website

Modern, mobile-first landing site for Ocean Infra.
Built with HTML, CSS, and vanilla JS. Ideal for Vercel static hosting.

## Local development

- Serve locally: `python3 -m http.server 8000` then open `http://localhost:8000`

## Deploy on Vercel

1. Push this project to GitHub.
2. In Vercel, import the GitHub repo (Framework: Other).
3. Build Command: none. Output Directory: leave empty.

Vercel will serve `index.html` from the repo root.

## Chat widget notifications (Telegram)

Set Vercel Environment Variables:
- `TELEGRAM_BOT_TOKEN`: token from BotFather
- `TELEGRAM_CHAT_ID`: your Telegram chat ID (or group/channel ID where the bot is added)

Endpoint: `/api/notify` (serverless function)
Client: floating chat widget in the bottom-right corner.

## Files

- `index.html` — page markup
- `styles.css` — theme and layout
- `script.js` — interactions and animations
- `assets/` — logo and waves SVGs
- `vercel.json` — optional headers/caching