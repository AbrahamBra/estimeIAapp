import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDvfComparables } from './dvf';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeDvfRow(overrides: Record<string, any> = {}) {
  return {
    id_mutation: 'mut-1',
    date_mutation: '2025-03-15',
    nature_mutation: 'Vente',
    valeur_fonciere: 500000,
    adresse_numero: '15',
    adresse_nom_voie: 'Rue Cler',
    code_postal: '75007',
    nom_commune: 'Paris',
    code_departement: '75',
    type_local: 'Appartement',
    surface_reelle_bati: 50,
    nombre_pieces_principales: 2,
    latitude: 48.858,
    longitude: 2.305,
    lot1_surface_carrez: null,
    lot2_surface_carrez: null,
    lot3_surface_carrez: null,
    lot4_surface_carrez: null,
    lot5_surface_carrez: null,
    ...overrides,
  };
}

function mockPage(rows: any[], total: number = rows.length) {
  return {
    ok: true,
    json: async () => ({ data: rows, meta: { total } }),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('fetchDvfComparables', () => {
  it('fetches and filters DVF data within radius', async () => {
    const rows = [
      makeDvfRow({ latitude: 48.858, longitude: 2.305 }),
      makeDvfRow({ id_mutation: 'mut-2', latitude: 49.0, longitude: 3.0 }),
    ];
    mockFetch.mockResolvedValueOnce(mockPage(rows, 2));

    const result = await fetchDvfComparables({
      postcode: '75007',
      propertyType: 'Appartement',
      lat: 48.858,
      lon: 2.305,
      radiusM: 1000,
      surfaceM2: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id_mutation).toBe('mut-1');
  });

  it('deduplicates by id_mutation keeping matching type_local', async () => {
    const rows = [
      makeDvfRow({ id_mutation: 'mut-dup', type_local: 'Appartement', surface_reelle_bati: 50 }),
      makeDvfRow({ id_mutation: 'mut-dup', type_local: 'Dépendance', surface_reelle_bati: 10 }),
    ];
    mockFetch.mockResolvedValueOnce(mockPage(rows, 2));

    const result = await fetchDvfComparables({
      postcode: '75007',
      propertyType: 'Appartement',
      lat: 48.858,
      lon: 2.305,
      radiusM: 1000,
      surfaceM2: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].surface).toBe(50);
  });

  it('excludes transactions with valeur_fonciere < 10000', async () => {
    const rows = [
      makeDvfRow({ valeur_fonciere: 100, latitude: 48.858, longitude: 2.305 }),
    ];
    mockFetch.mockResolvedValueOnce(mockPage(rows, 1));

    const result = await fetchDvfComparables({
      postcode: '75007',
      propertyType: 'Appartement',
      lat: 48.858,
      lon: 2.305,
      radiusM: 1000,
      surfaceM2: null,
    });

    expect(result).toHaveLength(0);
  });

  it('paginates when not enough comparables', async () => {
    const page1Rows = [
      makeDvfRow({ latitude: 48.858, longitude: 2.305 }),
      ...Array.from({ length: 199 }, (_, i) =>
        makeDvfRow({ id_mutation: `far-${i}`, latitude: 49.0, longitude: 3.0 })
      ),
    ];
    const page2Rows = Array.from({ length: 5 }, (_, i) =>
      makeDvfRow({
        id_mutation: `close-${i}`,
        latitude: 48.8585,
        longitude: 2.306,
      })
    );

    mockFetch
      .mockResolvedValueOnce(mockPage(page1Rows, 500))
      .mockResolvedValueOnce(mockPage(page2Rows, 500))
      .mockResolvedValueOnce(mockPage([], 500));

    const result = await fetchDvfComparables({
      postcode: '75007',
      propertyType: 'Appartement',
      lat: 48.858,
      lon: 2.305,
      radiusM: 1000,
      surfaceM2: null,
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  it('filters by surface tolerance when surfaceM2 provided', async () => {
    const rows = [
      makeDvfRow({ surface_reelle_bati: 60, latitude: 48.858, longitude: 2.305 }),
      makeDvfRow({ id_mutation: 'mut-big', surface_reelle_bati: 200, latitude: 48.858, longitude: 2.305 }),
    ];
    mockFetch.mockResolvedValueOnce(mockPage(rows, 2));

    const result = await fetchDvfComparables({
      postcode: '75007',
      propertyType: 'Appartement',
      lat: 48.858,
      lon: 2.305,
      radiusM: 1000,
      surfaceM2: 50,
    });

    expect(result).toHaveLength(1);
    expect(result[0].surface).toBe(60);
  });
});
