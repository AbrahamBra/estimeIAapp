<script lang="ts">
  import type { PermitsResult } from '$lib/types';

  let { permits }: { permits: PermitsResult } = $props();

  let expanded = $state(false);

  const pressionColor = permits.pression === 'faible' ? 'oklch(0.58 0.14 155)'
    : permits.pression === 'moyenne' ? 'oklch(0.75 0.15 75)'
    : 'oklch(0.65 0.18 30)';

  const pressionLabel = permits.pression === 'faible' ? 'Faible'
    : permits.pression === 'moyenne' ? 'Moyenne'
    : 'Forte';

  const typeLabels: Record<string, string> = {
    PC: 'Permis de construire',
    DP: 'Déclaration préalable',
  };
</script>

<button
  type="button"
  class="w-full text-left bg-white rounded-xl border border-navy/10 p-4 hover:border-navy/20 transition"
  onclick={() => expanded = !expanded}
>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-xs font-medium text-navy/50">Permis de construire</span>
      <span
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
        style="background: {pressionColor};"
      >
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
        {pressionLabel}
      </span>
      <span class="text-xs text-navy/40">{permits.total_permits} permis — {permits.total_logements} logement{permits.total_logements > 1 ? 's' : ''}</span>
    </div>
    <svg class="w-3 h-3 text-navy/30 transition-transform {expanded ? 'rotate-180' : ''}" viewBox="0 0 12 12">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>
  </div>

  {#if expanded}
    <div class="mt-4 space-y-3" style="animation: fadeInUp 0.3s ease-out;">
      <!-- Répartition individuel/collectif -->
      <div>
        <p class="text-xs text-navy/40 mb-2">Répartition des logements autorisés</p>
        <div class="flex items-center gap-2">
          <div class="flex-1 h-2 rounded-full bg-navy/5 overflow-hidden">
            <div class="h-full rounded-full flex">
              {#if permits.individual_pct > 0}
                <div class="h-full" style="width: {permits.individual_pct}%; background: oklch(0.58 0.14 155);"></div>
              {/if}
              {#if permits.collective_pct > 0}
                <div class="h-full" style="width: {permits.collective_pct}%; background: oklch(0.55 0.12 250);"></div>
              {/if}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-4 mt-1">
          <span class="inline-flex items-center gap-1 text-[10px] text-navy/40">
            <span class="w-2 h-2 rounded-sm" style="background: oklch(0.58 0.14 155);"></span>
            Individuel {permits.individual_pct}%
          </span>
          <span class="inline-flex items-center gap-1 text-[10px] text-navy/40">
            <span class="w-2 h-2 rounded-sm" style="background: oklch(0.55 0.12 250);"></span>
            Collectif {permits.collective_pct}%
          </span>
        </div>
      </div>

      <!-- Derniers permis -->
      {#if permits.permits.length > 0}
        <div>
          <p class="text-xs text-navy/40 mb-2">Derniers permis autorisés</p>
          <div class="space-y-1.5">
            {#each permits.permits as permit}
              <div class="flex items-center gap-2 text-xs">
                <span class="text-navy/30 w-20 shrink-0">
                  {new Date(permit.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                </span>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                  style="background: {permit.type_dau === 'PC' ? 'oklch(0.55 0.12 250 / 0.1)' : 'oklch(0.75 0.15 75 / 0.15)'}; color: {permit.type_dau === 'PC' ? 'oklch(0.55 0.12 250)' : 'oklch(0.65 0.12 75)'};">
                  {permit.type_dau}
                </span>
                <span class="text-navy/50 truncate">{permit.nb_logements} lgt{permit.nb_logements > 1 ? 's' : ''}</span>
                {#if permit.surface_hab > 0}
                  <span class="text-navy/30 shrink-0">{permit.surface_hab} m²</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <p class="text-[10px] text-navy/20">Source : SITADEL — SDES (Min. Transition écologique) — 2 dernières années sur la commune</p>
    </div>
  {/if}
</button>
