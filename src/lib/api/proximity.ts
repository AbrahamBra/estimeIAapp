import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { haversineDistance } from '$lib/utils/geo';
import type { ProximitySummary } from '$lib/types';

interface RawProximityItem {
  lat: number;
  lon: number;
  type: string;
  category: string;
  name: string;
}

const CATEGORIES = ['schools', 'transit', 'shops', 'health', 'sports', 'services'] as const;

export function lookupProximity(
  dept: string,
  lat: number,
  lon: number,
  radiusM: number
): ProximitySummary {
  const filePath = join(process.cwd(), 'static', 'data', 'bpe', `${dept}.json`);

  const summary: ProximitySummary = Object.fromEntries(
    CATEGORIES.map((cat) => [cat, { count: 0, closest_m: Infinity }])
  ) as ProximitySummary;

  if (!existsSync(filePath)) return summary;

  const items: RawProximityItem[] = JSON.parse(readFileSync(filePath, 'utf-8'));

  for (const item of items) {
    const dist = haversineDistance(lat, lon, item.lat, item.lon);
    if (dist > radiusM) continue;

    const cat = item.category as keyof ProximitySummary;
    if (!(cat in summary)) continue;

    summary[cat].count++;
    if (dist < summary[cat].closest_m) {
      summary[cat].closest_m = dist;
    }
  }

  for (const cat of CATEGORIES) {
    if (summary[cat].closest_m === Infinity) summary[cat].closest_m = 0;
  }

  return summary;
}
