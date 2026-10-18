/**
 * KinevoX — Interactive Workout Session Page
 *
 * Full interactive exercise execution flow:
 * - Real-time session elapsed timer
 * - Per-exercise sets and reps tracker
 * - Interactive countdown and rest timers
 * - Progress stepper and exercise navigation
 * - Post-workout summary and local persistence
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Dumbbell,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import type {
  Lang,
  Program,
  WorkoutDay,
  WorkoutSession,
  Preferences,
} from '../data/types';
import { getProgramById } from '../data/programs';
import { getExerciseById } from '../data/exercises';
import {
  createWorkoutSession,
  completeSet,
  undoSet,
  skipExercise,
  finishSession,
  getNextDayIndex,
} from '../services/workoutService';
import { ExerciseSessionCard } from '../components/ExerciseSessionCard';
import { WorkoutSummaryModal } from '../components/WorkoutSummaryModal';

interface WorkoutSessionPageProps {
  program: Program | null;
  dayIndex: number;
  lang: Lang;
  activeSession: WorkoutSession | null;
  onUpdateSession: (session: WorkoutSession | null) => void;
  onSessionCompleted: (session: WorkoutSession, nextDayIndex: number) => void;
}

export const WorkoutSessionPage: React.FC<WorkoutSessionPageProps> = ({
  program,
  dayIndex,
  lang,
  activeSession,
  onUpdateSession,
  onSessionCompleted,
}) => {
  const [, setPath] = useLocation();

  // Initialize or resume workout session
  const [session, setSession] = useState<WorkoutSession>(() => {
    if (activeSession && activeSession.status === 'in_progress' && program && activeSession.programId === program.id) {
      return activeSession;
    }
    if (program) {
      return createWorkoutSession(program, dayIndex);
    }
    // Fallback stub
    return {
      id: `stub-${Date.now()}`,
      date: new Date().toISOString(),
      programId: '',
      dayIndex: 0,
      dayTitle: { en: 'Workout', ar: 'تمرين' },
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      completedAt: null,
      exerciseResults: [],
      totalMinutes: 0,
    };
  });

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync session changes upward for persistence
  useEffect(() => {
    if (session && session.status === 'in_progress') {
      onUpdateSession(session);
    }
  }, [session, onUpdateSession]);

  // Elapsed workout stopwatch
  useEffect(() => {
    const startTime = new Date(session.startedAt).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [session.startedAt]);

  if (!program) {
    return (
      <div className="empty-state animate-in" data-testid="status-session-no-program">
        <AlertCircle size={32} />
        <h2>{lang === 'ar' ? 'لا يوجد برنامج محدد' : 'No Program Selected'}</h2>
        <p>
          {lang === 'ar'
            ? 'يرجى مراجعة خطتك التدريبية أولاً لبدء الجلسة.'
            : 'Please review your training plan first to start a workout session.'}
        </p>
        <button
          type="button"
          className="button dark"
          onClick={() => setPath('/plan')}
          data-testid="button-session-back-to-plan"
        >
          {lang === 'ar' ? 'الذهاب إلى الخطة' : 'Go to Plan'}
        </button>
      </div>
    );
  }

  const currentDay: WorkoutDay = program.weekSchedule[session.dayIndex] || program.weekSchedule[0];
  const workoutExercises = currentDay?.workoutExercises || [];
  const currentWorkoutExercise = workoutExercises[currentExerciseIndex];
  const currentExercise = currentWorkoutExercise
    ? getExerciseById(currentWorkoutExercise.exerciseId)
    : undefined;

  const currentResult = session.exerciseResults.find(
    (r) => r.exerciseId === currentWorkoutExercise?.exerciseId
  ) || {
    exerciseId: currentWorkoutExercise?.exerciseId || '',
    setsCompleted: 0,
    setsTotal: currentWorkoutExercise?.sets || 1,
    skipped: false,
  };

  const isLastExercise = currentExerciseIndex === workoutExercises.length - 1;
  const isFirstExercise = currentExerciseIndex === 0;

  // Handlers for set completion and skipping
  const handleSetComplete = () => {
    if (!currentWorkoutExercise) return;
    setSession((prev) => completeSet(prev, currentWorkoutExercise.exerciseId));
  };

  const handleSetUndo = () => {
    if (!currentWorkoutExercise) return;
    setSession((prev) => undoSet(prev, currentWorkoutExercise.exerciseId));
  };

  const handleSkipExercise = () => {
    if (!currentWorkoutExercise) return;
    setSession((prev) => skipExercise(prev, currentWorkoutExercise.exerciseId));
    if (!isLastExercise) {
      setCurrentExerciseIndex((prev) => prev + 1);
    }
  };

  const handleNextExercise = () => {
    if (!isLastExercise) {
      setCurrentExerciseIndex((prev) => prev + 1);
    } else {
      handleOpenSummary();
    }
  };

  const handlePrevExercise = () => {
    if (!isFirstExercise) {
      setCurrentExerciseIndex((prev) => prev - 1);
    }
  };

  const handleOpenSummary = () => {
    const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const completed = finishSession(session, elapsedMinutes);
    setSession(completed);
    setShowSummaryModal(true);
  };

  const handleConfirmSave = () => {
    const nextDay = getNextDayIndex(program, session.dayIndex);
    onSessionCompleted(session, nextDay);
    setPath('/progress');
  };

  const handleExitWorkout = () => {
    onUpdateSession(null); // clear draft
    setPath('/plan');
  };

  const elapsedMinutesStr = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const elapsedSecsStr = String(elapsedSeconds % 60).padStart(2, '0');

  const t = {
    workout: lang === 'ar' ? 'جلسة التمرين' : 'Workout Session',
    elapsed: lang === 'ar' ? 'الوقت المنقضي' : 'Elapsed',
    exit: lang === 'ar' ? 'خروج' : 'Exit',
    finish: lang === 'ar' ? 'إنهاء الجلسة' : 'Finish Session',
    next: lang === 'ar' ? 'التمرين التالي' : 'Next Movement',
    prev: lang === 'ar' ? 'التمرين السابق' : 'Previous',
    movementOf: lang === 'ar' ? 'تمرين' : 'Movement',
    of: lang === 'ar' ? 'من' : 'of',
    exitConfirmTitle: lang === 'ar' ? 'هل تريد الخروج من الجلسة؟' : 'Exit Workout Session?',
    exitConfirmBody:
      lang === 'ar'
        ? 'سيتم إلغاء الجلسة الحالية ولن يتم تسجيلها في سجلك.'
        : 'Your progress in this session will not be saved to your history.',
    resumeWorkout: lang === 'ar' ? 'متابعة التمرين' : 'Resume Workout',
    confirmExit: lang === 'ar' ? 'تأكيد الخروج' : 'Confirm Exit',
  };

  return (
    <div className="session-page-wrapper animate-in" data-testid="page-workout-session">
      {/* Session Top Bar */}
      <header className="session-topbar">
        <div className="session-meta">
          <span className="pill">
            <Dumbbell size={13} />
            {program.title[lang]}
          </span>
          <h1 className="session-day-title">{session.dayTitle[lang]}</h1>
        </div>

        <div className="session-timers-actions">
          <div className="session-stopwatch" data-testid="session-stopwatch">
            <Clock3 size={15} />
            <span>
              {elapsedMinutesStr}:{elapsedSecsStr}
            </span>
          </div>

          <button
            type="button"
            className="button outline small"
            onClick={() => setShowExitConfirm(true)}
            data-testid="button-session-exit"
          >
            <X size={15} />
            {t.exit}
          </button>
        </div>
      </header>

      {/* Exercise Stepper Indicators */}
      <div className="session-stepper-bar">
        <div className="session-stepper-label">
          {t.movementOf} {currentExerciseIndex + 1} {t.of} {workoutExercises.length}
        </div>
        <div className="session-dots-row">
          {workoutExercises.map((we, idx) => {
            const res = session.exerciseResults.find((r) => r.exerciseId === we.exerciseId);
            const isCompleted = res && res.setsCompleted >= res.setsTotal && !res.skipped;
            const isSkipped = res && res.skipped;
            const isCurrent = idx === currentExerciseIndex;

            return (
              <button
                type="button"
                key={we.exerciseId}
                className={`step-bubble ${isCurrent ? 'current' : ''} ${isCompleted ? 'done' : ''} ${isSkipped ? 'skipped' : ''}`}
                onClick={() => setCurrentExerciseIndex(idx)}
                data-testid={`session-step-${idx}`}
                aria-label={`Exercise ${idx + 1}`}
              >
                {isCompleted ? <CheckCircle2 size={13} /> : idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Exercise Card */}
      <main className="session-content">
        {currentExercise && currentWorkoutExercise ? (
          <ExerciseSessionCard
            exercise={currentExercise}
            workoutExercise={currentWorkoutExercise}
            result={currentResult}
            onSetComplete={handleSetComplete}
            onSetUndo={handleSetUndo}
            onSkipExercise={handleSkipExercise}
            lang={lang}
          />
        ) : (
          <div className="empty-state">
            <p>{lang === 'ar' ? 'انتهت تمارين الجلسة.' : 'No more exercises.'}</p>
          </div>
        )}
      </main>

      {/* Navigation Footer */}
      <footer className="session-navigation-footer">
        <button
          type="button"
          className="button outline"
          disabled={isFirstExercise}
          onClick={handlePrevExercise}
          data-testid="button-session-prev"
        >
          <ArrowLeft size={16} />
          {t.prev}
        </button>

        {isLastExercise ? (
          <button
            type="button"
            className="button primary"
            onClick={handleOpenSummary}
            data-testid="button-session-finish"
          >
            <Sparkles size={16} />
            {t.finish}
          </button>
        ) : (
          <button
            type="button"
            className="button primary"
            onClick={handleNextExercise}
            data-testid="button-session-next"
          >
            {t.next}
            <ArrowRight size={16} />
          </button>
        )}
      </footer>

      {/* Exit confirmation modal */}
      {showExitConfirm && (
        <div className="modal-backdrop" data-testid="modal-exit-confirm">
          <div className="modal-dialog animate-in">
            <h3 className="modal-title">{t.exitConfirmTitle}</h3>
            <p className="modal-body">{t.exitConfirmBody}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="button outline"
                onClick={() => setShowExitConfirm(false)}
                data-testid="button-cancel-exit"
              >
                {t.resumeWorkout}
              </button>
              <button
                type="button"
                className="button"
                style={{ background: '#a64e3e', color: '#fff' }}
                onClick={handleExitWorkout}
                data-testid="button-confirm-exit"
              >
                {t.confirmExit}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout Summary Modal */}
      {showSummaryModal && (
        <WorkoutSummaryModal
          session={session}
          program={program}
          onConfirmSave={handleConfirmSave}
          lang={lang}
        />
      )}
    </div>
  );
};
