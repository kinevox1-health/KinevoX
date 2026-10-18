import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Dumbbell,
  HeartHandshake,
  Home,
  Info,
  Languages,
  Leaf,
  LockKeyhole,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingUp,
  User,
  Waves,
  Zap,
} from 'lucide-react';

import type {
  Lang,
  Goal,
  Level,
  LocationChoice,
  Equipment,
  Safety,
  Preferences,
  Exercise,
  Program,
  WorkoutLog,
  WorkoutSession,
  ActivePlan,
} from './data/types';
import { DEFAULT_PREFERENCES } from './data/types';
import { exercises, getExerciseById } from './data/exercises';
import { programs, getProgramById } from './data/programs';
import {
  matchProgram,
  getProgramEstimatedDuration,
} from './services/recommendationService';
import {
  readStoredData,
  persistStorageData,
  clearStoredData,
  type KinevoxStorageData,
} from './services/storageService';
import {
  createWorkoutSession,
  getNextDayIndex,
} from './services/workoutService';
import { WorkoutSessionPage } from './pages/WorkoutSessionPage';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import type { UserCloudData } from './services/firestoreService';

const defaults: Preferences = DEFAULT_PREFERENCES;

const copy: Record<string, Record<Lang, string>> = {
  home: { en: 'Home', ar: 'الرئيسية' },
  plan: { en: 'Your plan', ar: 'خطتك' },
  library: { en: 'Exercises', ar: 'التمارين' },
  progress: { en: 'Progress', ar: 'التقدم' },
  profile: { en: 'Profile', ar: 'الملف الشخصي' },
  signIn: { en: 'Sign In', ar: 'تسجيل الدخول' },
  privacy: { en: 'Privacy', ar: 'الخصوصية' },
  tagline: { en: 'Evolve Your Potential.', ar: 'طوّر إمكاناتك.' },
  greeting: { en: 'A little movement. A lot of momentum.', ar: 'حركة بسيطة، وزخم أكبر.' },
  homeIntro: { en: 'Build a routine that fits your real life — one doable session at a time.', ar: 'ابنِ روتيناً يناسب حياتك — جلسة عملية في كل مرة.' },
  start: { en: 'Set up my routine', ar: 'ابدأ إعداد روتيني' },
  resume: { en: 'See my weekly plan', ar: 'اطّلع على خطتي الأسبوعية' },
  startWorkout: { en: "Start Today's Workout", ar: 'ابدأ تمرين اليوم' },
  resumeWorkout: { en: 'Resume Active Workout', ar: 'استئناف التمرين الجاري' },
  activeSessionNotice: { en: 'You have a workout in progress.', ar: 'لديك جلسة تمرين قيد التنفيذ.' },
  weeklySchedule: { en: 'Weekly Schedule', ar: 'الجدول الأسبوعي' },
  dayNext: { en: 'Next up', ar: 'الجلسة التالية' },
  dayRest: { en: 'Rest Day', ar: 'يوم راحة' },
  sets: { en: 'sets', ar: 'مجموعات' },
  reps: { en: 'reps', ar: 'تكرارات' },
  rest: { en: 'rest', ar: 'راحة' },
  safetyStart: { en: 'Review your exercise preferences', ar: 'راجع تفضيلات التمرين' },
  thisWeek: { en: 'Your week, at a glance', ar: 'أسبوعك بنظرة سريعة' },
  weekNote: { en: 'Consistency is built in small repeats, not perfect weeks.', ar: 'الاستمرارية تُبنى بالتكرار البسيط، لا بالأسابيع المثالية.' },
  sessions: { en: 'Sessions done', ar: 'جلسات مكتملة' },
  minutes: { en: 'Minutes moving', ar: 'دقائق من الحركة' },
  streak: { en: 'This week', ar: 'هذا الأسبوع' },
  disclaimer: { en: 'Starter ideas only — demonstration content, not medically reviewed. Move at a comfortable pace and stop if something feels wrong.', ar: 'أفكار أولية فقط — محتوى تجريبي غير مراجع طبياً. تحرك بإيقاع مريح وتوقف إذا شعرت بما لا يناسبك.' },
  nextSteps: { en: 'Small steps, made personal', ar: 'خطوات صغيرة بطابعك' },
  stepOne: { en: 'Choose a direction', ar: 'اختر وجهة' },
  stepOneText: { en: 'Tell us what you want more of, and what fits your week.', ar: 'أخبرنا بما ترغب في تحقيقه وما يناسب أسبوعك.' },
  stepTwo: { en: 'Get a thoughtful match', ar: 'احصل على اقتراح مناسب' },
  stepTwoText: { en: 'See why a starter routine fits your preferences.', ar: 'اكتشف لماذا تناسبك خطة بداية.' },
  stepThree: { en: 'Notice your progress', ar: 'لاحظ تقدمك' },
  stepThreeText: { en: 'Your activity stays on this device, ready when you return.', ar: 'يبقى نشاطك على هذا الجهاز، جاهزاً عند عودتك.' },
  welcome: { en: 'A routine that starts where you are.', ar: 'روتين يبدأ من حيث أنت.' },
  language: { en: 'العربية', ar: 'English' },
  onboarding: { en: 'Build your starting point', ar: 'ابدأ من نقطتك المناسبة' },
  onboardIntro: { en: 'A few choices help KinevoX suggest a manageable weekly routine.', ar: 'تساعدنا اختيارات بسيطة على اقتراح روتين أسبوعي مناسب.' },
  safetyTitle: { en: 'A quick safety check', ar: 'سؤال سريع للسلامة' },
  safetyHint: { en: 'Do you have a condition, injury, or medical guidance that affects exercise?', ar: 'هل لديك حالة أو إصابة أو توجيه طبي يؤثر على ممارسة التمارين؟' },
  safeNo: { en: 'No', ar: 'لا' },
  safeYes: { en: 'Yes', ar: 'نعم' },
  safePrefer: { en: 'Prefer not to answer', ar: 'أفضل عدم الإجابة' },
  safeNoDesc: { en: 'Nothing to flag for this starter flow.', ar: 'لا يوجد ما يستدعي التنبيه في هذه الخطوة.' },
  safePause: { en: 'Pause and get qualified guidance', ar: 'توقف واطلب توجيهاً من مختص' },
  safePreferDesc: { en: 'You can continue without sharing details; we will not suggest a plan.', ar: 'يمكنك المتابعة دون مشاركة أي تفاصيل؛ لن نقترح خطة.' },
  safetyPauseTitle: { en: 'Let’s pause before planning', ar: 'لنتوقف قبل إعداد الخطة' },
  safetyPauseBody: { en: 'Because you selected yes or prefer not to answer, KinevoX will not recommend exercise sessions. Consider checking with a qualified healthcare professional about activity that is appropriate for you. No health details are collected or saved.', ar: 'بما أنك اخترت نعم أو أفضل عدم الإجابة، لن تقترح KinevoX جلسات تمرين. فكّر في استشارة مختص رعاية صحية مؤهل حول النشاط المناسب لك. لا نجمع أي تفاصيل صحية أو نحفظها.' },
  next: { en: 'Continue', ar: 'متابعة' },
  back: { en: 'Back', ar: 'رجوع' },
  stepGoal: { en: 'What would you like to work toward?', ar: 'ما الذي ترغب في العمل لتحقيقه؟' },
  goalHint: { en: 'There is no wrong starting point. Pick what feels useful now.', ar: 'لا توجد بداية خاطئة. اختر ما يبدو مفيداً الآن.' },
  goalMove: { en: 'Move more often', ar: 'زيادة الحركة' },
  goalMoveDesc: { en: 'Find an easy rhythm for activity.', ar: 'اعثر على إيقاع مريح للنشاط.' },
  goalStrength: { en: 'Build everyday strength', ar: 'بناء قوة يومية' },
  goalStrengthDesc: { en: 'Practice simple strength movements.', ar: 'تدرّب على حركات قوة بسيطة.' },
  goalMobility: { en: 'Feel more mobile', ar: 'مرونة وحركة أسهل' },
  goalMobilityDesc: { en: 'Make room for gentle movement.', ar: 'امنح نفسك مساحة لحركة لطيفة.' },
  experience: { en: 'Your experience', ar: 'خبرتك' },
  new: { en: 'I’m new to routines', ar: 'أنا جديد على الروتين' },
  some: { en: 'I’ve exercised before', ar: 'لدي تجربة سابقة' },
  location: { en: 'Where do you like to move?', ar: 'أين تفضل الحركة؟' },
  homeLoc: { en: 'At home', ar: 'في المنزل' },
  outdoors: { en: 'Outdoors', ar: 'في الخارج' },
  gym: { en: 'At a gym', ar: 'في النادي' },
  equipment: { en: 'Equipment available', ar: 'المعدات المتاحة' },
  none: { en: 'No equipment', ar: 'دون معدات' },
  basic: { en: 'Basic band / light weights', ar: 'شريط أو أوزان خفيفة' },
  days: { en: 'Days each week', ar: 'أيام في الأسبوع' },
  minutesChoice: { en: 'Minutes per session', ar: 'دقائق لكل جلسة' },
  finish: { en: 'Save my preferences', ar: 'احفظ تفضيلاتي' },
  saved: { en: 'Your preferences are saved on this device.', ar: 'حُفظت تفضيلاتك على هذا الجهاز.' },
  planHeading: { en: 'A plan with room to grow', ar: 'خطة تترك مجالاً للنمو' },
  planSubtitle: { en: 'A simple recommendation built around the preferences you chose.', ar: 'اقتراح بسيط صُمم وفق التفضيلات التي اخترتها.' },
  whyTitle: { en: 'Why this could fit', ar: 'لماذا قد تناسبك؟' },
  whyGoal: { en: 'It lines up with the goal you picked.', ar: 'تتوافق مع الهدف الذي اخترته.' },
  whyLevel: { en: 'It starts at your selected experience level.', ar: 'تبدأ من مستوى الخبرة الذي اخترته.' },
  whyDays: { en: 'Its weekly rhythm fits the days you chose.', ar: 'يناسب إيقاعها الأسبوعي عدد الأيام الذي اخترته.' },
  whyGear: { en: 'It works with your available equipment.', ar: 'تناسب المعدات المتاحة لديك.' },
  whyDuration: { en: 'Sessions are shaped around your time window.', ar: 'تراعي الجلسات الوقت الذي حددته.' },
  matchLabel: { en: 'A considered match', ar: 'اقتراح مدروس' },
  duration: { en: 'min', ar: 'دقيقة' },
  perWeek: { en: 'days / week', ar: 'أيام / أسبوع' },
  completeSession: { en: 'Mark this session complete', ar: 'تسجيل الجلسة كمكتملة' },
  completed: { en: 'Session saved. Nice work showing up.', ar: 'حُفظت الجلسة. أحسنت المواظبة.' },
  completedBadge: { en: 'Completed', ar: 'مكتملة' },
  starterLabel: { en: 'Starter demonstration', ar: 'محتوى تجريبي' },
  noPlanTitle: { en: 'No close match just yet', ar: 'لا يوجد اقتراح قريب حالياً' },
  noPlanBody: { en: 'Your current combination does not match a starter plan in this demonstration library. Try adjusting your goal, experience, or available days. We’ll keep your preferences intact.', ar: 'لا تتوافق تفضيلاتك الحالية مع خطة بداية في هذه المكتبة التجريبية. جرّب تعديل هدفك أو خبرتك أو أيامك المتاحة. سنحتفظ بتفضيلاتك كما هي.' },
  editPrefs: { en: 'Adjust preferences', ar: 'تعديل التفضيلات' },
  libraryTitle: { en: 'A small library for curious starts', ar: 'مكتبة صغيرة لبدايات جديدة' },
  libraryIntro: { en: 'Search by movement or filter by focus. These are starter examples, not a prescription.', ar: 'ابحث عن حركة أو صفّ حسب التركيز. هذه أمثلة أولية وليست وصفة تدريبية.' },
  search: { en: 'Search exercise names or instructions', ar: 'ابحث عن أسماء التمارين أو التعليمات' },
  all: { en: 'All movements', ar: 'كل الحركات' },
  strength: { en: 'Strength', ar: 'قوة' },
  cardio: { en: 'Cardio', ar: 'لياقة قلبية' },
  mobility: { en: 'Mobility', ar: 'مرونة' },
  noResults: { en: 'No movement found', ar: 'لم نعثر على حركة' },
  noResultsText: { en: 'Try another word or clear your filters.', ar: 'جرّب كلمة أخرى أو أزل عوامل التصفية.' },
  libraryCount: { en: 'movements', ar: 'حركة' },
  progressTitle: { en: 'Your progress, without the pressure', ar: 'تقدمك، دون ضغط' },
  progressIntro: { en: 'A gentle record of the sessions you chose to complete.', ar: 'سجل بسيط للجلسات التي اخترت إكمالها.' },
  totalSessions: { en: 'Total sessions', ar: 'إجمالي الجلسات' },
  lastSeven: { en: 'Last 7 days', ar: 'آخر 7 أيام' },
  totalMinutes: { en: 'Total minutes', ar: 'إجمالي الدقائق' },
  history: { en: 'Activity history', ar: 'سجل النشاط' },
  emptyTitle: { en: 'Your first check-in is still ahead', ar: 'أول إنجاز لك بانتظارك' },
  emptyText: { en: 'When you complete a session, it will be kept here on this device.', ar: 'عند إكمال جلسة، ستظهر هنا على هذا الجهاز.' },
  goPlan: { en: 'See my plan', ar: 'اطّلع على خطتي' },
  privacyTitle: { en: 'Your data belongs to you', ar: 'بياناتك ملكك' },
  privacyIntro: { en: 'KinevoX keeps this first version simple and local.', ar: 'تحافظ KinevoX على بساطة هذه النسخة وخصوصيتها.' },
  localTitle: { en: 'Saved on this device', ar: 'محفوظة على هذا الجهاز' },
  localBody: { en: 'Your language, exercise preferences, and completed-session log are stored in this browser on this device. There are no accounts, servers, or external APIs in this MVP.', ar: 'تُخزن اللغة وتفضيلات التمرين وسجل الجلسات المكتملة في هذا المتصفح على هذا الجهاز. لا توجد حسابات أو خوادم أو واجهات خارجية في هذه النسخة.' },
  healthTitle: { en: 'No health history collected', ar: 'لا نجمع سجلاً صحياً' },
  healthBody: { en: 'The safety answer is used only in memory to decide whether this flow should pause. It is never written to local storage. We do not ask for diagnoses, medication, measurements, or detailed health history.', ar: 'يُستخدم جواب السلامة في الذاكرة فقط لتحديد ما إذا كان ينبغي إيقاف هذا المسار. لا يُكتب أبداً في التخزين المحلي. لا نسأل عن التشخيصات أو الأدوية أو القياسات أو التاريخ الصحي التفصيلي.' },
  demoTitle: { en: 'Starter content is not medically reviewed', ar: 'المحتوى الأولي غير مراجع طبياً' },
  demoBody: { en: 'The sample exercises and routines are demonstration content only. They have not been reviewed by a health professional and are not medical advice.', ar: 'التمارين والروتينات النموذجية محتوى تجريبي فقط. لم يراجعها مختص صحي ولا تُعد نصيحة طبية.' },
  clearTitle: { en: 'Clear local data', ar: 'مسح البيانات المحلية' },
  clearBody: { en: 'Remove your saved preferences, language, and workout history from this browser.', ar: 'أزل تفضيلاتك المحفوظة ولغتك وسجل التمارين من هذا المتصفح.' },
  clearAction: { en: 'Clear all data', ar: 'مسح كل البيانات' },
  clearConfirm: { en: 'Clear all KinevoX data saved on this device?', ar: 'هل تريد مسح كل بيانات KinevoX المحفوظة على هذا الجهاز؟' },
  cleared: { en: 'Local data cleared.', ar: 'تم مسح البيانات المحلية.' },
  notFound: { en: 'We couldn’t find that page.', ar: 'لم نتمكن من العثور على هذه الصفحة.' },
  returnHome: { en: 'Back to home', ar: 'العودة للرئيسية' },
  languageSaved: { en: 'Language updated.', ar: 'تم تحديث اللغة.' },
  noPrefs: { en: 'A few preferences will help us make this personal.', ar: 'تساعدنا بعض التفضيلات على تخصيص تجربتك.' },
  equipmentFit: { en: 'You can adapt any movement to feel comfortable.', ar: 'يمكنك تكييف أي حركة لتكون مريحة لك.' },
  locationLabel: { en: 'Location', ar: 'المكان' },
  experienceLabel: { en: 'Experience', ar: 'الخبرة' },
  advice: { en: 'If activity brings pain, dizziness, or unusual discomfort, stop and seek qualified guidance.', ar: 'إذا تسبب النشاط بألم أو دوار أو انزعاج غير معتاد، فتوقف واطلب توجيهاً مؤهلاً.' },
};

