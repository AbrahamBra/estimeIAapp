import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchAddress, type BanResult } from './ban';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('searchAddress', () => {
  it('returns parsed results from BAN API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              label: '15 Rue Cler 75007 Paris',
              postcode: '75007',
              citycode: '75107',
              city: 'Paris',
              housenumber: '15',
              street: 'Rue Cler',
              score: 0.97,
            },
            geometry: { coordinates: [2.305, 48.858] },
          },
        ],
      }),
    });

    const results = await searchAddress('15 rue cler paris');
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe('15 Rue Cler 75007 Paris');
    expect(results[0].lat).toBeCloseTo(48.858);
    expect(results[0].lon).toBeCloseTo(2.305);
    expect(results[0].postcode).toBe('75007');
  });

  it('returns empty array on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const results = await searchAddress('invalid');
    expect(results).toEqual([]);
  });

  it('returns empty for short queries', async () => {
    const results = await searchAddress('ab');
    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
