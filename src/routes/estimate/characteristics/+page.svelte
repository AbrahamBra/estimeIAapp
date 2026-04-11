<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import CharacteristicsForm from '$lib/components/CharacteristicsForm.svelte';
  import CharacteristicsImpactPreview from '$lib/components/CharacteristicsImpactPreview.svelte';
  import AnalysisOverlay from '$lib/components/AnalysisOverlay.svelte';
  import { parseCharacteristics } from '$lib/config/coefficients';
  import type { PropertyCharacteristics } from '$lib/types';

  const params = $derived($page.url.searchParams);
  const propertyType = $derived(params.get('type') ?? 'Appartement');
  const address = $derived(params.get('address') ?? '');
  const surface = $derived(params.get('surface') ?? '');

  let characteristics: PropertyCharacteristics = $state(
    parseCharacteristics(new URLSearchParams($page.url.search))
  );

  let showAnalysis = $state(false);
  let overlayRef: { markNavigationDone: () => void } | undefined = $state();
  let pendingUrl = $state('');

  const CHAR_KEYS = ['floor', 'elevator', 'outdoor', 'view', 'exposure', 'condition', 'parking', 'noise', 'pool', 'cave', 'heating', 'brightness', 'standing', 'building_period'];

  function buildEstimateUrl(includeChars: boolean): string {
    const out = new URLSearchParams();
    // Forward all non-characteristics params
    for (const [key, value] of params.entries()) {
      if (!CHAR_KEYS.includes(key)) {
        out.set(key, value);
      }
    }
    // Append characteristics if requested
    if (includeChars) {
      for (const key of CHAR_KEYS) {
        const val = characteristics[key as keyof PropertyCharacteristics];
        if (val !== null && val !== undefined) {
          out.set(key, String(val));
        }
      }
    }
    return `/estimate?${out.toString()}`;
  }

  function startAnalysis(includeChars: boolean) {
    pendingUrl = buildEstimateUrl(includeChars);
    showAnalysis = true;

    // Start the actual navigation in the background (SvelteKit prefetches)
    // The server load() runs while the overlay animates
    fetch(pendingUrl, { headers: { 'purpose': 'prefetch' } })
      .then(() => overlayRef?.markNavigationDone())
      .catch(() => overlayRef?.markNavigationDone());
  }

  function skip() {
    startAnalysis(false);
  }

  function submit() {
    startAnalysis(true);
  }

  function handleAnalysisComplete() {
    // Navigate to the results page (should be instant if prefetched)
    goto(pendingUrl);
  }
</script>

<div class="max-w-3xl mx-auto px-6 py-8" style="animation: fadeInUp 0.3s ease-out;">

  <!-- Progress bar: step 1 (done) → step 2 (active) -->
  <div class="flex items-center gap-3 mb-10">
    <!-- Step 1: completed -->
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded-full bg-sage text-white flex items-center justify-center text-xs font-bold">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </div>
      <span class="text-xs font-medium text-navy/40">Adresse</span>
    </div>
    <!-- Connector -->
    <div class="flex-1 h-0.5 rounded-full bg-sage"></div>
    <!-- Step 2: active -->
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold">
        2
      </div>
      <span class="text-xs font-bold text-navy">Caractéristiques</span>
    </div>
    <!-- Connector placeholder -->
    <div class="flex-1 h-0.5 rounded-full bg-navy/10"></div>
    <!-- Step 3: upcoming -->
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded-full bg-navy/10 text-navy/30 flex items-center justify-center text-xs font-bold">
        3
      </div>
      <span class="text-xs font-medium text-navy/30">Résultat</span>
    </div>
  </div>

  <!-- Header with decorative element -->
  <div class="flex items-start gap-4 mb-2">
    <div>
      <h1 class="font-display text-2xl font-bold text-navy">
        Affinez votre estimation
      </h1>
      <p class="text-navy/60 text-sm mt-1">
        Sélectionnez les caractéristiques de votre bien pour une estimation plus précise.
      </p>
    </div>
    <!-- Decorative house silhouette -->
    <div class="hidden sm:block ml-auto text-navy/10 flex-shrink-0" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-14 h-14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L4 9v12h5v-7h6v7h5V9z"/>
      </svg>
    </div>
  </div>

  <!-- Step 1 summary pills -->
  {#if address || propertyType || surface}
    <div class="flex flex-wrap items-center gap-2 mb-8 mt-4">
      {#if propertyType}
        <span class="inline-flex items-center gap-1.5 text-xs font-medium text-navy/60 bg-navy/5 rounded-full px-3 py-1">
          {propertyType === 'Maison' ? '🏠' : '🏢'} {propertyType}
        </span>
      {/if}
      {#if address}
        <span class="inline-flex items-center gap-1.5 text-xs font-medium text-navy/60 bg-navy/5 rounded-full px-3 py-1 max-w-xs truncate" title={address}>
          📍 {address}
        </span>
      {/if}
      {#if surface}
        <span class="inline-flex items-center gap-1.5 text-xs font-medium text-navy/60 bg-navy/5 rounded-full px-3 py-1">
          📐 {surface} m²
        </span>
      {/if}
    </div>
  {/if}

  <!-- Form card -->
  <div
    class="bg-white shadow-md rounded-2xl p-6 sm:p-8 border border-navy/5"
    style="animation: cardEnter 0.4s ease-out;"
  >
    <CharacteristicsForm bind:characteristics {propertyType} />
  </div>

  <CharacteristicsImpactPreview {characteristics} {propertyType} />

  <!-- Actions -->
  <div class="flex items-center justify-between mt-10 pb-20">
    <button
      type="button"
      class="border border-navy/20 text-navy/60 hover:text-navy hover:border-navy/40 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer"
      onclick={skip}
    >
      Passer cette étape
    </button>
    <button
      type="button"
      class="bg-navy text-white px-6 py-2.5 rounded-lg font-medium hover:bg-navy/90 transition-all duration-200 cursor-pointer inline-flex items-center gap-2 shadow-sm hover:shadow-md"
      onclick={submit}
    >
      Estimer mon bien
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>

  <!-- Analysis overlay -->
  <AnalysisOverlay
    bind:open={showAnalysis}
    bind:this={overlayRef}
    onComplete={handleAnalysisComplete}
  />
</div>
