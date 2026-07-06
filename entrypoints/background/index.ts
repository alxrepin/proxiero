import { setupProxyAuth } from './auth';
import { createBgContext } from './context';
import { updateIcon } from './icon';
import { applyChromeProxy, setupFirefoxRouting } from './routing';

export default defineBackground(() => {
  const ctx = createBgContext();

  if (import.meta.env.FIREFOX) setupFirefoxRouting(ctx);
  setupProxyAuth(ctx);

  async function applyAll(): Promise<void> {
    await ctx.ready;
    if (!import.meta.env.FIREFOX) {
      try {
        await applyChromeProxy(ctx);
      } catch (e) {
        console.error('[proxiero] не удалось применить настройки прокси', e);
      }
    }
    await updateIcon(ctx);
  }

  ctx.onStateChange(() => void applyAll());

  // onStartup покрывает перезапуск браузера, onInstalled — обновление
  // расширения; прямой вызов — пробуждение сервис-воркера в Chrome.
  browser.runtime.onStartup.addListener(() => void applyAll());
  browser.runtime.onInstalled.addListener(() => void applyAll());
  void applyAll();
});
