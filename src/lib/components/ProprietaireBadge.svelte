<script lang="ts">
  import type { ProprietaireResult } from '$lib/api/pappers';

  let { proprietaire }: { proprietaire: ProprietaireResult } = $props();

  const typeLabel: Record<string, string> = {
    'SCI': 'SCI (Société Civile Immobilière)',
    'personne_morale': 'Personne morale',
    'personne_physique': 'Personne physique',
    'bailleur_social': 'Bailleur social',
    'inconnu': 'Type inconnu',
  };

  const typeColor: Record<string, string> = {
    'SCI': 'oklch(0.58 0.14 155)',
    'personne_morale': 'oklch(0.55 0.15 250)',
    'bailleur_social': 'oklch(0.75 0.15 75)',
    'personne_physique': 'oklch(0.65 0.12 200)',
    'inconnu': 'oklch(0.5 0 0)',
  };

  let expanded = $state(false);
</script>

<div class="bg-white rounded-xl border border-navy/10 p-5 shadow-sm">
  <button type="button" class="w-full text-left" onclick={() => expanded = !expanded}>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
          style="background: {typeColor[proprietaire.type] ?? typeColor.inconnu}"
        >
          {#if proprietaire.type === 'SCI'}
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {:else}
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          {/if}
        </div>
        <div>
          <p class="text-sm font-medium text-navy">{proprietaire.nom}</p>
          <p class="text-xs text-navy/40">{typeLabel[proprietaire.type] ?? 'Propriétaire'}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style="background: {typeColor[proprietaire.type]}15; color: {typeColor[proprietaire.type]}"
        >
          {proprietaire.type.toUpperCase()}
        </span>
        <svg class="w-3 h-3 text-navy/30 transition-transform {expanded ? 'rotate-180' : ''}" viewBox="0 0 12 12">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
  </button>

  {#if expanded}
    <div class="mt-4 space-y-4 pt-4 border-t border-navy/5" style="animation: fadeInUp 0.3s ease-out;">

      <!-- Key info grid -->
      <div class="grid grid-cols-2 gap-4">
        {#if proprietaire.siren}
          <div>
            <p class="text-[10px] text-navy/30 mb-0.5">SIREN</p>
            <p class="text-sm font-mono text-navy">{proprietaire.siren}</p>
          </div>
        {/if}
        {#if proprietaire.forme_juridique}
          <div>
            <p class="text-[10px] text-navy/30 mb-0.5">Forme juridique</p>
            <p class="text-sm text-navy">{proprietaire.forme_juridique}</p>
          </div>
        {/if}
        {#if proprietaire.date_creation}
          <div>
            <p class="text-[10px] text-navy/30 mb-0.5">Date de création</p>
            <p class="text-sm text-navy">{new Date(proprietaire.date_creation).toLocaleDateString('fr-FR')}</p>
          </div>
        {/if}
        {#if proprietaire.siege_adresse}
          <div>
            <p class="text-[10px] text-navy/30 mb-0.5">Siège social</p>
            <p class="text-sm text-navy">{proprietaire.siege_adresse}</p>
          </div>
        {/if}
      </div>

      <!-- Dirigeants -->
      {#if proprietaire.dirigeants.length > 0}
        <div>
          <p class="text-xs font-medium text-navy/50 mb-2">Dirigeants</p>
          <div class="space-y-1.5">
            {#each proprietaire.dirigeants as d}
              <div class="flex items-center justify-between text-sm">
                <span class="text-navy">{d.nom}</span>
                <span class="text-xs text-navy/30">{d.qualite}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Bénéficiaires effectifs -->
      {#if proprietaire.beneficiaires.length > 0}
        <div>
          <p class="text-xs font-medium text-navy/50 mb-2">Bénéficiaires effectifs</p>
          <div class="space-y-1.5">
            {#each proprietaire.beneficiaires as b}
              <div class="flex items-center justify-between text-sm">
                <span class="text-navy">{b.nom}</span>
                {#if b.parts_pct}
                  <span class="text-xs font-mono text-navy/40">{b.parts_pct}%</span>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <p class="text-[10px] text-navy/20">
        Source : Pappers (INPI, INSEE, BODACC) — Données publiques
      </p>
    </div>
  {/if}
</div>
