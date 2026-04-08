import type { PageServerLoad } from './$types';
import { config } from '$lib/config';
import type { YearlyTrend } from '$lib/types';

interface CommuneGeo {
  nom: string;
  code: string;
  codesPostaux: string[];
  population: number;
  departement: { code: string; nom: string };
  region: { code: string; nom: string };
}

async function findCommune(villeSlug: string): Promise<CommuneGeo | null> {
  // Convert slug back to search query: "lyon-6eme" → "lyon 6eme"
  const query = villeSlug.replace(/-/g, ' ');

  const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,population,departement,region&limit=1`;
  const resp = await fetch(url);
  if (!resp.ok) return null;

  const data: CommuneGeo[] = await resp.json();
  return data[0] ?? null;
}

async function fetchCommuneStats(postcode: string): Promise<{
  medianPrixM2Appart: number | null;
  medianPrixM2Maison: number | null;
  totalSales: number;
  trend: YearlyTrend[];
}> {
  // Fetch recent DVF sales for the commune
  const url = new URL(`${config.DVF_API_BASE}/${config.DVF_RESOURCE_ID}/data/`);
  url.searchParams.set('code_postal__exact', postcode);
  url.searchParams.set('nature_mutation__exact', 'Vente');
  url.searchParams.set('date_mutation__sort', 'desc');
  url.searchParams.set('page_size', '200');

  const resp = await fetch(url.toString());
  if (!resp.ok) return { medianPrixM2Appart: null, medianPrixM2Maison: null, totalSales: 0, trend: [] };

  const json = await resp.json();
  const rows: any[] = json.data ?? [];

  const apparts: number[] = [];
  const maisons: number[] = [];
  const byYear = new Map<number, number[]>();

  for (const row of rows) {
    if (!row.valeur_fonciere || !row.surface_reelle_bati || row.surface_reelle_bati <= 0) continue;
    const prixM2 = row.valeur_fonciere / row.surface_reelle_bati;
    if (prixM2 < config.MIN_PRICE_M2 || prixM2 > config.MAX_PRICE_M2) continue;

    if (row.type_local === 'Appartement') apparts.push(prixM2);
    else if (row.type_local === 'Maison') maisons.push(prixM2);

    const year = new Date(row.date_mutation).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(prixM2);
  }

  function median(arr: number[]): number | null {
    if (arr.length === 0) return null;
    arr.sort((a, b) => a - b);
    const mid = Math.floor(arr.length / 2);
    return Math.round(arr.length % 2 === 0 ? (arr[mid - 1] + arr[mid]) / 2 : arr[mid]);
  }

  const trend: YearlyTrend[] = [...byYear.entries()]
    .map(([year, prices]) => ({
      year,
      median_prix_m2: median(prices)!,
      count: prices.length,
    }))
    .filter(t => t.median_prix_m2 !== null)
    .sort((a, b) => a.year - b.year);

  return {
    medianPrixM2Appart: median(apparts),
    medianPrixM2Maison: median(maisons),
    totalSales: rows.length,
    trend,
  };
}

export const load: PageServerLoad = async ({ params }) => {
  const villeSlug = params.ville;
  const commune = await findCommune(villeSlug);

  if (!commune) {
    return {
      villeSlug,
      commune: null,
      stats: null,
    };
  }

  const postcode = commune.codesPostaux[0] ?? '';
  const stats = postcode ? await fetchCommuneStats(postcode) : null;

  return {
    villeSlug,
    commune,
    stats,
  };
};
