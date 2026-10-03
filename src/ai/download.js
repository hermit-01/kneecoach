// Downloads the helper's model weights once, in 32 MB pieces, resuming where it
// stopped (spec §7.4). It then hands the finished file to Transformers.js's own cache.
export const MODEL_ID = 'onnx-community/gemma-3-1b-it-ONNX';
export const WEIGHTS = {
  q4f16: { file: 'onnx/model_q4f16.onnx_data', bytes: 763067904 },
  q4: { file: 'onnx/model_q4.onnx_data', bytes: 859106816 }, // for graphics chips without f16 support
};
export const CACHE_NAME = 'transformers-cache';
export const CHUNK_BYTES = 32 * 1024 * 1024;

export const weightsUrl = (file) => `https://huggingface.co/${MODEL_ID}/resolve/main/${file}`;
export const chunkCount = (bytes) => Math.ceil(bytes / CHUNK_BYTES);

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// store: { count(), put(index, blob), getAll(), clear() }
export async function downloadModel({ store, url, bytes, fetchImpl = fetch, onProgress = () => {}, signal, retries = 3, wait = pause }) {
  const total = chunkCount(bytes);
  let index = await store.count();
  onProgress(index / total);
  while (index < total) {
    const start = index * CHUNK_BYTES;
    const end = Math.min(start + CHUNK_BYTES, bytes) - 1;
    let piece = null;
    for (let attempt = 0; attempt <= retries && !piece; attempt++) {
      try {
        const res = await fetchImpl(url, { headers: { Range: `bytes=${start}-${end}` }, signal });
        if (res.status !== 206) throw new Error(`Expected 206, got ${res.status}`);
        const blob = await res.blob();
        if (blob.size !== end - start + 1) throw new Error(`Piece ${index} is ${blob.size} bytes, expected ${end - start + 1}`);
        piece = blob;
      } catch (error) {
        if (signal?.aborted || attempt === retries) throw error;
        await wait(1000 * 2 ** attempt);
      }
    }
    await store.put(index, piece);
    index += 1;
    onProgress(index / total);
  }
}

export async function modelBlob(store, bytes) {
  if ((await store.count()) < chunkCount(bytes)) return null;
  return new Blob(await store.getAll(), { type: 'application/octet-stream' });
}

export function idbChunkStore(db) {
  return {
    count: () => db.count('modelChunks'),
    put: (index, blob) => db.put('modelChunks', blob, index),
    getAll: () => db.getAll('modelChunks'),
    clear: () => db.clear('modelChunks'),
  };
}

// Pieces from a different file must never be mixed in (for example q4f16 vs q4).
export async function ensureModelId(db, url) {
  if ((await db.get('kv', 'modelUrl')) !== url) {
    await db.clear('modelChunks');
    await db.put('kv', url, 'modelUrl');
  }
}

// Put the finished file exactly where Transformers.js looks for it, so it never downloads it.
export async function seedCache(cacheStorage, url, blob) {
  const cache = await cacheStorage.open(CACHE_NAME);
  await cache.put(url, new Response(blob, {
    headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(blob.size) },
  }));
}

export async function isCached(cacheStorage, url) {
  const cache = await cacheStorage.open(CACHE_NAME);
  return (await cache.match(url)) !== undefined;
}

// Checks before starting: Wi-Fi, free space, and asking Chrome to keep the file.
export async function downloadConditions(nav = navigator) {
  const onMobileData = nav.connection?.type === 'cellular';
  const { quota = 0, usage = 0 } = (await nav.storage?.estimate?.()) ?? {};
  const freeBytes = quota - usage;
  const persisted = (await nav.storage?.persist?.()) ?? false;
  return { onMobileData, freeBytes, enoughSpace: freeBytes >= 2.5e9, persisted };
}
