/**
 * KinevoX — Program Library
 *
 * Each program contains structured workout days with sets, reps,
 * duration, and rest periods. This is the single source of truth
 * for program data.
 *
 * All 5 programs are demonstration content (reviewed as curated demos).
 * Set reviewed = false for any new unfinished programs.
 */

import type { Program, WorkoutDay } from './types.ts';

/** Collect unique exercise IDs from a schedule. */
function deriveExercises(schedule: WorkoutDay[]): string[] {
  const ids = new Set<string>();
  for (const day of schedule) {
    if (day.type === 'training') {
      for (const we of day.workoutExercises) {
        ids.add(we.exerciseId);
      }
    }
  }
  return Array.from(ids);
}

/* ── Helper: timed exercise (no reps) ────────────────── */
function timed(exerciseId: string, minutes: number) {
  return {
    exerciseId,
    sets: 1,
    reps: null,
    durationSeconds: minutes * 60,
    restSeconds: 0,
  };
}

/* ── Helper: rep-based exercise ──────────────────────── */
function reps(exerciseId: string, sets: number, reps: number, restSeconds: number) {
  return {
    exerciseId,
    sets,
    reps,
    durationSeconds: null,
    restSeconds,
  };
}

/* ── Program schedules ───────────────────────────────── */

const steadyStartSchedule: WorkoutDay[] = [
  {
    dayIndex: 0,
    title: { en: 'Full Body A', ar: 'الجسم الكامل أ' },
    type: 'training',
    workoutExercises: [
      timed('walk', 8),
      reps('chair-squat', 2, 10, 45),
      timed('stretch', 5),
    ],
  },
  {
    dayIndex: 1,
    title: { en: 'Upper Body', ar: 'الجزء العلوي' },
    type: 'training',
    workoutExercises: [
      timed('walk', 5),
      reps('wall-push', 2, 8, 45),
      timed('stretch', 5),
    ],
  },
  {
    dayIndex: 2,
    title: { en: 'Full Body B', ar: 'الجسم الكامل ب' },
    type: 'training',
    workoutExercises: [
      timed('walk', 5),
      reps('chair-squat', 2, 10, 45),
      reps('wall-push', 2, 8, 45),
      timed('stretch', 5),
    ],
  },
];

const strengthFoundationsSchedule: WorkoutDay[] = [
  {
    dayIndex: 0,
    title: { en: 'Strength A', ar: 'قوة أ' },
    type: 'training',
    workoutExercises: [
      reps('chair-squat', 3, 10, 60),
      reps('wall-push', 2, 8, 45),
      reps('calf-raise', 2, 12, 30),
    ],
  },
  {
    dayIndex: 1,
    title: { en: 'Strength B', ar: 'قوة ب' },
    type: 'training',
    workoutExercises: [
      reps('chair-squat', 2, 10, 60),
      reps('band-row', 3, 10, 60),
      reps('calf-raise', 2, 12, 30),
    ],
  },
];

const easyMobilitySchedule: WorkoutDay[] = [
  {
    dayIndex: 0,
    title: { en: 'Breathe & Move', ar: 'تنفس وحركة' },
    type: 'training',
    workoutExercises: [
      timed('breath-mobility', 7),
      timed('stretch', 5),
      timed('walk', 8),
    ],
  },
  {
    dayIndex: 1,
    title: { en: 'Walk & Stretch', ar: 'مشي وتمدد' },
    type: 'training',
    workoutExercises: [
      timed('walk', 10),
      timed('breath-mobility', 5),
      timed('stretch', 5),
    ],
  },
  {
    dayIndex: 2,
    title: { en: 'Gentle Flow', ar: 'تدفق لطيف' },
    type: 'training',
    workoutExercises: [
      timed('breath-mobility', 7),
      timed('stretch', 8),
    ],
  },
];

const moveMoreSchedule: WorkoutDay[] = [
  {
    dayIndex: 0,
    title: { en: 'Active Start', ar: 'بداية نشطة' },
    type: 'training',
    workoutExercises: [
      timed('walk', 10),
      reps('chair-squat', 3, 12, 45),
      timed('stretch', 5),
    ],
  },
  {
    dayIndex: 1,
    title: { en: 'March & Move', ar: 'مشي وتحريك' },
    type: 'training',
    workoutExercises: [
      timed('march', 8),
      reps('chair-squat', 2, 12, 45),
      timed('stretch', 5),
    ],
  },
  {
    dayIndex: 2,
    title: { en: 'Full Session', ar: 'جلسة كاملة' },
    type: 'training',
    workoutExercises: [
      timed('walk', 8),
      timed('march', 5),
      reps('chair-squat', 3, 12, 45),
      timed('stretch', 5),
    ],
  },
];

