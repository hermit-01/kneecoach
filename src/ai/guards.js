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
