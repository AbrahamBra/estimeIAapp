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
  import PropertyScore from '$lib/components/PropertyScore.svelte';
  import CommuneContext from '$lib/components/CommuneContext.svelte';
  import CharacteristicsImpact from '$lib/components/CharacteristicsImpact.svelte';
  import Map from '$lib/components/Map.svelte';
  import { computePriceRange, applyCoefficient } from '$lib/utils/estimation';
  import type { Comparable, ProFeature } from '$lib/types';
  import LockedFeature from '$lib/components/LockedFeature.svelte';
  import WaitlistModal from '$lib/components/WaitlistModal.svelte';
  import RentEstimateBadge from '$lib/components/RentEstimate.svelte';
  import PermitsBadge from '$lib/components/PermitsBadge.svelte';
  import CadastreBadge from '$lib/components/CadastreBadge.svelte';
  import UrbanismeBadge from '$lib/components/UrbanismeBadge.svelte';
  import CoproprieteBadge from '$lib/components/CoproprieteBadge.svelte';
  import MockProprietaires from '$lib/components/MockProprietaires.svelte';

  let { data } = $props();
  let selectedComparable: Comparable | null = $state(null);
  let mounted = $state(false);
  let excludeCovid = $state(false);
  let showWaitlist = $state(false);
  let waitlistFeature: ProFeature = $state('proprietaires');

  function openWaitlist(feature: ProFeature) {
    waitlistFeature = feature;
    showWaitlist = true;
  }

  onMount(() => { mounted = true; });

  const radiusOptions = [500, 1000, 2000];

  const covidCount = $derived(data.comparables.filter(c => c.covid_period).length);

  const filteredComparables = $derived(
    excludeCovid ? data.comparables.filter(c => !c.covid_period) : data.comparables
  );

  const filteredEstimation = $derived.by(() => {
    if (excludeCovid && filteredComparables.length > 0) {
      const base = computePriceRange(
        filteredComparables.map(c => ({ prix_m2: c.prix_m2, date_mutation: c.date_mutation, distance: c.distance })),
        data.surfaceM2
      );
      return data.characteristicsResult
        ? applyCoefficient(base, data.characteristicsResult.coefficient)
        : base;
    }
    return data.estimation;
  });

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
  <div class="flex items-start justify-between mb-6">
    <div>
      <h1 class="font-display text-2xl font-bold text-navy">{data.address}</h1>
      <p class="text-navy/50 text-sm mt-1">
        {data.propertyType}
        {#if data.surfaceM2} &middot; {data.surfaceM2} m&sup2;{/if}
      </p>
      <!-- Radius segmented control -->
      <div class="inline-flex items-center bg-navy/5 rounded-full p-0.5 mt-3 print:hidden">
        {#each radiusOptions as r}
          <button
            type="button"
            class="text-xs px-3.5 py-1.5 rounded-full font-medium transition-all duration-300 {data.radiusM === r ? 'bg-navy text-white shadow-sm' : 'text-navy/50 hover:text-navy/70'}"
            onclick={() => changeRadius(r)}
          >
            {r >= 1000 ? `${r / 1000} km` : `${r} m`}
          </button>
        {/each}
      </div>
    </div>
    <div class="flex items-center gap-2 print:hidden">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-sm text-navy/50 hover:text-navy bg-navy/5 hover:bg-navy/10 px-3.5 py-2 rounded-lg transition-all duration-300"
        onclick={handlePrint}
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="6" y="14" width="12" height="8" rx="1"/>
        </svg>
        Rapport
      </button>
      <a href="/" class="inline-flex items-center gap-1.5 text-sm text-sage hover:text-sage/80 bg-sage/5 hover:bg-sage/10 px-3.5 py-2 rounded-lg transition-all duration-300">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Nouvelle estimation
      </a>
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
      Données DVF potentiellement incomplètes pour ce département.
    </div>
  {/if}

  {#if data.dvfError}
    <div class="text-center py-20">
      <p class="text-xl text-navy/60">Service temporairement indisponible.</p>
      <p class="text-navy/40 mt-2">Réessayez dans quelques instants.</p>
      <a href="/" class="inline-block mt-6 text-sage hover:underline">Nouvelle estimation</a>
    </div>
  {:else if filteredEstimation}

    <!-- ===== HERO SECTION: Estimation ===== -->
    <section class="relative rounded-2xl bg-gradient-to-br from-navy/[0.03] via-sage/[0.04] to-ivory p-6 md:p-8 mb-12 border border-navy/5">
      <div class="flex items-center gap-2 mb-6">
        <div class="w-1.5 h-6 rounded-full bg-sage"></div>
        <h2 class="font-display text-lg font-bold text-navy">Estimation</h2>
      </div>

      <!-- Characteristics impact (above the price) -->
      {#if data.characteristicsResult}
        <div class="mb-6">
          <CharacteristicsImpact
            breakdown={data.characteristicsResult.breakdown}
            coefficient={data.characteristicsResult.coefficient}
          />
        </div>
      {/if}

      <!-- Price gauge hero -->
      <PriceGauge estimation={filteredEstimation} surfaceM2={data.surfaceM2} />

      <!-- Covid toggle -->
      <div class="flex items-center gap-3 mt-4 print:hidden">
        <label class="inline-flex items-center gap-2 text-xs cursor-pointer {covidCount === 0 ? 'opacity-40' : ''}">
          <input type="checkbox" bind:checked={excludeCovid} disabled={covidCount === 0} class="rounded border-navy/20 text-sage focus:ring-sage transition-all duration-300" />
          <span class="text-navy/50">
            Exclure les ventes en période Covid
            <span class="text-navy/30">(mars 2020 – juin 2021)</span>
            {#if covidCount > 0}
              <span class="text-amber font-medium">— {covidCount} vente{covidCount > 1 ? 's' : ''}</span>
            {:else}
              <span class="text-navy/20">— aucune dans ce jeu</span>
            {/if}
          </span>
        </label>
      </div>
    </section>

    <!-- ===== SECTION: Analyse de marché ===== -->
    <section class="mb-12">
      <div class="flex items-center gap-2 mb-6">
        <div class="w-1.5 h-6 rounded-full bg-amber"></div>
        <h2 class="font-display text-lg font-bold text-navy">Analyse de marché</h2>
      </div>

      <!-- Score + Confidence: cohesive unit -->
      <div class="bg-white rounded-xl border border-navy/10 p-5 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Score side -->
          <div>
            <PropertyScore
              estimation={filteredEstimation}
              comparables={filteredComparables}
              surfaceM2={data.surfaceM2}
              dpe={data.dpe}
            />
          </div>
          <!-- Confidence side -->
          <div class="md:border-l md:border-navy/10 md:pl-6">
            <p class="text-xs font-medium text-navy/50 mb-3">Fiabilité de l'estimation</p>
            <ConfidenceMeter
              score={filteredEstimation.confidence_score}
              factors={filteredEstimation.confidence_factors}
            />
          </div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">
        <PriceDistribution comparables={filteredComparables} medianPrixM2={filteredEstimation.median_per_m2} />
        <PriceTrend trend={data.trend} />
      </div>
    </section>

    <!-- ===== SECTION: Carte et comparables ===== -->
    <section class="mb-12">
      <div class="flex items-center gap-2 mb-6">
        <div class="w-1.5 h-6 rounded-full bg-navy"></div>
        <h2 class="font-display text-lg font-bold text-navy">Carte et comparables</h2>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        <!-- Left: Map -->
        <div class="lg:col-span-2">
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
        </div>

        <!-- Right: Comparables list -->
        <div class="print:mt-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-display text-base font-bold text-navy">
              {filteredComparables.length} vente{filteredComparables.length > 1 ? 's' : ''} comparable{filteredComparables.length > 1 ? 's' : ''}
              {#if excludeCovid && covidCount > 0}
                <span class="text-xs font-normal text-navy/30">({covidCount} exclue{covidCount > 1 ? 's' : ''})</span>
              {/if}
            </h3>
          </div>

          <!-- Color legend for comparable cards -->
          <div class="flex items-center gap-3 mb-3 text-[10px] text-navy/40">
            <span class="inline-flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-sm" style="background: #4a9d6b;"></span> Prix bas
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-sm" style="background: #d4a029;"></span> Prix moyen
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="w-2.5 h-2.5 rounded-sm" style="background: #d45a5a;"></span> Prix haut
            </span>
          </div>

          <ComparablesList
            comparables={filteredComparables}
            selectedId={selectedComparable?.id_mutation}
            onSelect={(c) => selectedComparable = c}
          />
        </div>
      </div>
    </section>

    <!-- ===== SECTION: Environnement ===== -->
    <section class="mb-12">
      <div class="flex items-center gap-2 mb-6">
        <div class="w-1.5 h-6 rounded-full bg-coral"></div>
        <h2 class="font-display text-lg font-bold text-navy">Environnement</h2>
      </div>

      <!-- DPE + Risks with more visual weight -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:grid-cols-2">
        {#if data.dpe}
          <div class="bg-white rounded-xl border border-navy/10 p-1 shadow-sm transition-all duration-300 hover:shadow-md">
            <DpeBadge dpe={data.dpe} />
          </div>
        {/if}
        {#if data.risks}
          <div class="bg-white rounded-xl border border-navy/10 p-1 shadow-sm transition-all duration-300 hover:shadow-md">
            <RiskBadges risks={data.risks} />
          </div>
        {/if}
      </div>

      <!-- Proximity -->
      <div class="mb-6">
        <ProximityBadges proximity={data.proximity} />
      </div>

      <!-- Rent estimate -->
      {#if data.rentEstimate}
        <div class="mb-6">
          <RentEstimateBadge rent={data.rentEstimate} />
        </div>
      {/if}

      <!-- Building permits -->
      {#if data.permits}
        <div class="mb-6">
          <PermitsBadge permits={data.permits} />
        </div>
      {/if}

      <!-- Commune context -->
      {#if data.communeCtx}
        <div class="mb-6">
          <CommuneContext commune={data.communeCtx} />
        </div>
      {/if}

      <!-- Cadastre -->
      {#if data.cadastre}
        <div class="mb-6">
          <CadastreBadge cadastre={data.cadastre} surfaceM2={data.surfaceM2} />
        </div>
      {/if}

      <!-- Urbanisme PLU -->
      {#if data.urbanisme}
        <div class="mb-6">
          <UrbanismeBadge urbanisme={data.urbanisme} />
        </div>
      {/if}

      <!-- Copropriété -->
      {#if data.copropriete}
        <CoproprieteBadge copropriete={data.copropriete} />
      {/if}
    </section>

    <!-- ===== SECTION: Données Pro ===== -->
    <section class="mb-12 print:hidden">
      <div class="flex items-center gap-2 mb-6">
        <div class="w-1.5 h-6 rounded-full" style="background: linear-gradient(180deg, oklch(0.75 0.12 85), oklch(0.65 0.14 65));"></div>
        <h2 class="font-display text-lg font-bold text-navy">Données Pro</h2>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-white"
          style="background: linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.65 0.14 65));"
        >PRO</span>
      </div>

      <div class="max-w-md mx-auto">
        <LockedFeature title="Propriétaire" teaser="Propriétaire identifié — SCI ••••••" feature="proprietaires" onunlock={openWaitlist}>
          <MockProprietaires />
        </LockedFeature>
      </div>
    </section>

    <!-- Waitlist modal (shared) -->
    <WaitlistModal
      feature={waitlistFeature}
      address={data.address}
      bind:open={showWaitlist}
      onclose={() => showWaitlist = false}
    />

    <!-- Print footer -->
    <div class="hidden print:block mt-8 pt-4 border-t border-navy/10">
      <p class="text-xs text-navy/30 text-center">
        Rapport généré par EstimeIA le {new Date().toLocaleDateString('fr-FR')} — Données DVF (DGFiP), DPE (ADEME), Risques (Géorisques)
      </p>
    </div>
  {:else}
    <div class="text-center py-20">
      <p class="text-xl text-navy/60">Aucune vente trouvée dans ce secteur.</p>
      <p class="text-navy/40 mt-2">Essayez un rayon plus large ou un autre type de bien.</p>
      <a href="/" class="inline-block mt-6 text-sage hover:underline">Nouvelle estimation</a>
    </div>
  {/if}
</div>
