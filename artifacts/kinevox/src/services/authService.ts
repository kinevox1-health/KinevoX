/**
 * KinevoX — Auth Service
 *
 * Provides authentication methods using Firebase Auth:
 * - Email/Password registration and login
 * - Google Sign-In
 * - Apple Sign-In
 * - Password reset
 * - Sign out
 * - Auth state observer
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';

function requireAuth() {
  if (!auth) {
    throw new Error('Firebase Auth is not configured. Please add your VITE_FIREBASE_* credentials in .env.');
  }
  return auth;
}

/* ── Providers ──────────────────────────────────────────────── */

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

/* ── Email/Password ─────────────────────────────────────────── */

export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const firebaseAuth = requireAuth();
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  await updateProfile(credential.user, { displayName });
  return credential.user;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const firebaseAuth = requireAuth();
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return credential.user;
}

/* ── Social providers ───────────────────────────────────────── */

export async function signInWithGoogle(): Promise<User> {
  const firebaseAuth = requireAuth();
  const result = await signInWithPopup(firebaseAuth, googleProvider);
  return result.user;
}

export async function signInWithApple(): Promise<User> {
  const firebaseAuth = requireAuth();
  const result = await signInWithPopup(firebaseAuth, appleProvider);
  return result.user;
}

/* ── Password reset ─────────────────────────────────────────── */

export async function resetPassword(email: string): Promise<void> {
  const firebaseAuth = requireAuth();
  await sendPasswordResetEmail(firebaseAuth, email);
}

/* ── Sign out ───────────────────────────────────────────────── */

export async function signOut(): Promise<void> {
  if (!auth) return;
  await firebaseSignOut(auth);
}

/* ── Auth state observer ────────────────────────────────────── */

export function onAuthChange(
  callback: (user: User | null) => void,
): Unsubscribe {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/* ── Current user helper ────────────────────────────────────── */

export function getCurrentUser(): User | null {
  return auth ? auth.currentUser : null;
}
