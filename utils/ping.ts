import type { ProxyEntry } from './types';

export type PingResult = { ok: true; ms: number } | { ok: false; ms: null };

/**
 * Проверка доступности прокси из попапа. Расширение не может открыть
 * «сырой» TCP-сокет, поэтому меряем время ответа порта через fetch:
 *  - ответ получен → сервер жив, ms — задержка;
 *  - быстрая ошибка → для HTTP-прокси это закрытый порт (офлайн),
 *    для SOCKS/HTTPS порт мог принять соединение, но не понять HTTP —
 *    считаем живым и показываем время;
 *  - таймаут → офлайн.
 */
export async function pingProxy(p: ProxyEntry, timeoutMs = 4000): Promise<PingResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const probeUrl = `${p.scheme === 'https' ? 'https' : 'http'}://${p.host}:${p.port}/`;
  const start = performance.now();
  try {
    await fetch(probeUrl, {
      mode: 'no-cors',
      cache: 'no-store',
      redirect: 'manual',
      signal: ctrl.signal,
    });
    return { ok: true, ms: Math.round(performance.now() - start) };
  } catch {
    if (ctrl.signal.aborted) return { ok: false, ms: null };
    const ms = Math.round(performance.now() - start);
    return p.scheme === 'http' ? { ok: false, ms: null } : { ok: true, ms };
  } finally {
    clearTimeout(timer);
  }
}
