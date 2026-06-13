'use strict';

/* ═══════════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════════ */
const App = {
  route: '/',
  user:  null,
  pendingAchievements: [],

  kana: {
    mode: 'hiragana',
    difficulty: 'easy',
    timeLimit: 60,
    playing: false,
    timeLeft: 60,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correct: 0,
    wrong: 0,
    total: 0,
    missed: [],
    correctChars: [],  // chars answered correctly this session
    current: null,
    queue: [],
    timer: null,
    results: null,
  },

  write: {
    mode: 'hiragana',
    difficulty: 'easy',
    hintLevel: 'easy',
    current: null,
    queue: [],
    correct: 0,
    total: 0,
    sessionResults: [],
    canvas: null,
    ctx: null,
    drawing: false,
    strokes: [],
    currentStroke: [],
    checked: false,
  },

  poke: {
    timeLimit:   60,
    fleeTime:    6,     // seconds before a Pokémon flees
    playing:     false,
    timeLeft:    60,
    score:       0,
    combo:       0,
    maxCombo:    0,
    caught:      0,
    fled:        0,
    total:       0,
    current:     null,
    queue:       [],
    caughtDex:   [],   // unique Pokémon caught this session
    fledList:    [],   // Pokémon that got away
    timer:       null, // session countdown
    fleeTimer:   null, // per-Pokémon flee countdown
    fleeLeft:    0,
    results:     null,
  },

  vocab: {
    category: 'animals',
    mode: 'learn',
    deck: [],
    index: 0,
    flipped: false,
    score: 0,
    wrong: 0,
    total: 0,
    typed: '',
    sessionResults: [],
    listenOptions: [],
  },
};

/* ═══════════════════════════════════════════════════════════════
   ROUTER
═══════════════════════════════════════════════════════════════ */
function navigate(route, params = {}) {
  Audio.click();
  App.route = route;
  Object.assign(App, { _params: params });
  render();
  window.scrollTo(0, 0);
}

/*
 * needsLogin — true when the login gate must block the app.
 * Only applies when Firebase is on; if it's off the app is fully
 * usable offline (localStorage only) with no gate.
 */
function needsLogin() {
  const firebaseOn = typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED;
  return firebaseOn && !App.user;
}

function render() {
  const app = document.getElementById('app');

  /* ── Login gate ──────────────────────────────────────────────
     Logged out → only the login page is reachable.
     Logged in  → the /login route bounces to the dashboard. */
  if (needsLogin())            App.route = '/login';
  else if (App.route === '/login') App.route = '/';

  document.body.classList.toggle('logged-out', App.route === '/login');

  const routes = {
    '/login':              renderLogin,
    '/':                   renderDashboard,
    '/kana-reading':       renderKanaSetup,
    '/kana-reading/play':  renderKanaGame,
    '/kana-reading/end':   renderKanaEnd,
    '/kana-writing':       renderWriteSetup,
    '/kana-writing/play':  renderWriteGame,
    '/pokemon':            renderPokeSetup,
    '/pokemon/play':       renderPokeGame,
    '/pokemon/end':        renderPokeEnd,
    '/vocabulary':         renderVocabMenu,
    '/vocabulary/mode':    renderVocabModeSelect,
    '/vocabulary/learn':   renderVocabLearn,
    '/profile':            renderProfile,
    '/vocabulary/quiz':    renderVocabQuiz,
    '/vocabulary/type':    renderVocabType,
    '/vocabulary/listen':  renderVocabListen,
    '/progress':           renderProgress,
  };
  const fn = routes[App.route] || renderDashboard;
  app.innerHTML = fn();
  afterRender();
  updateNavStats();
}

function afterRender() {
  if (App.route === '/login')             initLoginUI();
  if (App.route === '/pokemon/play')      initPokeGameUI();
  if (App.route === '/kana-reading/play') initKanaGameUI();
  if (App.route === '/kana-writing/play') initWriteCanvas();
  if (App.route === '/vocabulary/quiz')   attachQuizEvents();
  if (App.route === '/vocabulary/type')   focusTypeInput();
  if (App.route === '/vocabulary/listen') attachListenEvents();
  if (App.route === '/vocabulary/learn')  initFlipCard();
  if (App.route === '/progress')          animateProgressBars();
}

/* ═══════════════════════════════════════════════════════════════
   NAV / THEME / TOAST
═══════════════════════════════════════════════════════════════ */
function updateNavStats() {
  const p = Progress.get();
  const lvl = getLevelInfo(p.xp);
  const streak = document.getElementById('nav-streak');
  const xp     = document.getElementById('nav-xp');
  const level  = document.getElementById('nav-level');
  const chip   = document.getElementById('level-chip');
  if (streak) streak.textContent = p.streak;
  if (xp)     xp.textContent     = `${p.xp} XP`;
  if (level)  level.textContent  = `${lvl.current.badge} ${lvl.current.name}`;
  if (chip)   chip.style.setProperty('--chip-color', lvl.current.color);
  updateAuthUI(App.user);
}

function updateAuthUI(user) {
  const signinBtn = document.getElementById('auth-signin-btn');
  const userChip  = document.getElementById('auth-user-chip');
  const aucAvatar = document.getElementById('auc-avatar');
  const aucName   = document.getElementById('auc-name');

  const firebaseReady = typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED;
  if (!firebaseReady) return;

  if (user) {
    signinBtn?.setAttribute('hidden', '');
    userChip?.removeAttribute('hidden');
    const name   = user.displayName || user.email || 'User';
    const avatar = (user.displayName || user.email || '?')[0].toUpperCase();
    if (aucAvatar) aucAvatar.textContent = avatar;
    if (aucName)   aucName.textContent   = name.split('@')[0];
  } else {
    signinBtn?.removeAttribute('hidden');
    userChip?.setAttribute('hidden', '');
  }
}

function toggleAuthMenu() {
  const menu = document.getElementById('auth-menu');
  if (!menu) return;
  if (menu.hasAttribute('hidden')) menu.removeAttribute('hidden');
  else menu.setAttribute('hidden', '');
}

function toggleTheme() {
  const html   = document.documentElement;
  const isDark = html.dataset.theme === 'dark';
  const next   = isDark ? 'light' : 'dark';
  html.dataset.theme = next;
  const p = Progress.get();
  p.settings.theme = next;
  Progress.save();

  const path = document.getElementById('theme-icon-path');
  if (path) {
    path.setAttribute('d', next === 'dark'
      ? 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
      : 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
  }
}

function toast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toasts');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

function showXpBurst(amount) {
  const el = document.getElementById('xp-burst');
  if (!el) return;
  el.textContent = `+${amount} XP`;
  el.className = 'xp-burst show';
  setTimeout(() => el.className = 'xp-burst', 1200);
}

function showModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  if (!overlay || !content) return;
  content.innerHTML = html;
  overlay.classList.add('show');
}

function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('show');
}