const goalKey = (goal: Goal) =>
  goal === 'get-moving'
    ? 'goalMove'
    : goal === 'build-strength'
    ? 'goalStrength'
    : 'goalMobility';

type AppContextValue = {
  lang: Lang;
  t: (key: string) => string;
  preferences: Preferences | null;
  activePlan: ActivePlan | null;
  logs: WorkoutLog[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  safety: Safety | null;
  setSafety: (value: Safety | null) => void;
  savePreferences: (pref: Preferences) => void;
  updateActiveSession: (session: WorkoutSession | null) => void;
  completeWorkoutSession: (session: WorkoutSession, nextDayIndex: number) => void;
  completeSession: (sessionId: string) => void;
  toast: (message: string) => void;
  clearData: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('KinevoX context missing');
  return context;
}

const storageWarning: Record<Lang, string> = {
  en: 'This browser could not save or clear KinevoX data. Changes may not survive closing the page, and saved data may remain in this browser.',
  ar: 'تعذر على هذا المتصفح حفظ بيانات KinevoX أو مسحها. قد لا تبقى التغييرات بعد إغلاق الصفحة، وربما تظل البيانات المحفوظة في المتصفح.',
};

function TopbarUser() {
  const { user } = useAuth();
  const { t } = useApp();

  if (user) {
    const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
    return (
      <Link href="/profile" className="topbar-auth-btn" data-testid="link-topbar-profile" aria-label={t('profile')}>
        <span className="topbar-user-avatar">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
          ) : (
            initial
          )}
        </span>
        <span className="topbar-user-name">
          {user.displayName?.split(' ')[0] || user.email?.split('@')[0] || t('profile')}
        </span>
      </Link>
    );
  }

  return (
    <Link href="/auth" className="topbar-auth-btn" data-testid="link-topbar-signin">
      <User size={15} />
      <span>{t('signIn')}</span>
    </Link>
  );
}

