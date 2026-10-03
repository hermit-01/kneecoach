import { describe, it, expect } from 'vitest';
import { isPlanChangeRequest, guardFor, MEDICAL_MESSAGE, PRIVACY_MESSAGE, PLAN_CHANGE_MESSAGE } from './guards.js';

const changes = ['Can I do 20 reps today? I feel great!', 'Can you add some lunges?', 'Should I do more sets?', 'Is it okay if I do 3 sets?', 'Can I make it harder?'];
const fine = ['How long do I hold the thigh squeeze?', 'How many times should I do the straight-leg raise today?', 'Why does the straight-leg raise help?', 'My pain is 5 out of 10 during the exercise. Is that okay?', 'Explain the bridge differently'];

describe('isPlanChangeRequest', () => {
  it.each(changes)('answers "%s" from code', (text) => expect(isPlanChangeRequest(text)).toBe(true));
  it.each(fine)('lets "%s" through to Gemma', (text) => expect(isPlanChangeRequest(text)).toBe(false));
});

describe('guardFor', () => {
  const medical = ['Should I take ibuprofen before exercising?', 'Is a steroid injection worth it?', "What's the best diet for arthritis?", 'Do I need knee replacement surgery?', 'Can I take glucosamine?'];
  const privacy = ['Is my data sent anywhere?', 'Does this upload anything to a server?', 'Who can see my answers?'];
  const gemma = ['How long do I hold the thigh squeeze?', 'Why does the straight-leg raise help?', 'My pain is 5 out of 10 during the exercise. Is that okay?', 'It hurts more the next morning. What should I do?', 'Is it normal for my knee to click?'];
  it.each(medical)('answers "%s" with the treating-doctor message', (text) => expect(guardFor(text)).toEqual({ kind: 'medical', message: MEDICAL_MESSAGE }));
  it.each(privacy)('answers "%s" with the privacy message', (text) => expect(guardFor(text)).toEqual({ kind: 'privacy', message: PRIVACY_MESSAGE }));
  it.each(gemma)('leaves "%s" to Gemma', (text) => expect(guardFor(text)).toBeNull());
  it('reports plan changes too', () => expect(guardFor('Can I do 20 reps today?')).toEqual({ kind: 'planChange', message: PLAN_CHANGE_MESSAGE }));
});
