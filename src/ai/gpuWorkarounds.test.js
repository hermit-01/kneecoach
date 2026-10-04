import { describe, it, expect } from 'vitest';
import { hideSubgroups } from './gpuWorkarounds.js';

function fakeAdapterClass() {
  const calls = [];
  class FakeAdapter {
    get features() { return new Set(['shader-f16', 'subgroups', 'chromium-experimental-subgroup-matrix', 'timestamp-query']); }
    async requestDevice(descriptor) { calls.push(descriptor); return descriptor; }
  }
  return { FakeAdapter, calls };
}

describe('hideSubgroups', () => {
  it('hides every subgroup feature from the graphics adapter', () => {
    const { FakeAdapter } = fakeAdapterClass();
    hideSubgroups(FakeAdapter);
    const adapter = new FakeAdapter();
    expect([...adapter.features]).toEqual(['shader-f16', 'timestamp-query']);
    expect(adapter.features.has('subgroups')).toBe(false);
  });
  it('never asks for subgroups when the runtime creates its device, and keeps everything else', async () => {
    const { FakeAdapter } = fakeAdapterClass();
    hideSubgroups(FakeAdapter);
    const device = await new FakeAdapter().requestDevice({ requiredFeatures: ['subgroups', 'shader-f16'], requiredLimits: { maxBufferSize: 1 } });
    expect(device).toEqual({ requiredFeatures: ['shader-f16'], requiredLimits: { maxBufferSize: 1 } });
  });
  it('is safe to apply twice, and does nothing where there is no WebGPU', async () => {
    const { FakeAdapter, calls } = fakeAdapterClass();
    hideSubgroups(FakeAdapter);
    hideSubgroups(FakeAdapter);
    await new FakeAdapter().requestDevice();
    expect(calls).toEqual([{ requiredFeatures: [] }]);
    expect(() => hideSubgroups(undefined)).not.toThrow();
  });
});
