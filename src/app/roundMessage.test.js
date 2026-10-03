import { describe, it, expect } from 'vitest';
import { roundFacts, fixedRoundMessage } from './roundMessage.js';

const good = { type: 'GOOD', reasons: [] };

describe('round messages', () => {
  it('collects the facts code decided', () => {
    const facts = roundFacts({ outcome: good, afterPain: 4, state: { streak: 2 }, roundsDone: 1 });
    expect(facts).toEqual({ afterPain: 4, band: 'acceptable', tooMuch: false, goodDaysInARow: 2, roundsDone: 1, changes: [] });
  });
  it('suggests a second round after the first', () => {
    const msg = fixedRoundMessage(roundFacts({ outcome: good, afterPain: 2, state: { streak: 0 }, roundsDone: 1 }));
    expect(msg).toMatch(/minimal/);
    expect(msg).toMatch(/second round/);
  });
  it('stops for the day when the round hurt too much', () => {
    const outcome = { type: 'TOO_MUCH', reasons: [{ text: 'x', source: 'y' }] };
    expect(fixedRoundMessage(roundFacts({ outcome, afterPain: 7, state: { streak: 0 }, roundsDone: 1 }))).toMatch(/enough for today/);
  });
});
