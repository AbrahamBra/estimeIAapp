import { describe, it, expect } from 'vitest';
import {
  removeOutliers,
  assignWeights,
  weightedPercentile,
  computePriceRange,
} from './estimation';

describe('removeOutliers', () => {
  it('removes values beyond 2 std devs', () => {
    const values = [100, 102, 98, 101, 99, 500];
    const result = removeOutliers(values, 2);
    expect(result).not.toContain(500);
    expect(result).toHaveLength(5);
  });

  it('keeps all values when no outliers', () => {
    const values = [100, 102, 98, 101, 99];
    const result = removeOutliers(values, 2);
    expect(result).toHaveLength(5);
  });

  it('handles empty array', () => {
    expect(removeOutliers([], 2)).toEqual([]);
  });
});

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
    expect(result.confidence).toBe('high');
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

  it('returns low confidence for < 3 comparables', () => {
    const comparables = [
      { prix_m2: 10000, date_mutation: '2025-01-01', distance: 300 },
      { prix_m2: 11000, date_mutation: '2025-01-01', distance: 300 },
    ];
    const result = computePriceRange(comparables, 60);
    expect(result.confidence).toBe('low');
  });
});
