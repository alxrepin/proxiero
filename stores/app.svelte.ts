import { DEFAULT_STATE, loadState, saveState } from '@/utils/storage';
import type { AppState, ProxyEntry } from '@/utils/types';

// Единственный источник правды о прокси в попапе. Пишет изменения
// в storage.local — применяет их фоновый скрипт через storage.onChanged.
const state = $state<AppState>({ ...DEFAULT_STATE });

export const app = {
  get proxies() {
    return state.proxies;
  },
  get activeId() {
    return state.activeId;
  },
  get enabled() {
    return state.enabled;
  },
  get active(): ProxyEntry | null {
    return state.proxies.find((p) => p.id === state.activeId) ?? null;
  },
  get isOn() {
    return state.enabled && this.active !== null;
  },

  async init(): Promise<void> {
    Object.assign(state, await loadState());
  },

  /** Переключает прокси. Возвращает false, если включать нечего (список пуст). */
  async toggle(): Promise<boolean> {
    if (!state.enabled && !this.active) {
      if (state.proxies.length === 0) return false;
      state.activeId = state.proxies[0].id;
    }
    state.enabled = !state.enabled;
    await saveState({ enabled: state.enabled, activeId: state.activeId });
    return true;
  },

  async select(id: string): Promise<void> {
    state.activeId = id;
    await saveState({ activeId: id });
  },

  async remove(id: string): Promise<void> {
    state.proxies = state.proxies.filter((p) => p.id !== id);
    const patch: Partial<AppState> = { proxies: $state.snapshot(state.proxies) };
    if (state.activeId === id) {
      state.activeId = null;
      state.enabled = false;
      patch.activeId = null;
      patch.enabled = false;
    }
    await saveState(patch);
  },

  /** Добавляет новый сервер или обновляет существующий (по id). */
  async upsert(entry: ProxyEntry): Promise<void> {
    const exists = state.proxies.some((p) => p.id === entry.id);
    if (exists) {
      state.proxies = state.proxies.map((p) => (p.id === entry.id ? entry : p));
    } else {
      state.proxies = [...state.proxies, entry];
      if (!state.activeId) state.activeId = entry.id;
    }
    await saveState({
      proxies: $state.snapshot(state.proxies),
      activeId: state.activeId,
    });
  },
};
