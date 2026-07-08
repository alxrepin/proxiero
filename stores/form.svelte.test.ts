import { beforeEach, describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing';
import { type FormDraft, loadDraft, saveDraft } from '@/utils/storage';
import type { ProxyEntry } from '@/utils/types';
import { app } from './app.svelte';
import { form, formActions } from './form.svelte';

const proxy: ProxyEntry = {
  id: '1',
  scheme: 'socks5',
  host: 'h',
  port: 1080,
  name: 'My Proxy',
  username: 'u',
  password: 'p',
};

const fullDraft: FormDraft = {
  showForm: true,
  editingId: '1',
  name: 'n',
  scheme: 'https',
  host: 'host',
  port: '443',
  user: 'user',
  pass: 'pass',
};

describe('form store', () => {
  beforeEach(async () => {
    fakeBrowser.reset();
    await app.init();
    formActions.reset();
  });

  describe('open / hide', () => {
    it('open shows the form, hide conceals it', () => {
      formActions.open();
      expect(form.visible).toBe(true);
      formActions.hide();
      expect(form.visible).toBe(false);
    });
  });

  describe('openFor', () => {
    it('loads an existing proxy into the form fields', () => {
      formActions.openFor(proxy);
      expect(form).toMatchObject({
        visible: true,
        editingId: '1',
        name: 'My Proxy',
        scheme: 'socks5',
        host: 'h',
        port: '1080',
        user: 'u',
        pass: 'p',
        error: '',
      });
    });

    it('normalizes missing optional fields to empty strings', () => {
      formActions.openFor({ id: '2', scheme: 'http', host: 'x', port: 80 });
      expect(form.name).toBe('');
      expect(form.user).toBe('');
      expect(form.pass).toBe('');
    });
  });

  describe('reset', () => {
    it('clears every field and hides the form', () => {
      formActions.openFor(proxy);
      formActions.reset();
      expect(form).toMatchObject({
        visible: false,
        editingId: null,
        name: '',
        host: '',
        port: '',
        user: '',
        pass: '',
        scheme: 'http',
        error: '',
      });
    });

    it('removes any persisted draft', async () => {
      saveDraft(fullDraft);
      formActions.reset();
      expect(await loadDraft()).toBeNull();
    });
  });

  describe('detachEditing', () => {
    it('clears editingId when it matches', () => {
      formActions.openFor(proxy);
      formActions.detachEditing('1');
      expect(form.editingId).toBeNull();
    });

    it('leaves editingId untouched when it does not match', () => {
      formActions.openFor(proxy);
      formActions.detachEditing('other');
      expect(form.editingId).toBe('1');
    });
  });

  describe('restore', () => {
    it('marks the store ready even with no draft', async () => {
      await formActions.restore();
      expect(formActions.ready).toBe(true);
    });

    it('rehydrates the form from a persisted draft', async () => {
      await app.upsert(proxy); // so editingId '1' stays valid
      saveDraft(fullDraft);
      await formActions.restore();
      expect(form).toMatchObject({
        visible: true,
        editingId: '1',
        name: 'n',
        scheme: 'https',
        host: 'host',
        port: '443',
        user: 'user',
        pass: 'pass',
      });
    });

    it('drops editingId when the referenced proxy no longer exists', async () => {
      saveDraft({ ...fullDraft, editingId: 'ghost' });
      await formActions.restore();
      expect(form.editingId).toBeNull();
    });
  });

  describe('snapshot', () => {
    it('captures the current form fields as a draft', () => {
      formActions.openFor(proxy);
      expect(formActions.snapshot()).toEqual({
        showForm: true,
        editingId: '1',
        name: 'My Proxy',
        scheme: 'socks5',
        host: 'h',
        port: '1080',
        user: 'u',
        pass: 'p',
      });
    });
  });

  describe('persist', () => {
    it('saves a non-pristine draft', async () => {
      formActions.persist(fullDraft);
      expect(await loadDraft()).toEqual(fullDraft);
    });

    it('clears storage for a pristine draft instead of saving it', async () => {
      saveDraft(fullDraft);
      const pristine: FormDraft = {
        showForm: false,
        editingId: null,
        name: '',
        scheme: 'http',
        host: '',
        port: '',
        user: '',
        pass: '',
      };
      formActions.persist(pristine);
      expect(await loadDraft()).toBeNull();
    });
  });
});
