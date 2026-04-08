import type { CadastreResult } from '$lib/types';

const APICARTO_CADASTRE = 'https://apicarto.ign.fr/api/cadastre';

interface CadastreProperties {
  numero: string;
  section: string;
  code_dep: string;
  code_com: string;
  com_abs: string;
  code_arr: string;
  contenance: number;
  code_insee: string;
}

/**
 * Fetch cadastral parcel data from API Carto IGN.
 * No API key required.
 */
export async function fetchCadastre(lat: number, lon: number): Promise<CadastreResult | null> {
  try {
    const geom = JSON.stringify({ type: 'Point', coordinates: [lon, lat] });
    const url = `${APICARTO_CADASTRE}/parcelle?geom=${encodeURIComponent(geom)}&_limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const features = json.features;
    if (!features || features.length === 0) return null;

    const props: CadastreProperties = features[0].properties;

    // Pad section to 2 chars and numero to 4 chars for RNIC reference
    const section = (props.section ?? '').padStart(2, '0');
    const numero = (props.numero ?? '').padStart(4, '0');
    const codeArr = (props.code_arr ?? '000').padStart(3, '0');
    const codeInsee = props.code_insee ?? `${props.code_dep}${props.code_com}`;

    // RNIC reference_cadastrale format: code_insee(5) + prefixe(3) + section(2) + numero(4) = 14 chars
    const reference_cadastrale = `${codeInsee}${codeArr}${section}${numero}`;

    return {
      reference: `${section} ${numero}`,
      reference_cadastrale,
      surface_terrain: props.contenance ?? 0,
      code_insee: codeInsee,
      code_arr: codeArr,
      section,
      numero,
    };
  } catch {
    return null;
  }
}
