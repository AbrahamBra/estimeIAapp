<script lang="ts">
  let expanded = $state(false);
</script>

<div class="bg-navy/[0.02] rounded-xl border border-navy/5 px-4 py-3">
  <button
    type="button"
    class="w-full flex items-center gap-2 text-left"
    onclick={() => expanded = !expanded}
  >
    <svg class="w-3.5 h-3.5 text-navy/30 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
    </svg>
    <span class="text-[11px] text-navy/40 leading-tight">
      Estimation indicative — ne constitue pas un avis de valeur
    </span>
    <svg class="w-3 h-3 text-navy/20 ml-auto shrink-0 transition-transform {expanded ? 'rotate-180' : ''}" viewBox="0 0 12 12">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>
  </button>

  {#if expanded}
    <div class="mt-2 text-[10px] text-navy/30 leading-relaxed space-y-1.5" style="animation: fadeInUp 0.2s ease-out;">
      <p>
        Cette estimation est produite automatiquement à partir des données de ventes
        publiées par la DGFiP (DVF). Elle repose sur une analyse statistique de
        transactions comparables et ne prend pas en compte les spécificités
        individuelles du bien (état intérieur, travaux, vue exacte, etc.).
      </p>
      <p>
        <strong class="text-navy/40">Cette estimation ne constitue pas un avis de valeur</strong> au sens
        de la Charte de l'Expertise en Évaluation Immobilière. Pour une évaluation
        engageant la responsabilité d'un professionnel, consultez un agent immobilier
        ou un expert agréé.
      </p>
      <p>
        Sources : DVF (DGFiP), DPE (ADEME), Géorisques, BPE (INSEE), Carte des Loyers,
        SITADEL, Cadastre (IGN), GPU (IGN), RNIC. Données mises à jour semestriellement.
      </p>
    </div>
  {/if}
</div>
