import { describe, it, expect } from 'vitest';
import { ask, prepareHelper, getSnapshot, crashedLastTime, clearCrashFlag } from './helper.js';
import { RED_FLAG_MESSAGE } from './redflags.js';
import { PLAN_CHANGE_MESSAGE } from './guards.js';

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
}

describe('helper', () => {
  it('answers red-flag messages from code, without the AI', async () => {
    expect(await ask([], 'I fell this morning')).toEqual({ text: RED_FLAG_MESSAGE, redFlag: true });
  });
  it('answers plan-change requests from code, without the AI', async () => {
    expect(await ask([], 'Can I do 20 reps today?')).toEqual({ text: PLAN_CHANGE_MESSAGE, planChange: true });
  });
  it('says so when the AI is not ready', async () => {
    expect(await ask([], 'How long do I hold the thigh squeeze?')).toEqual({ text: null, unavailable: true });
  });
  it('marks the helper unavailable without WebGPU', async () => {
    await prepareHelper({ db: null, nav: {}, storage: memoryStorage() });
    expect(getSnapshot().status).toBe('unavailable');
  });
  it('does not try again after the phone crashed while loading it (review focus 4)', async () => {
    const storage = memoryStorage({ 'kneecoach-helper-loading': '123' });
    expect(crashedLastTime(storage)).toBe(true);
    await prepareHelper({ db: null, nav: { gpu: {} }, storage });
    expect(getSnapshot().status).toBe('crashed');
    clearCrashFlag(storage);
    expect(crashedLastTime(storage)).toBe(false);
  });
});
