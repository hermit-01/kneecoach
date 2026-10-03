import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot } from './helper.js';

export function useHelper() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
