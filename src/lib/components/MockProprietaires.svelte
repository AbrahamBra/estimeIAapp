<script lang="ts">
  import { mockProprietaire } from '$lib/data/mock-pro';

  const typeLabels: Record<string, string> = {
    SCI: 'Société Civile Immobilière',
    personne_physique: 'Personne physique',
    bailleur_social: 'Bailleur social',
  };
</script>

<div>
  <p class="text-xs font-medium text-navy/50 mb-3">Propriétaire du bien</p>

  <div class="flex items-start gap-4">
    <div class="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center shrink-0">
      <svg class="w-5 h-5 text-navy/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div>
      <p class="text-xs text-navy/30">{typeLabels[mockProprietaire.type]}</p>
      <p class="text-sm font-semibold text-navy">{mockProprietaire.nom}</p>
      <p class="text-xs text-navy/30 mt-1">Acquisition : {mockProprietaire.date_acquisition}</p>
    </div>
  </div>
</div>
