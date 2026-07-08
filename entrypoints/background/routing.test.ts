import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildPacScript } from '@/utils/split';
import type { ProxyEntry } from '@/utils/types';
import type { BgContext, SplitConfig } from './context';
import { applyChromeProxy, setupFirefoxRouting } from './routing';

type RequestListener = (details: {
  url: string;
}) => Promise<{ type: string; [k: string]: unknown }>;

let onRequestListener: RequestListener | undefined;
const settings = {
  set: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
};

function stubProxyApi() {
  onRequestListener = undefined;
  (browser as unknown as { proxy: unknown }).proxy = {
    onRequest: {
      addListener: (cb: RequestListener) => {
        onRequestListener = cb;
      },
    },
    settings,
  };
}

function ctxOf(proxy: ProxyEntry | null, split?: Partial<SplitConfig>): BgContext {
  return {
    ready: Promise.resolve(),
    activeProxy: () => proxy,
    splitConfig: () => ({ enabled: false, mode: 'blacklist', domains: [], ...split }),
    onStateChange: () => {},
  };
}

const socks5: ProxyEntry = { id: '1', scheme: 'socks5', host: 'p', port: 1080 };

beforeEach(() => {
  stubProxyApi();
  settings.set.mockClear();
  settings.clear.mockClear();
});

afterEach(() => {
  (browser as unknown as { proxy?: unknown }).proxy = undefined;
});

describe('setupFirefoxRouting', () => {
  async function route(
    proxy: ProxyEntry | null,
    url: string,
    split?: Partial<SplitConfig>,
  ): Promise<{ type: string; [k: string]: unknown }> {
    setupFirefoxRouting(ctxOf(proxy, split));
    if (!onRequestListener) throw new Error('listener not registered');
    return onRequestListener({ url });
  }

  it('routes DIRECT when no proxy is active', async () => {
    expect(await route(null, 'https://example.com')).toEqual({ type: 'direct' });
  });

  it('routes DIRECT for an unparseable url', async () => {
    expect(await route(socks5, 'not a url')).toEqual({ type: 'direct' });
  });

  it('routes DIRECT for localhost targets', async () => {
    expect(await route(socks5, 'http://localhost/')).toEqual({ type: 'direct' });
    expect(await route(socks5, 'http://127.0.0.1/')).toEqual({ type: 'direct' });
  });

  it('routes DIRECT when split rules exclude the host', async () => {
    const res = await route(socks5, 'https://excluded.com', {
      enabled: true,
      mode: 'whitelist',
      domains: ['allowed.com'],
    });
    expect(res).toEqual({ type: 'direct' });
  });

  it('routes through the proxy when split rules include the host', async () => {
    const res = await route(socks5, 'https://allowed.com', {
      enabled: true,
      mode: 'whitelist',
      domains: ['allowed.com'],
    });
    expect(res.type).toBe('socks');
  });

  it('maps socks5 to a socks route with DNS proxying', async () => {
    expect(await route(socks5, 'https://example.com')).toEqual({
      type: 'socks',
      host: 'p',
      port: 1080,
      username: undefined,
      password: undefined,
      proxyDNS: true,
    });
  });

  it('maps socks4 to a socks4 route without DNS proxying', async () => {
    const res = await route({ ...socks5, scheme: 'socks4' }, 'https://example.com');
    expect(res.type).toBe('socks4');
    expect(res.proxyDNS).toBe(false);
  });

  it('maps http/https to a plain host:port route', async () => {
    const res = await route({ ...socks5, scheme: 'http' }, 'https://example.com');
    expect(res).toEqual({ type: 'http', host: 'p', port: 1080 });
  });
});

describe('applyChromeProxy', () => {
  it('clears proxy settings when no proxy is active', async () => {
    await applyChromeProxy(ctxOf(null));
    expect(settings.clear).toHaveBeenCalledWith({ scope: 'regular' });
    expect(settings.set).not.toHaveBeenCalled();
  });

  it('sets fixed_servers when split is disabled', async () => {
    await applyChromeProxy(ctxOf(socks5));
    expect(settings.set).toHaveBeenCalledTimes(1);
    const arg = settings.set.mock.calls[0][0];
    expect(arg.scope).toBe('regular');
    expect(arg.value.mode).toBe('fixed_servers');
    expect(arg.value.rules.singleProxy).toEqual({ scheme: 'socks5', host: 'p', port: 1080 });
    expect(arg.value.rules.bypassList).toContain('localhost');
  });

  it('falls back to fixed_servers when split is enabled but has no domains', async () => {
    await applyChromeProxy(ctxOf(socks5, { enabled: true, domains: [] }));
    expect(settings.set.mock.calls[0][0].value.mode).toBe('fixed_servers');
  });

  it('sets a pac_script when split is enabled with domains', async () => {
    await applyChromeProxy(
      ctxOf(socks5, { enabled: true, mode: 'blacklist', domains: ['example.com'] }),
    );
    const arg = settings.set.mock.calls[0][0];
    expect(arg.value.mode).toBe('pac_script');
    expect(arg.value.pacScript.data).toBe(buildPacScript(socks5, 'blacklist', ['example.com']));
  });
});
