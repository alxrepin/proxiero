<script lang="ts">
import { onMount } from 'svelte';
import Icon from './Icon.svelte';
import { app } from '@/stores/app.svelte';
import { ui } from '@/stores/ui.svelte';
import { t } from '@/utils/i18n.svelte';
import { normalizeDomain } from '@/utils/split';
import type { SplitMode } from '@/utils/types';

// Local editable rows (raw text, may be empty while typing).
let rows = $state<string[]>([]);
let mode = $state<SplitMode>('blacklist');
let enabled = $state(false);

onMount(() => {
  enabled = app.splitEnabled;
  mode = app.splitMode;
  rows = app.splitDomains.length ? [...app.splitDomains] : [''];
});

// Toggling on/off never clears the mode or the domain list — only the flag changes.
function toggleEnabled(): void {
  enabled = !enabled;
  void app.setSplitEnabled(enabled);
}

// Persist normalized, de-duplicated, non-empty domains. Called on blur and on
// structural edits (not on every keystroke) so the proxy isn't re-applied mid-typing.
function commit(): void {
  const cleaned = rows.map(normalizeDomain).filter((d, i, arr) => d && arr.indexOf(d) === i);
  void app.setSplitDomains(cleaned);
}

function setMode(next: SplitMode): void {
  mode = next;
  void app.setSplitMode(next);
}

function addRow(): void {
  rows = [...rows, ''];
}

function removeRow(i: number): void {
  rows = rows.filter((_, idx) => idx !== i);
  if (rows.length === 0) rows = [''];
  commit();
}
</script>

<header>
  <button class="icon-btn" onclick={() => (ui.split = false)} aria-label={t('back')} title={t('back')}>
    <Icon name="back" />
  </button>
  <span class="page-title">{t('splitTitle')}</span>
  <button
    class="switch"
    class:on={enabled}
    role="switch"
    aria-checked={enabled}
    aria-label={t('splitTitle')}
    onclick={toggleEnabled}
  >
    <span class="switch-knob"></span>
  </button>
</header>

<p class="split-intro">{t('splitIntro')}</p>

<div class="split-config" class:off={!enabled}>
  <div class="seg" role="tablist" aria-label={t('splitMode')}>
    <button
      class="seg-btn"
      class:active={mode === 'blacklist'}
      role="tab"
      aria-selected={mode === 'blacklist'}
      onclick={() => setMode('blacklist')}
    >
      {t('splitBlacklist')}
    </button>
    <button
      class="seg-btn"
      class:active={mode === 'whitelist'}
      role="tab"
      aria-selected={mode === 'whitelist'}
      onclick={() => setMode('whitelist')}
    >
      {t('splitWhitelist')}
    </button>
  </div>

  <p class="split-hint">
    {mode === 'whitelist' ? t('splitWhitelistDesc') : t('splitBlacklistDesc')}
  </p>

  <div class="split-domains">
    <span class="field-label">{t('splitDomains')}</span>
    {#each rows as _, i (i)}
      <div class="domain-row">
        <input
          bind:value={rows[i]}
          onblur={commit}
          placeholder={t('splitDomainPlaceholder')}
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
        />
        <button
          class="icon-btn domain-remove"
          onclick={() => removeRow(i)}
          aria-label={t('splitRemoveDomain')}
          title={t('splitRemoveDomain')}
        >
          <Icon name="trash" size={15} />
        </button>
      </div>
    {/each}

    <button class="add-domain" onclick={addRow}>
      <Icon name="plus" size={15} />
      <span>{t('splitAddDomain')}</span>
    </button>
  </div>
</div>
