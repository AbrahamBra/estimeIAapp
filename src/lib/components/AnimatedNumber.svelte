<script lang="ts">
  import { onMount } from 'svelte';

  let { value, suffix = '' }: { value: number; suffix?: string } = $props();

  let displayed = $state(0);
  let hasAnimated = $state(false);

  onMount(() => {
    const start = performance.now();
    const duration = 1200;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      displayed = Math.round(value * eased);
      if (t < 1) requestAnimationFrame(tick);
      else hasAnimated = true;
    }
    requestAnimationFrame(tick);
  });

  let formatted = $derived(displayed.toLocaleString('fr-FR'));
</script>

<span class="tabular-nums">{formatted}{suffix}</span>
