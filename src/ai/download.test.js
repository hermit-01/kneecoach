import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import {
  downloadModel, modelBlob, downloadConditions, ensureModelId, idbChunkStore, seedCache, isCached,
  WEIGHTS, CHUNK_BYTES, chunkCount, weightsUrl, CACHE_NAME, seedGraph, graphUrl, GRAPH_MARKER,
} from './download.js';
import { openKneeDb } from '../data/db.js';

const { bytes, file } = WEIGHTS.q4f16;
const url = weightsUrl(file);
const total = chunkCount(bytes);

function memoryStore(initial = []) {
  const chunks = [...initial];
  return {
    chunks,
    count: async () => chunks.length,
    put: async (i, blob) => { chunks[i] = blob; },
    getAll: async () => chunks,
    clear: async () => { chunks.length = 0; },
  };
}
function fakeFetch(failOnce = new Set()) {
  const calls = [];
  const impl = async (u, { headers }) => {
    const [start, end] = headers.Range.match(/bytes=(\d+)-(\d+)/).slice(1).map(Number);
    calls.push(start);
    if (failOnce.has(start)) { failOnce.delete(start); throw new TypeError('network error'); }
    return { status: 206, blob: async () => ({ size: end - start + 1 }) };
  };
  return { impl, calls };
}
const noWait = async () => {};

describe('downloadModel', () => {
  it('splits the 763 MB weights into 23 pieces', () => {
    expect(WEIGHTS.q4f16).toEqual({ file: 'onnx/model_q4f16.onnx_data', bytes: 763067904 });
    expect(total).toBe(23);
    expect(url).toBe('https://huggingface.co/onnx-community/gemma-3-1b-it-ONNX/resolve/main/onnx/model_q4f16.onnx_data');
  });
  it('downloads every piece in order with the right byte ranges', async () => {
    const store = memoryStore();
    const f = fakeFetch();
    const progress = [];
    await downloadModel({ store, url, bytes, fetchImpl: f.impl, onProgress: (p) => progress.push(p), wait: noWait });
    expect(store.chunks).toHaveLength(total);
    expect(f.calls.slice(0, 2)).toEqual([0, CHUNK_BYTES]);
    expect(store.chunks.at(-1).size).toBe(bytes - (total - 1) * CHUNK_BYTES);
    expect(progress.at(-1)).toBe(1);
  });
  it('resumes from the first missing piece (review focus 3)', async () => {
    const store = memoryStore(Array.from({ length: 10 }, () => ({ size: CHUNK_BYTES })));
    const f = fakeFetch();
    await downloadModel({ store, url, bytes, fetchImpl: f.impl, wait: noWait });
    expect(f.calls[0]).toBe(10 * CHUNK_BYTES);
    expect(store.chunks).toHaveLength(total);
  });
  it('retries a piece after a network error', async () => {
    const store = memoryStore();
    const f = fakeFetch(new Set([CHUNK_BYTES * 3]));
    await downloadModel({ store, url, bytes, fetchImpl: f.impl, wait: noWait });
    expect(f.calls.filter((s) => s === CHUNK_BYTES * 3)).toHaveLength(2);
    expect(store.chunks).toHaveLength(total);
  });
  it('gives up after the retries and keeps what it already has', async () => {
    const store = memoryStore();
    const impl = async (u, { headers }) => {
      if (headers.Range.startsWith(`bytes=${CHUNK_BYTES * 2}-`)) throw new TypeError('offline');
      return { status: 206, blob: async () => ({ size: CHUNK_BYTES }) };
    };
    await expect(downloadModel({ store, url, bytes, fetchImpl: impl, wait: noWait })).rejects.toThrow('offline');
    expect(store.chunks).toHaveLength(2);
  });
  it('never stores a short piece', async () => {
    const store = memoryStore();
    const impl = async () => ({ status: 206, blob: async () => ({ size: 10 }) });
    await expect(downloadModel({ store, url, bytes, fetchImpl: impl, retries: 0, wait: noWait })).rejects.toThrow('expected');
    expect(store.chunks).toHaveLength(0);
  });
  it('rejects a server that ignores the byte range', async () => {
    const impl = async () => ({ status: 200, blob: async () => ({ size: bytes }) });
    await expect(downloadModel({ store: memoryStore(), url, bytes, fetchImpl: impl, retries: 0, wait: noWait })).rejects.toThrow('Expected 206');
  });
});

