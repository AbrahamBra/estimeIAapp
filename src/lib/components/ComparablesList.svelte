<script lang="ts">
  import type { Comparable } from '$lib/types';
  import ComparableCard from './ComparableCard.svelte';

  let { comparables, selectedId = null, onSelect }: {
    comparables: Comparable[];
    selectedId?: string | null;
    onSelect: (comparable: Comparable) => void;
  } = $props();

  type SortKey = 'distance' | 'prix_m2' | 'date';
  let sortBy: SortKey = $state('distance');

  let sorted = $derived.by(() => {
    const copy = [...comparables];
    switch (sortBy) {
      case 'distance': return copy.sort((a, b) => a.distance - b.distance);
      case 'prix_m2': return copy.sort((a, b) => a.prix_m2 - b.prix_m2);
      case 'date': return copy.sort((a, b) => b.date_mutation.localeCompare(a.date_mutation));
    }
  });

  // Compute price terciles for color coding (safe for 0-2 comparables)
  let terciles = $derived.by(() => {
    if (comparables.length < 2) return { t1: Infinity, t2: Infinity };
    const prices = comparables.map(c => c.prix_m2).sort((a, b) => a - b);
    return {
      t1: prices[Math.floor(prices.length / 3)] ?? prices[0],
      t2: prices[Math.floor(prices.length * 2 / 3)] ?? prices[prices.length - 1],
    };
  });

  function priceColor(prix_m2: number): string {
    if (prix_m2 <= terciles.t1) return '#4a9d6b';
    if (prix_m2 <= terciles.t2) return '#d4a029';
    return '#d45a5a';
  }

  $effect(() => {
    if (selectedId) {
      const el = document.querySelector(`[data-mutation-id="${selectedId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
</script>

<div>
  <div class="flex gap-2 mb-4">
    {#each [
      { key: 'distance', label: 'Distance' },
      { key: 'prix_m2', label: 'Prix/m\u00B2' },
      { key: 'date', label: 'Date' },
    ] as { key, label } (key)}
      <button
        type="button"
        class="text-xs px-3 py-1.5 rounded-full transition-all duration-200 {sortBy === key ? 'bg-navy text-white shadow-sm' : 'bg-navy/5 text-navy/50 hover:bg-navy/10'}"
        onclick={() => sortBy = key as SortKey}
      >
        {label}
      </button>
    {/each}
  </div>

  <div class="space-y-2 max-h-[600px] overflow-y-auto pr-1">
    {#each sorted as comparable, i (comparable.id_mutation)}
      <div
        data-mutation-id={comparable.id_mutation}
        style="animation: fadeInUp 0.4s ease-out {i * 50}ms both;"
      >
        <ComparableCard
          {comparable}
          isSelected={comparable.id_mutation === selectedId}
          priceColor={priceColor(comparable.prix_m2)}
          onClick={() => onSelect(comparable)}
        />
      </div>
    {/each}
  </div>
</div>
