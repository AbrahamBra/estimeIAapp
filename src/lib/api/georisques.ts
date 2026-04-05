import type { RiskResult } from '$lib/types';

const GEORISQUES_API = 'https://georisques.gouv.fr/api/v1';

/**
 * Convert postcode to INSEE commune code.
 * Paris arrondissements: 75001→75101, 75002→75102, etc.
 * Lyon: 69001→69381, etc. Marseille: 13001→13201, etc.
 * Other communes: postcode ≈ INSEE code (approximation, works for most).
 */
function postcodeToInsee(postcode: string): string {
  const dept = postcode.substring(0, 2);
  const suffix = parseInt(postcode.substring(2));

  if (dept === '75') return `751${postcode.substring(3).padStart(2, '0')}`;
  if (dept === '69' && suffix >= 1 && suffix <= 9) return `6938${suffix}`;
  if (dept === '13' && suffix >= 1 && suffix <= 16) return `132${suffix.toString().padStart(2, '0')}`;

  // For most communes, use the main commune code
  // This is an approximation; exact mapping would need a lookup table
  return postcode;
}

/**
 * Fetch natural and technological risks for a commune via Georisques API.
 */
export async function fetchRisks(postcode: string): Promise<RiskResult | null> {
  // For Paris, Lyon, Marseille — use the main commune code
  const dept = postcode.substring(0, 2);
  const mainInsee =
    dept === '75' ? '75056' :
    dept === '69' && parseInt(postcode.substring(2)) <= 9 ? '69123' :
    dept === '13' && parseInt(postcode.substring(2)) <= 16 ? '13055' :
    postcode;

  try {
    // Fetch risks + catnat in parallel
    const [risksRes, catnatRes] = await Promise.all([
      fetch(`${GEORISQUES_API}/gaspar/risques?code_insee=${mainInsee}`),
      fetch(`${GEORISQUES_API}/gaspar/catnat?code_insee=${mainInsee}&page=1&page_size=100`),
    ]);

    if (!risksRes.ok) return null;

    const risksData = await risksRes.json();
    const catnatData = catnatRes.ok ? await catnatRes.json() : { data: [], results: 0 };

    const risks: string[] = [];
    if (risksData.data?.[0]?.risques_detail) {
      for (const r of risksData.data[0].risques_detail) {
        risks.push(r.libelle_risque_long);
      }
    }

    // Aggregate catnat by type
    const catnatTypes: Record<string, number> = {};
    if (catnatData.data) {
      for (const c of catnatData.data) {
        const label = c.libelle_risque_jo;
        catnatTypes[label] = (catnatTypes[label] || 0) + 1;
      }
    }

    return {
      commune: risksData.data?.[0]?.libelle_commune ?? '',
      risks,
      catnat_count: catnatData.results || 0,
      catnat_types: catnatTypes,
    };
  } catch {
    return null;
  }
}
