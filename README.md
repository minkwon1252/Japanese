# Koharu — Learn Japanese 🌸

> A modern, gamified Japanese learning website for mastering Hiragana, Katakana, and core vocabulary.

[![GitHub Pages](https://img.shields.io/badge/Live-GitHub%20Pages-blue?logo=github)](https://your-username.github.io/koharu/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Overview

Koharu is a browser-based Japanese learning tool inspired by apps like Duolingo and WaniKani. It runs entirely as a static site — no server, no subscription, no install. Open it and start learning.

**Focus areas**
- Instant Hiragana & Katakana recognition
- Character writing practice
- Core vocabulary for beginners
- Long-term progress and gamification

---

## Features

### ⚡ Kana Speed Game
Type the romaji for each displayed character before the timer runs out. Three difficulty modes:

- **Easy** — 46 basic kana (a, ka, sa…)
- **Hard** — all kana including dakuten (が, ざ…), semi-voiced (ぱ…), and combinations (きゃ, しゅ, ちょ…)
- **Time limits** — 30, 60, or 120 seconds

Scoring uses a combo multiplier — build a streak for bonus points. Mistakes break the combo immediately. Review every character you missed at the end screen.

### ✏️ Kana Writing Game
Draw characters freehand with mouse or touch on a canvas. Three hint levels:

- **Guide** — faded tracing template always visible
- **Timed** — character previews for 2 seconds then disappears
- **No Hint** — full recall from memory

After drawing, pixel-similarity comparison gives you an accuracy score and overlays the correct character for comparison.

### 📖 Vocabulary Learning
76 common nouns across 7 categories: **Animals, Food, Household, School, Nature, Transportation, Family**.

Four study modes per category:
- **Flashcards** — flip to reveal reading, emoji, and meaning; self-rate as Easy/Hard
- **Quiz** — four-option multiple choice with instant feedback
- **Typing** — type the correct romaji; auto-submits on exact match
- **Listening** — hear the word (Web Speech API), pick the correct option

### 📊 Kana Mastery Tracking
Every practice session updates per-character statistics. The progress page shows a colour-coded grid for all kana sets:

| Colour | Meaning |
|--------|---------|
| 🟢 Green | Mastered (≥ 80% accuracy, streak ≥ 3, ≥ 5 attempts) |
| 🟡 Yellow | Occasionally wrong |
| 🟠 Orange | Frequently wrong |
| 🔴 Red | Consistently wrong |
| ⬜ Gray | Not yet practiced |

### 🎮 XP and Leveling
Ten levels from **Beginner** to **Grandmaster** with intentionally long gaps:

```
Level 1  Beginner        0 XP
Level 2  Novice        300 XP   (~4 good games)
Level 3  Apprentice    750 XP
Level 4  Student      1500 XP
Level 5  Intermediate 3000 XP   (~1 month daily play)
Level 6  Proficient   6000 XP
Level 7  Advanced    10000 XP
Level 8  Expert      18000 XP
Level 9  Master      30000 XP
Level 10 Grandmaster 50000 XP
```

### 🔥 Daily Streak & Achievements
A day-streak counter resets if you skip a day. Unlock 21 achievements across kana mastery, vocabulary, combos, streaks, and XP milestones.

### ☁️ Cloud Sync (optional)
Sign in with a free account to save progress to Firebase and sync across devices. Works with or without an account — localStorage is always the fallback.

---

## Screenshots

> *(Screenshots will be added after the first public release)*

| Dashboard | Kana Speed Game | Progress Page |
|-----------|----------------|---------------|
| *coming soon* | *coming soon* | *coming soon* |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (single-page app, hash-based routing) |
| Styling | CSS3 (custom properties, grid, flexbox, CSS animations) |
| Logic | Vanilla JavaScript (ES6+, no framework) |
| Audio | Web Audio API (synthesised sound effects) |
| TTS | Web Speech API (Japanese pronunciation) |
| Drawing | Canvas API (writing game) |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore (optional cloud sync) |
| Hosting | GitHub Pages |
| Storage | `localStorage` (primary offline store, cloud cache) |

No bundler, no npm, no build step — the site is exactly what you see in the repo.

---

## Project Structure

```
koharu/
├── index.html              ← single entry point
├── css/
│   └── style.css           ← all styles (dark mode, animations, responsive)
├── js/
│   ├── firebase-config.js  ← fill in your Firebase credentials here
│   ├── auth.js             ← Firebase Auth module
│   ├── cloud-sync.js       ← Firestore read/write + migration
│   ├── data.js             ← kana data, vocab, levels, achievements
│   ├── progress.js         ← XP, mastery tracking, localStorage
│   ├── audio.js            ← Web Audio sound effects + confetti
│   └── app.js              ← router, view renderers, game logic
└── README.md
```

### Future module locations

```
js/
└── modules/
    ├── kanji.js        (planned — Kanji learning + stroke order)
    ├── grammar.js      (planned — N5/N4 grammar patterns)
    ├── listening.js    (planned — audio comprehension)
    ├── jlpt.js         (planned — JLPT N5–N1 prep)
    └── ai-chat.js      (planned — AI conversation partner)
```

---

## Deployment to GitHub Pages

### Prerequisites
- A [GitHub](https://github.com) account
- Git installed locally

### Steps

**1 — Create a repository**

```bash
# In the project folder
git init
git add .
git commit -m "Initial commit"
```

Go to <https://github.com/new>, create a repo (e.g. `koharu`), then:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/koharu.git
git push -u origin main
```

**2 — Enable GitHub Pages**

1. Go to your repo → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)` → **Save**
4. Wait ~60 seconds; refresh the Settings page
5. Your site is live at `https://<your-username>.github.io/koharu/`

**3 — Deploy updates**

```bash
git add .
git commit -m "Your change description"
git push
```

GitHub Pages redeploys automatically within ~1 minute.

### Custom domain (optional)

1. Add a `CNAME` DNS record at your registrar: `<your-username>.github.io`
2. In **Settings → Pages → Custom domain**, enter your domain
3. Check **Enforce HTTPS** once DNS propagates (~10 min – 48 h)

---

## Cloud Sync Setup (Firebase)

Cloud sync is entirely optional. The app works perfectly with just `localStorage`.

**To enable cloud saves:**

1. Go to <https://console.firebase.google.com/> → Create project (free Spark plan)
2. **Authentication** → Sign-in method → Enable **Email/Password**
3. **Firestore Database** → Create database → Start in **production mode**
4. Add these **Firestore security rules** (Console → Firestore → Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

5. **Project Settings** → Your apps → Add a Web app → Copy the config object
6. Paste your values into `js/firebase-config.js`

---

## Local Development

No build step needed. Serve the project root with any static server:

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open `http://localhost:8080`.

Opening `index.html` directly as a `file://` URL also works for most features, except that Firebase will require a proper origin — use a local server for cloud sync testing.

---

## Browser Support

All modern browsers (Chrome, Firefox, Safari, Edge). Requires:
- ES6+ JavaScript
- CSS Custom Properties
- Canvas API (writing game)
- Web Audio API (sound effects; gracefully silent if unavailable)
- Web Speech API (TTS for vocabulary; gracefully silent if unavailable)

---

## Contributing

Issues and pull requests are welcome. Key areas for contribution:
- New vocabulary categories
- Kanji module
- Spaced repetition system (SRS)
- JLPT N5 content packs

---

## License

MIT © Koharu Project
