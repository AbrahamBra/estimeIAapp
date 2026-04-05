<script lang="ts">
  import type { PriceEstimation, Comparable, DpeResult } from '$lib/types';

  let { estimation, comparables, surfaceM2, dpe }: {
    estimation: PriceEstimation;
    comparables: Comparable[];
    surfaceM2: number | null;
    dpe: DpeResult | null;
  } = $props();

  // Price positioning: percentile rank of median in comparable set
  const pricePercentile = $derived(() => {
    const prices = comparables.map(c => c.prix_m2).sort((a, b) => a - b);
    const idx = prices.findIndex(p => p >= estimation.median_per_m2);
    return idx === -1 ? 100 : Math.round((idx / prices.length) * 100);
  });

  // Recency: % of comparables < 12 months old
  const recentPct = $derived(() => {
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const recent = comparables.filter(c => new Date(c.date_mutation) >= cutoff).length;
    return Math.round((recent / comparables.length) * 100);
  });

  // Volume score
  const volumeScore = $derived(() => Math.min(Math.round((comparables.length / 15) * 100), 100));

  // DPE score (A=100, B=85, C=70, D=55, E=40, F=25, G=10)
  const dpeScoreMap: Record<string, number> = { A: 100, B: 85, C: 70, D: 55, E: 40, F: 25, G: 10 };
  const dpeScore = $derived(() => dpe ? (dpeScoreMap[dpe.dominant_dpe] ?? 50) : null);

  interface ScoreItem {
    label: string;
    value: number;
    suffix: string;
    color: string;
  }

  const scores: ScoreItem[] = $derived(() => {
    const items: ScoreItem[] = [
      {
        label: 'Fiabilite',
        value: estimation.confidence_score,
        suffix: '/100',
        color: estimation.confidence_score >= 70 ? 'oklch(0.58 0.14 155)' : estimation.confidence_score >= 40 ? 'oklch(0.75 0.15 75)' : 'oklch(0.65 0.18 30)',
      },
      {
        label: 'Volume',
        value: volumeScore(),
        suffix: '%',
        color: volumeScore() >= 70 ? 'oklch(0.58 0.14 155)' : volumeScore() >= 40 ? 'oklch(0.75 0.15 75)' : 'oklch(0.65 0.18 30)',
      },
      {
        label: 'Recence',
        value: recentPct(),
        suffix: '%',
        color: recentPct() >= 70 ? 'oklch(0.58 0.14 155)' : recentPct() >= 40 ? 'oklch(0.75 0.15 75)' : 'oklch(0.65 0.18 30)',
      },
    ];
    const ds = dpeScore();
    if (ds !== null) {
      items.push({
        label: 'DPE',
        value: ds,
        suffix: ` (${dpe!.dominant_dpe})`,
        color: ds >= 70 ? 'oklch(0.58 0.14 155)' : ds >= 40 ? 'oklch(0.75 0.15 75)' : 'oklch(0.65 0.18 30)',
      });
    }
    return items;
  });

  const avgScore = $derived(() => {
    const s = scores();
    return Math.round(s.reduce((acc, item) => acc + item.value, 0) / s.length);
  });

  const avgLabel = $derived(() => {
    const a = avgScore();
    return a >= 75 ? 'Excellent' : a >= 55 ? 'Bon' : a >= 35 ? 'Correct' : 'Limite';
  });

  const avgColor = $derived(() => {
    const a = avgScore();
    return a >= 75 ? 'oklch(0.58 0.14 155)' : a >= 55 ? 'oklch(0.75 0.15 75)' : 'oklch(0.65 0.18 30)';
  });
</script>

<div class="bg-white rounded-xl border border-navy/10 p-5">
  <div class="flex items-center justify-between mb-4">
    <p class="text-xs font-medium text-navy/50">Score global de l'estimation</p>
    <div class="flex items-center gap-2">
      <span class="font-mono text-lg font-bold" style="color: {avgColor()}">{avgScore()}</span>
      <span class="text-xs font-medium" style="color: {avgColor()}">{avgLabel()}</span>
    </div>
  </div>

  <div class="space-y-3">
    {#each scores() as item, i}
      <div class="flex items-center gap-3">
        <span class="text-xs text-navy/40 w-16 shrink-0">{item.label}</span>
        <div class="flex-1 h-2 rounded-full bg-navy/5 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-700 ease-out"
            style="width: {item.value}%; background: {item.color}; transition-delay: {i * 100}ms;"
          ></div>
        </div>
        <span class="text-xs font-mono text-navy/50 w-14 text-right">{item.value}{item.suffix}</span>
      </div>
    {/each}
  </div>
</div>
