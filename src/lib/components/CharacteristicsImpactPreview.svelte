<script lang="ts">
  import type { PropertyCharacteristics } from '$lib/types';
  import { computeCharacteristicsCoefficient } from '$lib/config/coefficients';

  let {
    characteristics,
    propertyType,
  }: {
    characteristics: PropertyCharacteristics;
    propertyType: string;
  } = $props();

  const result = $derived(computeCharacteristicsCoefficient(characteristics, propertyType));
  const pct = $derived(Math.round((result.coefficient - 1) * 100));
  const hasImpact = $derived(result.coefficient !== 1.0);

  let prevPct = $state(0);
  let bouncing = $state(false);

  $effect(() => {
    if (pct !== prevPct) {
      bouncing = true;
      prevPct = pct;
      const timer = setTimeout(() => { bouncing = false; }, 300);
      return () => clearTimeout(timer);
    }
  });
</script>

<div
  class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 print:hidden"
  style="animation: fadeInUp 0.3s ease-out; {bouncing ? 'animation: scaleBounce 0.3s ease-out;' : ''}"
>
  <div class="rounded-full px-6 py-3 flex items-center gap-2.5 text-sm
    {hasImpact
      ? 'bg-white border border-navy/10 shadow-lg'
      : 'bg-navy/5 border border-navy/5'}"
  >
    {#if hasImpact}
      <span class="text-navy/50 font-medium">Impact estimatif</span>
      <span class="font-bold text-base {pct > 0 ? 'text-emerald-600' : 'text-red-500'}">
        {pct > 0 ? '+' : ''}{pct} %
      </span>
    {:else}
      <span class="text-navy/30 font-medium">Aucun ajustement</span>
    {/if}
  </div>
</div>
