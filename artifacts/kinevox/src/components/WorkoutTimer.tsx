/**
 * KinevoX — Workout & Rest Timer Component
 *
 * Provides a clean, responsive countdown timer with start/pause, +30s, and skip.
 */

import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, FastForward, Plus } from 'lucide-react';
import type { Lang } from '../data/types';

interface WorkoutTimerProps {
  initialSeconds: number;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
  isRestTimer?: boolean;
  lang: Lang;
}

export const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  initialSeconds,
  onComplete,
  onSkip,
  autoStart = false,
  isRestTimer = false,
  lang,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsRunning(autoStart);
  }, [initialSeconds, autoStart]);

  useEffect(() => {
    if (!isRunning) return;

    if (secondsLeft <= 0) {
      setIsRunning(false);
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, onComplete]);

  const toggleRunning = () => setIsRunning((prev) => !prev);
  const addThirtySeconds = () => setSecondsLeft((prev) => prev + 30);
  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const remainderSeconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(remainderSeconds).padStart(2, '0')}`;

  const progressPercent = Math.max(0, Math.min(100, (secondsLeft / Math.max(initialSeconds, 1)) * 100));

  const text = {
    restTitle: lang === 'ar' ? 'وقت الراحة' : 'Rest Interval',
    exerciseTimer: lang === 'ar' ? 'مؤقت التمرين' : 'Exercise Timer',
    pause: lang === 'ar' ? 'إيقاف مؤقت' : 'Pause',
    start: lang === 'ar' ? 'بدء' : 'Start',
    resume: lang === 'ar' ? 'استئناف' : 'Resume',
    skip: lang === 'ar' ? 'تخطي الراحة' : 'Skip Rest',
    reset: lang === 'ar' ? 'إعادة ضبط' : 'Reset',
    add30: '+30s',
  };

  return (
    <div
      className={`timer-box ${isRestTimer ? 'rest-timer' : 'standard-timer'}`}
      data-testid="workout-timer"
      role="region"
      aria-label={isRestTimer ? text.restTitle : text.exerciseTimer}
    >
      <div className="timer-header">
        <span className="timer-badge">
          {isRestTimer ? text.restTitle : text.exerciseTimer}
        </span>
      </div>

      <div className="timer-display" data-testid="timer-display">
        <div className="timer-digits">{formattedTime}</div>
        <div className="timer-progress-track">
          <div
            className="timer-progress-bar"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="timer-controls">
        <button
          type="button"
          className="button small outline"
          onClick={addThirtySeconds}
          data-testid="button-timer-add30"
          title={text.add30}
        >
          <Plus size={14} />
          {text.add30}
        </button>

        <button
          type="button"
          className="button small primary"
          onClick={toggleRunning}
          data-testid="button-timer-toggle"
        >
          {isRunning ? <Pause size={15} /> : <Play size={15} />}
          {isRunning ? text.pause : secondsLeft < initialSeconds ? text.resume : text.start}
        </button>

        {isRestTimer ? (
          <button
            type="button"
            className="button small outline"
            onClick={onSkip}
            data-testid="button-timer-skip"
          >
            <FastForward size={14} />
            {text.skip}
          </button>
        ) : (
          <button
            type="button"
            className="button small outline"
            onClick={resetTimer}
            data-testid="button-timer-reset"
          >
            <RotateCcw size={14} />
            {text.reset}
          </button>
        )}
      </div>
    </div>
  );
};
