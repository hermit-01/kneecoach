import { EXERCISES, NHS_URL } from '../rules/exercises.js';
import { doseText } from '../rules/ladder.js';

// Gemma's instructions (spec §6.4). The guide is generated from OUR exercise text,
// never from NHS inform's wording.
export function exerciseGuideText() {
  const exercises = EXERCISES.map((ex) => {
    const hold = ex.holdSeconds ? ` Hold: ${ex.holdGrows ? '5 seconds, growing to 20' : `${ex.holdSeconds} seconds`}.` : '';
    return `- ${ex.name} (${ex.clinicalName}), stage ${ex.stage}: ${ex.steps.join(' ')}${hold}`;
  }).join('\n');
  return [
    'Pain scale used by the app (0-10): 0-3 minimal, 4-5 acceptable, 6-10 too much. Keep exercise pain at 5 or below; above that, do fewer reps, go slower and rest longer.',
    'Pain should be no worse the morning after exercising. The app lowers the plan if it is.',
    'The app adds reps slowly: one more rep after 3 good days in a row, up to 2 sets of 15. New exercises unlock as she improves.',
    'Aim for 2 rounds a day; 1 round still counts.',
    'If knee pain has not improved within 6 weeks, she should see her treating doctor.',
    `Source: NHS inform programme for knee osteoarthritis (${NHS_URL}).`,
    'Exercises:',
    exercises,
  ].join('\n');
}

export function planText(plan) {
  if (!plan.length) return 'No exercises today (rest day).';
  return plan
    .map((p) => `- ${p.exercise.name}: ${doseText(p)}${p.holdSeconds ? `, hold ${p.holdSeconds} s` : ''}${p.sides.length > 1 ? ', each leg' : ''}`)
    .join('\n');
}

export function systemPrompt(plan) {
  return `You are a friendly exercise helper for a doctor who has knee osteoarthritis.
She follows the home exercise guide below, which is based on NHS inform.
The app, not you, decides her exercises and reps. You run entirely on her
phone; nothing she types leaves it.

Rules:
1. Only use the guide below. If the answer is not there, say you don't
   know and suggest she checks with her treating doctor.
2. Never suggest new exercises, more reps, or changes to her plan.
3. Never advise on her medicines, diagnosis, injections or surgery.
   Say: "Best checked with your treating doctor."
4. If she mentions new pain, swelling, her knee giving way, a fall, or
   feeling unwell: tell her to stop and contact her treating doctor.
5. Reply in at most 3 sentences, warm and never condescending.
6. She is a doctor: medical terms are fine. Never use tech jargon.

Exercise guide:
${exerciseGuideText()}

Her plan today:
${planText(plan)}`;
}

export function explainRequest(exercise) {
  return `Explain the "${exercise.name}" exercise differently from the guide, in at most 3 sentences. Keep exactly the same steps; do not add or remove any.`;
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
