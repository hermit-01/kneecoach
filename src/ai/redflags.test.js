import { describe, it, expect } from 'vitest';
import { hasRedFlag } from './redflags.js';

const positives = [
  'My knee swelled up after yesterday', 'I fell this morning', 'it is swollen', 'the knee gave way on the stairs',
  "I can't bear weight on it", 'I have a fever', 'my knee keeps locking', 'numbness in my foot',
  'calf pain since last night', 'it is hot and red',
];
const negatives = [
  'I felt great today', 'How long do I hold the thigh squeeze?', 'Is it normal for my knee to click?',
  'Can I do 20 reps today?', "What's the best diet for arthritis?",
];

describe('hasRedFlag', () => {
  it.each(positives)('catches "%s"', (text) => expect(hasRedFlag(text)).toBe(true));
  it.each(negatives)('lets "%s" through', (text) => expect(hasRedFlag(text)).toBe(false));
});
