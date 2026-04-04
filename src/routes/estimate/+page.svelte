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
  import Map from '$lib/components/Map.svelte';
  import type { Comparable } from '$lib/types';

  let { data } = $props();
  let selectedComparable: Comparable | null = $state(null);
  let mounted = $state(false);

  onMount(() => { mounted = true; });

  const radiusOptions = [500, 1000, 2000];

  function changeRadius(newRadius: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('radius', String(newRadius));
    goto(`/estimate?${params.toString()}`);
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
      <div class="flex gap-2 mt-2">
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
    <a href="/" class="text-sm text-sage hover:underline">Nouvelle estimation</a>
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
  {:else if data.estimation}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left column: Hero + Map + Charts -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Price gauge hero -->
        <PriceGauge estimation={data.estimation} surfaceM2={data.surfaceM2} />

        <!-- Confidence meter -->
        <div class="bg-white rounded-xl border border-navy/10 p-4">
          <p class="text-xs font-medium text-navy/50 mb-2">Fiabilite de l'estimation</p>
          <ConfidenceMeter
            score={data.estimation.confidence_score}
            factors={data.estimation.confidence_factors}
          />
        </div>

        <!-- Map -->
        {#if mounted}
          <Map
            lat={data.lat}
            lon={data.lon}
            radiusM={data.radiusM}
            comparables={data.comparables}
            selectedId={selectedComparable?.id_mutation}
            onSelectComparable={(c) => selectedComparable = c}
          />
        {/if}

        <!-- Charts row -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PriceDistribution comparables={data.comparables} medianPrixM2={data.estimation.median_per_m2} />
          <PriceTrend trend={data.trend} />
        </div>

        <!-- Proximity -->
        <ProximityBadges proximity={data.proximity} />
      </div>

      <!-- Right column: Comparables list -->
      <div>
        <h2 class="font-display text-lg font-bold text-navy mb-4">
          {data.comparables.length} vente{data.comparables.length > 1 ? 's' : ''} comparable{data.comparables.length > 1 ? 's' : ''}
        </h2>
        <ComparablesList
          comparables={data.comparables}
          selectedId={selectedComparable?.id_mutation}
          onSelect={(c) => selectedComparable = c}
        />
      </div>
    </div>
  {:else}
    <div class="text-center py-20">
      <p class="text-xl text-navy/60">Aucune vente trouvee dans ce secteur.</p>
      <p class="text-navy/40 mt-2">Essayez un rayon plus large ou un autre type de bien.</p>
      <a href="/" class="inline-block mt-6 text-sage hover:underline">Nouvelle estimation</a>
    </div>
  {/if}
</div>
