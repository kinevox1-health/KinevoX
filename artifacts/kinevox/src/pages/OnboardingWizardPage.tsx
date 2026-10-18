/**
 * KinevoX — Smart Extended Onboarding Wizard for Beginners
 *
 * Comprehensive, intuitive, beginner-friendly questionnaire:
 * - Step 0: Safety & Joint Readiness
 * - Step 1: Fitness Goal & Motivation
 * - Step 2: Activity Level & Past Experience
 * - Step 3: Intensity & Effort Preference
 * - Step 4: Workout Location & Equipment
 * - Step 5: Schedule & Session Time
 * - Step 6: Smart Match Reveal with tailored compatibility score
 */

import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  Activity,
  Dumbbell,
  Compass,
  Clock,
  Calendar,
  Check,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Zap,
  Leaf,
  SunMedium,
  Sunset,
  Sunrise,
  Smile,
  Shield,
  HelpCircle,
} from 'lucide-react';
import type {
  Lang,
  Goal,
  Level,
  LocationChoice,
  Equipment,
  Safety,
  ActivityLevel,
  IntensityPreference,
  JointFocus,
  PreferredTime,
  Preferences,
} from '../data/types';
import {
  matchProgramWithDetails,
  type ProgramMatchResult,
} from '../services/recommendationService';

/* ── Bilingual Copy ─────────────────────────────────────────── */

