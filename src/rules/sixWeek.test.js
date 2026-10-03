import { describe, it, expect } from 'vitest';
import { sixWeekCheck } from './sixWeek.js';
import { initialState } from './planner.js';
import { addDays } from './dates.js';

const first = '2026-10-05';
function mornings(week1Pain, week6Pain, count = 7) {
  const m = {};
  for (let i = 0; i < count; i++) {
    m[addDays(first, i)] = week1Pain; // days 1-7
    m[addDays(first, 35 + i)] = week6Pain; // days 36-42
  }
  return m;
}
const started = { ...initialState(), firstExerciseDate: first };
const day43 = addDays(first, 42);

describe('sixWeekCheck', () => {
  it('waits until 42 days have passed', () => {
    expect(sixWeekCheck(started, mornings(4, 4), addDays(first, 41)).show).toBe(false);
  });
  it('shows once when week 6 is not better than week 1', () => {
    const { show, state } = sixWeekCheck(started, mornings(4, 4), day43);
    expect(show).toBe(true);
    expect(state.sixWeekCheckShown).toBe(true);
    expect(sixWeekCheck(state, mornings(4, 4), addDays(day43, 1)).show).toBe(false);
  });
  it('stays quiet when week 6 is better', () => {
    expect(sixWeekCheck(started, mornings(5, 3), day43).show).toBe(false);
  });
  it('skips the check with fewer than 3 check-ins in a week', () => {
    expect(sixWeekCheck(started, mornings(4, 6, 2), day43).show).toBe(false);
  });
  it('does nothing before she has exercised', () => {
    expect(sixWeekCheck(initialState(), {}, day43).show).toBe(false);
  });
});
