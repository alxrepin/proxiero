import type { ProxyScheme } from './types';

export interface ParsedProxyInput {
  scheme?: ProxyScheme;
  host: string;
  port?: string;
  username?: string;
  password?: string;
}

export function parseProxyString(raw: string): ParsedProxyInput {
  let v = raw.trim();
  const result: ParsedProxyInput = { host: v };

  const schemeMatch = v.match(/^(https?|socks[45]):\/\//i);
  if (schemeMatch) {
    result.scheme = schemeMatch[1].toLowerCase() as ProxyScheme;
    v = v.slice(schemeMatch[0].length);
  }

  const at = v.lastIndexOf('@');
  if (at !== -1) {
    const creds = v.slice(0, at);
    v = v.slice(at + 1);
    const colon = creds.indexOf(':');
    result.username = colon === -1 ? creds : creds.slice(0, colon);
    result.password = colon === -1 ? '' : creds.slice(colon + 1);
  }

  const portMatch = v.match(/^(.+):(\d{1,5})$/);
  if (portMatch) {
    v = portMatch[1];
    result.port = portMatch[2];
  }

  result.host = v;
  return result;
}
