import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { DEFAULT_STATE } from '@/utils/storage';
import type { ProxyEntry } from '@/utils/types';
import { createBgContext } from './context';

const px: ProxyEntry = { id: 'a', scheme: 'socks5', host: 'h', port: 1080 };

describe('createBgContext', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  describe('activeProxy', () => {
    it('is null before ready resolves (defaults)', () => {
      const ctx = createBgContext();
      expect(ctx.activeProxy()).toBeNull();
    });

    it('returns the active proxy once state is loaded', async () => {
      await fakeBrowser.storage.local.set({ proxies: [px], activeId: 'a', enabled: true });
      const ctx = createBgContext();
      await ctx.ready;
      expect(ctx.activeProxy()).toEqual(px);
    });

    it('is null when disabled', async () => {
      await fakeBrowser.storage.local.set({ proxies: [px], activeId: 'a', enabled: false });
      const ctx = createBgContext();
      await ctx.ready;
      expect(ctx.activeProxy()).toBeNull();
    });

    it('is null when the active id points at nothing', async () => {
      await fakeBrowser.storage.local.set({ proxies: [px], activeId: 'gone', enabled: true });
      const ctx = createBgContext();
      await ctx.ready;
      expect(ctx.activeProxy()).toBeNull();
    });
  });

  describe('splitConfig', () => {
    it('exposes the persisted split configuration', async () => {
      await fakeBrowser.storage.local.set({
        splitEnabled: true,
        splitMode: 'whitelist',
        splitDomains: ['example.com'],
      });
      const ctx = createBgContext();
      await ctx.ready;
      expect(ctx.splitConfig()).toEqual({
        enabled: true,
        mode: 'whitelist',
        domains: ['example.com'],
      });
    });
  });

  describe('onStateChange', () => {
    it('notifies listeners when a known key changes in local storage', async () => {
      const ctx = createBgContext();
      await ctx.ready;
      const cb = vi.fn();
      ctx.onStateChange(cb);

      await fakeBrowser.storage.local.set({ enabled: true });
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('reflects the changed value through the getters', async () => {
      await fakeBrowser.storage.local.set({ proxies: [px], activeId: 'a', enabled: false });
      const ctx = createBgContext();
      await ctx.ready;
      expect(ctx.activeProxy()).toBeNull();

      await fakeBrowser.storage.local.set({ enabled: true });
      expect(ctx.activeProxy()).toEqual(px);
    });

    it('ignores changes to keys that are not part of the app state', async () => {
      const ctx = createBgContext();
      await ctx.ready;
      const cb = vi.fn();
      ctx.onStateChange(cb);

      await fakeBrowser.storage.local.set({ draft: { anything: true } });
      expect(cb).not.toHaveBeenCalled();
    });

    it('does not mutate the shared DEFAULT_STATE when a change is handled before ready', () => {
      let handler:
        | ((changes: Record<string, { newValue: unknown }>, area: string) => void)
        | undefined;
      const spy = vi
        .spyOn(fakeBrowser.storage.onChanged, 'addListener')
        .mockImplementation((cb) => {
          handler = cb as typeof handler;
        });
      createBgContext();
      spy.mockRestore();

      handler?.({ enabled: { newValue: true } }, 'local');
      expect(DEFAULT_STATE.enabled).toBe(false);
    });
  });
});
