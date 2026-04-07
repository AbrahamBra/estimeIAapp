<script lang="ts">
  import type { ProximitySummary } from '$lib/types';

  let { proximity }: { proximity: ProximitySummary } = $props();

  const badges = [
    { key: 'schools' as const, label: 'Écoles' },
    { key: 'transit' as const, label: 'Transports' },
    { key: 'shops' as const, label: 'Commerces' },
    { key: 'health' as const, label: 'Santé' },
    { key: 'sports' as const, label: 'Loisirs' },
  ];
</script>

<div class="flex flex-wrap gap-3">
  {#each badges as { key, label }}
    {@const data = proximity[key]}
    {#if data.count > 0}
      <div class="flex items-center gap-2 bg-sage/10 text-sage px-3 py-1.5 rounded-full text-xs font-medium">
        <span>{data.count} {label}</span>
        <span class="text-sage/60">&lt; {data.closest_m < 1000 ? `${Math.round(data.closest_m)} m` : `${(data.closest_m / 1000).toFixed(1)} km`}</span>
      </div>
    {/if}
  {/each}
</div>
