<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import CharacteristicsForm from '$lib/components/CharacteristicsForm.svelte';
  import CharacteristicsImpactPreview from '$lib/components/CharacteristicsImpactPreview.svelte';
  import { parseCharacteristics } from '$lib/config/coefficients';
  import type { PropertyCharacteristics } from '$lib/types';

  const params = $derived($page.url.searchParams);
  const propertyType = $derived(params.get('type') ?? 'Appartement');
  const address = $derived(params.get('address') ?? '');

  let characteristics: PropertyCharacteristics = $state(
    parseCharacteristics(new URLSearchParams($page.url.search))
  );

  const CHAR_KEYS = ['floor', 'elevator', 'outdoor', 'view', 'exposure', 'condition', 'parking', 'noise', 'pool'];

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

  function skip() {
    goto(buildEstimateUrl(false));
  }

  function submit() {
    goto(buildEstimateUrl(true));
  }
</script>

<div class="max-w-3xl mx-auto px-6 py-8" style="animation: fadeInUp 0.3s ease-out;">
  <!-- Progress bar: step 2/2 -->
  <div class="flex gap-2 mb-8">
    <div class="h-1 flex-1 rounded-full bg-navy"></div>
    <div class="h-1 flex-1 rounded-full bg-navy"></div>
  </div>

  <!-- Address -->
  {#if address}
    <p class="text-navy/50 text-sm mb-6">{address}</p>
  {/if}

  <h1 class="font-display text-2xl font-bold text-navy mb-2">
    Affinez votre estimation
  </h1>
  <p class="text-navy/60 text-sm mb-8">
    Selectionnez les caracteristiques de votre bien pour une estimation plus precise.
  </p>

  <CharacteristicsForm bind:characteristics {propertyType} />

  <CharacteristicsImpactPreview {characteristics} {propertyType} />

  <!-- Actions -->
  <div class="flex items-center justify-between mt-10 pb-20">
    <button
      type="button"
      class="text-navy/50 hover:text-navy text-sm font-medium transition-colors cursor-pointer"
      onclick={skip}
    >
      Passer
    </button>
    <button
      type="button"
      class="bg-navy text-white px-6 py-2.5 rounded-lg font-medium hover:bg-navy/90 transition-colors cursor-pointer"
      onclick={submit}
    >
      Estimer mon bien
    </button>
  </div>
</div>
