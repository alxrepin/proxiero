import { type PingResult, pingProxy } from '@/utils/ping';
import type { ProxyEntry } from '@/utils/types';

export type PingStatus = PingResult | 'pending' | undefined;

const map = $state<Record<string, PingResult | 'pending'>>({});

export const pings = {
  of(id: string): PingStatus {
    return map[id];
  },
  ping(p: ProxyEntry): void {
    map[p.id] = 'pending';
    void pingProxy(p).then((r) => {
      map[p.id] = r;
    });
  },
  refresh(list: ProxyEntry[]): void {
    for (const p of list) this.ping(p);
  },
};
