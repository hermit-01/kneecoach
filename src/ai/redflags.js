// Checked in code before any message reaches Gemma (spec §6.3).
export const RED_FLAG_PATTERN =
  /\b(swell(ing|ed|s)?|swollen|gave way|giving way|give way|buckl(e|ed|es|ing)|fell|fall(en)?|can'?t (walk|stand|bear weight)|cannot (walk|stand|bear weight)|fever(ish)?|locked|locking|numb(ness)?|calf pain|hot and red)\b/i;

export const RED_FLAG_MESSAGE =
  'Please stop exercising for today and contact your treating doctor. New swelling, a fall, the knee giving way, numbness, calf pain or a fever need a doctor, not an exercise app.';

export function hasRedFlag(text) {
  return RED_FLAG_PATTERN.test(text);
}
