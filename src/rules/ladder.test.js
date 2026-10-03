import { describe, it, expect } from 'vitest';
import { RUNGS, MAX_RUNG, rungAt, clampRung, doseText } from './ladder.js';

describe('dose ladder', () => {
  it('has 15 rungs from 1x2 to 2x15', () => {
    expect(RUNGS).toHaveLength(15);
    expect(RUNGS[0]).toEqual({ sets: 1, reps: 2 });
    expect(RUNGS[6]).toEqual({ sets: 1, reps: 8 });
    expect(RUNGS[7]).toEqual({ sets: 2, reps: 8 });
    expect(RUNGS[MAX_RUNG]).toEqual({ sets: 2, reps: 15 });
  });
  it('clamps rung numbers into range', () => {
    expect(clampRung(-3)).toBe(0);
    expect(clampRung(99)).toBe(MAX_RUNG);
    expect(clampRung(4)).toBe(4);
    expect(rungAt(-1)).toEqual({ sets: 1, reps: 2 });
    expect(rungAt(20)).toEqual({ sets: 2, reps: 15 });
  });
  it('describes a dose', () => {
    expect(doseText({ sets: 1, reps: 3 })).toBe('3 reps');
    expect(doseText({ sets: 2, reps: 9 })).toBe('2 sets of 9 reps, 1 minute rest between');
  });
});
