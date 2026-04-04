import { describe, it, expect, vi } from 'vitest';

vi.mock('node:fs', () => {
  const data = JSON.stringify([
    { lat: 48.858, lon: 2.305, type: 'C101', category: 'schools', name: 'Ecole X' },
    { lat: 48.859, lon: 2.306, type: 'B201', category: 'shops', name: 'Boulangerie Y' },
    { lat: 49.000, lon: 3.000, type: 'D101', category: 'health', name: 'Dr Z' },
  ]);
  const mock = {
    readFileSync: () => data,
    existsSync: () => true,
  };
  return { ...mock, default: mock };
});

import { lookupProximity } from './proximity';

describe('lookupProximity', () => {
  it('returns items within 1km grouped by category', () => {
    const result = lookupProximity('75', 48.858, 2.305, 1000);
    expect(result.schools.count).toBeGreaterThanOrEqual(1);
    expect(result.shops.count).toBeGreaterThanOrEqual(1);
    expect(result.health.count).toBe(0);
  });

  it('returns closest distance per category', () => {
    const result = lookupProximity('75', 48.858, 2.305, 1000);
    expect(result.schools.closest_m).toBeGreaterThanOrEqual(0);
  });
});
