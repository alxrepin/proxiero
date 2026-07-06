<script lang="ts">
import ProxyRow from './ProxyRow.svelte';
import { app } from '@/stores/app.svelte';
import { formActions } from '@/stores/form.svelte';
import { t } from '@/utils/i18n.svelte';
</script>

{#if app.proxies.length === 0}
  <div class="empty">
    <p>{t('emptyList')}</p>
    <button class="link" onclick={() => formActions.open()}>{t('addFirst')}</button>
  </div>
{:else}
  <ul class="proxy-list">
    {#each app.proxies as proxy (proxy.id)}
      <ProxyRow {proxy} />
    {/each}
  </ul>
{/if}
