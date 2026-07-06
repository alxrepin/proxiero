<script lang="ts">
import Icon from './Icon.svelte';
import { ui } from '@/stores/ui.svelte';
import { t } from '@/utils/i18n.svelte';
import { AUTHOR_NAME, AUTHOR_URL, GITHUB_URL } from '@/utils/links';

const version = browser.runtime.getManifest?.().version ?? '';
const FAQ = [1, 2, 3, 4];
</script>

<header>
  <button class="icon-btn" onclick={() => (ui.about = false)} aria-label={t('back')} title={t('back')}>
    <Icon name="back" />
  </button>
  <span class="page-title">{t('aboutTitle')}</span>
</header>

<div class="about-body">
  <p class="about-desc">{t('aboutDescription')}</p>

  <div class="about-links">
    <a class="about-link" href={AUTHOR_URL} target="_blank" rel="noreferrer">
      <Icon name="user" size={15} />
      <span>{t('author')} — {AUTHOR_NAME}</span>
    </a>
    <a class="about-link" href={GITHUB_URL} target="_blank" rel="noreferrer">
      <Icon name="github" size={15} />
      <span>{t('githubLink')}</span>
    </a>
  </div>

  <h2 class="faq-title">{t('faqTitle')}</h2>
  {#each FAQ as i}
    <details class="faq-item">
      <summary>{t(`faq${i}q`)}</summary>
      <p>{t(`faq${i}a`)}</p>
    </details>
  {/each}

  <div class="about-version">Proxiero{version ? ` v${version}` : ''}</div>
</div>
