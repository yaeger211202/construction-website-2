# Ocean Infra — Static Site

A clean, ocean‑themed landing page for the construction company “Ocean Infra”. Built with vanilla HTML, CSS and a sprinkle of JS. No build tools required.

## Quick start

- Open `index.html` directly in a browser.
- Or serve the folder with any static server (recommended for smooth scroll/history):

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Customize

- Brand: update `assets/logo.svg` and the text in the header/footer.
- Colors: adjust CSS variables in `styles.css` under `:root` (e.g., `--ocean`, `--teal`, `--aqua`).
- Sections: edit content in `index.html` under `#services`, `#projects`, `#about`, `#contact`.
- Project visuals: replace the decorative background in `.project__media` with real images.
- Favicon: replace `assets/favicon.svg`.

## Notes

- The contact form is non‑functional by default; it shows a toast confirmation. Hook this up to your preferred backend or form service when ready.
- The site is responsive and includes a mobile menu, smooth scrolling, and accessible focus states.

# construction-website-2