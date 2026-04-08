import { config } from '$lib/config';
import type { CoproprieteResult } from '$lib/types';

interface RnicRow {
  nom_usage_copropriete: string;
  nombre_total_lots: number;
  nombre_lots_habitation: number;
  nombre_lots_stationnement: number;
  periode_construction: string;
  type_syndic: string;
}

const PERIODE_LABELS: Record<string, string> = {
  'AVANT_1949': 'Avant 1949',
  'DE_1949_A_1960': '1949–1960',
  'DE_1961_A_1974': '1961–1974',
  'DE_1975_A_1993': '1975–1993',
  'DE_1994_A_2000': '1994–2000',
  'DE_2001_A_2010': '2001–2010',
  'APRES_2010': 'Après 2010',
};

/**
 * Fetch copropriete data from RNIC (Registre National d'Immatriculation des Copropriétés)
 * via Tabular API, matched by cadastral reference from IGN.
 */
export async function fetchCopropriete(referenceCadastrale: string): Promise<CoproprieteResult | null> {
  try {
    const url = `${config.DVF_API_BASE}/${config.RNIC_RESOURCE_ID}/data/?reference_cadastrale_1__exact=${encodeURIComponent(referenceCadastrale)}&page_size=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const data = json.data as RnicRow[] | undefined;
    if (!data || data.length === 0) return null;

    const row = data[0];
    const typeSyndic = row.type_syndic && row.type_syndic !== 'non connu' ? row.type_syndic : null;
    const periode = PERIODE_LABELS[row.periode_construction] ?? row.periode_construction ?? '';

    return {
      nom: row.nom_usage_copropriete ?? '',
      lots_total: row.nombre_total_lots ?? 0,
      lots_habitation: row.nombre_lots_habitation ?? 0,
      lots_stationnement: row.nombre_lots_stationnement ?? 0,
      periode_construction: periode,
      type_syndic: typeSyndic,
    };
  } catch {
    return null;
  }
}
