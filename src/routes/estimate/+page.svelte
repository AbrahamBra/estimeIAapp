<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import PriceGauge from '$lib/components/PriceGauge.svelte';
  import ConfidenceMeter from '$lib/components/ConfidenceMeter.svelte';
  import PriceDistribution from '$lib/components/PriceDistribution.svelte';
  import PriceTrend from '$lib/components/PriceTrend.svelte';
  import ComparablesList from '$lib/components/ComparablesList.svelte';
  import ProximityBadges from '$lib/components/ProximityBadges.svelte';
  import DpeBadge from '$lib/components/DpeBadge.svelte';
  import RiskBadges from '$lib/components/RiskBadges.svelte';
  import Map from '$lib/components/Map.svelte';
  import { computePriceRange } from '$lib/utils/estimation';
  import type { Comparable } from '$lib/types';

  let { data } = $props();
  let selectedComparable: Comparable | null = $state(null);
  let mounted = $state(false);
  let excludeCovid = $state(false);

  onMount(() => { mounted = true; });

  const radiusOptions = [500, 1000, 2000];

  const covidCount = $derived(data.comparables.filter(c => c.covid_period).length);

  const filteredComparables = $derived(
    excludeCovid ? data.comparables.filter(c => !c.covid_period) : data.comparables
  );

  const filteredEstimation = $derived(
    excludeCovid && filteredComparables.length > 0
      ? computePriceRange(
          filteredComparables.map(c => ({ prix_m2: c.prix_m2, date_mutation: c.date_mutation, distance: c.distance })),
          data.surfaceM2
        )
      : data.estimation
  );

  function changeRadius(newRadius: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('radius', String(newRadius));
    goto(`/estimate?${params.toString()}`);
  }

  function handlePrint() {
    window.print();
  }
</script>

<div class="max-w-6xl mx-auto px-6 py-8">
  <!-- Header -->
  <div class="flex items-start justify-between mb-8">
    <div>
      <h1 class="font-display text-2xl font-bold text-navy">{data.address}</h1>
      <p class="text-navy/50 text-sm mt-1">
        {data.propertyType}
        {#if data.surfaceM2} &middot; {data.surfaceM2} m&sup2;{/if}
      </p>
      <div class="flex gap-2 mt-2 print:hidden">
        {#each radiusOptions as r}
          <button
            type="button"
            class="text-xs px-3 py-1 rounded-full transition {data.radiusM === r ? 'bg-navy text-white' : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}"
            onclick={() => changeRadius(r)}
          >
            {r >= 1000 ? `${r / 1000} km` : `${r} m`}
          </button>
        {/each}
      </div>
    </div>
    <div class="flex items-center gap-3 print:hidden">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm text-navy/50 hover:text-navy bg-navy/5 hover:bg-navy/10 px-3 py-1.5 rounded-lg transition"
        onclick={handlePrint}
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="6" y="14" width="12" height="8" rx="1"/>
        </svg>
        Rapport
      </button>
      <a href="/" class="text-sm text-sage hover:underline">Nouvelle estimation</a>
    </div>
  </div>

  <!-- Print header (hidden on screen) -->
  <div class="hidden print:block mb-6 pb-4 border-b border-navy/10">
    <div class="flex justify-between items-center">
      <p class="text-sm text-navy/40">EstimeIA — Rapport d'estimation</p>
      <p class="text-sm text-navy/40">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
  </div>

  {#if data.isAlsaceMoselle}
    <div class="bg-orange-50 text-orange-700 text-sm px-4 py-3 rounded-lg mb-6">
      Donnees DVF potentiellement incompletes pour ce departement.
    </div>
  {/if}

  {#if data.dvfError}
    <div class="text-center py-20">
      <p class="text-xl text-navy/60">Service temporairement indisponible.</p>
      <p class="text-navy/40 mt-2">Reessayez dans quelques instants.</p>
      <a href="/" class="inline-block mt-6 text-sage hover:underline">Nouvelle estimation</a>
    </div>
  {:else if filteredEstimation}
    <!-- Covid toggle -->
    {#if covidCount > 0}
      <div class="flex items-center gap-3 mb-4 print:hidden">
        <label class="inline-flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" bind:checked={excludeCovid} class="rounded border-navy/20 text-sage focus:ring-sage" />
          <span class="text-navy/50">
            Exclure les {covidCount} vente{covidCount > 1 ? 's' : ''} en periode Covid
            <span class="text-navy/30">(mars 2020 – juin 2021)</span>
          </span>
        </label>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
      <!-- Left column: Hero + Map + Charts -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Price gauge hero -->
        <PriceGauge estimation={filteredEstimation} surfaceM2={data.surfaceM2} />

        <!-- Confidence meter -->
        <div class="bg-white rounded-xl border border-navy/10 p-4">
          <p class="text-xs font-medium text-navy/50 mb-2">Fiabilite de l'estimation</p>
          <ConfidenceMeter
            score={filteredEstimation.confidence_score}
            factors={filteredEstimation.confidence_factors}
          />
        </div>

        <!-- Map -->
        {#if mounted}
          <div class="print:hidden">
            <Map
              lat={data.lat}
              lon={data.lon}
              radiusM={data.radiusM}
              comparables={filteredComparables}
              selectedId={selectedComparable?.id_mutation}
              onSelectComparable={(c) => selectedComparable = c}
            />
          </div>
        {/if}

        <!-- Charts row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
          <PriceDistribution comparables={filteredComparables} medianPrixM2={filteredEstimation.median_per_m2} />
          <PriceTrend trend={data.trend} />
        </div>

        <!-- DPE + Risks -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2">
          {#if data.dpe}
            <DpeBadge dpe={data.dpe} />
          {/if}
          {#if data.risks}
            <RiskBadges risks={data.risks} />
          {/if}
        </div>

        <!-- Proximity -->
        <ProximityBadges proximity={data.proximity} />
      </div>

      <!-- Right column: Comparables list -->
      <div class="print:mt-8">
        <h2 class="font-display text-lg font-bold text-navy mb-4">
          {filteredComparables.length} vente{filteredComparables.length > 1 ? 's' : ''} comparable{filteredComparables.length > 1 ? 's' : ''}
          {#if excludeCovid && covidCount > 0}
            <span class="text-xs font-normal text-navy/30">({covidCount} exclue{covidCount > 1 ? 's' : ''})</span>
          {/if}
        </h2>
        <ComparablesList
          comparables={filteredComparables}
          selectedId={selectedComparable?.id_mutation}
          onSelect={(c) => selectedComparable = c}
        />
      </div>
    </div>

    <!-- Print footer -->
    <div class="hidden print:block mt-8 pt-4 border-t border-navy/10">
      <p class="text-xs text-navy/30 text-center">
        Rapport genere par EstimeIA le {new Date().toLocaleDateString('fr-FR')} — Donnees DVF (DGFiP), DPE (ADEME), Risques (Georisques)
      </p>
    </div>
  {:else}
    <div class="text-center py-20">
      <p class="text-xl text-navy/60">Aucune vente trouvee dans ce secteur.</p>
      <p class="text-navy/40 mt-2">Essayez un rayon plus large ou un autre type de bien.</p>
      <a href="/" class="inline-block mt-6 text-sage hover:underline">Nouvelle estimation</a>
    </div>
  {/if}
</div>
