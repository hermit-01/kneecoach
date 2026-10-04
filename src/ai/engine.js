import { MODEL_ID } from './download.js';
import { generateText } from './reply.js';
import { hideSubgroups } from './gpuWorkarounds.js';

// Gemma 3 1B on the phone's graphics chip, through Transformers.js (spec §0).
// The library is loaded from jsDelivr at a pinned version; the service worker caches it for offline use.
export const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';

export async function createEngine({ dtype }) {
  hideSubgroups(); // before ONNX Runtime creates its graphics device
  const tf = await import(/* @vite-ignore */ TRANSFORMERS_URL);
  const generator = await tf.pipeline('text-generation', MODEL_ID, { dtype, device: 'webgpu' });
  return {
    generate: (system, user, options = {}) => generateText({ tf, generator, system, user, ...options }),
  };
}
