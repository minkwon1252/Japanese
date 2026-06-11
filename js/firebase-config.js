'use strict';

/*
 * ═══════════════════════════════════════════════════════════════
 *  FIREBASE CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 *
 *  Cloud sync is OPTIONAL. The app works fully with localStorage
 *  only — you can leave FIREBASE_ENABLED = false forever.
 *
 *  To enable:
 *  1. Go to https://console.firebase.google.com/
 *  2. Create a project (free Spark plan is fine)
 *  3. Add a Web App, copy the config snippet below
 *  4. Enable Auth → Email/Password
 *  5. Create Firestore → Production mode
 *  6. Set Firestore rules (see README)
 *  7. Replace the placeholder values below
 *  8. Set FIREBASE_ENABLED = true
 */

const firebaseConfig = {
  apiKey: "AIzaSyAwAfjdcKQnrPp4fSQvgfb6a3W1f-uYmmc",
  authDomain: "japanese-b6298.firebaseapp.com",
  projectId: "japanese-b6298",
  storageBucket: "japanese-b6298.firebasestorage.app",
  messagingSenderId: "389551796630",
  appId: "1:389551796630:web:815970252de6a8a3feedb7",
  measurementId: "G-LT61YH59FM"
};

/*
 * Flip to true after filling in the config above.
 * When false the entire auth/sync layer is dormant — no errors,
 * no network calls, nothing visible to the user.
 */
const FIREBASE_ENABLED = true;
