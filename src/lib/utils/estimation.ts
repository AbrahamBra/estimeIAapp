import type { PriceEstimation, DpeAdjustment, DpeClass } from '$lib/types';
import { config } from '$lib/config';

// ─── Weights ────────────────────────────────────────────────────────────────

export function assignWeights(dateMutation: string, distanceM: number): number {
  const date = new Date(dateMutation);
  const year = date.getFullYear();
  const recency =
    year >= 2025 ? 1.0 : year === 2024 ? 0.8 : year === 2023 ? 0.5 : 0.3;
  const proximity =
    distanceM < 200 ? 1.0 : distanceM < 500 ? 0.8 : distanceM < 1000 ? 0.5 : 0.3;

  // Covid period penalty: March 2020 – June 2021 had distorted prices
  const isCovid = dateMutation >= '2020-03-01' && dateMutation <= '2021-06-30';
  const covidPenalty = isCovid ? 0.5 : 1.0;

  return recency * proximity * covidPenalty;
}

// ─── Weighted Percentile ────────────────────────────────────────────────────

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

// ─── Temporal Price Correction ──────────────────────────────────────────────

/**
 * Corrects a historical price/m² to current (2025) value
 * using the temporal price index approximation.
 */
export function applyTemporalCorrection(prixM2: number, dateMutation: string): number {
  const year = new Date(dateMutation).getFullYear();
  const yearIndex = config.TEMPORAL_INDEX[year] ?? 1.0;
  const currentIndex = config.TEMPORAL_INDEX[2025] ?? 1.0;

  if (yearIndex === 0 || yearIndex === currentIndex) return prixM2;

  // Price in 2021 at index 0.97 → adjust to 2025 at index 1.0
  // adjusted = prix × (current / year) = prix × (1.0 / 0.97) = +3%
  return prixM2 * (currentIndex / yearIndex);
}

/**
 * Calculates the average temporal adjustment applied to comparables
 */
export function computeTemporalAdjustmentPct(
  comparables: ComparableForEstimation[]
): number | null {
  if (comparables.length === 0) return null;

  const adjustments = comparables.map((c) => {
    const year = new Date(c.date_mutation).getFullYear();
    const yearIndex = config.TEMPORAL_INDEX[year] ?? 1.0;
    const currentIndex = config.TEMPORAL_INDEX[2025] ?? 1.0;
    return ((currentIndex / yearIndex) - 1) * 100;
  });

  const avg = adjustments.reduce((a, b) => a + b, 0) / adjustments.length;
  return Math.abs(avg) < 0.1 ? null : Math.round(avg * 10) / 10;
}

// ─── Surface Elasticity ─────────────────────────────────────────────────────

/**
 * Adjusts price/m² for surface elasticity (larger units = lower price/m²).
 * Uses a log-linear model: adjustment = elasticity × ln(surface / refSurface)
 */
export function surfaceElasticityFactor(
  comparableSurface: number,
  targetSurface: number
): number {
  if (comparableSurface <= 0 || targetSurface <= 0) return 1.0;

  // If comparable is 40m² and target is 80m², the comparable's price/m²
  // is likely higher. We adjust downward.
  const ratio = targetSurface / comparableSurface;
  if (Math.abs(ratio - 1) < 0.05) return 1.0; // negligible difference

  const adjustment = config.SURFACE_ELASTICITY_COEFF * Math.log(ratio);
  // Clamp to ±15%
  return Math.max(0.85, Math.min(1.15, 1 + adjustment));
}

// ─── DPE Adjustment ─────────────────────────────────────────────────────────

export function computeDpeAdjustment(dpeClass: DpeClass | null): DpeAdjustment | null {
  if (!dpeClass) return null;

  const coefficient = config.DPE_COEFFICIENTS[dpeClass] ?? 1.0;
  const label = config.DPE_LABELS[dpeClass] ?? `DPE ${dpeClass}`;

  // Don't create an adjustment for the reference class
  if (coefficient === 1.0) return null;

  return { dpe_class: dpeClass, coefficient, label };
}

