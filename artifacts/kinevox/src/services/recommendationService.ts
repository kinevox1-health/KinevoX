/**
 * KinevoX — Recommendation Service
 *
 * Matches user preferences against the program library using rule-based
 * criteria. All matching is strictly local and deterministic.
 */

import { programs, getProgramById } from '../data/programs.ts';
import { exercises, getExerciseById } from '../data/exercises.ts';
import type { Preferences, Program, Equipment } from '../data/types.ts';

/**
 * Checks if a user's available equipment satisfies the requirement for an exercise.
 */
export function isEquipmentSufficient(userEquipment: Equipment, requiredEquipment: Equipment): boolean {
  if (userEquipment === 'gym') return true;
  if (userEquipment === 'basic') return requiredEquipment !== 'gym';
  return requiredEquipment === 'none';
}

/**
 * Calculates the estimated session duration for a program in minutes.
 * Uses the sum of individual exercise durations as a conservative estimate.
 */
export function getProgramEstimatedDuration(program: Program): number {
  return program.exercises.reduce((total, id) => {
    const ex = getExerciseById(id);
    return total + (ex?.duration || 0);
  }, 0);
}

/**
 * Evaluates whether a candidate program satisfies the given preferences.
 */
export function programMatchesPreferences(program: Program, pref: Preferences): boolean {
  // 1. Goal must match
  if (program.goal !== pref.goal) return false;

  // 2. Experience level must match
  if (program.level !== pref.experience) return false;

  // 3. Program location must include user's preferred location
  if (!program.location.includes(pref.location)) return false;

  // 4. Program days per week must not exceed user's available days
  if (program.daysPerWeek > pref.daysPerWeek) return false;

  // 5. Estimated session time must fit within user's time window
  const estimatedDuration = getProgramEstimatedDuration(program);
  if (estimatedDuration > pref.sessionMinutes) return false;

  // 6. User equipment must satisfy all exercises in the program
  const equipmentSatisfied = program.exercises.every((id) => {
    const exercise = getExerciseById(id);
    if (!exercise) return false;
    return isEquipmentSufficient(pref.equipment, exercise.equipment);
  });

  return equipmentSatisfied;
}

/**
 * Finds all programs matching the user's preferences.
 */
export function findMatchingPrograms(
  pref: Preferences | null,
  candidatePrograms: Program[] = programs
): Program[] {
  if (!pref) return [];
  return candidatePrograms.filter((program) => programMatchesPreferences(program, pref));
}

/**
 * Returns the best matching program for the user, or null if none match.
 * Preserves the exact signature and behavior of the legacy matchProgram.
 */
export function matchProgram(
  pref: Preferences | null,
  candidatePrograms: Program[] = programs
): Program | null {
  if (!pref) return null;
  const matches = findMatchingPrograms(pref, candidatePrograms);
  return matches.length > 0 ? matches[0] : null;
}

export { getProgramById };
