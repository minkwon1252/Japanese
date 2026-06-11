'use strict';

/* ═══════════════════════════════════════════════════════════════
   AUTH MODULE
   Wraps Firebase Authentication (email/password).
   All methods are no-ops when FIREBASE_ENABLED is false.
═══════════════════════════════════════════════════════════════ */
const Auth = (() => {
  let _auth          = null;
  let _db            = null;
  let _currentUser   = null;
  let _initialized   = false;
  const _callbacks   = [];

  const AUTH_ERRORS = {
    'auth/email-already-in-use':    'An account with this email already exists.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/invalid-credential':      'Incorrect email or password.',
    'auth/too-many-requests':       'Too many attempts. Please try again later.',
    'auth/network-request-failed':  'Network error. Check your connection.',
    'auth/operation-not-allowed':   'Email/password login is not enabled.',
  };

  function friendlyError(code) {
    return AUTH_ERRORS[code] || 'Something went wrong. Please try again.';
  }

  /* ── Initialise ─────────────────────────────────────────────── */
  function init() {
    if (!FIREBASE_ENABLED || _initialized) return;
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }
      _auth = firebase.auth();
      _db   = firebase.firestore();
      _auth.onAuthStateChanged(user => {
        _currentUser = user;
        _callbacks.forEach(cb => { try { cb(user); } catch(e) {} });
      });
      _initialized = true;
    } catch (e) {
      console.warn('[Auth] Firebase init failed:', e.message);
    }
  }

  /* ── Auth operations ────────────────────────────────────────── */
  async function signUp(email, password, username) {
    if (!_auth) throw new Error(FIREBASE_ENABLED ? 'Auth not ready' : 'Firebase not configured');
    const cred = await _auth.createUserWithEmailAndPassword(email, password)
      .catch(e => { throw new Error(friendlyError(e.code)); });
    await cred.user.updateProfile({ displayName: username }).catch(() => {});
    await _db.collection('users').doc(cred.user.uid).set({
      username,
      email,
      joinDate: new Date().toISOString(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }).catch(() => {});
    return cred.user;
  }

  async function signIn(email, password) {
    if (!_auth) throw new Error(FIREBASE_ENABLED ? 'Auth not ready' : 'Firebase not configured');
    const cred = await _auth.signInWithEmailAndPassword(email, password)
      .catch(e => { throw new Error(friendlyError(e.code)); });
    return cred.user;
  }

  async function signOut() {
    if (!_auth) return;
    await _auth.signOut().catch(() => {});
  }

  /* ── Subscriptions ──────────────────────────────────────────── */
  function onAuthStateChanged(callback) {
    _callbacks.push(callback);
    // Immediately fire if state is already known
    if (_currentUser !== null || !FIREBASE_ENABLED) {
      try { callback(_currentUser); } catch(e) {}
    }
  }

  /* ── Getters ────────────────────────────────────────────────── */
  function getCurrentUser()  { return _currentUser; }
  function getFirestore()    { return _db; }
  function isEnabled()       { return FIREBASE_ENABLED && _initialized; }

  return { init, signUp, signIn, signOut, onAuthStateChanged, getCurrentUser, getFirestore, isEnabled };
})();
