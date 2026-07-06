import type { AppState, ProxyScheme } from './types';

export const DEFAULT_STATE: AppState = {
  proxies: [],
  activeId: null,
  enabled: false,
};

export async function loadState(): Promise<AppState> {
  const stored = await browser.storage.local.get({ ...DEFAULT_STATE });
  return stored as unknown as AppState;
}

export async function saveState(patch: Partial<AppState>): Promise<void> {
  await browser.storage.local.set(patch);
}

// Черновик формы: попап закрывается при любой потере фокуса окна,
// поэтому введённое сохраняем на лету и восстанавливаем при открытии.
export interface FormDraft {
  showForm: boolean;
  editingId: string | null;
  name: string;
  scheme: ProxyScheme;
  host: string;
  port: string;
  user: string;
  pass: string;
}

export async function loadDraft(): Promise<FormDraft | null> {
  const { draft } = await browser.storage.local.get('draft');
  return (draft as FormDraft) ?? null;
}

export function saveDraft(draft: FormDraft): void {
  void browser.storage.local.set({ draft });
}

export function clearDraft(): void {
  void browser.storage.local.remove('draft');
}
