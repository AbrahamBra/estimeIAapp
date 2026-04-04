<script lang="ts">
  import type { Comparable } from '$lib/types';

  let { comparables, medianPrixM2 }: { comparables: Comparable[]; medianPrixM2: number } = $props();

  const BINS = 8;
  const prices = comparables.map((c) => c.prix_m2).sort((a, b) => a - b);
  const min = prices[0] ?? 0;
  const max = prices[prices.length - 1] ?? 1;
  const binWidth = (max - min) / BINS || 1;

  const bins = Array.from({ length: BINS }, (_, i) => {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    return prices.filter((p) => p >= lo && (i === BINS - 1 ? p <= hi : p < hi)).length;
  });

  const maxCount = Math.max(...bins, 1);
  const barW = 100 / BINS;

  const medianPct = ((medianPrixM2 - min) / (max - min)) * 100;

  function binColor(i: number): string {
    const t = i / (BINS - 1);
    if (t < 0.33) return 'oklch(0.58 0.14 155)';
    if (t < 0.66) return 'oklch(0.75 0.15 75)';
    return 'oklch(0.65 0.18 30)';
  }

  function formatK(n: number): string {
    return n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n));
  }
</script>

{#if comparables.length >= 3}
  <div class="bg-white rounded-xl border border-navy/10 p-4">
    <p class="text-xs font-medium text-navy/50 mb-3">Distribution des prix/m&sup2;</p>
    <svg viewBox="0 0 100 50" class="w-full" preserveAspectRatio="none">
      {#each bins as count, i}
        {@const h = (count / maxCount) * 40}
        <rect
          x={i * barW + 0.5}
          y={45 - h}
          width={barW - 1}
          height={h}
          rx="1"
          fill={binColor(i)}
          opacity="0.8"
          style="animation: fadeInUp 0.5s ease-out {i * 60}ms both;"
        />
      {/each}
      <!-- Median line -->
      <line
        x1={medianPct}
        y1="0"
        x2={medianPct}
        y2="45"
        stroke="oklch(0.25 0.06 230)"
        stroke-width="0.5"
        stroke-dasharray="2 1"
      />
      <!-- Baseline -->
      <line x1="0" y1="45" x2="100" y2="45" stroke="oklch(0.25 0.06 230)" stroke-width="0.2" opacity="0.3"/>
    </svg>
    <div class="flex justify-between text-[10px] text-navy/30 mt-1">
      <span>{formatK(min)} &euro;</span>
      <span class="text-navy/50 font-medium">Mediane</span>
      <span>{formatK(max)} &euro;</span>
    </div>
  </div>
{/if}
