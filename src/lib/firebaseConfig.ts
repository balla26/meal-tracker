// Firebase web config is not a secret — it's meant to be public (Google's own docs say
// so). Access control comes entirely from Firestore security rules (see firestore.rules),
// not from hiding these values. That's why this file is safe to commit and deploy as-is.
//
// To connect your own Firebase project:
//   1. https://console.firebase.google.com -> Add project (free, no credit card needed)
//   2. Build > Authentication -> Get started -> enable "Email/Password"
//   3. Build > Firestore Database -> Create database (production mode is fine — the
//      rules in firestore.rules lock it down) -> then Firestore > Rules -> paste the
//      contents of firestore.rules from this project and Publish
//   4. Project settings (gear icon) > General > "Your apps" > Add app > Web (</>)
//   5. Copy the firebaseConfig values it gives you into the object below
//
// Each field can also be overridden with a VITE_FIREBASE_* environment variable
// (handy for local testing against the Firebase emulator) without editing this file.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
}

/** Set VITE_USE_FIREBASE_EMULATOR=true (e.g. in .env.local) to develop against the
 *  local Firebase Emulator Suite instead of your real project. */
export const useFirebaseEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
