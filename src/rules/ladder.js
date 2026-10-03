// The dose ladder (spec §5.2): rung 0 is 1 set of 2 reps, rung 14 is 2 sets of 15.
export const RUNGS = [
  ...[2, 3, 4, 5, 6, 7, 8].map((reps) => ({ sets: 1, reps })),
  ...[8, 9, 10, 11, 12, 13, 14, 15].map((reps) => ({ sets: 2, reps })),
];
export const MAX_RUNG = RUNGS.length - 1;

export function clampRung(index) {
  return Math.min(MAX_RUNG, Math.max(0, index));
}

export function rungAt(index) {
  return RUNGS[clampRung(index)];
}

export function doseText({ sets, reps }) {
  return sets === 1 ? `${reps} reps` : `${sets} sets of ${reps} reps, 1 minute rest between`;
}
