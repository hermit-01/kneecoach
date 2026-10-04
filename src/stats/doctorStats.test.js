import { describe, it, expect } from 'vitest';
import { doctorStats, statsSummaryText, withTodayNote } from './doctorStats.js';
import { emptyDay } from '../data/db.js';
import { initialState } from '../rules/planner.js';

const days = [
  { ...emptyDay('2026-10-01'), morning: { pain: 5 }, decision: { type: 'EXERCISE' }, rounds: [{ afterPain: 4, tooPainful: [], completed: [] }] },
  { ...emptyDay('2026-10-02'), morning: { pain: 7 }, decision: { type: 'REST_PAIN' } },
  { ...emptyDay('2026-10-03'), morning: { pain: 3 }, decision: { type: 'EXERCISE' }, notes: 'Stiff after stairs',
    rounds: [{ afterPain: 2, tooPainful: [], completed: [] }, { afterPain: 3, tooPainful: [], completed: [] }] },
];

describe('doctorStats', () => {
  it('builds a 14-day series ending today', () => {
    const s = doctorStats(days, '2026-10-03');
    expect(s.series).toHaveLength(14);
    expect(s.series.at(-1)).toEqual({ date: '2026-10-03', morningPain: 3, afterPain: 3, rounds: 2, restDay: false });
    expect(s.series.at(-2)).toMatchObject({ morningPain: 7, restDay: true, rounds: 0 });
    expect(s.series[0]).toMatchObject({ morningPain: null, afterPain: null });
  });
  it('summarises adherence and morning pain', () => {
    const s = doctorStats(days, '2026-10-03');
    expect(s).toMatchObject({ exerciseDays: 2, firstMorningPain: 5, lastMorningPain: 3, averageMorningPain: 5 });
    expect(s.notes).toEqual([{ date: '2026-10-03', text: 'Stiff after stairs' }]);
  });
  it('writes a plain-text summary for sharing', () => {
    const text = statsSummaryText(doctorStats(days, '2026-10-03'), { ...initialState(), level: 2 });
    expect(text).toContain('Exercised on 2 of 14 days.');
    expect(text).toContain('Morning pain (0-10 NRS): first 5, latest 3, average 5.');
    expect(text).toContain('Current dose (first exercises): 4 reps.');
    expect(text).toContain('Note (2026-10-03): Stiff after stairs');
  });
});

describe('withTodayNote (final review: the shared summary missed the note she had just typed)', () => {
  const base = { notes: [{ date: '2026-10-02', text: 'Stiff' }, { date: '2026-10-03', text: 'old note' }] };
  it('puts the note she is typing into the summary, replacing the saved one for today', () => {
    expect(withTodayNote(base, '2026-10-03', 'new note').notes).toEqual([{ date: '2026-10-02', text: 'Stiff' }, { date: '2026-10-03', text: 'new note' }]);
  });
  it('drops today when she clears the note, and keeps other days', () => {
    expect(withTodayNote(base, '2026-10-03', '   ').notes).toEqual([{ date: '2026-10-02', text: 'Stiff' }]);
  });
});
