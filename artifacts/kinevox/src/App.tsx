import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp, Clock3, Dumbbell, HeartHandshake, Home, Info, Languages, Leaf, LockKeyhole, Search, ShieldCheck, Sparkles, Trash2, TrendingUp, Waves, Zap } from 'lucide-react';

type Lang = 'en' | 'ar';
type Goal = 'get-moving' | 'build-strength' | 'feel-mobile';
type Level = 'new' | 'some';
type LocationChoice = 'home' | 'outdoors' | 'gym';
type Equipment = 'none' | 'basic' | 'gym';
type Safety = 'no' | 'yes' | 'prefer';
type Preferences = { goal: Goal; experience: Level; location: LocationChoice; equipment: Equipment; daysPerWeek: number; sessionMinutes: number };
type Exercise = { id: string; title: Record<Lang,string>; instructions: Record<Lang,string>; category: string; equipment: Equipment; duration: number; difficulty: Level; reviewStatus: 'demo-unreviewed' };
type Program = { id: string; title: Record<Lang,string>; goal: Goal; level: Level; location: LocationChoice[]; daysPerWeek: number; exercises: string[]; reviewStatus: 'demo-unreviewed' };
type WorkoutLog = { id: string; date: string; sessionId: string; completed: boolean };
type Stored = { language: Lang; preferences: Preferences | null; logs: WorkoutLog[] };

const KEY = 'kinevox-local-v1';
const defaults: Preferences = { goal:'get-moving', experience:'new', location:'home', equipment:'none', daysPerWeek:3, sessionMinutes:25 };
const exercises: Exercise[] = [
  {id:'walk',title:{en:'Easy-paced walk',ar:'مشي بإيقاع مريح'},instructions:{en:'Walk at a pace that lets you talk comfortably. Start small and build when it feels right.',ar:'امشِ بإيقاع يسمح لك بالتحدث براحة. ابدأ بخطوات بسيطة وزدها عندما تشعر بالاستعداد.'},category:'cardio',equipment:'none',duration:8,difficulty:'new',reviewStatus:'demo-unreviewed'},
  {id:'chair-squat',title:{en:'Chair sit-to-stand',ar:'الجلوس والوقوف من الكرسي'},instructions:{en:'Sit toward the front of a sturdy chair. Stand up smoothly, then sit back with control.',ar:'اجلس عند مقدمة كرسي ثابت. قف بسلاسة ثم عد للجلوس بتحكم.'},category:'strength',equipment:'none',duration:6,difficulty:'new',reviewStatus:'demo-unreviewed'},
  {id:'wall-push',title:{en:'Wall push-up',ar:'ضغط الحائط'},instructions:{en:'Place hands on a wall at chest height. Bend your elbows to lean in, then press away.',ar:'ضع يديك على الحائط بمستوى الصدر. اثنِ المرفقين للاقتراب ثم ادفع للابتعاد.'},category:'strength',equipment:'none',duration:5,difficulty:'new',reviewStatus:'demo-unreviewed'},
  {id:'march',title:{en:'Standing march',ar:'المشي في المكان'},instructions:{en:'Stand tall and lift one knee at a time at a comfortable pace. Keep a stable surface nearby if useful.',ar:'قف باستقامة وارفع ركبة تلو الأخرى بإيقاع مريح. أبقِ سطحاً ثابتاً قريباً عند الحاجة.'},category:'cardio',equipment:'none',duration:5,difficulty:'new',reviewStatus:'demo-unreviewed'},
  {id:'stretch',title:{en:'Gentle full-body stretch',ar:'تمدد لطيف للجسم بالكامل'},instructions:{en:'Move slowly through a comfortable range. Avoid forcing or bouncing into a stretch.',ar:'تحرك ببطء ضمن مدى مريح. تجنب الضغط أو الارتداد أثناء التمدد.'},category:'mobility',equipment:'none',duration:5,difficulty:'new',reviewStatus:'demo-unreviewed'},
  {id:'band-row',title:{en:'Seated resistance-band row',ar:'سحب الشريط المطاطي جلوساً'},instructions:{en:'Sit tall with a band around your feet. Draw elbows back gently, then return with control.',ar:'اجلس باستقامة وضع الشريط حول قدميك. اسحب المرفقين للخلف بلطف ثم عُد بتحكم.'},category:'strength',equipment:'basic',duration:6,difficulty:'new',reviewStatus:'demo-unreviewed'},
  {id:'calf-raise',title:{en:'Supported calf raise',ar:'رفع الكعب مع الاستناد'},instructions:{en:'Hold a stable surface lightly. Rise onto your toes and lower slowly.',ar:'استند بخفة إلى سطح ثابت. ارفع كعبيك ثم اخفضهما ببطء.'},category:'strength',equipment:'none',duration:4,difficulty:'new',reviewStatus:'demo-unreviewed'},
  {id:'breath-mobility',title:{en:'Breath-led mobility',ar:'حركة مرنة مع التنفس'},instructions:{en:'Pair slow breathing with easy shoulder, hip and ankle movements.',ar:'نسّق التنفس البطيء مع حركات مريحة للكتفين والوركين والكاحلين.'},category:'mobility',equipment:'none',duration:7,difficulty:'new',reviewStatus:'demo-unreviewed'},
  {id:'dumbbell-press',title:{en:'Light dumbbell press',ar:'ضغط دمبل خفيف'},instructions:{en:'With light weights, press upward smoothly and lower with control. Keep the movement comfortable.',ar:'باستخدام أوزان خفيفة، ادفع للأعلى بسلاسة واخفض بتحكم ضمن حركة مريحة.'},category:'strength',equipment:'gym',duration:6,difficulty:'some',reviewStatus:'demo-unreviewed'},
];
const programs: Program[] = [
  {id:'steady-start',title:{en:'The Steady Start',ar:'بداية متوازنة'},goal:'get-moving',level:'new',location:['home','outdoors'],daysPerWeek:3,exercises:['walk','chair-squat','wall-push','stretch'],reviewStatus:'demo-unreviewed'},
  {id:'strength-foundations',title:{en:'Strength Foundations',ar:'أساسيات القوة'},goal:'build-strength',level:'new',location:['home','gym'],daysPerWeek:2,exercises:['chair-squat','wall-push','band-row','calf-raise'],reviewStatus:'demo-unreviewed'},
  {id:'easy-mobility',title:{en:'Easy Mobility Flow',ar:'تدفق مرونة مريح'},goal:'feel-mobile',level:'new',location:['home','outdoors'],daysPerWeek:3,exercises:['breath-mobility','stretch','walk'],reviewStatus:'demo-unreviewed'},
  {id:'move-more',title:{en:'Move More, Gently',ar:'حركة أكثر بلطف'},goal:'get-moving',level:'some',location:['home','outdoors'],daysPerWeek:3,exercises:['walk','march','chair-squat','stretch'],reviewStatus:'demo-unreviewed'},
  {id:'stronger-week',title:{en:'A Stronger Week',ar:'أسبوع أكثر قوة'},goal:'build-strength',level:'some',location:['home','gym'],daysPerWeek:3,exercises:['chair-squat','wall-push','dumbbell-press','band-row'],reviewStatus:'demo-unreviewed'},
];

