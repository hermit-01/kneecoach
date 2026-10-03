import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { openKneeDb, getProfile, saveProfile, getPlanState, savePlanState, getDay, saveDay, getDaysBetween, emptyDay } from './db.js';
import { initialState } from '../rules/planner.js';

let db;
let n = 0;
beforeEach(async () => {
  db = await openKneeDb(`test-${++n}`);
});

describe('db', () => {
  it('has no profile until setup is saved', async () => {
    expect(await getProfile(db)).toBeNull();
    await saveProfile(db, { knee: 'right', exerciseTime: '08:00', disabled: [], createdAt: '2026-10-03' });
    expect((await getProfile(db)).knee).toBe('right');
  });
  it('returns the starting plan state until one is saved', async () => {
    expect(await getPlanState(db)).toEqual(initialState());
    await savePlanState(db, { ...initialState(), level: 3 });
    expect((await getPlanState(db)).level).toBe(3);
  });
  it('returns an empty day for dates with no log', async () => {
    expect(await getDay(db, '2026-10-03')).toEqual(emptyDay('2026-10-03'));
  });
  it('saves days and reads a date range in order', async () => {
    for (const date of ['2026-10-05', '2026-10-03', '2026-10-04', '2026-10-09']) await saveDay(db, { ...emptyDay(date), notes: date });
    const days = await getDaysBetween(db, '2026-10-03', '2026-10-05');
    expect(days.map((d) => d.date)).toEqual(['2026-10-03', '2026-10-04', '2026-10-05']);
  });
});
