<script lang="ts">
  import type { UrbanismeResult } from '$lib/types';

  let { urbanisme }: { urbanisme: UrbanismeResult } = $props();

  let expanded = $state(false);

  const zoneColors: Record<string, string> = {
    U: 'oklch(0.55 0.12 250)',
    AU: 'oklch(0.75 0.15 75)',
    A: 'oklch(0.58 0.14 155)',
    N: 'oklch(0.45 0.16 155)',
  };

  const zoneDescriptions: Record<string, string> = {
    U: 'Zone urbaine — constructible, déjà équipée',
    AU: 'Zone à urbaniser — constructible sous conditions',
    A: 'Zone agricole — construction très limitée',
    N: 'Zone naturelle — protégée, non constructible',
  };

  const color = zoneColors[urbanisme.typezone] ?? 'oklch(0.55 0.05 250)';
  const description = zoneDescriptions[urbanisme.typezone] ?? '';
</script>

<button
  type="button"
  class="w-full text-left bg-white rounded-xl border border-navy/10 p-4 hover:border-navy/20 transition"
  onclick={() => expanded = !expanded}
>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <span class="text-xs font-medium text-navy/50">Urbanisme</span>
      <span
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
        style="background: {color};"
      >
        {urbanisme.typezone}
      </span>
      <span class="text-xs text-navy/40 truncate">{urbanisme.libelong || urbanisme.libelle}</span>
    </div>
    <svg class="w-3 h-3 text-navy/30 transition-transform shrink-0 {expanded ? 'rotate-180' : ''}" viewBox="0 0 12 12">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>
  </div>

  {#if expanded}
    <div class="mt-4 space-y-3" style="animation: fadeInUp 0.3s ease-out;">
      {#if description}
        <div>
          <p class="text-xs text-navy/40 mb-1">Type de zone</p>
          <p class="text-xs text-navy/60">{description}</p>
        </div>
      {/if}

      <div class="grid grid-cols-2 gap-3">
        <div>
          <p class="text-[10px] text-navy/30">Code zone</p>
          <p class="text-xs font-medium text-navy">{urbanisme.libelle}</p>
        </div>
        {#if urbanisme.destdomi}
          <div>
            <p class="text-[10px] text-navy/30">Destination dominante</p>
            <p class="text-xs font-medium text-navy">{urbanisme.destdomi}</p>
          </div>
        {/if}
        <div>
          <p class="text-[10px] text-navy/30">Document</p>
          <p class="text-xs font-medium text-navy">{urbanisme.document}</p>
        </div>
      </div>

      <p class="text-[10px] text-navy/20">Source : GPU — Géoportail de l'Urbanisme (IGN)</p>
    </div>
  {/if}
</button>
