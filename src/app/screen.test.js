import { describe, it, expect } from 'vitest';
import { screenFor, watchForNewDay, estimateMinutes, progressText } from './screen.js';
import { emptyDay } from '../data/db.js';
import { MAX_RUNG } from '../rules/ladder.js';

describe('progressText', () => {
  it('shows how close she is to the next step up, and what counts as a good day', () => {
    const text = progressText({ streak: 1, level: 3 });
    expect(text).toMatch(/^Good days in a row: 1 of 3\. After 3, the app steps up your reps/);
    expect(text).toMatch(/pain of 5 or less after every round/);
  });
  it('says so when she has reached the top of the programme', () => {
    expect(progressText({ streak: 0, level: MAX_RUNG })).toMatch(/top of the programme: 2 sets of 15/);
  });
});

const day = (over = {}) => ({ ...emptyDay('2026-10-04'), ...over });
const exercising = day({ morning: { pain: 2 }, decision: { type: 'EXERCISE' } });

describe('screenFor', () => {
  it('routes the Today tab', () => {
    expect(screenFor({ profile: null, day: day(), plan: [] })).toBe('setup');
    expect(screenFor({ profile: {}, day: day(), plan: [] })).toBe('checkin');
    expect(screenFor({ profile: {}, day: day({ morning: { pain: 7 }, decision: { type: 'REST_PAIN' } }), plan: [] })).toBe('rest');
    expect(screenFor({ profile: {}, day: exercising, plan: [{}] })).toBe('plan');
  });
  it('says so when every exercise is switched off (review focus 2)', () => {
    expect(screenFor({ profile: {}, day: exercising, plan: [] })).toBe('all-off');
  });
});

describe('watchForNewDay (review focus 1)', () => {
  function fakeDocument(visibilityState = 'visible') {
    const doc = new EventTarget();
    doc.visibilityState = visibilityState;
    return doc;
  }
  it('reports a new day when the app comes back after midnight', () => {
    const doc = fakeDocument();
    const seen = [];
    const stop = watchForNewDay({ doc, getToday: () => '2026-10-05', shownDay: '2026-10-04', onNewDay: (d) => seen.push(d) });
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(seen).toEqual(['2026-10-05']);
    stop();
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(seen).toHaveLength(1);
  });
  it('does nothing on the same day or while hidden', () => {
    const seen = [];
    const same = fakeDocument();
    watchForNewDay({ doc: same, getToday: () => '2026-10-04', shownDay: '2026-10-04', onNewDay: (d) => seen.push(d) });
    same.dispatchEvent(new Event('visibilitychange'));
    const hidden = fakeDocument('hidden');
    watchForNewDay({ doc: hidden, getToday: () => '2026-10-05', shownDay: '2026-10-04', onNewDay: (d) => seen.push(d) });
    hidden.dispatchEvent(new Event('visibilitychange'));
    expect(seen).toEqual([]);
  });
});

describe('estimateMinutes', () => {
  it('counts holds, movement and rests, with a 3-minute minimum', () => {
    const item = { sets: 2, reps: 10, holdSeconds: 10, sides: ['left', 'right'] };
    expect(estimateMinutes([item])).toBe(Math.round((2 * (2 * 10 * 14 + 60)) / 60));
    expect(estimateMinutes([{ sets: 1, reps: 2, holdSeconds: null, sides: ['right'] }])).toBe(3);
  });
});
