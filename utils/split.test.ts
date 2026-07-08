import { describe, expect, it } from 'vitest';
import { buildPacScript, hostMatchesDomain, normalizeDomain, shouldProxyHost } from './split';
import type { ProxyEntry } from './types';

describe('normalizeDomain', () => {
  it('lowercases and trims', () => {
    expect(normalizeDomain('  Example.COM ')).toBe('example.com');
  });

  it('returns empty for blank input', () => {
    expect(normalizeDomain('   ')).toBe('');
  });

  it('strips the scheme', () => {
    expect(normalizeDomain('https://example.com')).toBe('example.com');
    expect(normalizeDomain('socks5://example.com')).toBe('example.com');
  });

  it('strips path, query and hash', () => {
    expect(normalizeDomain('example.com/some/path')).toBe('example.com');
    expect(normalizeDomain('example.com?a=b')).toBe('example.com');
    expect(normalizeDomain('example.com#frag')).toBe('example.com');
    expect(normalizeDomain('example.com/p?a=b#f')).toBe('example.com');
  });

  it('strips userinfo', () => {
    expect(normalizeDomain('user:pass@example.com')).toBe('example.com');
  });

  it('strips the port', () => {
    expect(normalizeDomain('example.com:8080')).toBe('example.com');
  });

  it('strips leading and trailing dots', () => {
    expect(normalizeDomain('..example.com..')).toBe('example.com');
  });

  it('handles a full URL with everything', () => {
    expect(normalizeDomain('HTTPS://user:pass@Example.com:443/path?q=1#h')).toBe('example.com');
  });
});

describe('hostMatchesDomain', () => {
  it('matches an exact host', () => {
    expect(hostMatchesDomain('example.com', 'example.com')).toBe(true);
  });

  it('matches subdomains', () => {
    expect(hostMatchesDomain('api.example.com', 'example.com')).toBe(true);
    expect(hostMatchesDomain('a.b.example.com', 'example.com')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(hostMatchesDomain('API.Example.COM', 'example.com')).toBe(true);
  });

  it('does not match a sibling domain', () => {
    expect(hostMatchesDomain('notexample.com', 'example.com')).toBe(false);
  });

  it('does not treat a suffix without a dot boundary as a match', () => {
    expect(hostMatchesDomain('evilexample.com', 'example.com')).toBe(false);
  });
});

describe('shouldProxyHost', () => {
  it('proxies everything when the domain list is empty', () => {
    expect(shouldProxyHost('example.com', 'whitelist', [])).toBe(true);
    expect(shouldProxyHost('example.com', 'blacklist', [])).toBe(true);
  });

  it('whitelist: proxies only matching hosts', () => {
    expect(shouldProxyHost('api.example.com', 'whitelist', ['example.com'])).toBe(true);
    expect(shouldProxyHost('other.com', 'whitelist', ['example.com'])).toBe(false);
  });

  it('blacklist: proxies everything except matching hosts', () => {
    expect(shouldProxyHost('api.example.com', 'blacklist', ['example.com'])).toBe(false);
    expect(shouldProxyHost('other.com', 'blacklist', ['example.com'])).toBe(true);
  });
});

describe('buildPacScript', () => {
  const proxy: ProxyEntry = {
    id: '1',
    scheme: 'socks5',
    host: '1.2.3.4',
    port: 1080,
  };

  it('routes each scheme to the right PAC proxy token', () => {
    // Run the generated PAC and assert the returned proxy string, so formatting
    // changes to the script body cannot break these assertions.
    const cases: Array<[ProxyEntry['scheme'], string]> = [
      ['http', 'PROXY 1.2.3.4:1080'],
      ['https', 'HTTPS 1.2.3.4:1080'],
      ['socks4', 'SOCKS 1.2.3.4:1080'],
      ['socks5', 'SOCKS5 1.2.3.4:1080'],
    ];
    for (const [scheme, token] of cases) {
      const run = buildPacRunner(
        buildPacScript({ ...proxy, scheme }, 'whitelist', ['example.com']),
      );
      expect(run('http://example.com/', 'example.com')).toBe(token);
    }
  });

  it('lowercases the domain list so mixed-case entries still match', () => {
    const run = buildPacRunner(buildPacScript(proxy, 'whitelist', ['Example.COM']));
    expect(run('http://example.com/', 'example.com')).toBe('SOCKS5 1.2.3.4:1080');
  });

  it('whitelist proxies the matched subtree and bypasses the rest', () => {
    const run = buildPacRunner(buildPacScript(proxy, 'whitelist', ['example.com']));
    expect(run('http://api.example.com/', 'api.example.com')).toBe('SOCKS5 1.2.3.4:1080');
    expect(run('http://other.com/', 'other.com')).toBe('DIRECT');
  });

  it('blacklist bypasses only listed domains and proxies everything else', () => {
    const run = buildPacRunner(buildPacScript(proxy, 'blacklist', ['example.com']));
    expect(run('http://example.com/', 'example.com')).toBe('DIRECT');
    expect(run('http://other.com/', 'other.com')).toBe('SOCKS5 1.2.3.4:1080');
  });

  it('always returns DIRECT for plain and local hosts', () => {
    const run = buildPacRunner(buildPacScript(proxy, 'blacklist', ['example.com']));
    expect(run('http://localhost/', 'localhost')).toBe('DIRECT');
    expect(run('http://127.0.0.1/', '127.0.0.1')).toBe('DIRECT');
    expect(run('http://intranet/', 'intranet')).toBe('DIRECT'); // plain host name
  });
});

// Evaluate a PAC script in isolation, stubbing the PAC helper globals it relies on.
function buildPacRunner(pac: string): (url: string, host: string) => string {
  const helpers = {
    isPlainHostName: (host: string) => !host.includes('.'),
    shExpMatch: (host: string, pattern: string) => {
      const re = new RegExp(`^${pattern.replace(/[.]/g, '\\.').replace(/\*/g, '.*')}$`);
      return re.test(host);
    },
    dnsDomainIs: (host: string, domain: string) => host.endsWith(domain),
  };
  const factory = new Function(
    'isPlainHostName',
    'shExpMatch',
    'dnsDomainIs',
    `${pac}\nreturn FindProxyForURL;`,
  );
  return factory(helpers.isPlainHostName, helpers.shExpMatch, helpers.dnsDomainIs);
}
