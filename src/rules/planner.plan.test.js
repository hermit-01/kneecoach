import { describe, it, expect } from 'vitest';
import { buildPlan, afterRound, isGoodDay, initialState } from './planner.js';

const right = { knee: 'right', disabled: [] };
const find = (plan, id) => plan.find((p) => p.exercise.id === id);

describe('buildPlan', () => {
  it('starts with the five stage-1 exercises at 2 reps', () => {
    const plan = buildPlan(initialState(), right);
    expect(plan.map((p) => p.exercise.id)).toEqual(['heel-slide', 'static-quads', 'knee-roll', 'straight-leg-raise', 'seated-stretch']);
    for (const p of plan) expect([p.sets, p.reps]).toEqual([1, 2]);
  });
  it('unlocks stage 2 at level 2, starting those exercises at 2 reps', () => {
    const plan = buildPlan({ ...initialState(), level: 2 }, right);
    expect(plan).toHaveLength(7);
    expect(find(plan, 'heel-slide').reps).toBe(4);
    expect(find(plan, 'bridge').reps).toBe(2);
  });
  it('unlocks stage 3 at level 4', () => {
    expect(buildPlan({ ...initialState(), level: 4 }, right)).toHaveLength(10);
  });
  it('hides the standing exercises again if her level drops', () => {
    expect(buildPlan({ ...initialState(), level: 3 }, right)).toHaveLength(7);
  });
  it('makes a "too painful" exercise one step easier', () => {
    const plan = buildPlan({ ...initialState(), level: 3, penalty: { 'static-quads': 1 } }, right);
    expect(find(plan, 'static-quads').reps).toBe(4);
    expect(find(plan, 'heel-slide').reps).toBe(5);
  });
  it('never goes below 2 reps', () => {
    expect(find(buildPlan({ ...initialState(), penalty: { 'heel-slide': 5 } }, right), 'heel-slide').reps).toBe(2);
  });
  it('leaves out exercises she switched off and ones skipped today', () => {
    const plan = buildPlan(initialState(), { knee: 'right', disabled: ['knee-roll'] }, { skipToday: ['static-quads'] });
    expect(plan.map((p) => p.exercise.id)).toEqual(['heel-slide', 'straight-leg-raise', 'seated-stretch']);
  });
  it('does single-leg exercises on both sides when both knees are sore', () => {
    const plan = buildPlan({ ...initialState(), level: 2 }, { knee: 'both', disabled: [] });
    expect(find(plan, 'heel-slide').sides).toEqual(['left', 'right']);
    expect(find(plan, 'bridge').sides).toEqual(['both']);
  });
  it('grows the balance hold from 5 to 20 seconds', () => {
    const hold = (level) => find(buildPlan({ ...initialState(), level }, right), 'single-leg-stand').holdSeconds;
    expect([hold(4), hold(5), hold(7), hold(14)]).toEqual([5, 10, 20, 20]);
  });
  it('moves to two sets after 8 reps', () => {
    const p = buildPlan({ ...initialState(), level: 7 }, right)[0];
    expect([p.sets, p.reps]).toEqual([2, 8]);
  });
});

describe('afterRound', () => {
  it('records the exercise date and clears the rest-day count', () => {
    const { state, outcome } = afterRound({ ...initialState(), consecutiveRestDays: 2 }, { afterPain: 4, tooPainful: [] }, '2026-10-05');
    expect(outcome.type).toBe('GOOD');
    expect(state).toMatchObject({ lastExerciseDate: '2026-10-05', firstExerciseDate: '2026-10-05', consecutiveRestDays: 0 });
  });
  it('keeps the first exercise date once set', () => {
    const { state } = afterRound({ ...initialState(), firstExerciseDate: '2026-10-01' }, { afterPain: 2, tooPainful: [] }, '2026-10-05');
    expect(state.firstExerciseDate).toBe('2026-10-01');
  });
  it('steps down and stops for the day when pain afterwards is 6 or more', () => {
    const { state, outcome } = afterRound({ ...initialState(), level: 3, streak: 2 }, { afterPain: 6, tooPainful: [] }, '2026-10-05');
    expect(outcome.type).toBe('TOO_MUCH');
    expect(state).toMatchObject({ level: 2, streak: 0 });
  });
  it('adds a penalty for each exercise marked too painful', () => {
    const { state, outcome } = afterRound({ ...initialState(), penalty: { bridge: 1 } }, { afterPain: 3, tooPainful: ['bridge', 'knee-roll'] }, '2026-10-05');
    expect(state.penalty).toEqual({ bridge: 2, 'knee-roll': 1 });
    expect(outcome.reasons[0].source).toMatch(/fewer reps/);
  });
});

describe('isGoodDay', () => {
  const round = (afterPain, tooPainful = []) => ({ completed: [], tooPainful, afterPain });
  it('needs at least one round', () => expect(isGoodDay({ rounds: [] })).toBe(false));
  it('is good when every round ended at 5 or below with nothing too painful', () => expect(isGoodDay({ rounds: [round(5), round(2)] })).toBe(true));
  it('is not good after a round at 6 or more', () => expect(isGoodDay({ rounds: [round(3), round(6)] })).toBe(false));
  it('is not good if anything was too painful', () => expect(isGoodDay({ rounds: [round(2, ['bridge'])] })).toBe(false));
});
