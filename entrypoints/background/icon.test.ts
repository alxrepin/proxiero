import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProxyEntry } from '@/utils/types';
import type { BgContext } from './context';
import { updateIcon } from './icon';

const proxy: ProxyEntry = { id: '1', scheme: 'http', host: 'p', port: 8080 };

const action = {
  setIcon: vi.fn().mockResolvedValue(undefined),
  setBadgeText: vi.fn().mockResolvedValue(undefined),
};

function ctxOf(active: ProxyEntry | null): BgContext {
  return {
    ready: Promise.resolve(),
    activeProxy: () => active,
    splitConfig: () => ({ enabled: false, mode: 'blacklist', domains: [] }),
    onStateChange: () => {},
  };
}

beforeEach(() => {
  action.setIcon.mockClear();
  action.setBadgeText.mockClear();
});

afterEach(() => {
  const b = browser as unknown as { action?: unknown; browserAction?: unknown };
  b.action = undefined;
  b.browserAction = undefined;
});

describe('updateIcon', () => {
  it('uses the coloured icon set when a proxy is active', async () => {
    (browser as unknown as { action: unknown }).action = action;
    await updateIcon(ctxOf(proxy));
    expect(action.setIcon).toHaveBeenCalledWith({
      path: { 16: '/icon/16.png', 32: '/icon/32.png', 48: '/icon/48.png', 128: '/icon/128.png' },
    });
    expect(action.setBadgeText).toHaveBeenCalledWith({ text: '' });
  });

  it('uses the greyed icon set when no proxy is active', async () => {
    (browser as unknown as { action: unknown }).action = action;
    await updateIcon(ctxOf(null));
    expect(action.setIcon).toHaveBeenCalledWith({
      path: {
        16: '/icon/gray-16.png',
        32: '/icon/gray-32.png',
        48: '/icon/gray-48.png',
        128: '/icon/gray-128.png',
      },
    });
  });

  it('falls back to browserAction (MV2) when action is absent', async () => {
    (browser as unknown as { browserAction: unknown }).browserAction = action;
    await updateIcon(ctxOf(proxy));
    expect(action.setIcon).toHaveBeenCalledWith({
      path: { 16: '/icon/16.png', 32: '/icon/32.png', 48: '/icon/48.png', 128: '/icon/128.png' },
    });
  });

  it('is a no-op when neither action api exists', async () => {
    await expect(updateIcon(ctxOf(proxy))).resolves.toBeUndefined();
    expect(action.setIcon).not.toHaveBeenCalled();
  });
});