function AppShell({ children }: { children: any }) {
  const [data, setData] = useState<KinevoxStorageData>(() => readStoredData());
  const skipNextPersist = useRef(false);
  const [storageError, setStorageError] = useState(false);
  const [safety, setSafety] = useState<Safety | null>(null);
  const [toastText, setToastText] = useState('');
  const [path] = useLocation();

  const lang = data.language;
  const t = (key: string) => copy[key]?.[lang] ?? key;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Synchronize state with storage
  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    const success = persistStorageData(data);
    setStorageError(!success);
  }, [data]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  useEffect(() => {
    if (!toastText) return;
    const timer = window.setTimeout(() => setToastText(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toastText]);

  const api: AppContextValue = {
    lang,
    t,
    preferences: data.preferences,
    activePlan: data.activePlan,
    logs: data.logs,
    sessions: data.sessions,
    activeSession: data.activeSession,
    safety,
    setSafety,

    savePreferences: (preferences) => {
      setData((current) => {
        const matched = matchProgram(preferences);
        const activePlan: ActivePlan | null = matched
          ? {
              programId: matched.id,
              createdAt: new Date().toISOString(),
              preferencesSnapshot: preferences,
              currentDayIndex: 0,
            }
          : null;
        return { ...current, preferences, activePlan };
      });
    },

    updateActiveSession: (activeSession) => {
      setData((current) => ({ ...current, activeSession }));
    },

    completeWorkoutSession: (session, nextDayIndex) => {
      const entry: WorkoutLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: session.completedAt || new Date().toISOString(),
        sessionId: session.programId,
        completed: true,
      };

      setData((current) => {
        const updatedActivePlan: ActivePlan | null = current.activePlan
          ? { ...current.activePlan, currentDayIndex: nextDayIndex }
          : null;

        return {
          ...current,
          sessions: [session, ...current.sessions],
          logs: [entry, ...current.logs],
          activeSession: null,
          activePlan: updatedActivePlan,
        };
      });

      setToastText(t('completed'));
    },

    completeSession: (sessionId) => {
      const entry: WorkoutLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: new Date().toISOString(),
        sessionId,
        completed: true,
      };

      setData((current) => {
        const program = getProgramById(sessionId);
        let updatedPlan = current.activePlan;
        if (program && updatedPlan && updatedPlan.programId === sessionId) {
          const nextIndex = getNextDayIndex(program, updatedPlan.currentDayIndex);
          updatedPlan = { ...updatedPlan, currentDayIndex: nextIndex };
        }
        return {
          ...current,
          logs: [entry, ...current.logs],
          activePlan: updatedPlan,
        };
      });

      setToastText(t('completed'));
    },

    toast: setToastText,

    clearData: () => {
      skipNextPersist.current = true;
      const success = clearStoredData();
      setStorageError(!success);
      setData({
        schemaVersion: 2,
        language: 'en',
        preferences: null,
        activePlan: null,
        logs: [],
        sessions: [],
        activeSession: null,
      });
      setSafety(null);
    },
  };

  const toggleLanguage = () => {
    const next = lang === 'en' ? 'ar' : 'en';
    setData((current) => ({ ...current, language: next }));
    setToastText(copy.languageSaved[next]);
  };

  const active = path === '/' ? 'home' : path.slice(1);

  return (
    <AppContext.Provider value={api}>
      <AuthProvider
        onSyncFromCloud={(cloud: UserCloudData) => {
          setData((current) => ({
            ...current,
            language: cloud.language,
            preferences: cloud.preferences,
            activePlan: cloud.activePlan,
            logs: cloud.logs,
            sessions: cloud.sessions,
          }));
        }}
      >
        <div className="app-shell" dir={dir}>
          <header className="topbar">
            <Link
              href="/"
              className="brand"
              data-testid="link-brand-home"
              aria-label={lang === 'ar' ? 'الصفحة الرئيسية KinevoX' : 'KinevoX home'}
            >
              <span className="brand-mark">
                <Activity size={21} />
              </span>
              <span>
                <span className="brand-name">KinevoX</span>
                <span className="brand-tag">{t('tagline')}</span>
              </span>
            </Link>
            <div className="header-tools">
              {data.activeSession && (
                <Link
                  href="/session"
                  className="pill subtle animate-pulse"
                  style={{ background: '#eaf4eb', color: '#165e49', fontWeight: 800 }}
                  data-testid="link-topbar-resume-session"
                >
                  <Play size={12} fill="#165e49" />
                  {t('activeSessionNotice')}
                </Link>
              )}
              <TopbarUser />
              <button
                className="lang-toggle"
                onClick={toggleLanguage}
                data-testid="button-language-toggle"
                aria-label={t('language')}
              >
                <Languages size={16} />
                {t('language')}
              </button>
            </div>
          </header>

          <nav className="nav" aria-label={lang === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}>
            {[
              { href: '/', key: 'home', icon: Home },
              { href: '/plan', key: 'plan', icon: Sparkles },
              { href: '/exercises', key: 'library', icon: BookOpen },
              { href: '/progress', key: 'progress', icon: TrendingUp },
              { href: '/profile', key: 'profile', icon: User },
              { href: '/privacy', key: 'privacy', icon: ShieldCheck },
            ].map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${active === (href === '/' ? 'home' : href.slice(1)) ? 'active' : ''}`}
                data-testid={`link-nav-${key}`}
                aria-current={active === (href === '/' ? 'home' : href.slice(1)) ? 'page' : undefined}
              >
                <Icon size={17} />
                {t(key)}
              </Link>
            ))}
          </nav>

        <main className="main">
          {storageError && (
            <div className="notice" role="alert" style={{ marginBottom: 18 }}>
              {storageWarning[lang]}
            </div>
          )}
          <div className="animate-in" key={path}>
            {children}
          </div>
          <p className="footer-note">
            {t('tagline')} · {t('disclaimer')}
          </p>
        </main>

        {toastText && (
          <div className="toast-message" role="status" data-testid="status-toast">
            {toastText}
          </div>
        )}
      </div>
      </AuthProvider>
    </AppContext.Provider>
  );
}

function Disclosure() {
  const { t } = useApp();
  return (
    <div className="disclosure" data-testid="status-demo-disclosure">
      <Info size={16} />
      <span>{t('disclaimer')}</span>
    </div>
  );
}

function HomePage() {
  const { t, lang, preferences, logs, safety, activeSession, activePlan } = useApp();
  const plan = matchProgram(preferences);
  const done = logs.length;
  const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekly = logs.filter((log) => new Date(log.date).getTime() >= weekCutoff).length;

  // Next up day in the schedule
  const currentDayIndex =
    plan && activePlan && activePlan.programId === plan.id ? activePlan.currentDayIndex : 0;
  const nextWorkoutDay = plan?.weekSchedule[currentDayIndex] || plan?.weekSchedule[0];

  const hasActiveSession = !!activeSession;

  const openLink =
    safety === 'yes' || safety === 'prefer'
      ? '/onboarding'
      : safety === 'no'
      ? hasActiveSession
        ? '/session'
        : plan
        ? '/session'
        : '/plan'
      : '/onboarding';

  const cta =
    safety === 'yes' || safety === 'prefer'
      ? 'safetyStart'
      : safety === 'no'
      ? hasActiveSession
        ? 'resumeWorkout'
        : plan
        ? 'startWorkout'
        : 'resume'
      : 'start';

  return (
    <div className="animate-in">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow hero-brand">
            <Leaf size={15} />
            {t('tagline')}
          </div>
          <h1>{t('welcome')}</h1>
          <p>{t('homeIntro')}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href={openLink} className="button primary" data-testid="link-home-primary">
              {t(cta)}
              <ArrowRight size={17} />
            </Link>
            {safety === 'no' && plan && (
              <Link href="/plan" className="button outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} data-testid="link-home-view-plan">
                {t('resume')}
              </Link>
            )}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <Activity size={58} strokeWidth={1.1} />
        </div>
      </section>

      <div className="section-heading">
        <div>
          <h2>{t('thisWeek')}</h2>
          <p>{t('weekNote')}</p>
        </div>
        <Link className="text-link" href="/progress" data-testid="link-home-progress">
          {t('progress')}
          <ArrowUpRight size={15} />
        </Link>
      </div>

      <div className="home-grid">
        <section className="panel" data-testid="panel-week-summary">
          <div className="panel-head">
            <h3 className="panel-title">
              {plan
                ? t(
                    plan.id === 'steady-start'
                      ? 'goalMove'
                      : plan.id === 'strength-foundations'
                      ? 'goalStrength'
                      : 'goalMobility'
                  )
                : t('nextSteps')}
            </h3>
            <span className="pill">
              <Sparkles size={13} />
              {safety === 'no' && plan ? t('matchLabel') : t('starterLabel')}
            </span>
          </div>

          {plan && nextWorkoutDay && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#eef5f0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a5444' }}>
                {t('dayNext')}: {nextWorkoutDay.title[lang]}
              </span>
              <span className="pill subtle" style={{ fontSize: 11 }}>
                {nextWorkoutDay.workoutExercises.length} {t('libraryCount')}
              </span>
            </div>
          )}

          <div className="metric-row">
            <div className="metric">
              <strong data-testid="value-total-sessions">{done}</strong>
              <span>{t('sessions')}</span>
            </div>
            <div className="metric">
              <strong data-testid="value-week-sessions">{weekly}</strong>
              <span>{t('streak')}</span>
            </div>
            <div className="metric">
              <strong data-testid="value-total-minutes">
                {logs.reduce(
                  (n, l) =>
                    n +
                    (programs
                      .find((p) => p.id === l.sessionId)
                      ?.exercises.reduce(
                        (m, id) => m + (getExerciseById(id)?.duration || 0),
                        0
                      ) || 0),
                  0
                )}
              </strong>
              <span>{t('minutes')}</span>
            </div>
          </div>
          <div className="day-strip" aria-label={t('days')}>
            {Array.from({ length: 7 }, (_, i) => {
              const date = new Date();
              date.setHours(0, 0, 0, 0);
              date.setDate(date.getDate() - (6 - i));
              const doneThatDay = logs.some(
                (log) => new Date(log.date).toDateString() === date.toDateString()
              );
              const today = date.toDateString() === new Date().toDateString();
              return (
                <span
                  key={date.toISOString()}
                  className={`day-chip ${doneThatDay ? 'done' : ''} ${today ? 'today' : ''}`}
                  data-testid={`value-week-day-${i}`}
                >
                  {new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', {
                    weekday: 'short',
                  }).format(date)}
                </span>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <h3 className="panel-title">{t('nextSteps')}</h3>
            <Waves size={20} color="#4d8a6b" />
          </div>
          <div className="why-list">
            <div className="why-item">
              <CheckCircle2 size={17} />
              <span>
                <b>{t('stepOne')}</b>
                <br />
                {t('stepOneText')}
              </span>
            </div>
            <div className="why-item">
              <CheckCircle2 size={17} />
              <span>
                <b>{t('stepTwo')}</b>
                <br />
                {t('stepTwoText')}
              </span>
            </div>
            <div className="why-item">
              <CheckCircle2 size={17} />
              <span>
                <b>{t('stepThree')}</b>
                <br />
                {t('stepThreeText')}
              </span>
            </div>
          </div>
        </section>
      </div>

      {preferences && safety === 'no' && plan && (
        <div className="section-heading">
          <h2>{t('planHeading')}</h2>
          <Link className="text-link" href="/plan" data-testid="link-home-plan">
            {t('resume')}
            <ChevronRight size={16} />
          </Link>
        </div>
      )}
      {safety === 'yes' || safety === 'prefer' ? (
        <div className="notice" style={{ marginTop: 19 }}>
          <HeartHandshake size={19} />
          <div>
            <strong>{t('safetyPauseTitle')}</strong>
            {t('safetyPauseBody')}
          </div>
        </div>
      ) : null}
      <div style={{ marginTop: 18 }}>
        <Disclosure />
      </div>
    </div>
  );
}

function OnboardingPage() {
  const { t, lang, preferences, savePreferences, setSafety, toast } = useApp();
  const [step, setStep] = useState(0);
  const [safe, setSafe] = useState<Safety | null>(null);
  const [draft, setDraft] = useState<Preferences>(preferences || defaults);
  const goalOptions: Goal[] = ['get-moving', 'build-strength', 'feel-mobile'];
  const update = (partial: Partial<Preferences>) =>
    setDraft((current) => ({ ...current, ...partial }));
  const finish = () => {
    if (!safe) return;
    setSafety(safe);
    savePreferences(draft);
    toast(t('saved'));
  };
  const [, setPath] = useLocation();

  return (
    <div className="animate-in">
      <div className="page-head">
        <div className="eyebrow">
          <Sparkles size={14} />
          {t('tagline')}
        </div>
        <h1 className="page-title">{t('onboarding')}</h1>
        <p className="page-subtitle">{t('onboardIntro')}</p>
      </div>
      <section className="form-card">
        <div className="stepper" aria-label={`${step + 1} / 3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ display: 'contents' }}>
              <span className={`step-dot ${step >= i ? 'active' : ''}`}>
                {step > i ? <Check size={14} /> : i + 1}
              </span>
              {i < 2 && <span className="step-line" />}
            </span>
          ))}
        </div>
        {step === 0 && (
          <div>
            <h2 className="form-title">{t('safetyTitle')}</h2>
            <p className="form-hint">{t('safetyHint')}</p>
            <div className="safety-options">
              {(['no', 'yes', 'prefer'] as Safety[]).map((value) => (
                <button
                  type="button"
                  key={value}
                  className={`safety-option ${safe === value ? 'selected' : ''}`}
                  onClick={() => setSafe(value)}
                  data-testid={`button-safety-${value}`}
                  aria-pressed={safe === value}
                >
                  <span className="radio-dot" />
                  <span>
                    <strong>
                      {t(value === 'no' ? 'safeNo' : value === 'yes' ? 'safeYes' : 'safePrefer')}
                    </strong>
                    <span>
                      {t(value === 'no' ? 'safeNoDesc' : value === 'yes' ? 'safePause' : 'safePreferDesc')}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 className="form-title">{t('stepGoal')}</h2>
            <p className="form-hint">{t('goalHint')}</p>
            <div className="option-grid">
              {goalOptions.map((goal) => (
                <button
                  type="button"
                  className={`option ${draft.goal === goal ? 'selected' : ''}`}
                  key={goal}
                  onClick={() => update({ goal })}
                  aria-pressed={draft.goal === goal}
                  data-testid={`button-goal-${goal}`}
                >
                  <strong>{t(goalKey(goal))}</strong>
                  <span>
                    {t(
                      goal === 'get-moving'
                        ? 'goalMoveDesc'
                        : goal === 'build-strength'
                        ? 'goalStrengthDesc'
                        : 'goalMobilityDesc'
                    )}
                  </span>
                </button>
              ))}
            </div>
            <label className="field-label" htmlFor="experience">
              {t('experience')}
            </label>
            <select
              id="experience"
              className="select-control"
              value={draft.experience}
              onChange={(e) => update({ experience: e.target.value as Level })}
              data-testid="select-experience"
            >
              <option value="new">{t('new')}</option>
              <option value="some">{t('some')}</option>
            </select>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="form-title">
              {lang === 'ar' ? 'اجعل الروتين مناسباً لك' : 'Shape a routine that fits'}
            </h2>
            <p className="form-hint">{t('onboardIntro')}</p>
            <label className="field-label" htmlFor="location">
              {t('location')}
            </label>
            <select
              id="location"
              className="select-control"
              value={draft.location}
              onChange={(e) => update({ location: e.target.value as LocationChoice })}
              data-testid="select-location"
            >
              <option value="home">{t('homeLoc')}</option>
              <option value="outdoors">{t('outdoors')}</option>
              <option value="gym">{t('gym')}</option>
            </select>
            <label className="field-label" htmlFor="equipment">
              {t('equipment')}
            </label>
            <select
              id="equipment"
              className="select-control"
              value={draft.equipment}
              onChange={(e) => update({ equipment: e.target.value as Equipment })}
              data-testid="select-equipment"
            >
              <option value="none">{t('none')}</option>
              <option value="basic">{t('basic')}</option>
              <option value="gym">{t('gym')}</option>
            </select>
            <label className="field-label" htmlFor="days">
              {t('days')}
            </label>
            <select
              id="days"
              className="select-control"
              value={draft.daysPerWeek}
              onChange={(e) => update({ daysPerWeek: Number(e.target.value) })}
              data-testid="select-days"
            >
              {[2, 3, 4, 5].map((n) => (
                <option value={n} key={n}>
                  {n}
                </option>
              ))}
            </select>
            <label className="field-label" htmlFor="minutes">
              {t('minutesChoice')}
            </label>
            <select
              id="minutes"
              className="select-control"
              value={draft.sessionMinutes}
              onChange={(e) => update({ sessionMinutes: Number(e.target.value) })}
              data-testid="select-session-minutes"
            >
              {[15, 20, 25, 30, 40].map((n) => (
                <option value={n} key={n}>
                  {n} {t('duration')}
                </option>
              ))}
            </select>
            <p className="form-hint" style={{ marginTop: 15 }}>
              {t('equipmentFit')}
            </p>
          </div>
        )}
        <div className="form-actions">
          {step > 0 ? (
            <button
              type="button"
              className="button outline"
              onClick={() => setStep(step - 1)}
              data-testid="button-onboarding-back"
            >
              <ArrowLeft size={16} />
              {t('back')}
            </button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <button
              type="button"
              disabled={step === 0 && !safe}
              className="button dark"
              onClick={() => {
                if (step === 0 && safe && safe !== 'no') {
                  setSafety(safe);
                  setPath('/');
                  return;
                }
                setStep(step + 1);
              }}
              data-testid="button-onboarding-next"
            >
              {t('next')}
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="button dark"
              disabled={!safe}
              onClick={() => {
                finish();
                setPath(safe === 'yes' || safe === 'prefer' ? '/' : '/plan');
              }}
              data-testid="button-onboarding-finish"
            >
              {t('finish')}
              <Check size={16} />
            </button>
          )}
        </div>
      </section>
      <div style={{ maxWidth: 800, marginTop: 16 }}>
        <Disclosure />
      </div>
    </div>
  );
}

function PlanPage() {
  const { t, lang, preferences, safety, completeSession, activePlan, activeSession } = useApp();
  const [, setPath] = useLocation();
  const plan = matchProgram(preferences);
  const totalMinutes = plan ? getProgramEstimatedDuration(plan) : 0;

  const currentDayIndex =
    plan && activePlan && activePlan.programId === plan.id ? activePlan.currentDayIndex : 0;
  const nextWorkoutDay = plan?.weekSchedule[currentDayIndex] || plan?.weekSchedule[0];

  return (
    <div className="animate-in">
      <div className="page-head page-head-row">
        <div>
          <div className="eyebrow">
            <Sparkles size={14} />
            {t('matchLabel')}
          </div>
          <h1 className="page-title">{t('planHeading')}</h1>
          <p className="page-subtitle">{t('planSubtitle')}</p>
        </div>
        {preferences && (
          <button
            className="button outline small"
            type="button"
            onClick={() => setPath('/onboarding')}
            data-testid="button-edit-preferences"
          >
            {t('editPrefs')}
          </button>
        )}
      </div>

      {safety === null ? (
        <div className="notice" data-testid="status-plan-safety">
          <HeartHandshake size={20} />
          <div>
            <strong>{t('safetyTitle')}</strong>
            {t('safetyHint')}
            <div style={{ marginTop: 14 }}>
              <Link href="/onboarding" className="button dark small" data-testid="link-plan-safety">
                {t('safetyStart')}
              </Link>
            </div>
          </div>
        </div>
      ) : safety !== 'no' ? (
        <div className="notice" data-testid="status-plan-safety">
          <HeartHandshake size={20} />
          <div>
            <strong>{t('safetyPauseTitle')}</strong>
            {t('safetyPauseBody')}
            <div style={{ marginTop: 14 }}>
              <Link href="/onboarding" className="button dark small" data-testid="link-plan-safety">
                {t('safetyStart')}
              </Link>
            </div>
          </div>
        </div>
      ) : !preferences ? (
        <div className="empty-state" data-testid="status-plan-no-preferences">
          <CircleHelp size={28} />
          <h3>{t('noPrefs')}</h3>
          <Link href="/onboarding" className="button dark" data-testid="link-plan-setup">
            {t('start')}
          </Link>
        </div>
      ) : !plan ? (
        <div className="empty-state" data-testid="status-plan-no-match">
          <CircleHelp size={30} />
          <h3>{t('noPlanTitle')}</h3>
          <p>{t('noPlanBody')}</p>
          <Link href="/onboarding" className="button dark" data-testid="link-plan-adjust">
            {t('editPrefs')}
          </Link>
        </div>
      ) : (
        <div className="content-grid">
          <div className="stack">
            {/* Featured Plan Card */}
            <section className="plan-card featured" data-testid={`card-plan-${plan.id}`}>
              <span className="pill">
                <Sparkles size={13} />
                {t('starterLabel')}
              </span>
              <h2 className="plan-title">{plan.title[lang]}</h2>
              <p>{plan.description[lang] || t('goalHint')}</p>
              <div className="plan-meta">
                <span className="pill">
                  <Clock3 size={13} />
                  {totalMinutes} {t('duration')}
                </span>
                <span className="pill">
                  <Activity size={13} />
                  {plan.daysPerWeek} {t('perWeek')}
                </span>
                <span className="pill">
                  <Zap size={13} />
                  {t(plan.level === 'new' ? 'new' : 'some')}
                </span>
              </div>

              {/* Next Workout Callout */}
              {nextWorkoutDay && (
                <div style={{ margin: '16px 0', padding: '14px', background: 'rgba(255,255,255,0.12)', borderRadius: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#c7e2d0' }}>
                    {t('dayNext')}
                  </div>
                  <strong style={{ fontSize: 16, display: 'block', marginTop: 3 }}>
                    {nextWorkoutDay.title[lang]}
                  </strong>
                </div>
              )}

              {/* Exercise preview row */}
              <div className="exercise-list">
                {plan.exercises.map((id, index) => {
                  const item = getExerciseById(id);
                  return item ? (
                    <div className="exercise-row" key={id} data-testid={`row-plan-exercise-${id}`}>
                      <span className="exercise-number">{String(index + 1).padStart(2, '0')}</span>
                      <span>
                        <strong>{item.title[lang]}</strong>
                        <span>
                          {item.duration} {t('duration')} · {item.instructions[lang]}
                        </span>
                      </span>
                    </div>
                  ) : null;
                })}
              </div>

              {/* Interactive Workout Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => setPath('/session')}
                  data-testid="button-start-workout-session"
                >
                  <Play size={17} />
                  {activeSession ? t('resumeWorkout') : t('startWorkout')}
                </button>

                <button
                  type="button"
                  className="button outline"
                  style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                  onClick={() => completeSession(plan.id)}
                  data-testid="button-complete-session"
                >
                  <CheckCircle2 size={16} />
                  {t('completeSession')}
                </button>
              </div>
            </section>

            {/* Weekly Schedule Breakdown */}
            {plan.weekSchedule && plan.weekSchedule.length > 0 && (
              <section className="schedule-section" data-testid="section-weekly-schedule">
                <h3 className="schedule-heading">{t('weeklySchedule')}</h3>
                <div className="schedule-days-grid">
                  {plan.weekSchedule.map((day, idx) => {
                    const isNext = idx === currentDayIndex;
                    return (
                      <article
                        key={day.dayIndex}
                        className={`schedule-day-card ${isNext ? 'is-active-day' : ''}`}
                        data-testid={`card-schedule-day-${idx}`}
                      >
                        <div className="schedule-day-header">
                          <h4 className="schedule-day-name">{day.title[lang]}</h4>
                          {isNext && <span className="pill">{t('dayNext')}</span>}
                        </div>

                        <div className="schedule-day-exercises">
                          {day.workoutExercises.map((we) => {
                            const ex = getExerciseById(we.exerciseId);
                            if (!ex) return null;
                            const isTimed = we.durationSeconds !== null && we.durationSeconds > 0;

                            return (
                              <div className="schedule-ex-row" key={we.exerciseId}>
                                <span className="schedule-ex-title">{ex.title[lang]}</span>
                                <span className="schedule-ex-meta">
                                  {isTimed
                                    ? `${Math.round((we.durationSeconds || 0) / 60)} ${t('duration')}`
                                    : `${we.sets} × ${we.reps} ${t('reps')}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <Disclosure />
          </div>

          <aside className="plan-card">
            <div className="eyebrow">
              <CheckCircle2 size={14} />
              {t('whyTitle')}
            </div>
            <h2 className="plan-title">{t('matchLabel')}</h2>
            <p>{t('planSubtitle')}</p>
            <div className="why-list">
              {['whyGoal', 'whyLevel', 'whyDays', 'whyGear', 'whyDuration'].map((k) => (
                <div className="why-item" key={k}>
                  <CheckCircle2 size={16} />
                  <span>{t(k)}</span>
                </div>
              ))}
              <div className="why-item">
                <CheckCircle2 size={16} />
                <span>
                  {lang === 'ar'
                    ? 'تتوافق الخطة مع المكان الذي اخترته.'
                    : 'It matches the setting you selected.'}
                </span>
              </div>
            </div>
            <div style={{ marginTop: 22 }} className="disclosure">
              <Info size={16} />
              <span>{t('advice')}</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function LibraryPage() {
  const { t, lang } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const categories = ['all', 'strength', 'cardio', 'mobility'];
  const filtered = useMemo(
    () =>
      exercises.filter(
        (item) =>
          (filter === 'all' || item.category === filter) &&
          `${item.title.en} ${item.title.ar} ${item.instructions.en} ${item.instructions.ar}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase())
      ),
    [filter, query]
  );

  return (
    <div className="animate-in">
      <div className="page-head">
        <div className="eyebrow">
          <BookOpen size={14} />
          {t('library')}
        </div>
        <h1 className="page-title">{t('libraryTitle')}</h1>
        <p className="page-subtitle">{t('libraryIntro')}</p>
      </div>
      <div className="search-row">
        <div className="search-wrap">
          <Search size={18} />
          <input
            className="search-control"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search')}
            aria-label={t('search')}
            data-testid="input-exercise-search"
          />
        </div>
      </div>
      <div className="filters" role="group" aria-label={t('library')} data-testid="group-exercise-filters">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`filter-chip ${filter === category ? 'active' : ''}`}
            onClick={() => setFilter(category)}
            aria-pressed={filter === category}
            data-testid={`button-filter-${category}`}
          >
            {t(category)}
          </button>
        ))}
      </div>
      <p className="form-hint" data-testid="value-library-count">
        {filtered.length} {t('libraryCount')}
      </p>
      {filtered.length ? (
        <div className="library-grid">
          {filtered.map((item) => (
            <article className="exercise-card" key={item.id} data-testid={`card-exercise-${item.id}`}>
              <span className="pill">
                <Dumbbell size={13} />
                {t(item.category)}
              </span>
              <h3>{item.title[lang]}</h3>
              <p>{item.instructions[lang]}</p>
              <footer>
                <span>
                  {item.duration} {t('duration')}
                </span>
                <span>{t('starterLabel')}</span>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state" data-testid="status-library-empty">
          <Search size={28} />
          <h3>{t('noResults')}</h3>
          <p>{t('noResultsText')}</p>
          <button
            className="button outline small"
            onClick={() => {
              setQuery('');
              setFilter('all');
            }}
            data-testid="button-clear-exercise-filters"
          >
            {t('all')}
          </button>
        </div>
      )}
      <div style={{ marginTop: 22 }}>
        <Disclosure />
      </div>
    </div>
  );
}

function ProgressPage() {
  const { t, lang, logs, sessions } = useApp();
  const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = logs.filter((log) => new Date(log.date).getTime() >= lastWeek).length;

  const minutesFromLogs = logs.reduce(
    (sum, log) =>
      sum +
      (programs
        .find((p) => p.id === log.sessionId)
        ?.exercises.reduce((m, id) => m + (getExerciseById(id)?.duration || 0), 0) || 0),
    0
  );

  const formattedDate = (value: string) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar' : 'en', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));

  return (
    <div className="animate-in">
      <div className="page-head">
        <div className="eyebrow">
          <TrendingUp size={14} />
          {t('progress')}
        </div>
        <h1 className="page-title">{t('progressTitle')}</h1>
        <p className="page-subtitle">{t('progressIntro')}</p>
      </div>
      <section className="progress-hero">
        <div>
          <div className="eyebrow">
            <Activity size={14} />
            {t('thisWeek')}
          </div>
          <h2 className="plan-title">{t('weekNote')}</h2>
          <div className="metric-row">
            <div className="metric">
              <strong data-testid="value-progress-total">{logs.length}</strong>
              <span>{t('totalSessions')}</span>
            </div>
            <div className="metric">
              <strong data-testid="value-progress-recent">{recent}</strong>
              <span>{t('lastSeven')}</span>
            </div>
            <div className="metric">
              <strong data-testid="value-progress-minutes">{minutesFromLogs}</strong>
              <span>{t('totalMinutes')}</span>
            </div>
          </div>
        </div>
        <div className="progress-count" data-testid="value-progress-ring">
          {recent}
          <small>{t('lastSeven')}</small>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <h2>{t('history')}</h2>
          <p>{t('progressIntro')}</p>
        </div>
      </div>

      {logs.length ? (
        <div className="history-list">
          {logs.map((log) => {
            const program = programs.find((p) => p.id === log.sessionId);
            const detailedSession = sessions.find((s) => s.id === log.id || s.date === log.date);
            const mins = detailedSession?.totalMinutes ||
              program?.exercises.reduce((n, id) => n + (getExerciseById(id)?.duration || 0), 0) ||
              0;

            return (
              <article
                className="history-row"
                key={log.id}
                data-testid={`row-workout-log-${log.id}`}
              >
                <span className="history-date">{formattedDate(log.date)}</span>
                <span className="history-info">
                  <strong>
                    {program?.title[lang] || t('starterLabel')}
                    {detailedSession && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#447864', marginInlineStart: 8 }}>
                        · {detailedSession.dayTitle[lang]}
                      </span>
                    )}
                  </strong>
                  <span>
                    {mins} {t('duration')} · {t('completedBadge')}
                  </span>
                </span>
                <CheckCircle2 size={20} color="#438465" />
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state" data-testid="status-progress-empty">
          <TrendingUp size={30} />
          <h3>{t('emptyTitle')}</h3>
          <p>{t('emptyText')}</p>
          <Link href="/plan" className="button dark" data-testid="link-progress-plan">
            {t('goPlan')}
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <div style={{ marginTop: 22 }}>
        <Disclosure />
      </div>
    </div>
  );
}

function PrivacyPage() {
  const { t, lang, clearData } = useApp();
  const [, setPath] = useLocation();
  const clear = () => {
    if (window.confirm(t('clearConfirm'))) {
      clearData();
      setPath('/');
    }
  };

  return (
    <div className="animate-in">
      <div className="page-head">
        <div className="eyebrow">
          <ShieldCheck size={14} />
          {t('privacy')}
        </div>
        <h1 className="page-title">{t('privacyTitle')}</h1>
        <p className="page-subtitle">{t('privacyIntro')}</p>
      </div>
      <section className="privacy-card">
        <div className="privacy-row">
          <span className="privacy-icon">
            <LockKeyhole size={18} />
          </span>
          <span>
            <h3>{t('localTitle')}</h3>
            <p>
              {lang === 'ar'
                ? 'تُخزن اللغة وتفضيلات التمرين وسجل الجلسات المكتملة في هذا المتصفح على هذا الجهاز. لا تنشئ KinevoX حساباً ولا ترسل هذه البيانات إلى خادم للتطبيق أو خدمة لياقة خارجية.'
                : 'Your language, exercise preferences, and completed-session log are stored in this browser on this device. KinevoX does not create an account or send this data to an app backend or external fitness service.'}
            </p>
          </span>
        </div>
        <div className="privacy-row">
          <span className="privacy-icon">
            <HeartHandshake size={18} />
          </span>
          <span>
            <h3>{t('healthTitle')}</h3>
            <p>{t('healthBody')}</p>
          </span>
        </div>
        <div className="privacy-row">
          <span className="privacy-icon">
            <Info size={18} />
          </span>
          <span>
            <h3>{t('demoTitle')}</h3>
            <p>{t('demoBody')}</p>
          </span>
        </div>
        <div className="danger-zone">
          <h3>{t('clearTitle')}</h3>
          <p>{t('clearBody')}</p>
          <button
            type="button"
            className="button small"
            style={{ background: '#a64e3e' }}
            onClick={clear}
            data-testid="button-clear-all-data"
          >
            <Trash2 size={15} />
            {t('clearAction')}
          </button>
        </div>
      </section>
      <div style={{ maxWidth: 840, marginTop: 16 }}>
        <Disclosure />
      </div>
    </div>
  );
}

function SessionRouteWrapper() {
  const {
    preferences,
    activePlan,
    activeSession,
    lang,
    updateActiveSession,
    completeWorkoutSession,
  } = useApp();

  const program = matchProgram(preferences);
  const currentDayIndex =
    activeSession?.dayIndex ??
    (program && activePlan && activePlan.programId === program.id ? activePlan.currentDayIndex : 0);

  return (
    <WorkoutSessionPage
      program={program}
      dayIndex={currentDayIndex}
      lang={lang}
      activeSession={activeSession}
      onUpdateSession={updateActiveSession}
      onSessionCompleted={completeWorkoutSession}
    />
  );
}

function NotFoundPage() {
  const { t } = useApp();
  return (
    <div className="not-found">
      <div>
        <h1>404</h1>
        <p>{t('notFound')}</p>
        <Link className="button dark" href="/" data-testid="link-not-found-home">
          {t('returnHome')}
        </Link>
      </div>
    </div>
  );
}

function AuthRouteWrapper() {
  const { lang } = useApp();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setLocation('/profile');
    }
  }, [user, setLocation]);

  return (
    <AuthPage
      lang={lang}
      onGuestContinue={() => setLocation('/')}
    />
  );
}

function ProfileRouteWrapper() {
  const { lang, preferences, logs, sessions, clearData } = useApp();
  return (
    <ProfilePage
      lang={lang}
      preferences={preferences}
      logs={logs}
      sessions={sessions}
      onClearData={clearData}
    />
  );
}

function RoutedPages() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/plan" component={PlanPage} />
      <Route path="/session" component={SessionRouteWrapper} />
      <Route path="/exercises" component={LibraryPage} />
      <Route path="/progress" component={ProgressPage} />
      <Route path="/auth" component={AuthRouteWrapper} />
      <Route path="/profile" component={ProfileRouteWrapper} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  return (
    <AppShell>
      <RoutedPages />
    </AppShell>
  );
}

export default App;
