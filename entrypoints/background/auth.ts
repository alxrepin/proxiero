import type { BgContext } from './context';

type AuthDetails = { requestId: string; isProxy: boolean };
type AuthListener = (
  details: AuthDetails,
  asyncCallback?: (response: object) => void,
) => object | Promise<object> | undefined;

export function setupProxyAuth(ctx: BgContext): void {
  const attempts = new Map<string, number>();

  const decide = async (details: AuthDetails): Promise<object> => {
    await ctx.ready;
    const p = ctx.activeProxy();
    if (!details.isProxy || !p?.username) return {};
    const attempt = (attempts.get(details.requestId) ?? 0) + 1;
    attempts.set(details.requestId, attempt);

    if (attempt > 2) return { cancel: true };
    return { authCredentials: { username: p.username, password: p.password ?? '' } };
  };

  const onAuthRequired: AuthListener = (details, asyncCallback) => {
    const result = decide(details);
    if (asyncCallback) {
      void result.then(asyncCallback);
      return undefined;
    }

    return result;
  };

  const onAuthRequiredEvent = browser.webRequest.onAuthRequired as unknown as {
    addListener(
      cb: AuthListener,
      filter: { urls: string[] },
      extraInfoSpec: string[],
    ): void;
  };
  onAuthRequiredEvent.addListener(onAuthRequired, { urls: ['<all_urls>'] }, [
    import.meta.env.FIREFOX ? 'blocking' : 'asyncBlocking',
  ]);

  const forget = (d: { requestId: string }) => attempts.delete(d.requestId);
  browser.webRequest.onCompleted.addListener(forget, { urls: ['<all_urls>'] });
  browser.webRequest.onErrorOccurred.addListener(forget, { urls: ['<all_urls>'] });
}
