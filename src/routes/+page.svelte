<script lang="ts">
  import AddressSearch from '$lib/components/AddressSearch.svelte';
  import { goto } from '$app/navigation';
  import type { BanResult } from '$lib/api/ban';

  let selectedAddress: BanResult | null = $state(null);
  let propertyType: 'Appartement' | 'Maison' = $state('Appartement');
  let surface: string = $state('');
  let rooms: string = $state('');
  let showAdvanced = $state(false);

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
    if (rooms) params.set('rooms', rooms);
    goto(`/estimate?${params.toString()}`);
  }
</script>

<div class="max-w-3xl mx-auto px-6 py-16 text-center">
  <!-- Hero -->
  <h1 class="font-display text-4xl md:text-5xl font-bold text-navy mb-4 leading-tight">
    Estimez un bien en <span class="text-sage">15 secondes</span>
  </h1>
  <p class="text-navy/50 text-lg mb-8 max-w-lg mx-auto">
    Ventes comparables, fourchette de prix et analyse de marche, alimentes par les donnees officielles DVF.
  </p>

  <!-- Trust badges -->
  <div class="flex flex-wrap justify-center gap-3 mb-10">
    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sage/10 text-sage text-xs font-medium">
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none"><path d="M8 1L10.2 5.5L15 6.2L11.5 9.6L12.4 14.4L8 12.1L3.6 14.4L4.5 9.6L1 6.2L5.8 5.5L8 1Z" fill="currentColor"/></svg>
      Donnees DVF officielles
    </span>
    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy/5 text-navy/60 text-xs font-medium">
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 8.5L7 10L10.5 6.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      100% gratuit
    </span>
    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy/5 text-navy/60 text-xs font-medium">
      <svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none"><path d="M8 2C5.2 2 3 4.2 3 7V10L2 12H14L13 10V7C13 4.2 10.8 2 8 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 12V12.5C6.5 13.3 7.2 14 8 14C8.8 14 9.5 13.3 9.5 12.5V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      Aucune inscription
    </span>
  </div>

  <!-- Form card -->
  <div class="bg-white shadow-lg rounded-2xl p-8 text-left" style="animation: fadeInUp 0.6s ease-out;">
    <form onsubmit={(e) => handleSubmit(e)} class="space-y-5">
      <div>
        <label for="address" class="block text-sm font-medium text-navy mb-2">Adresse du bien</label>
        <AddressSearch onSelect={(result) => selectedAddress = result} />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="type" class="block text-sm font-medium text-navy mb-2">Type de bien</label>
          <select
            id="type"
            bind:value={propertyType}
            class="w-full border border-navy/20 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-sage focus:border-sage transition"
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
            class="w-full border border-navy/20 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-sage focus:border-sage transition"
          />
        </div>
      </div>

      <!-- Advanced filters toggle -->
      <button
        type="button"
        class="inline-flex items-center gap-1.5 text-xs text-navy/40 hover:text-navy/60 transition"
        onclick={() => showAdvanced = !showAdvanced}
      >
        <svg class="w-3 h-3 transition-transform {showAdvanced ? 'rotate-180' : ''}" viewBox="0 0 12 12">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>
        Filtres avances
      </button>

      {#if showAdvanced}
        <div class="grid grid-cols-2 gap-4" style="animation: fadeInUp 0.3s ease-out;">
          <div>
            <label for="rooms" class="block text-sm font-medium text-navy mb-2">Nombre de pieces</label>
            <select
              id="rooms"
              bind:value={rooms}
              class="w-full border border-navy/20 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-sage focus:border-sage transition"
            >
              <option value="">Toutes</option>
              <option value="1">1 piece</option>
              <option value="2">2 pieces</option>
              <option value="3">3 pieces</option>
              <option value="4">4 pieces</option>
              <option value="5">5+ pieces</option>
            </select>
          </div>
          <div>
            <label for="radius" class="block text-sm font-medium text-navy mb-2">Rayon de recherche</label>
            <select
              id="radius"
              class="w-full border border-navy/20 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-sage focus:border-sage transition"
            >
              <option value="500">500 m</option>
              <option value="1000" selected>1 km</option>
              <option value="2000">2 km</option>
            </select>
          </div>
        </div>
      {/if}

      <button
        type="submit"
        disabled={!selectedAddress}
        class="w-full bg-navy text-white font-semibold py-4 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        Estimer maintenant
      </button>
    </form>
  </div>

  <!-- How it works -->
  <div class="mt-20">
    <h2 class="font-display text-xl font-bold text-navy mb-8">Comment ca marche</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
      <div style="animation: fadeInUp 0.5s ease-out 100ms both;">
        <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-sage/10 flex items-center justify-center">
          <svg class="w-6 h-6 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21L16.7 16.7" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="font-medium text-navy text-sm">1. Entrez l'adresse</p>
        <p class="text-xs text-navy/40 mt-1">Recherche intelligente avec autocompletion</p>
      </div>
      <div style="animation: fadeInUp 0.5s ease-out 200ms both;">
        <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-sage/10 flex items-center justify-center">
          <svg class="w-6 h-6 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 3V21H21" stroke-linecap="round"/><path d="M7 14L11 10L15 13L21 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="font-medium text-navy text-sm">2. Analyse automatique</p>
        <p class="text-xs text-navy/40 mt-1">Croisement des ventes DVF a proximite</p>
      </div>
      <div style="animation: fadeInUp 0.5s ease-out 300ms both;">
        <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-sage/10 flex items-center justify-center">
          <svg class="w-6 h-6 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L15.1 8.3L22 9.3L17 14.1L18.2 21L12 17.8L5.8 21L7 14.1L2 9.3L8.9 8.3L12 2Z"/>
          </svg>
        </div>
        <p class="font-medium text-navy text-sm">3. Resultat detaille</p>
        <p class="text-xs text-navy/40 mt-1">Fourchette de prix, carte et comparables</p>
      </div>
    </div>
  </div>
</div>
