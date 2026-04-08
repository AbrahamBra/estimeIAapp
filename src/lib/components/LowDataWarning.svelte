<script lang="ts">
  let { count, radiusM }: { count: number; radiusM: number } = $props();

  const suggestions = $derived(() => {
    const items: string[] = [];
    if (radiusM < 2000) items.push('Augmenter le rayon de recherche');
    items.push('Retirer le filtre de surface ou de pièces');
    items.push('Vérifier les 2 types (Appartement / Maison)');
    return items;
  });
</script>

{#if count > 0 && count < 5}
  <div class="bg-amber/5 border border-amber/20 rounded-xl p-4 mb-6" style="animation: fadeInUp 0.3s ease-out;">
    <div class="flex items-start gap-3">
      <svg class="w-5 h-5 text-amber shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <div>
        <p class="text-sm font-medium text-amber">
          Seulement {count} vente{count > 1 ? 's' : ''} comparable{count > 1 ? 's' : ''} trouvée{count > 1 ? 's' : ''}
        </p>
        <p class="text-xs text-navy/40 mt-1">
          L'estimation est peu fiable avec moins de 5 comparables. Les prix affichés sont à titre indicatif.
        </p>
        <div class="mt-2 space-y-1">
          {#each suggestions() as suggestion}
            <p class="text-[11px] text-navy/30 flex items-center gap-1.5">
              <span class="w-1 h-1 rounded-full bg-amber/40 shrink-0"></span>
              {suggestion}
            </p>
          {/each}
        </div>
      </div>
    </div>
  </div>
{/if}
