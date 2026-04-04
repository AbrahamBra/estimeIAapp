import { describe, it, expect } from 'vitest';
import {
  assignWeights,
  weightedPercentile,
  computePriceRange,
} from './estimation';

describe('assignWeights', () => {
  it('weights 2025 sales higher than 2023', () => {
    const w2025 = assignWeights('2025-06-01', 100);
    const w2023 = assignWeights('2023-06-01', 100);
    expect(w2025).toBeGreaterThan(w2023);
  });

  it('weights closer sales higher', () => {
    const wClose = assignWeights('2025-01-01', 100);
    const wFar = assignWeights('2025-01-01', 1500);
    expect(wClose).toBeGreaterThan(wFar);
  });
});

describe('weightedPercentile', () => {
  it('returns median for equal weights', () => {
    const values = [10, 20, 30, 40, 50];
    const weights = [1, 1, 1, 1, 1];
    const median = weightedPercentile(values, weights, 0.5);
    expect(median).toBe(30);
  });

  it('skews toward heavier weights', () => {
    const values = [10, 20];
    const weights = [1, 9];
    const median = weightedPercentile(values, weights, 0.5);
    expect(median).toBeGreaterThan(15);
  });

  it('returns single value for single item', () => {
    expect(weightedPercentile([42], [1], 0.5)).toBe(42);
  });
});

describe('computePriceRange', () => {
  it('computes low/median/high with surface', () => {
    const comparables = Array.from({ length: 10 }, (_, i) => ({
      prix_m2: 9000 + i * 200,
      date_mutation: '2025-01-01',
      distance: 300,
    }));
    const result = computePriceRange(comparables, 60);
    expect(result.median_per_m2).toBeGreaterThan(0);
    expect(result.low_per_m2).toBeLessThan(result.median_per_m2);
    expect(result.high_per_m2).toBeGreaterThan(result.median_per_m2);
    expect(result.median_total).toBe(result.median_per_m2 * 60);
  });

  it('returns null totals when no surface', () => {
    const comparables = Array.from({ length: 10 }, () => ({
      prix_m2: 10000,
      date_mutation: '2025-01-01',
      distance: 300,
    }));
    const result = computePriceRange(comparables, null);
    expect(result.median_per_m2).toBe(10000);
    expect(result.median_total).toBeNull();
  });

  it('computes confidence score with factors', () => {
    const comparables = Array.from({ length: 15 }, () => ({
      prix_m2: 10000,
      date_mutation: '2025-01-01',
      distance: 300,
    }));
    const result = computePriceRange(comparables, 60);
    expect(result.confidence_score).toBeGreaterThan(0);
    expect(result.confidence_score).toBeLessThanOrEqual(100);
    expect(result.confidence_factors.count_score).toBe(40);
    expect(result.confidence_factors.recency_score).toBe(30);
    expect(result.confidence).toBe('high');
  });

  it('returns low confidence for few old comparables', () => {
    const comparables = [
      { prix_m2: 10000, date_mutation: '2021-01-01', distance: 800 },
      { prix_m2: 15000, date_mutation: '2020-06-01', distance: 900 },
    ];
    const result = computePriceRange(comparables, 60);
    expect(result.confidence).toBe('low');
    expect(result.confidence_score).toBeLessThan(40);
  });

  it('penalizes high price variance', () => {
    const tight = Array.from({ length: 10 }, () => ({
      prix_m2: 10000,
      date_mutation: '2025-01-01',
      distance: 300,
    }));
    const spread = Array.from({ length: 10 }, (_, i) => ({
      prix_m2: 5000 + i * 2000,
      date_mutation: '2025-01-01',
      distance: 300,
    }));
    const tightResult = computePriceRange(tight, 60);
    const spreadResult = computePriceRange(spread, 60);
    expect(tightResult.confidence_score).toBeGreaterThan(spreadResult.confidence_score);
  });
});
