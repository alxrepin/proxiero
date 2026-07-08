import { describe, expect, it } from 'vitest';
import { parseProxyString } from './parse';

describe('parseProxyString', () => {
  it('parses a bare host', () => {
    expect(parseProxyString('example.com')).toEqual({ host: 'example.com' });
  });

  it('parses host:port', () => {
    expect(parseProxyString('example.com:8080')).toEqual({
      host: 'example.com',
      port: '8080',
    });
  });

  it('extracts and lowercases the scheme', () => {
    expect(parseProxyString('SOCKS5://example.com:1080')).toEqual({
      scheme: 'socks5',
      host: 'example.com',
      port: '1080',
    });
  });

  it('parses every supported scheme', () => {
    for (const scheme of ['http', 'https', 'socks4', 'socks5'] as const) {
      expect(parseProxyString(`${scheme}://h:1`).scheme).toBe(scheme);
    }
  });

  it('parses credentials in user:pass@host:port form', () => {
    expect(parseProxyString('socks5://user:pass@1.2.3.4:1080')).toEqual({
      scheme: 'socks5',
      username: 'user',
      password: 'pass',
      host: '1.2.3.4',
      port: '1080',
    });
  });

  it('treats credentials without a colon as username with empty password', () => {
    const r = parseProxyString('user@host:80');
    expect(r.username).toBe('user');
    expect(r.password).toBe('');
  });

  it('keeps a password that itself contains colons', () => {
    const r = parseProxyString('user:p:a:ss@host:80');
    expect(r.username).toBe('user');
    expect(r.password).toBe('p:a:ss');
  });

  it('uses the last @ to split credentials from host', () => {
    const r = parseProxyString('a@b:c@host:80');
    expect(r.username).toBe('a@b');
    expect(r.password).toBe('c');
    expect(r.host).toBe('host');
  });

  it('trims surrounding whitespace', () => {
    expect(parseProxyString('  host:80  ')).toEqual({ host: 'host', port: '80' });
  });

  it('does not treat a >5 digit trailing number as a port', () => {
    const r = parseProxyString('host:123456');
    expect(r.port).toBeUndefined();
    expect(r.host).toBe('host:123456');
  });

  it('returns the raw value as host when nothing else matches', () => {
    expect(parseProxyString('just-a-host')).toEqual({ host: 'just-a-host' });
  });

  it('handles an empty string', () => {
    expect(parseProxyString('')).toEqual({ host: '' });
  });
});
