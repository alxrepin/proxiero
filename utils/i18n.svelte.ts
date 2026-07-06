import en from '@/locales/en.json';
import ru from '@/locales/ru.json';

export type Lang = 'en' | 'ru';

const dicts: Record<Lang, Record<string, string>> = { en, ru };

// Модульный $state: чтение в шаблонах реактивно, смена языка
// перерисовывает весь интерфейс без перезагрузки попапа.
let current = $state<Lang>('en');

function detect(): Lang {
  return (navigator.language || 'en').toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export async function initLang(): Promise<void> {
  const { lang } = await browser.storage.local.get('lang');
  current = lang === 'ru' || lang === 'en' ? lang : detect();
}

export function getLang(): Lang {
  return current;
}

export function toggleLang(): void {
  current = current === 'ru' ? 'en' : 'ru';
  void browser.storage.local.set({ lang: current });
}

export function t(key: string, params?: Record<string, string>): string {
  let s = dicts[current][key] ?? dicts.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}