const copy: Record<string,Record<Lang,string>> = {
  home:{en:'Home',ar:'الرئيسية'},plan:{en:'Your plan',ar:'خطتك'},library:{en:'Exercises',ar:'التمارين'},progress:{en:'Progress',ar:'التقدم'},privacy:{en:'Privacy',ar:'الخصوصية'},tagline:{en:'Evolve Your Potential.',ar:'طوّر إمكاناتك.'},greeting:{en:'A little movement. A lot of momentum.',ar:'حركة بسيطة، وزخم أكبر.'},homeIntro:{en:'Build a routine that fits your real life — one doable session at a time.',ar:'ابنِ روتيناً يناسب حياتك — جلسة عملية في كل مرة.'},start:{en:'Set up my routine',ar:'ابدأ إعداد روتيني'},resume:{en:'See my weekly plan',ar:'اطّلع على خطتي الأسبوعية'},safetyStart:{en:'Review your exercise preferences',ar:'راجع تفضيلات التمرين'},thisWeek:{en:'Your week, at a glance',ar:'أسبوعك بنظرة سريعة'},weekNote:{en:'Consistency is built in small repeats, not perfect weeks.',ar:'الاستمرارية تُبنى بالتكرار البسيط، لا بالأسابيع المثالية.'},sessions:{en:'Sessions done',ar:'جلسات مكتملة'},minutes:{en:'Minutes moving',ar:'دقائق من الحركة'},streak:{en:'This week',ar:'هذا الأسبوع'},disclaimer:{en:'Starter ideas only — demonstration content, not medically reviewed. Move at a comfortable pace and stop if something feels wrong.',ar:'أفكار أولية فقط — محتوى تجريبي غير مراجع طبياً. تحرك بإيقاع مريح وتوقف إذا شعرت بما لا يناسبك.'},nextSteps:{en:'Small steps, made personal',ar:'خطوات صغيرة بطابعك'},stepOne:{en:'Choose a direction',ar:'اختر وجهة'},stepOneText:{en:'Tell us what you want more of, and what fits your week.',ar:'أخبرنا بما ترغب في تحقيقه وما يناسب أسبوعك.'},stepTwo:{en:'Get a thoughtful match',ar:'احصل على اقتراح مناسب'},stepTwoText:{en:'See why a starter routine fits your preferences.',ar:'اكتشف لماذا تناسبك خطة بداية.'},stepThree:{en:'Notice your progress',ar:'لاحظ تقدمك'},stepThreeText:{en:'Your activity stays on this device, ready when you return.',ar:'يبقى نشاطك على هذا الجهاز، جاهزاً عند عودتك.'},welcome:{en:'A routine that starts where you are.',ar:'روتين يبدأ من حيث أنت.'},language:{en:'العربية',ar:'English'},onboarding:{en:'Build your starting point',ar:'ابدأ من نقطتك المناسبة'},onboardIntro:{en:'A few choices help KinevoX suggest a manageable weekly routine.',ar:'تساعدنا اختيارات بسيطة على اقتراح روتين أسبوعي مناسب.'},safetyTitle:{en:'A quick safety check',ar:'سؤال سريع للسلامة'},safetyHint:{en:'Do you have a condition, injury, or medical guidance that affects exercise?',ar:'هل لديك حالة أو إصابة أو توجيه طبي يؤثر على ممارسة التمارين؟'},safeNo:{en:'No',ar:'لا'},safeYes:{en:'Yes',ar:'نعم'},safePrefer:{en:'Prefer not to answer',ar:'أفضل عدم الإجابة'},safeNoDesc:{en:'Nothing to flag for this starter flow.',ar:'لا يوجد ما يستدعي التنبيه في هذه الخطوة.'},safePause:{en:'Pause and get qualified guidance',ar:'توقف واطلب توجيهاً من مختص'},safePreferDesc:{en:'You can continue without sharing details; we will not suggest a plan.',ar:'يمكنك المتابعة دون مشاركة أي تفاصيل؛ لن نقترح خطة.'},safetyPauseTitle:{en:'Let’s pause before planning',ar:'لنتوقف قبل إعداد الخطة'},safetyPauseBody:{en:'Because you selected yes or prefer not to answer, KinevoX will not recommend exercise sessions. Consider checking with a qualified healthcare professional about activity that is appropriate for you. No health details are collected or saved.',ar:'بما أنك اخترت نعم أو أفضل عدم الإجابة، لن تقترح KinevoX جلسات تمرين. فكّر في استشارة مختص رعاية صحية مؤهل حول النشاط المناسب لك. لا نجمع أي تفاصيل صحية أو نحفظها.'},next:{en:'Continue',ar:'متابعة'},back:{en:'Back',ar:'رجوع'},stepGoal:{en:'What would you like to work toward?',ar:'ما الذي ترغب في العمل لتحقيقه؟'},goalHint:{en:'There is no wrong starting point. Pick what feels useful now.',ar:'لا توجد بداية خاطئة. اختر ما يبدو مفيداً الآن.'},goalMove:{en:'Move more often',ar:'زيادة الحركة'},goalMoveDesc:{en:'Find an easy rhythm for activity.',ar:'اعثر على إيقاع مريح للنشاط.'},goalStrength:{en:'Build everyday strength',ar:'بناء قوة يومية'},goalStrengthDesc:{en:'Practice simple strength movements.',ar:'تدرّب على حركات قوة بسيطة.'},goalMobility:{en:'Feel more mobile',ar:'مرونة وحركة أسهل'},goalMobilityDesc:{en:'Make room for gentle movement.',ar:'امنح نفسك مساحة لحركة لطيفة.'},experience:{en:'Your experience',ar:'خبرتك'},new:{en:'I’m new to routines',ar:'أنا جديد على الروتين'},some:{en:'I’ve exercised before',ar:'لدي تجربة سابقة'},location:{en:'Where do you like to move?',ar:'أين تفضل الحركة؟'},homeLoc:{en:'At home',ar:'في المنزل'},outdoors:{en:'Outdoors',ar:'في الخارج'},gym:{en:'At a gym',ar:'في النادي'},equipment:{en:'Equipment available',ar:'المعدات المتاحة'},none:{en:'No equipment',ar:'دون معدات'},basic:{en:'Basic band / light weights',ar:'شريط أو أوزان خفيفة'},days:{en:'Days each week',ar:'أيام في الأسبوع'},minutesChoice:{en:'Minutes per session',ar:'دقائق لكل جلسة'},finish:{en:'Save my preferences',ar:'احفظ تفضيلاتي'},saved:{en:'Your preferences are saved on this device.',ar:'حُفظت تفضيلاتك على هذا الجهاز.'},planHeading:{en:'A plan with room to grow',ar:'خطة تترك مجالاً للنمو'},planSubtitle:{en:'A simple recommendation built around the preferences you chose.',ar:'اقتراح بسيط صُمم وفق التفضيلات التي اخترتها.'},whyTitle:{en:'Why this could fit',ar:'لماذا قد تناسبك؟'},whyGoal:{en:'It lines up with the goal you picked.',ar:'تتوافق مع الهدف الذي اخترته.'},whyLevel:{en:'It starts at your selected experience level.',ar:'تبدأ من مستوى الخبرة الذي اخترته.'},whyDays:{en:'Its weekly rhythm fits the days you chose.',ar:'يناسب إيقاعها الأسبوعي عدد الأيام الذي اخترته.'},whyGear:{en:'It works with your available equipment.',ar:'تناسب المعدات المتاحة لديك.'},whyDuration:{en:'Sessions are shaped around your time window.',ar:'تراعي الجلسات الوقت الذي حددته.'},matchLabel:{en:'A considered match',ar:'اقتراح مدروس'},duration:{en:'min',ar:'دقيقة'},perWeek:{en:'days / week',ar:'أيام / أسبوع'},completeSession:{en:'Mark this session complete',ar:'تسجيل الجلسة كمكتملة'},completed:{en:'Session saved. Nice work showing up.',ar:'حُفظت الجلسة. أحسنت المواظبة.'},completedBadge:{en:'Completed',ar:'مكتملة'},starterLabel:{en:'Starter demonstration',ar:'محتوى تجريبي'},noPlanTitle:{en:'No close match just yet',ar:'لا يوجد اقتراح قريب حالياً'},noPlanBody:{en:'Your current combination does not match a starter plan in this demonstration library. Try adjusting your goal, experience, or available days. We’ll keep your preferences intact.',ar:'لا تتوافق تفضيلاتك الحالية مع خطة بداية في هذه المكتبة التجريبية. جرّب تعديل هدفك أو خبرتك أو أيامك المتاحة. سنحتفظ بتفضيلاتك كما هي.'},editPrefs:{en:'Adjust preferences',ar:'تعديل التفضيلات'},libraryTitle:{en:'A small library for curious starts',ar:'مكتبة صغيرة لبدايات جديدة'},libraryIntro:{en:'Search by movement or filter by focus. These are starter examples, not a prescription.',ar:'ابحث عن حركة أو صفّ حسب التركيز. هذه أمثلة أولية وليست وصفة تدريبية.'},search:{en:'Search exercise names or instructions',ar:'ابحث عن أسماء التمارين أو التعليمات'},all:{en:'All movements',ar:'كل الحركات'},strength:{en:'Strength',ar:'قوة'},cardio:{en:'Cardio',ar:'لياقة قلبية'},mobility:{en:'Mobility',ar:'مرونة'},noResults:{en:'No movement found',ar:'لم نعثر على حركة'},noResultsText:{en:'Try another word or clear your filters.',ar:'جرّب كلمة أخرى أو أزل عوامل التصفية.'},libraryCount:{en:'movements',ar:'حركة'},progressTitle:{en:'Your progress, without the pressure',ar:'تقدمك، دون ضغط'},progressIntro:{en:'A gentle record of the sessions you chose to complete.',ar:'سجل بسيط للجلسات التي اخترت إكمالها.'},totalSessions:{en:'Total sessions',ar:'إجمالي الجلسات'},lastSeven:{en:'Last 7 days',ar:'آخر 7 أيام'},totalMinutes:{en:'Total minutes',ar:'إجمالي الدقائق'},history:{en:'Activity history',ar:'سجل النشاط'},emptyTitle:{en:'Your first check-in is still ahead',ar:'أول إنجاز لك بانتظارك'},emptyText:{en:'When you complete a session, it will be kept here on this device.',ar:'عند إكمال جلسة، ستظهر هنا على هذا الجهاز.'},goPlan:{en:'See my plan',ar:'اطّلع على خطتي'},privacyTitle:{en:'Your data belongs to you',ar:'بياناتك ملكك'},privacyIntro:{en:'KinevoX keeps this first version simple and local.',ar:'تحافظ KinevoX على بساطة هذه النسخة وخصوصيتها.'},localTitle:{en:'Saved on this device',ar:'محفوظة على هذا الجهاز'},localBody:{en:'Your language, exercise preferences, and completed-session log are stored in this browser on this device. There are no accounts, servers, or external APIs in this MVP.',ar:'تُخزن اللغة وتفضيلات التمرين وسجل الجلسات المكتملة في هذا المتصفح على هذا الجهاز. لا توجد حسابات أو خوادم أو واجهات خارجية في هذه النسخة.'},healthTitle:{en:'No health history collected',ar:'لا نجمع سجلاً صحياً'},healthBody:{en:'The safety answer is used only in memory to decide whether this flow should pause. It is never written to local storage. We do not ask for diagnoses, medication, measurements, or detailed health history.',ar:'يُستخدم جواب السلامة في الذاكرة فقط لتحديد ما إذا كان ينبغي إيقاف هذا المسار. لا يُكتب أبداً في التخزين المحلي. لا نسأل عن التشخيصات أو الأدوية أو القياسات أو التاريخ الصحي التفصيلي.'},demoTitle:{en:'Starter content is not medically reviewed',ar:'المحتوى الأولي غير مراجع طبياً'},demoBody:{en:'The sample exercises and routines are demonstration content only. They have not been reviewed by a health professional and are not medical advice.',ar:'التمارين والروتينات النموذجية محتوى تجريبي فقط. لم يراجعها مختص صحي ولا تُعد نصيحة طبية.'},clearTitle:{en:'Clear local data',ar:'مسح البيانات المحلية'},clearBody:{en:'Remove your saved preferences, language, and workout history from this browser.',ar:'أزل تفضيلاتك المحفوظة ولغتك وسجل التمارين من هذا المتصفح.'},clearAction:{en:'Clear all data',ar:'مسح كل البيانات'},clearConfirm:{en:'Clear all KinevoX data saved on this device?',ar:'هل تريد مسح كل بيانات KinevoX المحفوظة على هذا الجهاز؟'},cleared:{en:'Local data cleared.',ar:'تم مسح البيانات المحلية.'},notFound:{en:'We couldn’t find that page.',ar:'لم نتمكن من العثور على هذه الصفحة.'},returnHome:{en:'Back to home',ar:'العودة للرئيسية'},languageSaved:{en:'Language updated.',ar:'تم تحديث اللغة.'},noPrefs:{en:'A few preferences will help us make this personal.',ar:'تساعدنا بعض التفضيلات على تخصيص تجربتك.'},equipmentFit:{en:'You can adapt any movement to feel comfortable.',ar:'يمكنك تكييف أي حركة لتكون مريحة لك.'},locationLabel:{en:'Location',ar:'المكان'},experienceLabel:{en:'Experience',ar:'الخبرة'},advice:{en:'If activity brings pain, dizziness, or unusual discomfort, stop and seek qualified guidance.',ar:'إذا تسبب النشاط بألم أو دوار أو انزعاج غير معتاد، فتوقف واطلب توجيهاً مؤهلاً.'}
};

