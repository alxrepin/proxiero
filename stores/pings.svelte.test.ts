import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PingResult } from '@/utils/ping';
import type { ProxyEntry } from '@/utils/types';

const pingProxy = vi.hoisted(() => vi.fn());
vi.mock('@/utils/ping', () => ({ pingProxy }));

import { pings } from './pings.svelte';

const p1: ProxyEntry = { id: '1', scheme: 'http', host: 'a', port: 1 };
const p2: ProxyEntry = { id: '2', scheme: 'socks5', host: 'b', port: 2 };

function deferred(): { promise: Promise<PingResult>; resolve: (r: PingResult) => void } {
  let resolve!: (r: PingResult) => void;
  const promise = new Promise<PingResult>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('pings store', () => {
  beforeEach(() => {
    pingProxy.mockReset();
  });

  it('is undefined for an unknown id', () => {
    expect(pings.of('unknown')).toBeUndefined();
  });

  it('marks a proxy pending immediately, then stores the result', async () => {
    const d = deferred();
    pingProxy.mockReturnValue(d.promise);

    pings.ping(p1);
    expect(pings.of('1')).toBe('pending');

    d.resolve({ ok: true, ms: 42 });
    await d.promise;
    await Promise.resolve();
    expect(pings.of('1')).toEqual({ ok: true, ms: 42 });
  });

  it('stores a failed result', async () => {
    pingProxy.mockResolvedValue({ ok: false, ms: null });
    pings.ping(p2);
    await Promise.resolve();
    await Promise.resolve();
    expect(pings.of('2')).toEqual({ ok: false, ms: null });
  });

  it('refresh pings every proxy in the list', () => {
    pingProxy.mockReturnValue(deferred().promise);
    pings.refresh([p1, p2]);
    expect(pingProxy).toHaveBeenCalledTimes(2);
    expect(pings.of('1')).toBe('pending');
    expect(pings.of('2')).toBe('pending');
  });
});
