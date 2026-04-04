import type { PriceEstimation } from '$lib/types';

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

function computeConfidence(comparables: ComparableForEstimation[]): {
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number;
  confidence_factors: { count_score: number; cv_score: number; recency_score: number };
} {
  const n = comparables.length;
  if (n === 0) return { confidence: 'low', confidence_score: 0, confidence_factors: { count_score: 0, cv_score: 0, recency_score: 0 } };

  const count_score = Math.min(n / 15, 1) * 40;

  const values = comparables.map((c) => c.prix_m2);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  const cv = mean > 0 ? std / mean : 1;
  const cv_score = cv < 0.15 ? 30 : cv < 0.25 ? 20 : cv < 0.35 ? 10 : 0;

  const recentCount = comparables.filter((c) => new Date(c.date_mutation).getFullYear() >= 2024).length;
  const recency_score = (recentCount / n) * 30;

  const score = Math.round(count_score + cv_score + recency_score);
  const confidence = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return {
    confidence,
    confidence_score: score,
    confidence_factors: {
      count_score: Math.round(count_score),
      cv_score: Math.round(cv_score),
      recency_score: Math.round(recency_score),
    },
  };
}

export function computePriceRange(
  comparables: ComparableForEstimation[],
  surfaceM2: number | null
): PriceEstimation {
  const values = comparables.map((c) => c.prix_m2);
  const weights = comparables.map((c) => assignWeights(c.date_mutation, c.distance));

  const low_per_m2 = weightedPercentile(values, weights, 0.25);
  const median_per_m2 = weightedPercentile(values, weights, 0.5);
  const high_per_m2 = weightedPercentile(values, weights, 0.75);

  const { confidence, confidence_score, confidence_factors } = computeConfidence(comparables);

  return {
    low_per_m2: Math.round(low_per_m2),
    median_per_m2: Math.round(median_per_m2),
    high_per_m2: Math.round(high_per_m2),
    low_total: surfaceM2 ? Math.round(low_per_m2 * surfaceM2) : null,
    median_total: surfaceM2 ? Math.round(median_per_m2 * surfaceM2) : null,
    high_total: surfaceM2 ? Math.round(high_per_m2 * surfaceM2) : null,
    comparable_count: comparables.length,
    confidence,
    confidence_score,
    confidence_factors,
  };
}
