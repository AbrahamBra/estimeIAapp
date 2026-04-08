import type { CommuneContext } from '$lib/types';
import { postcodeToArrondissement, postcodeToMainCommune } from './insee';

const API_GEO = 'https://geo.api.gouv.fr';
const HUBEAU_API = 'https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable';
const FISCAL_API = 'https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/fiscalite-locale-des-particuliers/records';

async function fetchPopulation(postcode: string): Promise<{ population: number | null; density: number | null }> {
  try {
    const code = postcodeToArrondissement(postcode);
    const res = await fetch(`${API_GEO}/communes/${code}?fields=population,surface`);
    if (!res.ok) {
      // Fallback: search by postal code
      const res2 = await fetch(`${API_GEO}/communes?codePostal=${postcode}&fields=population,surface&limit=1`);
      if (!res2.ok) return { population: null, density: null };
      const arr = await res2.json();
      if (!arr.length) return { population: null, density: null };
      const d = arr[0];
      const density = d.population && d.surface ? Math.round(d.population / (d.surface / 100)) : null;
      return { population: d.population ?? null, density };
    }
    const d = await res.json();
    // surface is in hectares, convert to km²
    const density = d.population && d.surface ? Math.round(d.population / (d.surface / 100)) : null;
    return { population: d.population ?? null, density };
  } catch {
    return { population: null, density: null };
  }
}

async function fetchTaxRates(postcode: string): Promise<{ taxe_fonciere: number | null; teom: number | null }> {
  try {
    const insee = postcodeToMainCommune(postcode);
    const url = `${FISCAL_API}?where=insee_com="${insee}"&order_by=exercice DESC&limit=1&select=taux_global_tfb,taux_plein_teom`;
    const res = await fetch(url);
    if (!res.ok) return { taxe_fonciere: null, teom: null };
    const json = await res.json();
    const record = json.results?.[0];
    if (!record) return { taxe_fonciere: null, teom: null };
    return {
      taxe_fonciere: record.taux_global_tfb ?? null,
      teom: record.taux_plein_teom ?? null,
    };
  } catch {
    return { taxe_fonciere: null, teom: null };
  }
}

async function fetchWaterQuality(postcode: string): Promise<{
  water_quality: 'conforme' | 'non_conforme' | null;
  water_analyses: number | null;
  water_conform_pct: number | null;
}> {
  try {
    const insee = postcodeToMainCommune(postcode);
    const url = `${HUBEAU_API}/resultats_dis?code_commune=${insee}&size=100&fields=conclusion_conformite_limites_bact_prelevement,conclusion_conformite_limites_pc_prelevement&sort=desc`;
    const res = await fetch(url);
    if (!res.ok) return { water_quality: null, water_analyses: null, water_conform_pct: null };
    const json = await res.json();
    const data = json.data ?? [];
    if (data.length === 0) return { water_quality: null, water_analyses: null, water_conform_pct: null };

    let conform = 0;
    let total = 0;
    for (const d of data) {
      const bact = d.conclusion_conformite_limites_bact_prelevement;
      const pc = d.conclusion_conformite_limites_pc_prelevement;
      if (bact != null) { total++; if (bact === 'C') conform++; }
      if (pc != null) { total++; if (pc === 'C') conform++; }
    }

    const pct = total > 0 ? Math.round((conform / total) * 100) : null;
    return {
      water_quality: pct !== null ? (pct >= 95 ? 'conforme' : 'non_conforme') : null,
      water_analyses: total,
      water_conform_pct: pct,
    };
  } catch {
    return { water_quality: null, water_analyses: null, water_conform_pct: null };
  }
}

/**
 * Fetch commune context: population, tax rates, and water quality in parallel.
 */
export async function fetchCommuneContext(postcode: string): Promise<CommuneContext> {
  const [pop, tax, water] = await Promise.all([
    fetchPopulation(postcode),
    fetchTaxRates(postcode),
    fetchWaterQuality(postcode),
  ]);

  return {
    ...pop,
    ...tax,
    ...water,
  };
}
