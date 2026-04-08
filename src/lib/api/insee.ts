const API_GEO = 'https://geo.api.gouv.fr';

/**
 * Convert postcode to arrondissement code for APIs that use them (API Geo, Carte des Loyers).
 * Paris: 75004 → 75104, Lyon: 69003 → 69383, Marseille: 13005 → 13205.
 */
export function postcodeToArrondissement(postcode: string): string {
  const dept = postcode.substring(0, 2);
  const suffix = parseInt(postcode.substring(2));

  if (dept === '75') return `751${postcode.substring(3).padStart(2, '0')}`;
  if (dept === '69' && suffix >= 1 && suffix <= 9) return `6938${suffix}`;
  if (dept === '13' && suffix >= 1 && suffix <= 16) return `132${suffix.toString().padStart(2, '0')}`;

  return postcode;
}

/**
 * Convert postcode to main commune code for APIs that use them (SITADEL, Hub'Eau, Fiscalité).
 * Paris: 75XXX → 75056, Lyon: 690XX → 69123, Marseille: 130XX → 13055.
 */
export function postcodeToMainCommune(postcode: string): string {
  const dept = postcode.substring(0, 2);
  if (dept === '75') return '75056';
  if (dept === '69' && parseInt(postcode.substring(2)) <= 9) return '69123';
  if (dept === '13' && parseInt(postcode.substring(2)) <= 16) return '13055';
  return postcode;
}

/**
 * Resolve postcode to INSEE commune code via API Géo.
 * For Paris/Lyon/Marseille, returns the arrondissement code.
 * For other communes, queries the API.
 */
export async function postcodeToInsee(postcode: string): Promise<string> {
  const dept = postcode.substring(0, 2);

  // Multi-arrondissement cities: return arrondissement code directly
  if (dept === '75' || (dept === '69' && parseInt(postcode.substring(2)) <= 9) || (dept === '13' && parseInt(postcode.substring(2)) <= 16)) {
    return postcodeToArrondissement(postcode);
  }

  // Other communes: query API Géo
  try {
    const res = await fetch(`${API_GEO}/communes?codePostal=${postcode}&fields=code&limit=1`);
    if (!res.ok) return postcode;
    const arr = await res.json();
    if (arr.length > 0) return arr[0].code;
  } catch {
    // fallback
  }
  return postcode;
}
