import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import {
  clearDraft,
  DEFAULT_STATE,
  type FormDraft,
  loadDraft,
  loadState,
  saveDraft,
  saveState,
} from './storage';

const draft: FormDraft = {
  showForm: true,
  editingId: 'x',
  name: 'n',
  scheme: 'socks5',
  host: 'h',
  port: '1080',
  user: 'u',
  pass: 'p',
};

describe('storage', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  describe('loadState', () => {
    it('returns defaults when storage is empty', async () => {
      expect(await loadState()).toEqual(DEFAULT_STATE);
    });

    it('merges stored values over the defaults', async () => {
      await fakeBrowser.storage.local.set({ enabled: true, activeId: 'abc' });
      const state = await loadState();
      expect(state.enabled).toBe(true);
      expect(state.activeId).toBe('abc');
      expect(state.proxies).toEqual([]);
    });
  });

  describe('saveState', () => {
    it('persists a partial patch that loadState reads back', async () => {
      await saveState({ splitEnabled: true, splitMode: 'whitelist' });
      const state = await loadState();
      expect(state.splitEnabled).toBe(true);
      expect(state.splitMode).toBe('whitelist');
    });
  });

  describe('draft', () => {
    it('returns null when no draft is stored', async () => {
      expect(await loadDraft()).toBeNull();
    });

    it('round-trips a saved draft', async () => {
      saveDraft(draft);
      expect(await loadDraft()).toEqual(draft);
    });

    it('clears a stored draft', async () => {
      saveDraft(draft);
      clearDraft();
      expect(await loadDraft()).toBeNull();
    });
  });
});
