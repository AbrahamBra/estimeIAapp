<script lang="ts">
  import type { Comparable } from '$lib/types';

  let { comparable, isSelected = false, onClick }: {
    comparable: Comparable;
    isSelected?: boolean;
    onClick: () => void;
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
  class="w-full text-left p-4 rounded-lg border transition hover:shadow-md {isSelected ? 'border-sage bg-sage/5 shadow-md' : 'border-navy/10 bg-white'}"
  onclick={onClick}
>
  <p class="font-medium text-navy text-sm">{comparable.address}</p>
  <p class="text-xs text-navy/50 mt-0.5">{comparable.code_postal} {comparable.nom_commune}</p>

  <div class="flex items-baseline gap-3 mt-2">
    <span class="font-mono text-lg font-bold text-navy">{formatPrice(Math.round(comparable.prix_m2))} &euro;/m&sup2;</span>
    <span class="text-sm text-navy/50">{formatPrice(comparable.valeur_fonciere)} &euro;</span>
  </div>

  <div class="flex gap-3 mt-2 text-xs text-navy/40">
    <span>{comparable.surface} m&sup2;</span>
    {#if comparable.rooms}
      <span>{comparable.rooms} piece{comparable.rooms > 1 ? 's' : ''}</span>
    {/if}
    <span>{formatDate(comparable.date_mutation)}</span>
    <span>{comparable.distance < 1000 ? `${Math.round(comparable.distance)} m` : `${(comparable.distance / 1000).toFixed(1)} km`}</span>
  </div>
</button>
