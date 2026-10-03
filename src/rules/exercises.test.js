import { describe, it, expect } from 'vitest';
import { EXERCISES, STAGE_UNLOCK_LEVEL, NHS_URL, exerciseById } from './exercises.js';
import { SOURCES } from './sources.js';

describe('exercise catalogue', () => {
  it('has the ten NHS-based exercises in three stages', () => {
    expect(EXERCISES).toHaveLength(10);
    expect(EXERCISES.filter((e) => e.stage === 1)).toHaveLength(5);
    expect(EXERCISES.filter((e) => e.stage === 2)).toHaveLength(2);
    expect(EXERCISES.filter((e) => e.stage === 3)).toHaveLength(3);
  });
  it('gives every exercise an id, both names, steps and a hold rule', () => {
    const ids = new Set();
    for (const e of EXERCISES) {
      expect(e.id).toMatch(/^[a-z-]+$/);
      ids.add(e.id);
      expect(e.name.length).toBeGreaterThan(3);
      expect(e.clinicalName.length).toBeGreaterThan(3);
      expect(e.steps.length).toBeGreaterThanOrEqual(2);
      expect(e.holdSeconds === null || e.holdSeconds > 0).toBe(true);
    }
    expect(ids.size).toBe(10);
  });
  it('unlocks stage 2 at level 2 and stage 3 at level 4', () => {
    expect(STAGE_UNLOCK_LEVEL).toEqual({ 1: 0, 2: 2, 3: 4 });
  });
  it('links to NHS inform and finds exercises by id', () => {
    expect(NHS_URL).toMatch(/^https:\/\/www\.nhsinform\.scot\//);
    expect(exerciseById('bridge').stage).toBe(2);
    expect(exerciseById('nope')).toBeNull();
  });
  it('only the balance exercise grows its hold', () => {
    expect(EXERCISES.filter((e) => e.holdGrows).map((e) => e.id)).toEqual(['single-leg-stand']);
  });
  it('names a source for every rule', () => {
    expect(Object.keys(SOURCES)).toHaveLength(7);
    for (const s of Object.values(SOURCES)) expect(s).toMatch(/^(NHS inform|KneeCoach rule): /);
  });
});
