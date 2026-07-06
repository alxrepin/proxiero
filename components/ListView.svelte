<script lang="ts">
import Icon from './Icon.svelte';
import LangButton from './LangButton.svelte';
import PowerSection from './PowerSection.svelte';
import ProxyList from './ProxyList.svelte';
import { app } from '@/stores/app.svelte';
import { formActions } from '@/stores/form.svelte';
import { pings } from '@/stores/pings.svelte';
import { ui } from '@/stores/ui.svelte';
import { t } from '@/utils/i18n.svelte';
</script>

<header>
  <span class="logo">Proxiero</span>
  <LangButton />
  <div class="head-actions">
    <button
      class="icon-btn"
      onclick={() => pings.refresh(app.proxies)}
      aria-label={t('refreshPing')}
      title={t('refreshPing')}
    >
      <Icon name="refresh" />
    </button>
    <button
      class="icon-btn"
      onclick={() => (ui.about = true)}
      aria-label={t('help')}
      title={t('help')}
    >
      <Icon name="help" />
    </button>
    <button
      class="icon-btn"
      onclick={() => formActions.open()}
      aria-label={t('addServer')}
      title={t('addServer')}
    >
      <Icon name="plus" />
    </button>
  </div>
</header>

<PowerSection />
<ProxyList />

