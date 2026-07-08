import { describe, expect, it } from 'vitest';
import type { ProxyEntry } from './types';
import { proxyTitle } from './types';

const base: ProxyEntry = { id: '1', scheme: 'http', host: 'example.com', port: 8080 };

describe('proxyTitle', () => {
  it('uses the trimmed name when present', () => {
    expect(proxyTitle({ ...base, name: '  My Proxy  ' })).toBe('My Proxy');
  });

  it('falls back to host:port when the name is empty', () => {
    expect(proxyTitle({ ...base, name: '' })).toBe('example.com:8080');
  });

  it('falls back to host:port when the name is whitespace only', () => {
    expect(proxyTitle({ ...base, name: '   ' })).toBe('example.com:8080');
  });

  it('falls back to host:port when the name is absent', () => {
    expect(proxyTitle(base)).toBe('example.com:8080');
  });
});
