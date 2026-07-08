import type { ProxyEntry, SplitMode } from './types';

export function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  if (!d) return '';
  d = d.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // scheme://
  d = d.split('/')[0].split('?')[0].split('#')[0]; // path/query/hash
  d = d.split('@').pop() ?? d; // user:pass@
  d = d.split(':')[0]; // :port
  d = d.replace(/^\.+/, '').replace(/\.+$/, ''); // stray dots
  return d;
}

export function hostMatchesDomain(host: string, domain: string): boolean {
  const h = host.toLowerCase();
  const d = domain.toLowerCase();
  return h === d || h.endsWith(`.${d}`);
}

export function shouldProxyHost(host: string, mode: SplitMode, domains: string[]): boolean {
  if (domains.length === 0) return true;
  const matched = domains.some((d) => hostMatchesDomain(host, d));
  return mode === 'whitelist' ? matched : !matched;
}

const PAC_PREFIX: Record<ProxyEntry['scheme'], string> = {
  http: 'PROXY',
  https: 'HTTPS',
  socks4: 'SOCKS',
  socks5: 'SOCKS5',
};

export function buildPacScript(p: ProxyEntry, mode: SplitMode, domains: string[]): string {
  const proxy = `${PAC_PREFIX[p.scheme]} ${p.host}:${p.port}`;
  const list = JSON.stringify(domains.map((d) => d.toLowerCase()));
  const whenMatched = mode === 'whitelist';
  return `function FindProxyForURL(url, host) {
  host = host.toLowerCase();
  if (isPlainHostName(host) || host === "localhost" ||
      shExpMatch(host, "127.*") || host === "[::1]" ||
      shExpMatch(host, "*.local")) {
    return "DIRECT";
  }
  var domains = ${list};
  var matched = false;
  for (var i = 0; i < domains.length; i++) {
    if (host === domains[i] || dnsDomainIs(host, "." + domains[i])) {
      matched = true;
      break;
    }
  }
  var proxied = ${whenMatched ? 'matched' : '!matched'};
  return proxied ? "${proxy}" : "DIRECT";
}`;
}
