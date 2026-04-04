import { describe, it, expect } from 'vitest';
import { haversineDistance, filterByRadius } from './geo';

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance(48.858, 2.305, 48.858, 2.305)).toBe(0);
  });

  it('computes distance between Eiffel Tower and Arc de Triomphe (~1.7km)', () => {
    const d = haversineDistance(48.8584, 2.2945, 48.8738, 2.295);
    expect(d).toBeGreaterThan(1500);
    expect(d).toBeLessThan(2000);
  });

  it('computes distance between Paris and Lyon (~390km)', () => {
    const d = haversineDistance(48.8566, 2.3522, 45.764, 4.8357);
    expect(d).toBeGreaterThan(380_000);
    expect(d).toBeLessThan(400_000);
  });
});

describe('filterByRadius', () => {
  const items = [
    { lat: 48.858, lon: 2.305, id: 'close' },
    { lat: 48.860, lon: 2.307, id: 'medium' },
    { lat: 48.870, lon: 2.320, id: 'far' },
  ];

  it('filters items within radius', () => {
    const result = filterByRadius(items, 48.858, 2.305, 500);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.item.id)).toContain('close');
    expect(result.map(r => r.item.id)).toContain('medium');
  });

  it('returns distance with each item', () => {
    const result = filterByRadius(items, 48.858, 2.305, 5000);
    expect(result[0].distance).toBeLessThan(result[1].distance);
  });

  it('returns empty array when nothing is in radius', () => {
    const result = filterByRadius(items, 48.858, 2.305, 1);
    expect(result.length).toBeLessThanOrEqual(1);
  });
});
