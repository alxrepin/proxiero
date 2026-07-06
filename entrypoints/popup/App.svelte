<script lang="ts">
import { onMount } from 'svelte';
import AboutView from '@/components/AboutView.svelte';
import FormView from '@/components/FormView.svelte';
import ListView from '@/components/ListView.svelte';
import { app } from '@/stores/app.svelte';
import { form, formActions } from '@/stores/form.svelte';
import { pings } from '@/stores/pings.svelte';
import { ui } from '@/stores/ui.svelte';
import { initLang } from '@/utils/i18n.svelte';

onMount(async () => {
  await initLang();
  await app.init();
  await formActions.restore();
  pings.refresh(app.proxies);
});

$effect(() => {
  const snapshot = formActions.snapshot();
  if (!formActions.ready) return;
  const timer = setTimeout(() => formActions.persist(snapshot), 150);
  return () => clearTimeout(timer);
});
</script>

<main>
  {#if ui.about}
    <AboutView />
  {:else if form.visible}
    <FormView />
  {:else}
    <ListView />
  {/if}
</main>

