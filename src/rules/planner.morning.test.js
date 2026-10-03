import { describe, it, expect } from 'vitest';
import { initialState, morningCheck } from './planner.js';

const today = '2026-10-10';
const noYesterday = { exercised: false, good: false };
const goodYesterday = { exercised: true, good: true };
const ok = { pain: 3, worse: false, redFlag: false };
const check = (state, answers, yesterday = noYesterday, date = today) =>
  morningCheck(state, answers, { today: date, yesterday });

describe('morningCheck', () => {
  it('starts at level 0 with an empty streak', () => {
    expect(initialState()).toMatchObject({ level: 0, streak: 0, penalty: {}, consecutiveRestDays: 0, consecutiveWorseMornings: 0 });
  });
  it('exercises normally on a calm first morning', () => {
    const { decision, state } = check(initialState(), ok);
    expect(decision).toMatchObject({ type: 'EXERCISE', seeDoctor: false });
    expect(state.level).toBe(0);
  });
  it('counts a good yesterday towards the streak', () => {
    expect(check(initialState(), ok, goodYesterday).state.streak).toBe(1);
  });
  it('steps up after the third good day and resets the streak', () => {
    const { state, decision } = check({ ...initialState(), level: 1, streak: 2 }, ok, goodYesterday);
    expect(state).toMatchObject({ level: 2, streak: 0 });
    expect(decision.reasons[0].source).toMatch(/add 1 or 2 reps/);
  });
  it('never steps above the top rung', () => {
    expect(check({ ...initialState(), level: 14, streak: 2 }, ok, goodYesterday).state.level).toBe(14);
  });
  it('does not grow the streak after a day that was not good', () => {
    const { state } = check({ ...initialState(), streak: 2 }, ok, { exercised: true, good: false });
    expect(state).toMatchObject({ streak: 2, level: 0 });
  });
  it('steps down when worse than yesterday morning after exercising', () => {
    const { state, decision } = check({ ...initialState(), level: 3, streak: 1 }, { ...ok, worse: true }, goodYesterday);
    expect(state).toMatchObject({ level: 2, streak: 0, consecutiveWorseMornings: 1 });
    expect(decision.seeDoctor).toBe(false);
    expect(decision.reasons[0].source).toMatch(/no worse the morning after/);
  });
  it('ignores "worse" when she did not exercise yesterday', () => {
    expect(check({ ...initialState(), level: 3 }, { ...ok, worse: true }).state.level).toBe(3);
  });
  it('asks her to see the doctor after two worse mornings in a row', () => {
    const start = { ...initialState(), level: 3, consecutiveWorseMornings: 1 };
    expect(check(start, { ...ok, worse: true }, goodYesterday).decision.seeDoctor).toBe(true);
  });
  it('never steps below rung 0', () => {
    expect(check(initialState(), { ...ok, worse: true }, goodYesterday).state.level).toBe(0);
  });
  it('rests and sends her to the doctor on a red flag', () => {
    const { decision, state } = check({ ...initialState(), streak: 2 }, { ...ok, redFlag: true }, goodYesterday);
    expect(decision).toMatchObject({ type: 'REST_RED_FLAG', seeDoctor: true });
    expect(state).toMatchObject({ streak: 0, consecutiveRestDays: 1 });
  });
  it('rests when morning pain is 6 or more, without growing the streak', () => {
    const { decision, state } = check({ ...initialState(), streak: 2 }, { ...ok, pain: 6 }, goodYesterday);
    expect(decision).toMatchObject({ type: 'REST_PAIN', seeDoctor: false });
    expect(state).toMatchObject({ streak: 0, level: 0 });
  });
  it('sends her to the doctor on the second rest day in a row', () => {
    expect(check({ ...initialState(), consecutiveRestDays: 1 }, { ...ok, pain: 7 }).decision.seeDoctor).toBe(true);
  });
  it('still steps down on a rest day when the morning after was worse', () => {
    const { state, decision } = check({ ...initialState(), level: 3 }, { pain: 7, worse: true, redFlag: false }, goodYesterday);
    expect(decision.type).toBe('REST_PAIN');
    expect(state.level).toBe(2);
  });
  it('restarts one step lower after more than 7 days off, once per break', () => {
    const start = { ...initialState(), level: 4, streak: 2, lastExerciseDate: '2026-10-01' };
    const first = check(start, ok, noYesterday, '2026-10-09');
    expect(first.state).toMatchObject({ level: 3, streak: 0 });
    expect(first.decision.reasons[0].source).toMatch(/7 days off/);
    expect(check(first.state, ok, noYesterday, '2026-10-10').state.level).toBe(3);
  });
  it('does not apply the long-break rule after exactly 7 days', () => {
    const start = { ...initialState(), level: 4, lastExerciseDate: '2026-10-02' };
    expect(check(start, ok, noYesterday, '2026-10-09').state.level).toBe(4);
  });
  it('does not change the state object it was given', () => {
    const start = initialState();
    check(start, { ...ok, worse: true }, goodYesterday);
    expect(start).toEqual(initialState());
  });
  it('attaches a reason and a source to every change', () => {
    const { decision } = check({ ...initialState(), level: 2 }, { ...ok, worse: true }, goodYesterday);
    expect(decision.reasons.length).toBeGreaterThan(0);
    for (const r of decision.reasons) {
      expect(r.text.length).toBeGreaterThan(5);
      expect(r.source.length).toBeGreaterThan(5);
    }
  });
});
