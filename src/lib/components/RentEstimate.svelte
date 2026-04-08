<script lang="ts">
  import type { RentEstimate } from '$lib/types';

  let { rent }: { rent: RentEstimate } = $props();

  const yieldColor = rent.rendement_brut != null
    ? rent.rendement_brut >= 8 ? 'oklch(0.45 0.16 155)'
    : rent.rendement_brut >= 5 ? 'oklch(0.58 0.14 155)'
    : rent.rendement_brut >= 3 ? 'oklch(0.75 0.15 75)'
    : 'oklch(0.65 0.18 30)'
    : 'oklch(0.55 0.05 250)';

  const yieldLabel = rent.rendement_brut != null
    ? rent.rendement_brut >= 8 ? 'Excellent'
    : rent.rendement_brut >= 5 ? 'Bon'
    : rent.rendement_brut >= 3 ? 'Correct'
    : 'Faible'
    : '';

  const fiabiliteLabel = rent.fiabilite === 'tres_fiable' ? 'Très fiable'
    : rent.fiabilite === 'fiable' ? 'Fiable'
    : 'Indicatif';
</script>

<div class="bg-white rounded-xl border border-navy/10 p-5">
  <p class="text-xs font-medium text-navy/50 mb-3">Rendement locatif estimé</p>

  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <!-- Loyer/m² -->
    <div class="flex items-start gap-3">
      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: oklch(0.55 0.12 250 / 0.1);">
        <svg class="w-4 h-4" style="color: oklch(0.55 0.12 250);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <div class="min-w-0">
        <p class="text-xs text-navy/40">Loyer estimé</p>
        <p class="text-sm font-semibold text-navy">{rent.loyer_m2} €/m²/mois</p>
        <p class="text-xs text-navy/30 mt-0.5">{rent.loyer_m2_low} — {rent.loyer_m2_high} €/m²</p>
      </div>
    </div>

    <!-- Loyer mensuel -->
    {#if rent.loyer_mensuel}
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: oklch(0.55 0.14 30 / 0.1);">
          <svg class="w-4 h-4" style="color: oklch(0.55 0.14 30);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-navy/40">Loyer mensuel</p>
          <p class="text-sm font-semibold text-navy">{rent.loyer_mensuel.toLocaleString('fr-FR')} €/mois</p>
        </div>
      </div>
    {/if}

    <!-- Rendement brut -->
    {#if rent.rendement_brut != null}
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: {yieldColor}15;">
          <svg class="w-4 h-4" style="color: {yieldColor};" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
          </svg>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-navy/40">Rendement brut</p>
          <p class="text-sm font-semibold" style="color: {yieldColor};">{rent.rendement_brut} %</p>
          <p class="text-xs text-navy/30 mt-0.5">{yieldLabel}</p>
        </div>
      </div>
    {/if}
  </div>

  <div class="flex items-center justify-between mt-3">
    <p class="text-[10px] text-navy/20">Source : Carte des loyers 2025 — Min. Transition écologique</p>
    <p class="text-[10px] text-navy/20">{fiabiliteLabel} ({rent.source_annonces.toLocaleString('fr-FR')} annonces)</p>
  </div>
</div>
