<script lang="ts">
  import type { YearlyTrend } from '$lib/types';

  let { trend }: { trend: YearlyTrend[] } = $props();

  const maxPrice = Math.max(...trend.map((t) => t.median_prix_m2), 1);
  const barW = 100 / Math.max(trend.length, 1);

  function barOpacity(year: number): number {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    return Math.max(0.4, 1 - age * 0.12);
  }

  function formatK(n: number): string {
    return n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n));
  }
</script>

{#if trend.length >= 2}
  <div class="bg-white rounded-xl border border-navy/10 p-4">
    <p class="text-xs font-medium text-navy/50 mb-3">Evolution des prix/m&sup2;</p>
    <svg viewBox="0 0 100 55" class="w-full" preserveAspectRatio="none">
      {#each trend as item, i}
        {@const h = (item.median_prix_m2 / maxPrice) * 38}
        <rect
          x={i * barW + barW * 0.15}
          y={42 - h}
          width={barW * 0.7}
          height={h}
          rx="1.5"
          fill="oklch(0.25 0.06 230)"
          opacity={barOpacity(item.year)}
          style="animation: fadeInUp 0.5s ease-out {i * 80}ms both;"
        />
        <!-- Year label -->
        <text
          x={i * barW + barW / 2}
          y="50"
          text-anchor="middle"
          font-size="3.5"
          fill="oklch(0.25 0.06 230)"
          opacity="0.4"
        >{item.year}</text>
        <!-- Price label -->
        <text
          x={i * barW + barW / 2}
          y={40 - h}
          text-anchor="middle"
          font-size="3"
          fill="oklch(0.25 0.06 230)"
          opacity="0.5"
        >{formatK(item.median_prix_m2)}</text>
      {/each}
      <line x1="0" y1="42" x2="100" y2="42" stroke="oklch(0.25 0.06 230)" stroke-width="0.2" opacity="0.3"/>
    </svg>
    <div class="flex items-center gap-2 mt-2">
      <span class="text-[10px] text-navy/30">{trend.reduce((s, t) => s + t.count, 0)} ventes sur {trend.length} ans</span>
    </div>
  </div>
{/if}
