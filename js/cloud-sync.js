'use strict';

/* ═══════════════════════════════════════════════════════════════
   CLOUD SYNC MODULE
   Reads and writes progress data to Firestore.
   All operations are safe no-ops when Firebase is disabled.
═══════════════════════════════════════════════════════════════ */
const CloudSync = (() => {
  const COLL_USERS  = 'users';
  const DOC_PROGRESS = 'main';

  function getRef(userId) {
    const db = Auth.getFirestore();
    if (!db || !userId) return null;
    return db.collection(COLL_USERS).doc(userId).collection('progress').doc(DOC_PROGRESS);
  }

  /* ── Save ───────────────────────────────────────────────────── */
  async function saveProgress(userId, data) {
    const ref = getRef(userId);
    if (!ref) return false;
    try {
      /* Strip internal timers / non-serialisable fields */
      const clean = JSON.parse(JSON.stringify(data));
      delete clean._cloudSaveTimer;
      await ref.set(clean, { merge: true });
      return true;
    } catch (e) {
      console.warn('[CloudSync] save failed:', e.message);
      return false;
    }
  }

  /* ── Load ───────────────────────────────────────────────────── */
  async function loadProgress(userId) {
    const ref = getRef(userId);
    if (!ref) return null;
    try {
      const snap = await ref.get();
      return snap.exists ? snap.data() : null;
    } catch (e) {
      console.warn('[CloudSync] load failed:', e.message);
      return null;
    }
  }

  /* ── Migration: localStorage → cloud ───────────────────────── */
  /*
   * Called once per account, on first sign-in on a device that has
   * existing localStorage data.  Progress is merged (additive),
   * so nothing is lost.
   */
  async function migrateFromLocalStorage(userId) {
    const raw = localStorage.getItem('koharu_progress_v1');
    if (!raw) return false;
    try {
      const local = JSON.parse(raw);
      const cloud = await loadProgress(userId);
      const merged = mergeProgressData(local, cloud || {});
      await saveProgress(userId, merged);
      localStorage.setItem(`koharu_migrated_${userId}`, '1');
      console.log('[CloudSync] migration complete for', userId);
      return true;
    } catch (e) {
      console.warn('[CloudSync] migration failed:', e.message);
      return false;
    }
  }

  /* ── Merge logic ────────────────────────────────────────────── */
  /*
   * Merges two progress objects.  Strategy:
   *   - XP / streaks     → take the higher value
   *   - kana counts      → add together (independent sessions)
   *   - vocab arrays     → union (no duplicates)
   *   - achievements     → union
   *   - settings         → prefer cloud (set intentionally on account)
   */
  function mergeProgressData(a, b) {
    return {
      xp:               Math.max(a.xp    || 0, b.xp    || 0),
      streak:           Math.max(a.streak|| 0, b.streak|| 0),
      lastStudyDate:    a.lastStudyDate || b.lastStudyDate || null,

      kanaCorrect:      addObjects(a.kanaCorrect,   b.kanaCorrect),
      kanaTotal:        addObjects(a.kanaTotal,     b.kanaTotal),
      kanaStreak:       maxObjects(a.kanaStreak,    b.kanaStreak),
      kanaHistory:      mergeHistories(a.kanaHistory, b.kanaHistory),
      writingAccuracy:  maxObjects(a.writingAccuracy,b.writingAccuracy),

      vocabLearned:     union(a.vocabLearned,    b.vocabLearned),
      vocabMastered:    union(a.vocabMastered,   b.vocabMastered),
      vocabCorrect:     addObjects(a.vocabCorrect, b.vocabCorrect),
      categoriesStudied:union(a.categoriesStudied,b.categoriesStudied),

      gamesPlayed:          Math.max(a.gamesPlayed         || 0, b.gamesPlayed         || 0),
      writingSessionsDone:  Math.max(a.writingSessionsDone || 0, b.writingSessionsDone || 0),
      totalCorrectKana:    (a.totalCorrectKana  || 0) + (b.totalCorrectKana  || 0),
      totalAnswers:        (a.totalAnswers      || 0) + (b.totalAnswers      || 0),

      achievements: union(a.achievements, b.achievements),
      settings: b.settings || a.settings || {},
    };
  }

  /* helpers */
  function addObjects(a, b) {
    const r = {};
    for (const k of new Set([...Object.keys(a||{}), ...Object.keys(b||{})])) {
      r[k] = ((a||{})[k] || 0) + ((b||{})[k] || 0);
    }
    return r;
  }
  function maxObjects(a, b) {
    const r = {};
    for (const k of new Set([...Object.keys(a||{}), ...Object.keys(b||{})])) {
      r[k] = Math.max(((a||{})[k] || 0), ((b||{})[k] || 0));
    }
    return r;
  }
  function union(a, b) {
    return [...new Set([...(a||[]), ...(b||[])])];
  }
  function mergeHistories(a, b) {
    const keys = new Set([...Object.keys(a||{}), ...Object.keys(b||{})]);
    const r = {};
    keys.forEach(k => {
      /* Prefer the longer history (more data) */
      const ha = (a||{})[k] || [];
      const hb = (b||{})[k] || [];
      r[k] = ha.length >= hb.length ? ha : hb;
    });
    return r;
  }

  return { saveProgress, loadProgress, migrateFromLocalStorage, mergeProgressData };
})();
