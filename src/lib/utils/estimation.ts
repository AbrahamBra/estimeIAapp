export function removeOutliers(values: number[], stdDevs: number): number[] {
  if (values.length === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return values;
  return values.filter((v) => Math.abs(v - mean) <= stdDevs * std);
}

export function assignWeights(dateMutation: string, distanceM: number): number {
  const year = new Date(dateMutation).getFullYear();
  const recency =
    year >= 2025 ? 1.0 : year === 2024 ? 0.8 : year === 2023 ? 0.5 : 0.3;
  const proximity =
    distanceM < 200 ? 1.0 : distanceM < 500 ? 0.8 : distanceM < 1000 ? 0.5 : 0.3;
  return recency * proximity;
}

export function weightedPercentile(
  values: number[],
  weights: number[],
  p: number
): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const pairs = values
    .map((v, i) => ({ value: v, weight: weights[i] }))
    .sort((a, b) => a.value - b.value);

  const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0);

  let cumulative = 0;
  for (let i = 0; i < pairs.length; i++) {
    cumulative += pairs[i].weight;
    const cNorm = (cumulative - pairs[i].weight / 2) / totalWeight;
    if (cNorm >= p) {
      if (i === 0) return pairs[0].value;
      const prevCum =
        (cumulative - pairs[i].weight - pairs[i - 1].weight / 2) / totalWeight;
      const t = (p - prevCum) / (cNorm - prevCum);
      return pairs[i - 1].value + t * (pairs[i].value - pairs[i - 1].value);
    }
  }
  return pairs[pairs.length - 1].value;
}

interface ComparableForEstimation {
  prix_m2: number;
  date_mutation: string;
  distance: number;
}

export function computePriceRange(
  comparables: ComparableForEstimation[],
  surfaceM2: number | null
): {
  low_per_m2: number;
  median_per_m2: number;
  high_per_m2: number;
  low_total: number | null;
  median_total: number | null;
  high_total: number | null;
  comparable_count: number;
  confidence: 'high' | 'medium' | 'low';
} {
  const values = comparables.map((c) => c.prix_m2);
  const weights = comparables.map((c) => assignWeights(c.date_mutation, c.distance));

  const low_per_m2 = weightedPercentile(values, weights, 0.25);
  const median_per_m2 = weightedPercentile(values, weights, 0.5);
  const high_per_m2 = weightedPercentile(values, weights, 0.75);

  const confidence =
    comparables.length >= 10 ? 'high' : comparables.length >= 3 ? 'medium' : 'low';

  return {
    low_per_m2: Math.round(low_per_m2),
    median_per_m2: Math.round(median_per_m2),
    high_per_m2: Math.round(high_per_m2),
    low_total: surfaceM2 ? Math.round(low_per_m2 * surfaceM2) : null,
    median_total: surfaceM2 ? Math.round(median_per_m2 * surfaceM2) : null,
    high_total: surfaceM2 ? Math.round(high_per_m2 * surfaceM2) : null,
    comparable_count: comparables.length,
    confidence,
  };
}
