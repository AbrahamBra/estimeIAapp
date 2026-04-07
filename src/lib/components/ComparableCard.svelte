<script lang="ts">
  import type { Comparable } from '$lib/types';

  let { comparable, isSelected = false, onClick, priceColor = '#1a2744' }: {
    comparable: Comparable;
    isSelected?: boolean;
    onClick: () => void;
    priceColor?: string;
  } = $props();

  function formatPrice(n: number): string {
    return n.toLocaleString('fr-FR');
  }

  function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  }
</script>

<button
  type="button"
  class="w-full text-left p-4 rounded-xl border-l-4 border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 {isSelected ? 'bg-sage/5 shadow-md border-r border-t border-b border-r-sage/20 border-t-sage/20 border-b-sage/20' : 'bg-white border-r border-t border-b border-r-navy/10 border-t-navy/10 border-b-navy/10'}"
  style="border-left-color: {priceColor}"
  onclick={onClick}
>
  <div class="flex items-start justify-between">
    <div class="flex-1 min-w-0">
      <p class="font-medium text-navy text-sm truncate">{comparable.address}</p>
      <p class="text-xs text-navy/40 mt-0.5">{comparable.code_postal} {comparable.nom_commune}</p>
    </div>
    <div class="ml-3 flex items-center gap-1.5">
      {#if comparable.covid_period}
        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber/15 text-amber" title="Vente en période Covid (mars 2020 - juin 2021)">Covid</span>
      {/if}
      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/5 text-navy/50">
        {formatDate(comparable.date_mutation)}
      </span>
    </div>
  </div>

  <div class="flex items-baseline gap-3 mt-2.5">
    <span class="font-mono text-lg font-bold" style="color: {priceColor}">{formatPrice(Math.round(comparable.prix_m2))} &euro;/m&sup2;</span>
    <span class="text-sm text-navy/40">{formatPrice(comparable.valeur_fonciere)} &euro;</span>
  </div>

  <div class="flex gap-3 mt-2 text-xs text-navy/35">
    <span>{comparable.surface} m&sup2;</span>
    {#if comparable.rooms}
      <span>{comparable.rooms} pi&egrave;ce{comparable.rooms > 1 ? 's' : ''}</span>
    {/if}
    <span>{comparable.distance < 1000 ? `${Math.round(comparable.distance)} m` : `${(comparable.distance / 1000).toFixed(1)} km`}</span>
  </div>
</button>
