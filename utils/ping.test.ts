import { afterEach, describe, expect, it, vi } from 'vitest';
import { pingProxy } from './ping';
import type { ProxyEntry } from './types';

function proxy(over: Partial<ProxyEntry> = {}): ProxyEntry {
  return { id: '1', scheme: 'http', host: '1.2.3.4', port: 8080, ...over };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pingProxy', () => {
  it('reports ok with a duration when the probe resolves', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null)));
    const r = await pingProxy(proxy({ scheme: 'socks5' }));
    expect(r.ok).toBe(true);
    expect(typeof r.ms).toBe('number');
    expect(r.ms).toBeGreaterThanOrEqual(0);
  });

  it('builds an https probe url only for the https scheme', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal('fetch', fetchMock);

    await pingProxy(proxy({ scheme: 'https', host: 'h', port: 443 }));
    expect(fetchMock).toHaveBeenLastCalledWith('https://h:443/', expect.any(Object));

    await pingProxy(proxy({ scheme: 'socks5', host: 'h', port: 1080 }));
    expect(fetchMock).toHaveBeenLastCalledWith('http://h:1080/', expect.any(Object));
  });

  it('sends a no-cors, no-store, manual-redirect request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal('fetch', fetchMock);
    await pingProxy(proxy());
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ mode: 'no-cors', cache: 'no-store', redirect: 'manual' }),
    );
  });

  it('treats a rejection on an http proxy as unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));
    const r = await pingProxy(proxy({ scheme: 'http' }));
    expect(r).toEqual({ ok: false, ms: null });
  });

  it('treats a rejection on a non-http proxy as reachable (CORS-blocked but connected)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('cors')));
    const r = await pingProxy(proxy({ scheme: 'socks5' }));
    expect(r.ok).toBe(true);
    expect(typeof r.ms).toBe('number');
  });

  it('reports a timeout abort as unreachable regardless of scheme', async () => {
    vi.stubGlobal('fetch', (_url: string, opts: { signal: AbortSignal }) => {
      return new Promise((_, reject) => {
        opts.signal.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError')),
        );
      });
    });
    const r = await pingProxy(proxy({ scheme: 'socks5' }), 1);
    expect(r).toEqual({ ok: false, ms: null });
  });
});
