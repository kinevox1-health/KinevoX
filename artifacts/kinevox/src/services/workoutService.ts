/**
 * KinevoX — Workout Session Service
 *
 * Manages the interactive workout session lifecycle: creation, progress tracking,
 * set completion, exercise skipping, and session completion.
 */

import type { Program, WorkoutDay, WorkoutSession, ExerciseResult } from '../data/types.ts';

/**
 * Creates a new active WorkoutSession from a program and day index.
 */
export function createWorkoutSession(program: Program, dayIndex: number): WorkoutSession {
  const day: WorkoutDay | undefined = program.weekSchedule[dayIndex] || program.weekSchedule[0];
  const dayTitle = day?.title || { en: `Day ${dayIndex + 1}`, ar: `اليوم ${dayIndex + 1}` };

  const exerciseResults: ExerciseResult[] = (day?.workoutExercises || []).map((we) => ({
    exerciseId: we.exerciseId,
    setsCompleted: 0,
    setsTotal: we.sets,
    skipped: false,
  }));

  const now = new Date().toISOString();

  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: now,
    programId: program.id,
    dayIndex: day?.dayIndex ?? dayIndex,
    dayTitle,
    status: 'in_progress',
    startedAt: now,
    completedAt: null,
    exerciseResults,
    totalMinutes: 0,
  };
}

/**
 * Increments the completed set count for an exercise.
 */
export function completeSet(session: WorkoutSession, exerciseId: string): WorkoutSession {
  const updatedResults = session.exerciseResults.map((item) => {
    if (item.exerciseId === exerciseId) {
      const nextCompleted = Math.min(item.setsTotal, item.setsCompleted + 1);
      return {
        ...item,
        setsCompleted: nextCompleted,
        skipped: false,
      };
    }
    return item;
  });

  return {
    ...session,
    exerciseResults: updatedResults,
  };
}

/**
 * Decrements or resets the completed set count for an exercise if needed.
 */
export function undoSet(session: WorkoutSession, exerciseId: string): WorkoutSession {
  const updatedResults = session.exerciseResults.map((item) => {
    if (item.exerciseId === exerciseId) {
      const nextCompleted = Math.max(0, item.setsCompleted - 1);
      return {
        ...item,
        setsCompleted: nextCompleted,
      };
    }
    return item;
  });

  return {
    ...session,
    exerciseResults: updatedResults,
  };
}

/**
 * Marks an exercise as skipped.
 */
export function skipExercise(session: WorkoutSession, exerciseId: string): WorkoutSession {
  const updatedResults = session.exerciseResults.map((item) => {
    if (item.exerciseId === exerciseId) {
      return {
        ...item,
        skipped: true,
      };
    }
    return item;
  });

  return {
    ...session,
    exerciseResults: updatedResults,
  };
}

/**
 * Marks a workout session as successfully completed.
 */
export function finishSession(session: WorkoutSession, elapsedMinutes?: number): WorkoutSession {
  const completedAt = new Date().toISOString();
  let totalMinutes = elapsedMinutes;

  if (totalMinutes === undefined) {
    const startTime = new Date(session.startedAt).getTime();
    const endTime = new Date(completedAt).getTime();
    totalMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));
  }

  return {
    ...session,
    status: 'completed',
    completedAt,
    totalMinutes,
  };
}

/**
 * Abandons a workout session.
 */
export function abandonSession(session: WorkoutSession): WorkoutSession {
  return {
    ...session,
    status: 'abandoned',
    completedAt: new Date().toISOString(),
  };
}

/**
 * Computes the next workout day index in a program cycle.
 */
export function getNextDayIndex(program: Program, currentDayIndex: number): number {
  if (!program.weekSchedule.length) return 0;
  return (currentDayIndex + 1) % program.weekSchedule.length;
}
