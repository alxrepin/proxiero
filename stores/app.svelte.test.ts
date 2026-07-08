import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { loadState } from '@/utils/storage';
import type { AppState, ProxyEntry } from '@/utils/types';
import { app } from './app.svelte';

const p1: ProxyEntry = { id: '1', scheme: 'http', host: 'a', port: 1 };
const p2: ProxyEntry = { id: '2', scheme: 'socks5', host: 'b', port: 2 };

async function initWith(state: Partial<AppState>): Promise<void> {
  await fakeBrowser.storage.local.set(state);
  await app.init();
}

async function stored(): Promise<Record<string, unknown>> {
  return fakeBrowser.storage.local.get(null);
}

describe('app store', () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    await app.init(); // reset module state to defaults
  });

  describe('init', () => {
    it('loads persisted state into the getters', async () => {
      await initWith({ proxies: [p1], activeId: '1', enabled: true });
      expect(app.proxies).toEqual([p1]);
      expect(app.activeId).toBe('1');
      expect(app.enabled).toBe(true);
    });
  });

  describe('active / isOn', () => {
    it('resolves the active proxy by id', async () => {
      await initWith({ proxies: [p1, p2], activeId: '2', enabled: true });
      expect(app.active).toEqual(p2);
      expect(app.isOn).toBe(true);
    });

    it('isOn is false when disabled even with an active proxy', async () => {
      await initWith({ proxies: [p1], activeId: '1', enabled: false });
      expect(app.isOn).toBe(false);
    });

    it('active is null when the id matches nothing', async () => {
      await initWith({ proxies: [p1], activeId: 'nope', enabled: true });
      expect(app.active).toBeNull();
      expect(app.isOn).toBe(false);
    });
  });

  describe('toggle', () => {
    it('returns false and stays off when there are no proxies', async () => {
      const ok = await app.toggle();
      expect(ok).toBe(false);
      expect(app.enabled).toBe(false);
    });

    it('turns on and auto-selects the first proxy when none is active', async () => {
      await initWith({ proxies: [p1, p2], activeId: null, enabled: false });
      const ok = await app.toggle();
      expect(ok).toBe(true);
      expect(app.enabled).toBe(true);
      expect(app.activeId).toBe('1');
      expect(await stored()).toMatchObject({ enabled: true, activeId: '1' });
    });

    it('turns off again on a second toggle', async () => {
      await initWith({ proxies: [p1], activeId: '1', enabled: true });
      const ok = await app.toggle();
      expect(ok).toBe(true);
      expect(app.enabled).toBe(false);
    });
  });

  describe('select', () => {
    it('changes and persists the active id', async () => {
      await initWith({ proxies: [p1, p2], activeId: '1', enabled: true });
      await app.select('2');
      expect(app.activeId).toBe('2');
      expect(await stored()).toMatchObject({ activeId: '2' });
    });
  });

  describe('upsert', () => {
    it('appends a new proxy and activates it when nothing is active', async () => {
      await app.upsert(p1);
      expect(app.proxies).toEqual([p1]);
      expect(app.activeId).toBe('1');
    });

    it('does not change the active proxy when one already exists', async () => {
      await initWith({ proxies: [p1], activeId: '1', enabled: true });
      await app.upsert(p2);
      expect(app.proxies).toEqual([p1, p2]);
      expect(app.activeId).toBe('1');
    });

    it('replaces an existing proxy in place', async () => {
      await initWith({ proxies: [p1, p2], activeId: '1', enabled: true });
      const edited = { ...p1, host: 'changed' };
      await app.upsert(edited);
      expect(app.proxies).toEqual([edited, p2]);
      expect(await stored()).toMatchObject({ proxies: [edited, p2] });
    });
  });

  describe('remove', () => {
    it('removes a non-active proxy without touching the active one', async () => {
      await initWith({ proxies: [p1, p2], activeId: '1', enabled: true });
      await app.remove('2');
      expect(app.proxies).toEqual([p1]);
      expect(app.activeId).toBe('1');
      expect(app.enabled).toBe(true);
    });

    it('removing the active proxy clears selection and turns off', async () => {
      await initWith({ proxies: [p1, p2], activeId: '1', enabled: true });
      await app.remove('1');
      expect(app.proxies).toEqual([p2]);
      expect(app.activeId).toBeNull();
      expect(app.enabled).toBe(false);
      // the cleared selection round-trips through storage
      expect(await loadState()).toMatchObject({ activeId: null, enabled: false });
    });
  });

  describe('split settings', () => {
    it('persists splitEnabled', async () => {
      await app.setSplitEnabled(true);
      expect(app.splitEnabled).toBe(true);
      expect(await stored()).toMatchObject({ splitEnabled: true });
    });

    it('persists splitMode', async () => {
      await app.setSplitMode('whitelist');
      expect(app.splitMode).toBe('whitelist');
      expect(await stored()).toMatchObject({ splitMode: 'whitelist' });
    });

    it('persists splitDomains as a plain array snapshot', async () => {
      await app.setSplitDomains(['example.com', 'foo.net']);
      expect(app.splitDomains).toEqual(['example.com', 'foo.net']);
      expect(await stored()).toMatchObject({ splitDomains: ['example.com', 'foo.net'] });
    });
  });
});
