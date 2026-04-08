<script lang="ts">
  import type { CoproprieteResult } from '$lib/types';

  let { copropriete }: { copropriete: CoproprieteResult } = $props();
</script>

<div class="bg-white rounded-xl border border-navy/10 p-5">
  <p class="text-xs font-medium text-navy/50 mb-3">Copropriété</p>

  {#if copropriete.nom}
    <p class="text-sm font-semibold text-navy mb-3">{copropriete.nom}</p>
  {/if}

  <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div>
      <p class="text-xs text-navy/30">Lots total</p>
      <p class="text-sm font-semibold text-navy">{copropriete.lots_total}</p>
    </div>
    <div>
      <p class="text-xs text-navy/30">Lots habitation</p>
      <p class="text-sm font-semibold text-navy">{copropriete.lots_habitation}</p>
    </div>
    <div>
      <p class="text-xs text-navy/30">Stationnement</p>
      <p class="text-sm font-semibold text-navy">{copropriete.lots_stationnement}</p>
    </div>
    {#if copropriete.periode_construction}
      <div>
        <p class="text-xs text-navy/30">Construction</p>
        <p class="text-sm font-semibold text-navy">{copropriete.periode_construction}</p>
      </div>
    {/if}
  </div>

  {#if copropriete.type_syndic}
    <div class="mt-3 flex items-center gap-2">
      <span class="text-xs text-navy/30">Syndic :</span>
      <span class="text-xs font-medium text-navy capitalize">{copropriete.type_syndic}</span>
    </div>
  {/if}

  <p class="text-[10px] text-navy/20 mt-3">Source : RNIC — ANAH</p>
</div>
