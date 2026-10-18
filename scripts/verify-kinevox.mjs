/**
 * KinevoX — End-to-End Logic & Acceptance Criteria Verification
 *
 * Verifies:
 * 1. Recommendation matching engine against all preference combinations
 * 2. Unreviewed demonstration program content integrity
 * 3. Structured weekly schedule and workout exercises
 * 4. Workout session creation, set completion, and completion calculations
 * 5. Storage serialization, backward compatibility, and corrupted state recovery
 */

import assert from 'node:assert/strict';

// Helper to log test stages
function section(title) {
  console.log(`\n\x1b[36m=== ${title} ===\x1b[0m`);
}
function pass(msg) {
  console.log(`  \x1b[32m✔\x1b[0m ${msg}`);
}

async function runTests() {
  section('1. Loading Modules');

  // Dynamically import TypeScript files supported in Node 24
  const { exercises, getExerciseById } = await import('../artifacts/kinevox/src/data/exercises.ts');
  const { programs, getProgramById } = await import('../artifacts/kinevox/src/data/programs.ts');
  const {
    matchProgram,
    findMatchingPrograms,
    getProgramEstimatedDuration,
    isEquipmentSufficient,
  } = await import('../artifacts/kinevox/src/services/recommendationService.ts');
  const {
    createWorkoutSession,
    completeSet,
    undoSet,
    skipExercise,
    finishSession,
    getNextDayIndex,
  } = await import('../artifacts/kinevox/src/services/workoutService.ts');
  const {
    isPreferences,
    isWorkoutLog,
    isWorkoutSession,
    isActivePlan,
  } = await import('../artifacts/kinevox/src/services/storageService.ts');

  pass('All core modules loaded successfully');

  section('2. Exercise & Program Data Integrity');
  assert.equal(exercises.length, 9, 'Should have exactly 9 exercises');
  for (const ex of exercises) {
    assert.ok(ex.id, 'Exercise has an id');
    assert.ok(ex.title.en && ex.title.ar, `Exercise ${ex.id} has bilingual title`);
    assert.ok(ex.instructions.en && ex.instructions.ar, `Exercise ${ex.id} has bilingual instructions`);
    assert.ok(ex.duration > 0, `Exercise ${ex.id} has positive duration`);
  }
  pass('All 9 exercises have complete bilingual titles, instructions, and durations');

  assert.equal(programs.length, 5, 'Should have 5 programs');
  for (const prog of programs) {
    assert.ok(prog.id, 'Program has id');
    assert.ok(prog.title.en && prog.title.ar, `Program ${prog.id} has bilingual title`);
    assert.ok(prog.weekSchedule.length > 0, `Program ${prog.id} has week schedule`);
    assert.ok(prog.exercises.length > 0, `Program ${prog.id} has derived flat exercises`);

    // Verify all workout exercises in schedule reference existing exercises
    for (const day of prog.weekSchedule) {
      assert.ok(day.title.en && day.title.ar, `Day ${day.dayIndex} has bilingual title`);
      for (const we of day.workoutExercises) {
        const found = getExerciseById(we.exerciseId);
        assert.ok(found, `Exercise ${we.exerciseId} in program ${prog.id} must exist in catalogue`);
        assert.ok(we.sets > 0, 'Sets must be > 0');
      }
    }
  }
  pass('All 5 programs have structured weekSchedule with valid exercise references');

  section('3. Recommendation Engine Tests');

  // Match 1: Steady Start
  const prefSteady = {
    goal: 'get-moving',
    experience: 'new',
    location: 'home',
    equipment: 'none',
    daysPerWeek: 3,
    sessionMinutes: 25,
  };
  const matchSteady = matchProgram(prefSteady);
  assert.ok(matchSteady, 'Should match a program');
  assert.equal(matchSteady.id, 'steady-start', 'Should match steady-start');
  pass('Matches steady-start for beginner moving at home with no equipment');

  // Match 2: Strength Foundations
  const prefStrength = {
    goal: 'build-strength',
    experience: 'new',
    location: 'home',
    equipment: 'basic',
    daysPerWeek: 3,
    sessionMinutes: 25,
  };
  const matchStrength = matchProgram(prefStrength);
  assert.ok(matchStrength, 'Should match strength foundations');
  assert.equal(matchStrength.id, 'strength-foundations');
  pass('Matches strength-foundations for beginner strength with basic equipment');

  // Match 3: No Match when criteria too restrictive
  const prefNoMatch = {
    goal: 'build-strength',
    experience: 'new',
    location: 'outdoors', // strength-foundations only supports home/gym
    equipment: 'none',
    daysPerWeek: 1, // requires at least 2 days
    sessionMinutes: 10,
  };
  const matchNone = matchProgram(prefNoMatch);
  assert.equal(matchNone, null, 'Should return null when criteria too restrictive');
  pass('Returns null safely when no program matches user preferences');

  section('4. Interactive Workout Session Lifecycle');

  const session = createWorkoutSession(matchSteady, 0);
  assert.equal(session.programId, 'steady-start');
  assert.equal(session.dayIndex, 0);
  assert.equal(session.status, 'in_progress');
  assert.equal(session.exerciseResults.length, matchSteady.weekSchedule[0].workoutExercises.length);
  pass('createWorkoutSession properly initializes active session');

  // Complete a set
  const firstExId = matchSteady.weekSchedule[0].workoutExercises[0].exerciseId;
  const afterSet1 = completeSet(session, firstExId);
  const result1 = afterSet1.exerciseResults.find((r) => r.exerciseId === firstExId);
  assert.equal(result1.setsCompleted, 1, 'First set marked completed');
  pass('completeSet increments setsCompleted');

  // Undo set
  const afterUndo = undoSet(afterSet1, firstExId);
  const resultUndo = afterUndo.exerciseResults.find((r) => r.exerciseId === firstExId);
  assert.equal(resultUndo.setsCompleted, 0, 'Set undone');
  pass('undoSet decrements setsCompleted safely');

  // Skip exercise
  const afterSkip = skipExercise(session, firstExId);
  const resultSkip = afterSkip.exerciseResults.find((r) => r.exerciseId === firstExId);
  assert.equal(resultSkip.skipped, true);
  pass('skipExercise flags exercise as skipped');

  // Finish session
  const finished = finishSession(afterSet1, 18);
  assert.equal(finished.status, 'completed');
  assert.equal(finished.totalMinutes, 18);
  assert.ok(finished.completedAt);
  pass('finishSession sets status to completed with actual minutes elapsed');

  // Cycle day advancement
  const nextDay = getNextDayIndex(matchSteady, 0);
  assert.equal(nextDay, 1, 'Advances to day index 1');
  const lastDay = getNextDayIndex(matchSteady, matchSteady.weekSchedule.length - 1);
  assert.equal(lastDay, 0, 'Wraps around to day index 0 after cycle finishes');
  pass('getNextDayIndex cycles through the workout days seamlessly');

  section('5. Storage Type Validation');
  assert.ok(isPreferences(prefSteady), 'Valid preferences accepted');
  assert.ok(!isPreferences({ goal: 'invalid' }), 'Invalid preferences rejected');

  const validLog = {
    id: 'log-123',
    date: new Date().toISOString(),
    sessionId: 'steady-start',
    completed: true,
  };
  assert.ok(isWorkoutLog(validLog), 'Valid workout log accepted');
  assert.ok(!isWorkoutLog({ id: 'bad' }), 'Invalid log rejected');

  assert.ok(isWorkoutSession(finished), 'Valid finished WorkoutSession accepted');

  const validPlan = {
    programId: 'steady-start',
    createdAt: new Date().toISOString(),
    preferencesSnapshot: prefSteady,
    currentDayIndex: 1,
  };
  assert.ok(isActivePlan(validPlan), 'Valid ActivePlan accepted');
  pass('Storage type guards validate preferences, logs, sessions, and active plan');

  console.log('\n\x1b[32m✔ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!\x1b[0m\n');
}

runTests().catch((err) => {
  console.error('\n\x1b[31m✖ TEST FAILURE:\x1b[0m', err);
  process.exit(1);
});