const strongerWeekSchedule: WorkoutDay[] = [
  {
    dayIndex: 0,
    title: { en: 'Push Focus', ar: 'تركيز دفع' },
    type: 'training',
    workoutExercises: [
      reps('chair-squat', 3, 12, 60),
      reps('wall-push', 3, 12, 60),
      reps('band-row', 2, 10, 60),
    ],
  },
  {
    dayIndex: 1,
    title: { en: 'Press Focus', ar: 'تركيز ضغط' },
    type: 'training',
    workoutExercises: [
      reps('dumbbell-press', 3, 8, 90),
      reps('chair-squat', 3, 12, 60),
      reps('band-row', 3, 10, 60),
    ],
  },
  {
    dayIndex: 2,
    title: { en: 'Full Strength', ar: 'قوة شاملة' },
    type: 'training',
    workoutExercises: [
      reps('wall-push', 3, 10, 60),
      reps('dumbbell-press', 3, 8, 90),
      reps('chair-squat', 2, 12, 60),
    ],
  },
];

/* ── Programs ────────────────────────────────────────── */

export const programs: Program[] = [
  {
    id: 'steady-start',
    title: { en: 'The Steady Start', ar: 'بداية متوازنة' },
    description: {
      en: 'A gentle 3-day routine to build the habit of moving regularly.',
      ar: 'روتين لطيف من 3 أيام لبناء عادة الحركة المنتظمة.',
    },
    goal: 'get-moving',
    level: 'new',
    location: ['home', 'outdoors'],
    equipmentOptions: ['none', 'basic', 'gym'],
    daysPerWeek: 3,
    weekSchedule: steadyStartSchedule,
    exercises: deriveExercises(steadyStartSchedule),
    reviewed: true,
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'strength-foundations',
    title: { en: 'Strength Foundations', ar: 'أساسيات القوة' },
    description: {
      en: 'Simple strength movements twice a week, suitable for a home or gym setting.',
      ar: 'حركات قوة بسيطة مرتين أسبوعياً، مناسبة للمنزل أو النادي.',
    },
    goal: 'build-strength',
    level: 'new',
    location: ['home', 'gym'],
    equipmentOptions: ['basic', 'gym'],
    daysPerWeek: 2,
    weekSchedule: strengthFoundationsSchedule,
    exercises: deriveExercises(strengthFoundationsSchedule),
    reviewed: true,
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'easy-mobility',
    title: { en: 'Easy Mobility Flow', ar: 'تدفق مرونة مريح' },
    description: {
      en: 'Gentle breathing and stretching sessions to improve how your body feels.',
      ar: 'جلسات تنفس وتمدد لطيفة لتحسين شعورك بجسمك.',
    },
    goal: 'feel-mobile',
    level: 'new',
    location: ['home', 'outdoors'],
    equipmentOptions: ['none', 'basic', 'gym'],
    daysPerWeek: 3,
    weekSchedule: easyMobilitySchedule,
    exercises: deriveExercises(easyMobilitySchedule),
    reviewed: true,
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'move-more',
    title: { en: 'Move More, Gently', ar: 'حركة أكثر بلطف' },
    description: {
      en: 'For those with some experience who want to move a little more each week.',
      ar: 'لمن لديهم خبرة سابقة ويريدون مزيداً من الحركة كل أسبوع.',
    },
    goal: 'get-moving',
    level: 'some',
    location: ['home', 'outdoors'],
    equipmentOptions: ['none', 'basic', 'gym'],
    daysPerWeek: 3,
    weekSchedule: moveMoreSchedule,
    exercises: deriveExercises(moveMoreSchedule),
    reviewed: true,
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'stronger-week',
    title: { en: 'A Stronger Week', ar: 'أسبوع أكثر قوة' },
    description: {
      en: 'Three strength-focused days with light weights and resistance bands.',
      ar: 'ثلاثة أيام تركز على القوة بأوزان خفيفة وأشرطة مقاومة.',
    },
    goal: 'build-strength',
    level: 'some',
    location: ['home', 'gym'],
    equipmentOptions: ['gym'],
    daysPerWeek: 3,
    weekSchedule: strongerWeekSchedule,
    exercises: deriveExercises(strongerWeekSchedule),
    reviewed: true,
    reviewStatus: 'demo-unreviewed',
  },
];

/** Look up a program by its ID. Returns undefined if not found. */
export function getProgramById(id: string): Program | undefined {
  return programs.find((p) => p.id === id);
}
