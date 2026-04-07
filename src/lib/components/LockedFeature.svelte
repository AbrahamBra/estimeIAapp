<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ProFeature } from '$lib/types';

  let {
    title,
    teaser,
    feature,
    onunlock,
    children,
  }: {
    title: string;
    teaser: string;
    feature: ProFeature;
    onunlock: (feature: ProFeature) => void;
    children: Snippet;
  } = $props();
</script>

<div class="relative rounded-xl border border-navy/10 bg-white overflow-hidden shadow-sm">
  <!-- PRO badge -->
  <div class="absolute top-3 right-3 z-10">
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
      style="background: linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.65 0.14 65)); color: white;"
    >
      <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      PRO
    </span>
  </div>

  <!-- Blurred content -->
  <div class="p-5" aria-hidden="true">
    <div class="pointer-events-none select-none" style="filter: blur(6px);">
      {@render children()}
    </div>
  </div>

  <!-- Overlay with CTA -->
  <div class="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px]">
    <div class="text-center px-6">
      <!-- Lock icon -->
      <div class="w-10 h-10 mx-auto mb-3 rounded-full bg-navy/5 flex items-center justify-center">
        <svg class="w-5 h-5 text-navy/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </div>
      <h4 class="font-display text-sm font-bold text-navy mb-1">{title}</h4>
      <p class="text-xs text-navy/40 mb-4 max-w-xs">{teaser}</p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition hover:opacity-90"
        style="background: linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.65 0.14 65));"
        onclick={() => onunlock(feature)}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Débloquer avec EstimeIA Pro
      </button>
    </div>
  </div>
</div>
