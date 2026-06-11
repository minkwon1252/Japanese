'use strict';

/* ─── Persistence ──────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'koharu_progress_v1';

const DEFAULT_STATE = {
  xp: 0,
  level: 1,
  streak: 0,
  lastStudyDate: null,
  kanaCorrect: {},
  kanaTotal: {},
  kanaStreak: {},
  kanaHistory: {},
  writingAccuracy: {},
  vocabLearned: [],
  vocabMastered: [],
  vocabCorrect: {},
  categoriesStudied: [],
  gamesPlayed: 0,
  writingSessionsDone: 0,
  totalCorrectKana: 0,
  totalAnswers: 0,
  achievements: [],
  settings: { theme: 'light', soundEnabled: true },
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...saved,
      settings: { ...DEFAULT_STATE.settings, ...(saved.settings || {}) },
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveProgress(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* quota */ }
}

/* ─── Cloud-save debounce ──────────────────────────────────────────────────── */
let _cloudTimer = null;
function scheduleCloudSave(state) {
  if (typeof Auth === 'undefined' || typeof CloudSync === 'undefined') return;
  clearTimeout(_cloudTimer);
  _cloudTimer = setTimeout(() => {
    const user = Auth.getCurrentUser();
    if (user) CloudSync.saveProgress(user.uid, state).catch(() => {});
  }, 2500);
}

