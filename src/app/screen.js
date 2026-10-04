import { MAX_RUNG } from '../rules/ladder.js';

// The Today screen's line about the next step up (spec §5.4: three good days in a row),
// so she can see that her reps grow on their own.
export function progressText({ streak, level }) {
  if (level >= MAX_RUNG) return "You're at the top of the programme: 2 sets of 15.";
  return `Good days in a row: ${streak} of 3. After 3, the app steps up your reps. A good day means pain of 5 or less after every round, and your knee no worse the next morning.`;
}

// Which screen the Today tab shows. Pure, so it can be tested.
export function screenFor({ profile, day, plan }) {
  if (!profile) return 'setup';
  if (!day.morning) return 'checkin';
  if (day.decision.type !== 'EXERCISE') return 'rest';
  if (plan.length === 0) return 'all-off';
  return 'plan';
}

// Phones keep apps in memory overnight. When the app comes back on screen on a
// new day, call onNewDay(date) so the morning check-in appears. Returns a stop function.
export function watchForNewDay({ doc = document, getToday, shownDay, onNewDay }) {
  const handler = () => {
    if (doc.visibilityState !== 'visible') return;
    const today = getToday();
    if (today !== shownDay) onNewDay(today);
  };
  doc.addEventListener('visibilitychange', handler);
  return () => doc.removeEventListener('visibilitychange', handler);
}

// Rough minutes for a round: hold plus about 4 s of movement per rep, plus a minute between sets.
export function estimateMinutes(plan) {
  const seconds = plan.reduce(
    (total, p) => total + p.sides.length * (p.sets * p.reps * ((p.holdSeconds ?? 0) + 4) + (p.sets - 1) * 60),
    0,
  );
  return Math.max(3, Math.round(seconds / 60));
}
