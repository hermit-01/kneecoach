import { exerciseById } from '../rules/exercises.js';

// Requests to change her plan are answered by code, never by Gemma (spec §0 and §6.3):
// in testing, Gemma 3 1B happily agreed to "20 reps today".
export const PLAN_CHANGE_PATTERN =
  /\b(more|extra|fewer|less|increase|decrease|double|add|harder|heavier)\b.*\b(reps?|sets?|times|exercises?|rounds?|lunges?|squats?|weights?)\b|\b\d+\s*(reps?|sets?)\b|\b(make it|go)\s+(harder|heavier)\b/i;

export const PLAN_CHANGE_MESSAGE =
  "The app sets your exercises and reps from your pain scores, so I can't change them. It adds a rep after 3 good days in a row, and you can switch exercises off in Settings.";

export function isPlanChangeRequest(text) {
  return PLAN_CHANGE_PATTERN.test(text);
}

// Medicines, injections, surgery and diet are for her treating doctor (spec §6.3). In testing,
// Gemma 3 1B called a steroid injection "reasonable", so these never reach it.
export const MEDICAL_PATTERN =
  /\b(ibuprofen|paracetamol|acetaminophen|naproxen|diclofenac|aspirin|nsaids?|painkillers?|pain ?killers?|medicines?|medications?|tablets?|pills?|doses?|dosage|\d+\s?mg|injections?|steroids?|cortisone|hyaluronic|surgery|operation|replacement|supplements?|glucosamine|turmeric|diet|foods?|eat|eating|weight loss|lose weight)\b/i;

export const MEDICAL_MESSAGE = "That's outside what this app covers, so it's best checked with your treating doctor.";

// In testing, Gemma 3 1B answered "Is my data sent anywhere?" with made-up progress.
export const PRIVACY_PATTERN =
  /\b(my data|data (is |be )?(sent|shared|stored|saved)|privacy|private|sent anywhere|leaves? (my|the|this) phone|upload(s|ed|ing)?|server|cloud|who can see)\b/i;

export const PRIVACY_MESSAGE = 'No. KneeCoach and its helper run entirely on this phone, and nothing you type or record leaves it.';

// The fixed answer from code for a question, or null when Gemma may answer it.
export function guardFor(text) {
  if (isPlanChangeRequest(text)) return { kind: 'planChange', message: PLAN_CHANGE_MESSAGE };
  if (MEDICAL_PATTERN.test(text)) return { kind: 'medical', message: MEDICAL_MESSAGE };
  if (PRIVACY_PATTERN.test(text)) return { kind: 'privacy', message: PRIVACY_MESSAGE };
  return null;
}

// "How do I do the bridge?" is answered with the app's own written steps, never by Gemma.
// In testing, Gemma described a mini squat as "bending the knee, squeezing the thigh, and
// raising the leg", and gave a dose for an exercise that was not yet in her plan.
const HOW_TO_PATTERN =
  /\b(how (do|should|can) (i|you) (do|perform)|how to (do|perform)|(right|correct|proper|safe) way to|what are the steps|steps (for|of|to)|instructions for|explain (the|a|an|how)|show me how|technique)\b/i;

// The words she might use for each exercise: the app's name, the clinical name, everyday words.
const EXERCISE_WORDS = {
  'heel-slide': ['knee bend', 'heel slide'],
  'static-quads': ['thigh squeeze', 'static quad', 'quad set'],
  'knee-roll': ['knee over a roll', 'knee roll', 'inner range quad'],
  'straight-leg-raise': ['straight leg raise', 'leg raise', 'slr'],
  'seated-stretch': ['seated knee stretch', 'knee stretch', 'knee extension stretch', 'seated stretch'],
  bridge: ['bridge'],
  'mini-squat': ['mini squat', 'squat', 'sit to stand'],
  'step-up': ['step up'],
  'single-leg-stand': ['one leg', 'single leg', 'balance'],
  'step-back': ['step back', 'reverse lunge', 'lunge'],
};
const plainWords = (text) => ` ${text.toLowerCase().replace(/[^a-z]+/g, ' ').trim()} `;

export function exerciseAskedAbout(text) {
  if (!HOW_TO_PATTERN.test(text)) return null;
  const words = plainWords(text);
  const id = Object.keys(EXERCISE_WORDS).find((key) =>
    EXERCISE_WORDS[key].some((w) => words.includes(` ${w} `) || words.includes(` ${w}s `)));
  return id ? exerciseById(id) : null;
}

export function stepsAnswer(exercise, plan) {
  const inPlan = plan.some((item) => item.exercise.id === exercise.id);
  return `${exercise.name} (${exercise.clinicalName}): ${exercise.steps.join(' ')}${inPlan ? '' : " It is not in today's plan."}`;
}
