<script lang="ts">
  import type { PriceEstimation } from '$lib/types';

  let { estimation }: { estimation: PriceEstimation } = $props();

  const adjustments = $derived(() => {
    const items: { label: string; value: string; type: 'positive' | 'negative' | 'neutral' }[] = [];

    // DPE adjustment
    if (estimation.dpe_adjustment) {
      const pct = Math.round((estimation.dpe_adjustment.coefficient - 1) * 100);
      items.push({
        label: estimation.dpe_adjustment.label,
        value: pct > 0 ? `+${pct}%` : `${pct}%`,
        type: pct > 0 ? 'positive' : 'negative',
      });
    }

    // Temporal correction
    if (estimation.temporal_adjustment_pct) {
      const pct = estimation.temporal_adjustment_pct;
      items.push({
        label: 'Correction temporelle (indexation 2025)',
        value: pct > 0 ? `+${pct}%` : `${pct}%`,
        type: pct > 0 ? 'positive' : pct < 0 ? 'negative' : 'neutral',
      });
    }

    return items;
  });
</script>

{#if adjustments().length > 0}
  <div class="flex flex-wrap gap-2 mt-3">
    {#each adjustments() as adj}
      <span class="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border
        {adj.type === 'positive' ? 'bg-sage/5 border-sage/20 text-sage' : adj.type === 'negative' ? 'bg-coral/5 border-coral/20 text-coral' : 'bg-navy/5 border-navy/10 text-navy/50'}"
      >
        {#if adj.type === 'positive'}
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 9V3M3 6l3-3 3 3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {:else if adj.type === 'negative'}
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 3v6M3 6l3 3 3-3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {/if}
        <span class="font-medium">{adj.value}</span>
        <span class="opacity-70">{adj.label}</span>
      </span>
    {/each}
  </div>
{/if}
