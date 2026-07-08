import { buildPacScript, shouldProxyHost } from '@/utils/split';
import type { BgContext } from './context';

interface FirefoxProxyInfo {
  type: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  proxyDNS?: boolean;
}

interface ProxyApi {
  onRequest: {
    addListener(
      cb: (details: { url: string }) => Promise<FirefoxProxyInfo>,
      filter: { urls: string[] },
    ): void;
  };
  settings: {
    set(details: { value: unknown; scope: string }): Promise<void>;
    clear(details: { scope: string }): Promise<void>;
  };
}

const proxyApi = () => (browser as unknown as { proxy: ProxyApi }).proxy;

function hostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export function setupFirefoxRouting(ctx: BgContext): void {
  proxyApi().onRequest.addListener(
    async (details) => {
      await ctx.ready;
      const p = ctx.activeProxy();
      const host = hostname(details.url);
      if (!p || !host || isLocalHost(host)) return { type: 'direct' };
      const { enabled, mode, domains } = ctx.splitConfig();
      if (enabled && !shouldProxyHost(host, mode, domains)) return { type: 'direct' };
      if (p.scheme === 'socks5' || p.scheme === 'socks4') {
        return {
          type: p.scheme === 'socks5' ? 'socks' : 'socks4',
          host: p.host,
          port: p.port,
          username: p.username,
          password: p.password,
          proxyDNS: p.scheme === 'socks5',
        };
      }
      return { type: p.scheme, host: p.host, port: p.port };
    },
    { urls: ['<all_urls>'] },
  );
}

export async function applyChromeProxy(ctx: BgContext): Promise<void> {
  const { settings } = proxyApi();
  const p = ctx.activeProxy();
  if (!p) {
    await settings.clear.call(settings, { scope: 'regular' });
    return;
  }
  const { enabled, mode, domains } = ctx.splitConfig();
  if (enabled && domains.length > 0) {
    await settings.set.call(settings, {
      value: {
        mode: 'pac_script',
        pacScript: { data: buildPacScript(p, mode, domains) },
      },
      scope: 'regular',
    });
    return;
  }
  await settings.set.call(settings, {
    value: {
      mode: 'fixed_servers',
      rules: {
        singleProxy: { scheme: p.scheme, host: p.host, port: p.port },
        bypassList: ['localhost', '127.0.0.1', '<local>'],
      },
    },
    scope: 'regular',
  });
}
