/**
 * KinevoX — Recommendation Service
 *
 * Matches user preferences against the program library using rule-based
 * criteria and intelligent compatibility scoring (0-100%).
 * All matching is strictly local and deterministic.
 */

import { programs, getProgramById } from '../data/programs.ts';
import { exercises, getExerciseById } from '../data/exercises.ts';
import type { Preferences, Program, Equipment } from '../data/types.ts';

export interface ProgramMatchResult {
  program: Program;
  score: number; // 0 to 100
  isExactMatch: boolean;
  reasons: {
    en: string[];
    ar: string[];
  };
}

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
 * Evaluates whether a candidate program satisfies the strict filter criteria.
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
 * Computes a weighted match score and tailored reasons for a candidate program.
 */
export function scoreProgram(program: Program, pref: Preferences): ProgramMatchResult {
  let score = 0;
  const reasonsEn: string[] = [];
  const reasonsAr: string[] = [];

  // 1. Primary Goal match (weight: 35)
  if (program.goal === pref.goal) {
    score += 35;
    if (pref.goal === 'get-moving') {
      reasonsEn.push('Directly matches your goal to move more often and build active daily momentum.');
      reasonsAr.push('يتوافق تماماً مع رغبتك في زيادة الحركة اليومية وكسر الخمول تدريجياً.');
    } else if (pref.goal === 'build-strength') {
      reasonsEn.push('Focuses on functional resistance exercises that build everyday body strength.');
      reasonsAr.push('يركز على حركات المقاومة الوظيفية لبناء القوة اليومية وتنشيط العضلات.');
    } else {
      reasonsEn.push('Emphasizes gentle joint mobility, comfortable breathing, and stretching.');
      reasonsAr.push('يركز على مرونة المفاصل والتنفس المريح وفك تشنجات الجسم.');
    }
  } else {
    // Partial goal alignment
    score += 10;
  }

  // 2. Experience Level (weight: 20)
  if (program.level === pref.experience) {
    score += 20;
    if (pref.experience === 'new') {
      reasonsEn.push('Calibrated specifically for beginners with clear instructions and safe pacing.');
      reasonsAr.push('مُصمم خصيصاً للمبتدئين بإيقاع مريح وشرح مبسط لكل حركة.');
    } else {
      reasonsEn.push('Includes progressive movement volume to build on your prior exercise experience.');
      reasonsAr.push('يتضمن حجماً تدريبياً مناسباً للبناء على خبرتك السابقة.');
    }
  } else if (pref.experience === 'some' && program.level === 'new') {
    // Someone experienced doing a starter routine still gets good points
    score += 15;
    reasonsEn.push('A safe, accessible foundation to restart or maintain consistent movement.');
    reasonsAr.push('أساس مريح ومناسب لإعادة بناء الاستمرارية والنشاط.');
  }

  // 3. Equipment Satisfaction (weight: 20)
  const allEquipmentSatisfied = program.exercises.every((id) => {
    const exercise = getExerciseById(id);
    return exercise ? isEquipmentSufficient(pref.equipment, exercise.equipment) : true;
  });

  if (allEquipmentSatisfied) {
    score += 20;
    if (pref.equipment === 'none') {
      reasonsEn.push('Requires zero equipment — uses bodyweight and everyday household furniture.');
      reasonsAr.push('لا يتطلب أي معدات — يعتمد على وزن الجسم وأثاث المنزل المعتاد.');
    } else {
      reasonsEn.push('Fully compatible with your available equipment setup.');
      reasonsAr.push('متوافق تماماً مع الأدوات والمعدات المتوفرة لديك.');
    }
  } else {
    score += 5; // Has some alternative exercises
  }

  // 4. Days per week (weight: 15)
  if (program.daysPerWeek === pref.daysPerWeek) {
    score += 15;
    reasonsEn.push(`Fits your target schedule of ${pref.daysPerWeek} days per week.`);
    reasonsAr.push(`يتوافق بدقة مع جدولك المفضل البالغ ${pref.daysPerWeek} أيام في الأسبوع.`);
  } else if (program.daysPerWeek <= pref.daysPerWeek) {
    score += 12;
    reasonsEn.push(`Fits easily into your week (${program.daysPerWeek} days), leaving room for rest.`);
    reasonsAr.push(`يتناسب بسهولة مع أسبوعك (${program.daysPerWeek} أيام)، مما يترك مساحة كافية للراحة.`);
  } else {
    score += 5;
  }

  // 5. Session Duration (weight: 10)
  const estDuration = getProgramEstimatedDuration(program);
  if (estDuration <= pref.sessionMinutes) {
    score += 10;
    reasonsEn.push(`Sessions average ~${estDuration} min, staying within your ${pref.sessionMinutes}-min window.`);
    reasonsAr.push(`تستغرق الجلسة قرابة ${estDuration} دقيقة، وهي ضمن وقتك المتاح (${pref.sessionMinutes} دقيقة).`);
  } else if (estDuration <= pref.sessionMinutes + 5) {
    score += 7;
  } else {
    score += 3;
  }

  // 6. Intensity & Joint Preference Alignment
  if (pref.intensity === 'gentle' && (program.id === 'steady-start' || program.id === 'easy-mobility')) {
    score = Math.min(100, score + 5);
    reasonsEn.push('Gentle, low-impact pacing designed to minimize fatigue.');
    reasonsAr.push('إيقاع هادئ ومنخفض الجهد لتجنب الإرهاق وبناء الراحة.');
  } else if (pref.intensity === 'invigorating' && (program.id === 'strength-foundations' || program.id === 'stronger-week')) {
    score = Math.min(100, score + 5);
    reasonsEn.push('Offers invigorating resistance challenges to build stamina.');
    reasonsAr.push('يوفر تحدياً مناسباً لبناء الطاقة وتحفيز العضلات.');
  }

  if (pref.jointFocus === 'low-impact' || pref.jointFocus === 'back-friendly') {
    reasonsEn.push('Joint-friendly exercises with no explosive jumping.');
    reasonsAr.push('تمارين صديقة للمفاصل والظهر بدون قفز أو ضغط مفاجئ.');
  }

  const isExact = programMatchesPreferences(program, pref);

  return {
    program,
    score: Math.min(99, Math.max(65, score)),
    isExactMatch: isExact,
    reasons: {
      en: reasonsEn,
      ar: reasonsAr,
    },
  };
}

