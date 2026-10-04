import { doseText } from '../rules/ladder.js';

// Gemma's instructions (spec §0 and §6.4). Kept short on purpose: on a phone's graphics
// chip, every word of the prompt has to be read before the first word of the answer.

export function planText(plan) {
  if (!plan.length) return 'No exercises today (rest day).';
  return plan
    .map((p) => `- ${p.exercise.name}: ${doseText(p)}${p.holdSeconds ? `, hold ${p.holdSeconds} s` : ''}${p.sides.length > 1 ? ', each leg' : ''}`)
    .join('\n');
}

export function systemPrompt(plan) {
  return `You are a friendly exercise helper for a doctor who has knee osteoarthritis. The app, not you, sets her exercises and reps. You run on her phone; nothing she types leaves it.
Rules: Answer only from the facts below. If the answer is not there, say so and suggest she checks with her treating doctor. Never suggest new exercises, more reps or plan changes. Never advise on medicines, diagnosis, injections or surgery; say "Best checked with your treating doctor." If she mentions new pain, swelling, the knee giving way, a fall or feeling unwell, tell her to stop and contact her treating doctor. Reply in at most 3 sentences. She is a doctor: medical terms are fine. Never use tech jargon.
Facts: Pain 0-3 is minimal, 4-5 acceptable, 6-10 too much; keep exercise pain at 5 or below. Pain should be no worse the next morning; if it is, the app makes the plan easier. The app adds one rep after 3 good days in a row, up to 2 sets of 15. Aim for 2 rounds a day; 1 still counts. If knee pain has not improved within 6 weeks, she should see her treating doctor. Source: NHS inform programme for knee osteoarthritis.
Her plan today:
${planText(plan)}`;
}

// Focused instructions for the jobs that aren't questions. A 1B model follows a short,
// single-purpose instruction far better than the general one.
export const REWRITE_SYSTEM =
  'You rewrite exercise instructions in different words for a doctor who has knee osteoarthritis. Keep the same steps in the same order and add nothing: no new advice, warnings or exercises. Use at most 3 short sentences. Medical terms are fine.';
export const MESSAGE_SYSTEM =
  'You write one or two warm, encouraging sentences for a doctor doing her knee exercises. Use only the facts given. Do not give advice or change her plan.';
export const DOCTOR_SYSTEM =
  'You draft a short clinical note of at most 3 sentences for a treating doctor. Use only the numbers and notes given. Do not add advice, diagnoses or recommendations.';

export function explainRequest(exercise) {
  return `Rewrite the "${exercise.name}" exercise in at most 3 sentences, keeping exactly these steps and adding none. ${exercise.name}: ${exercise.steps.join(' ')}`;
}

// The sentences of an answer, without formatting symbols or line breaks.
export function sentencesOf(text) {
  const plain = text
    .replace(/\*\*|__|`/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return plain.split(/(?<=[.!?])\s+/).filter(Boolean);
}

// Every answer is cleaned in code: no formatting symbols, and at most 3 sentences.
export function tidyAnswer(text, maxSentences = 3) {
  return sentencesOf(text).slice(0, maxSentences).join(' ');
}

export function roundMessageRequest(f) {
  const today = f.tooMuch
    ? 'that is too much, so the app stopped today and will make tomorrow one step easier'
    : `rounds done today: ${f.roundsDone}`;
  const changes = f.changes.length ? ` Changes: ${f.changes.join(' ')}` : '';
  return `She just finished a round. Facts from the app: pain after the round ${f.afterPain}/10 (${f.band}); ${today}; good days in a row: ${f.goodDaysInARow}.${changes} Write 1-2 warm sentences for her using only these facts.`;
}

export function doctorParagraphRequest(summaryText) {
  return `Draft a short paragraph (at most 3 sentences) for her treating doctor, using only these numbers and notes. Use clinical terms. Do not add advice.\n\n${summaryText}`;
}

// Automatic answer checks used by the evaluation (spec §6.5).
export const JARGON = ['token', 'cache', 'gpu', 'webgpu', 'llm', 'weights'];

export function countSentences(text) {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean).length;
}

export function checkAnswer(text) {
  const lower = text.toLowerCase();
  const jargon = JARGON.filter((word) => new RegExp(`\\b${word}s?\\b`).test(lower));
  const sentences = countSentences(text);
  return { ok: sentences <= 3 && jargon.length === 0, sentences, jargon };
}
