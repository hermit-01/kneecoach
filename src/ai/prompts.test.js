import { describe, it, expect } from 'vitest';
import { systemPrompt, planText, checkAnswer, countSentences, explainRequest, roundMessageRequest } from './prompts.js';
import { buildPlan, initialState } from '../rules/planner.js';
import { EXERCISES, exerciseById } from '../rules/exercises.js';

describe('prompts', () => {
  it('includes the rules, every exercise and today\'s plan', () => {
    const prompt = systemPrompt(buildPlan(initialState(), { knee: 'right', disabled: [] }));
    for (const ex of EXERCISES) expect(prompt).toContain(ex.name);
    expect(prompt).toContain('- Thigh squeeze: 2 reps, hold 10 s');
    expect(prompt).toContain('Best checked with your treating doctor.');
    expect(prompt).toContain('She is a doctor: medical terms are fine.');
  });
  it('says when today is a rest day', () => expect(planText([])).toMatch(/rest day/));
  it('asks for a re-explanation without new steps', () => {
    expect(explainRequest(exerciseById('bridge'))).toMatch(/do not add or remove/);
  });
  it('turns round facts into a request', () => {
    const req = roundMessageRequest({ afterPain: 4, band: 'acceptable', tooMuch: false, goodDaysInARow: 2, roundsDone: 1, changes: [] });
    expect(req).toContain('4/10 (acceptable)');
  });
  it('checks answers for length and tech jargon', () => {
    expect(countSentences('Hold it for 10 seconds. Then relax!')).toBe(2);
    expect(checkAnswer('Hold it for 10 seconds. Then relax.').ok).toBe(true);
    expect(checkAnswer('One. Two. Three. Four.').ok).toBe(false);
    expect(checkAnswer('It runs on your GPU with tokens.').jargon).toEqual(['token', 'gpu']);
  });
});