const copy: Record<string, Record<Lang, string>> = {
  wizardTitle: { en: 'Personalize Your Starting Plan', ar: 'صمم خطة انطلاقتك المناسبة' },
  wizardSubtitle: {
    en: 'Answer a few quick questions to receive a tailored routine that matches your body and daily rhythm.',
    ar: 'أجب عن أسئلة بسيطة للحصول على روتين تدريبي مخصص يتناسب تماماً مع جسمك ويومك.',
  },
  stepIndicator: { en: 'Step', ar: 'الخطوة' },
  of: { en: 'of', ar: 'من' },
  next: { en: 'Continue', ar: 'متابعة' },
  back: { en: 'Back', ar: 'رجوع' },
  finish: { en: 'Activate My Plan', ar: 'اعتماد الخطة والبدء' },

  // Step 0: Safety & Joint Care
  safetyHeading: { en: 'Health & Joint Readiness', ar: 'السلامة والجاهزية البدنية' },
  safetySubtitle: {
    en: 'Your well-being comes first. Do you have any condition, injury, or medical guidance that affects exercise?',
    ar: 'سلامتك هي الأولوية دائماً. هل تعاني من أي حالة طبية، ألم بالمفاصل، أو توجيه صحي يؤثر على الحركة؟',
  },
  safeNo: { en: 'No health restrictions', ar: 'لا توجد قيود صحية' },
  safeNoDesc: { en: 'I feel ready to start moving safely.', ar: 'أشعر بالجاهزية للبدء بحركة آمنة.' },
  safeYes: { en: 'Yes, I have limitations', ar: 'نعم، لدي حالة أو قيود' },
  safeYesDesc: { en: 'We recommend consulting a healthcare provider first.', ar: 'يُفضل استشارة مختص رعاية صحية قبل البدء.' },
  safePrefer: { en: 'Prefer not to answer', ar: 'أفضل عدم الإجابة' },
  safePreferDesc: { en: 'We will not suggest an active workout plan.', ar: 'لن نقترح خطة تمارين نشطة.' },
  jointCareTitle: { en: 'Any specific joint care preference?', ar: 'هل تفضل رعاية خاصة بالمفاصل؟' },
  jointGeneral: { en: 'Standard Movements', ar: 'حركات قياسية عامة' },
  jointGeneralDesc: { en: 'Natural body movements with balanced flexibility.', ar: 'حركات طبيعية متوازنة لكامل الجسم.' },
  jointLowImpact: { en: 'Low-Impact (Knee & Ankle Friendly)', ar: 'منخفض الجهد (صديق للركبتين)' },
  jointLowImpactDesc: { en: 'Zero jumping, gentle on joints and feet.', ar: 'بدون أي قفز، لطيف تماماً على الركب والأقدام.' },
  jointBackFriendly: { en: 'Back & Core Focus', ar: 'صديق للظهر والعمود الفقري' },
  jointBackFriendlyDesc: { en: 'Supportive posture and core strengthening.', ar: 'تمارين داعمة لاستقامة القوام وعضلات الظهر.' },

  // Step 1: Goal
  goalHeading: { en: 'What is your primary focus?', ar: 'ما هو هدفك الأساسي الآن؟' },
  goalSubtitle: {
    en: 'There is no wrong starting point. Pick what feels most rewarding right now.',
    ar: 'لا توجد بداية خاطئة. اختر ما يُشعرك بأكبر حافز وراحة اليوم.',
  },
  goalMove: { en: 'Move More & Beat Sedentary', ar: 'زيادة الحركة ومحاربة الخمول' },
  goalMoveDesc: { en: 'Build daily energy and break the sitting habit comfortably.', ar: 'استعادة النشاط اليومي وكسر روتين الجلوس الطويل بلطف.' },
  goalStrength: { en: 'Build Functional Strength', ar: 'بناء القوة الوظيفية اليومية' },
  goalStrengthDesc: { en: 'Strengthen core muscles and make daily tasks easier.', ar: 'تقوية العضلات الأساسية وتسهيل حمل الأشياء والأنشطة اليومية.' },
  goalMobility: { en: 'Flexibility & Joint Mobility', ar: 'مرونة وفك تشنجات الجسم' },
  goalMobilityDesc: { en: 'Relieve muscle tightness and improve overall posture.', ar: 'فك تيبس العضلات والمفاصل وتحسين مرونة القوام والتنفس.' },

  // Step 2: Activity & Experience
  activityHeading: { en: 'Your Current Daily Rhythm', ar: 'مستوى نشاطك اليومي الحالي' },
  activitySubtitle: {
    en: 'How much do you typically move on an average day?',
    ar: 'كيف تصف حركتك المعتادة في يومك العادي؟',
  },
  actSedentary: { en: 'Mostly Sedentary', ar: 'قليل الحركة (جلوس طويل)' },
  actSedentaryDesc: { en: 'Desk work, driving, sitting most of the day.', ar: 'أقضي معظم ساعات اليوم جالساً في العمل أو السيارة.' },
  actLight: { en: 'Light Everyday Activity', ar: 'حركة يومية خفيفة' },
  actLightDesc: { en: 'Occasional walks, errands, and house chores.', ar: 'مشي متقطع، مهام منزلية، وتسوق خفيف.' },
  actModerate: { en: 'Moderately Active', ar: 'نشاط بدني متوسط' },
  actModerateDesc: { en: 'Regular walking or occasional recreational exercise.', ar: 'مشي منتظم أو ممارسة بعض التمارين أسبوعياً.' },
  expHeading: { en: 'Exercise Experience', ar: 'خبرتك السابقة مع التمارين' },
  expNew: { en: 'New to fitness routines', ar: 'مبتدئ جديد في التمارين' },
  expNewDesc: { en: 'I want simple, gentle guidance from scratch.', ar: 'أريد إرشادات واضحة وبداية مريحة خطوة بخطوة.' },
  expSome: { en: 'I’ve exercised before', ar: 'لدي تجربة سابقة' },
  expSomeDesc: { en: 'Looking to restart or stay consistent.', ar: 'أرغب في استعادة لياقتي والالتزام بروتين منتظم.' },

  // Step 3: Intensity & Effort
  intensityHeading: { en: 'Desired Effort & Pace', ar: 'مستوى الجهد والشدة المرغوب' },
  intensitySubtitle: {
    en: 'How hard do you want your starter sessions to feel?',
    ar: 'ما الإيقاع ومستوى التحدي الذي تفضله في جلساتك؟',
  },
  intGentle: { en: 'Gentle & Relaxed', ar: 'هادئ ومريح (جهد خفيف)' },
  intGentleDesc: { en: 'Comfortable breathing, low fatigue, focus on showing up.', ar: 'تنفس مريح، دون إجهاد، والتركيز على الاستمرارية السهلة.' },
  intBalanced: { en: 'Balanced & Steady', ar: 'معتدل ومتوازن' },
  intBalancedDesc: { en: 'A pleasant, moderate challenge that leaves you energized.', ar: 'تحدٍ معتدل وممتع يُشعرك بالإنجاز دون استنزاف طاقتك.' },
  intInvigorating: { en: 'Active & Energizing', ar: 'نشط ومحفز للطاقة' },
  intInvigoratingDesc: { en: 'Progressive challenge to build stamina and strength.', ar: 'تحدٍ تصاعدي لرفع النبض وبناء القوة والتحمل البدني.' },

  // Step 4: Environment & Equipment
  envHeading: { en: 'Where & What You’ll Use', ar: 'المكان والمعدات المتوفرة' },
  envSubtitle: {
    en: 'KinevoX adapts seamlessly to your actual setup.',
    ar: 'يتكيف KinevoX تلقائياً مع بيئتك والمعدات المتوفرة لديك.',
  },
  locHome: { en: 'At Home', ar: 'في المنزل' },
  locHomeDesc: { en: 'Living room, bedroom, or private space.', ar: 'مساحة مريحة في غرفتك أو الصالة.' },
  locOutdoors: { en: 'Outdoors', ar: 'في الهواء الطلق' },
  locOutdoorsDesc: { en: 'Park, backyard, or walking path.', ar: 'في الحديقة أو مسارات المشي المفتوحة.' },
  locGym: { en: 'At the Gym', ar: 'في النادي الرياضي' },
  locGymDesc: { en: 'Fitness center or dedicated training space.', ar: 'في الصالة الرياضية أو مركز اللياقة.' },
  equipHeading: { en: 'Available Equipment', ar: 'المعدات المتاحة لديك' },
  equipNone: { en: 'No Equipment (Bodyweight)', ar: 'بدون أي معدات (وزن الجسم)' },
  equipNoneDesc: { en: 'Just your body and a chair or wall.', ar: 'وزن جسمك فقط مع كرسي أو جدار للمساندة.' },
  equipBasic: { en: 'Basic Gear (Bands / Mat / Light Weights)', ar: 'أدوات أساسية (شريط مقاومة / سجادة / أوزان خفيفة)' },
  equipBasicDesc: { en: 'Simple, versatile home equipment.', ar: 'أدوات منزلية مريحة ومرنة.' },
  equipGym: { en: 'Full Gym Setup', ar: 'تجهيزات نادي كاملة' },
  equipGymDesc: { en: 'Dumbbells, machines, and diverse gear.', ar: 'دمبلز، أجهزة، ومعدات تدريب متنوعة.' },

  // Step 5: Schedule & Time
  scheduleHeading: { en: 'Your Weekly Rhythm', ar: 'جدولك والوقت المتاح' },
  scheduleSubtitle: {
    en: 'Consistency beats intensity. Choose a rhythm you can comfortably maintain.',
    ar: 'الاستمرارية أهم بكثير من الشدة. اختر جدولاً يمكنك الالتزام به براحة.',
  },
  daysLabel: { en: 'Workout Days per Week', ar: 'عدد أيام التمرين أسبوعياً' },
  daysTip: { en: '3 days is ideal for building sustainable momentum.', ar: '3 أيام هو الخيار المثالي لبناء العادة والاستمرارية.' },
  minutesLabel: { en: 'Session Length', ar: 'مدة الجلسة التدريبية' },
  minutesUnit: { en: 'minutes', ar: 'دقيقة' },
  timeLabel: { en: 'Preferred Time of Day', ar: 'الوقت المفضل للتمرين' },
  timeMorning: { en: 'Morning', ar: 'صباحاً' },
  timeAfternoon: { en: 'Afternoon', ar: 'بعد الظهر' },
  timeEvening: { en: 'Evening', ar: 'مساءً' },

  // Step 6: Recommendation Reveal
  matchHeading: { en: 'Your Tailored Routine is Ready', ar: 'خطتك التدريبية المخصصة جاهزة!' },
  matchSubtitle: {
    en: 'Here is why this starter plan was matched to your answers.',
    ar: 'إليك كيف توافقت هذه الخطة بدقة مع تفضيلاتك وجدولك اليومي.',
  },
  matchScoreLabel: { en: 'Compatibility Match', ar: 'نسبة التوافق' },
  whyFitTitle: { en: 'Why this routine fits you:', ar: 'لماذا تناسبك هذه الخطة تحديداً:' },
  scheduleOverview: { en: 'Weekly Schedule Overview', ar: 'نظرة سريعة على جدول الأسبوع' },
  startNowCTA: { en: 'Start Today’s First Session', ar: 'ابدأ تمرين اليوم الأول' },
  viewPlanCTA: { en: 'Explore My Weekly Plan', ar: 'استعراض الخطة الأسبوعية' },

  // Safety Warning Notice
  safetyPauseTitle: { en: 'Let’s pause before planning', ar: 'توقف مؤقت من أجل سلامتك' },
  safetyPauseBody: {
    en: 'Because you selected yes or prefer not to answer, KinevoX will not recommend active workout sessions. We strongly suggest consulting a healthcare professional.',
    ar: 'نظراً لاختيارك نعم أو تفضيل عدم الإجابة، لن تقترح KinevoX خطة تمارين نشطة حالياً. ننصح بشدة باستشارة طبيب أو مختص رعاية صحية.',
  },
};

