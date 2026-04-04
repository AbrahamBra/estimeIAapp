<script lang="ts">
  let { score, factors }: {
    score: number;
    factors: { count_score: number; cv_score: number; recency_score: number };
  } = $props();

  let expanded = $state(false);

  const segments = 5;
  const filled = Math.ceil((score / 100) * segments);

  function segmentColor(i: number): string {
    if (score >= 70) return 'oklch(0.58 0.14 155)';
    if (score >= 40) return 'oklch(0.75 0.15 75)';
    return 'oklch(0.65 0.18 30)';
  }

  const label = score >= 70 ? 'Fiable' : score >= 40 ? 'Correcte' : 'Indicative';
</script>

<button
  type="button"
  class="w-full text-left"
  onclick={() => expanded = !expanded}
>
  <div class="flex items-center gap-3">
    <div class="flex gap-1">
      {#each Array(segments) as _, i}
        <div
          class="w-5 h-2.5 rounded-sm transition-all duration-500"
          style="background: {i < filled ? segmentColor(i) : 'oklch(0.92 0.01 230)'}; opacity: {i < filled ? 1 : 0.3}; transition-delay: {i * 100}ms;"
        ></div>
      {/each}
    </div>
    <span class="text-xs font-medium" style="color: {segmentColor(0)}">{label}</span>
    <span class="text-xs text-navy/30">{score}/100</span>
    <svg class="w-3 h-3 text-navy/30 transition-transform {expanded ? 'rotate-180' : ''}" viewBox="0 0 12 12">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>
  </div>
</button>

{#if expanded}
  <div class="mt-3 space-y-2 pl-1" style="animation: fadeInUp 0.3s ease-out;">
    <div class="flex items-center gap-2">
      <span class="text-xs text-navy/40 w-20">Volume</span>
      <div class="flex-1 h-1.5 rounded-full bg-navy-light overflow-hidden">
        <div class="h-full rounded-full bg-sage transition-all duration-700" style="width: {(factors.count_score / 40) * 100}%"></div>
      </div>
      <span class="text-xs text-navy/30 w-8 text-right">{factors.count_score}/40</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-xs text-navy/40 w-20">Coherence</span>
      <div class="flex-1 h-1.5 rounded-full bg-navy-light overflow-hidden">
        <div class="h-full rounded-full bg-sage transition-all duration-700" style="width: {(factors.cv_score / 30) * 100}%"></div>
      </div>
      <span class="text-xs text-navy/30 w-8 text-right">{factors.cv_score}/30</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="text-xs text-navy/40 w-20">Recence</span>
      <div class="flex-1 h-1.5 rounded-full bg-navy-light overflow-hidden">
        <div class="h-full rounded-full bg-sage transition-all duration-700" style="width: {(factors.recency_score / 30) * 100}%"></div>
      </div>
      <span class="text-xs text-navy/30 w-8 text-right">{factors.recency_score}/30</span>
    </div>
  </div>
{/if}
