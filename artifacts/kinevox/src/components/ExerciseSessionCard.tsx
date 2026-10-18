/**
 * KinevoX — Exercise Session Card Component
 *
 * Displays the current exercise during an active workout session,
 * handles set completions, timed countdowns, and rest intervals.
 */

import React, { useState } from 'react';
import { Check, CheckCircle2, RotateCcw, FastForward, Clock3, Dumbbell, Activity, Info } from 'lucide-react';
import type { Exercise, WorkoutExercise, ExerciseResult, Lang } from '../data/types';
import { WorkoutTimer } from './WorkoutTimer';

interface ExerciseSessionCardProps {
  exercise: Exercise;
  workoutExercise: WorkoutExercise;
  result: ExerciseResult;
  onSetComplete: () => void;
  onSetUndo: () => void;
  onSkipExercise: () => void;
  lang: Lang;
}

export const ExerciseSessionCard: React.FC<ExerciseSessionCardProps> = ({
  exercise,
  workoutExercise,
  result,
  onSetComplete,
  onSetUndo,
  onSkipExercise,
  lang,
}) => {
  const [showRestTimer, setShowRestTimer] = useState(false);

  const isTimed = workoutExercise.durationSeconds !== null && workoutExercise.durationSeconds > 0;
  const isAllSetsDone = result.setsCompleted >= result.setsTotal;

  const handleCompleteSet = () => {
    onSetComplete();
    // Show rest timer if there's rest prescribed and more sets remain
    if (workoutExercise.restSeconds > 0 && result.setsCompleted + 1 < result.setsTotal) {
      setShowRestTimer(true);
    }
  };

  const handleRestComplete = () => {
    setShowRestTimer(false);
  };

  const categoryIcons = {
    strength: Dumbbell,
    cardio: Activity,
    mobility: Activity,
  };

  const CategoryIcon = categoryIcons[exercise.category] || Activity;

  const t = {
    set: lang === 'ar' ? 'المجموعة' : 'Set',
    of: lang === 'ar' ? 'من' : 'of',
    reps: lang === 'ar' ? 'تكرارات' : 'reps',
    duration: lang === 'ar' ? 'دقيقة' : 'min',
    seconds: lang === 'ar' ? 'ثانية' : 'sec',
    rest: lang === 'ar' ? 'راحة' : 'Rest',
    completeSet: lang === 'ar' ? 'تسجيل المجموعة كمكتملة' : 'Complete Set',
    completeTimed: lang === 'ar' ? 'تسجيل التمرين كمكتمل' : 'Mark as Complete',
    allSetsDone: lang === 'ar' ? 'اكتملت جميع مجموعات هذا التمرين!' : 'All sets completed!',
    undoSet: lang === 'ar' ? 'تراجع عن آخر مجموعة' : 'Undo last set',
    skipExercise: lang === 'ar' ? 'تخطي هذا التمرين' : 'Skip exercise',
    skipped: lang === 'ar' ? 'تم تخطي هذا التمرين' : 'Skipped',
    equipmentNone: lang === 'ar' ? 'بدون معدات' : 'No equipment',
    equipmentBasic: lang === 'ar' ? 'معدات أساسية' : 'Basic equipment',
    equipmentGym: lang === 'ar' ? 'نادي / أوزان' : 'Gym equipment',
  };

  const equipmentLabel =
    exercise.equipment === 'none'
      ? t.equipmentNone
      : exercise.equipment === 'basic'
      ? t.equipmentBasic
      : t.equipmentGym;

  return (
    <div
      className={`session-exercise-card ${result.skipped ? 'is-skipped' : ''} ${isAllSetsDone ? 'is-done' : ''}`}
      data-testid={`session-card-${exercise.id}`}
    >
      {/* Exercise Header */}
      <div className="exercise-card-header">
        <div className="badges-group">
          <span className="pill">
            <CategoryIcon size={13} />
            {exercise.category}
          </span>
          <span className="pill subtle">{equipmentLabel}</span>
        </div>

        {result.skipped && (
          <span className="badge-status skipped">{t.skipped}</span>
        )}
        {isAllSetsDone && !result.skipped && (
          <span className="badge-status completed">
            <CheckCircle2 size={14} />
            {t.allSetsDone}
          </span>
        )}
      </div>

      {/* Title & Instructions */}
      <div className="exercise-card-body">
        <h2 className="session-exercise-title">{exercise.title[lang]}</h2>
        <p className="session-exercise-instructions">{exercise.instructions[lang]}</p>
      </div>

      {/* Prescription details */}
      <div className="prescription-banner">
        {isTimed ? (
          <div className="prescription-item">
            <Clock3 size={16} />
            <span>
              {Math.round((workoutExercise.durationSeconds || 0) / 60)} {t.duration}
            </span>
          </div>
        ) : (
          <div className="prescription-item">
            <Dumbbell size={16} />
            <span>
              {workoutExercise.sets} {lang === 'ar' ? 'مجموعات' : 'sets'} × {workoutExercise.reps} {t.reps}
            </span>
            {workoutExercise.restSeconds > 0 && (
              <span className="rest-hint">
                · {t.rest} {workoutExercise.restSeconds} {t.seconds}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rep-based Set Tracker */}
      {!isTimed && (
        <div className="sets-tracker-container">
          <div className="sets-bubbles-row">
            {Array.from({ length: result.setsTotal }).map((_, index) => {
              const isFinished = index < result.setsCompleted;
              const isCurrent = index === result.setsCompleted;

              return (
                <div
                  key={index}
                  className={`set-bubble ${isFinished ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  data-testid={`set-bubble-${index}`}
                >
                  <span className="set-label">
                    {t.set} {index + 1}
                  </span>
                  <span className="set-status-icon">
                    {isFinished ? <Check size={14} /> : `${workoutExercise.reps}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rest Timer between sets */}
          {showRestTimer && (
            <div className="inline-rest-timer">
              <WorkoutTimer
                initialSeconds={workoutExercise.restSeconds}
                autoStart={true}
                isRestTimer={true}
                onComplete={handleRestComplete}
                onSkip={handleRestComplete}
                lang={lang}
              />
            </div>
          )}

          {/* Set completion actions */}
          <div className="sets-actions">
            {!isAllSetsDone ? (
              <button
                type="button"
                className="button primary large full-width"
                onClick={handleCompleteSet}
                data-testid="button-complete-set"
              >
                <Check size={18} />
                {t.completeSet} ({result.setsCompleted + 1} {t.of} {result.setsTotal})
              </button>
            ) : (
              <div className="all-sets-celebration">
                <CheckCircle2 size={24} color="#438465" />
                <span>{t.allSetsDone}</span>
              </div>
            )}

            {result.setsCompleted > 0 && (
              <button
                type="button"
                className="button outline small"
                onClick={onSetUndo}
                data-testid="button-undo-set"
              >
                <RotateCcw size={14} />
                {t.undoSet}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Timed exercise countdown */}
      {isTimed && (
        <div className="timed-exercise-container">
          <WorkoutTimer
            initialSeconds={workoutExercise.durationSeconds || 60}
            autoStart={false}
            isRestTimer={false}
            onComplete={onSetComplete}
            lang={lang}
          />
          {!isAllSetsDone && (
            <button
              type="button"
              className="button primary small"
              style={{ marginTop: 12 }}
              onClick={onSetComplete}
              data-testid="button-complete-timed-set"
            >
              <Check size={15} />
              {t.completeTimed}
            </button>
          )}
        </div>
      )}

      {/* Skip button footer */}
      {!result.skipped && !isAllSetsDone && (
        <div className="exercise-card-footer">
          <button
            type="button"
            className="text-link danger-hover"
            onClick={onSkipExercise}
            data-testid="button-skip-exercise"
          >
            <FastForward size={14} />
            {t.skipExercise}
          </button>
        </div>
      )}
    </div>
  );
};
