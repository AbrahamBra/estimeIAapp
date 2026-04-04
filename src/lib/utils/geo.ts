const EARTH_RADIUS_M = 6_371_000;

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface GeoItem {
  lat: number;
  lon: number;
}

export interface WithDistance<T> {
  item: T;
  distance: number;
}

export function filterByRadius<T extends GeoItem>(
  items: T[],
  centerLat: number,
  centerLon: number,
  radiusM: number
): WithDistance<T>[] {
  return items
    .map((item) => ({
      item,
      distance: haversineDistance(centerLat, centerLon, item.lat, item.lon),
    }))
    .filter((entry) => entry.distance <= radiusM)
    .sort((a, b) => a.distance - b.distance);
}
