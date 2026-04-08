import type { UrbanismeResult } from '$lib/types';

const APICARTO_GPU = 'https://apicarto.ign.fr/api/gpu';

interface GpuProperties {
  typezone: string;
  libelle: string;
  libelong: string;
  destdomi: string | null;
  idurba: string;
}

/**
 * Fetch PLU urbanisme zone from API Carto GPU (Géoportail de l'Urbanisme).
 * No API key required.
 */
export async function fetchUrbanisme(lat: number, lon: number): Promise<UrbanismeResult | null> {
  try {
    const geom = JSON.stringify({ type: 'Point', coordinates: [lon, lat] });
    const url = `${APICARTO_GPU}/zone-urba?geom=${encodeURIComponent(geom)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const features = json.features;
    if (!features || features.length === 0) return null;

    const props: GpuProperties = features[0].properties;

    // Extract a readable document name from idurba (e.g. "75056_PSMV_20131218_A" → "PSMV 75056")
    const idParts = (props.idurba ?? '').split('_');
    const docType = idParts[1] ?? '';
    const document = docType ? `${docType} ${idParts[0] ?? ''}`.trim() : props.idurba ?? '';

    return {
      typezone: props.typezone ?? '',
      libelle: props.libelle ?? '',
      libelong: props.libelong ?? '',
      destdomi: props.destdomi || null,
      document,
    };
  } catch {
    return null;
  }
}