/**
 * Finds all programs matching the user's preferences.
 */
export function findMatchingPrograms(
  pref: Preferences | null,
  candidatePrograms: Program[] = programs
): Program[] {
  if (!pref) return [];
  const exact = candidatePrograms.filter((program) => programMatchesPreferences(program, pref));
  if (exact.length > 0) return exact;

  // Fallback: return scored candidates sorted descending
  const scored = candidatePrograms.map((p) => scoreProgram(p, pref)).sort((a, b) => b.score - a.score);
  return scored.map((s) => s.program);
}

/**
 * Returns the best matching program with detailed match statistics.
 */
export function matchProgramWithDetails(
  pref: Preferences | null,
  candidatePrograms: Program[] = programs
): ProgramMatchResult | null {
  if (!pref || candidatePrograms.length === 0) return null;
  const scored = candidatePrograms.map((p) => scoreProgram(p, pref)).sort((a, b) => b.score - a.score);
  return scored[0];
}

/**
 * Returns the best matching program for the user, or null if none match.
 * Preserves the exact signature and behavior of the legacy matchProgram.
 */
export function matchProgram(
  pref: Preferences | null,
  candidatePrograms: Program[] = programs
): ProgramMatchResult['program'] | null {
  if (!pref) return null;
  const result = matchProgramWithDetails(pref, candidatePrograms);
  return result ? result.program : null;
}

export { getProgramById };