function readStored(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Stored>;
      return { language: parsed.language === 'ar' ? 'ar' : 'en', preferences: parsed.preferences || null, logs: Array.isArray(parsed.logs) ? parsed.logs : [] };
    }
  } catch { /* Recover from unavailable or malformed local storage. */ }
  return { language:'en', preferences:null, logs:[] };
}
const goalKey = (goal:Goal) => goal === 'get-moving' ? 'goalMove' : goal === 'build-strength' ? 'goalStrength' : 'goalMobility';
const safeExercise = (id:string) => exercises.find(item=>item.id===id);
function matchProgram(pref:Preferences|null): Program|null {
  if (!pref) return null;
  return programs.find(program => program.goal === pref.goal && program.level === pref.experience && program.location.includes(pref.location) && program.daysPerWeek <= pref.daysPerWeek && program.exercises.reduce((minutes,id)=>minutes+(safeExercise(id)?.duration||0),0) <= pref.sessionMinutes && program.exercises.every(id => {
    const item = safeExercise(id);
    return !!item && (pref.equipment === 'gym' || (pref.equipment === 'basic' ? item.equipment !== 'gym' : item.equipment === 'none'));
  })) || null;
}

type AppContextValue = {lang:Lang;t:(key:string)=>string;preferences:Preferences|null;logs:WorkoutLog[];safety:Safety|null;setSafety:(value:Safety|null)=>void;savePreferences:(pref:Preferences)=>void;completeSession:(sessionId:string)=>void;toast:(message:string)=>void;clearData:()=>void};
const AppContext = createContext<AppContextValue | null>(null);
function useApp() { const context=useContext(AppContext); if(!context) throw new Error('KinevoX context missing'); return context; }
function AppShell({children}:{children:any}) {
  const [state,setState]=useState<Stored>(()=>readStored());
  const skipNextPersist=useRef(false);
  const [safety,setSafety]=useState<Safety|null>(null);
  const [toastText,setToastText]=useState('');
  const [path]=useLocation();
  const lang=state.language;
  const t=(key:string)=>copy[key]?.[lang] ?? key;
  const dir=lang==='ar'?'rtl':'ltr';
  useEffect(()=>{if(skipNextPersist.current){skipNextPersist.current=false;return}try{localStorage.setItem(KEY,JSON.stringify(state))}catch{/* Local storage may be disabled. */}},[state]);
  useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=dir},[lang,dir]);
  useEffect(()=>{if(!toastText)return;const timer=window.setTimeout(()=>setToastText(''),2600);return()=>window.clearTimeout(timer)},[toastText]);
  const api:AppContextValue={lang,t,preferences:state.preferences,logs:state.logs,safety,setSafety,savePreferences:(preferences)=>setState(current=>({...current,preferences})),completeSession:(sessionId)=>{const entry:WorkoutLog={id:`log-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,date:new Date().toISOString(),sessionId,completed:true};setState(current=>({...current,logs:[entry,...current.logs]}));setToastText(t('completed'))},toast:setToastText,clearData:()=>{skipNextPersist.current=true;try{localStorage.removeItem(KEY)}catch{/* Clearing still resets in-memory data. */}setState({language:'en',preferences:null,logs:[]});setSafety(null)}};
  const toggleLanguage=()=>{const next=lang==='en'?'ar':'en';setState(current=>({...current,language:next}));setToastText(copy.languageSaved[next])};
  const active=path==='/'?'home':path.slice(1);
  return <AppContext.Provider value={api}><div className="app-shell" dir={dir}>
    <header className="topbar">
      <Link href="/" className="brand" data-testid="link-brand-home" aria-label={lang==='ar'?'الصفحة الرئيسية KinevoX':'KinevoX home'}>
        <span className="brand-mark"><Activity size={21}/></span><span><span className="brand-name">KinevoX</span><span className="brand-tag">{t('tagline')}</span></span>
      </Link>
      <div className="header-tools">
        <button className="lang-toggle" onClick={toggleLanguage} data-testid="button-language-toggle" aria-label={t('language')}><Languages size={16}/>{t('language')}</button>
      </div>
    </header>
    <nav className="nav" aria-label={lang==='ar'?'التنقل الرئيسي':'Main navigation'}>
      {[
        {href:'/',key:'home',icon:Home}, {href:'/plan',key:'plan',icon:Sparkles}, {href:'/exercises',key:'library',icon:BookOpen}, {href:'/progress',key:'progress',icon:TrendingUp}, {href:'/privacy',key:'privacy',icon:ShieldCheck},
      ].map(({href,key,icon:Icon})=><Link key={href} href={href} className={`nav-link ${active===(href==='/'?'home':href.slice(1))?'active':''}`} data-testid={`link-nav-${key}`} aria-current={active===(href==='/'?'home':href.slice(1))?'page':undefined}><Icon size={17}/>{t(key)}</Link>)}
    </nav>
    <main className="main"><div className="animate-in" key={path}>{children}</div><p className="footer-note">{t('tagline')} · {t('disclaimer')}</p></main>
    {toastText&&<div className="toast-message" role="status" data-testid="status-toast">{toastText}</div>}
  </div></AppContext.Provider>;
}

function Disclosure(){const {t}=useApp();return <div className="disclosure" data-testid="status-demo-disclosure"><Info size={16}/><span>{t('disclaimer')}</span></div>}
function HomePage(){
  const {t,lang,preferences,logs,safety}=useApp();
  const plan=matchProgram(preferences);
  const done=logs.length;
  const weekCutoff=Date.now()-7*24*60*60*1000;
  const weekly=logs.filter(log=>new Date(log.date).getTime()>=weekCutoff).length;
  const openLink=safety==='yes'||safety==='prefer'?'/onboarding':safety==='no'?'/plan':'/onboarding';
  const cta=safety==='yes'||safety==='prefer'?'safetyStart':safety==='no'?'resume':'start';
  return <div className="animate-in">
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow hero-brand"><Leaf size={15}/>{t('tagline')}</div><h1>{t('welcome')}</h1><p>{t('homeIntro')}</p><Link href={openLink} className="button primary" data-testid="link-home-primary">{t(cta)}<ArrowRight size={17}/></Link></div>
      <div className="hero-art" aria-hidden="true"><Activity size={58} strokeWidth={1.1}/></div>
    </section>
    <div className="section-heading"><div><h2>{t('thisWeek')}</h2><p>{t('weekNote')}</p></div><Link className="text-link" href="/progress" data-testid="link-home-progress">{t('progress')}<ArrowUpRight size={15}/></Link></div>
    <div className="home-grid">
      <section className="panel" data-testid="panel-week-summary"><div className="panel-head"><h3 className="panel-title">{plan? t(plan.id==='steady-start'?'goalMove':plan.id==='strength-foundations'?'goalStrength':'goalMobility') : t('nextSteps')}</h3><span className="pill"><Sparkles size={13}/>{safety==='no'&&plan?t('matchLabel'):t('starterLabel')}</span></div>
        <div className="metric-row"><div className="metric"><strong data-testid="value-total-sessions">{done}</strong><span>{t('sessions')}</span></div><div className="metric"><strong data-testid="value-week-sessions">{weekly}</strong><span>{t('streak')}</span></div><div className="metric"><strong data-testid="value-total-minutes">{logs.reduce((n,l)=>n+(programs.find(p=>p.id===l.sessionId)?.exercises.reduce((m,id)=>m+(safeExercise(id)?.duration||0),0)||0),0)}</strong><span>{t('minutes')}</span></div></div>
        <div className="day-strip" aria-label={t('days')}>{Array.from({length:7},(_,i)=>{const date=new Date();date.setHours(0,0,0,0);date.setDate(date.getDate()-(6-i));const doneThatDay=logs.some(log=>new Date(log.date).toDateString()===date.toDateString());const today=date.toDateString()===new Date().toDateString();return <span key={date.toISOString()} className={`day-chip ${doneThatDay?'done':''} ${today?'today':''}`} data-testid={`value-week-day-${i}`}>{new Intl.DateTimeFormat(lang==='ar'?'ar':'en',{weekday:'short'}).format(date)}</span>})}</div>
      </section>
      <section className="panel"><div className="panel-head"><h3 className="panel-title">{t('nextSteps')}</h3><Waves size={20} color="#4d8a6b"/></div><div className="why-list"><div className="why-item"><CheckCircle2 size={17}/><span><b>{t('stepOne')}</b><br/>{t('stepOneText')}</span></div><div className="why-item"><CheckCircle2 size={17}/><span><b>{t('stepTwo')}</b><br/>{t('stepTwoText')}</span></div><div className="why-item"><CheckCircle2 size={17}/><span><b>{t('stepThree')}</b><br/>{t('stepThreeText')}</span></div></div></section>
    </div>
    {preferences&&safety==='no'&&plan&&<div className="section-heading"><h2>{t('planHeading')}</h2><Link className="text-link" href="/plan" data-testid="link-home-plan">{t('resume')}<ChevronRight size={16}/></Link></div>}
    {safety==='yes'||safety==='prefer'?<div className="notice" style={{marginTop:19}}><HeartHandshake size={19}/><div><strong>{t('safetyPauseTitle')}</strong>{t('safetyPauseBody')}</div></div>:null}
    <div style={{marginTop:18}}><Disclosure/></div>
  </div>;
}

function OnboardingPage(){
  const {t,lang,preferences,savePreferences,setSafety,toast}=useApp();
  const [step,setStep]=useState(0);
  const [safe,setSafe]=useState<Safety|null>(null);
  const [draft,setDraft]=useState<Preferences>(preferences||defaults);
  const goalOptions:Goal[]=['get-moving','build-strength','feel-mobile'];
  const update=(partial:Partial<Preferences>)=>setDraft(current=>({...current,...partial}));
  const finish=()=>{if(!safe)return;setSafety(safe);savePreferences(draft);toast(t('saved'));};
  const [,setPath]=useLocation();
  return <div className="animate-in">
    <div className="page-head"><div className="eyebrow"><Sparkles size={14}/>{t('tagline')}</div><h1 className="page-title">{t('onboarding')}</h1><p className="page-subtitle">{t('onboardIntro')}</p></div>
    <section className="form-card">
      <div className="stepper" aria-label={`${step+1} / 3`}>{[0,1,2].map(i=><span key={i} style={{display:'contents'}}><span className={`step-dot ${step>=i?'active':''}`}>{step>i?<Check size={14}/>:i+1}</span>{i<2&&<span className="step-line"/>}</span>)}</div>
      {step===0&&<div>
        <h2 className="form-title">{t('safetyTitle')}</h2><p className="form-hint">{t('safetyHint')}</p>
        <div className="safety-options">
          {(['no','yes','prefer'] as Safety[]).map(value=><button type="button" key={value} className={`safety-option ${safe===value?'selected':''}`} onClick={()=>setSafe(value)} data-testid={`button-safety-${value}`} aria-pressed={safe===value}><span className="radio-dot"/><span><strong>{t(value==='no'?'safeNo':value==='yes'?'safeYes':'safePrefer')}</strong><span>{t(value==='no'?'safeNoDesc':value==='yes'?'safePause':'safePreferDesc')}</span></span></button>)}
        </div>
      </div>}
      {step===1&&<div>
        <h2 className="form-title">{t('stepGoal')}</h2><p className="form-hint">{t('goalHint')}</p>
        <div className="option-grid">{goalOptions.map(goal=><button type="button" className={`option ${draft.goal===goal?'selected':''}`} key={goal} onClick={()=>update({goal})} aria-pressed={draft.goal===goal} data-testid={`button-goal-${goal}`}><strong>{t(goalKey(goal))}</strong><span>{t(goal==='get-moving'?'goalMoveDesc':goal==='build-strength'?'goalStrengthDesc':'goalMobilityDesc')}</span></button>)}</div>
        <label className="field-label" htmlFor="experience">{t('experience')}</label><select id="experience" className="select-control" value={draft.experience} onChange={e=>update({experience:e.target.value as Level})} data-testid="select-experience"><option value="new">{t('new')}</option><option value="some">{t('some')}</option></select>
      </div>}
      {step===2&&<div>
         <h2 className="form-title">{lang==='ar'?'اجعل الروتين مناسباً لك':'Shape a routine that fits'}</h2><p className="form-hint">{t('onboardIntro')}</p>
        <label className="field-label" htmlFor="location">{t('location')}</label><select id="location" className="select-control" value={draft.location} onChange={e=>update({location:e.target.value as LocationChoice})} data-testid="select-location"><option value="home">{t('homeLoc')}</option><option value="outdoors">{t('outdoors')}</option><option value="gym">{t('gym')}</option></select>
        <label className="field-label" htmlFor="equipment">{t('equipment')}</label><select id="equipment" className="select-control" value={draft.equipment} onChange={e=>update({equipment:e.target.value as Equipment})} data-testid="select-equipment"><option value="none">{t('none')}</option><option value="basic">{t('basic')}</option><option value="gym">{t('gym')}</option></select>
        <label className="field-label" htmlFor="days">{t('days')}</label><select id="days" className="select-control" value={draft.daysPerWeek} onChange={e=>update({daysPerWeek:Number(e.target.value)})} data-testid="select-days">{[2,3,4,5].map(n=><option value={n} key={n}>{n}</option>)}</select>
        <label className="field-label" htmlFor="minutes">{t('minutesChoice')}</label><select id="minutes" className="select-control" value={draft.sessionMinutes} onChange={e=>update({sessionMinutes:Number(e.target.value)})} data-testid="select-session-minutes">{[15,20,25,30,40].map(n=><option value={n} key={n}>{n} {t('duration')}</option>)}</select>
        <p className="form-hint" style={{marginTop:15}}>{t('equipmentFit')}</p>
      </div>}
      <div className="form-actions">
        {step>0?<button type="button" className="button outline" onClick={()=>setStep(step-1)} data-testid="button-onboarding-back"><ArrowLeft size={16}/>{t('back')}</button>:<span/>}
        {step<2?<button type="button" disabled={step===0&&!safe} className="button dark" onClick={()=>{if(step===0&&safe&&safe!=='no'){setSafety(safe);setPath('/');return;}setStep(step+1)}} data-testid="button-onboarding-next">{t('next')}<ArrowRight size={16}/></button>:<button type="button" className="button dark" disabled={!safe} onClick={()=>{finish();setPath(safe==='yes'||safe==='prefer'?'/':'/plan')}} data-testid="button-onboarding-finish">{t('finish')}<Check size={16}/></button>}
      </div>
    </section>
    <div style={{maxWidth:800,marginTop:16}}><Disclosure/></div>
  </div>;
}

function PlanPage(){
  const {t,lang,preferences,safety,completeSession}=useApp();
  const [,setPath]=useLocation();
  const plan=matchProgram(preferences);
  const totalMinutes=plan?.exercises.reduce((n,id)=>n+(safeExercise(id)?.duration||0),0)||0;
  return <div className="animate-in">
    <div className="page-head page-head-row"><div><div className="eyebrow"><Sparkles size={14}/>{t('matchLabel')}</div><h1 className="page-title">{t('planHeading')}</h1><p className="page-subtitle">{t('planSubtitle')}</p></div>{preferences&&<button className="button outline small" type="button" onClick={()=>setPath('/onboarding')} data-testid="button-edit-preferences">{t('editPrefs')}</button>}</div>
    {safety===null?<div className="notice" data-testid="status-plan-safety"><HeartHandshake size={20}/><div><strong>{t('safetyTitle')}</strong>{t('safetyHint')}<div style={{marginTop:14}}><Link href="/onboarding" className="button dark small" data-testid="link-plan-safety">{t('safetyStart')}</Link></div></div></div>
    :safety!=='no'?<div className="notice" data-testid="status-plan-safety"><HeartHandshake size={20}/><div><strong>{t('safetyPauseTitle')}</strong>{t('safetyPauseBody')}<div style={{marginTop:14}}><Link href="/onboarding" className="button dark small" data-testid="link-plan-safety">{t('safetyStart')}</Link></div></div></div>
    :!preferences?<div className="empty-state" data-testid="status-plan-no-preferences"><CircleHelp size={28}/><h3>{t('noPrefs')}</h3><Link href="/onboarding" className="button dark" data-testid="link-plan-setup">{t('start')}</Link></div>
    :!plan?<div className="empty-state" data-testid="status-plan-no-match"><CircleHelp size={30}/><h3>{t('noPlanTitle')}</h3><p>{t('noPlanBody')}</p><Link href="/onboarding" className="button dark" data-testid="link-plan-adjust">{t('editPrefs')}</Link></div>
    :<div className="content-grid">
      <div className="stack">
        <section className="plan-card featured" data-testid={`card-plan-${plan.id}`}>
          <span className="pill"><Sparkles size={13}/>{t('starterLabel')}</span>
          <h2 className="plan-title">{plan.title[lang]}</h2>
          <p>{t('goalHint')}</p>
          <div className="plan-meta"><span className="pill"><Clock3 size={13}/>{totalMinutes} {t('duration')}</span><span className="pill"><Activity size={13}/>{plan.daysPerWeek} {t('perWeek')}</span><span className="pill"><Zap size={13}/>{t('new')}</span></div>
          <div className="exercise-list">{plan.exercises.map((id,index)=>{const item=safeExercise(id);return item?<div className="exercise-row" key={id} data-testid={`row-plan-exercise-${id}`}><span className="exercise-number">{String(index+1).padStart(2,'0')}</span><span><strong>{item.title[lang]}</strong><span>{item.duration} {t('duration')} · {item.instructions[lang]}</span></span></div>:null})}</div>
          <button type="button" className="button primary" style={{marginTop:22,position:'relative',zIndex:1}} onClick={()=>completeSession(plan.id)} data-testid="button-complete-session"><CheckCircle2 size={17}/>{t('completeSession')}</button>
        </section>
        <Disclosure/>
      </div>
      <aside className="plan-card">
        <div className="eyebrow"><CheckCircle2 size={14}/>{t('whyTitle')}</div><h2 className="plan-title">{t('matchLabel')}</h2><p>{t('planSubtitle')}</p>
        <div className="why-list">{['whyGoal','whyLevel','whyDays','whyGear','whyDuration'].map(k=><div className="why-item" key={k}><CheckCircle2 size={16}/><span>{t(k)}</span></div>)}<div className="why-item"><CheckCircle2 size={16}/><span>{lang==='ar'?'تتوافق الخطة مع المكان الذي اخترته.':'It matches the setting you selected.'}</span></div></div>
        <div style={{marginTop:22}} className="disclosure"><Info size={16}/><span>{t('advice')}</span></div>
      </aside>
    </div>}
  </div>;
}

function LibraryPage(){
  const {t,lang}=useApp();
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState('all');
  const categories=['all','strength','cardio','mobility'];
  const filtered=useMemo(()=>exercises.filter(item=>(filter==='all'||item.category===filter)&&`${item.title.en} ${item.title.ar} ${item.instructions.en} ${item.instructions.ar}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())),[filter,query]);
  return <div className="animate-in">
    <div className="page-head"><div className="eyebrow"><BookOpen size={14}/>{t('library')}</div><h1 className="page-title">{t('libraryTitle')}</h1><p className="page-subtitle">{t('libraryIntro')}</p></div>
    <div className="search-row"><div className="search-wrap"><Search size={18}/><input className="search-control" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('search')} aria-label={t('search')} data-testid="input-exercise-search"/></div></div>
    <div className="filters" role="group" aria-label={t('library')} data-testid="group-exercise-filters">{categories.map(category=><button key={category} type="button" className={`filter-chip ${filter===category?'active':''}`} onClick={()=>setFilter(category)} aria-pressed={filter===category} data-testid={`button-filter-${category}`}>{t(category)}</button>)}</div>
    <p className="form-hint" data-testid="value-library-count">{filtered.length} {t('libraryCount')}</p>
    {filtered.length?<div className="library-grid">{filtered.map(item=><article className="exercise-card" key={item.id} data-testid={`card-exercise-${item.id}`}><span className="pill"><Dumbbell size={13}/>{t(item.category)}</span><h3>{item.title[lang]}</h3><p>{item.instructions[lang]}</p><footer><span>{item.duration} {t('duration')}</span><span>{t('starterLabel')}</span></footer></article>)}</div>:<div className="empty-state" data-testid="status-library-empty"><Search size={28}/><h3>{t('noResults')}</h3><p>{t('noResultsText')}</p><button className="button outline small" onClick={()=>{setQuery('');setFilter('all')}} data-testid="button-clear-exercise-filters">{t('all')}</button></div>}
    <div style={{marginTop:22}}><Disclosure/></div>
  </div>;
}

