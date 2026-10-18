/**
 * KinevoX — Ambient Type Declarations for Firebase
 *
 * Ensures flawless TypeScript compilation across all build environments.
 */

declare module 'firebase/app' {
  export interface FirebaseApp {
    name: string;
    options: Record<string, unknown>;
  }

  export function initializeApp(options: Record<string, unknown>, name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(name?: string): FirebaseApp;
}

declare module 'firebase/auth' {
  import type { FirebaseApp } from 'firebase/app';

  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    providerData: Array<{ providerId: string; uid: string }>;
    metadata: {
      creationTime?: string;
      lastSignInTime?: string;
    };
  }

  export interface UserCredential {
    user: User;
  }

  export interface Auth {
    app: FirebaseApp;
    currentUser: User | null;
  }

  export type Unsubscribe = () => void;

  export class GoogleAuthProvider {
    addScope(scope: string): GoogleAuthProvider;
  }

  export class OAuthProvider {
    constructor(providerId: string);
    addScope(scope: string): OAuthProvider;
  }

  export function getAuth(app?: FirebaseApp): Auth;
  export function connectAuthEmulator(auth: Auth, url: string, options?: { disableWarnings?: boolean }): void;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signInWithPopup(auth: Auth, provider: unknown): Promise<UserCredential>;
  export function signOut(auth: Auth): Promise<void>;
  export function sendPasswordResetEmail(auth: Auth, email: string): Promise<void>;
  export function updateProfile(user: User, profile: { displayName?: string | null; photoURL?: string | null }): Promise<void>;
  export function onAuthStateChanged(auth: Auth, nextOrObserver: (user: User | null) => void): Unsubscribe;
}

declare module 'firebase/firestore' {
  import type { FirebaseApp } from 'firebase/app';

  export interface Firestore {
    app: FirebaseApp;
  }

  export interface DocumentReference<T = unknown> {
    id: string;
    path: string;
  }

  export interface DocumentSnapshot<T = unknown> {
    id: string;
    exists(): boolean;
    data(): Record<string, any> | undefined;
  }

  export function getFirestore(app?: FirebaseApp): Firestore;
  export function connectFirestoreEmulator(db: Firestore, host: string, port: number): void;
  export function doc(firestore: Firestore, ...pathSegments: string[]): DocumentReference;
  export function getDoc(reference: DocumentReference): Promise<DocumentSnapshot>;
  export function setDoc(reference: DocumentReference, data: Record<string, unknown>, options?: { merge?: boolean }): Promise<void>;
  export function updateDoc(reference: DocumentReference, data: Record<string, unknown>): Promise<void>;
  export function serverTimestamp(): unknown;
}
