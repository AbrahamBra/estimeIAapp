import { config } from '$lib/config';
import { haversineDistance } from '$lib/utils/geo';
import type { Comparable } from '$lib/types';

interface FetchDvfParams {
  postcode: string;
  propertyType: 'Appartement' | 'Maison';
  lat: number;
  lon: number;
  radiusM: number;
  surfaceM2: number | null;
  rooms: number | null;
}

function getSurface(row: any): number | null {
  if (row.surface_reelle_bati) return row.surface_reelle_bati;
  const carrez = [
    row.lot1_surface_carrez,
    row.lot2_surface_carrez,
    row.lot3_surface_carrez,
    row.lot4_surface_carrez,
    row.lot5_surface_carrez,
  ].filter((s): s is number => s != null && s > 0);
  return carrez.length > 0 ? carrez.reduce((a, b) => a + b, 0) : null;
}

async function fetchPage(
  postcode: string,
  propertyType: string,
  page: number
): Promise<{ data: any[]; total: number }> {
  const url = new URL(
    `${config.DVF_API_BASE}/${config.DVF_RESOURCE_ID}/data/`
  );
  url.searchParams.set('code_postal__exact', postcode);
  url.searchParams.set('type_local__exact', propertyType);
  url.searchParams.set('nature_mutation__exact', 'Vente');
  url.searchParams.set('date_mutation__sort', 'desc');
  url.searchParams.set('page_size', '200');
  url.searchParams.set('page', String(page));

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`DVF API error: ${response.status}`);

  const json = await response.json();
  return { data: json.data ?? [], total: json.meta?.total ?? 0 };
}

function filterByIQR(comparables: Comparable[]): Comparable[] {
  if (comparables.length < 4) return comparables;

  const prices = comparables.map((c) => c.prix_m2).sort((a, b) => a - b);
  const q1 = prices[Math.floor(prices.length * 0.25)];
  const q3 = prices[Math.floor(prices.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - config.IQR_MULTIPLIER * iqr;
  const upper = q3 + config.IQR_MULTIPLIER * iqr;

  return comparables.filter((c) => c.prix_m2 >= lower && c.prix_m2 <= upper);
}

export async function fetchDvfComparables(params: FetchDvfParams): Promise<Comparable[]> {
  const { postcode, propertyType, lat, lon, radiusM, surfaceM2, rooms } = params;
  const seenMutations = new Map<string, Comparable>();

  for (let page = 1; page <= config.MAX_DVF_PAGES; page++) {
    const { data, total } = await fetchPage(postcode, propertyType, page);
    if (data.length === 0) break;

    for (const row of data) {
      if (!row.valeur_fonciere || row.valeur_fonciere < config.MIN_PRICE) continue;
      if (row.latitude == null || row.longitude == null) continue;

      const surface = getSurface(row);
      if (surface == null || surface <= 0) continue;

      // Absolute price/m² sanity bounds
      const prixM2 = row.valeur_fonciere / surface;
      if (prixM2 < config.MIN_PRICE_M2 || prixM2 > config.MAX_PRICE_M2) continue;

      if (surfaceM2 != null) {
        const tolerance = surfaceM2 * config.SURFACE_TOLERANCE;
        if (surface < surfaceM2 - tolerance || surface > surfaceM2 + tolerance) continue;
      }

      // Rooms filter: exact match, or 5+ means >= 5
      if (rooms != null && row.nombre_pieces_principales != null) {
        if (rooms >= 5) {
          if (row.nombre_pieces_principales < 5) continue;
        } else {
          if (row.nombre_pieces_principales !== rooms) continue;
        }
      }

      const distance = haversineDistance(lat, lon, row.latitude, row.longitude);
      if (distance > radiusM) continue;

      const isCovid = row.date_mutation >= config.COVID_START && row.date_mutation <= config.COVID_END;

      const comparable: Comparable = {
        id_mutation: row.id_mutation,
        date_mutation: row.date_mutation,
        valeur_fonciere: row.valeur_fonciere,
        address: `${row.adresse_numero ?? ''} ${row.adresse_nom_voie ?? ''}`.trim(),
        code_postal: row.code_postal,
        nom_commune: row.nom_commune,
        type_local: row.type_local,
        surface,
        rooms: row.nombre_pieces_principales,
        lat: row.latitude,
        lon: row.longitude,
        distance,
        prix_m2: prixM2,
        covid_period: isCovid,
      };

      const existing = seenMutations.get(row.id_mutation);
      if (existing) {
        if (
          row.type_local === propertyType &&
          (existing.type_local !== propertyType || surface > existing.surface)
        ) {
          seenMutations.set(row.id_mutation, comparable);
        }
      } else {
        seenMutations.set(row.id_mutation, comparable);
      }
    }

    const current = Array.from(seenMutations.values());
    if (current.length >= config.TARGET_COMPARABLES) break;
    if (page * 200 >= total) break;
  }

  const comparables = Array.from(seenMutations.values());
  if (comparables.length === 0) return [];

  return filterByIQR(comparables).sort((a, b) => a.distance - b.distance);
}
