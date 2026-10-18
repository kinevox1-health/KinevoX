/**
 * KinevoX — Firestore Sync Service
 *
 * Handles syncing user data between localStorage and Firestore.
 * When a user is authenticated, their data is stored in Firestore
 * under users/{uid}. When offline or not configured, localStorage
 * serves as the single source of truth.
 *
 * Data structure in Firestore:
 *   users/{uid}/
 *     profile: { displayName, email, photoURL, createdAt, updatedAt }
 *     data: { preferences, activePlan, logs, sessions }
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type {
  Preferences,
  ActivePlan,
  WorkoutLog,
  WorkoutSession,
  Lang,
} from '../data/types';

/* ── Types ──────────────────────────────────────────────────── */

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string | null;
  fitnessGoal?: string;
  experienceLevel?: string;
  equipmentAvailable?: string;
  preferredLocation?: string;
  createdAt: unknown; // Firestore Timestamp
  updatedAt: unknown;
}

export interface UserCloudData {
  language: Lang;
  preferences: Preferences | null;
  activePlan: ActivePlan | null;
  logs: WorkoutLog[];
  sessions: WorkoutSession[];
}

/* ── Document references ────────────────────────────────────── */

function requireDb() {
  if (!db) {
    throw new Error('Firestore is not configured. Local data will remain intact.');
  }
  return db;
}

function userProfileRef(uid: string): DocumentReference {
  return doc(requireDb(), 'users', uid, 'profile', 'main');
}

function userDataRef(uid: string): DocumentReference {
  return doc(requireDb(), 'users', uid, 'data', 'main');
}

/* ── Profile operations ─────────────────────────────────────── */

export async function createUserProfile(
  uid: string,
  profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>,
): Promise<void> {
  if (!db) return;
  await setDoc(userProfileRef(uid), {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) return null;
  try {
    const snapshot = await getDoc(userProfileRef(uid));
    const data = snapshot.data();
    return snapshot.exists() && data ? (data as UserProfile) : null;
  } catch (err) {
    console.warn('[KinevoX] Failed to get user profile from Firestore:', err);
    return null;
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Omit<UserProfile, 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  if (!db) return;
  await updateDoc(userProfileRef(uid), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/* ── Data sync operations ───────────────────────────────────── */

export async function saveUserData(
  uid: string,
  data: UserCloudData,
): Promise<void> {
  if (!db) return;
  try {
    await setDoc(userDataRef(uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[KinevoX] Failed to save user data to Firestore:', err);
  }
}

export async function getUserData(uid: string): Promise<UserCloudData | null> {
  if (!db) return null;
  try {
    const snapshot = await getDoc(userDataRef(uid));
    const raw = snapshot.data();
    if (!raw) return null;
    return {
      language: raw.language || 'en',
      preferences: raw.preferences || null,
      activePlan: raw.activePlan || null,
      logs: Array.isArray(raw.logs) ? raw.logs : [],
      sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    };
  } catch (err) {
    console.warn('[KinevoX] Failed to get user data from Firestore:', err);
    return null;
  }
}

/**
 * Merges local data with cloud data on sign-in.
 */
export function mergeLocalAndCloudData(
  local: UserCloudData,
  cloud: UserCloudData | null,
): UserCloudData {
  if (!cloud) {
    return local;
  }

  const allLogIds = new Set<string>();
  const mergedLogs: WorkoutLog[] = [];
  for (const log of [...cloud.logs, ...local.logs]) {
    if (!allLogIds.has(log.id)) {
      allLogIds.add(log.id);
      mergedLogs.push(log);
    }
  }
  mergedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const allSessionIds = new Set<string>();
  const mergedSessions: WorkoutSession[] = [];
  for (const session of [...cloud.sessions, ...local.sessions]) {
    if (!allSessionIds.has(session.id)) {
      allSessionIds.add(session.id);
      mergedSessions.push(session);
    }
  }
  mergedSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    language: cloud.language || local.language,
    preferences: cloud.preferences || local.preferences,
    activePlan: cloud.activePlan || local.activePlan,
    logs: mergedLogs,
    sessions: mergedSessions,
  };
}
