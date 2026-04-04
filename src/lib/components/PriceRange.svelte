<script lang="ts">
  import type { PriceEstimation } from '$lib/types';

  let { estimation, surfaceM2 }: { estimation: PriceEstimation; surfaceM2: number | null } = $props();

  function formatPrice(n: number): string {
    return n.toLocaleString('fr-FR');
  }
</script>

<div class="bg-white rounded-xl border border-navy/10 p-6">
  <div class="text-center">
    <p class="text-sm text-navy/50 mb-1">Estimation {estimation.confidence === 'low' ? '(peu fiable)' : ''}</p>
    <p class="font-mono text-3xl font-bold text-navy">
      {formatPrice(estimation.median_per_m2)} &euro;/m&sup2;
    </p>
    <p class="text-sm text-navy/50 mt-1">
      {formatPrice(estimation.low_per_m2)} &ndash; {formatPrice(estimation.high_per_m2)} &euro;/m&sup2;
    </p>

    {#if estimation.median_total != null && surfaceM2}
      <div class="mt-4 pt-4 border-t border-navy/10">
        <p class="font-mono text-2xl font-bold text-sage">
          {formatPrice(estimation.median_total)} &euro;
        </p>
        <p class="text-sm text-navy/50">
          {formatPrice(estimation.low_total!)} &ndash; {formatPrice(estimation.high_total!)} &euro; pour {surfaceM2} m&sup2;
        </p>
      </div>
    {:else}
      <p class="mt-4 text-sm text-sage italic">
        Ajoutez la surface pour obtenir une estimation en euros.
      </p>
    {/if}

    <p class="mt-3 text-xs text-navy/30">
      Base sur {estimation.comparable_count} vente{estimation.comparable_count > 1 ? 's' : ''} comparable{estimation.comparable_count > 1 ? 's' : ''}
    </p>

    {#if estimation.confidence === 'low'}
      <p class="mt-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-1.5 inline-block">
        Estimation peu fiable (moins de 3 ventes)
      </p>
    {/if}
  </div>
</div>
