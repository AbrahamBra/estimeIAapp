import { describe, it, expect } from 'vitest';
import {
  computeCharacteristicsCoefficient,
  parseCharacteristics,
  COEFFICIENTS_VERSION,
} from './coefficients';
import type { PropertyCharacteristics } from '$lib/types';

const NULL_CHARS: PropertyCharacteristics = {
  floor: null, elevator: null, outdoor: null, view: null,
  exposure: null, condition: null, parking: null, noise: null, pool: null,
};

describe('computeCharacteristicsCoefficient', () => {
  it('returns 1.0 for all null characteristics', () => {
    const result = computeCharacteristicsCoefficient(NULL_CHARS, 'Appartement');
    expect(result.coefficient).toBe(1.0);
    expect(result.breakdown).toHaveLength(0);
  });

  it('has a version string', () => {
    expect(COEFFICIENTS_VERSION).toBe('2026-04-v1');
  });

  it('applies RDC coefficient 0.85', () => {
    const chars = { ...NULL_CHARS, floor: 'rdc' as const };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(0.85);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].label).toContain('RDC');
  });

  it('applies floor 3-4 as reference (1.00)', () => {
    const chars = { ...NULL_CHARS, floor: '3-4' as const };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBe(1.0);
    expect(result.breakdown).toHaveLength(0);
  });

  it('applies last floor with elevator 1.17', () => {
    const chars = { ...NULL_CHARS, floor: 'last' as const, elevator: true };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(1.17);
  });

  it('applies last floor without elevator 0.90', () => {
    const chars = { ...NULL_CHARS, floor: 'last' as const, elevator: false };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(0.90);
  });

  it('applies 5+ with elevator 1.08', () => {
    const chars = { ...NULL_CHARS, floor: '5+' as const, elevator: true };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(1.08);
  });

  it('applies 5+ without elevator 0.85', () => {
    const chars = { ...NULL_CHARS, floor: '5+' as const, elevator: false };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(0.85);
  });

  it('applies last floor with null elevator as without (0.90)', () => {
    const chars = { ...NULL_CHARS, floor: 'last' as const, elevator: null };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(0.90);
  });

  it('ignores elevator when floor is RDC', () => {
    const chars = { ...NULL_CHARS, floor: 'rdc' as const, elevator: true };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(0.85);
    expect(result.breakdown).toHaveLength(1);
  });

  it('ignores elevator when floor is 1-2', () => {
    const chars = { ...NULL_CHARS, floor: '1-2' as const, elevator: true };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(0.95);
  });

  it('ignores elevator when floor is null', () => {
    const chars = { ...NULL_CHARS, elevator: true };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBe(1.0);
    expect(result.breakdown).toHaveLength(0);
  });

  it('applies terrace coefficient 1.10', () => {
    const chars = { ...NULL_CHARS, outdoor: 'terrace' as const };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(1.10);
  });

  it('applies panoramic view 1.15', () => {
    const chars = { ...NULL_CHARS, view: 'panoramic' as const };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(1.15);
  });

  it('applies south exposure 1.07', () => {
    const chars = { ...NULL_CHARS, exposure: 'south' as const };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(1.07);
  });

  it('applies to-renovate condition 0.70', () => {
    const chars = { ...NULL_CHARS, condition: 'to-renovate' as const };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(0.70);
  });

  it('applies noisy 0.88', () => {
    const chars = { ...NULL_CHARS, noise: 'noisy' as const };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBeCloseTo(0.88);
  });

  it('applies pool for Maison 1.17', () => {
    const chars = { ...NULL_CHARS, pool: true };
    const result = computeCharacteristicsCoefficient(chars, 'Maison');
    expect(result.coefficient).toBeCloseTo(1.17);
  });

  it('ignores pool for Appartement', () => {
    const chars = { ...NULL_CHARS, pool: true };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBe(1.0);
    expect(result.breakdown).toHaveLength(0);
  });

  it('multiplies coefficients for multiple characteristics', () => {
    const chars = {
      ...NULL_CHARS,
      floor: 'last' as const,
      elevator: true,
      outdoor: 'terrace' as const,
      view: 'clear' as const,
    };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    // 1.17 * 1.10 * 1.07 = 1.37709
    expect(result.coefficient).toBeCloseTo(1.17 * 1.10 * 1.07, 2);
    expect(result.breakdown).toHaveLength(3);
  });

  it('caps at 1.40 when all bonuses stacked', () => {
    const chars: PropertyCharacteristics = {
      floor: 'last', elevator: true,
      outdoor: 'garden',
      view: 'panoramic',
      exposure: 'dual',
      condition: 'like-new',
      parking: 'box',
      noise: 'very-quiet',
      pool: true,
    };
    const result = computeCharacteristicsCoefficient(chars, 'Maison');
    expect(result.coefficient).toBe(1.40);
  });

  it('floors at 0.65 when all penalties stacked', () => {
    const chars: PropertyCharacteristics = {
      floor: 'rdc',
      elevator: null,
      outdoor: 'none',
      view: 'vis-a-vis',
      exposure: 'north',
      condition: 'to-renovate',
      parking: 'none',
      noise: 'noisy',
      pool: null,
    };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBe(0.65);
  });

  it('is deterministic for same inputs', () => {
    const chars = { ...NULL_CHARS, floor: 'last' as const, elevator: true, view: 'clear' as const };
    const r1 = computeCharacteristicsCoefficient(chars, 'Appartement');
    const r2 = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(r1.coefficient).toBe(r2.coefficient);
    expect(r1.breakdown).toEqual(r2.breakdown);
  });

  it('does not add breakdown entry for reference values', () => {
    const chars = {
      ...NULL_CHARS,
      floor: '3-4' as const,
      outdoor: 'none' as const,
      exposure: 'east-west' as const,
      condition: 'good' as const,
      parking: 'none' as const,
      noise: 'normal' as const,
    };
    const result = computeCharacteristicsCoefficient(chars, 'Appartement');
    expect(result.coefficient).toBe(1.0);
    expect(result.breakdown).toHaveLength(0);
  });
});

describe('parseCharacteristics', () => {
  it('parses valid query params', () => {
    const params = new URLSearchParams('floor=last&elevator=true&outdoor=terrace&view=clear');
    const chars = parseCharacteristics(params);
    expect(chars.floor).toBe('last');
    expect(chars.elevator).toBe(true);
    expect(chars.outdoor).toBe('terrace');
    expect(chars.view).toBe('clear');
    expect(chars.exposure).toBeNull();
  });

  it('returns all null for empty params', () => {
    const chars = parseCharacteristics(new URLSearchParams());
    expect(chars).toEqual({
      floor: null, elevator: null, outdoor: null, view: null,
      exposure: null, condition: null, parking: null, noise: null, pool: null,
    });
  });

  it('ignores invalid values', () => {
    const params = new URLSearchParams('floor=basement&view=ocean');
    const chars = parseCharacteristics(params);
    expect(chars.floor).toBeNull();
    expect(chars.view).toBeNull();
  });

  it('parses boolean elevator and pool', () => {
    const params = new URLSearchParams('elevator=false&pool=true');
    const chars = parseCharacteristics(params);
    expect(chars.elevator).toBe(false);
    expect(chars.pool).toBe(true);
  });
});