function handleModalOverlayClick(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function showLevelUp(levelInfo) {
  Audio.levelUp();
  Confetti.burst();
  showModal(`
    <div class="levelup-content">
      <div class="levelup-badge">${levelInfo.current.badge}</div>
      <h2 class="levelup-title">Level Up!</h2>
      <p class="levelup-sub">You are now</p>
      <p class="levelup-name" style="color:${levelInfo.current.color}">${levelInfo.current.name}</p>
      <p class="levelup-level">Level ${levelInfo.current.level}</p>
      <button class="btn btn-primary btn-wide" onclick="closeModal()">Awesome! 🎉</button>
    </div>
  `);
}

function showAchievement(def) {
  Audio.achievement();
  toast(`🏆 Achievement unlocked: ${def.label}`, 'achievement', 4000);
}

function grantXP(amount, showBurst = true) {
  const result = Progress.addXP(amount);
  if (showBurst) showXpBurst(amount);
  if (result.leveledUp) {
    setTimeout(() => showLevelUp(result.newLevelInfo), 600);
  }
  updateNavStats();
  return result;
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════ */
function renderDashboard() {
  const p   = Progress.get();
  const lvl = getLevelInfo(p.xp);
  const hiMastered = Progress.getMasteredCount('hiragana', 'easy');
  const kaMastered = Progress.getMasteredCount('katakana', 'easy');

  const xpToNext = lvl.next ? lvl.next.minXp - p.xp : 0;
  const progressPct = Math.min(100, lvl.progress).toFixed(1);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  const recentAch = ACHIEVEMENTS
    .filter(a => p.achievements.includes(a.id))
    .slice(-4)
    .reverse();

  return `
<div class="dashboard">
  <header class="dash-header">
    <div class="dash-greeting">
      <h1>${greeting}! <span class="wave">👋</span></h1>
      <p class="dash-sub">Continue your Japanese journey</p>
    </div>
    <div class="dash-level-card" style="--level-color:${lvl.current.color}">
      <div class="dlc-badge">${lvl.current.badge}</div>
      <div class="dlc-info">
        <span class="dlc-name">${lvl.current.name}</span>
        <span class="dlc-level">Level ${lvl.current.level}</span>
      </div>
      <div class="dlc-xp">
        <div class="xp-bar-wrap">
          <div class="xp-bar" style="width:${progressPct}%; background:${lvl.current.color}"></div>
        </div>
        <span class="xp-label">${p.xp} XP${lvl.next ? ` · ${xpToNext} to next` : ''}</span>
      </div>
    </div>
  </header>

  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-number">${p.streak}</div>
      <div class="stat-label">🔥 Day Streak</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${hiMastered}</div>
      <div class="stat-label">あ Hiragana</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${kaMastered}</div>
      <div class="stat-label">ア Katakana</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${p.vocabLearned.length}</div>
      <div class="stat-label">📖 Vocab</div>
    </div>
  </div>

  <h2 class="section-title">Featured</h2>
  <div class="module-grid">
    <button class="module-card module-poke" onclick="navigate('/pokemon')">
      <div class="mc-icon">🔴</div>
      <div class="mc-body">
        <h3>Catch-'em Typing Battle</h3>
        <p>Read Pokémon names in katakana &amp; catch them before they flee!</p>
      </div>
      <div class="mc-arrow">→</div>
    </button>
  </div>

  <h2 class="section-title">Practice</h2>
  <div class="module-grid">
    <button class="module-card module-kana-read" onclick="navigate('/kana-reading')">
      <div class="mc-icon">⚡</div>
      <div class="mc-body">
        <h3>Kana Speed</h3>
        <p>Read hiragana &amp; katakana as fast as you can</p>
      </div>
      <div class="mc-arrow">→</div>
    </button>
    <button class="module-card module-kana-write" onclick="navigate('/kana-writing')">
      <div class="mc-icon">✏️</div>
      <div class="mc-body">
        <h3>Kana Writing</h3>
        <p>Practice drawing characters by hand</p>
      </div>
      <div class="mc-arrow">→</div>
    </button>
    <button class="module-card module-vocab" onclick="navigate('/vocabulary')">
      <div class="mc-icon">📖</div>
      <div class="mc-body">
        <h3>Vocabulary</h3>
        <p>Learn nouns through flashcards &amp; quizzes</p>
      </div>
      <div class="mc-arrow">→</div>
    </button>
  </div>

  <h2 class="section-title">Kana Reference</h2>
  ${renderKanaTableSection()}

  ${recentAch.length ? `
  <h2 class="section-title">Recent Achievements</h2>
  <div class="ach-row">
    ${recentAch.map(a => `
      <div class="ach-chip earned" title="${a.desc}">
        <span>${a.icon}</span>
        <span>${a.label}</span>
      </div>
    `).join('')}
  </div>` : ''}
</div>`;
}

/* ─── Kana Reference Table ──────────────────────────────────── */
function kanaMasteryClass(char) {
  const level = Progress.getMasteryLevel(char);
  return `kt-${level}`;
}

function renderKanaGrid(tableData, section, cols) {
  const colClass = `cols${cols}`;
  const colHeaders = cols === 5
    ? `<div class="ktrow">`
      + `<div class="ktcell ktlabel"></div>`
      + ['a','i','u','e','o'].map(v => `<div class="ktcell kthdr">${v}</div>`).join('')
      + `</div>`
    : '';

  const rows = tableData[section].map(r => {
    const cells = r.cells.map(c => c
      ? `<div class="ktcell ${kanaMasteryClass(c[0])}" title="${c[0]} = ${c[1]}">`
          + `<span class="ktchar">${c[0]}</span>`
          + `<span class="ktrom">${c[1]}</span>`
        + `</div>`
      : `<div class="ktcell ktempty"></div>`
    ).join('');
    return `<div class="ktrow">`
      + `<div class="ktcell ktlabel">${r.row}</div>`
      + cells
      + `</div>`;
  }).join('');

  return `<div class="kana-grid ${colClass}">${colHeaders}${rows}</div>`;
}

function renderKanaPanel(type) {
  const data = getKanaTableData(type);
  return `
    <div class="kref-subsection">
      <h4 class="kref-sub-title">Basic (46 characters)</h4>
      ${renderKanaGrid(data, 'basic', 5)}
    </div>
    <div class="kref-subsection">
      <h4 class="kref-sub-title">Voiced &amp; Semi-voiced</h4>
      ${renderKanaGrid(data, 'voiced', 5)}
    </div>
    <div class="kref-subsection">
      <h4 class="kref-sub-title">Combinations (Yōon)</h4>
      ${renderKanaGrid(data, 'combos', 3)}
    </div>
    <div class="mastery-legend">
      <span class="ml-item kg-mastered">Mastered</span>
      <span class="ml-item kg-familiar">Familiar</span>
      <span class="ml-item kg-learning">Learning</span>
      <span class="ml-item kg-struggling">Struggling</span>
      <span class="ml-item kg-unseen">Unseen</span>
    </div>`;
}

function renderKanaTableSection() {
  return `
<div class="kana-ref" id="kana-ref">
  <button class="kana-ref-toggle" onclick="toggleKanaRef(this)" aria-expanded="false">
    <span>📋 Kana Reference Tables</span>
    <span class="kref-chevron">▼</span>
  </button>
  <div class="kref-body" id="kref-body" hidden>
    <div class="kref-tabs" role="tablist">
      <button class="kref-tab active" data-type="hiragana"
        role="tab" aria-selected="true"
        onclick="switchKanaTab('hiragana')">あ Hiragana</button>
      <button class="kref-tab" data-type="katakana"
        role="tab" aria-selected="false"
        onclick="switchKanaTab('katakana')">ア Katakana</button>
    </div>
    <div id="kref-hiragana" class="kref-panel" role="tabpanel">
      ${renderKanaPanel('hiragana')}
    </div>
    <div id="kref-katakana" class="kref-panel" hidden role="tabpanel">
      ${renderKanaPanel('katakana')}
    </div>
  </div>
</div>`;
}

function toggleKanaRef(btn) {
  const body   = document.getElementById('kref-body');
  const chevEl = btn ? btn.querySelector('.kref-chevron') : null;
  if (!body) return;
  const opening = body.hasAttribute('hidden');
  if (opening) {
    body.removeAttribute('hidden');
    btn?.setAttribute('aria-expanded', 'true');
    if (chevEl) chevEl.style.transform = 'rotate(180deg)';
  } else {
    body.setAttribute('hidden', '');
    btn?.setAttribute('aria-expanded', 'false');
    if (chevEl) chevEl.style.transform = '';
  }
}

function switchKanaTab(type) {
  document.querySelectorAll('.kref-tab').forEach(t => {
    const active = t.dataset.type === type;
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', active);
  });
  const hiraPanel = document.getElementById('kref-hiragana');
  const kataPanel = document.getElementById('kref-katakana');
  if (type === 'hiragana') {
    hiraPanel?.removeAttribute('hidden');
    kataPanel?.setAttribute('hidden', '');
  } else {
    kataPanel?.removeAttribute('hidden');
    hiraPanel?.setAttribute('hidden', '');
  }
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 1: KANA READING GAME
═══════════════════════════════════════════════════════════════ */
function renderKanaSetup() {
  return `
<div class="setup-page">
  <button class="back-btn" onclick="navigate('/')">← Back</button>
  <h1 class="page-title">⚡ Kana Speed</h1>
  <p class="page-sub">Type the romaji for each character as fast as you can!</p>

  <div class="setup-card">
    <h3 class="setup-section-title">Character Set</h3>
    <div class="option-group" id="mode-group">
      <button class="option-btn active" data-val="hiragana" onclick="selectOption(this,'mode-group',v=>App.kana.mode=v)">
        <span class="opt-char">あ</span>
        <span>Hiragana</span>
      </button>
      <button class="option-btn" data-val="katakana" onclick="selectOption(this,'mode-group',v=>App.kana.mode=v)">
        <span class="opt-char">ア</span>
        <span>Katakana</span>
      </button>
      <button class="option-btn" data-val="mixed" onclick="selectOption(this,'mode-group',v=>App.kana.mode=v)">
        <span class="opt-char">あア</span>
        <span>Mixed</span>
      </button>
    </div>

    <h3 class="setup-section-title">Difficulty</h3>
    <div class="option-group" id="diff-group">
      <button class="option-btn active" data-val="easy" onclick="selectOption(this,'diff-group',v=>App.kana.difficulty=v)">
        <span class="opt-icon">🌱</span>
        <span>Easy</span>
        <small>Basic kana only</small>
      </button>
      <button class="option-btn" data-val="hard" onclick="selectOption(this,'diff-group',v=>App.kana.difficulty=v)">
        <span class="opt-icon">🔥</span>
        <span>Hard</span>
        <small>All kana incl. dakuten & combos</small>
      </button>
    </div>

    <h3 class="setup-section-title">Time Limit</h3>
    <div class="option-group" id="time-group">
      <button class="option-btn" data-val="30"  onclick="selectOption(this,'time-group',v=>App.kana.timeLimit=+v)">
        <span class="opt-icon">⚡</span>
        <span>30 sec</span>
      </button>
      <button class="option-btn active" data-val="60" onclick="selectOption(this,'time-group',v=>App.kana.timeLimit=+v)">
        <span class="opt-icon">⏱</span>
        <span>60 sec</span>
      </button>
      <button class="option-btn" data-val="120" onclick="selectOption(this,'time-group',v=>App.kana.timeLimit=+v)">
        <span class="opt-icon">🧘</span>
        <span>120 sec</span>
      </button>
    </div>
  </div>

  <button class="btn btn-primary btn-wide btn-xl" onclick="startKanaGame()">
    Start Game ⚡
  </button>
</div>`;
}

function selectOption(el, groupId, setter) {
  document.querySelectorAll(`#${groupId} .option-btn`).forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  setter(el.dataset.val);
  Audio.click();
}

function startKanaGame() {
  const s       = App.kana;
  s.queue       = shuffle(getKanaSet(s.mode, s.difficulty));
  s.score       = 0;
  s.combo       = 0;
  s.maxCombo    = 0;
  s.correct     = 0;
  s.wrong       = 0;
  s.total       = 0;
  s.missed      = [];
  s.correctChars = [];
  s.timeLeft    = s.timeLimit;
  s.playing     = true;
  s.current     = null;
  navigate('/kana-reading/play');
}

function renderKanaGame() {
  const s = App.kana;
  return `
<div class="game-page" id="kana-game-page">
  <div class="game-header">
    <div class="game-stat">
      <span class="gs-label">Score</span>
      <span class="gs-val" id="g-score">0</span>
    </div>
    <div class="timer-wrap">
      <svg class="timer-ring" viewBox="0 0 64 64">
        <circle class="timer-track" cx="32" cy="32" r="28"/>
        <circle class="timer-progress" id="timer-ring-bar" cx="32" cy="32" r="28"
          stroke-dasharray="175.9" stroke-dashoffset="0"/>
      </svg>
      <span class="timer-text" id="g-timer">${s.timeLimit}</span>
    </div>
    <div class="game-stat">
      <span class="gs-label">Combo</span>
      <span class="gs-val combo-val" id="g-combo">×0</span>
    </div>
  </div>

  <div class="kana-display" id="kana-display">
    <div class="kana-char" id="kana-char">?</div>
    <div class="kana-type-tag" id="kana-type-tag"></div>
    <div class="kana-answer-feedback" id="kana-feedback" hidden></div>
  </div>

  <div class="kana-input-row">
    <input
      type="text"
      id="kana-input"
      class="kana-input"
      placeholder="Type romaji and press Enter…"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      onkeydown="handleKanaInput(event)"
    />
  </div>

  <div class="game-footer-stats">
    <span id="g-acc">Accuracy: —</span>
    <span id="g-streak">Best combo: 0</span>
  </div>

  <button class="btn btn-ghost btn-sm" onclick="endKanaGame()">End Game</button>
</div>`;
}

function initKanaGameUI() {
  const s = App.kana;
  s.correctChars = [];  // reset for this session
  nextKanaChar();

  const totalFrames  = s.timeLimit;
  const circumference = 175.9;
  let elapsed = 0;

  s.timer = setInterval(() => {
    s.timeLeft--;
    elapsed++;

    const el = document.getElementById('g-timer');
    if (el) el.textContent = s.timeLeft;

    const bar = document.getElementById('timer-ring-bar');
    if (bar) {
      const offset = (elapsed / totalFrames) * circumference;
      bar.style.strokeDashoffset = offset;
    }

    if (s.timeLeft <= 10) {
      document.getElementById('g-timer')?.classList.add('timer-warning');
      if (s.timeLeft <= 5) Audio.warning();
    }

    if (s.timeLeft <= 0) {
      clearInterval(s.timer);
      endKanaGame();
    }
  }, 1000);

  document.getElementById('kana-input')?.focus();
}

function nextKanaChar() {
  const s = App.kana;
  if (s.queue.length === 0) {
    s.queue = shuffle(getKanaSet(s.mode, s.difficulty));
  }
  s.current = s.queue.pop();

  const charEl = document.getElementById('kana-char');
  const tagEl  = document.getElementById('kana-type-tag');
  if (charEl) {
    charEl.textContent = s.current.char;
    charEl.classList.remove('correct-flash', 'wrong-flash');
    void charEl.offsetWidth;
    charEl.classList.add('pop-in');
    setTimeout(() => charEl.classList.remove('pop-in'), 300);
  }
  if (tagEl) tagEl.textContent = s.current.type === 'hiragana' ? 'Hiragana' : s.current.type === 'katakana' ? 'Katakana' : '';
}

/*
 * handleKanaInput — Enter-only validation.
 *
 * Nothing happens while the user types.
 * On Enter: validate the full typed string, show coloured feedback
 * for 350ms (correct) or 750ms (wrong), then advance.
 *
 * Why Enter-only?
 *   Auto-submit on exact prefix match causes combined kana (gyo, sha,
 *   ryo…) to fire mid-word when a shorter alternative happens to match.
 *   Enter-only lets the user type the full answer at their own pace.
 */
function handleKanaInput(e) {
  const s = App.kana;
  if (!s.current || !s.playing) return;
  if (e.type !== 'keydown' || e.key !== 'Enter') return;

  const input = e.target;
  const val   = input.value.toLowerCase().trim();
  if (!val) return;

  input.value = '';
  const valid = [s.current.romaji, ...(s.current.alts || [])];
  if (valid.includes(val)) {
    submitKanaCorrect();
  } else {
    submitKanaWrong(val);
  }
}

function submitKanaCorrect() {
  const s = App.kana;
  s.correctChars.push(s.current.char);
  s.combo++;
  s.correct++;
  s.total++;
  if (s.combo > s.maxCombo) s.maxCombo = s.combo;
  s.score += Math.round(10 * Math.min(1 + (s.combo - 1) * 0.1, 3));

  Audio.correct();
  if (s.combo >= 5) Audio.combo();
  flashKanaChar('correct');
  showKanaFeedback('correct', `✓ ${s.current.romaji}`);
  updateKanaGameUI();

  setTimeout(() => {
    hideKanaFeedback();
    nextKanaChar();
    document.getElementById('kana-input')?.focus();
  }, 350);
}

function submitKanaWrong(typed) {
  const s = App.kana;
  s.wrong++;
  s.total++;
  s.combo = 0;
  if (s.current && !s.missed.find(m => m.char === s.current.char)) {
    s.missed.push({ char: s.current.char, romaji: s.current.romaji });
  }

  Audio.wrong();
  flashKanaChar('wrong');
  flashInputWrong(document.getElementById('kana-input'));
  showKanaFeedback('wrong', `✗  Answer: ${s.current.romaji}`);
  updateKanaGameUI();

  setTimeout(() => {
    hideKanaFeedback();
    nextKanaChar();
    document.getElementById('kana-input')?.focus();
  }, 750);
}

function showKanaFeedback(type, text) {
  const el = document.getElementById('kana-feedback');
  if (!el) return;
  el.textContent = text;
  el.className   = `kana-answer-feedback kana-feedback-${type}`;
  el.removeAttribute('hidden');
}

function hideKanaFeedback() {
  document.getElementById('kana-feedback')?.setAttribute('hidden', '');
}

function flashInputWrong(input) {
  if (!input) return;
  input.classList.add('input-wrong-flash');
  setTimeout(() => input.classList.remove('input-wrong-flash'), 400);
}

function flashKanaChar(type) {
  const el = document.getElementById('kana-char');
  if (!el) return;
  el.classList.add(`${type}-flash`);
  setTimeout(() => el.classList.remove(`${type}-flash`), 400);
}

function updateKanaGameUI() {
  const s = App.kana;
  const scoreEl = document.getElementById('g-score');
  const comboEl = document.getElementById('g-combo');
  const accEl   = document.getElementById('g-acc');
  const bestEl  = document.getElementById('g-streak');
  if (scoreEl) scoreEl.textContent = s.score;
  if (comboEl) {
    comboEl.textContent = `×${s.combo}`;
    comboEl.className = `gs-val combo-val${s.combo >= 5 ? ' combo-hot' : ''}`;
  }
  if (accEl && s.total > 0) {
    accEl.textContent = `Accuracy: ${Math.round((s.correct / s.total) * 100)}%`;
  }
  if (bestEl) bestEl.textContent = `Best combo: ${s.maxCombo}`;
}

function endKanaGame() {
  const s = App.kana;
  if (s.timer) clearInterval(s.timer);
  s.playing = false;

  const correct  = s.correct;
  const total    = s.total || 1;
  const accuracy = Math.round((correct / total) * 100);

  /*
   * XP formula (conservative — see LEVELS comment in data.js):
   *   2 XP per correct answer  +  1 XP per 2 combo points
   *   +  accuracy bonus: 20 / 10 / 5 / 0 XP
   */
  const accuracyBonus = accuracy >= 95 ? 20 : accuracy >= 85 ? 10 : accuracy >= 70 ? 5 : 0;
  const xpBase        = correct * 2 + Math.floor(s.maxCombo / 2) + accuracyBonus;

  const xpResult = Progress.recordGameSession({
    correctChars: [...s.correctChars],
    kanaResults:  s.missed.map(m => ({ char: m.char })),
    xp:           xpBase,
    score:        s.score,
    maxCombo:     s.maxCombo,
    correct,
    total,
    timeLimit:    s.timeLimit,
  });

  s.results = {
    score:    s.score,
    correct:  s.correct,
    wrong:    s.wrong,
    total,
    accuracy,
    maxCombo: s.maxCombo,
    missed:   s.missed,
    xp:       xpBase,
  };

  navigate('/kana-reading/end');

  setTimeout(() => {
    showXpBurst(xpBase);
    if (xpResult.leveledUp) setTimeout(() => showLevelUp(xpResult.newLevelInfo), 800);
  }, 200);
}

function renderKanaEnd() {
  const r = App.kana.results;
  if (!r) return renderKanaSetup();

  const grade = r.accuracy >= 90 ? { label:'Excellent!', icon:'🌟', color:'#f59e0b' }
              : r.accuracy >= 70 ? { label:'Great!',     icon:'😄', color:'#22c55e' }
              : r.accuracy >= 50 ? { label:'Good!',      icon:'👍', color:'#3b82f6' }
              :                    { label:'Keep Going!', icon:'💪', color:'#8b5cf6' };

  return `
<div class="end-page">
  <div class="end-grade" style="--grade-color:${grade.color}">
    <span class="end-grade-icon">${grade.icon}</span>
    <span class="end-grade-label">${grade.label}</span>
  </div>

  <div class="end-score-big">${r.score}</div>
  <p class="end-score-label">Score</p>

  <div class="end-stats-grid">
    <div class="end-stat">
      <span class="end-stat-val">${r.correct}</span>
      <span class="end-stat-label">Correct</span>
    </div>
    <div class="end-stat">
      <span class="end-stat-val">${r.accuracy}%</span>
      <span class="end-stat-label">Accuracy</span>
    </div>
    <div class="end-stat">
      <span class="end-stat-val">×${r.maxCombo}</span>
      <span class="end-stat-label">Best Combo</span>
    </div>
    <div class="end-stat">
      <span class="end-stat-val end-stat-xp">+${r.xp}</span>
      <span class="end-stat-label">XP Earned</span>
    </div>
  </div>

  ${r.missed.length > 0 ? `
  <div class="missed-section">
    <h3>Review Mistakes (${r.missed.length})</h3>
    <div class="missed-grid">
      ${r.missed.map(m => `
        <div class="missed-card">
          <span class="missed-char">${m.char}</span>
          <span class="missed-romaji">${m.romaji}</span>
        </div>
      `).join('')}
    </div>
  </div>` : `<p class="perfect-msg">No mistakes! Perfect! 🎉</p>`}

  <div class="end-actions">
    <button class="btn btn-primary" onclick="startKanaGame()">Play Again</button>
    <button class="btn btn-secondary" onclick="navigate('/kana-reading')">Change Settings</button>
    <button class="btn btn-ghost" onclick="navigate('/')">Home</button>
  </div>
</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 2: KANA WRITING GAME
═══════════════════════════════════════════════════════════════ */
function renderWriteSetup() {
  return `
<div class="setup-page">
  <button class="back-btn" onclick="navigate('/')">← Back</button>
  <h1 class="page-title">✏️ Kana Writing</h1>
  <p class="page-sub">Practice drawing Japanese characters with mouse or touch.</p>

  <div class="setup-card">
    <h3 class="setup-section-title">Character Set</h3>
    <div class="option-group" id="wmode-group">
      <button class="option-btn active" data-val="hiragana" onclick="selectOption(this,'wmode-group',v=>App.write.mode=v)">
        <span class="opt-char">あ</span>
        <span>Hiragana</span>
      </button>
      <button class="option-btn" data-val="katakana" onclick="selectOption(this,'wmode-group',v=>App.write.mode=v)">
        <span class="opt-char">ア</span>
        <span>Katakana</span>
      </button>
      <button class="option-btn" data-val="mixed" onclick="selectOption(this,'wmode-group',v=>App.write.mode=v)">
        <span class="opt-char">あア</span>
        <span>Mixed</span>
      </button>
    </div>

    <h3 class="setup-section-title">Difficulty</h3>
    <div class="option-group" id="wdiff-group">
      <button class="option-btn active" data-val="easy" onclick="selectOption(this,'wdiff-group',v=>App.write.difficulty=v)">
        <span class="opt-icon">🌱</span>
        <span>Easy</span>
        <small>Basic kana only</small>
      </button>
      <button class="option-btn" data-val="hard" onclick="selectOption(this,'wdiff-group',v=>App.write.difficulty=v)">
        <span class="opt-icon">🔥</span>
        <span>Hard</span>
        <small>All kana</small>
      </button>
    </div>

    <h3 class="setup-section-title">Hint Level</h3>
    <div class="option-group" id="hint-group">
      <button class="option-btn active" data-val="easy" onclick="selectOption(this,'hint-group',v=>App.write.hintLevel=v)">
        <span class="opt-icon">👁</span>
        <span>Guide</span>
        <small>Faded tracing guide</small>
      </button>
      <button class="option-btn" data-val="normal" onclick="selectOption(this,'hint-group',v=>App.write.hintLevel=v)">
        <span class="opt-icon">⏱</span>
        <span>Timed</span>
        <small>Preview for 2 seconds</small>
      </button>
      <button class="option-btn" data-val="hard" onclick="selectOption(this,'hint-group',v=>App.write.hintLevel=v)">
        <span class="opt-icon">🙈</span>
        <span>No Hint</span>
        <small>You're on your own</small>
      </button>
    </div>
  </div>

  <button class="btn btn-primary btn-wide btn-xl" onclick="startWriteGame()">
    Start Writing ✏️
  </button>
</div>`;
}

function startWriteGame() {
  const s   = App.write;
  s.queue   = shuffle(getKanaSet(s.mode, s.difficulty));
  s.correct = 0;
  s.total   = 0;
  s.sessionResults = [];
  s.checked = false;
  navigate('/kana-writing/play');
}

function renderWriteGame() {
  const s = App.write;
  const current = s.current || (s.current = s.queue.pop());
  const progress = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;

  return `
<div class="write-page">
  <div class="write-header">
    <button class="back-btn" onclick="endWriteSession()">✕ End</button>
    <div class="write-progress">
      <span>${s.total} done · ${s.correct} correct</span>
    </div>
    <div class="write-target-wrap">
      <span class="write-prompt">Write this sound:</span>
      <span class="write-target-romaji" id="write-target">${current.romaji}</span>
    </div>
  </div>

  <div class="canvas-wrap" id="canvas-wrap">
    <canvas id="draw-canvas" class="draw-canvas"
      width="360" height="360"></canvas>
    <canvas id="guide-canvas" class="guide-canvas" aria-hidden="true"
      width="360" height="360"></canvas>
    <div class="result-overlay hidden" id="result-overlay">
      <div class="result-char" id="result-char"></div>
      <div class="result-score" id="result-score"></div>
    </div>
  </div>

  <div class="write-controls">
    <button class="btn btn-ghost btn-icon-only" onclick="clearCanvas()" title="Clear">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
        <path d="M3 6h18M19 6l-1 14H6L5 6m5 0V4h4v2"/>
      </svg>
    </button>
    <button class="btn btn-primary" id="check-btn" onclick="checkWriting()">Check ✓</button>
    <button class="btn btn-secondary hidden" id="next-btn" onclick="nextWriteChar()">Next →</button>
  </div>

  <div class="write-hint-hint" id="write-hint-wrap"></div>
</div>`;
}

let drawCtx, guideCtx, drawCanvas, isPointerDown = false;

function initWriteCanvas() {
  const s = App.write;
  drawCanvas = document.getElementById('draw-canvas');
  const guide = document.getElementById('guide-canvas');
  if (!drawCanvas || !guide) return;

  drawCtx  = drawCanvas.getContext('2d');
  guideCtx = guide.getContext('2d');

  const current = s.current || s.queue[s.queue.length - 1];
  s.current = current;
  s.strokes = [];
  s.currentStroke = [];
  s.checked = false;

  setupDrawEvents(drawCanvas);
  drawGuide(current.char, s.hintLevel);
}

function setupDrawEvents(canvas) {
  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const src = e.touches ? e.touches[0] : e;
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top)  * scaleY,
    };
  };

  const start = (e) => {
    e.preventDefault();
    isPointerDown = true;
    App.write.currentStroke = [];
    const pos = getPos(e);
    drawCtx.beginPath();
    drawCtx.moveTo(pos.x, pos.y);
    App.write.currentStroke.push(pos);
  };

  const move = (e) => {
    e.preventDefault();
    if (!isPointerDown) return;
    const pos = getPos(e);
    drawCtx.lineTo(pos.x, pos.y);
    drawCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#3c3c3c';
    drawCtx.lineWidth   = 22;
    drawCtx.lineCap     = 'round';
    drawCtx.lineJoin    = 'round';
    drawCtx.stroke();
    App.write.currentStroke.push(pos);
  };

  const end = (e) => {
    e.preventDefault();
    if (!isPointerDown) return;
    isPointerDown = false;
    if (App.write.currentStroke.length > 0) {
      App.write.strokes.push([...App.write.currentStroke]);
    }
  };

  canvas.addEventListener('mousedown',  start, { passive: false });
  canvas.addEventListener('mousemove',  move,  { passive: false });
  canvas.addEventListener('mouseup',    end,   { passive: false });
  canvas.addEventListener('mouseleave', end,   { passive: false });
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove',  move,  { passive: false });
  canvas.addEventListener('touchend',   end,   { passive: false });
}

/* Largest "bold Npx" font whose rendered width for `text` fits maxWidth.
   Single kana stay big; wide combos (きゃ, しゅ…) shrink to fit the box. */
function fitKanaFont(ctx, text, maxWidth, startPx) {
  let size = startPx;
  ctx.font = `bold ${size}px "Noto Sans JP", serif`;
  while (size > 48 && ctx.measureText(text).width > maxWidth) {
    size -= 6;
    ctx.font = `bold ${size}px "Noto Sans JP", serif`;
  }
  return ctx.font;
}

function drawGuide(char, hintLevel) {
  if (!guideCtx) return;
  guideCtx.clearRect(0, 0, 360, 360);

  if (hintLevel === 'hard') return;

  const draw = () => {
    guideCtx.clearRect(0, 0, 360, 360);
    guideCtx.textAlign    = 'center';
    guideCtx.textBaseline = 'middle';
    guideCtx.font         = fitKanaFont(guideCtx, char, 320, 260);
    guideCtx.fillStyle    = 'rgba(150,150,150,0.25)';
    guideCtx.fillText(char, 180, 190);
  };

  if (hintLevel === 'easy') {
    draw();
  } else if (hintLevel === 'normal') {
    guideCtx.globalAlpha = 0.6;
    draw();
    guideCtx.globalAlpha = 1;
    setTimeout(() => {
      guideCtx.clearRect(0, 0, 360, 360);
    }, 2000);
  }
}

function clearCanvas() {
  if (!drawCtx) return;
  drawCtx.clearRect(0, 0, 360, 360);
  App.write.strokes = [];
  App.write.currentStroke = [];
  const overlay = document.getElementById('result-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function checkWriting() {
  const s = App.write;
  if (s.checked) return;
  s.checked = true;

  if (s.strokes.length === 0) {
    toast('Draw something first!', 'warning');
    s.checked = false;
    return;
  }

  const similarity = compareWithReference(s.current.char);
  const pct = Math.round(similarity * 100);

  let verdict, color;
  if (pct >= 50)      { verdict = 'Great! ✓';       color = '#58cc02'; s.correct++; }
  else if (pct >= 30) { verdict = 'Close!';          color = '#f59e0b'; }
  else                { verdict = 'Keep Practicing'; color = '#ff4b4b'; }

  s.total++;
  s.sessionResults.push({ char: s.current.char, accuracy: pct });
  Progress.recordWriting(s.current.char, pct);

  const overlay   = document.getElementById('result-overlay');
  const charEl    = document.getElementById('result-char');
  const scoreEl   = document.getElementById('result-score');
  const checkBtn  = document.getElementById('check-btn');
  const nextBtn   = document.getElementById('next-btn');

  if (overlay) {
    overlay.classList.remove('hidden');
    overlay.style.borderColor = color;
  }
  if (charEl) {
    charEl.textContent = s.current.char;
    charEl.style.color = color;
  }
  if (scoreEl) scoreEl.innerHTML = `<span style="color:${color}">${verdict}</span><br><small>${pct}% match</small>`;
  if (checkBtn) checkBtn.classList.add('hidden');
  if (nextBtn)  nextBtn.classList.remove('hidden');

  if (pct >= 55) Audio.correct(); else Audio.wrong();

  drawReferenceOverlay(s.current.char);
}

function drawReferenceOverlay(char) {
  if (!guideCtx) return;
  guideCtx.clearRect(0, 0, 360, 360);
  guideCtx.textAlign    = 'center';
  guideCtx.textBaseline = 'middle';
  guideCtx.font         = fitKanaFont(guideCtx, char, 320, 260);
  guideCtx.fillStyle    = 'rgba(88,204,2,0.2)';
  guideCtx.fillText(char, 180, 190);
}

/*
 * compareWithReference — size & position-invariant shape match.
 *
 * Both the user's ink and the reference glyph are cropped to their
 * bounding box and rescaled into the same normalized grid, so writing
 * the character larger, smaller, or off-centre no longer hurts the
 * score.  A small dilation absorbs stroke-width differences between a
 * thick brush stroke and the thinner font outline.  Returns a Dice
 * overlap coefficient in [0,1] (more forgiving than IoU).
 */
function compareWithReference(char) {
  if (!drawCanvas) return 0;
  const W = 360, H = 360, SZ = 64, PAD = 6;

  /* user ink — detected via alpha so it works in light OR dark theme */
  const uData = drawCtx.getImageData(0, 0, W, H).data;
  const uInk  = (x, y) => uData[(y * W + x) * 4 + 3] > 20;
  const uBox  = inkBBox(uInk, W, H);
  if (!uBox) return 0;

  /* reference glyph rendered (fitted) on white, detected via brightness */
  const ref  = document.createElement('canvas'); ref.width = W; ref.height = H;
  const rCtx = ref.getContext('2d');
  rCtx.fillStyle = 'white'; rCtx.fillRect(0, 0, W, H);
  rCtx.textAlign = 'center'; rCtx.textBaseline = 'middle'; rCtx.fillStyle = 'black';
  rCtx.font = fitKanaFont(rCtx, char, 320, 260);
  rCtx.fillText(char, W / 2, H / 2);
  const rData = rCtx.getImageData(0, 0, W, H).data;
  const rInk  = (x, y) => {
    const i = (y * W + x) * 4;
    return (rData[i] + rData[i + 1] + rData[i + 2]) / 3 < 160;
  };
  const rBox = inkBBox(rInk, W, H);
  if (!rBox) return 0;

  let userN = dilate(normalizeMask(uInk, uBox, SZ, PAD), SZ);
  let refN  = dilate(normalizeMask(rInk, rBox, SZ, PAD), SZ);

  let inter = 0, ua = 0, ra = 0;
  for (let k = 0; k < userN.length; k++) {
    if (userN[k] && refN[k]) inter++;
    if (userN[k]) ua++;
    if (refN[k])  ra++;
  }
  return (ua + ra) > 0 ? (2 * inter) / (ua + ra) : 0;
}

/* Bounding box of all "ink" pixels, per the isInk(x,y) predicate. */
function inkBBox(isInk, W, H) {
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (isInk(x, y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { minX, minY, boxW: maxX - minX + 1, boxH: maxY - minY + 1 };
}

/* Crop `box` from the source and rescale (aspect-preserving, centred)
   into an SZ×SZ binary mask. */
function normalizeMask(isInk, box, SZ, PAD) {
  const avail = SZ - 2 * PAD;
  const scale = Math.min(avail / box.boxW, avail / box.boxH);
  const drawW = box.boxW * scale, drawH = box.boxH * scale;
  const offX  = (SZ - drawW) / 2, offY = (SZ - drawH) / 2;
  const out   = new Uint8Array(SZ * SZ);
  for (let ty = 0; ty < SZ; ty++) {
    for (let tx = 0; tx < SZ; tx++) {
      const lx = tx - offX, ly = ty - offY;
      if (lx < 0 || ly < 0 || lx >= drawW || ly >= drawH) continue;
      const sx = (box.minX + lx / scale) | 0;
      const sy = (box.minY + ly / scale) | 0;
      if (isInk(sx, sy)) out[ty * SZ + tx] = 1;
    }
  }
  return out;
}

/* 3×3 dilation — grows each mask by one pixel to bridge stroke-width gaps. */
function dilate(mask, SZ) {
  const out = new Uint8Array(SZ * SZ);
  for (let y = 0; y < SZ; y++) {
    for (let x = 0; x < SZ; x++) {
      let on = 0;
      for (let dy = -1; dy <= 1 && !on; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < SZ && ny < SZ && mask[ny * SZ + nx]) { on = 1; break; }
        }
      }
      out[y * SZ + x] = on;
    }
  }
  return out;
}

function nextWriteChar() {
  const s = App.write;
  if (s.queue.length === 0) {
    s.queue = shuffle(getKanaSet(s.mode, s.difficulty));
  }
  s.current = s.queue.pop();
  s.checked = false;
  s.strokes = [];
  s.currentStroke = [];
  navigate('/kana-writing/play');
}

function endWriteSession() {
  const s = App.write;
  if (s.sessionResults.length > 0) {
    const xpResult = Progress.recordWritingSession(s.sessionResults);
    showXpBurst(xpResult.gained);
  }
  navigate('/');
}

/* ═══════════════════════════════════════════════════════════════
   MODULE 3: VOCABULARY
═══════════════════════════════════════════════════════════════ */
function renderVocabMenu() {
  const p = Progress.get();

  return `
<div class="vocab-menu-page">
  <button class="back-btn" onclick="navigate('/')">← Back</button>
  <h1 class="page-title">📖 Vocabulary</h1>
  <p class="page-sub">Choose a category to study</p>

  <div class="vocab-cat-grid">
    ${VOCAB_CATEGORIES.map(cat => {
      const words = getVocabByCategory(cat.id);
      const learned = words.filter(w => p.vocabLearned.includes(w.id)).length;
      const pct = words.length > 0 ? Math.round((learned / words.length) * 100) : 0;
      return `
      <button class="vocab-cat-card" style="--cat-color:${cat.color}" onclick="selectVocabCategory('${cat.id}')">
        <span class="vcc-emoji">${cat.emoji}</span>
        <span class="vcc-label">${cat.label}</span>
        <span class="vcc-count">${words.length} words</span>
        <div class="vcc-bar-wrap">
          <div class="vcc-bar" style="width:${pct}%; background:${cat.color}"></div>
        </div>
        <span class="vcc-pct">${pct}%</span>
      </button>`;
    }).join('')}
  </div>
</div>`;
}

function selectVocabCategory(catId) {
  App.vocab.category = catId;
  navigate('/vocabulary/mode');
}

function renderVocabModeSelect() {
  return `
<div class="setup-page">
  <button class="back-btn" onclick="navigate('/vocabulary')">← Back</button>
  <h1 class="page-title">
    ${VOCAB_CATEGORIES.find(c=>c.id===App.vocab.category)?.emoji || '📖'}
    ${VOCAB_CATEGORIES.find(c=>c.id===App.vocab.category)?.label || 'Vocabulary'}
  </h1>

  <div class="mode-grid">
    <button class="mode-card" onclick="startVocabMode('learn')">
      <div class="mode-icon">🃏</div>
      <h3>Flashcards</h3>
      <p>Flip cards to learn words</p>
    </button>
    <button class="mode-card" onclick="startVocabMode('quiz')">
      <div class="mode-icon">🎯</div>
      <h3>Quiz</h3>
      <p>Multiple choice</p>
    </button>
    <button class="mode-card" onclick="startVocabMode('type')">
      <div class="mode-icon">⌨️</div>
      <h3>Typing</h3>
      <p>Type the romaji</p>
    </button>
    <button class="mode-card" onclick="startVocabMode('listen')">
      <div class="mode-icon">👂</div>
      <h3>Listening</h3>
      <p>Hear &amp; identify words</p>
    </button>
  </div>
</div>`;
}

function startVocabMode(mode) {
  const s = App.vocab;
  s.mode  = mode;
  s.deck  = shuffle(getVocabByCategory(s.category));
  s.index = 0;
  s.score = 0;
  s.wrong = 0;
  s.total = 0;
  s.flipped = false;
  s.sessionResults = [];

  Progress.markCategoryStudied(s.category);

  const routes = {
    learn:  '/vocabulary/learn',
    quiz:   '/vocabulary/quiz',
    type:   '/vocabulary/type',
    listen: '/vocabulary/listen',
  };
  navigate(routes[mode]);
}

/* ── Flashcards ─────────────────────────────────────────────── */
function renderVocabLearn() {
  const s   = App.vocab;
  const w   = s.deck[s.index];
  if (!w) return renderVocabEnd();

  const progress = Math.round(((s.index) / s.deck.length) * 100);

  return `
<div class="learn-page">
  <div class="learn-header">
    <button class="back-btn" onclick="navigate('/vocabulary')">← Back</button>
    <div class="learn-progress">
      <div class="lp-bar-wrap">
        <div class="lp-bar" style="width:${progress}%"></div>
      </div>
      <span>${s.index + 1} / ${s.deck.length}</span>
    </div>
  </div>

  <div class="flashcard-container" id="fc-container">
    <div class="flashcard ${s.flipped ? 'flipped' : ''}" id="flashcard" onclick="flipCard()">
      <div class="fc-front">
        <div class="fc-emoji">${w.emoji}</div>
        <div class="fc-japanese">${w.japanese}</div>
        <div class="fc-romaji">${w.romaji}</div>
        <div class="fc-tap-hint">Tap to reveal</div>
      </div>
      <div class="fc-back">
        <div class="fc-emoji">${w.emoji}</div>
        <div class="fc-english">${w.english}</div>
        <div class="fc-japanese-small">${w.japanese}</div>
        <button class="fc-audio-btn" onclick="event.stopPropagation(); speakJapanese('${w.japanese}')">
          🔊 Listen
        </button>
      </div>
    </div>
  </div>

  <div class="learn-actions ${s.flipped ? '' : 'hidden'}" id="learn-actions">
    <button class="btn btn-danger" onclick="learnResult(false)">😕 Hard</button>
    <button class="btn btn-success" onclick="learnResult(true)">😊 Easy</button>
  </div>

  <button class="btn btn-ghost btn-sm" onclick="navigate('/vocabulary')">Exit</button>
</div>`;
}

function initFlipCard() {
  App.vocab.flipped = false;
}

function flipCard() {
  Audio.flip();
  App.vocab.flipped = !App.vocab.flipped;
  const card    = document.getElementById('flashcard');
  const actions = document.getElementById('learn-actions');
  if (card)    card.classList.toggle('flipped');
  if (actions) actions.classList.toggle('hidden');
}

function learnResult(correct) {
  const s = App.vocab;
  const w = s.deck[s.index];
  s.total++;
  if (correct) { s.score++; Audio.correct(); } else Audio.wrong();
  Progress.recordVocab(w.id, correct);
  s.sessionResults.push({ id: w.id, correct });
  s.index++;
  s.flipped = false;
  if (s.index >= s.deck.length) {
    const xp = s.score * 3;
    grantXP(xp);
    navigate('/vocabulary');
  } else {
    navigate('/vocabulary/learn');
  }
}

/* ── Quiz ───────────────────────────────────────────────────── */
function renderVocabQuiz() {
  const s = App.vocab;
  const w = s.deck[s.index];
  if (!w) return renderVocabEnd();

  const progress = Math.round((s.index / s.deck.length) * 100);
  const others   = VOCAB.filter(v => v.id !== w.id && v.english !== w.english);
  const distractors = shuffle(others).slice(0, 3);
  const options  = shuffle([w, ...distractors]);

  s._quizAnswer = w.id;

  return `
<div class="quiz-page">
  <div class="quiz-header">
    <button class="back-btn" onclick="navigate('/vocabulary')">← Back</button>
    <div class="quiz-score">Score: ${s.score}/${s.total}</div>
    <div class="lp-bar-wrap" style="max-width:200px">
      <div class="lp-bar" style="width:${progress}%"></div>
    </div>
  </div>

  <div class="quiz-question">
    <p class="quiz-prompt">What does this mean?</p>
    <div class="quiz-word-display">
      <div class="qwd-japanese">${w.japanese}</div>
      <div class="qwd-romaji">${w.romaji}</div>
      <button class="qwd-audio" onclick="speakJapanese('${w.japanese}')">🔊</button>
    </div>
  </div>

  <div class="quiz-options" id="quiz-options">
    ${options.map(opt => `
      <button class="quiz-opt" data-id="${opt.id}" onclick="selectQuizAnswer(this, '${opt.id}')">
        <span class="qopt-emoji">${opt.emoji}</span>
        <span class="qopt-text">${opt.english}</span>
      </button>
    `).join('')}
  </div>

  <button class="btn btn-primary hidden" id="quiz-next" onclick="nextVocabQuestion()">
    Next →
  </button>
</div>`;
}

function attachQuizEvents() {
  // options already have onclick; nothing extra needed
}

function selectQuizAnswer(el, id) {
  const s = App.vocab;
  if (s._quizAnswered) return;
  s._quizAnswered = true;
  s.total++;

  const correct = id === s._quizAnswer;
  if (correct) { s.score++; Audio.correct(); } else Audio.wrong();

  const w = s.deck[s.index];
  Progress.recordVocab(w.id, correct);
  s.sessionResults.push({ id: w.id, correct });

  document.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.id === s._quizAnswer) btn.classList.add('correct');
    else if (btn.dataset.id === id && !correct) btn.classList.add('wrong');
  });

  document.getElementById('quiz-next')?.classList.remove('hidden');
}

function nextVocabQuestion() {
  const s = App.vocab;
  s._quizAnswered = false;
  s.index++;
  if (s.index >= s.deck.length) {
    const xp = s.score * 3;
    grantXP(xp);
    navigate('/vocabulary');
  } else {
    navigate('/vocabulary/quiz');
  }
}

/* ── Typing ─────────────────────────────────────────────────── */
function renderVocabType() {
  const s = App.vocab;
  const w = s.deck[s.index];
  if (!w) return renderVocabEnd();

  const progress = Math.round((s.index / s.deck.length) * 100);

  return `
<div class="type-page">
  <div class="type-header">
    <button class="back-btn" onclick="navigate('/vocabulary')">← Back</button>
    <div class="quiz-score">Score: ${s.score}/${s.total}</div>
    <div class="lp-bar-wrap" style="max-width:200px">
      <div class="lp-bar" style="width:${progress}%"></div>
    </div>
  </div>

  <div class="type-question">
    <p class="type-prompt">Type the romaji for:</p>
    <div class="type-english-display">
      <span class="ted-emoji">${w.emoji}</span>
      <span class="ted-english">${w.english}</span>
    </div>
  </div>

  <div class="type-input-wrap">
    <input
      type="text"
      id="type-input"
      class="type-input"
      placeholder="Type romaji..."
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      oninput="handleTypeInput(event)"
    />
    <div class="type-feedback hidden" id="type-feedback">
      <span id="type-feedback-text"></span>
      <div class="type-correct-ans" id="type-correct-ans"></div>
    </div>
  </div>

  <button class="btn btn-ghost btn-sm" onclick="skipTypeQuestion()">Skip</button>
</div>`;
}

function focusTypeInput() {
  setTimeout(() => document.getElementById('type-input')?.focus(), 100);
}

function handleTypeInput(e) {
  const s   = App.vocab;
  const w   = s.deck[s.index];
  if (s._typeAnswered || !w) return;

  const val = e.target.value.toLowerCase().trim();
  if (val === w.romaji) {
    s._typeAnswered = true;
    s.score++;
    s.total++;
    Audio.correct();
    Progress.recordVocab(w.id, true);
    s.sessionResults.push({ id: w.id, correct: true });

    const fb   = document.getElementById('type-feedback');
    const fbT  = document.getElementById('type-feedback-text');
    const inp  = document.getElementById('type-input');
    if (fb && fbT) {
      fb.classList.remove('hidden');
      fb.className = 'type-feedback type-feedback-correct';
      fbT.textContent = '✓ Correct!';
    }
    if (inp) {
      inp.classList.add('input-correct');
      inp.disabled = true;
    }
    setTimeout(() => nextTypeQuestion(true), 800);
  }
}

function skipTypeQuestion() {
  const s = App.vocab;
  const w = s.deck[s.index];
  if (s._typeAnswered) return;
  s.total++;
  s._typeAnswered = true;
  Audio.wrong();
  Progress.recordVocab(w.id, false);
  s.sessionResults.push({ id: w.id, correct: false });

  const fb  = document.getElementById('type-feedback');
  const fbT = document.getElementById('type-feedback-text');
  const ans = document.getElementById('type-correct-ans');
  if (fb && fbT) {
    fb.classList.remove('hidden');
    fb.className = 'type-feedback type-feedback-wrong';
    fbT.textContent = '✗ Answer:';
  }
  if (ans) ans.textContent = `${w.japanese}  ${w.romaji}`;
  setTimeout(() => nextTypeQuestion(false), 1200);
}

function nextTypeQuestion(wasCorrect) {
  const s = App.vocab;
  s._typeAnswered = false;
  s.index++;
  if (s.index >= s.deck.length) {
    const xp = s.score * 4;
    grantXP(xp);
    navigate('/vocabulary');
  } else {
    navigate('/vocabulary/type');
  }
}

/* ── Listening ──────────────────────────────────────────────── */
function renderVocabListen() {
  const s = App.vocab;
  const w = s.deck[s.index];
  if (!w) return renderVocabEnd();

  const progress = Math.round((s.index / s.deck.length) * 100);
  const others   = VOCAB.filter(v => v.id !== w.id);
  const distractors = shuffle(others).slice(0, 3);
  const options  = shuffle([w, ...distractors]);

  s._listenAnswer  = w.id;
  s._listenAnswered = false;
  s._listenWord    = w;

  return `
<div class="quiz-page">
  <div class="quiz-header">
    <button class="back-btn" onclick="navigate('/vocabulary')">← Back</button>
    <div class="quiz-score">Score: ${s.score}/${s.total}</div>
    <div class="lp-bar-wrap" style="max-width:200px">
      <div class="lp-bar" style="width:${progress}%"></div>
    </div>
  </div>

  <div class="quiz-question">
    <p class="quiz-prompt">Which word do you hear?</p>
    <button class="listen-play-btn" id="listen-play" onclick="playListenWord()">
      🔊 Play Word
    </button>
  </div>

  <div class="quiz-options" id="listen-options">
    ${options.map(opt => `
      <button class="quiz-opt" data-id="${opt.id}" onclick="selectListenAnswer(this,'${opt.id}')">
        <span class="qopt-emoji">${opt.emoji}</span>
        <span class="qopt-text">${opt.english}</span>
      </button>
    `).join('')}
  </div>

  <button class="btn btn-primary hidden" id="listen-next" onclick="nextListenQuestion()">
    Next →
  </button>
</div>`;
}

function attachListenEvents() {
  setTimeout(() => playListenWord(), 400);
}

function playListenWord() {
  const w = App.vocab._listenWord;
  if (w) speakJapanese(w.japanese);
  document.getElementById('listen-play')?.classList.add('playing');
  setTimeout(() => document.getElementById('listen-play')?.classList.remove('playing'), 1500);
}

function selectListenAnswer(el, id) {
  const s = App.vocab;
  if (s._listenAnswered) return;
  s._listenAnswered = true;
  s.total++;

  const correct = id === s._listenAnswer;
  if (correct) { s.score++; Audio.correct(); } else Audio.wrong();

  const w = s.deck[s.index];
  Progress.recordVocab(w.id, correct);
  s.sessionResults.push({ id: w.id, correct });

  document.querySelectorAll('#listen-options .quiz-opt').forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.id === s._listenAnswer) btn.classList.add('correct');
    else if (btn.dataset.id === id && !correct) btn.classList.add('wrong');
  });

  document.getElementById('listen-next')?.classList.remove('hidden');
}

function nextListenQuestion() {
  const s = App.vocab;
  s._listenAnswered = false;
  s.index++;
  if (s.index >= s.deck.length) {
    const xp = s.score * 3;
    grantXP(xp);
    navigate('/vocabulary');
  } else {
    navigate('/vocabulary/listen');
  }
}

function renderVocabEnd() {
  navigate('/vocabulary');
  return '';
}

/* ═══════════════════════════════════════════════════════════════
   PROGRESS PAGE
═══════════════════════════════════════════════════════════════ */
function renderProgress() {
  const p   = Progress.get();
  const lvl = getLevelInfo(p.xp);
  const progressPct = Math.min(100, lvl.progress).toFixed(1);

  /* Legend shared by every kana grid */
  const LEGEND = `
  <div class="mastery-legend">
    <span class="ml-item kg-mastered">Mastered</span>
    <span class="ml-item kg-learning">Occasionally wrong</span>
    <span class="ml-item kg-struggling">Frequently wrong</span>
    <span class="ml-item kg-critical">Consistently wrong</span>
    <span class="ml-item kg-unseen">Unseen</span>
  </div>`;

  const kanaStats = (set, label) => {
    const mastered = set.filter(k => Progress.isMastered(k.char)).length;
    const pct      = Math.round((mastered / set.length) * 100);
    return `
<div class="prog-kana-stat">
  <div class="pks-header">
    <span>${label}</span>
    <span>${mastered}/${set.length} mastered</span>
  </div>
  <div class="lp-bar-wrap">
    <div class="lp-bar prog-bar" data-width="${pct}" style="width:0%"></div>
  </div>
  <div class="pks-grid">
    ${set.map(k => {
      const level = Progress.getMasteryLevel(k.char);
      const acc   = Progress.getKanaAccuracy(k.char);
      return `<div class="kana-grid-cell kg-${level}"
        title="${k.char} = ${k.romaji}${acc !== null ? ` · ${acc}% accuracy` : ''}"
      >${k.char}</div>`;
    }).join('')}
  </div>
  ${LEGEND}
</div>`;
  };

  const vocabPct = Math.round((p.vocabLearned.length / VOCAB.length) * 100);
  const achEarned = p.achievements.length;
  const achTotal  = ACHIEVEMENTS.length;

  return `
<div class="progress-page">
  <button class="back-btn" onclick="navigate('/')">← Back</button>
  <h1 class="page-title">📊 My Progress</h1>

  <div class="prog-level-card" style="--level-color:${lvl.current.color}">
    <div class="plc-badge">${lvl.current.badge}</div>
    <div class="plc-info">
      <h2>${lvl.current.name}</h2>
      <p>Level ${lvl.current.level} · ${p.xp} XP total</p>
      ${lvl.next ? `<p class="plc-next">${lvl.next.minXp - p.xp} XP to ${lvl.next.name}</p>` : '<p>Maximum level!</p>'}
    </div>
    <div class="xp-bar-wrap full">
      <div class="xp-bar prog-bar" data-width="${progressPct}" style="width:0%; background:${lvl.current.color}"></div>
    </div>
  </div>

  <div class="prog-stats-row">
    <div class="prog-stat-card">
      <span class="psc-num">${p.streak}</span>
      <span class="psc-label">🔥 Day Streak</span>
    </div>
    <div class="prog-stat-card">
      <span class="psc-num">${p.gamesPlayed}</span>
      <span class="psc-label">🎮 Games</span>
    </div>
    <div class="prog-stat-card">
      <span class="psc-num">${p.totalCorrectKana}</span>
      <span class="psc-label">✓ Correct</span>
    </div>
    <div class="prog-stat-card">
      <span class="psc-num">${p.totalAnswers > 0 ? Math.round((p.totalCorrectKana/p.totalAnswers)*100) : 0}%</span>
      <span class="psc-label">🎯 Accuracy</span>
    </div>
  </div>

  <h2 class="section-title">Kana Mastery — Hiragana</h2>
  ${kanaStats(HIRAGANA_BASIC,    'Basic (46 characters)')}
  ${kanaStats(HIRAGANA_DAKUTEN,  'Voiced &amp; Semi-voiced (25 characters)')}
  ${kanaStats(HIRAGANA_COMBOS,   'Combinations — Yōon (33 characters)')}

  <h2 class="section-title">Kana Mastery — Katakana</h2>
  ${kanaStats(KATAKANA_BASIC,    'Basic (46 characters)')}
  ${kanaStats(KATAKANA_DAKUTEN,  'Voiced &amp; Semi-voiced (25 characters)')}
  ${kanaStats(KATAKANA_COMBOS,   'Combinations — Yōon (33 characters)')}

  <h2 class="section-title">Vocabulary</h2>
  <div class="vocab-prog-card">
    <div class="vpc-header">
      <span>${p.vocabLearned.length} / ${VOCAB.length} words studied</span>
      <span>${vocabPct}%</span>
    </div>
    <div class="lp-bar-wrap">
      <div class="lp-bar prog-bar" data-width="${vocabPct}" style="width:0%"></div>
    </div>
    <div class="vpc-cats">
      ${VOCAB_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
        const words   = getVocabByCategory(cat.id);
        const learned = words.filter(w => p.vocabLearned.includes(w.id)).length;
        const pct     = Math.round((learned / words.length) * 100);
        return `
        <div class="vpc-cat">
          <span>${cat.emoji} ${cat.label}</span>
          <span>${learned}/${words.length}</span>
          <div class="lp-bar-wrap small">
            <div class="lp-bar prog-bar" data-width="${pct}" style="width:0%; background:${cat.color}"></div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <h2 class="section-title">Achievements (${achEarned}/${achTotal})</h2>
  <div class="achievements-grid">
    ${ACHIEVEMENTS.map(a => {
      const earned = p.achievements.includes(a.id);
      return `
      <div class="ach-card ${earned ? 'earned' : 'locked'}" title="${a.desc}${earned ? '' : ' (locked)'}">
        <span class="ach-icon">${earned ? a.icon : '🔒'}</span>
        <span class="ach-label">${a.label}</span>
        <span class="ach-xp">+${a.xp} XP</span>
      </div>`;
    }).join('')}
  </div>
</div>`;
}

function animateProgressBars() {
  requestAnimationFrame(() => {
    document.querySelectorAll('.prog-bar').forEach(bar => {
      const w = bar.dataset.width;
      bar.style.transition = 'width 0.8s cubic-bezier(0.4,0,0.2,1)';
      bar.style.width = `${w}%`;
    });
  });
}

/* ═══════════════════════════════════════════════════════════════
   PROFILE PAGE
═══════════════════════════════════════════════════════════════ */
function renderProfile() {
  const p    = Progress.get();
  const lvl  = getLevelInfo(p.xp);
  const user = App.user;
  const firebaseReady = typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED;
  const joinDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString() : null;

  return `
<div class="profile-page">
  <button class="back-btn" onclick="navigate('/')">← Back</button>
  <h1 class="page-title">👤 Profile</h1>

  ${user ? `
  <div class="profile-card">
    <div class="profile-avatar-lg">${(user.displayName || user.email || '?')[0].toUpperCase()}</div>
    <div class="profile-details">
      <h2>${user.displayName || 'User'}</h2>
      <p class="profile-email">${user.email}</p>
      ${joinDate ? `<p class="profile-joined">Joined ${joinDate}</p>` : ''}
    </div>
    <button class="btn btn-ghost btn-sm" onclick="handleSignOut()">Log Out</button>
  </div>

  <div class="cloud-status-card success">
    <span class="cs-icon">☁️</span>
    <div class="cs-body">
      <strong>Cloud Sync Active</strong>
      <span>Progress saves automatically after each session.</span>
    </div>
    <button class="btn btn-secondary btn-sm" onclick="syncNow()">Sync Now</button>
  </div>
  ` : firebaseReady ? `
  <div class="cloud-status-card">
    <span class="cs-icon">☁️</span>
    <div class="cs-body">
      <strong>Not signed in</strong>
      <span>Sign in to save your progress to the cloud.</span>
    </div>
    <button class="btn btn-primary btn-sm" onclick="openAuthModal()">Sign In</button>
  </div>
  ` : `
  <div class="cloud-status-card">
    <span class="cs-icon">💾</span>
    <div class="cs-body">
      <strong>Local storage only</strong>
      <span>See README to enable cloud sync with Firebase.</span>
    </div>
  </div>
  `}

  <div class="profile-stats-card">
    <h3>Your Stats</h3>
    <div class="ps-grid">
      <div class="ps-item"><span class="ps-num">${lvl.current.badge} ${lvl.current.name}</span><span>Level ${lvl.current.level}</span></div>
      <div class="ps-item"><span class="ps-num">${p.xp}</span><span>Total XP</span></div>
      <div class="ps-item"><span class="ps-num">${p.streak}</span><span>Day Streak</span></div>
      <div class="ps-item"><span class="ps-num">${p.gamesPlayed}</span><span>Games Played</span></div>
      <div class="ps-item"><span class="ps-num">${p.totalCorrectKana}</span><span>Kana Correct</span></div>
      <div class="ps-item"><span class="ps-num">${p.vocabLearned.length}</span><span>Words Learned</span></div>
      <div class="ps-item"><span class="ps-num">${p.achievements.length}/${ACHIEVEMENTS.length}</span><span>Achievements</span></div>
      <div class="ps-item">
        <span class="ps-num">${p.totalAnswers > 0 ? Math.round((p.totalCorrectKana/p.totalAnswers)*100) : 0}%</span>
        <span>Accuracy</span>
      </div>
    </div>
  </div>
</div>`;
}

/* ═══════════════════════════════════════════════════════════════
   AUTH MODAL
═══════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════
   LOGIN PAGE  (full-screen gate — shown before any games)
═══════════════════════════════════════════════════════════════ */
function renderLogin() {
  const stars = POKEMON.filter(p => p.star);
  return `
<div class="login-page">
  <div class="login-hero">
    <div class="login-pokeball"></div>
    <h1 class="login-title">Koharu <span class="login-poke-tag">Poké</span></h1>
    <p class="login-sub">Log in to start your Japanese training journey</p>
    <div class="login-mascots">
      ${stars.map(p => `
        <div class="login-mascot" style="--mc:${pokeColor(p.el)}" title="${p.name}">
          <span class="lm-emoji">${p.emoji}</span>
          <span class="lm-name">${p.name}</span>
        </div>`).join('')}
    </div>
  </div>

  <div class="login-card">
    <div class="auth-tabs" role="tablist">
      <button class="auth-tab active" data-tab="login"    onclick="switchLoginTab('login')">Log In</button>
      <button class="auth-tab"        data-tab="register" onclick="switchLoginTab('register')">New Trainer</button>
    </div>

    <form id="page-login-form" class="auth-form" onsubmit="handlePageLogin(event)" novalidate>
      <div class="auth-field">
        <label for="page-login-email">Email</label>
        <input type="email" id="page-login-email" autocomplete="email" required placeholder="you@example.com">
      </div>
      <div class="auth-field">
        <label for="page-login-password">Password</label>
        <input type="password" id="page-login-password" autocomplete="current-password" required placeholder="••••••••">
      </div>
      <p class="auth-error" id="page-login-error" hidden></p>
      <button type="submit" class="btn btn-primary btn-wide btn-xl" id="page-login-submit">Log In ⚡</button>
    </form>

    <form id="page-register-form" class="auth-form" onsubmit="handlePageRegister(event)" novalidate hidden>
      <div class="auth-field">
        <label for="page-reg-username">Trainer Name</label>
        <input type="text" id="page-reg-username" autocomplete="username" required
               minlength="3" maxlength="20" placeholder="Ash">
      </div>
      <div class="auth-field">
        <label for="page-reg-email">Email</label>
        <input type="email" id="page-reg-email" autocomplete="email" required placeholder="you@example.com">
      </div>
      <div class="auth-field">
        <label for="page-reg-password">Password <small>(min 6 chars)</small></label>
        <input type="password" id="page-reg-password" autocomplete="new-password" required
               minlength="6" placeholder="••••••••">
      </div>
      <p class="auth-error" id="page-register-error" hidden></p>
      <button type="submit" class="btn btn-primary btn-wide btn-xl" id="page-register-submit">Create Account 🔴</button>
    </form>
  </div>
</div>`;
}

function initLoginUI() {
  document.getElementById('page-login-email')?.focus();
}

function switchLoginTab(tab) {
  document.querySelectorAll('.login-card .auth-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('page-login-form')?.toggleAttribute('hidden', tab !== 'login');
  document.getElementById('page-register-form')?.toggleAttribute('hidden', tab !== 'register');
  clearPageAuthErrors();
}

function clearPageAuthErrors() {
  ['page-login-error','page-register-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.setAttribute('hidden',''); }
  });
}

function showPageAuthError(formType, msg) {
  const el = document.getElementById(`page-${formType}-error`);
  if (!el) return;
  el.textContent = msg;
  el.removeAttribute('hidden');
}

function setPageAuthLoading(formType, loading) {
  const btn = document.getElementById(`page-${formType}-submit`);
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading
    ? (formType === 'login' ? 'Logging in…' : 'Creating account…')
    : (formType === 'login' ? 'Log In ⚡' : 'Create Account 🔴');
}

async function handlePageLogin(e) {
  e.preventDefault();
  clearPageAuthErrors();
  const email    = document.getElementById('page-login-email')?.value.trim();
  const password = document.getElementById('page-login-password')?.value;
  if (!email || !password) return;
  setPageAuthLoading('login', true);
  try {
    await Auth.signIn(email, password);
    /* onAuthStateChanged handles the redirect into the app */
    toast('Welcome back, trainer!', 'success');
  } catch (err) {
    showPageAuthError('login', err.message);
  } finally {
    setPageAuthLoading('login', false);
  }
}

async function handlePageRegister(e) {
  e.preventDefault();
  clearPageAuthErrors();
  const username = document.getElementById('page-reg-username')?.value.trim();
  const email    = document.getElementById('page-reg-email')?.value.trim();
  const password = document.getElementById('page-reg-password')?.value;
  if (!username || !email || !password) return;
  setPageAuthLoading('register', true);
  try {
    await Auth.signUp(email, password, username);
    toast(`Account created — welcome, ${username}!`, 'success');
  } catch (err) {
    showPageAuthError('register', err.message);
  } finally {
    setPageAuthLoading('register', false);
  }
}

/* ═══════════════════════════════════════════════════════════════
   POKÉMON  —  "Catch-'em Typing Battle"
   Read the katakana name and type its reading to catch each Pokémon
   before it flees.  Same XP / combo engine as the kana games.
═══════════════════════════════════════════════════════════════ */
function renderPokeSetup() {
  const stars = POKEMON.filter(p => p.star);
  return `
<div class="setup-page">
  <button class="back-btn" onclick="navigate('/')">← Back</button>
  <h1 class="page-title">🔴 Catch-'em Typing Battle</h1>
  <p class="page-sub">A wild Pokémon appears! Read its katakana name and type the reading to catch it — before it flees.</p>

  <div class="setup-card">
    <div class="poke-howto">
      ${stars.map(p => `
        <div class="poke-howto-item" style="--mc:${pokeColor(p.el)}">
          <span class="phi-emoji">${p.emoji}</span>
          <span class="phi-name">${p.name}</span>
          <span class="phi-rom">→ type "${p.romaji}"</span>
        </div>`).join('')}
    </div>

    <h3 class="setup-section-title">Battle Length</h3>
    <div class="option-group" id="poke-time-group">
      <button class="option-btn" data-val="30"  onclick="selectOption(this,'poke-time-group',v=>App.poke.timeLimit=+v)">
        <span class="opt-icon">⚡</span><span>30 sec</span>
      </button>
      <button class="option-btn active" data-val="60" onclick="selectOption(this,'poke-time-group',v=>App.poke.timeLimit=+v)">
        <span class="opt-icon">⏱</span><span>60 sec</span>
      </button>
      <button class="option-btn" data-val="120" onclick="selectOption(this,'poke-time-group',v=>App.poke.timeLimit=+v)">
        <span class="opt-icon">🧘</span><span>120 sec</span>
      </button>
    </div>
  </div>

  <button class="btn btn-primary btn-wide btn-xl" onclick="startPokeGame()">
    Start Battle 🔴
  </button>
</div>`;
}

function startPokeGame() {
  const s = App.poke;
  s.queue     = getPokemonSet();
  s.score     = 0;
  s.combo     = 0;
  s.maxCombo  = 0;
  s.caught    = 0;
  s.fled      = 0;
  s.total     = 0;
  s.caughtDex = [];
  s.fledList  = [];
  s.timeLeft  = s.timeLimit;
  s.playing   = true;
  s.current   = null;
  navigate('/pokemon/play');
}

function renderPokeGame() {
  const s = App.poke;
  return `
<div class="game-page poke-game" id="poke-game-page">
  <div class="game-header">
    <div class="game-stat">
      <span class="gs-label">Score</span>
      <span class="gs-val" id="pk-score">0</span>
    </div>
    <div class="timer-wrap">
      <svg class="timer-ring" viewBox="0 0 64 64">
        <circle class="timer-track" cx="32" cy="32" r="28"/>
        <circle class="timer-progress" id="pk-timer-ring" cx="32" cy="32" r="28"
          stroke-dasharray="175.9" stroke-dashoffset="0"/>
      </svg>
      <span class="timer-text" id="pk-timer">${s.timeLimit}</span>
    </div>
    <div class="game-stat">
      <span class="gs-label">Combo</span>
      <span class="gs-val combo-val" id="pk-combo">×0</span>
    </div>
  </div>

  <div class="poke-arena" id="poke-arena">
    <div class="poke-card" id="poke-card">
      <div class="poke-emoji" id="poke-emoji">❓</div>
      <div class="poke-name" id="poke-name">？？？</div>
      <div class="poke-el-tag" id="poke-el-tag"></div>
      <div class="poke-flee-bar"><div class="poke-flee-fill" id="poke-flee-fill"></div></div>
      <div class="poke-result-badge" id="poke-result" hidden></div>
    </div>
  </div>

  <div class="kana-input-row">
    <input type="text" id="poke-input" class="kana-input"
      placeholder="Type the reading and press Enter…"
      autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
      onkeydown="handlePokeInput(event)" />
  </div>

  <div class="game-footer-stats">
    <span id="pk-caught">Caught: 0</span>
    <span id="pk-best">Best combo: 0</span>
  </div>

  <button class="btn btn-ghost btn-sm" onclick="endPokeGame()">End Battle</button>
</div>`;
}

function initPokeGameUI() {
  const s = App.poke;
  nextPokemon();

  const circumference = 175.9;
  let elapsed = 0;
  s.timer = setInterval(() => {
    s.timeLeft--;
    elapsed++;
    const el = document.getElementById('pk-timer');
    if (el) el.textContent = s.timeLeft;
    const bar = document.getElementById('pk-timer-ring');
    if (bar) bar.style.strokeDashoffset = (elapsed / s.timeLimit) * circumference;
    if (s.timeLeft <= 10) {
      el?.classList.add('timer-warning');
      if (s.timeLeft <= 5) Audio.warning();
    }
    if (s.timeLeft <= 0) endPokeGame();
  }, 1000);

  document.getElementById('poke-input')?.focus();
}

function nextPokemon() {
  const s = App.poke;
  if (s.fleeTimer) { clearInterval(s.fleeTimer); s.fleeTimer = null; }
  if (s.queue.length === 0) s.queue = getPokemonSet();
  s.current = s.queue.pop();

  /* Fair flee window: longer names get a little more time */
  const fleeMax = 4 + s.current.name.length * 0.6;
  s.fleeLeft = fleeMax;

  const color = pokeColor(s.current.el);
  const card  = document.getElementById('poke-card');
  const emoji = document.getElementById('poke-emoji');
  const name  = document.getElementById('poke-name');
  const tag   = document.getElementById('poke-el-tag');
  const fill  = document.getElementById('poke-flee-fill');

  if (card)  card.style.setProperty('--mc', color);
  if (emoji) { emoji.textContent = s.current.emoji; }
  if (name)  name.textContent  = s.current.name;
  if (tag)   tag.textContent   = s.current.el;
  if (card)  {
    card.classList.remove('caught-flash', 'fled-flash');
    void card.offsetWidth;
    card.classList.add('pop-in');
    setTimeout(() => card.classList.remove('pop-in'), 300);
  }
  if (fill)  { fill.style.transition = 'none'; fill.style.width = '100%'; }

  /* Per-Pokémon flee countdown (100ms ticks) */
  const tick = 0.1;
  s.fleeTimer = setInterval(() => {
    s.fleeLeft -= tick;
    const pct = Math.max(0, (s.fleeLeft / fleeMax) * 100);
    const f = document.getElementById('poke-flee-fill');
    if (f) { f.style.transition = 'width 0.1s linear'; f.style.width = pct + '%'; }
    if (s.fleeLeft <= 0) fleePokemon();
  }, 100);
}

function handlePokeInput(e) {
  const s = App.poke;
  if (!s.current || !s.playing) return;
  if (e.type !== 'keydown' || e.key !== 'Enter') return;

  const input = e.target;
  const val   = input.value.toLowerCase().trim();
  if (!val) return;

  const valid = [s.current.romaji, ...(s.current.alts || [])].map(v => v.toLowerCase());
  if (valid.includes(val)) {
    input.value = '';
    catchPokemon();
  } else {
    /* Wrong guess — let them retry until the Pokémon flees */
    flashInputWrong(input);
    Audio.wrong();
  }
}

function catchPokemon() {
  const s = App.poke;
  if (s.fleeTimer) { clearInterval(s.fleeTimer); s.fleeTimer = null; }
  s.combo++;
  s.caught++;
  s.total++;
  if (s.combo > s.maxCombo) s.maxCombo = s.combo;
  /* Speed bonus: catching with more of the flee bar left scores more */
  const speedBonus = Math.round(s.fleeLeft * 2);
  s.score += Math.round((15 + speedBonus) * Math.min(1 + (s.combo - 1) * 0.1, 3));
  if (!s.caughtDex.find(p => p.name === s.current.name)) s.caughtDex.push(s.current);

  Audio.correct();
  if (s.combo >= 5) Audio.combo();
  showPokeResult('caught', `✓ Caught ${s.current.name}!`);
  flashPokeCard('caught');
  updatePokeUI();

  setTimeout(() => { hidePokeResult(); nextPokemon(); document.getElementById('poke-input')?.focus(); }, 450);
}

function fleePokemon() {
  const s = App.poke;
  if (s.fleeTimer) { clearInterval(s.fleeTimer); s.fleeTimer = null; }
  if (!s.playing) return;
  s.fled++;
  s.total++;
  s.combo = 0;
  if (!s.fledList.find(p => p.name === s.current.name)) s.fledList.push(s.current);

  Audio.wrong();
  showPokeResult('fled', `✗ ${s.current.name} fled!  (${s.current.romaji})`);
  flashPokeCard('fled');
  const inp = document.getElementById('poke-input');
  if (inp) inp.value = '';
  updatePokeUI();

  setTimeout(() => { hidePokeResult(); nextPokemon(); document.getElementById('poke-input')?.focus(); }, 900);
}

function showPokeResult(type, text) {
  const el = document.getElementById('poke-result');
  if (!el) return;
  el.textContent = text;
  el.className = `poke-result-badge poke-result-${type}`;
  el.removeAttribute('hidden');
}
function hidePokeResult() {
  document.getElementById('poke-result')?.setAttribute('hidden', '');
}
function flashPokeCard(type) {
  const el = document.getElementById('poke-card');
  if (!el) return;
  el.classList.add(`${type}-flash`);
  setTimeout(() => el.classList.remove(`${type}-flash`), 500);
}

function updatePokeUI() {
  const s = App.poke;
  const score = document.getElementById('pk-score');
  const combo = document.getElementById('pk-combo');
  const caught = document.getElementById('pk-caught');
  const best  = document.getElementById('pk-best');
  if (score) score.textContent = s.score;
  if (combo) {
    combo.textContent = `×${s.combo}`;
    combo.className = `gs-val combo-val${s.combo >= 5 ? ' combo-hot' : ''}`;
  }
  if (caught) caught.textContent = `Caught: ${s.caught}`;
  if (best)   best.textContent   = `Best combo: ${s.maxCombo}`;
}

/* Unique katakana characters across a list of Pokémon (for mastery tracking) */
function pokeChars(list) {
  const set = new Set();
  list.forEach(p => { for (const ch of p.name) if (ch !== 'ー') set.add(ch); });
  return [...set];
}

function endPokeGame() {
  const s = App.poke;
  if (s.timer)     { clearInterval(s.timer);     s.timer = null; }
  if (s.fleeTimer) { clearInterval(s.fleeTimer); s.fleeTimer = null; }
  s.playing = false;

  const total    = s.total || 1;
  const accuracy = Math.round((s.caught / total) * 100);
  const accuracyBonus = accuracy >= 90 ? 20 : accuracy >= 75 ? 10 : accuracy >= 50 ? 5 : 0;
  const xpBase   = s.caught * 5 + Math.floor(s.maxCombo / 2) + accuracyBonus;

  const xpResult = Progress.recordGameSession({
    correctChars: pokeChars(s.caughtDex),
    kanaResults:  pokeChars(s.fledList).map(char => ({ char })),
    xp:        xpBase,
    score:     s.score,
    maxCombo:  s.maxCombo,
    correct:   s.caught,
    total,
    timeLimit: s.timeLimit,
  });

  s.results = {
    score: s.score, caught: s.caught, fled: s.fled, total,
    accuracy, maxCombo: s.maxCombo,
    caughtDex: [...s.caughtDex], fledList: [...s.fledList], xp: xpBase,
  };

  navigate('/pokemon/end');
  setTimeout(() => {
    showXpBurst(xpBase);
    if (xpResult.leveledUp) setTimeout(() => showLevelUp(xpResult.newLevelInfo), 800);
  }, 200);
}

function renderPokeEnd() {
  const r = App.poke.results;
  if (!r) return renderPokeSetup();

  const grade = r.accuracy >= 90 ? { label:'Pokémon Master!', icon:'🏆', color:'#f59e0b' }
              : r.accuracy >= 70 ? { label:'Gym Leader!',     icon:'🥇', color:'#22c55e' }
              : r.accuracy >= 50 ? { label:'Trainer!',        icon:'🎒', color:'#3b82f6' }
              :                    { label:'Keep Training!',  icon:'💪', color:'#8b5cf6' };

  return `
<div class="end-page">
  <div class="end-grade" style="--grade-color:${grade.color}">
    <span class="end-grade-icon">${grade.icon}</span>
    <span class="end-grade-label">${grade.label}</span>
  </div>

  <div class="end-score-big">${r.score}</div>
  <p class="end-score-label">Score</p>

  <div class="end-stats-grid">
    <div class="end-stat"><span class="end-stat-val">${r.caught}</span><span class="end-stat-label">Caught</span></div>
    <div class="end-stat"><span class="end-stat-val">${r.accuracy}%</span><span class="end-stat-label">Catch Rate</span></div>
    <div class="end-stat"><span class="end-stat-val">×${r.maxCombo}</span><span class="end-stat-label">Best Combo</span></div>
    <div class="end-stat"><span class="end-stat-val end-stat-xp">+${r.xp}</span><span class="end-stat-label">XP Earned</span></div>
  </div>

  ${r.caughtDex.length ? `
  <div class="missed-section">
    <h3>Pokédex — Caught (${r.caughtDex.length})</h3>
    <div class="poke-dex-grid">
      ${r.caughtDex.map(p => `
        <div class="poke-dex-card" style="--mc:${pokeColor(p.el)}">
          <span class="pdc-emoji">${p.emoji}</span>
          <span class="pdc-name">${p.name}</span>
          <span class="pdc-rom">${p.romaji}</span>
        </div>`).join('')}
    </div>
  </div>` : ''}

  ${r.fledList.length ? `
  <div class="missed-section">
    <h3>Got Away (${r.fledList.length})</h3>
    <div class="poke-dex-grid">
      ${r.fledList.map(p => `
        <div class="poke-dex-card fled" style="--mc:${pokeColor(p.el)}">
          <span class="pdc-emoji">${p.emoji}</span>
          <span class="pdc-name">${p.name}</span>
          <span class="pdc-rom">${p.romaji}</span>
        </div>`).join('')}
    </div>
  </div>` : `<p class="perfect-msg">Caught them all! 🎉</p>`}

  <div class="end-actions">
    <button class="btn btn-primary" onclick="startPokeGame()">Battle Again</button>
    <button class="btn btn-secondary" onclick="navigate('/pokemon')">Change Settings</button>
    <button class="btn btn-ghost" onclick="navigate('/')">Home</button>
  </div>
</div>`;
}

function openAuthModal() {
  const overlay = document.getElementById('auth-modal-overlay');
  if (!overlay) return;
  overlay.removeAttribute('hidden');
  document.getElementById('login-email')?.focus();
}

function closeAuthModal() {
  document.getElementById('auth-modal-overlay')?.setAttribute('hidden', '');
  clearAuthErrors();
}

function handleAuthOverlayClick(e) {
  if (e.target === document.getElementById('auth-modal-overlay')) closeAuthModal();
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('auth-login-form')?.toggleAttribute('hidden', tab !== 'login');
  document.getElementById('auth-register-form')?.toggleAttribute('hidden', tab !== 'register');
  clearAuthErrors();
}

function clearAuthErrors() {
  ['login-error','register-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.setAttribute('hidden',''); }
  });
}

function showAuthError(formType, msg) {
  const el = document.getElementById(`${formType}-error`);
  if (!el) return;
  el.textContent = msg;
  el.removeAttribute('hidden');
}

function setAuthLoading(formType, loading) {
  const btn = document.getElementById(`${formType}-submit`);
  if (!btn) return;
  btn.disabled    = loading;
  btn.textContent = loading
    ? (formType === 'login' ? 'Logging in…' : 'Creating account…')
    : (formType === 'login' ? 'Log In' : 'Create Account');
}

async function handleLogin(e) {
  e.preventDefault();
  clearAuthErrors();
  const email    = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  if (!email || !password) return;

  setAuthLoading('login', true);
  try {
    await Auth.signIn(email, password);
    closeAuthModal();
    toast('Signed in! Progress synced.', 'success');
  } catch (err) {
    showAuthError('login', err.message);
  } finally {
    setAuthLoading('login', false);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  clearAuthErrors();
  const username = document.getElementById('reg-username')?.value.trim();
  const email    = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  if (!username || !email || !password) return;

  setAuthLoading('register', true);
  try {
    await Auth.signUp(email, password, username);
    closeAuthModal();
    toast(`Welcome, ${username}! Account created.`, 'success');
  } catch (err) {
    showAuthError('register', err.message);
  } finally {
    setAuthLoading('register', false);
  }
}

async function handleSignOut() {
  await Auth.signOut();
  App.user = null;
  updateNavStats();
  toast('Signed out. Progress still saved locally.', 'info');
  if (App.route === '/profile') navigate('/');
}

async function syncNow() {
  const user = Auth.getCurrentUser();
  if (!user) { toast('Not signed in.', 'warning'); return; }
  const ok = await CloudSync.saveProgress(user.uid, Progress.get());
  toast(ok ? '☁️ Synced to cloud!' : 'Sync failed. Try again.', ok ? 'success' : 'error');
}

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
function init() {
  const p = Progress.get();

  const theme = p.settings?.theme || 'light';
  document.documentElement.dataset.theme = theme;
  const path = document.getElementById('theme-icon-path');
  if (path && theme === 'dark') {
    path.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z');
  }

  Audio.setEnabled(p.settings?.soundEnabled !== false);

  /* Firebase auth — only when enabled */
  if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED) {
    Auth.init();
    Auth.onAuthStateChanged(async (user) => {
      App.user = user;
      updateAuthUI(user);

      if (user) {
        /* Load cloud data and replace local state if available */
        const cloud = await CloudSync.loadProgress(user.uid);
        if (cloud) {
          Progress.loadFromCloud(cloud);
        } else {
          /* First login on this device — migrate localStorage if present */
          const migKey = `koharu_migrated_${user.uid}`;
          if (!localStorage.getItem(migKey)) {
            await CloudSync.migrateFromLocalStorage(user.uid);
          }
        }
        Progress.updateStreak();
        /* Leave the login gate and enter the app */
        if (App.route === '/login') App.route = '/';
      }
      /* Re-render so the login gate opens (sign-in) or closes (sign-out) */
      render();
    });
  }

  Progress.updateStreak();
  render();
}

document.addEventListener('DOMContentLoaded', init);
