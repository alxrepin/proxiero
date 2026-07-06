<script lang="ts">
import Icon from './Icon.svelte';
import { app } from '@/stores/app.svelte';
import { formActions } from '@/stores/form.svelte';
import { t } from '@/utils/i18n.svelte';
import { SCHEME_LABELS, proxyTitle } from '@/utils/types';

async function toggle() {
  const toggled = await app.toggle();
  if (!toggled) formActions.open();
}
</script>

<section class="power-block">
  <button
    class="power"
    class:on={app.isOn}
    onclick={toggle}
    title={app.isOn ? t('turnOff') : t('turnOn')}
    aria-pressed={app.isOn}
  >
    <Icon name="power" size={34} />
  </button>
  <div class="power-caption">
    {#if app.active}
      <span class="active-name">{proxyTitle(app.active)}</span>
      <span class="active-sub">
        <span class="state-word" class:on={app.isOn}>
          {app.isOn ? t('connected') : t('disconnected')}
        </span>
        · {SCHEME_LABELS[app.active.scheme]} · {app.active.host}:{app.active.port}
      </span>
    {:else}
      <span class="active-name muted">{t('noProxySelected')}</span>
      <span class="active-sub">{t('noProxyHint')}</span>
    {/if}
  </div>
</section>
