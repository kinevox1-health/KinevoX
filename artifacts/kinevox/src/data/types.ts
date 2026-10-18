/**
 * KinevoX — Shared Type Definitions
 *
 * All types used across data files, services, and components.
 * Import from '@/data/types' instead of defining types inline.
 */

/* ── Language ────────────────────────────────────────── */

export type Lang = 'en' | 'ar';
export type Bilingual = Record<Lang, string>;

/* ── User preference types ───────────────────────────── */

export type Goal = 'get-moving' | 'build-strength' | 'feel-mobile';
export type Level = 'new' | 'some';
export type LocationChoice = 'home' | 'outdoors' | 'gym';
export type Equipment = 'none' | 'basic' | 'gym';
export type Safety = 'no' | 'yes' | 'prefer';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate';
export type IntensityPreference = 'gentle' | 'balanced' | 'invigorating';
export type JointFocus = 'general' | 'low-impact' | 'back-friendly';
export type PreferredTime = 'morning' | 'afternoon' | 'evening';

export type Preferences = {
  goal: Goal;
  experience: Level;
  location: LocationChoice;
  equipment: Equipment;
  daysPerWeek: number;
  sessionMinutes: number;
  activityLevel?: ActivityLevel;
  intensity?: IntensityPreference;
  jointFocus?: JointFocus;
  preferredTime?: PreferredTime;
};

/* ── Exercise catalogue ──────────────────────────────── */

export type ExerciseCategory = 'strength' | 'cardio' | 'mobility';

export type Exercise = {
  id: string;
  title: Bilingual;
  instructions: Bilingual;
  category: ExerciseCategory;
  equipment: Equipment;
  /** Estimated duration in minutes (single execution). */
  duration: number;
  difficulty: Level;
  reviewStatus: 'demo-unreviewed' | 'reviewed';
};

/* ── Program structure ───────────────────────────────── */

/**
 * A single exercise within a workout day,
 * with prescribed sets, reps or duration, and rest period.
 */
export type WorkoutExercise = {
  exerciseId: string;
  sets: number;
  /** Repetitions per set. Null for timed exercises. */
  reps: number | null;
  /** Duration in seconds per set. Null for rep-based exercises. */
  durationSeconds: number | null;
  /** Rest period in seconds between sets. */
  restSeconds: number;
  notes?: Bilingual;
};

/** A training or rest day within a program's weekly schedule. */
export type WorkoutDay = {
  /** 0-based index within the program schedule. */
  dayIndex: number;
  title: Bilingual;
  type: 'training' | 'rest';
  workoutExercises: WorkoutExercise[];
};

export type Program = {
  id: string;
  title: Bilingual;
  description: Bilingual;
  goal: Goal;
  level: Level;
  location: LocationChoice[];
  /** Equipment levels sufficient for this program (e.g. ['basic','gym']). */
  equipmentOptions: Equipment[];
  daysPerWeek: number;
  /** Structured daily workouts. */
  weekSchedule: WorkoutDay[];
  /** Flat list of unique exercise IDs (derived from weekSchedule). */
  exercises: string[];
  /** True when the program content has been reviewed and is safe to recommend. */
  reviewed: boolean;
  reviewStatus: 'demo-unreviewed' | 'reviewed';
};

/* ── Session tracking (used from Phase 4 onward) ─────── */

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export type ExerciseResult = {
  exerciseId: string;
  setsCompleted: number;
  setsTotal: number;
  skipped: boolean;
};

export type WorkoutSession = {
  id: string;
  date: string;
  programId: string;
  dayIndex: number;
  dayTitle: Bilingual;
  status: SessionStatus;
  startedAt: string;
  completedAt: string | null;
  exerciseResults: ExerciseResult[];
  /** Actual time spent in minutes. */
  totalMinutes: number;
};

/* ── Active plan ─────────────────────────────────────── */

export type ActivePlan = {
  programId: string;
  createdAt: string;
  preferencesSnapshot: Preferences;
  /** Which workout day the user should do next (0-based). */
  currentDayIndex: number;
};

/* ── Legacy log type (v1 storage format) ─────────────── */

export type WorkoutLog = {
  id: string;
  date: string;
  sessionId: string;
  completed: boolean;
};

/* ── Default preferences ─────────────────────────────── */

export const DEFAULT_PREFERENCES: Preferences = {
  goal: 'get-moving',
  experience: 'new',
  location: 'home',
  equipment: 'none',
  daysPerWeek: 3,
  sessionMinutes: 25,
  activityLevel: 'sedentary',
  intensity: 'gentle',
  jointFocus: 'general',
  preferredTime: 'morning',
};
