<script lang="ts">
  import { page } from '$app/stores';
  import type { CharacteristicsBreakdownItem } from '$lib/types';

  let { breakdown, coefficient }: {
    breakdown: CharacteristicsBreakdownItem[];
    coefficient: number;
  } = $props();

  const totalPct = $derived(Math.round((coefficient - 1) * 1000) / 10);

  const editUrl = $derived.by(() => {
    const params = new URLSearchParams($page.url.searchParams);
    return `/estimate/characteristics?${params.toString()}`;
  });

  const activeItems = $derived(breakdown.filter(item => {
    const pct = Math.round((item.coefficient - 1) * 1000) / 10;
    return pct !== 0;
  }));
</script>

<div class="bg-white/80 backdrop-blur-sm rounded-xl border border-navy/10 overflow-hidden">
  <div class="px-5 pt-4 pb-1">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" stroke-linecap="round"/>
        </svg>
        <span class="text-sm font-medium text-navy">Ajustement caractéristiques</span>
      </div>
      <span class="font-mono text-sm font-bold {totalPct > 0 ? 'text-emerald-600' : totalPct < 0 ? 'text-red-500' : 'text-navy/40'}">
        {totalPct > 0 ? '+' : ''}{totalPct} %
      </span>
    </div>
    <p class="text-xs text-navy/40 mb-3">Voici comment vos caractéristiques ajustent l'estimation</p>
  </div>

  <div class="px-5 pb-4 space-y-2">
    {#each activeItems as item}
      {@const pct = Math.round((item.coefficient - 1) * 1000) / 10}
      <div class="flex items-center justify-between text-sm transition-all duration-300">
        <span class="text-navy/60">{item.label} — <span class="text-navy/40">{item.value}</span></span>
        <div class="flex items-center gap-2">
          <div class="w-16 h-1.5 rounded-full bg-navy/5 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              style="width: {Math.min(Math.abs(pct) * 10, 100)}%; background: {pct > 0 ? 'oklch(0.58 0.14 155)' : 'oklch(0.65 0.18 30)'};"
            ></div>
          </div>
          <span class="font-mono text-xs font-medium w-12 text-right {pct > 0 ? 'text-emerald-600' : 'text-red-500'}">
            {pct > 0 ? '+' : ''}{pct} %
          </span>
        </div>
      </div>
    {/each}

    {#if activeItems.length === 0}
      <p class="text-xs text-navy/30 italic">Aucun ajustement actif</p>
    {/if}

    <!-- Total -->
    <div class="flex items-center justify-between text-sm pt-2 mt-1 border-t border-navy/10">
      <span class="font-medium text-navy">Impact total</span>
      <span class="font-mono text-sm font-bold {totalPct > 0 ? 'text-emerald-600' : totalPct < 0 ? 'text-red-500' : 'text-navy/40'}">
        {totalPct > 0 ? '+' : ''}{totalPct} %
      </span>
    </div>

    <!-- Edit link -->
    <a
      href={editUrl}
      class="inline-flex items-center gap-1 mt-1 text-xs text-sage hover:text-sage/80 transition-all duration-300 print:hidden"
    >
      <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Modifier mes caractéristiques
    </a>
  </div>
</div>
