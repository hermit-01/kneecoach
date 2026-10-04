import { describe, it, expect } from 'vitest';
import { ask, prepareHelper, getSnapshot, crashedLastTime, clearCrashFlag, isFatalGpuError, reportFatalError, failureReply } from './helper.js';
import { TooSlowError } from './reply.js';
import { RED_FLAG_MESSAGE } from './redflags.js';
import { PLAN_CHANGE_MESSAGE, MEDICAL_MESSAGE, PRIVACY_MESSAGE } from './guards.js';

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

describe('helper guards', () => {
  it('answers medicine questions from code', async () => {
    expect(await ask([], 'Is a steroid injection worth it?')).toEqual({ text: MEDICAL_MESSAGE, medical: true });
  });
  it('answers privacy questions from code', async () => {
    expect(await ask([], 'Is my data sent anywhere?')).toEqual({ text: PRIVACY_MESSAGE, privacy: true });
  });
});

describe('fatal graphics errors (review focus 4)', () => {
  it('recognises the lost-device error seen on the POCO', () => {
    expect(isFatalGpuError(new Error("Failed to execute 'mapAsync' on 'GPUBuffer': [Device] is lost."))).toBe(true);
    expect(isFatalGpuError(new Error('failed to call OrtRun(). ERROR_CODE: 1'))).toBe(true);
    expect(isFatalGpuError(new Error('Network error'))).toBe(false);
  });
  it('switches the helper off for this session only, so a briefly lost graphics chip gets another chance next start', () => {
    const storage = memoryStorage();
    expect(reportFatalError(new Error('[Device] is lost'), storage)).toBe(true);
    expect(getSnapshot().status).toBe('crashed');
    expect(crashedLastTime(storage)).toBe(false);
    expect(reportFatalError(new Error('timeout'), memoryStorage())).toBe(false);
  });
});

describe('failureReply', () => {
  it('tells her plainly when the phone was too slow, without switching the helper off', () => {
    const reply = failureReply(new TooSlowError());
    expect(reply).toMatchObject({ failed: true, tooSlow: true });
    expect(reply.text).toMatch(/took too long/);
  });
  it('switches the helper off when the graphics chip is lost', () => {
    expect(failureReply(new Error('[Device] is lost')).text).toMatch(/stopped working/);
    expect(getSnapshot().status).toBe('crashed');
  });
  it('apologises for anything else', () => expect(failureReply(new Error('x')).text).toMatch(/couldn't answer/));
});

describe('how-to questions', () => {
  it("answers from the app's steps, without the AI", async () => {
    const reply = await ask([], 'What is the correct way to do a mini squat?');
    expect(reply.steps).toBe(true);
    expect(reply.text).toMatch(/^Mini squat to a chair \(Partial sit-to-stand\): /);
  });
});
