<script lang="ts">
import Icon from './Icon.svelte';
import { app } from '@/stores/app.svelte';
import { formActions } from '@/stores/form.svelte';
import { pings, type PingStatus } from '@/stores/pings.svelte';
import { t } from '@/utils/i18n.svelte';
import { SCHEME_LABELS, proxyTitle, type ProxyEntry } from '@/utils/types';

let { proxy }: { proxy: ProxyEntry } = $props();

const selected = $derived(proxy.id === app.activeId);
const lit = $derived(selected && app.enabled);
const status = $derived(pings.of(proxy.id));

function edit(e: Event) {
  e.stopPropagation();
  formActions.openFor(proxy);
}

async function remove(e: Event) {
  e.stopPropagation();
  formActions.detachEditing(proxy.id);
  await app.remove(proxy.id);
}

function pingLabel(r: PingStatus): string {
  if (r === undefined || r === 'pending') return '…';
  return r.ok ? `${r.ms} ${t('ms')}` : t('offline');
}

function pingClass(r: PingStatus): string {
  if (r === undefined || r === 'pending') return 'pending';
  if (!r.ok) return 'dead';
  return r.ms < 300 ? 'fast' : 'slow';
}
</script>

<li>
  <button class="proxy-row" class:selected onclick={() => app.select(proxy.id)}>
    <span class="dot" class:lit></span>
    <span class="proxy-main">
      <span class="proxy-title">{proxyTitle(proxy)}</span>
      <span class="proxy-sub">{SCHEME_LABELS[proxy.scheme]} · {proxy.host}:{proxy.port}</span>
    </span>
    <span class="ping {pingClass(status)}">{pingLabel(status)}</span>
    <span
      class="row-action"
      role="button"
      tabindex="0"
      title={t('editAria', { name: proxyTitle(proxy) })}
      aria-label={t('editAria', { name: proxyTitle(proxy) })}
      onclick={edit}
      onkeydown={(e) => e.key === 'Enter' && edit(e)}
    >
      <Icon name="pencil" size={14} />
    </span>
    <span
      class="row-action danger"
      role="button"
      tabindex="0"
      title={t('deleteAria', { name: proxyTitle(proxy) })}
      aria-label={t('deleteAria', { name: proxyTitle(proxy) })}
      onclick={remove}
      onkeydown={(e) => e.key === 'Enter' && remove(e)}
    >
      <Icon name="trash" size={14} />
    </span>
  </button>
</li>

