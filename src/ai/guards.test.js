import { describe, it, expect } from 'vitest';
import { isPlanChangeRequest } from './guards.js';

const changes = ['Can I do 20 reps today? I feel great!', 'Can you add some lunges?', 'Should I do more sets?', 'Is it okay if I do 3 sets?', 'Can I make it harder?'];
const fine = ['How long do I hold the thigh squeeze?', 'How many times should I do the straight-leg raise today?', 'Why does the straight-leg raise help?', 'My pain is 5 out of 10 during the exercise. Is that okay?', 'Explain the bridge differently'];

describe('isPlanChangeRequest', () => {
  it.each(changes)('answers "%s" from code', (text) => expect(isPlanChangeRequest(text)).toBe(true));
  it.each(fine)('lets "%s" through to Gemma', (text) => expect(isPlanChangeRequest(text)).toBe(false));
});