// ─── Confidence Scoring (improved) ──────────────────────────────────────────

interface ComparableForEstimation {
  prix_m2: number;
  date_mutation: string;
  distance: number;
  surface?: number;
}

function computeConfidence(
  comparables: ComparableForEstimation[],
  hasDpe: boolean
): {
  confidence: 'high' | 'medium' | 'low';
  confidence_score: number;
  confidence_factors: {
    count_score: number;
    cv_score: number;
    recency_score: number;
    proximity_score: number;
    dpe_score: number;
  };
} {
  const n = comparables.length;
  if (n === 0)
    return {
      confidence: 'low',
      confidence_score: 0,
      confidence_factors: { count_score: 0, cv_score: 0, recency_score: 0, proximity_score: 0, dpe_score: 0 },
    };

  // Volume: 0-30 points (was 40) — saturates at 15 comparables
  const count_score = Math.min(n / 15, 1) * 30;

  // Price coherence (CV): 0-25 points (was 30)
  const values = comparables.map((c) => c.prix_m2);
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  const cv = mean > 0 ? std / mean : 1;
  const cv_score = cv < 0.10 ? 25 : cv < 0.15 ? 20 : cv < 0.20 ? 15 : cv < 0.30 ? 8 : 0;

  // Recency: 0-20 points (was 30) — % of sales in last 2 years
  const recentCount = comparables.filter(
    (c) => new Date(c.date_mutation).getFullYear() >= 2024
  ).length;
  const recency_score = (recentCount / n) * 20;

  // NEW: Proximity spread — 0-15 points
  // Reward when comparables are close to target (avg distance < 500m = max)
  const avgDist = comparables.reduce((s, c) => s + c.distance, 0) / n;
  const proximity_score =
    avgDist < 300 ? 15 : avgDist < 500 ? 12 : avgDist < 800 ? 8 : avgDist < 1200 ? 4 : 0;

  // NEW: DPE availability — 0-10 points
  // Having DPE data means we can correct for energy performance
  const dpe_score = hasDpe ? 10 : 0;

  const score = Math.round(
    count_score + cv_score + recency_score + proximity_score + dpe_score
  );
  const confidence = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return {
    confidence,
    confidence_score: Math.min(score, 100),
    confidence_factors: {
      count_score: Math.round(count_score),
      cv_score: Math.round(cv_score),
      recency_score: Math.round(recency_score),
      proximity_score: Math.round(proximity_score),
      dpe_score: Math.round(dpe_score),
    },
  };
}

// ─── Backtest MAPE (Leave-One-Out Cross-Validation) ─────────────────────────

/**
 * Estimates the error margin using leave-one-out:
 * For each comparable, estimate its price using all OTHER comparables,
 * then measure the % error. Returns the median absolute % error (MAPE).
 */
export function computeErrorMargin(
  comparables: ComparableForEstimation[]
): number | null {
  if (comparables.length < 6) return null; // need enough data for LOO

  const errors: number[] = [];

  for (let i = 0; i < comparables.length; i++) {
    const target = comparables[i];
    const others = comparables.filter((_, j) => j !== i);

    const values = others.map((c) => c.prix_m2);
    const weights = others.map((c) => assignWeights(c.date_mutation, c.distance));

    const predicted = weightedPercentile(values, weights, 0.5);
    const actual = target.prix_m2;

    if (actual > 0) {
      errors.push(Math.abs((predicted - actual) / actual) * 100);
    }
  }

  if (errors.length === 0) return null;

  // Return median error (more robust than mean)
  errors.sort((a, b) => a - b);
  const mid = Math.floor(errors.length / 2);
  const mape =
    errors.length % 2 === 0
      ? (errors[mid - 1] + errors[mid]) / 2
      : errors[mid];

  return Math.round(mape);
}