describe('modelBlob', () => {
  it('returns the file only when every piece is there', async () => {
    expect(await modelBlob(memoryStore([new Blob(['a'])]), bytes)).toBeNull();
    const full = memoryStore(Array.from({ length: total }, (_, i) => new Blob([String(i % 10)])));
    expect((await modelBlob(full, bytes)).size).toBe(total);
  });
});

describe('ensureModelId', () => {
  it('clears stored pieces when the model file changes, and keeps them otherwise', async () => {
    const db = await openKneeDb('download-model-id');
    const store = idbChunkStore(db);
    await ensureModelId(db, url);
    await store.put(0, new Blob(['a']));
    await ensureModelId(db, url);
    expect(await store.count()).toBe(1);
    await ensureModelId(db, weightsUrl(WEIGHTS.q4.file));
    expect(await store.count()).toBe(0);
  });
});

describe('seedCache', () => {
  it('puts the finished file where Transformers.js looks for it', async () => {
    const caches = new Map();
    const cacheStorage = {
      open: async (name) => {
        if (!caches.has(name)) {
          const entries = new Map();
          caches.set(name, { put: async (u, r) => { entries.set(u, r); }, match: async (u) => entries.get(u) });
        }
        return caches.get(name);
      },
    };
    expect(await isCached(cacheStorage, url)).toBe(false);
    await seedCache(cacheStorage, url, new Blob(['weights']));
    expect(await isCached(cacheStorage, url)).toBe(true);
    const response = await (await cacheStorage.open(CACHE_NAME)).match(url);
    expect(response.headers.get('Content-Length')).toBe('7');
  });
});

describe('downloadConditions', () => {
  it('spots mobile data and checks free space', async () => {
    const nav = { connection: { type: 'cellular' }, storage: { estimate: async () => ({ quota: 10e9, usage: 1e9 }), persist: async () => true } };
    expect(await downloadConditions(nav)).toEqual({ onMobileData: true, freeBytes: 9e9, enoughSpace: true, persisted: true });
  });
  it('copes with browsers that hide the connection type', async () => {
    const nav = { storage: { estimate: async () => ({ quota: 1e9, usage: 0 }), persist: async () => false } };
    expect(await downloadConditions(nav)).toMatchObject({ onMobileData: false, enoughSpace: false });
  });
});

describe('seedGraph', () => {
  function fakeCacheStorage() {
    const entries = new Map();
    const cache = { put: async (u, r) => { entries.set(u, r); }, match: async (u) => entries.get(u) };
    return { open: async () => cache };
  }
  it('puts the edited graph where Transformers.js looks first, marked as ours', async () => {
    const cacheStorage = fakeCacheStorage();
    const fetched = [];
    const fetchImpl = async (u) => { fetched.push(u); return new Response('edited graph'); };
    expect(await seedGraph({ cacheStorage, dtype: 'q4', base: '/kneecoach/', fetchImpl })).toBe(true);
    expect(fetched).toEqual(['/kneecoach/models/gemma-3-1b-it-last-logits/model_q4.onnx']);
    expect(graphUrl('q4')).toBe('https://huggingface.co/onnx-community/gemma-3-1b-it-ONNX/resolve/main/onnx/model_q4.onnx');
    const cached = await (await cacheStorage.open(CACHE_NAME)).match(graphUrl('q4'));
    expect(cached.headers.get('X-KneeCoach-Graph')).toBe(GRAPH_MARKER);
    expect(await cached.text()).toBe('edited graph');
  });
  it('replaces an original graph cached earlier, then skips the download so it starts offline', async () => {
    const cacheStorage = fakeCacheStorage();
    await (await cacheStorage.open(CACHE_NAME)).put(graphUrl('q4f16'), new Response('original graph'));
    let fetches = 0;
    const fetchImpl = async () => { fetches += 1; return new Response('edited graph'); };
    expect(await seedGraph({ cacheStorage, dtype: 'q4f16', base: '/', fetchImpl })).toBe(true);
    expect(await seedGraph({ cacheStorage, dtype: 'q4f16', base: '/', fetchImpl })).toBe(false);
    expect(fetches).toBe(1);
    expect(await (await (await cacheStorage.open(CACHE_NAME)).match(graphUrl('q4f16'))).text()).toBe('edited graph');
  });
  it('fails loudly instead of letting the original graph load', async () => {
    const fetchImpl = async () => new Response('missing', { status: 404 });
    await expect(seedGraph({ cacheStorage: fakeCacheStorage(), dtype: 'q4', base: '/', fetchImpl })).rejects.toThrow(/404/);
  });
});
