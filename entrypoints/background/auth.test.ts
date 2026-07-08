import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ProxyEntry } from '@/utils/types';
import { setupProxyAuth } from './auth';
import type { BgContext } from './context';

type AuthDetails = { requestId: string; isProxy: boolean };
type AuthListener = (
  details: AuthDetails,
  cb?: (r: object) => void,
) => object | Promise<object> | undefined;

let authListener: AuthListener | undefined;
let completedListener: ((d: { requestId: string }) => void) | undefined;
let errorListener: ((d: { requestId: string }) => void) | undefined;

function stubWebRequest() {
  authListener = completedListener = errorListener = undefined;
  (browser as unknown as { webRequest: unknown }).webRequest = {
    onAuthRequired: { addListener: (cb: AuthListener) => (authListener = cb) },
    onCompleted: { addListener: (cb: typeof completedListener) => (completedListener = cb) },
    onErrorOccurred: { addListener: (cb: typeof errorListener) => (errorListener = cb) },
  };
}

const authProxy: ProxyEntry = {
  id: '1',
  scheme: 'http',
  host: 'p',
  port: 8080,
  username: 'u',
  password: 'secret',
};

function ctxOf(proxy: ProxyEntry | null): BgContext {
  return {
    ready: Promise.resolve(),
    activeProxy: () => proxy,
    splitConfig: () => ({ enabled: false, mode: 'blacklist', domains: [] }),
    onStateChange: () => {},
  };
}

// Chrome delivers credentials asynchronously; capture what the callback receives.
function ask(details: AuthDetails): Promise<object> {
  if (!authListener) throw new Error('no auth listener');
  return new Promise((resolve) => {
    authListener?.(details, resolve);
  });
}

beforeEach(stubWebRequest);
afterEach(() => {
  (browser as unknown as { webRequest?: unknown }).webRequest = undefined;
});

describe('setupProxyAuth', () => {
  it('supplies the active proxy credentials for a proxy auth challenge', async () => {
    setupProxyAuth(ctxOf(authProxy));
    const r = await ask({ requestId: 'r1', isProxy: true });
    expect(r).toEqual({ authCredentials: { username: 'u', password: 'secret' } });
  });

  it('sends an empty password when the proxy has none', async () => {
    setupProxyAuth(ctxOf({ ...authProxy, password: undefined }));
    const r = await ask({ requestId: 'r1', isProxy: true });
    expect(r).toEqual({ authCredentials: { username: 'u', password: '' } });
  });

  it('returns the credentials promise directly for the Firefox blocking path (no callback)', async () => {
    setupProxyAuth(ctxOf(authProxy));
    if (!authListener) throw new Error('no auth listener');
    // Firefox passes no async callback and expects a Promise back
    const result = authListener({ requestId: 'r1', isProxy: true });
    expect(result).toBeInstanceOf(Promise);
    expect(await result).toEqual({ authCredentials: { username: 'u', password: 'secret' } });
  });

  it('ignores non-proxy (origin server) auth challenges', async () => {
    setupProxyAuth(ctxOf(authProxy));
    expect(await ask({ requestId: 'r1', isProxy: false })).toEqual({});
  });

  it('does nothing when the active proxy needs no username', async () => {
    setupProxyAuth(ctxOf({ ...authProxy, username: undefined }));
    expect(await ask({ requestId: 'r1', isProxy: true })).toEqual({});
  });

  it('cancels after two failed attempts on the same request', async () => {
    setupProxyAuth(ctxOf(authProxy));
    await ask({ requestId: 'r1', isProxy: true }); // attempt 1
    await ask({ requestId: 'r1', isProxy: true }); // attempt 2
    expect(await ask({ requestId: 'r1', isProxy: true })).toEqual({ cancel: true });
  });

  it('tracks attempts per request id independently', async () => {
    setupProxyAuth(ctxOf(authProxy));
    await ask({ requestId: 'r1', isProxy: true });
    await ask({ requestId: 'r1', isProxy: true });
    // a different request still gets credentials
    expect(await ask({ requestId: 'r2', isProxy: true })).toEqual({
      authCredentials: { username: 'u', password: 'secret' },
    });
  });

  it('resets the attempt counter when the request completes', async () => {
    setupProxyAuth(ctxOf(authProxy));
    await ask({ requestId: 'r1', isProxy: true });
    await ask({ requestId: 'r1', isProxy: true });
    completedListener?.({ requestId: 'r1' });
    // counter cleared -> credentials offered again instead of cancel
    expect(await ask({ requestId: 'r1', isProxy: true })).toEqual({
      authCredentials: { username: 'u', password: 'secret' },
    });
  });

  it('resets the attempt counter when the request errors', async () => {
    setupProxyAuth(ctxOf(authProxy));
    await ask({ requestId: 'r1', isProxy: true });
    await ask({ requestId: 'r1', isProxy: true });
    errorListener?.({ requestId: 'r1' });
    expect(await ask({ requestId: 'r1', isProxy: true })).toEqual({
      authCredentials: { username: 'u', password: 'secret' },
    });
  });
});
