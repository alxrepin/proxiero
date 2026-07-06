import type { BgContext } from './context';

type AuthDetails = { requestId: string; isProxy: boolean };
type AuthListener = (
  details: AuthDetails,
  asyncCallback?: (response: object) => void,
) => object | undefined;

export function setupProxyAuth(ctx: BgContext): void {
  const attempts = new Map<string, number>();

  const onAuthRequired: AuthListener = (details, asyncCallback) => {
    const respond = (r: object): object | undefined => {
      if (asyncCallback) {
        asyncCallback(r);
        return undefined;
      }
      return r;
    };
    const p = ctx.activeProxy();
    if (!details.isProxy || !p?.username) return respond({});
    const attempt = (attempts.get(details.requestId) ?? 0) + 1;
    attempts.set(details.requestId, attempt);

    if (attempt > 2) return respond({ cancel: true });
    return respond({
      authCredentials: { username: p.username, password: p.password ?? '' },
    });
  };

  const addAuthListener = browser.webRequest.onAuthRequired.addListener as unknown as (
    cb: AuthListener,
    filter: { urls: string[] },
    extraInfoSpec: string[],
  ) => void;
  addAuthListener(onAuthRequired, { urls: ['<all_urls>'] }, [
    import.meta.env.FIREFOX ? 'blocking' : 'asyncBlocking',
  ]);

  const forget = (d: { requestId: string }) => attempts.delete(d.requestId);
  browser.webRequest.onCompleted.addListener(forget, { urls: ['<all_urls>'] });
  browser.webRequest.onErrorOccurred.addListener(forget, { urls: ['<all_urls>'] });
}
