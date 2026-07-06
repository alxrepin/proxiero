import { clearDraft, type FormDraft, loadDraft, saveDraft } from '@/utils/storage';
import type { ProxyEntry, ProxyScheme } from '@/utils/types';
import { app } from './app.svelte';

export const form = $state({
  visible: false,
  editingId: null as string | null,
  error: '',
  name: '',
  scheme: 'http' as ProxyScheme,
  host: '',
  port: '',
  user: '',
  pass: '',
});

let ready = $state(false);

export const formActions = {
  get ready() {
    return ready;
  },

  open(): void {
    form.visible = true;
  },

  hide(): void {
    form.visible = false;
  },

  openFor(p: ProxyEntry): void {
    form.editingId = p.id;
    form.name = p.name ?? '';
    form.scheme = p.scheme;
    form.host = p.host;
    form.port = String(p.port);
    form.user = p.username ?? '';
    form.pass = p.password ?? '';
    form.error = '';
    form.visible = true;
  },

  detachEditing(id: string): void {
    if (form.editingId === id) form.editingId = null;
  },

  reset(): void {
    form.name = form.host = form.port = form.user = form.pass = '';
    form.scheme = 'http';
    form.editingId = null;
    form.error = '';
    form.visible = false;
    clearDraft();
  },

  async restore(): Promise<void> {
    const draft = await loadDraft();
    if (draft) {
      form.visible = draft.showForm;
      form.editingId = draft.editingId;
      form.name = draft.name;
      form.scheme = draft.scheme;
      form.host = draft.host;
      form.port = draft.port;
      form.user = draft.user;
      form.pass = draft.pass;
      if (form.editingId && !app.proxies.some((p) => p.id === form.editingId)) {
        form.editingId = null;
      }
    }
    ready = true;
  },

  snapshot(): FormDraft {
    return {
      showForm: form.visible,
      editingId: form.editingId,
      name: form.name,
      scheme: form.scheme,
      host: form.host,
      port: form.port,
      user: form.user,
      pass: form.pass,
    };
  },

  persist(draft: FormDraft): void {
    const pristine =
      !draft.showForm &&
      !draft.editingId &&
      !draft.name &&
      !draft.host &&
      !draft.port &&
      !draft.user &&
      !draft.pass;
    if (pristine) clearDraft();
    else saveDraft(draft);
  },
};
