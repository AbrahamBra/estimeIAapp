import type { DpeResult } from '$lib/types';

const DPE_API_BASE = 'https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant';

const DPE_SELECT = [
  'etiquette_dpe',
  'etiquette_ges',
  'conso_5_usages_par_m2_ep',
  'emission_ges_5_usages_par_m2',
  'annee_construction',
  'surface_habitable_logement',
  'adresse_ban',
].join(',');

/**
 * Fetch DPE diagnostics near an address using text search + postal code.
 * Returns aggregated DPE stats for the neighborhood (distribution + dominant class).
 */
export async function fetchDpeNearby(
  address: string,
  postcode: string
): Promise<DpeResult | null> {
  // Extract street name from full address for search
  const streetParts = address.replace(postcode, '').replace(/paris|lyon|marseille/i, '').trim();
  const query = `${streetParts} ${postcode}`.trim();

  const url = new URL(`${DPE_API_BASE}/lines`);
  url.searchParams.set('size', '20');
  url.searchParams.set('select', DPE_SELECT);
  url.searchParams.set('q', query);
  url.searchParams.set('q_mode', 'simple');
  url.searchParams.set('qs', `code_postal_ban:${postcode}`);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const dpeDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
    const gesDist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
    let totalConso = 0;
    let totalGes = 0;
    let consoCount = 0;
    let gesCount = 0;

    for (const r of data.results) {
      if (r.etiquette_dpe && dpeDist[r.etiquette_dpe] !== undefined) {
        dpeDist[r.etiquette_dpe]++;
      }
      if (r.etiquette_ges && gesDist[r.etiquette_ges] !== undefined) {
        gesDist[r.etiquette_ges]++;
      }
      if (typeof r.conso_5_usages_par_m2_ep === 'number') {
        totalConso += r.conso_5_usages_par_m2_ep;
        consoCount++;
      }
      if (typeof r.emission_ges_5_usages_par_m2 === 'number') {
        totalGes += r.emission_ges_5_usages_par_m2;
        gesCount++;
      }
    }

    // Find dominant DPE class
    const dominantDpe = (Object.entries(dpeDist) as [string, number][])
      .sort((a, b) => b[1] - a[1])[0][0] as DpeResult['dominant_dpe'];

    const dominantGes = (Object.entries(gesDist) as [string, number][])
      .sort((a, b) => b[1] - a[1])[0][0] as DpeResult['dominant_ges'];

    return {
      count: data.results.length,
      dominant_dpe: dominantDpe,
      dominant_ges: dominantGes,
      avg_conso_m2: consoCount > 0 ? Math.round(totalConso / consoCount) : null,
      avg_ges_m2: gesCount > 0 ? Math.round(totalGes / gesCount) : null,
      distribution: dpeDist,
    };
  } catch {
    return null;
  }
}