function ProgressPage(){
  const {t,lang,logs}=useApp();
  const lastWeek=Date.now()-7*24*60*60*1000;
  const recent=logs.filter(log=>new Date(log.date).getTime()>=lastWeek).length;
  const minutes=logs.reduce((sum,log)=>sum+(programs.find(p=>p.id===log.sessionId)?.exercises.reduce((m,id)=>m+(safeExercise(id)?.duration||0),0)||0),0);
  const formattedDate=(value:string)=>new Intl.DateTimeFormat(lang==='ar'?'ar':'en',{month:'short',day:'numeric'}).format(new Date(value));
  return <div className="animate-in">
    <div className="page-head"><div className="eyebrow"><TrendingUp size={14}/>{t('progress')}</div><h1 className="page-title">{t('progressTitle')}</h1><p className="page-subtitle">{t('progressIntro')}</p></div>
    <section className="progress-hero"><div><div className="eyebrow"><Activity size={14}/>{t('thisWeek')}</div><h2 className="plan-title">{t('weekNote')}</h2><div className="metric-row"><div className="metric"><strong data-testid="value-progress-total">{logs.length}</strong><span>{t('totalSessions')}</span></div><div className="metric"><strong data-testid="value-progress-recent">{recent}</strong><span>{t('lastSeven')}</span></div><div className="metric"><strong data-testid="value-progress-minutes">{minutes}</strong><span>{t('totalMinutes')}</span></div></div></div><div className="progress-count" data-testid="value-progress-ring">{recent}<small>{t('lastSeven')}</small></div></section>
    <div className="section-heading"><div><h2>{t('history')}</h2><p>{t('progressIntro')}</p></div></div>
    {logs.length?<div className="history-list">{logs.map(log=>{const program=programs.find(p=>p.id===log.sessionId);const mins=program?.exercises.reduce((n,id)=>n+(safeExercise(id)?.duration||0),0)||0;return <article className="history-row" key={log.id} data-testid={`row-workout-log-${log.id}`}><span className="history-date">{formattedDate(log.date)}</span><span className="history-info"><strong>{program?.title[lang]||t('starterLabel')}</strong><span>{mins} {t('duration')} · {t('completedBadge')}</span></span><CheckCircle2 size={20} color="#438465"/></article>})}</div>:<div className="empty-state" data-testid="status-progress-empty"><TrendingUp size={30}/><h3>{t('emptyTitle')}</h3><p>{t('emptyText')}</p><Link href="/plan" className="button dark" data-testid="link-progress-plan">{t('goPlan')}<ArrowRight size={16}/></Link></div>}
    <div style={{marginTop:22}}><Disclosure/></div>
  </div>;
}

