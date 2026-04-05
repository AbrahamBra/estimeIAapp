<script lang="ts">
  import type { DpeResult, DpeClass } from '$lib/types';

  let { dpe }: { dpe: DpeResult } = $props();

  let expanded = $state(false);

  const dpeColors: Record<DpeClass, string> = {
    A: '#319834',
    B: '#33cc31',
    C: '#cbfc34',
    D: '#fcfc00',
    E: '#fccc00',
    F: '#fc9834',
    G: '#fc0000',
  };

  const gesColors: Record<DpeClass, string> = {
    A: '#f2e6ff',
    B: '#ddb3ff',
    C: '#c480ff',
    D: '#ab4dff',
    E: '#921aff',
    F: '#6600cc',
    G: '#3d007a',
  };

  const classes: DpeClass[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const totalDiags = Object.values(dpe.distribution).reduce((a, b) => a + b, 0);
</script>

<button
  type="button"
  class="w-full text-left bg-white rounded-xl border border-navy/10 p-4 hover:border-navy/20 transition"
  onclick={() => expanded = !expanded}
>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-xs font-medium text-navy/50">DPE quartier</span>
      <!-- Dominant DPE badge -->
      <span
        class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-white shadow-sm"
        style="background: {dpeColors[dpe.dominant_dpe]};"
      >
        {dpe.dominant_dpe}
      </span>
      {#if dpe.avg_conso_m2}
        <span class="text-xs text-navy/40">{dpe.avg_conso_m2} kWh/m&sup2;/an</span>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      <!-- GES badge -->
      <span class="text-xs text-navy/40">GES</span>
      <span
        class="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold shadow-sm"
        style="background: {gesColors[dpe.dominant_ges]}; color: {['A','B','C'].includes(dpe.dominant_ges) ? '#333' : '#fff'};"
      >
        {dpe.dominant_ges}
      </span>
      <svg class="w-3 h-3 text-navy/30 transition-transform {expanded ? 'rotate-180' : ''}" viewBox="0 0 12 12">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      </svg>
    </div>
  </div>

  {#if expanded}
    <div class="mt-4 space-y-2" style="animation: fadeInUp 0.3s ease-out;">
      <p class="text-xs text-navy/40 mb-2">Distribution DPE ({dpe.count} diagnostics a proximite)</p>
      <!-- DPE distribution bar -->
      <div class="flex gap-0.5 h-5 rounded overflow-hidden">
        {#each classes as cls}
          {@const count = dpe.distribution[cls] || 0}
          {@const pct = totalDiags > 0 ? (count / totalDiags) * 100 : 0}
          {#if pct > 0}
            <div
              class="flex items-center justify-center text-[10px] font-bold text-white transition-all"
              style="width: {Math.max(pct, 8)}%; background: {dpeColors[cls]};"
              title="{cls}: {count}"
            >
              {#if pct > 12}{cls}{/if}
            </div>
          {/if}
        {/each}
      </div>
      <!-- Legend -->
      <div class="flex justify-between text-[10px] text-navy/30 mt-1">
        {#each classes as cls}
          {@const count = dpe.distribution[cls] || 0}
          <span class="text-center" style="color: {count > 0 ? dpeColors[cls] : ''}; font-weight: {count > 0 ? '600' : '400'};">
            {cls}{#if count > 0} ({count}){/if}
          </span>
        {/each}
      </div>
      {#if dpe.avg_ges_m2}
        <p class="text-xs text-navy/30 mt-2">Emissions moyennes : {dpe.avg_ges_m2} kgCO&sup2;/m&sup2;/an</p>
      {/if}
      <p class="text-[10px] text-navy/20 mt-1">Source : ADEME — DPE depuis juillet 2021</p>
    </div>
  {/if}
</button>
