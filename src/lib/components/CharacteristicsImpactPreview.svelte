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
</script>

{#if hasImpact}
  <div
    class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 print:hidden"
    style="animation: fadeInUp 0.3s ease-out;"
  >
    <div class="bg-white border border-navy/10 shadow-lg rounded-full px-5 py-2.5 flex items-center gap-2 text-sm">
      <span class="text-navy/60">Impact estimatif</span>
      <span class="font-bold {pct > 0 ? 'text-emerald-600' : 'text-red-500'}">
        {pct > 0 ? '+' : ''}{pct} %
      </span>
    </div>
  </div>
{/if}
