<script lang="ts">
  import type { CommuneContext } from '$lib/types';

  let { commune }: { commune: CommuneContext } = $props();

  function formatNumber(n: number): string {
    return n.toLocaleString('fr-FR');
  }

  interface InfoItem {
    label: string;
    value: string;
    icon: string;
    color: string;
    detail: string | null;
  }

  const items: InfoItem[] = $derived.by(() => {
    const result: InfoItem[] = [];

    if (commune.population != null) {
      result.push({
        label: 'Population',
        value: formatNumber(commune.population),
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        color: 'oklch(0.55 0.12 250)',
        detail: commune.density != null ? `${formatNumber(commune.density)} hab/km²` : null,
      });
    }

    if (commune.taxe_fonciere != null) {
      result.push({
        label: 'Taxe foncière',
        value: `${commune.taxe_fonciere.toFixed(2)} %`,
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        color: 'oklch(0.55 0.14 30)',
        detail: commune.teom != null ? `dont TEOM ${commune.teom.toFixed(2)} %` : null,
      });
    }

    if (commune.water_quality != null) {
      const isOk = commune.water_quality === 'conforme';
      result.push({
        label: 'Eau potable',
        value: isOk ? 'Conforme' : 'Non conforme',
        icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
        color: isOk ? 'oklch(0.58 0.14 155)' : 'oklch(0.65 0.18 30)',
        detail: commune.water_conform_pct != null ? `${commune.water_conform_pct}% conforme` : null,
      });
    }

    return result;
  });

  const hasData = $derived(items.length > 0);
</script>

{#if hasData}
  <div class="bg-white rounded-xl border border-navy/10 p-5">
    <p class="text-xs font-medium text-navy/50 mb-3">Contexte communal</p>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {#each items as item}
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: {item.color}15;">
            <svg class="w-4 h-4" style="color: {item.color}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d={item.icon} />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-xs text-navy/40">{item.label}</p>
            <p class="text-sm font-semibold text-navy">{item.value}</p>
            {#if item.detail}
              <p class="text-xs text-navy/30 mt-0.5">{item.detail}</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
    <p class="text-[10px] text-navy/20 mt-3">Sources : INSEE, DGFiP, Hub'Eau</p>
  </div>
{/if}
