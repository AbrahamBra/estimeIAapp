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
        class="text-xs px-3 py-1.5 rounded-full transition {sortBy === key ? 'bg-navy text-white' : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}"
        onclick={() => sortBy = key as SortKey}
      >
        {label}
      </button>
    {/each}
  </div>

  <div class="space-y-2 max-h-[600px] overflow-y-auto">
    {#each sorted as comparable (comparable.id_mutation)}
      <div data-mutation-id={comparable.id_mutation}>
        <ComparableCard
          {comparable}
          isSelected={comparable.id_mutation === selectedId}
          onClick={() => onSelect(comparable)}
        />
      </div>
    {/each}
  </div>
</div>
