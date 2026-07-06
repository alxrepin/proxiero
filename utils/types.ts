export type ProxyScheme = 'http' | 'https' | 'socks4' | 'socks5';

export interface ProxyEntry {
  id: string;
  name?: string;
  scheme: ProxyScheme;
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export interface AppState {
  proxies: ProxyEntry[];
  activeId: string | null;
  enabled: boolean;
}

export const SCHEME_LABELS: Record<ProxyScheme, string> = {
  http: 'HTTP',
  https: 'HTTPS',
  socks4: 'SOCKS4',
  socks5: 'SOCKS5',
};

export function proxyTitle(p: ProxyEntry): string {
  return p.name?.trim() || `${p.host}:${p.port}`;
}
