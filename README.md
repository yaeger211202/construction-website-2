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

## Files

- `index.html` — page markup
- `styles.css` — theme and layout
- `script.js` — interactions and animations
- `assets/` — logo and waves SVGs
- `vercel.json` — optional headers/caching