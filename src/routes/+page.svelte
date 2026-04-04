<script lang="ts">
  import AddressSearch from '$lib/components/AddressSearch.svelte';
  import { goto } from '$app/navigation';
  import type { BanResult } from '$lib/api/ban';

  let selectedAddress: BanResult | null = $state(null);
  let propertyType: 'Appartement' | 'Maison' = $state('Appartement');
  let surface: string = $state('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!selectedAddress) return;
    const params = new URLSearchParams({
      lat: String(selectedAddress.lat),
      lon: String(selectedAddress.lon),
      postcode: selectedAddress.postcode,
      address: selectedAddress.label,
      type: propertyType,
    });
    if (surface) params.set('surface', surface);
    goto(`/estimate?${params.toString()}`);
  }
</script>

<div class="max-w-xl mx-auto px-6 py-20 text-center">
  <h1 class="font-display text-4xl font-bold text-navy mb-4">
    Estimez un bien en 15 secondes
  </h1>
  <p class="text-navy/60 mb-12">
    Entrez une adresse, obtenez les ventes comparables et une fourchette de prix.
  </p>

  <form onsubmit={(e) => handleSubmit(e)} class="space-y-6 text-left">
    <div>
      <label for="address" class="block text-sm font-medium text-navy mb-2">Adresse</label>
      <AddressSearch onSelect={(result) => selectedAddress = result} />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="type" class="block text-sm font-medium text-navy mb-2">Type de bien</label>
        <select
          id="type"
          bind:value={propertyType}
          class="w-full border border-navy/20 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-sage focus:border-sage"
        >
          <option value="Appartement">Appartement</option>
          <option value="Maison">Maison</option>
        </select>
      </div>

      <div>
        <label for="surface" class="block text-sm font-medium text-navy mb-2">Surface (m&sup2;)</label>
        <input
          id="surface"
          type="number"
          bind:value={surface}
          placeholder="Optionnel"
          min="1"
          max="10000"
          class="w-full border border-navy/20 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-sage focus:border-sage"
        />
      </div>
    </div>

    <button
      type="submit"
      disabled={!selectedAddress}
      class="w-full bg-navy text-white font-semibold py-4 rounded-lg hover:bg-dark-navy transition disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Estimer
    </button>
  </form>
</div>
