import { describe, it, expect } from 'vitest';
import { createScreenKeeper } from './wakeLock.js';

function fakes() {
  const requests = [];
  const pageListeners = {};
  const nav = {
    wakeLock: {
      request: async (type) => {
        const lock = {
          type,
          released: false,
          listeners: {},
          addEventListener(name, fn) { this.listeners[name] = fn; },
          async release() { this.released = true; },
        };
        requests.push(lock);
        return lock;
      },
    },
  };
  const doc = { visibilityState: 'visible', addEventListener: (name, fn) => { pageListeners[name] = fn; } };
  return { nav, doc, requests, firePage: (name) => pageListeners[name]?.() };
}

describe('screen keeper', () => {
  it('keeps the screen on while anything needs it, and lets go when nothing does', async () => {
    const f = fakes();
    const keeper = createScreenKeeper(f.nav, f.doc);
    await keeper.hold('helper');
    await keeper.hold('round');
    expect(f.requests).toHaveLength(1);
    expect(f.requests[0].type).toBe('screen');
    await keeper.release('helper');
    expect(f.requests[0].released).toBe(false);
    await keeper.release('round');
    expect(f.requests[0].released).toBe(true);
  });
  it('asks again when she comes back to the app, because the phone drops the lock when the screen goes off', async () => {
    const f = fakes();
    const keeper = createScreenKeeper(f.nav, f.doc);
    await keeper.hold('helper');
    f.requests[0].listeners.release(); // the phone released it
    f.firePage('visibilitychange');
    await new Promise((r) => setTimeout(r, 0));
    expect(f.requests).toHaveLength(2);
  });
  it('does nothing on browsers without it', async () => {
    const keeper = createScreenKeeper({}, { addEventListener() {} });
    await expect(keeper.hold('x')).resolves.toBeUndefined();
    await expect(keeper.release('x')).resolves.toBeUndefined();
  });
});
