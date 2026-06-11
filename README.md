# Koharu — Learn Japanese 🌸

A modern, gamified Japanese learning website covering hiragana, katakana, and vocabulary.

## Live site

Once deployed, your site lives at:

```
https://<your-github-username>.github.io/<repo-name>/
```

---

## Deploying to GitHub Pages (step-by-step)

This project is a plain static site (`index.html` + `css/` + `js/`).  
No build step is required — GitHub Pages can serve it directly.

### 1 — Create a GitHub repository

1. Go to <https://github.com/new>
2. Name the repo (e.g. `koharu`) — **leave "Initialize repository" unchecked**
3. Click **Create repository**

### 2 — Push your files

Open a terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

### 3 — Enable GitHub Pages

1. On GitHub, go to your repo → **Settings** → **Pages** (left sidebar)
2. Under **Source**, select **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)` → click **Save**
4. Wait ~60 seconds, then refresh the page
5. GitHub shows a green banner: *"Your site is published at …"*

Your public URL will be:

```
https://<your-username>.github.io/<repo-name>/
```

### 4 — Update after changes

```bash
git add .
git commit -m "Your change description"
git push
```

GitHub Pages automatically redeploys within ~1 minute.

### Why no build step is needed

- All asset paths are **relative** (`css/style.css`, `js/app.js`), so they resolve correctly at any URL depth.
- `index.html` sits at the repository root, which is exactly what GitHub Pages expects.
- Progress data is stored in the browser's `localStorage` — no server or database required.

---

## Custom domain (optional)

1. Buy a domain from any registrar (Namecheap, Google Domains, etc.)
2. In GitHub repo → **Settings → Pages → Custom domain**, enter your domain
3. Add a `CNAME` DNS record at your registrar pointing to `<your-username>.github.io`
4. Check **Enforce HTTPS** once the DNS propagates (~10 min – 24 h)

---

## Project structure

```
/
├── index.html          ← single-page entry point
├── css/
│   └── style.css       ← all styles (dark mode, animations, responsive)
├── js/
│   ├── data.js         ← kana data, vocab, levels, achievements
│   ├── progress.js     ← XP, mastery tracking, localStorage persistence
│   ├── audio.js        ← Web Audio API sound effects + confetti
│   └── app.js          ← routing, all view renderers, game logic
└── README.md
```