function PrivacyPage(){
  const {t,lang,clearData}=useApp();
  const [,setPath]=useLocation();
  const clear=()=>{if(window.confirm(t('clearConfirm'))){clearData();setPath('/');}};
  return <div className="animate-in">
    <div className="page-head"><div className="eyebrow"><ShieldCheck size={14}/>{t('privacy')}</div><h1 className="page-title">{t('privacyTitle')}</h1><p className="page-subtitle">{t('privacyIntro')}</p></div>
    <section className="privacy-card">
      <div className="privacy-row"><span className="privacy-icon"><LockKeyhole size={18}/></span><span><h3>{t('localTitle')}</h3><p>{lang==='ar'?'تُخزن اللغة وتفضيلات التمرين وسجل الجلسات المكتملة في هذا المتصفح على هذا الجهاز. لا تنشئ KinevoX حساباً ولا ترسل هذه البيانات إلى خادم للتطبيق أو خدمة لياقة خارجية.':'Your language, exercise preferences, and completed-session log are stored in this browser on this device. KinevoX does not create an account or send this data to an app backend or external fitness service.'}</p></span></div>
      <div className="privacy-row"><span className="privacy-icon"><HeartHandshake size={18}/></span><span><h3>{t('healthTitle')}</h3><p>{t('healthBody')}</p></span></div>
      <div className="privacy-row"><span className="privacy-icon"><Info size={18}/></span><span><h3>{t('demoTitle')}</h3><p>{t('demoBody')}</p></span></div>
      <div className="danger-zone"><h3>{t('clearTitle')}</h3><p>{t('clearBody')}</p><button type="button" className="button small" style={{background:'#a64e3e'}} onClick={clear} data-testid="button-clear-all-data"><Trash2 size={15}/>{t('clearAction')}</button></div>
    </section>
    <div style={{maxWidth:840,marginTop:16}}><Disclosure/></div>
  </div>;
}

function NotFoundPage(){const {t}=useApp();return <div className="not-found"><div><h1>404</h1><p>{t('notFound')}</p><Link className="button dark" href="/" data-testid="link-not-found-home">{t('returnHome')}</Link></div></div>}
function RoutedPages(){return <Switch><Route path="/" component={HomePage}/><Route path="/onboarding" component={OnboardingPage}/><Route path="/plan" component={PlanPage}/><Route path="/exercises" component={LibraryPage}/><Route path="/progress" component={ProgressPage}/><Route path="/privacy" component={PrivacyPage}/><Route component={NotFoundPage}/></Switch>}
function App(){return <AppShell><RoutedPages/></AppShell>}
export default App;
