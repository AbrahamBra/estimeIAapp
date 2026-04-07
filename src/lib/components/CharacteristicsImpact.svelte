<script lang="ts">
  import { page } from '$app/stores';
  import type { CharacteristicsBreakdownItem } from '$lib/types';

  let { breakdown, coefficient }: {
    breakdown: CharacteristicsBreakdownItem[];
    coefficient: number;
  } = $props();

  let expanded = $state(false);
  const totalPct = $derived(Math.round((coefficient - 1) * 1000) / 10);

  const editUrl = $derived.by(() => {
    const params = new URLSearchParams($page.url.searchParams);
    return `/estimate/characteristics?${params.toString()}`;
  });
</script>

<div class="bg-white rounded-xl border border-navy/10 overflow-hidden">
  <button
    type="button"
    class="w-full flex items-center justify-between px-5 py-3 text-sm hover:bg-navy/[0.02] transition"
    onclick={() => expanded = !expanded}
  >
    <span class="font-medium text-navy">Ajustement caracteristiques</span>
    <span class="flex items-center gap-2">
      <span class="font-bold {totalPct > 0 ? 'text-emerald-600' : totalPct < 0 ? 'text-red-500' : 'text-navy/40'}">
        {totalPct > 0 ? '+' : ''}{totalPct} %
      </span>
      <svg
        class="w-4 h-4 text-navy/30 transition-transform {expanded ? 'rotate-180' : ''}"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </button>

  {#if expanded}
    <div class="px-5 pb-4 space-y-1.5">
      {#each breakdown as item}
        {@const pct = Math.round((item.coefficient - 1) * 1000) / 10}
        {#if pct !== 0}
          <div class="flex items-center justify-between text-sm">
            <span class="text-navy/60">{item.label} — <span class="text-navy/40">{item.value}</span></span>
            <span class="font-medium {pct > 0 ? 'text-emerald-600' : 'text-red-500'}">
              {pct > 0 ? '+' : ''}{pct} %
            </span>
          </div>
        {/if}
      {/each}

      <!-- Total -->
      <div class="flex items-center justify-between text-sm pt-2 mt-2 border-t border-navy/10">
        <span class="font-medium text-navy">Total</span>
        <span class="font-bold {totalPct > 0 ? 'text-emerald-600' : totalPct < 0 ? 'text-red-500' : 'text-navy/40'}">
          {totalPct > 0 ? '+' : ''}{totalPct} %
        </span>
      </div>

      <!-- Edit link -->
      <a
        href={editUrl}
        class="inline-block mt-2 text-xs text-sage hover:underline print:hidden"
      >
        Modifier mes caracteristiques
      </a>
    </div>
  {/if}
</div>
