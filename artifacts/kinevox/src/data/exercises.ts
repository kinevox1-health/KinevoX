/**
 * KinevoX — Exercise Catalogue
 *
 * All demonstration exercises with bilingual content.
 * This is the single source of truth for exercise data.
 */

import type { Exercise } from './types.ts';

export const exercises: Exercise[] = [
  {
    id: 'walk',
    title: { en: 'Easy-paced walk', ar: 'مشي بإيقاع مريح' },
    instructions: {
      en: 'Walk at a pace that lets you talk comfortably. Start small and build when it feels right.',
      ar: 'امشِ بإيقاع يسمح لك بالتحدث براحة. ابدأ بخطوات بسيطة وزدها عندما تشعر بالاستعداد.',
    },
    category: 'cardio',
    equipment: 'none',
    duration: 8,
    difficulty: 'new',
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'chair-squat',
    title: { en: 'Chair sit-to-stand', ar: 'الجلوس والوقوف من الكرسي' },
    instructions: {
      en: 'Sit toward the front of a sturdy chair. Stand up smoothly, then sit back with control.',
      ar: 'اجلس عند مقدمة كرسي ثابت. قف بسلاسة ثم عد للجلوس بتحكم.',
    },
    category: 'strength',
    equipment: 'none',
    duration: 6,
    difficulty: 'new',
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'wall-push',
    title: { en: 'Wall push-up', ar: 'ضغط الحائط' },
    instructions: {
      en: 'Place hands on a wall at chest height. Bend your elbows to lean in, then press away.',
      ar: 'ضع يديك على الحائط بمستوى الصدر. اثنِ المرفقين للاقتراب ثم ادفع للابتعاد.',
    },
    category: 'strength',
    equipment: 'none',
    duration: 5,
    difficulty: 'new',
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'march',
    title: { en: 'Standing march', ar: 'المشي في المكان' },
    instructions: {
      en: 'Stand tall and lift one knee at a time at a comfortable pace. Keep a stable surface nearby if useful.',
      ar: 'قف باستقامة وارفع ركبة تلو الأخرى بإيقاع مريح. أبقِ سطحاً ثابتاً قريباً عند الحاجة.',
    },
    category: 'cardio',
    equipment: 'none',
    duration: 5,
    difficulty: 'new',
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'stretch',
    title: { en: 'Gentle full-body stretch', ar: 'تمدد لطيف للجسم بالكامل' },
    instructions: {
      en: 'Move slowly through a comfortable range. Avoid forcing or bouncing into a stretch.',
      ar: 'تحرك ببطء ضمن مدى مريح. تجنب الضغط أو الارتداد أثناء التمدد.',
    },
    category: 'mobility',
    equipment: 'none',
    duration: 5,
    difficulty: 'new',
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'band-row',
    title: { en: 'Seated resistance-band row', ar: 'سحب الشريط المطاطي جلوساً' },
    instructions: {
      en: 'Sit tall with a band around your feet. Draw elbows back gently, then return with control.',
      ar: 'اجلس باستقامة وضع الشريط حول قدميك. اسحب المرفقين للخلف بلطف ثم عُد بتحكم.',
    },
    category: 'strength',
    equipment: 'basic',
    duration: 6,
    difficulty: 'new',
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'calf-raise',
    title: { en: 'Supported calf raise', ar: 'رفع الكعب مع الاستناد' },
    instructions: {
      en: 'Hold a stable surface lightly. Rise onto your toes and lower slowly.',
      ar: 'استند بخفة إلى سطح ثابت. ارفع كعبيك ثم اخفضهما ببطء.',
    },
    category: 'strength',
    equipment: 'none',
    duration: 4,
    difficulty: 'new',
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'breath-mobility',
    title: { en: 'Breath-led mobility', ar: 'حركة مرنة مع التنفس' },
    instructions: {
      en: 'Pair slow breathing with easy shoulder, hip and ankle movements.',
      ar: 'نسّق التنفس البطيء مع حركات مريحة للكتفين والوركين والكاحلين.',
    },
    category: 'mobility',
    equipment: 'none',
    duration: 7,
    difficulty: 'new',
    reviewStatus: 'demo-unreviewed',
  },
  {
    id: 'dumbbell-press',
    title: { en: 'Light dumbbell press', ar: 'ضغط دمبل خفيف' },
    instructions: {
      en: 'With light weights, press upward smoothly and lower with control. Keep the movement comfortable.',
      ar: 'باستخدام أوزان خفيفة، ادفع للأعلى بسلاسة واخفض بتحكم ضمن حركة مريحة.',
    },
    category: 'strength',
    equipment: 'gym',
    duration: 6,
    difficulty: 'some',
    reviewStatus: 'demo-unreviewed',
  },
];

/** Look up an exercise by its ID. Returns undefined if not found. */
export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}
