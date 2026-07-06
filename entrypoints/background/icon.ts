import type { BgContext } from './context';

interface ActionApi {
  setIcon(details: { path: Record<number, string> }): Promise<void>;
  setBadgeText(details: { text: string }): Promise<void>;
}

export async function updateIcon(ctx: BgContext): Promise<void> {
  const holder = browser as unknown as { action?: ActionApi; browserAction?: ActionApi };
  const action = holder.action ?? holder.browserAction;
  if (!action) return;
  const prefix = ctx.activeProxy() ? '' : 'gray-';
  await action.setIcon({
    path: Object.fromEntries([16, 32, 48, 128].map((s) => [s, `/icon/${prefix}${s}.png`])),
  });
  await action.setBadgeText({ text: '' });
}
