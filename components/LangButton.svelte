<script lang="ts">
import Icon from './Icon.svelte';
import { t, getLang, toggleLang } from '@/utils/i18n.svelte';
</script>

<button class="lang-btn" onclick={toggleLang} aria-label={t('switchLang')} title={t('switchLang')}>
  <Icon name="globe" size={12} />
  <span>{getLang().toUpperCase()}</span>
</button>
