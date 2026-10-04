import {
  WEIGHTS, weightsUrl, chunkCount, downloadModel, modelBlob, idbChunkStore, ensureModelId, seedCache, isCached, downloadConditions,
  seedGraph,
} from './download.js';
import { systemPrompt } from './prompts.js';
import { hasRedFlag, RED_FLAG_MESSAGE } from './redflags.js';
import { guardFor, exerciseAskedAbout, stepsAnswer } from './guards.js';

// One helper for the whole app. Screens read its status through useHelper().
const CRASH_FLAG = 'kneecoach-helper-loading';
const listeners = new Set();
let snapshot = { status: 'idle', progress: 0, error: null };
let engine = null;
let queue = Promise.resolve(); // Gemma answers one request at a time

function set(update) {
  snapshot = { ...snapshot, ...update };
  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return snapshot;
}

// If the phone ran out of memory while loading the helper, the page was killed before
// this flag was cleared. The next start sees it and runs without the helper, so it never crash-loops.
export function crashedLastTime(storage = globalThis.localStorage) {
  return Boolean(storage?.getItem(CRASH_FLAG));
}

export function clearCrashFlag(storage = globalThis.localStorage) {
  storage?.removeItem(CRASH_FLAG);
}

// Some phones load the helper but their graphics chip gives up mid-answer
// (seen on a POCO M6 Pro: "[Device] is lost"). Stop using the helper for this
// session only: on Android, switching to another app can also drop the graphics
// chip on a phone that normally runs the helper fine, so it gets another chance
// at the next start.
export function isFatalGpuError(error) {
  return /device (is )?lost|\[device\] is lost|ortrun|mapasync/i.test(String(error?.message ?? error));
}

export function reportFatalError(error) {
  if (!isFatalGpuError(error)) return false;
  engine = null;
  set({ status: 'crashed', error: 'gpu-lost' });
  return true;
}

export async function prepareHelper({
  db, allowMobileData = false, startDownload = true, retryAfterCrash = false,
  storage = globalThis.localStorage, nav = globalThis.navigator, cacheStorage = globalThis.caches,
  graphBase = import.meta.env.BASE_URL,
} = {}) {
  if (['downloading', 'loading', 'ready'].includes(snapshot.status)) return;
  try {
    if (!nav?.gpu) {
      set({ status: 'unavailable', error: 'no-webgpu' });
      return;
    }
    if (crashedLastTime(storage) && !retryAfterCrash) {
      set({ status: 'crashed' });
      return;
    }
    const adapter = await nav.gpu.requestAdapter();
    if (!adapter) {
      set({ status: 'unavailable', error: 'no-gpu-adapter' });
      return;
    }
    const dtype = adapter.features.has('shader-f16') ? 'q4f16' : 'q4';
    const { file, bytes } = WEIGHTS[dtype];
    const url = weightsUrl(file);
    if (!(await isCached(cacheStorage, url))) {
      await ensureModelId(db, url);
      const store = idbChunkStore(db);
      const piecesSoFar = await store.count();
      if (!startDownload && piecesSoFar === 0) {
        set({ status: 'idle' });
        return;
      }
      const conditions = await downloadConditions(nav);
      const progress = piecesSoFar / chunkCount(bytes);
      if (conditions.onMobileData && !allowMobileData) {
        set({ status: 'needs-wifi', progress });
        return;
      }
      if (!conditions.enoughSpace && piecesSoFar === 0) {
        set({ status: 'no-space' });
        return;
      }
      set({ status: 'downloading', progress });
      try {
        await downloadModel({ store, url, bytes, onProgress: (p) => set({ progress: p }) });
      } catch (error) {
        set({ status: 'paused', error: String(error?.message ?? error) });
        return;
      }
      await seedCache(cacheStorage, url, await modelBlob(store, bytes));
      await store.clear();
    }
    await seedGraph({ cacheStorage, dtype, base: graphBase }); // the graph that scores only the last position
    set({ status: 'loading' });
    storage?.setItem(CRASH_FLAG, String(Date.now()));
    const { createEngine } = await import('./engine.js'); // loaded only when needed
    engine = await createEngine({ dtype });
    clearCrashFlag(storage);
    set({ status: 'ready', error: null });
  } catch (error) {
    clearCrashFlag(storage);
    console.error('[KneeCoach helper]', error);
    set({ status: 'unavailable', error: String(error?.message ?? error) });
  }
}

function run(system, user, onText) {
  const next = queue.then(() => engine.generate(system, user, { onText })); // already tidy
  queue = next.catch(() => {});
  return next;
}

export async function ask(plan, question, onText) {
  if (hasRedFlag(question)) return { text: RED_FLAG_MESSAGE, redFlag: true };
  const guard = guardFor(question);
  if (guard) return { text: guard.message, [guard.kind]: true };
  const exercise = exerciseAskedAbout(question);
  if (exercise) return { text: stepsAnswer(exercise, plan), steps: true };
  if (snapshot.status !== 'ready') return { text: null, unavailable: true };
  try {
    return { text: await run(systemPrompt(plan), question, onText) };
  } catch (error) {
    console.error(error);
    return failureReply(error);
  }
}

// What she sees when an answer fails.
export function failureReply(error) {
  if (reportFatalError(error)) {
    return { text: "Your helper stopped working, so I can't answer that right now. Your exercises work as normal.", failed: true };
  }
  if (error?.name === 'TooSlowError') {
    return { text: 'Sorry, that took too long on this phone, so I stopped. Your exercises work as normal.', failed: true, tooSlow: true };
  }
  return { text: "Sorry, I couldn't answer that just now.", failed: true };
}
