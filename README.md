# Division by Zero Interactive

Vite + React + TypeScript SPA about why division by zero is undefined. [Standards.md](Standards.md) captures standards and CK-12 usage.

**Live (Content‑Interactives):** https://content-interactives.github.io/Division-by-0-/  
**Note:** `package.json` also sets `homepage` to `https://destinynguyen.github.io/divby0apple`; align `base` in `vite.config.js` and `homepage` with whichever GitHub Pages URL you publish to.

## Requirements

- Node.js 18+  
- npm

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Dependencies |
| `npm run dev` | Vite dev server |
| `npm run build` | Production `dist/` |
| `npm run preview` | Preview `dist/` |
| `npm run lint` | ESLint |
| `npm run deploy` | Build + gh-pages |

## Vite

`vite.config.js` currently sets `base: './'` (relative assets). Change to an absolute path (e.g. `/Division-by-0-/`) if you rely on GitHub Pages without `index.html` in the URL.

## Stack

React 19, TypeScript, Vite 7, ESLint.

## Layout

- `src/` — React source  
- `public/` — static files  
- `index.html` — entry
