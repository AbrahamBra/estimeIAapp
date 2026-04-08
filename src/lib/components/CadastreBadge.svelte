<script lang="ts">
  import type { CadastreResult } from '$lib/types';

  let { cadastre, surfaceM2 = null }: { cadastre: CadastreResult; surfaceM2?: number | null } = $props();

  const ratio = surfaceM2 && surfaceM2 > 0 && cadastre.surface_terrain > 0
    ? Math.round((cadastre.surface_terrain / surfaceM2) * 10) / 10
    : null;
</script>

<div class="bg-white rounded-xl border border-navy/10 p-5">
  <p class="text-xs font-medium text-navy/50 mb-3">Données cadastrales</p>

  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="flex items-start gap-3">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: oklch(0.55 0.12 250 / 0.1);">
        <svg class="w-4 h-4" style="color: oklch(0.55 0.12 250);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M9 3v18"/>
        </svg>
      </div>
      <div class="min-w-0">
        <p class="text-xs text-navy/40">Parcelle</p>
        <p class="text-sm font-semibold text-navy">{cadastre.reference}</p>
      </div>
    </div>

    <div class="flex items-start gap-3">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: oklch(0.58 0.14 155 / 0.1);">
        <svg class="w-4 h-4" style="color: oklch(0.58 0.14 155);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
        </svg>
      </div>
      <div class="min-w-0">
        <p class="text-xs text-navy/40">Surface terrain</p>
        <p class="text-sm font-semibold text-navy">{cadastre.surface_terrain.toLocaleString('fr-FR')} m²</p>
      </div>
    </div>

    {#if ratio}
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: oklch(0.75 0.15 75 / 0.1);">
          <svg class="w-4 h-4" style="color: oklch(0.75 0.15 75);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-navy/40">Ratio terrain/bâti</p>
          <p class="text-sm font-semibold text-navy">{ratio}x</p>
        </div>
      </div>
    {/if}
  </div>

  <p class="text-[10px] text-navy/20 mt-3">Source : Cadastre — IGN/DGFiP</p>
</div>
