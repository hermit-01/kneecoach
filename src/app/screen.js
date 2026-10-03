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
