import { describe, it, expect } from 'vitest';
import { totalReps, position, playerReducer, initialPlayer, REST_SECONDS } from './playerLogic.js';

const item = { exercise: { id: 'heel-slide' }, sets: 2, reps: 2, holdSeconds: 2, sides: ['left', 'right'] };

describe('player logic', () => {
  it('counts every rep on every side and set', () => expect(totalReps(item)).toBe(8));
  it('knows where she is in the exercise', () => {
    expect(position(item, 0)).toEqual({ side: 'left', set: 1, rep: 1 });
    expect(position(item, 3)).toEqual({ side: 'left', set: 2, rep: 2 });
    expect(position(item, 4)).toEqual({ side: 'right', set: 1, rep: 1 });
  });
  it('rests between sets but not between sides', () => {
    let s = playerReducer(initialPlayer, { type: 'rep', item });
    expect(s.restLeft).toBe(0);
    s = playerReducer(s, { type: 'rep', item });
    expect(s.restLeft).toBe(REST_SECONDS);
    s = playerReducer(playerReducer({ ...s, restLeft: 0 }, { type: 'rep', item }), { type: 'rep', item });
    expect(s).toMatchObject({ count: 4, restLeft: 0 });
  });
  it('counts a finished hold as a rep', () => {
    let s = playerReducer(initialPlayer, { type: 'startHold', seconds: 2 });
    s = playerReducer(s, { type: 'tick' });
    expect(s.holdLeft).toBe(1);
    s = playerReducer(s, { type: 'rep', item });
    expect(s).toMatchObject({ count: 1, holdLeft: null });
  });
  it('records done and too-painful exercises when moving on', () => {
    let s = playerReducer(initialPlayer, { type: 'next', id: 'a', done: true });
    s = playerReducer(s, { type: 'next', id: 'b', painful: true });
    expect(s).toMatchObject({ index: 2, count: 0, completed: ['a'], tooPainful: ['b'] });
  });
});
