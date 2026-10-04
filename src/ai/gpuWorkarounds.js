// Qualcomm's graphics driver crashes on ONNX Runtime's "subgroups" matrix maths
// (onnxruntime-web 1.30 and later; https://github.com/musetric/musetric/issues/901).
// Hiding that optional graphics feature makes ONNX Runtime use its older matrix maths,
// which ran the helper just as fast on a laptop. It must run before ONNX Runtime
// creates its graphics device.
const usesSubgroups = (name) => String(name).includes('subgroup');

export function hideSubgroups(GPUAdapterClass = globalThis.GPUAdapter) {
  const proto = GPUAdapterClass?.prototype;
  if (!proto || proto.requestDevice.kneecoachPatched) return;
  const getFeatures = Object.getOwnPropertyDescriptor(proto, 'features').get;
  Object.defineProperty(proto, 'features', {
    configurable: true,
    get() { return new Set([...getFeatures.call(this)].filter((name) => !usesSubgroups(name))); },
  });
  const requestDevice = proto.requestDevice;
  proto.requestDevice = function (descriptor = {}) {
    const requiredFeatures = [...(descriptor.requiredFeatures ?? [])].filter((name) => !usesSubgroups(name));
    return requestDevice.call(this, { ...descriptor, requiredFeatures });
  };
  proto.requestDevice.kneecoachPatched = true;
}
