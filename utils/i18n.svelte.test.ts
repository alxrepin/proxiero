import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { getLang, initLang, t, toggleLang } from './i18n.svelte';

describe('i18n', () => {
  beforeEach(() => {
    fakeBrowser.reset();
  });

  describe('initLang', () => {
    it('uses the stored language when valid', async () => {
      await fakeBrowser.storage.local.set({ lang: 'ru' });
      await initLang();
      expect(getLang()).toBe('ru');
    });

    it('falls back to navigator detection when nothing is stored', async () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('ru-RU');
      await initLang();
      expect(getLang()).toBe('ru');
    });

    it('detects English for non-ru navigator languages', async () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
      await initLang();
      expect(getLang()).toBe('en');
    });

    it('ignores an invalid stored language', async () => {
      vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
      await fakeBrowser.storage.local.set({ lang: 'de' });
      await initLang();
      expect(getLang()).toBe('en');
    });
  });

  describe('toggleLang', () => {
    it('flips the language and persists it', async () => {
      await fakeBrowser.storage.local.set({ lang: 'en' });
      await initLang();

      toggleLang();
      expect(getLang()).toBe('ru');

      await Promise.resolve();
      expect(await fakeBrowser.storage.local.get('lang')).toEqual({ lang: 'ru' });

      toggleLang();
      expect(getLang()).toBe('en');
    });
  });

  describe('t', () => {
    beforeEach(async () => {
      await fakeBrowser.storage.local.set({ lang: 'en' });
      await initLang();
    });

    it('returns the translation for the current language', () => {
      expect(t('save')).toBe('Save');
    });

    it('substitutes named parameters', () => {
      expect(t('editAria', { name: 'Proxy A' })).toBe('Edit Proxy A');
    });

    it('falls back to the key itself when missing everywhere', () => {
      expect(t('__does_not_exist__')).toBe('__does_not_exist__');
    });

    it('returns the Russian string when the active language is ru', async () => {
      await fakeBrowser.storage.local.set({ lang: 'ru' });
      await initLang();
      expect(t('save')).toBe('Сохранить');
    });
  });
});
