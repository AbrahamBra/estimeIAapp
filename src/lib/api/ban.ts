import { config } from '$lib/config';

export interface BanResult {
  label: string;
  lat: number;
  lon: number;
  postcode: string;
  citycode: string;
  city: string;
  housenumber: string;
  street: string;
  score: number;
}

export async function searchAddress(query: string): Promise<BanResult[]> {
  if (query.length < 3) return [];

  try {
    const url = `${config.BAN_API_BASE}/search/?q=${encodeURIComponent(query)}&type=housenumber&limit=5`;
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();
    return data.features.map((f: any) => ({
      label: f.properties.label,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      postcode: f.properties.postcode,
      citycode: f.properties.citycode,
      city: f.properties.city,
      housenumber: f.properties.housenumber ?? '',
      street: f.properties.street ?? '',
      score: f.properties.score,
    }));
  } catch {
    return [];
  }
}
