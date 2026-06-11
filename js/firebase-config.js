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

const FIREBASE_CONFIG = {
  apiKey:            'YOUR_API_KEY',
  authDomain:        'YOUR_PROJECT_ID.firebaseapp.com',
  projectId:         'YOUR_PROJECT_ID',
  storageBucket:     'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId:             'YOUR_APP_ID',
};

/*
 * Flip to true after filling in the config above.
 * When false the entire auth/sync layer is dormant — no errors,
 * no network calls, nothing visible to the user.
 */
const FIREBASE_ENABLED = false;
