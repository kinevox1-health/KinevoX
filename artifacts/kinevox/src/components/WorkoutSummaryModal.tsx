/**
 * KinevoX — Workout Summary Modal / View
 *
 * Displays post-workout achievements: total minutes, completed exercises,
 * total sets, and saves the session to local history.
 */

import React from 'react';
import { CheckCircle2, Clock3, Dumbbell, Sparkles, ArrowRight, Activity } from 'lucide-react';
import type { WorkoutSession, Program, Lang } from '../data/types';
import { getExerciseById } from '../data/exercises';

interface WorkoutSummaryModalProps {
  session: WorkoutSession;
  program: Program;
  onConfirmSave: () => void;
  lang: Lang;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  session,
  program,
  onConfirmSave,
  lang,
}) => {
  const completedExercises = session.exerciseResults.filter(
    (r) => !r.skipped && r.setsCompleted > 0
  ).length;

  const totalSetsCompleted = session.exerciseResults.reduce(
    (sum, r) => sum + r.setsCompleted,
    0
  );

  const t = {
    title: lang === 'ar' ? 'أحسنت! أتممت جلسة اليوم' : 'Great Job! Session Completed',
    subtitle:
      lang === 'ar'
        ? 'كل خطوة منتظمة تقربك من أهدافك. تم تسجيل نشاطك محلياً.'
        : 'Every consistent session builds real momentum. Your progress is saved locally.',
    program: lang === 'ar' ? 'البرنامج' : 'Program',
    day: lang === 'ar' ? 'الجلسة' : 'Workout Day',
    totalTime: lang === 'ar' ? 'الوقت الإجمالي' : 'Total Duration',
    minutes: lang === 'ar' ? 'دقيقة' : 'min',
    completedMovements: lang === 'ar' ? 'التمارين المنجزة' : 'Movements Done',
    setsDone: lang === 'ar' ? 'المجموعات المكتملة' : 'Total Sets',
    saveAndFinish: lang === 'ar' ? 'حفظ الجلسة والاطلاع على التقدم' : 'Save Session & View Progress',
    exerciseBreakdown: lang === 'ar' ? 'ملخص التمارين' : 'Exercise Breakdown',
    skipped: lang === 'ar' ? 'تخطي' : 'Skipped',
    sets: lang === 'ar' ? 'مجموعات' : 'sets',
  };

  return (
    <div className="summary-overlay" data-testid="workout-summary-modal">
      <div className="summary-card animate-in">
        <div className="summary-icon-badge">
          <Sparkles size={32} color="#438465" />
        </div>

        <h1 className="summary-title">{t.title}</h1>
        <p className="summary-subtitle">{t.subtitle}</p>

        {/* Program and Day meta */}
        <div className="summary-program-info">
          <div className="pill-row">
            <span className="pill">
              <Activity size={13} />
              {program.title[lang]}
            </span>
            <span className="pill subtle">{session.dayTitle[lang]}</span>
          </div>
        </div>

        {/* Metric tiles */}
        <div className="metric-row summary-metrics">
          <div className="metric">
            <strong data-testid="summary-duration">
              {Math.max(1, session.totalMinutes)}
            </strong>
            <span>{t.minutes}</span>
          </div>

          <div className="metric">
            <strong data-testid="summary-exercises">
              {completedExercises} / {session.exerciseResults.length}
            </strong>
            <span>{t.completedMovements}</span>
          </div>

          <div className="metric">
            <strong data-testid="summary-sets">{totalSetsCompleted}</strong>
            <span>{t.setsDone}</span>
          </div>
        </div>

        {/* Breakdown list */}
        <div className="summary-breakdown">
          <h3 className="breakdown-heading">{t.exerciseBreakdown}</h3>
          <div className="breakdown-list">
            {session.exerciseResults.map((result) => {
              const ex = getExerciseById(result.exerciseId);
              if (!ex) return null;

              return (
                <div
                  key={result.exerciseId}
                  className="breakdown-item"
                  data-testid={`breakdown-${result.exerciseId}`}
                >
                  <div className="breakdown-name">
                    {result.skipped ? (
                      <span className="breakdown-status skipped">{t.skipped}</span>
                    ) : (
                      <CheckCircle2 size={16} color="#438465" />
                    )}
                    <span>{ex.title[lang]}</span>
                  </div>
                  <div className="breakdown-sets">
                    {result.skipped
                      ? '-'
                      : `${result.setsCompleted} / ${result.setsTotal} ${t.sets}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action button */}
        <div className="summary-actions">
          <button
            type="button"
            className="button primary large full-width"
            onClick={onConfirmSave}
            data-testid="button-summary-save"
          >
            {t.saveAndFinish}
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};
