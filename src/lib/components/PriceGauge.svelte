<script lang="ts">
  import { onMount } from 'svelte';
  import type { PriceEstimation } from '$lib/types';
  import AnimatedNumber from './AnimatedNumber.svelte';

  let { estimation, surfaceM2 }: { estimation: PriceEstimation; surfaceM2: number | null } = $props();

  let markerPosition = $state(0);
  let mounted = $state(false);

  const range = estimation.high_per_m2 - estimation.low_per_m2;
  // Guard: if low === high (single comparable or identical prices), create artificial spread
  const safeRange = range > 0 ? range : estimation.median_per_m2 * 0.1 || 1;
  const padding = safeRange * 0.15;
  const displayMin = Math.max(0, estimation.low_per_m2 - padding);
  const displayMax = estimation.high_per_m2 + padding;
  const displayRange = displayMax - displayMin || 1; // final safety: never zero

  function toPercent(val: number): number {
    return ((val - displayMin) / displayRange) * 100;
  }

  const lowPct = toPercent(estimation.low_per_m2);
  const medPct = toPercent(estimation.median_per_m2);
  const highPct = toPercent(estimation.high_per_m2);

  onMount(() => {
    requestAnimationFrame(() => {
      markerPosition = medPct;
      mounted = true;
    });
  });

  function formatPrice(n: number): string {
    return n.toLocaleString('fr-FR');
  }
</script>

<div class="bg-white rounded-2xl border border-navy/10 p-6 shadow-sm">
  <!-- Total price hero -->
  {#if estimation.median_total != null && surfaceM2}
    <div class="text-center mb-6">
      <p class="text-sm text-navy/40 mb-1">Estimation pour {surfaceM2} m&sup2;</p>
      <p class="font-mono text-4xl font-bold text-navy">
        <AnimatedNumber value={estimation.median_total} suffix=" &euro;" />
      </p>
      <p class="text-sm text-navy/40 mt-1">
        {formatPrice(estimation.low_total!)} &ndash; {formatPrice(estimation.high_total!)} &euro;
      </p>
    </div>
  {/if}

  <!-- Price per m² section -->
  <div class="text-center mb-4">
    {#if !surfaceM2}
      <p class="text-sm text-navy/40 mb-1">Prix au m&sup2;</p>
    {/if}
    <p class="font-mono text-2xl font-bold text-navy">
      <AnimatedNumber value={estimation.median_per_m2} suffix=" &euro;/m&sup2;" />
    </p>
  </div>

  <!-- Gauge bar -->
  <div class="relative mt-4 mb-8 mx-4">
    <!-- Track background -->
    <div class="h-3 rounded-full bg-navy-light relative overflow-hidden">
      <!-- Active range gradient -->
      <div
        class="absolute h-full rounded-full transition-all duration-1000 ease-out"
        style="left: {lowPct}%; width: {highPct - lowPct}%; background: linear-gradient(90deg, oklch(0.58 0.14 155), oklch(0.75 0.15 75), oklch(0.65 0.18 30));"
        style:transform={mounted ? 'scaleX(1)' : 'scaleX(0)'}
        style:transform-origin="left"
      ></div>
    </div>

    <!-- Median marker -->
    <div
      class="absolute -top-1 w-5 h-5 rounded-full bg-navy border-3 border-white shadow-lg transition-all duration-1000 ease-out"
      style="left: {mounted ? markerPosition : 50}%; transform: translateX(-50%);"
    ></div>

    <!-- Labels -->
    <div class="flex justify-between mt-3 text-xs text-navy/40">
      <span>{formatPrice(estimation.low_per_m2)} &euro;/m&sup2;</span>
      <span>{formatPrice(estimation.high_per_m2)} &euro;/m&sup2;</span>
    </div>
  </div>

  <!-- Bottom info -->
  <div class="flex items-center justify-center gap-4 text-xs text-navy/30">
    <span>{estimation.comparable_count} vente{estimation.comparable_count > 1 ? 's' : ''} comparable{estimation.comparable_count > 1 ? 's' : ''}</span>
    {#if !surfaceM2}
      <span class="text-sage italic">Ajoutez la surface pour un prix total</span>
    {/if}
  </div>
</div>
