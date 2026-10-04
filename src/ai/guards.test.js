import { describe, it, expect } from 'vitest';
import { isPlanChangeRequest, guardFor, MEDICAL_MESSAGE, PRIVACY_MESSAGE, PLAN_CHANGE_MESSAGE, exerciseAskedAbout, stepsAnswer } from './guards.js';
import { buildPlan, initialState } from '../rules/planner.js';
import { exerciseById } from '../rules/exercises.js';

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

describe("how-to questions get the app's own steps", () => {
  const howTo = [
    ['How do I do the bridge?', 'bridge'],
    ['What is the correct way to do a mini squat?', 'mini-squat'],
    ['How do I do the heel slide?', 'heel-slide'],
    ['Explain the thigh squeeze to me', 'static-quads'],
    ['How should I do step-ups?', 'step-up'],
    ['What are the steps for the straight leg raise?', 'straight-leg-raise'],
    ['How do I do the balance exercise?', 'single-leg-stand'],
  ];
  it.each(howTo)('"%s" is about %s', (text, id) => expect(exerciseAskedAbout(text)?.id).toBe(id));
  const gemma = [
    'How long do I hold the thigh squeeze?',
    'How many times should I do the straight-leg raise today?',
    'Why does the straight-leg raise help?',
    'It hurts more the next morning. What should I do?',
    'How should I do my exercises today?',
  ];
  it.each(gemma)('"%s" is left to Gemma', (text) => expect(exerciseAskedAbout(text)).toBeNull());
  it("answers with the written steps, and says when the exercise is not in today's plan", () => {
    const plan = buildPlan(initialState(), { knee: 'right', disabled: [] });
    const bridge = stepsAnswer(exerciseById('bridge'), plan);
    expect(bridge).toContain('Push through your feet to lift your hips towards the ceiling.');
    expect(bridge).toMatch(/not in today's plan/);
    expect(stepsAnswer(exerciseById('heel-slide'), plan)).not.toMatch(/not in today's plan/);
  });
});
