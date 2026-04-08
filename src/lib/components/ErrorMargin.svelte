<script lang="ts">
  import type { PriceEstimation } from '$lib/types';

  let { estimation }: { estimation: PriceEstimation } = $props();

  const margin = estimation.error_margin_pct;
  const hasMargin = margin !== null && margin !== undefined;

  const qualityLabel = $derived(() => {
    if (!hasMargin) return 'Insuffisant';
    if (margin! <= 8) return 'Très précis';
    if (margin! <= 12) return 'Précis';
    if (margin! <= 18) return 'Correct';
    return 'Indicatif';
  });

  const qualityColor = $derived(() => {
    if (!hasMargin) return 'oklch(0.65 0.18 30)';
    if (margin! <= 8) return 'oklch(0.58 0.14 155)';
    if (margin! <= 12) return 'oklch(0.58 0.14 155)';
    if (margin! <= 18) return 'oklch(0.75 0.15 75)';
    return 'oklch(0.65 0.18 30)';
  });
</script>

<div class="bg-white rounded-xl border border-navy/10 p-4 shadow-sm">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <svg class="w-4 h-4 text-navy/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="text-xs font-medium text-navy/60">Marge d'erreur estimée</span>
    </div>
    <div class="flex items-center gap-2">
      {#if hasMargin}
        <span class="font-mono text-sm font-bold" style="color: {qualityColor()}">
          &pm;{margin}%
        </span>
        <span class="text-[10px] px-2 py-0.5 rounded-full font-medium" style="background: {qualityColor()}20; color: {qualityColor()}">
          {qualityLabel()}
        </span>
      {:else}
        <span class="text-xs text-navy/30 italic">Données insuffisantes (&lt;6 comparables)</span>
      {/if}
    </div>
  </div>

  {#if hasMargin}
    <!-- Visual bar showing margin -->
    <div class="mt-3 relative">
      <div class="flex items-center gap-2 text-[10px] text-navy/30">
        <span>-{margin}%</span>
        <div class="flex-1 h-1.5 rounded-full bg-navy/5 relative overflow-hidden">
          <div class="absolute h-full rounded-full" style="left: {50 - (margin! / 2)}%; width: {margin}%; background: {qualityColor()}30;"></div>
          <div class="absolute h-full w-px bg-navy/20" style="left: 50%;"></div>
        </div>
        <span>+{margin}%</span>
      </div>
    </div>
    <p class="text-[10px] text-navy/25 mt-2">
      Calculé par validation croisée leave-one-out sur {estimation.comparable_count} ventes
    </p>
  {/if}
</div>
