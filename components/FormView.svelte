<script lang="ts">
import Icon from './Icon.svelte';
import { app } from '@/stores/app.svelte';
import { form, formActions } from '@/stores/form.svelte';
import { pings } from '@/stores/pings.svelte';
import { t } from '@/utils/i18n.svelte';
import { parseProxyString } from '@/utils/parse';
import { SCHEME_LABELS, type ProxyEntry } from '@/utils/types';

function applyHostParse() {
  const parsed = parseProxyString(form.host);
  if (parsed.scheme) form.scheme = parsed.scheme;
  if (parsed.username !== undefined) {
    form.user = parsed.username;
    form.pass = parsed.password ?? '';
  }
  if (parsed.port) form.port = parsed.port;
  form.host = parsed.host;
}

async function submit(e: SubmitEvent) {
  e.preventDefault();
  applyHostParse();
  const port = Number(form.port);
  if (!form.host.trim()) {
    form.error = t('errorNoHost');
    return;
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    form.error = t('errorPort');
    return;
  }
  const entry: ProxyEntry = {
    id: form.editingId ?? crypto.randomUUID(),
    name: form.name.trim() || undefined,
    scheme: form.scheme,
    host: form.host.trim(),
    port,
    username: form.user.trim() || undefined,
    password: form.pass || undefined,
  };
  await app.upsert(entry);
  pings.ping(entry);
  formActions.reset();
}
</script>

<header>
  <button class="icon-btn" onclick={() => formActions.hide()} aria-label={t('back')} title={t('back')}>
    <Icon name="back" />
  </button>
  <span class="page-title">{form.editingId ? t('editServer') : t('newServer')}</span>
</header>

<form class="form-body" onsubmit={submit}>
  <label class="field">
    <span>{t('proxyType')}</span>
    <select bind:value={form.scheme}>
      {#each Object.entries(SCHEME_LABELS) as [value, label]}
        <option {value}>{label}</option>
      {/each}
    </select>
  </label>
  <div class="row">
    <label class="field grow">
      <span>{t('address')}</span>
      <input
        placeholder={t('addressPlaceholder')}
        bind:value={form.host}
        onblur={applyHostParse}
        required
      />
    </label>
    <label class="field port-field">
      <span>{t('port')}</span>
      <input placeholder="8080" bind:value={form.port} inputmode="numeric" />
    </label>
  </div>
  <div class="row">
    <label class="field grow">
      <span>{t('username')}</span>
      <input bind:value={form.user} autocomplete="off" placeholder={t('optional')} />
    </label>
    <label class="field grow">
      <span>{t('password')}</span>
      <input type="password" bind:value={form.pass} autocomplete="off" placeholder={t('optional')} />
    </label>
  </div>
  <label class="field">
    <span>{t('name')}</span>
    <input bind:value={form.name} placeholder={t('optional')} />
  </label>
  {#if form.error}<div class="form-error" role="alert">{form.error}</div>{/if}
  <div class="form-actions">
    <button type="button" class="secondary" onclick={() => formActions.reset()}>{t('cancel')}</button>
    <button type="submit" class="primary">{form.editingId ? t('update') : t('save')}</button>
  </div>
</form>
