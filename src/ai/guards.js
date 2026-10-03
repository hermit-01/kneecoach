// Requests to change her plan are answered by code, never by Gemma (spec §0 and §6.3):
// in testing, Gemma 3 1B happily agreed to "20 reps today".
export const PLAN_CHANGE_PATTERN =
  /\b(more|extra|fewer|less|increase|decrease|double|add|harder|heavier)\b.*\b(reps?|sets?|times|exercises?|rounds?|lunges?|squats?|weights?)\b|\b\d+\s*(reps?|sets?)\b|\b(make it|go)\s+(harder|heavier)\b/i;

export const PLAN_CHANGE_MESSAGE =
  "The app sets your exercises and reps from your pain scores, so I can't change them. It adds a rep after 3 good days in a row, and you can switch exercises off in Settings.";

export function isPlanChangeRequest(text) {
  return PLAN_CHANGE_PATTERN.test(text);
}
