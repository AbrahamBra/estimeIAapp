import { config } from '$lib/config';
import type { RentEstimate } from '$lib/types';

interface LoyerRow {
  loypredm2: number;
  'lwr.IPm2': number;
  'upr.IPm2': number;
  nbobs_com: number;
}

/**
 * Fetch rent estimate from Carte des Loyers 2025 via Tabular API.
 * Uses arrondissement INSEE code (e.g. 75104 for Paris 4e).
 */
export async function fetchRentEstimate(
  inseeCode: string,
  propertyType: 'Appartement' | 'Maison',
  surfaceM2: number | null,
  medianPrixM2: number | null,
): Promise<RentEstimate | null> {
  try {
    const resourceId = propertyType === 'Appartement'
      ? config.LOYERS_APPART_RESOURCE_ID
      : config.LOYERS_MAISON_RESOURCE_ID;

    const url = `${config.DVF_API_BASE}/${resourceId}/data/?INSEE_C__exact=${inseeCode}&page_size=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const data = json.data as LoyerRow[] | undefined;
    if (!data || data.length === 0) return null;

    const row = data[0];
    const loyer_m2 = Math.round(row.loypredm2 * 100) / 100;
    const loyer_m2_low = Math.round(row['lwr.IPm2'] * 100) / 100;
    const loyer_m2_high = Math.round(row['upr.IPm2'] * 100) / 100;
    const source_annonces = row.nbobs_com ?? 0;

    const loyer_mensuel = surfaceM2 ? Math.round(loyer_m2 * surfaceM2) : null;
    const rendement_brut = medianPrixM2 && medianPrixM2 > 0
      ? Math.round(((loyer_m2 * 12) / medianPrixM2) * 1000) / 10
      : null;

    const fiabilite = source_annonces >= 200
      ? 'tres_fiable' as const
      : source_annonces >= 50
        ? 'fiable' as const
        : 'indicatif' as const;

    return {
      loyer_m2,
      loyer_m2_low,
      loyer_m2_high,
      loyer_mensuel,
      rendement_brut,
      source_annonces,
      fiabilite,
    };
  } catch {
    return null;
  }
}
