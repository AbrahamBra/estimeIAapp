import { config } from '$lib/config';
import type { PermitRecord, PermitsResult } from '$lib/types';

interface SitadelRow {
  DATE_REELLE_AUTORISATION: string;
  TYPE_DAU: string;
  NB_LGT_TOT_CREES: number;
  NB_LGT_IND_CREES: number;
  NB_LGT_COL_CREES: number;
  SURF_HAB_CREEE: number;
  ADR_LIBVOIE_TER: string;
  ADR_LOCALITE_TER: string;
}

/**
 * Fetch real building permits from SITADEL via Tabular API.
 * Uses main commune code (e.g. 75056 for Paris).
 * Returns permits from the last 2 years.
 */
export async function fetchPermits(communeCode: string): Promise<PermitsResult | null> {
  try {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const dateFilter = twoYearsAgo.toISOString().slice(0, 10);

    const allRecords: SitadelRow[] = [];
    const maxPages = 3;

    for (let page = 1; page <= maxPages; page++) {
      const url = `${config.DVF_API_BASE}/${config.SITADEL_RESOURCE_ID}/data/?COMM__exact=${communeCode}&DATE_REELLE_AUTORISATION__greater=${dateFilter}&page=${page}&page_size=200`;
      const res = await fetch(url);
      if (!res.ok) break;

      const json = await res.json();
      const data = json.data as SitadelRow[] | undefined;
      if (!data || data.length === 0) break;

      allRecords.push(...data);
      if (data.length < 200) break;
    }

    if (allRecords.length === 0) return null;

    // Filter to authorized/started/completed permits (ETAT_DAU would be 4,5,6 but field is not always present)
    // Aggregate
    let totalLogements = 0;
    let totalInd = 0;
    let totalCol = 0;

    const permits: PermitRecord[] = [];

    for (const row of allRecords) {
      const nb = row.NB_LGT_TOT_CREES ?? 0;
      totalLogements += nb;
      totalInd += row.NB_LGT_IND_CREES ?? 0;
      totalCol += row.NB_LGT_COL_CREES ?? 0;

      permits.push({
        date: row.DATE_REELLE_AUTORISATION ?? '',
        type_dau: row.TYPE_DAU === 'DP' ? 'DP' : 'PC',
        nb_logements: nb,
        surface_hab: row.SURF_HAB_CREEE ?? 0,
        adresse: [row.ADR_LIBVOIE_TER, row.ADR_LOCALITE_TER].filter(Boolean).join(', ') || 'Adresse non renseignée',
      });
    }

    // Sort by date desc, keep top 5 for display
    permits.sort((a, b) => b.date.localeCompare(a.date));
    const topPermits = permits.slice(0, 5);

    const total_permits = allRecords.length;
    const totalLgtForPct = totalInd + totalCol || 1;

    const pression = total_permits < 5
      ? 'faible' as const
      : total_permits <= 20
        ? 'moyenne' as const
        : 'forte' as const;

    return {
      total_permits,
      total_logements: totalLogements,
      individual_pct: Math.round((totalInd / totalLgtForPct) * 100),
      collective_pct: Math.round((totalCol / totalLgtForPct) * 100),
      pression,
      permits: topPermits,
    };
  } catch {
    return null;
  }
}
