'use strict';

/* ─── Persistence ──────────────────────────────────────────────────────────── */
const STORAGE_KEY = 'koharu_progress_v1';

const DEFAULT_STATE = {
  xp: 0,
  level: 1,
  streak: 0,
  lastStudyDate: null,
  kanaCorrect: {},      // char → total correct count
  kanaTotal: {},        // char → total attempts
  kanaStreak: {},       // char → current consecutive-correct streak
  kanaHistory: {},      // char → last 5 results as ['c','w',...]
  writingAccuracy: {},  // char → best accuracy (0-100)
  vocabLearned: [],
  vocabMastered: [],
  vocabCorrect: {},
  categoriesStudied: [],
  gamesPlayed: 0,
  writingSessionsDone: 0,
  totalCorrectKana: 0,
  totalAnswers: 0,
  achievements: [],
  settings: {
    theme: 'light',
    soundEnabled: true,
  },
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    /* Merge with DEFAULT_STATE so new fields are always present */
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

function saveProgress(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — ignore */ }
}

/* ─── Progress Manager ─────────────────────────────────────────────────────── */
const Progress = (() => {
  let state = loadProgress();

  function get()  { return state; }
  function save() { saveProgress(state); }

  /* ── XP & Leveling ──────────────────────────────────────────── */
  function addXP(amount) {
    if (amount <= 0) return { gained: 0, totalXp: state.xp, leveledUp: false, newLevelInfo: getLevelInfo(state.xp) };
    const prevLevel  = getLevelInfo(state.xp).current.level;
    state.xp        += amount;
    const newInfo    = getLevelInfo(state.xp);
    save();
    return {
      gained:      amount,
      totalXp:     state.xp,
      leveledUp:   newInfo.current.level > prevLevel,
      newLevelInfo: newInfo,
    };
  }

  /* ── Streak ─────────────────────────────────────────────────── */
  function updateStreak() {
    const today     = new Date().toDateString();
    if (state.lastStudyDate === today) return state.streak;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    state.streak    = state.lastStudyDate === yesterday ? state.streak + 1 : 1;
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
    /* Rolling history — keep last 5 results */
    if (!state.kanaHistory[char]) state.kanaHistory[char] = [];
    state.kanaHistory[char].push(correct ? 'c' : 'w');
    if (state.kanaHistory[char].length > 5) state.kanaHistory[char].shift();
    save();
  }

  /*
   * getMasteryLevel returns one of:
   *   'unseen'    — never attempted
   *   'struggling'— accuracy < 40 %  OR  ≥ 3 of last 5 wrong
   *   'learning'  — seen < 3 times   OR  accuracy < 65 %
   *   'familiar'  — accuracy ≥ 65 % (but not yet mastered)
   *   'mastered'  — accuracy ≥ 80 %, current streak ≥ 3, total ≥ 5
   */
  function getMasteryLevel(char) {
    const correct  = state.kanaCorrect[char] || 0;
    const total    = state.kanaTotal[char]   || 0;
    const streak   = state.kanaStreak[char]  || 0;
    const history  = state.kanaHistory[char] || [];

    if (total === 0) return 'unseen';

    const accuracy    = correct / total;
    const recentWrong = history.slice(-5).filter(r => r === 'w').length;

    if (recentWrong >= 3 || (total >= 3 && accuracy < 0.40)) return 'struggling';
    if (total < 3 || accuracy < 0.65)                        return 'learning';
    if (accuracy >= 0.80 && streak >= 3 && total >= 5)       return 'mastered';
    return 'familiar';
  }

  function getKanaAccuracy(char) {
    const total = state.kanaTotal[char] || 0;
    if (!total) return null;
    return Math.round((state.kanaCorrect[char] / total) * 100);
  }

  function isMastered(char) {
    return getMasteryLevel(char) === 'mastered';
  }

  function getMasteredCount(type, difficulty) {
    const set = getKanaSet(type, difficulty);
    return set.filter(k => isMastered(k.char)).length;
  }

  /* ── Writing ────────────────────────────────────────────────── */
  function recordWriting(char, accuracy) {
    const prev = state.writingAccuracy[char] || 0;
    state.writingAccuracy[char] = Math.max(prev, accuracy);
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
  /*
   * results shape:
   *   { correctChars: string[],          ← chars answered correctly this game
   *     kanaResults:  [{char, correct}],  ← wrong answers (correct:false)
   *     xp, score, maxCombo, correct, total, timeLimit }
   *
   * correctChars and kanaResults are separate so wrong answers
   * are never double-counted.
   */
  function recordGameSession(results) {
    state.gamesPlayed++;
    updateStreak();
    /* Record each correct char */
    (results.correctChars || []).forEach(char => recordKana(char, true));
    /* Record each wrong char */
    (results.kanaResults || []).forEach(({ char }) => recordKana(char, false));

    const xpResult = addXP(results.xp);
    checkKanaAchievements(results);
    checkGameAchievements(results);
    return xpResult;
  }

  function recordWritingSession(results) {
    state.writingSessionsDone++;
    updateStreak();
    results.forEach(({ char, accuracy }) => recordWriting(char, accuracy));
    /* 3 XP per good character, 1 XP otherwise */
    const xp = results.reduce((sum, r) => sum + (r.accuracy >= 60 ? 3 : 1), 0);
    const xpResult = addXP(xp);
    checkWritingAchievements(results);
    return xpResult;
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

  function checkGameAchievements(results) {
    if (state.gamesPlayed >= 1)                                     unlockAchievement('first_game');
    if (results.maxCombo >= 10)                                     unlockAchievement('combo_10');
    if (results.maxCombo >= 20)                                     unlockAchievement('combo_20');
    if (results.total >= 10 && results.correct === results.total)   unlockAchievement('perfect_accuracy');
    if (results.score >= 50 && results.timeLimit === 30)            unlockAchievement('speed_50');
    checkXpAchievements();
  }

  function checkKanaAchievements() {
    const uniqueSeen = Object.keys(state.kanaCorrect).filter(c => (state.kanaCorrect[c] || 0) > 0).length;
    if (uniqueSeen >= 10) unlockAchievement('kana_10');

    const hiraBasic = getKanaSet('hiragana', 'easy');
    if (hiraBasic.every(k => isMastered(k.char))) unlockAchievement('hiragana_all');

    const kataBasic = getKanaSet('katakana', 'easy');
    if (kataBasic.every(k => isMastered(k.char))) unlockAchievement('katakana_all');

    const allBasic = getKanaSet('mixed', 'easy');
    if (allBasic.every(k => isMastered(k.char))) unlockAchievement('kana_master');
  }

  function checkStreakAchievements() {
    if (state.streak >= 3)  unlockAchievement('streak_3');
    if (state.streak >= 7)  unlockAchievement('streak_7');
    if (state.streak >= 30) unlockAchievement('streak_30');
  }

  function checkWritingAchievements(results) {
    if (state.writingSessionsDone >= 1) unlockAchievement('first_write');
    const goodCount = results.filter(r => r.accuracy >= 70).length;
    if (goodCount >= 10) unlockAchievement('write_10');
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

  function reset() {
    state = { ...DEFAULT_STATE };
    save();
  }

  return {
    get, save, addXP, updateStreak,
    recordKana, getKanaAccuracy, getMasteryLevel, isMastered, getMasteredCount,
    recordWriting, recordVocab, markCategoryStudied,
    recordGameSession, recordWritingSession,
    unlockAchievement,
    reset,
  };
})();
