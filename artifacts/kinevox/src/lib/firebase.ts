/**
 * KinevoX — Firebase Configuration
 *
 * Initializes Firebase App, Auth, and Firestore safely.
 * Config values are read from Vite environment variables (VITE_FIREBASE_*).
 * If environment variables are missing, the app continues to operate in
 * local-first / guest mode without throwing startup exceptions.
 *
 * Setup Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Authentication (Email/Password, Google, Apple)
 * 3. Create a Cloud Firestore database
 * 4. Copy the web app config into `.env` at artifacts/kinevox/.env
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

export const isFirebaseConfigured: boolean = Boolean(
  apiKey &&
  apiKey !== 'undefined' &&
  apiKey.trim().length > 0 &&
  projectId &&
  projectId !== 'undefined'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);

    if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099');
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
  } catch (err) {
    console.warn('[KinevoX] Failed to initialize Firebase:', err);
    app = null;
    auth = null;
    db = null;
  }
} else {
  console.info('[KinevoX] Firebase not configured — running in local storage mode.');
}

export { app, auth, db };
export default app;
