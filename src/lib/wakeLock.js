// Keeps the phone's screen on while something long runs: the helper's download and loading,
// an answer, or a round of exercises. Once the screen locks, Chrome pauses the page; on her
// S23 that stopped the helper test partway through. Each user holds it by name, and the
// screen may sleep again once nobody holds it.
export function createScreenKeeper(nav = globalThis.navigator, doc = globalThis.document) {
  const holders = new Set();
  let lock = null;

  async function acquire() {
    if (lock || !holders.size || !nav?.wakeLock) return;
    try {
      const next = await nav.wakeLock.request('screen');
      next.addEventListener?.('release', () => { if (lock === next) lock = null; });
      lock = next;
      if (!holders.size) await letGo(); // released while the request was in flight
    } catch {
      lock = null; // the page is hidden, or the phone said no
    }
  }

  async function letGo() {
    const held = lock;
    lock = null;
    try { await held?.release(); } catch { /* already released */ }
  }

  // The phone drops the lock whenever the screen goes off; ask again when she comes back.
  doc?.addEventListener?.('visibilitychange', () => {
    if (doc.visibilityState === 'visible') acquire();
  });

  return {
    async hold(name) {
      holders.add(name);
      await acquire();
    },
    async release(name) {
      holders.delete(name);
      if (!holders.size) await letGo();
    },
  };
}

export const screenKeeper = createScreenKeeper();