/* ─── Progress Manager ─────────────────────────────────────────────────────── */
const Progress = (() => {
  let state = loadProgress();

  function get()  { return state; }
  function save() { saveProgress(state); scheduleCloudSave(state); }

  /* ── XP & Leveling ──────────────────────────────────────────── */
  function addXP(amount) {
    if (amount <= 0) return { gained:0, totalXp:state.xp, leveledUp:false, newLevelInfo:getLevelInfo(state.xp) };
    const prev = getLevelInfo(state.xp).current.level;
    state.xp  += amount;
    const info = getLevelInfo(state.xp);
    save();
    return { gained:amount, totalXp:state.xp, leveledUp:info.current.level > prev, newLevelInfo:info };
  }

  /* ── Streak ─────────────────────────────────────────────────── */
  function updateStreak() {
    const today = new Date().toDateString();
    if (state.lastStudyDate === today) return state.streak;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    state.streak      = state.lastStudyDate === yesterday ? state.streak + 1 : 1;
    state.lastStudyDate = today;
    save();
    checkStreakAchievements();
    return state.streak;
  }

  /* ── Per-kana tracking ──────────────────────────────────────── */
  function recordKana(char, correct) {
    state.kanaCorrect[char] = (state.kanaCorrect[char] || 0) + (correct ? 1 : 0);
    state.kanaTotal[char]   = (state.kanaTotal[char]   || 0) + 1;
    state.totalAnswers++;
    if (correct) {
      state.totalCorrectKana++;
      state.kanaStreak[char] = (state.kanaStreak[char] || 0) + 1;
    } else {
      state.kanaStreak[char] = 0;
    }
    if (!state.kanaHistory[char]) state.kanaHistory[char] = [];
    state.kanaHistory[char].push(correct ? 'c' : 'w');
    if (state.kanaHistory[char].length > 5) state.kanaHistory[char].shift();
    save();
  }

  /*
   * getMasteryLevel — 5-state performance ladder
   * ─────────────────────────────────────────────────────────────
   *  'unseen'    gray    — never attempted
   *  'mastered'  green   — accuracy ≥ 80%, streak ≥ 3, ≥ 5 attempts
   *  'learning'  yellow  — occasionally wrong  (accuracy ≥ 55%)
   *  'struggling' orange — frequently wrong    (accuracy 30–54%)
   *  'critical'  red     — consistently wrong  (accuracy < 30% OR 4/5 recent wrong)
   */
  function getMasteryLevel(char) {
    const correct = state.kanaCorrect[char] || 0;
    const total   = state.kanaTotal[char]   || 0;
    const streak  = state.kanaStreak[char]  || 0;
    const history = state.kanaHistory[char] || [];
    if (total === 0) return 'unseen';

    const accuracy    = correct / total;
    const recentWrong = history.slice(-5).filter(r => r === 'w').length;

    if (accuracy >= 0.80 && streak >= 3 && total >= 5) return 'mastered';
    if (recentWrong >= 4 || (total >= 5 && accuracy < 0.30)) return 'critical';
    if (recentWrong >= 3 || (total >= 3 && accuracy < 0.55)) return 'struggling';
    return 'learning';
  }

  function getKanaAccuracy(char) {
    const t = state.kanaTotal[char] || 0;
    if (!t) return null;
    return Math.round((state.kanaCorrect[char] / t) * 100);
  }

  function isMastered(char) { return getMasteryLevel(char) === 'mastered'; }

  function getMasteredCount(type, difficulty) {
    return getKanaSet(type, difficulty).filter(k => isMastered(k.char)).length;
  }

  /* ── Writing ────────────────────────────────────────────────── */
  function recordWriting(char, accuracy) {
    state.writingAccuracy[char] = Math.max(state.writingAccuracy[char] || 0, accuracy);
    save();
  }

  /* ── Vocabulary ─────────────────────────────────────────────── */
  function recordVocab(wordId, correct) {
    if (!state.vocabLearned.includes(wordId)) state.vocabLearned.push(wordId);
    state.vocabCorrect[wordId] = (state.vocabCorrect[wordId] || 0) + (correct ? 1 : 0);
    if ((state.vocabCorrect[wordId] || 0) >= 3 && !state.vocabMastered.includes(wordId)) {
      state.vocabMastered.push(wordId);
    }
    save();
    checkVocabAchievements();
  }

  function markCategoryStudied(catId) {
    if (!state.categoriesStudied.includes(catId)) state.categoriesStudied.push(catId);
    save();
    checkVocabAchievements();
  }

  /* ── Game sessions ──────────────────────────────────────────── */
  function recordGameSession(results) {
    state.gamesPlayed++;
    updateStreak();
    (results.correctChars || []).forEach(c => recordKana(c, true));
    (results.kanaResults  || []).forEach(({ char }) => recordKana(char, false));
    const xpResult = addXP(results.xp);
    checkKanaAchievements();
    checkGameAchievements(results);
    return xpResult;
  }

  function recordWritingSession(results) {
    state.writingSessionsDone++;
    updateStreak();
    results.forEach(({ char, accuracy }) => recordWriting(char, accuracy));
    const xp = results.reduce((s, r) => s + (r.accuracy >= 60 ? 3 : 1), 0);
    const xpResult = addXP(xp);
    checkWritingAchievements(results);
    return xpResult;
  }

  /* ── Cloud sync ─────────────────────────────────────────────── */
  /* Replaces in-memory state with cloud data, then caches locally */
  function loadFromCloud(cloudData) {
    state = { ...DEFAULT_STATE, ...cloudData, settings: { ...DEFAULT_STATE.settings, ...(cloudData.settings || {}) } };
    saveProgress(state); // update local cache
  }

  /* ── Achievements ───────────────────────────────────────────── */
  function unlockAchievement(id) {
    if (state.achievements.includes(id)) return false;
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return false;
    state.achievements.push(id);
    addXP(def.xp);
    save();
    return def;
  }

  function checkGameAchievements(r) {
    if (state.gamesPlayed >= 1)                               unlockAchievement('first_game');
    if (r.maxCombo >= 10)                                     unlockAchievement('combo_10');
    if (r.maxCombo >= 20)                                     unlockAchievement('combo_20');
    if (r.total >= 10 && r.correct === r.total)               unlockAchievement('perfect_accuracy');
    if (r.score >= 50 && r.timeLimit === 30)                  unlockAchievement('speed_50');
    checkXpAchievements();
  }

  function checkKanaAchievements() {
    const seen = Object.keys(state.kanaCorrect).filter(c => (state.kanaCorrect[c]||0) > 0).length;
    if (seen >= 10) unlockAchievement('kana_10');
    if (getKanaSet('hiragana','easy').every(k => isMastered(k.char))) unlockAchievement('hiragana_all');
    if (getKanaSet('katakana','easy').every(k => isMastered(k.char))) unlockAchievement('katakana_all');
    if (getKanaSet('mixed',   'easy').every(k => isMastered(k.char))) unlockAchievement('kana_master');
  }

  function checkStreakAchievements() {
    if (state.streak >= 3)  unlockAchievement('streak_3');
    if (state.streak >= 7)  unlockAchievement('streak_7');
    if (state.streak >= 30) unlockAchievement('streak_30');
  }

  function checkWritingAchievements(results) {
    if (state.writingSessionsDone >= 1) unlockAchievement('first_write');
    if (results.filter(r => r.accuracy >= 70).length >= 10) unlockAchievement('write_10');
  }

  function checkVocabAchievements() {
    if (state.vocabLearned.length >= 10) unlockAchievement('vocab_10');
    if (state.vocabLearned.length >= 50) unlockAchievement('vocab_50');
    const all = VOCAB_CATEGORIES.filter(c => c.id !== 'all').map(c => c.id);
    if (all.every(c => state.categoriesStudied.includes(c))) unlockAchievement('vocab_all');
    checkXpAchievements();
  }

  function checkXpAchievements() {
    if (state.xp >= 100)  unlockAchievement('xp_100');
    if (state.xp >= 500)  unlockAchievement('xp_500');
    if (state.xp >= 1000) unlockAchievement('xp_1000');
    if (state.xp >= 5000) unlockAchievement('xp_5000');
  }

  function reset() { state = { ...DEFAULT_STATE }; save(); }

  return {
    get, save, addXP, updateStreak,
    recordKana, getKanaAccuracy, getMasteryLevel, isMastered, getMasteredCount,
    recordWriting, recordVocab, markCategoryStudied,
    recordGameSession, recordWritingSession,
    loadFromCloud,
    unlockAchievement,
    reset,
  };
})();