/* ── Component ──────────────────────────────────────────────── */

interface OnboardingWizardPageProps {
  lang: Lang;
  initialPreferences: Preferences | null;
  initialSafety: Safety | null;
  onSavePreferences: (pref: Preferences) => void;
  onSetSafety: (safety: Safety) => void;
  onComplete: () => void;
}

export function OnboardingWizardPage({
  lang,
  initialPreferences,
  initialSafety,
  onSavePreferences,
  onSetSafety,
  onComplete,
}: OnboardingWizardPageProps) {
  const [, setLocation] = useLocation();

  // Step state (0 to 6)
  const [step, setStep] = useState(0);
  const totalSteps = 7;

  // Form draft state
  const [safety, setLocalSafety] = useState<Safety>(initialSafety || 'no');
  const [jointFocus, setJointFocus] = useState<JointFocus>(
    initialPreferences?.jointFocus || 'general'
  );
  const [goal, setGoal] = useState<Goal>(initialPreferences?.goal || 'get-moving');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    initialPreferences?.activityLevel || 'sedentary'
  );
  const [experience, setExperience] = useState<Level>(
    initialPreferences?.experience || 'new'
  );
  const [intensity, setIntensity] = useState<IntensityPreference>(
    initialPreferences?.intensity || 'gentle'
  );
  const [locationChoice, setLocationChoice] = useState<LocationChoice>(
    initialPreferences?.location || 'home'
  );
  const [equipment, setEquipment] = useState<Equipment>(
    initialPreferences?.equipment || 'none'
  );
  const [daysPerWeek, setDaysPerWeek] = useState<number>(
    initialPreferences?.daysPerWeek || 3
  );
  const [sessionMinutes, setSessionMinutes] = useState<number>(
    initialPreferences?.sessionMinutes || 20
  );
  const [preferredTime, setPreferredTime] = useState<PreferredTime>(
    initialPreferences?.preferredTime || 'morning'
  );

  const t = (key: string) => copy[key]?.[lang] ?? key;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Construct current preferences snapshot
  const currentPreferences: Preferences = useMemo(
    () => ({
      goal,
      experience,
      location: locationChoice,
      equipment,
      daysPerWeek,
      sessionMinutes,
      activityLevel,
      intensity,
      jointFocus,
      preferredTime,
    }),
    [
      goal,
      experience,
      locationChoice,
      equipment,
      daysPerWeek,
      sessionMinutes,
      activityLevel,
      intensity,
      jointFocus,
      preferredTime,
    ]
  );

  // Compute smart match result
  const matchResult: ProgramMatchResult | null = useMemo(() => {
    return matchProgramWithDetails(currentPreferences);
  }, [currentPreferences]);

  // Stepper handlers
  const handleNext = () => {
    if (step === 0 && safety !== 'no') {
      // User flagged a medical concern
      onSetSafety(safety);
      return;
    }
    if (step < totalSteps - 1) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinish = (target: 'session' | 'plan') => {
    onSetSafety(safety);
    onSavePreferences(currentPreferences);
    onComplete();
    setLocation(target === 'session' ? '/session' : '/plan');
  };

  const stepNames: Record<number, string> = {
    0: t('safetyHeading'),
    1: t('goalHeading'),
    2: t('activityHeading'),
    3: t('intensityHeading'),
    4: t('envHeading'),
    5: t('scheduleHeading'),
    6: t('matchHeading'),
  };

  const progressPercent = Math.round(((step + 1) / totalSteps) * 100);

  return (
    <div className="onboarding-wizard animate-in" dir={dir}>
      {/* ── Wizard Header ───────────────────────────────────── */}
      <div className="wizard-top-header">
        <div className="wizard-eyebrow">
          <Sparkles size={15} />
          <span>KinevoX Smart Assessment</span>
        </div>
        <h1 className="wizard-main-title">{t('wizardTitle')}</h1>
        <p className="wizard-subtitle">{t('wizardSubtitle')}</p>

        {/* ── Visual Progress Bar ─────────────────────────────── */}
        <div className="wizard-progress-card">
          <div className="wizard-progress-meta">
            <span className="wizard-step-label">
              {t('stepIndicator')} {step + 1} {t('of')} {totalSteps}:{' '}
              <strong>{stepNames[step]}</strong>
            </span>
            <span className="wizard-percent-label">{progressPercent}%</span>
          </div>
          <div className="wizard-progress-track">
            <div
              className="wizard-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Step Content ────────────────────────────────────── */}
      <section className="wizard-card">
        {/* ── Step 0: Health & Joint Safety ──────────────────── */}
        {step === 0 && (
          <div className="wizard-step-body animate-in">
            <div className="wizard-step-heading">
              <div className="wizard-icon-box">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h2>{t('safetyHeading')}</h2>
                <p>{t('safetySubtitle')}</p>
              </div>
            </div>

            <div className="wizard-options-list">
              {(['no', 'yes', 'prefer'] as Safety[]).map((val) => (
                <button
                  type="button"
                  key={val}
                  className={`wizard-card-option ${safety === val ? 'selected' : ''}`}
                  onClick={() => setLocalSafety(val)}
                  data-testid={`button-wizard-safety-${val}`}
                  aria-pressed={safety === val}
                >
                  <span className="wizard-radio-indicator" />
                  <div className="wizard-option-content">
                    <strong>
                      {t(val === 'no' ? 'safeNo' : val === 'yes' ? 'safeYes' : 'safePrefer')}
                    </strong>
                    <span>
                      {t(val === 'no' ? 'safeNoDesc' : val === 'yes' ? 'safeYesDesc' : 'safePreferDesc')}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {safety === 'no' && (
              <div className="wizard-sub-section animate-in">
                <h3 className="wizard-sub-title">{t('jointCareTitle')}</h3>
                <div className="wizard-grid-options three-col">
                  {[
                    { key: 'general', title: 'jointGeneral', desc: 'jointGeneralDesc', icon: Leaf },
                    { key: 'low-impact', title: 'jointLowImpact', desc: 'jointLowImpactDesc', icon: Shield },
                    { key: 'back-friendly', title: 'jointBackFriendly', desc: 'jointBackFriendlyDesc', icon: Activity },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = jointFocus === item.key;
                    return (
                      <button
                        type="button"
                        key={item.key}
                        className={`wizard-feature-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setJointFocus(item.key as JointFocus)}
                        aria-pressed={isSelected}
                      >
                        <Icon size={20} />
                        <strong>{t(item.title)}</strong>
                        <span>{t(item.desc)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {safety !== 'no' && (
              <div className="notice warning animate-in" style={{ marginTop: 20 }}>
                <HeartHandshake size={20} />
                <div>
                  <strong>{t('safetyPauseTitle')}</strong>
                  <p style={{ margin: '4px 0 0' }}>{t('safetyPauseBody')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 1: Goal & Inspiration ─────────────────────── */}
        {step === 1 && (
          <div className="wizard-step-body animate-in">
            <div className="wizard-step-heading">
              <div className="wizard-icon-box">
                <Compass size={26} />
              </div>
              <div>
                <h2>{t('goalHeading')}</h2>
                <p>{t('goalSubtitle')}</p>
              </div>
            </div>

            <div className="wizard-grid-options three-col">
              {[
                { key: 'get-moving', title: 'goalMove', desc: 'goalMoveDesc', icon: Activity },
                { key: 'build-strength', title: 'goalStrength', desc: 'goalStrengthDesc', icon: Dumbbell },
                { key: 'feel-mobile', title: 'goalMobility', desc: 'goalMobilityDesc', icon: Leaf },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = goal === item.key;
                return (
                  <button
                    type="button"
                    key={item.key}
                    className={`wizard-feature-card large ${isSelected ? 'selected' : ''}`}
                    onClick={() => setGoal(item.key as Goal)}
                    data-testid={`button-wizard-goal-${item.key}`}
                    aria-pressed={isSelected}
                  >
                    <div className="wizard-feature-icon">
                      <Icon size={24} />
                    </div>
                    <strong>{t(item.title)}</strong>
                    <span>{t(item.desc)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 2: Daily Activity & Background ────────────── */}
        {step === 2 && (
          <div className="wizard-step-body animate-in">
            <div className="wizard-step-heading">
              <div className="wizard-icon-box">
                <Activity size={26} />
              </div>
              <div>
                <h2>{t('activityHeading')}</h2>
                <p>{t('activitySubtitle')}</p>
              </div>
            </div>

            <div className="wizard-options-list">
              {[
                { key: 'sedentary', title: 'actSedentary', desc: 'actSedentaryDesc' },
                { key: 'light', title: 'actLight', desc: 'actLightDesc' },
                { key: 'moderate', title: 'actModerate', desc: 'actModerateDesc' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={`wizard-card-option ${activityLevel === item.key ? 'selected' : ''}`}
                  onClick={() => setActivityLevel(item.key as ActivityLevel)}
                  data-testid={`button-wizard-act-${item.key}`}
                  aria-pressed={activityLevel === item.key}
                >
                  <span className="wizard-radio-indicator" />
                  <div className="wizard-option-content">
                    <strong>{t(item.title)}</strong>
                    <span>{t(item.desc)}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="wizard-sub-section" style={{ marginTop: 24 }}>
              <h3 className="wizard-sub-title">{t('expHeading')}</h3>
              <div className="wizard-grid-options two-col">
                {[
                  { key: 'new', title: 'expNew', desc: 'expNewDesc', icon: Smile },
                  { key: 'some', title: 'expSome', desc: 'expSomeDesc', icon: Sparkles },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = experience === item.key;
                  return (
                    <button
                      type="button"
                      key={item.key}
                      className={`wizard-feature-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setExperience(item.key as Level)}
                      aria-pressed={isSelected}
                    >
                      <Icon size={20} />
                      <strong>{t(item.title)}</strong>
                      <span>{t(item.desc)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Intensity & Effort ─────────────────────── */}
        {step === 3 && (
          <div className="wizard-step-body animate-in">
            <div className="wizard-step-heading">
              <div className="wizard-icon-box">
                <Zap size={26} />
              </div>
              <div>
                <h2>{t('intensityHeading')}</h2>
                <p>{t('intensitySubtitle')}</p>
              </div>
            </div>

            <div className="wizard-grid-options three-col">
              {[
                { key: 'gentle', title: 'intGentle', desc: 'intGentleDesc', badge: '🌱 Low Strain' },
                { key: 'balanced', title: 'intBalanced', desc: 'intBalancedDesc', badge: '⚖️ Steady' },
                { key: 'invigorating', title: 'intInvigorating', desc: 'intInvigoratingDesc', badge: '🔥 Energizing' },
              ].map((item) => {
                const isSelected = intensity === item.key;
                return (
                  <button
                    type="button"
                    key={item.key}
                    className={`wizard-feature-card large ${isSelected ? 'selected' : ''}`}
                    onClick={() => setIntensity(item.key as IntensityPreference)}
                    data-testid={`button-wizard-intensity-${item.key}`}
                    aria-pressed={isSelected}
                  >
                    <span className="wizard-intensity-tag">{item.badge}</span>
                    <strong>{t(item.title)}</strong>
                    <span>{t(item.desc)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 4: Environment & Equipment ────────────────── */}
        {step === 4 && (
          <div className="wizard-step-body animate-in">
            <div className="wizard-step-heading">
              <div className="wizard-icon-box">
                <Dumbbell size={26} />
              </div>
              <div>
                <h2>{t('envHeading')}</h2>
                <p>{t('envSubtitle')}</p>
              </div>
            </div>

            <div className="wizard-grid-options three-col">
              {[
                { key: 'home', title: 'locHome', desc: 'locHomeDesc' },
                { key: 'outdoors', title: 'locOutdoors', desc: 'locOutdoorsDesc' },
                { key: 'gym', title: 'locGym', desc: 'locGymDesc' },
              ].map((item) => {
                const isSelected = locationChoice === item.key;
                return (
                  <button
                    type="button"
                    key={item.key}
                    className={`wizard-feature-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setLocationChoice(item.key as LocationChoice)}
                    aria-pressed={isSelected}
                  >
                    <strong>{t(item.title)}</strong>
                    <span>{t(item.desc)}</span>
                  </button>
                );
              })}
            </div>

            <div className="wizard-sub-section" style={{ marginTop: 24 }}>
              <h3 className="wizard-sub-title">{t('equipHeading')}</h3>
              <div className="wizard-options-list">
                {[
                  { key: 'none', title: 'equipNone', desc: 'equipNoneDesc' },
                  { key: 'basic', title: 'equipBasic', desc: 'equipBasicDesc' },
                  { key: 'gym', title: 'equipGym', desc: 'equipGymDesc' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    className={`wizard-card-option ${equipment === item.key ? 'selected' : ''}`}
                    onClick={() => setEquipment(item.key as Equipment)}
                    data-testid={`button-wizard-equip-${item.key}`}
                    aria-pressed={equipment === item.key}
                  >
                    <span className="wizard-radio-indicator" />
                    <div className="wizard-option-content">
                      <strong>{t(item.title)}</strong>
                      <span>{t(item.desc)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Schedule & Session Length ──────────────── */}
        {step === 5 && (
          <div className="wizard-step-body animate-in">
            <div className="wizard-step-heading">
              <div className="wizard-icon-box">
                <Calendar size={26} />
              </div>
              <div>
                <h2>{t('scheduleHeading')}</h2>
                <p>{t('scheduleSubtitle')}</p>
              </div>
            </div>

            {/* Days per week selector */}
            <div className="wizard-form-field">
              <label className="wizard-field-title">
                {t('daysLabel')}
                <span className="wizard-hint-pill">{t('daysTip')}</span>
              </label>
              <div className="wizard-pill-grid">
                {[2, 3, 4, 5].map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`wizard-pill-choice ${daysPerWeek === n ? 'selected' : ''}`}
                    onClick={() => setDaysPerWeek(n)}
                    data-testid={`button-wizard-days-${n}`}
                    aria-pressed={daysPerWeek === n}
                  >
                    <span className="wizard-pill-number">{n}</span>
                    <span className="wizard-pill-text">{lang === 'ar' ? 'أيام / أسبوع' : 'days / week'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Session minutes selector */}
            <div className="wizard-form-field" style={{ marginTop: 22 }}>
              <label className="wizard-field-title">
                {t('minutesLabel')}
              </label>
              <div className="wizard-pill-grid">
                {[15, 20, 25, 30, 40].map((mins) => (
                  <button
                    type="button"
                    key={mins}
                    className={`wizard-pill-choice ${sessionMinutes === mins ? 'selected' : ''}`}
                    onClick={() => setSessionMinutes(mins)}
                    data-testid={`button-wizard-mins-${mins}`}
                    aria-pressed={sessionMinutes === mins}
                  >
                    <span className="wizard-pill-number">{mins}</span>
                    <span className="wizard-pill-text">{t('minutesUnit')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred time of day */}
            <div className="wizard-form-field" style={{ marginTop: 22 }}>
              <label className="wizard-field-title">
                {t('timeLabel')}
              </label>
              <div className="wizard-grid-options three-col">
                {[
                  { key: 'morning', title: 'timeMorning', icon: Sunrise },
                  { key: 'afternoon', title: 'timeAfternoon', icon: SunMedium },
                  { key: 'evening', title: 'timeEvening', icon: Sunset },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = preferredTime === item.key;
                  return (
                    <button
                      type="button"
                      key={item.key}
                      className={`wizard-feature-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setPreferredTime(item.key as PreferredTime)}
                      aria-pressed={isSelected}
                    >
                      <Icon size={18} />
                      <strong>{t(item.title)}</strong>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 6: Smart AI Recommendation Reveal ─────────── */}
        {step === 6 && matchResult && (
          <div className="wizard-step-body animate-in">
            <div className="wizard-match-hero">
              <div className="wizard-score-badge">
                <Sparkles size={16} />
                <span>{matchResult.score}% {t('matchScoreLabel')}</span>
              </div>
              <h2 className="wizard-matched-title">
                {matchResult.program.title[lang]}
              </h2>
              <p className="wizard-matched-desc">
                {matchResult.program.description[lang]}
              </p>
            </div>

            {/* Why this fits */}
            <div className="wizard-why-box">
              <h3 className="wizard-why-heading">{t('whyFitTitle')}</h3>
              <ul className="wizard-reasons-list">
                {matchResult.reasons[lang].map((reason, idx) => (
                  <li key={idx} className="wizard-reason-item">
                    <Check size={16} className="wizard-check-icon" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Schedule overview */}
            <div className="wizard-schedule-preview">
              <h3 className="wizard-schedule-heading">{t('scheduleOverview')}</h3>
              <div className="wizard-schedule-chips">
                {matchResult.program.weekSchedule.map((day) => (
                  <div
                    key={day.dayIndex}
                    className={`wizard-day-chip ${day.type === 'training' ? 'active' : 'rest'}`}
                  >
                    <strong>{day.title[lang]}</strong>
                    <span>
                      {day.type === 'training'
                        ? `${day.workoutExercises.length} ${lang === 'ar' ? 'تمارين' : 'exercises'}`
                        : lang === 'ar'
                        ? 'يوم راحة'
                        : 'Rest Day'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="wizard-final-cta-bar">
              <button
                type="button"
                className="button primary large"
                onClick={() => handleFinish('session')}
                data-testid="button-wizard-start-now"
              >
                {t('startNowCTA')}
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className="button outline large"
                onClick={() => handleFinish('plan')}
                data-testid="button-wizard-view-plan"
              >
                {t('viewPlanCTA')}
              </button>
            </div>
          </div>
        )}

        {/* ── Wizard Footer Navigation ───────────────────────── */}
        {step < 6 && (
          <div className="wizard-actions-bar">
            {step > 0 ? (
              <button
                type="button"
                className="button outline"
                onClick={handleBack}
                data-testid="button-wizard-back"
              >
                <ArrowLeft size={16} />
                {t('back')}
              </button>
            ) : <div />}

            <button
              type="button"
              className="button primary"
              onClick={handleNext}
              disabled={step === 0 && safety !== 'no'}
              data-testid="button-wizard-continue"
            >
              {t('next')}
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