// ─── Main Price Range Computation ───────────────────────────────────────────

export function computePriceRange(
  comparables: ComparableForEstimation[],
  surfaceM2: number | null,
  options?: {
    dpeClass?: DpeClass | null;
    applyTemporal?: boolean;
    applySurfaceElasticity?: boolean;
  }
): PriceEstimation {
  const opts = {
    dpeClass: null as DpeClass | null,
    applyTemporal: true,
    applySurfaceElasticity: true,
    ...options,
  };

  // Step 1: Apply temporal correction to each comparable's price
  let adjustedValues: number[];
  if (opts.applyTemporal) {
    adjustedValues = comparables.map((c) =>
      applyTemporalCorrection(c.prix_m2, c.date_mutation)
    );
  } else {
    adjustedValues = comparables.map((c) => c.prix_m2);
  }

  // Step 2: Apply surface elasticity (if target surface known)
  if (opts.applySurfaceElasticity && surfaceM2 && surfaceM2 > 0) {
    adjustedValues = adjustedValues.map((v, i) => {
      const compSurface = comparables[i].surface;
      if (compSurface && compSurface > 0) {
        return v * surfaceElasticityFactor(compSurface, surfaceM2);
      }
      return v;
    });
  }

  const weights = comparables.map((c) => assignWeights(c.date_mutation, c.distance));

  const low_per_m2 = weightedPercentile(adjustedValues, weights, 0.25);
  const median_per_m2 = weightedPercentile(adjustedValues, weights, 0.5);
  const high_per_m2 = weightedPercentile(adjustedValues, weights, 0.75);

  // Step 3: DPE adjustment
  const dpeAdj = computeDpeAdjustment(opts.dpeClass ?? null);
  const dpeFactor = dpeAdj?.coefficient ?? 1.0;

  const adjLow = low_per_m2 * dpeFactor;
  const adjMedian = median_per_m2 * dpeFactor;
  const adjHigh = high_per_m2 * dpeFactor;

  // Step 4: Confidence scoring
  const hasDpe = opts.dpeClass !== null && opts.dpeClass !== undefined;
  const { confidence, confidence_score, confidence_factors } = computeConfidence(
    comparables,
    hasDpe
  );

  // Step 5: Error margin (backtest)
  const error_margin_pct = computeErrorMargin(comparables);

  // Step 6: Temporal adjustment info
  const temporal_adjustment_pct = opts.applyTemporal
    ? computeTemporalAdjustmentPct(comparables)
    : null;

  return {
    low_per_m2: Math.round(adjLow),
    median_per_m2: Math.round(adjMedian),
    high_per_m2: Math.round(adjHigh),
    low_total: surfaceM2 ? Math.round(adjLow * surfaceM2) : null,
    median_total: surfaceM2 ? Math.round(adjMedian * surfaceM2) : null,
    high_total: surfaceM2 ? Math.round(adjHigh * surfaceM2) : null,
    comparable_count: comparables.length,
    confidence,
    confidence_score,
    confidence_factors,
    error_margin_pct,
    dpe_adjustment: dpeAdj,
    temporal_adjustment_pct,
  };
}

// ─── Apply Characteristics Coefficient ──────────────────────────────────────

export function applyCoefficient(
  estimation: PriceEstimation,
  coefficient: number
): PriceEstimation {
  if (coefficient === 1.0) return estimation;
  return {
    ...estimation,
    low_per_m2: Math.round(estimation.low_per_m2 * coefficient),
    median_per_m2: Math.round(estimation.median_per_m2 * coefficient),
    high_per_m2: Math.round(estimation.high_per_m2 * coefficient),
    low_total: estimation.low_total !== null ? Math.round(estimation.low_total * coefficient) : null,
    median_total: estimation.median_total !== null ? Math.round(estimation.median_total * coefficient) : null,
    high_total: estimation.high_total !== null ? Math.round(estimation.high_total * coefficient) : null,
  };
}
