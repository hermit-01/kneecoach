import { describe, it, expect } from 'vitest';
import { systemPrompt, planText, checkAnswer, countSentences, tidyAnswer } from './prompts.js';
import { buildPlan, initialState } from '../rules/planner.js';

describe('prompts', () => {
  it('keeps the prompt short and includes the rules and today\'s plan', () => {
    const prompt = systemPrompt(buildPlan(initialState(), { knee: 'right', disabled: [] }));
    expect(prompt.length).toBeLessThan(2000);
    expect(prompt).toContain('- Thigh squeeze: 2 reps, hold 10 s');
    expect(prompt).toContain('Best checked with your treating doctor.');
    expect(prompt).toContain('She is a doctor: medical terms are fine.');
  });
  it('says when today is a rest day', () => expect(planText([])).toMatch(/rest day/));
  it('checks answers for length and tech jargon', () => {
    expect(countSentences('Hold it for 10 seconds. Then relax!')).toBe(2);
    expect(checkAnswer('Hold it for 10 seconds. Then relax.').ok).toBe(true);
    expect(checkAnswer('One. Two. Three. Four.').ok).toBe(false);
    expect(checkAnswer('It runs on your GPU with tokens.').jargon).toEqual(['token', 'gpu']);
  });
});

describe('tidyAnswer', () => {
  it('keeps at most 3 sentences', () => {
    expect(tidyAnswer('One. Two! Three? Four. Five.')).toBe('One. Two! Three?');
  });
  it('removes formatting symbols and line breaks', () => {
    expect(tidyAnswer('**Best checked** with your\n\ntreating doctor.')).toBe('Best checked with your treating doctor.');
  });
});
