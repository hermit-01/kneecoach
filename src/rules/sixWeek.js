import { daysBetween, addDays } from './dates.js';

// Spec §5.7. mornings: { 'YYYY-MM-DD': pain } for the days she checked in.
// Returns { show, state }. `show` is true once, when week 6 is not better than week 1.
export function sixWeekCheck(state, mornings, today) {
  if (state.sixWeekCheckShown || !state.firstExerciseDate) return { show: false, state };
  if (daysBetween(state.firstExerciseDate, today) < 42) return { show: false, state };
  const average = (fromDay, toDay) => {
    const values = [];
    for (let day = fromDay; day <= toDay; day++) {
      const pain = mornings[addDays(state.firstExerciseDate, day - 1)];
      if (pain !== undefined && pain !== null) values.push(pain);
    }
    return values.length >= 3 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  const week1 = average(1, 7);
  const week6 = average(36, 42);
  if (week1 === null || week6 === null || week6 < week1) return { show: false, state };
  return { show: true, state: { ...state, sixWeekCheckShown: true } };
}
