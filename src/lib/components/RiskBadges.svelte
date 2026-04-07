<script lang="ts">
  import type { RiskResult } from '$lib/types';

  let { risks }: { risks: RiskResult } = $props();

  let expanded = $state(false);

  const riskIcons: Record<string, string> = {
    'Inondation': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14l-4-4h3V8h2v4h3l-4 4z',
    'Transport de marchandises dangereuses': 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
    'Sécheresse': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM6.5 9L10 5.5 13.5 9H6.5zm11 6L14 18.5 10.5 15h7z',
  };

  const defaultIcon = 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z';

  const riskLevel = risks.risks.length === 0 ? 'low' : risks.risks.length <= 2 ? 'moderate' : 'elevated';
  const levelColor = riskLevel === 'low' ? 'oklch(0.58 0.14 155)' : riskLevel === 'moderate' ? 'oklch(0.75 0.15 75)' : 'oklch(0.65 0.18 30)';
  const levelLabel = riskLevel === 'low' ? 'Faible' : riskLevel === 'moderate' ? 'Modéré' : 'Élevé';

  // Top catnat types sorted by count
  const topCatnat = Object.entries(risks.catnat_types)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
</script>

<button
  type="button"
  class="w-full text-left bg-white rounded-xl border border-navy/10 p-4 hover:border-navy/20 transition"
  onclick={() => expanded = !expanded}
>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-xs font-medium text-navy/50">Risques</span>
      <span
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
        style="background: {levelColor};"
      >
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="{defaultIcon}"/>
        </svg>
        {levelLabel}
      </span>
      <span class="text-xs text-navy/40">{risks.risks.length} risque{risks.risks.length > 1 ? 's' : ''} identifiés</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-xs text-navy/30">{risks.catnat_count} CatNat</span>
      <svg class="w-3 h-3 text-navy/30 transition-transform {expanded ? 'rotate-180' : ''}" viewBox="0 0 12 12">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </svg>
    </div>
  </div>

  {#if expanded}
    <div class="mt-4 space-y-3" style="animation: fadeInUp 0.3s ease-out;">
      <!-- Risk list -->
      {#if risks.risks.length > 0}
        <div>
          <p class="text-xs text-navy/40 mb-2">Risques naturels et technologiques</p>
          <div class="flex flex-wrap gap-2">
            {#each risks.risks as risk}
              <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-navy/5 text-navy/60">
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="{riskIcons[risk] || defaultIcon}"/>
                </svg>
                {risk}
              </span>
            {/each}
          </div>
        </div>
      {:else}
        <p class="text-xs text-navy/40">Aucun risque naturel ou technologique identifié sur cette commune.</p>
      {/if}

      <!-- Catnat history -->
      {#if topCatnat.length > 0}
        <div>
          <p class="text-xs text-navy/40 mb-2">Historique catastrophes naturelles ({risks.catnat_count} arrêtés)</p>
          <div class="space-y-1">
            {#each topCatnat as [type, count]}
              <div class="flex items-center gap-2">
                <div class="flex-1 h-1.5 rounded-full bg-navy/5 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    style="width: {(count / risks.catnat_count) * 100}%; background: {levelColor};"
                  ></div>
                </div>
                <span class="text-[10px] text-navy/40 w-6 text-right">{count}</span>
                <span class="text-[10px] text-navy/50 truncate max-w-[180px]">{type}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <p class="text-[10px] text-navy/20">Source : Géorisques (BRGM) — base GASPAR</p>
    </div>
  {/if}
</button>
