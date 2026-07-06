import { DEFAULT_STATE, loadState } from '@/utils/storage';
import type { AppState, ProxyEntry } from '@/utils/types';

export interface BgContext {
  ready: Promise<void>;
  activeProxy(): ProxyEntry | null;
  onStateChange(cb: () => void): void;
}

export function createBgContext(): BgContext {
  let state: AppState = DEFAULT_STATE;
  const listeners: Array<() => void> = [];

  const ready = loadState().then((s) => {
    state = s;
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    let relevant = false;
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key in state) {
        (state as unknown as Record<string, unknown>)[key] = newValue;
        relevant = true;
      }
    }
    if (relevant) for (const cb of listeners) cb();
  });

  return {
    ready,
    activeProxy() {
      if (!state.enabled || !state.activeId) return null;
      return state.proxies.find((p) => p.id === state.activeId) ?? null;
    },
    onStateChange(cb) {
      listeners.push(cb);
    },
  };
}
