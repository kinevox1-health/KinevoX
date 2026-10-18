/**
 * KinevoX — Storage Service
 *
 * Handles client-side persistence in localStorage with schema versioning,
 * backward-compatibility with v1 data, and resilience against corrupt or missing data.
 */

import type {
  Lang,
  Preferences,
  WorkoutLog,
  WorkoutSession,
  ActivePlan,
  SessionStatus,
  ExerciseResult,
} from '../data/types.ts';
import { programs } from '../data/programs.ts';

export const STORAGE_KEY_V1 = 'kinevox-local-v1';
export const STORAGE_KEY_V2 = 'kinevox-local-v2';
export const CURRENT_SCHEMA_VERSION = 2;

export interface KinevoxStorageData {
  schemaVersion: number;
  language: Lang;
  preferences: Preferences | null;
  activePlan: ActivePlan | null;
  logs: WorkoutLog[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
}

export const DEFAULT_STORAGE_DATA: KinevoxStorageData = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  language: 'en',
  preferences: null,
  activePlan: null,
  logs: [],
  sessions: [],
  activeSession: null,
};

/* ── Type guards ─────────────────────────────────────────────── */

export function isPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  const baseValid = (
    ['get-moving', 'build-strength', 'feel-mobile'].includes(String(candidate.goal)) &&
    ['new', 'some'].includes(String(candidate.experience)) &&
    ['home', 'outdoors', 'gym'].includes(String(candidate.location)) &&
    ['none', 'basic', 'gym'].includes(String(candidate.equipment)) &&
    [2, 3, 4, 5].includes(Number(candidate.daysPerWeek)) &&
    [15, 20, 25, 30, 40].includes(Number(candidate.sessionMinutes)) &&
    typeof candidate.daysPerWeek === 'number' &&
    typeof candidate.sessionMinutes === 'number'
  );
  if (!baseValid) return false;
  if (candidate.activityLevel !== undefined && !['sedentary', 'light', 'moderate'].includes(String(candidate.activityLevel))) return false;
  if (candidate.intensity !== undefined && !['gentle', 'balanced', 'invigorating'].includes(String(candidate.intensity))) return false;
  if (candidate.jointFocus !== undefined && !['general', 'low-impact', 'back-friendly'].includes(String(candidate.jointFocus))) return false;
  if (candidate.preferredTime !== undefined && !['morning', 'afternoon', 'evening'].includes(String(candidate.preferredTime))) return false;
  return true;
}

export function isWorkoutLog(value: unknown): value is WorkoutLog {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.date === 'string' &&
    Number.isFinite(Date.parse(candidate.date)) &&
    typeof candidate.sessionId === 'string' &&
    programs.some((p) => p.id === candidate.sessionId) &&
    candidate.completed === true
  );
}

export function isExerciseResult(value: unknown): value is ExerciseResult {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.exerciseId === 'string' &&
    typeof c.setsCompleted === 'number' &&
    typeof c.setsTotal === 'number' &&
    typeof c.skipped === 'boolean'
  );
}

export function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  const validStatus: SessionStatus[] = ['in_progress', 'completed', 'abandoned'];
  return (
    typeof c.id === 'string' &&
    typeof c.date === 'string' &&
    typeof c.programId === 'string' &&
    typeof c.dayIndex === 'number' &&
    validStatus.includes(c.status as SessionStatus) &&
    typeof c.startedAt === 'string' &&
    Array.isArray(c.exerciseResults) &&
    c.exerciseResults.every(isExerciseResult) &&
    typeof c.totalMinutes === 'number'
  );
}

export function isActivePlan(value: unknown): value is ActivePlan {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.programId === 'string' &&
    typeof c.createdAt === 'string' &&
    typeof c.currentDayIndex === 'number' &&
    isPreferences(c.preferencesSnapshot)
  );
}

/* ── Storage reader with automatic migration ─────────────────── */

export function readStoredData(): KinevoxStorageData {
  // 1. Try reading V2 first
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Partial<KinevoxStorageData>;
      return {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        language: parsed.language === 'ar' ? 'ar' : 'en',
        preferences: isPreferences(parsed.preferences) ? parsed.preferences : null,
        activePlan: isActivePlan(parsed.activePlan) ? parsed.activePlan : null,
        logs: Array.isArray(parsed.logs) ? parsed.logs.filter(isWorkoutLog) : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions.filter(isWorkoutSession) : [],
        activeSession: isWorkoutSession(parsed.activeSession) ? parsed.activeSession : null,
      };
    }
  } catch (err) {
    console.warn('[KinevoX] Failed to read v2 storage, attempting v1 migration', err);
  }

  // 2. Try migrating from V1 if V2 does not exist
  try {
    const rawV1 = localStorage.getItem(STORAGE_KEY_V1);
    if (rawV1) {
      const parsedV1 = JSON.parse(rawV1) as {
        language?: Lang;
        preferences?: unknown;
        logs?: unknown[];
      };
      const migrated: KinevoxStorageData = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        language: parsedV1.language === 'ar' ? 'ar' : 'en',
        preferences: isPreferences(parsedV1.preferences) ? parsedV1.preferences : null,
        activePlan: null,
        logs: Array.isArray(parsedV1.logs) ? parsedV1.logs.filter(isWorkoutLog) : [],
        sessions: [],
        activeSession: null,
      };
      // Write to V2 immediately to finish migration
      persistStorageData(migrated);
      return migrated;
    }
  } catch (err) {
    console.warn('[KinevoX] Failed to parse v1 storage', err);
  }

  return { ...DEFAULT_STORAGE_DATA };
}

/* ── Storage writer ──────────────────────────────────────────── */

export function persistStorageData(data: KinevoxStorageData): boolean {
  try {
    const payload = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY_V2, payload);

    // Keep V1 updated with backward-compatible fields so legacy readers don't fail
    const v1Compatibility = {
      language: data.language,
      preferences: data.preferences,
      logs: data.logs,
    };
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(v1Compatibility));
    return true;
  } catch (err) {
    console.error('[KinevoX] Local storage write error:', err);
    return false;
  }
}

/* ── Storage clear ───────────────────────────────────────────── */

export function clearStoredData(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY_V2);
    localStorage.removeItem(STORAGE_KEY_V1);
    return true;
  } catch (err) {
    console.error('[KinevoX] Local storage clear error:', err);
    return false;
  }
}
