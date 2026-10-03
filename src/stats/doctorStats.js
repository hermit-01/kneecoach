import { addDays } from '../rules/dates.js';
import { doseText, rungAt } from '../rules/ladder.js';

// Numbers for her treating doctor (spec §4, screen 6). All of them are computed in code.
export function doctorStats(days, today, window = 14) {
  const from = addDays(today, -(window - 1));
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
  const series = [];
  for (let i = 0; i < window; i++) {
    const date = addDays(from, i);
    const d = byDate[date];
    const afterPains = d ? d.rounds.map((r) => r.afterPain) : [];
    series.push({
      date,
      morningPain: d?.morning?.pain ?? null,
      afterPain: afterPains.length ? Math.max(...afterPains) : null,
      rounds: d ? d.rounds.length : 0,
      restDay: d?.decision ? d.decision.type !== 'EXERCISE' : false,
    });
  }
  const mornings = series.map((s) => s.morningPain).filter((p) => p !== null);
  return {
    from,
    to: today,
    window,
    series,
    exerciseDays: series.filter((s) => s.rounds > 0).length,
    firstMorningPain: mornings[0] ?? null,
    lastMorningPain: mornings.at(-1) ?? null,
    averageMorningPain: mornings.length ? Math.round((mornings.reduce((a, b) => a + b, 0) / mornings.length) * 10) / 10 : null,
    notes: days.filter((d) => d.notes && d.date >= from && d.date <= today).map((d) => ({ date: d.date, text: d.notes })),
  };
}

export function statsSummaryText(stats, state) {
  const lines = [
    `KneeCoach summary, ${stats.from} to ${stats.to}`,
    `Exercised on ${stats.exerciseDays} of ${stats.window} days.`,
    stats.averageMorningPain !== null
      ? `Morning pain (0-10 NRS): first ${stats.firstMorningPain}, latest ${stats.lastMorningPain}, average ${stats.averageMorningPain}.`
      : 'No morning pain scores yet.',
    `Current dose (first exercises): ${doseText(rungAt(state.level))}.`,
  ];
  for (const n of stats.notes) lines.push(`Note (${n.date}): ${n.text}`);
  return lines.join('\n');
}
