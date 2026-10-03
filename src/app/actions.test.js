import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { openKneeDb, getPlanState, saveDay, emptyDay, savePlanState, getDay } from '../data/db.js';
import { initialState } from '../rules/planner.js';
import { addDays } from '../rules/dates.js';
import { loadToday, completeSetup, submitMorning, finishRound, setExerciseEnabled, saveNotes, roundsStatus } from './actions.js';

let db;
let n = 0;
beforeEach(async () => {
  db = await openKneeDb(`actions-${++n}`);
  await completeSetup(db, { knee: 'right', exerciseTime: '08:00' }, '2026-10-04');
});

const calm = { pain: 2, worse: null, redFlag: false };

describe('actions', () => {
  it('gives no plan before the morning check-in', async () => {
    const { plan, profile, yesterday } = await loadToday(db, '2026-10-04');
    expect(profile.knee).toBe('right');
    expect(plan).toEqual([]);
    expect(yesterday).toEqual({ exercised: false, good: false });
  });
  it('builds the plan after a calm check-in and keeps it on reload', async () => {
    const { decision, plan } = await submitMorning(db, calm, '2026-10-04');
    expect(decision.type).toBe('EXERCISE');
    expect(plan).toHaveLength(5);
    expect((await loadToday(db, '2026-10-04')).plan).toHaveLength(5);
  });
  it('gives no plan on a rest day', async () => {
    expect((await submitMorning(db, { pain: 7, worse: null, redFlag: false }, '2026-10-04')).plan).toEqual([]);
  });
  it('steps up after three good exercise days', async () => {
    for (const date of ['2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07']) {
      await submitMorning(db, { pain: 2, worse: false, redFlag: false }, date);
      await finishRound(db, { completed: ['heel-slide'], tooPainful: [], afterPain: 3 }, date);
    }
    expect((await getPlanState(db)).level).toBe(1);
  });
  it('skips a too-painful exercise for the rest of the day', async () => {
    await submitMorning(db, calm, '2026-10-04');
    await finishRound(db, { completed: ['heel-slide'], tooPainful: ['knee-roll'], afterPain: 3 }, '2026-10-04');
    expect((await loadToday(db, '2026-10-04')).plan.map((p) => p.exercise.id)).not.toContain('knee-roll');
  });
  it('stops further rounds after a round that ends at 6 or more', async () => {
    await submitMorning(db, calm, '2026-10-04');
    const { day } = await finishRound(db, { completed: [], tooPainful: [], afterPain: 7 }, '2026-10-04');
    expect(roundsStatus(day)).toEqual({ done: 1, target: 2, canStartAnother: false });
  });
  it('lets her switch an exercise off and on again', async () => {
    expect((await setExerciseEnabled(db, 'step-up', false)).disabled).toEqual(['step-up']);
    expect((await setExerciseEnabled(db, 'step-up', true)).disabled).toEqual([]);
  });
  it('saves her notes for the day', async () => {
    await saveNotes(db, '2026-10-04', 'Stiff after the stairs');
    expect((await getDay(db, '2026-10-04')).notes).toBe('Stiff after the stairs');
  });
  it('flags the six-week message when week 6 is no better', async () => {
    const first = '2026-08-20';
    await savePlanState(db, { ...initialState(), firstExerciseDate: first });
    for (let i = 0; i < 7; i++) {
      await saveDay(db, { ...emptyDay(addDays(first, i)), morning: { pain: 4, worse: false, redFlag: false } });
      await saveDay(db, { ...emptyDay(addDays(first, 35 + i)), morning: { pain: 5, worse: false, redFlag: false } });
    }
    const { decision } = await submitMorning(db, calm, addDays(first, 42));
    expect(decision.sixWeekMessage).toBe(true);
  });
});
