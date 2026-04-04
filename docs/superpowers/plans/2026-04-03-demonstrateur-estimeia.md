# EstimeIA Demonstrator Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working EstimeIA demonstrator — enter a French address, get comparable DVF sales on a map with price estimation and proximity data.

**Architecture:** SvelteKit app with server-side API routes calling public French open data APIs (DVF Tabular, BAN geocoding). Static BPE/transport data pre-loaded as JSON. Leaflet map for visualization. No database, no auth.

**Tech Stack:** SvelteKit, TypeScript (strict), Tailwind CSS, Leaflet, Vitest

**Spec:** `docs/superpowers/specs/2026-04-03-demonstrateur-estimeia-design.md`

---

## Chunk 1: Project Setup + Core Utilities

### Task 1: Scaffold SvelteKit project

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `src/app.html`, `src/app.css`

- [ ] **Step 1: Initialize SvelteKit project**

Run from `C:\Users\abrah\estimeia-app`:
```bash
npx sv create . --template minimal --types ts
```
Select: Tailwind CSS as add-on. SvelteKit minimal template with TypeScript.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install leaflet
npm install -D @types/leaflet vitest @testing-library/svelte jsdom
```

Note: Add `@import 'leaflet/dist/leaflet.css';` to `src/app.css` (after Tailwind directives) for Leaflet styles to work in both dev and production.

- [ ] **Step 3: Configure Vitest**

Add to `vite.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
  },
});
```

- [ ] **Step 4: Add design tokens to `src/app.css`**

After the Tailwind directives, add:
```css
@layer base {
  :root {
    --color-ivory: oklch(0.97 0.01 90);
    --color-navy: oklch(0.25 0.06 230);
    --color-sage: oklch(0.58 0.14 155);
    --color-dark-navy: oklch(0.15 0.04 230);
  }
}
```

Extend `tailwind.config.js` with custom colors:
```javascript
export default {
  theme: {
    extend: {
      colors: {
        ivory: 'oklch(0.97 0.01 90)',
        navy: 'oklch(0.25 0.06 230)',
        sage: 'oklch(0.58 0.14 155)',
        'dark-navy': 'oklch(0.15 0.04 230)',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

- [ ] **Step 5: Add Google Fonts to `src/app.html`**

In the `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 6: Verify project runs**

```bash
npm run dev
```
Expected: SvelteKit dev server starts at http://localhost:5173

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold SvelteKit project with Tailwind and design tokens"
```

---

### Task 2: Config module

**Files:**
- Create: `src/lib/config.ts`
- Test: `src/lib/config.test.ts`

- [ ] **Step 1: Write test**

```typescript
// src/lib/config.test.ts
import { describe, it, expect } from 'vitest';
import { config } from './config';

describe('config', () => {
  it('has required DVF settings', () => {
    expect(config.DVF_RESOURCE_ID).toBe('d7933994-2c66-4131-a4da-cf7cd18040a4');
    expect(config.DVF_API_BASE).toContain('tabular-api.data.gouv.fr');
    expect(config.MAX_DVF_PAGES).toBeGreaterThan(0);
    expect(config.MIN_COMPARABLES).toBeGreaterThan(0);
    expect(config.TARGET_COMPARABLES).toBeGreaterThanOrEqual(config.MIN_COMPARABLES);
  });

  it('has required BAN settings', () => {
    expect(config.BAN_API_BASE).toContain('api-adresse.data.gouv.fr');
  });

  it('has valid default radius', () => {
    expect(config.DEFAULT_RADIUS_M).toBeGreaterThan(0);
    expect(config.DEFAULT_RADIUS_M).toBeLessThanOrEqual(5000);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/config.test.ts
```
Expected: FAIL — module not found

- [ ] **Step 3: Implement config**

```typescript
// src/lib/config.ts
export const config = {
  DVF_RESOURCE_ID: 'd7933994-2c66-4131-a4da-cf7cd18040a4',
  DVF_API_BASE: 'https://tabular-api.data.gouv.fr/api/resources',
  BAN_API_BASE: 'https://api-adresse.data.gouv.fr',
  DEFAULT_RADIUS_M: 1000,
  MAX_DVF_PAGES: 5,
  MIN_COMPARABLES: 5,
  TARGET_COMPARABLES: 15,
  OUTLIER_STD_DEVS: 2,
  MIN_PRICE: 10_000,
  SURFACE_TOLERANCE: 0.3,
  ALSACE_MOSELLE_DEPTS: ['57', '67', '68'],
} as const;
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/config.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/config.ts src/lib/config.test.ts
git commit -m "feat: add application config constants"
```

---

### Task 3: Geo utilities (Haversine distance + radius filtering)

**Files:**
- Create: `src/lib/utils/geo.ts`
- Test: `src/lib/utils/geo.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/utils/geo.test.ts
import { describe, it, expect } from 'vitest';
import { haversineDistance, filterByRadius } from './geo';

describe('haversineDistance', () => {
  it('returns 0 for same point', () => {
    expect(haversineDistance(48.858, 2.305, 48.858, 2.305)).toBe(0);
  });

  it('computes distance between Eiffel Tower and Arc de Triomphe (~2.8km)', () => {
    const d = haversineDistance(48.8584, 2.2945, 48.8738, 2.295);
    expect(d).toBeGreaterThan(1500);
    expect(d).toBeLessThan(2000);
  });

  it('computes distance between Paris and Lyon (~390km)', () => {
    const d = haversineDistance(48.8566, 2.3522, 45.764, 4.8357);
    expect(d).toBeGreaterThan(380_000);
    expect(d).toBeLessThan(400_000);
  });
});

describe('filterByRadius', () => {
  const items = [
    { lat: 48.858, lon: 2.305, id: 'close' },    // ~0m
    { lat: 48.860, lon: 2.307, id: 'medium' },    // ~250m
    { lat: 48.870, lon: 2.320, id: 'far' },       // ~1.6km
  ];

  it('filters items within radius', () => {
    const result = filterByRadius(items, 48.858, 2.305, 500);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.item.id)).toContain('close');
    expect(result.map(r => r.item.id)).toContain('medium');
  });

  it('returns distance with each item', () => {
    const result = filterByRadius(items, 48.858, 2.305, 5000);
    expect(result[0].distance).toBeLessThan(result[1].distance);
  });

  it('returns empty array when nothing is in radius', () => {
    const result = filterByRadius(items, 48.858, 2.305, 1);
    // Only the exact same point (0m) would match, but floating point may exclude it
    expect(result.length).toBeLessThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/utils/geo.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement geo utilities**

```typescript
// src/lib/utils/geo.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/utils/geo.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/geo.ts src/lib/utils/geo.test.ts
git commit -m "feat: add Haversine distance and radius filtering"
```

---

### Task 4: Estimation logic (weighted percentiles + price range)

**Files:**
- Create: `src/lib/utils/estimation.ts`
- Test: `src/lib/utils/estimation.test.ts`

- [ ] **Step 1: Define types**

Create `src/lib/types.ts`:
```typescript
export interface DvfTransaction {
  id_mutation: string;
  date_mutation: string;
  nature_mutation: string;
  valeur_fonciere: number;
  adresse_numero: string;
  adresse_nom_voie: string;
  code_postal: string;
  nom_commune: string;
  code_departement: string;
  type_local: string;
  surface_reelle_bati: number | null;
  nombre_pieces_principales: number | null;
  latitude: number | null;
  longitude: number | null;
  lot1_surface_carrez: number | null;
  lot2_surface_carrez: number | null;
  lot3_surface_carrez: number | null;
  lot4_surface_carrez: number | null;
  lot5_surface_carrez: number | null;
}

export interface Comparable {
  id_mutation: string;
  date_mutation: string;
  valeur_fonciere: number;
  address: string;
  code_postal: string;
  nom_commune: string;
  type_local: string;
  surface: number;
  rooms: number | null;
  lat: number;
  lon: number;
  distance: number;
  prix_m2: number;
}

export interface PriceEstimation {
  low_per_m2: number;
  median_per_m2: number;
  high_per_m2: number;
  low_total: number | null;
  median_total: number | null;
  high_total: number | null;
  comparable_count: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface ProximityItem {
  lat: number;
  lon: number;
  type: string;
  category: string;
  name: string;
}

export interface ProximitySummary {
  schools: { count: number; closest_m: number };
  transit: { count: number; closest_m: number };
  shops: { count: number; closest_m: number };
  health: { count: number; closest_m: number };
  sports: { count: number; closest_m: number };
  services: { count: number; closest_m: number };
}
```

- [ ] **Step 2: Write estimation tests**

```typescript
// src/lib/utils/estimation.test.ts
import { describe, it, expect } from 'vitest';
import {
  removeOutliers,
  assignWeights,
  weightedPercentile,
  computePriceRange,
} from './estimation';

describe('removeOutliers', () => {
  it('removes values beyond 2 std devs', () => {
    const values = [100, 102, 98, 101, 99, 500]; // 500 is an outlier
    const result = removeOutliers(values, 2);
    expect(result).not.toContain(500);
    expect(result).toHaveLength(5);
  });

  it('keeps all values when no outliers', () => {
    const values = [100, 102, 98, 101, 99];
    const result = removeOutliers(values, 2);
    expect(result).toHaveLength(5);
  });

  it('handles empty array', () => {
    expect(removeOutliers([], 2)).toEqual([]);
  });
});

describe('assignWeights', () => {
  it('weights 2025 sales higher than 2023', () => {
    const w2025 = assignWeights('2025-06-01', 100);
    const w2023 = assignWeights('2023-06-01', 100);
    expect(w2025).toBeGreaterThan(w2023);
  });

  it('weights closer sales higher', () => {
    const wClose = assignWeights('2025-01-01', 100);
    const wFar = assignWeights('2025-01-01', 1500);
    expect(wClose).toBeGreaterThan(wFar);
  });
});

describe('weightedPercentile', () => {
  it('returns median for equal weights', () => {
    const values = [10, 20, 30, 40, 50];
    const weights = [1, 1, 1, 1, 1];
    const median = weightedPercentile(values, weights, 0.5);
    expect(median).toBe(30);
  });

  it('skews toward heavier weights', () => {
    const values = [10, 20];
    const weights = [1, 9]; // Heavily weighted toward 20
    const median = weightedPercentile(values, weights, 0.5);
    expect(median).toBeGreaterThan(15);
  });

  it('returns single value for single item', () => {
    expect(weightedPercentile([42], [1], 0.5)).toBe(42);
  });
});

describe('computePriceRange', () => {
  it('computes low/median/high with surface', () => {
    const comparables = Array.from({ length: 10 }, (_, i) => ({
      prix_m2: 9000 + i * 200,
      date_mutation: '2025-01-01',
      distance: 300,
    }));
    const result = computePriceRange(comparables, 60);
    expect(result.median_per_m2).toBeGreaterThan(0);
    expect(result.low_per_m2).toBeLessThan(result.median_per_m2);
    expect(result.high_per_m2).toBeGreaterThan(result.median_per_m2);
    expect(result.median_total).toBe(result.median_per_m2 * 60);
    expect(result.confidence).toBe('high');
  });

  it('returns null totals when no surface', () => {
    const comparables = Array.from({ length: 10 }, () => ({
      prix_m2: 10000,
      date_mutation: '2025-01-01',
      distance: 300,
    }));
    const result = computePriceRange(comparables, null);
    expect(result.median_per_m2).toBe(10000);
    expect(result.median_total).toBeNull();
  });

  it('returns low confidence for < 3 comparables', () => {
    const comparables = [
      { prix_m2: 10000, date_mutation: '2025-01-01', distance: 300 },
      { prix_m2: 11000, date_mutation: '2025-01-01', distance: 300 },
    ];
    const result = computePriceRange(comparables, 60);
    expect(result.confidence).toBe('low');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run src/lib/utils/estimation.test.ts
```
Expected: FAIL

- [ ] **Step 4: Implement estimation module**

```typescript
// src/lib/utils/estimation.ts

export function removeOutliers(values: number[], stdDevs: number): number[] {
  if (values.length === 0) return [];
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return values;
  return values.filter((v) => Math.abs(v - mean) <= stdDevs * std);
}

export function assignWeights(dateMutation: string, distanceM: number): number {
  const year = new Date(dateMutation).getFullYear();
  const recency =
    year >= 2025 ? 1.0 : year === 2024 ? 0.8 : year === 2023 ? 0.5 : 0.3;
  const proximity =
    distanceM < 200 ? 1.0 : distanceM < 500 ? 0.8 : distanceM < 1000 ? 0.5 : 0.3;
  return recency * proximity;
}

export function weightedPercentile(
  values: number[],
  weights: number[],
  p: number
): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  // Pair, sort by value
  const pairs = values
    .map((v, i) => ({ value: v, weight: weights[i] }))
    .sort((a, b) => a.value - b.value);

  const totalWeight = pairs.reduce((sum, pair) => sum + pair.weight, 0);

  // Cumulative weight with midpoint normalization
  let cumulative = 0;
  for (let i = 0; i < pairs.length; i++) {
    cumulative += pairs[i].weight;
    const cNorm = (cumulative - pairs[i].weight / 2) / totalWeight;
    if (cNorm >= p) {
      if (i === 0) return pairs[0].value;
      // Linear interpolation
      const prevCum =
        (cumulative - pairs[i].weight - pairs[i - 1].weight / 2) / totalWeight;
      const t = (p - prevCum) / (cNorm - prevCum);
      return pairs[i - 1].value + t * (pairs[i].value - pairs[i - 1].value);
    }
  }
  return pairs[pairs.length - 1].value;
}

interface ComparableForEstimation {
  prix_m2: number;
  date_mutation: string;
  distance: number;
}

export function computePriceRange(
  comparables: ComparableForEstimation[],
  surfaceM2: number | null
): {
  low_per_m2: number;
  median_per_m2: number;
  high_per_m2: number;
  low_total: number | null;
  median_total: number | null;
  high_total: number | null;
  comparable_count: number;
  confidence: 'high' | 'medium' | 'low';
} {
  const values = comparables.map((c) => c.prix_m2);
  const weights = comparables.map((c) => assignWeights(c.date_mutation, c.distance));

  const low_per_m2 = weightedPercentile(values, weights, 0.25);
  const median_per_m2 = weightedPercentile(values, weights, 0.5);
  const high_per_m2 = weightedPercentile(values, weights, 0.75);

  const confidence =
    comparables.length >= 10 ? 'high' : comparables.length >= 3 ? 'medium' : 'low';

  return {
    low_per_m2: Math.round(low_per_m2),
    median_per_m2: Math.round(median_per_m2),
    high_per_m2: Math.round(high_per_m2),
    low_total: surfaceM2 ? Math.round(low_per_m2 * surfaceM2) : null,
    median_total: surfaceM2 ? Math.round(median_per_m2 * surfaceM2) : null,
    high_total: surfaceM2 ? Math.round(high_per_m2 * surfaceM2) : null,
    comparable_count: comparables.length,
    confidence,
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/utils/estimation.test.ts
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/utils/estimation.ts src/lib/utils/estimation.test.ts
git commit -m "feat: add estimation logic with weighted percentiles"
```

---

## Chunk 2: API Clients (BAN + DVF)

### Task 5: BAN geocoding client

**Files:**
- Create: `src/lib/api/ban.ts`
- Test: `src/lib/api/ban.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/api/ban.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchAddress, type BanResult } from './ban';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe('searchAddress', () => {
  it('returns parsed results from BAN API', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              label: '15 Rue Cler 75007 Paris',
              postcode: '75007',
              citycode: '75107',
              city: 'Paris',
              housenumber: '15',
              street: 'Rue Cler',
              score: 0.97,
            },
            geometry: { coordinates: [2.305, 48.858] },
          },
        ],
      }),
    });

    const results = await searchAddress('15 rue cler paris');
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe('15 Rue Cler 75007 Paris');
    expect(results[0].lat).toBeCloseTo(48.858);
    expect(results[0].lon).toBeCloseTo(2.305);
    expect(results[0].postcode).toBe('75007');
  });

  it('returns empty array on API error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    const results = await searchAddress('invalid');
    expect(results).toEqual([]);
  });

  it('returns empty for short queries', async () => {
    const results = await searchAddress('ab');
    expect(results).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/api/ban.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement BAN client**

```typescript
// src/lib/api/ban.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/api/ban.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/ban.ts src/lib/api/ban.test.ts
git commit -m "feat: add BAN geocoding API client"
```

---

### Task 6: DVF Tabular API client with pagination

**Files:**
- Create: `src/lib/api/dvf.ts`
- Test: `src/lib/api/dvf.test.ts`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/api/dvf.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDvfComparables } from './dvf';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeDvfRow(overrides: Record<string, any> = {}) {
  return {
    id_mutation: 'mut-1',
    date_mutation: '2025-03-15',
    nature_mutation: 'Vente',
    valeur_fonciere: 500000,
    adresse_numero: '15',
    adresse_nom_voie: 'Rue Cler',
    code_postal: '75007',
    nom_commune: 'Paris',
    code_departement: '75',
    type_local: 'Appartement',
    surface_reelle_bati: 50,
    nombre_pieces_principales: 2,
    latitude: 48.858,
    longitude: 2.305,
    lot1_surface_carrez: null,
    lot2_surface_carrez: null,
    lot3_surface_carrez: null,
    lot4_surface_carrez: null,
    lot5_surface_carrez: null,
    ...overrides,
  };
}

function mockPage(rows: any[], total: number = rows.length) {
  return {
    ok: true,
    json: async () => ({ data: rows, meta: { total } }),
  };
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('fetchDvfComparables', () => {
  it('fetches and filters DVF data within radius', async () => {
    const rows = [
      makeDvfRow({ latitude: 48.858, longitude: 2.305 }), // 0m — in radius
      makeDvfRow({ id_mutation: 'mut-2', latitude: 49.0, longitude: 3.0 }), // far away
    ];
    mockFetch.mockResolvedValueOnce(mockPage(rows, 2));

    const result = await fetchDvfComparables({
      postcode: '75007',
      propertyType: 'Appartement',
      lat: 48.858,
      lon: 2.305,
      radiusM: 1000,
      surfaceM2: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id_mutation).toBe('mut-1');
  });

  it('deduplicates by id_mutation keeping matching type_local', async () => {
    const rows = [
      makeDvfRow({ id_mutation: 'mut-dup', type_local: 'Appartement', surface_reelle_bati: 50 }),
      makeDvfRow({ id_mutation: 'mut-dup', type_local: 'Dépendance', surface_reelle_bati: 10 }),
    ];
    mockFetch.mockResolvedValueOnce(mockPage(rows, 2));

    const result = await fetchDvfComparables({
      postcode: '75007',
      propertyType: 'Appartement',
      lat: 48.858,
      lon: 2.305,
      radiusM: 1000,
      surfaceM2: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].surface).toBe(50);
  });

  it('excludes transactions with valeur_fonciere < 10000', async () => {
    const rows = [
      makeDvfRow({ valeur_fonciere: 100, latitude: 48.858, longitude: 2.305 }),
    ];
    mockFetch.mockResolvedValueOnce(mockPage(rows, 1));

    const result = await fetchDvfComparables({
      postcode: '75007',
      propertyType: 'Appartement',
      lat: 48.858,
      lon: 2.305,
      radiusM: 1000,
      surfaceM2: null,
    });

    expect(result).toHaveLength(0);
  });

  it('paginates when not enough comparables', async () => {
    // Page 1: 1 comparable in radius (need MIN_COMPARABLES = 5)
    const page1Rows = [
      makeDvfRow({ latitude: 48.858, longitude: 2.305 }),
      ...Array.from({ length: 199 }, (_, i) =>
        makeDvfRow({ id_mutation: `far-${i}`, latitude: 49.0, longitude: 3.0 })
      ),
    ];
    // Page 2: 5 more in radius
    const page2Rows = Array.from({ length: 5 }, (_, i) =>
      makeDvfRow({
        id_mutation: `close-${i}`,
        latitude: 48.8585,
        longitude: 2.306,
      })
    );

    mockFetch
      .mockResolvedValueOnce(mockPage(page1Rows, 500))
      .mockResolvedValueOnce(mockPage(page2Rows, 500));

    const result = await fetchDvfComparables({
      postcode: '75007',
      propertyType: 'Appartement',
      lat: 48.858,
      lon: 2.305,
      radiusM: 1000,
      surfaceM2: null,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.length).toBeGreaterThanOrEqual(5);
  });

  it('filters by surface tolerance when surfaceM2 provided', async () => {
    const rows = [
      makeDvfRow({ surface_reelle_bati: 60, latitude: 48.858, longitude: 2.305 }), // within ±30% of 50
      makeDvfRow({ id_mutation: 'mut-big', surface_reelle_bati: 200, latitude: 48.858, longitude: 2.305 }), // too big
    ];
    mockFetch.mockResolvedValueOnce(mockPage(rows, 2));

    const result = await fetchDvfComparables({
      postcode: '75007',
      propertyType: 'Appartement',
      lat: 48.858,
      lon: 2.305,
      radiusM: 1000,
      surfaceM2: 50,
    });

    expect(result).toHaveLength(1);
    expect(result[0].surface).toBe(60);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/api/dvf.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement DVF client**

```typescript
// src/lib/api/dvf.ts
import { config } from '$lib/config';
import { haversineDistance } from '$lib/utils/geo';
import { removeOutliers } from '$lib/utils/estimation';
import type { Comparable } from '$lib/types';

interface FetchDvfParams {
  postcode: string;
  propertyType: 'Appartement' | 'Maison';
  lat: number;
  lon: number;
  radiusM: number;
  surfaceM2: number | null;
}

function getSurface(row: any): number | null {
  if (row.surface_reelle_bati) return row.surface_reelle_bati;
  // Fallback to Carrez surfaces
  const carrez = [
    row.lot1_surface_carrez,
    row.lot2_surface_carrez,
    row.lot3_surface_carrez,
    row.lot4_surface_carrez,
    row.lot5_surface_carrez,
  ].filter((s): s is number => s != null && s > 0);
  return carrez.length > 0 ? carrez.reduce((a, b) => a + b, 0) : null;
}

async function fetchPage(
  postcode: string,
  propertyType: string,
  page: number
): Promise<{ data: any[]; total: number }> {
  const url = new URL(
    `${config.DVF_API_BASE}/${config.DVF_RESOURCE_ID}/data/`
  );
  url.searchParams.set('code_postal__exact', postcode);
  url.searchParams.set('type_local__exact', propertyType);
  url.searchParams.set('nature_mutation__exact', 'Vente');
  url.searchParams.set('date_mutation__sort', 'desc');
  url.searchParams.set('page_size', '200');
  url.searchParams.set('page', String(page));

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`DVF API error: ${response.status}`);

  const json = await response.json();
  return { data: json.data ?? [], total: json.meta?.total ?? 0 };
}

export async function fetchDvfComparables(params: FetchDvfParams): Promise<Comparable[]> {
  const { postcode, propertyType, lat, lon, radiusM, surfaceM2 } = params;
  const seenMutations = new Map<string, Comparable>();

  for (let page = 1; page <= config.MAX_DVF_PAGES; page++) {
    const { data, total } = await fetchPage(postcode, propertyType, page);
    if (data.length === 0) break;

    for (const row of data) {
      // Skip low-value transactions
      if (!row.valeur_fonciere || row.valeur_fonciere < config.MIN_PRICE) continue;

      // Skip rows without GPS
      if (row.latitude == null || row.longitude == null) continue;

      const surface = getSurface(row);
      if (surface == null || surface <= 0) continue;

      // Surface tolerance filter
      if (surfaceM2 != null) {
        const tolerance = surfaceM2 * config.SURFACE_TOLERANCE;
        if (surface < surfaceM2 - tolerance || surface > surfaceM2 + tolerance) continue;
      }

      // Distance filter
      const distance = haversineDistance(lat, lon, row.latitude, row.longitude);
      if (distance > radiusM) continue;

      const comparable: Comparable = {
        id_mutation: row.id_mutation,
        date_mutation: row.date_mutation,
        valeur_fonciere: row.valeur_fonciere,
        address: `${row.adresse_numero ?? ''} ${row.adresse_nom_voie ?? ''}`.trim(),
        code_postal: row.code_postal,
        nom_commune: row.nom_commune,
        type_local: row.type_local,
        surface,
        rooms: row.nombre_pieces_principales,
        lat: row.latitude,
        lon: row.longitude,
        distance,
        prix_m2: row.valeur_fonciere / surface,
      };

      // Deduplication: keep matching type_local, largest surface
      const existing = seenMutations.get(row.id_mutation);
      if (existing) {
        if (
          row.type_local === propertyType &&
          (existing.type_local !== propertyType || surface > existing.surface)
        ) {
          seenMutations.set(row.id_mutation, comparable);
        }
      } else {
        seenMutations.set(row.id_mutation, comparable);
      }
    }

    // Stop if enough comparables or no more data
    const current = Array.from(seenMutations.values());
    if (current.length >= config.TARGET_COMPARABLES) break;
    if (page * 200 >= total) break;
  }

  const comparables = Array.from(seenMutations.values());

  // Remove prix_m2 outliers using bounds (not Set comparison)
  const prixValues = comparables.map((c) => c.prix_m2);
  const mean = prixValues.reduce((a, b) => a + b, 0) / prixValues.length;
  const std = Math.sqrt(prixValues.reduce((s, v) => s + (v - mean) ** 2, 0) / prixValues.length);
  const lowerBound = mean - config.OUTLIER_STD_DEVS * std;
  const upperBound = mean + config.OUTLIER_STD_DEVS * std;

  return comparables
    .filter((c) => c.prix_m2 >= lowerBound && c.prix_m2 <= upperBound)
    .sort((a, b) => a.distance - b.distance);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/api/dvf.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/dvf.ts src/lib/api/dvf.test.ts
git commit -m "feat: add DVF Tabular API client with pagination and deduplication"
```

---

### Task 7: BAN geocode API route (proxy)

**Files:**
- Create: `src/routes/api/geocode/+server.ts`

- [ ] **Step 1: Implement the API route**

```typescript
// src/routes/api/geocode/+server.ts
import { json } from '@sveltejs/kit';
import { searchAddress } from '$lib/api/ban';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const query = url.searchParams.get('q') ?? '';
  const results = await searchAddress(query);
  return json(results);
};
```

- [ ] **Step 2: Manual test**

Start dev server (`npm run dev`), then:
```
curl "http://localhost:5173/api/geocode?q=15+rue+cler+paris"
```
Expected: JSON array with address results including lat/lon/postcode.

- [ ] **Step 3: Commit**

```bash
git add src/routes/api/geocode/+server.ts
git commit -m "feat: add BAN geocode proxy API route"
```

---

## Chunk 3: Pages + Components

### Task 8: Layout and Home Page

**Files:**
- Create: `src/routes/+layout.svelte`
- Create: `src/routes/+page.svelte`

- [ ] **Step 1: Create shared layout**

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen bg-ivory font-body text-dark-navy">
  <nav class="border-b border-navy/10 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <a href="/" class="font-display text-xl font-bold text-navy">EstimeIA</a>
      <span class="text-sm text-navy/50">Demonstrateur</span>
    </div>
  </nav>

  <main>
    {@render children()}
  </main>

  <footer class="border-t border-navy/10 py-8 text-center text-sm text-navy/40">
    <p>EstimeIA &mdash; Expertise immobiliere augmentee</p>
  </footer>
</div>
```

- [ ] **Step 2: Create Home page with search form**

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import AddressSearch from '$lib/components/AddressSearch.svelte';
  import { goto } from '$app/navigation';
  import type { BanResult } from '$lib/api/ban';

  let selectedAddress: BanResult | null = $state(null);
  let propertyType: 'Appartement' | 'Maison' = $state('Appartement');
  let surface: string = $state('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!selectedAddress) return;
    const params = new URLSearchParams({
      lat: String(selectedAddress.lat),
      lon: String(selectedAddress.lon),
      postcode: selectedAddress.postcode,
      address: selectedAddress.label,
      type: propertyType,
    });
    if (surface) params.set('surface', surface);
    goto(`/estimate?${params.toString()}`);
  }
</script>

<div class="max-w-xl mx-auto px-6 py-20 text-center">
  <h1 class="font-display text-4xl font-bold text-navy mb-4">
    Estimez un bien en 15 secondes
  </h1>
  <p class="text-navy/60 mb-12">
    Entrez une adresse, obtenez les ventes comparables et une fourchette de prix.
  </p>

  <form onsubmit={(e) => handleSubmit(e)} class="space-y-6 text-left">
    <div>
      <label for="address" class="block text-sm font-medium text-navy mb-2">Adresse</label>
      <AddressSearch onSelect={(result) => selectedAddress = result} />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label for="type" class="block text-sm font-medium text-navy mb-2">Type de bien</label>
        <select
          id="type"
          bind:value={propertyType}
          class="w-full border border-navy/20 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-sage focus:border-sage"
        >
          <option value="Appartement">Appartement</option>
          <option value="Maison">Maison</option>
        </select>
      </div>

      <div>
        <label for="surface" class="block text-sm font-medium text-navy mb-2">Surface (m²)</label>
        <input
          id="surface"
          type="number"
          bind:value={surface}
          placeholder="Optionnel"
          min="1"
          max="10000"
          class="w-full border border-navy/20 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-sage focus:border-sage"
        />
      </div>
    </div>

    <button
      type="submit"
      disabled={!selectedAddress}
      class="w-full bg-navy text-white font-semibold py-4 rounded-lg hover:bg-dark-navy transition disabled:opacity-40 disabled:cursor-not-allowed"
    >
      Estimer
    </button>
  </form>
</div>
```

- [ ] **Step 3: Verify in browser**

Run `npm run dev`, open http://localhost:5173. Check: layout renders, form displays, font/colors match design tokens.

- [ ] **Step 4: Commit**

```bash
git add src/routes/+layout.svelte src/routes/+page.svelte
git commit -m "feat: add layout and home page with search form"
```

---

### Task 9: AddressSearch component (autocomplete)

**Files:**
- Create: `src/lib/components/AddressSearch.svelte`

- [ ] **Step 1: Implement component**

```svelte
<!-- src/lib/components/AddressSearch.svelte -->
<script lang="ts">
  import type { BanResult } from '$lib/api/ban';

  let { onSelect }: { onSelect: (result: BanResult) => void } = $props();

  let query = $state('');
  let results: BanResult[] = $state([]);
  let isOpen = $state(false);
  let loading = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleInput() {
    clearTimeout(debounceTimer);
    if (query.length < 3) {
      results = [];
      isOpen = false;
      return;
    }
    loading = true;
    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          results = await res.json();
          isOpen = results.length > 0;
        }
      } finally {
        loading = false;
      }
    }, 300);
  }

  function select(result: BanResult) {
    query = result.label;
    isOpen = false;
    onSelect(result);
  }
</script>

<div class="relative">
  <input
    type="text"
    bind:value={query}
    oninput={handleInput}
    placeholder="Ex: 15 rue Cler, 75007 Paris"
    class="w-full border border-navy/20 rounded-lg px-4 py-3 bg-white focus:ring-2 focus:ring-sage focus:border-sage"
    autocomplete="off"
  />
  {#if loading}
    <div class="absolute right-3 top-3.5 text-navy/40 text-sm">...</div>
  {/if}

  {#if isOpen}
    <ul class="absolute z-50 w-full bg-white border border-navy/20 rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
      {#each results as result}
        <li>
          <button
            type="button"
            class="w-full text-left px-4 py-3 hover:bg-sage/10 transition text-sm"
            onclick={() => select(result)}
          >
            {result.label}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
```

- [ ] **Step 2: Test in browser**

Go to http://localhost:5173, type "15 rue cler paris" → autocomplete dropdown should appear with suggestions. Click a suggestion → input fills with the label.

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/AddressSearch.svelte
git commit -m "feat: add address autocomplete component with BAN API"
```

---

### Task 10: Results page server load function

**Files:**
- Create: `src/routes/estimate/+page.server.ts`

- [ ] **Step 1: Implement server load**

```typescript
// src/routes/estimate/+page.server.ts
import { error } from '@sveltejs/kit';
import { fetchDvfComparables } from '$lib/api/dvf';
import { computePriceRange } from '$lib/utils/estimation';
import { config } from '$lib/config';
import type { Comparable } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lon = parseFloat(url.searchParams.get('lon') ?? '');
  const postcode = url.searchParams.get('postcode') ?? '';
  const address = url.searchParams.get('address') ?? '';
  const propertyType = (url.searchParams.get('type') ?? 'Appartement') as 'Appartement' | 'Maison';
  const surfaceParam = url.searchParams.get('surface');
  const surfaceM2 = surfaceParam ? parseFloat(surfaceParam) : null;
  const radiusParam = url.searchParams.get('radius');
  const radiusM = radiusParam ? parseInt(radiusParam) : config.DEFAULT_RADIUS_M;

  if (isNaN(lat) || isNaN(lon) || !postcode) {
    error(400, 'Parametres manquants: lat, lon, postcode');
  }

  const dept = postcode.substring(0, 2);
  const isAlsaceMoselle = config.ALSACE_MOSELLE_DEPTS.includes(dept);

  let comparables: Comparable[] = [];
  let dvfError = false;

  try {
    comparables = await fetchDvfComparables({
      postcode,
      propertyType,
      lat,
      lon,
      radiusM,
      surfaceM2,
    });
  } catch {
    dvfError = true;
  }

  const estimation = comparables.length > 0
    ? computePriceRange(
        comparables.map((c) => ({
          prix_m2: c.prix_m2,
          date_mutation: c.date_mutation,
          distance: c.distance,
        })),
        surfaceM2
      )
    : null;

  return {
    address,
    postcode,
    propertyType,
    surfaceM2,
    lat,
    lon,
    comparables,
    estimation,
    isAlsaceMoselle,
    radiusM,
    dvfError,
  };
};
```

- [ ] **Step 2: Verify by navigating from home**

Start dev server. Enter an address on home page, submit → should redirect to `/estimate?...` and the load function should run (check terminal for any errors).

- [ ] **Step 3: Commit**

```bash
git add src/routes/estimate/+page.server.ts
git commit -m "feat: add estimation results server load function"
```

---

### Task 11: Results page UI (PriceRange + ComparableCard + ComparablesList)

**Files:**
- Create: `src/lib/components/PriceRange.svelte`
- Create: `src/lib/components/ComparableCard.svelte`
- Create: `src/lib/components/ComparablesList.svelte`
- Create: `src/routes/estimate/+page.svelte`

- [ ] **Step 1: Create PriceRange component**

```svelte
<!-- src/lib/components/PriceRange.svelte -->
<script lang="ts">
  import type { PriceEstimation } from '$lib/types';

  let { estimation, surfaceM2 }: { estimation: PriceEstimation; surfaceM2: number | null } = $props();

  function formatPrice(n: number): string {
    return n.toLocaleString('fr-FR');
  }
</script>

<div class="bg-white rounded-xl border border-navy/10 p-6">
  <div class="text-center">
    <p class="text-sm text-navy/50 mb-1">Estimation {estimation.confidence === 'low' ? '(peu fiable)' : ''}</p>
    <p class="font-mono text-3xl font-bold text-navy">
      {formatPrice(estimation.median_per_m2)} €/m²
    </p>
    <p class="text-sm text-navy/50 mt-1">
      {formatPrice(estimation.low_per_m2)} – {formatPrice(estimation.high_per_m2)} €/m²
    </p>

    {#if estimation.median_total != null && surfaceM2}
      <div class="mt-4 pt-4 border-t border-navy/10">
        <p class="font-mono text-2xl font-bold text-sage">
          {formatPrice(estimation.median_total)} €
        </p>
        <p class="text-sm text-navy/50">
          {formatPrice(estimation.low_total!)} – {formatPrice(estimation.high_total!)} € pour {surfaceM2} m²
        </p>
      </div>
    {:else}
      <p class="mt-4 text-sm text-sage italic">
        Ajoutez la surface pour obtenir une estimation en euros.
      </p>
    {/if}

    <p class="mt-3 text-xs text-navy/30">
      Base sur {estimation.comparable_count} vente{estimation.comparable_count > 1 ? 's' : ''} comparable{estimation.comparable_count > 1 ? 's' : ''}
    </p>

    {#if estimation.confidence === 'low'}
      <p class="mt-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-1.5 inline-block">
        Estimation peu fiable (moins de 3 ventes)
      </p>
    {/if}
  </div>
</div>
```

- [ ] **Step 2: Create ComparableCard component**

```svelte
<!-- src/lib/components/ComparableCard.svelte -->
<script lang="ts">
  import type { Comparable } from '$lib/types';

  let { comparable, isSelected = false, onClick }: {
    comparable: Comparable;
    isSelected?: boolean;
    onClick: () => void;
  } = $props();

  function formatPrice(n: number): string {
    return n.toLocaleString('fr-FR');
  }

  function formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  }
</script>

<button
  type="button"
  class="w-full text-left p-4 rounded-lg border transition hover:shadow-md {isSelected ? 'border-sage bg-sage/5 shadow-md' : 'border-navy/10 bg-white'}"
  onclick={onClick}
>
  <p class="font-medium text-navy text-sm">{comparable.address}</p>
  <p class="text-xs text-navy/50 mt-0.5">{comparable.code_postal} {comparable.nom_commune}</p>

  <div class="flex items-baseline gap-3 mt-2">
    <span class="font-mono text-lg font-bold text-navy">{formatPrice(Math.round(comparable.prix_m2))} €/m²</span>
    <span class="text-sm text-navy/50">{formatPrice(comparable.valeur_fonciere)} €</span>
  </div>

  <div class="flex gap-3 mt-2 text-xs text-navy/40">
    <span>{comparable.surface} m²</span>
    {#if comparable.rooms}
      <span>{comparable.rooms} piece{comparable.rooms > 1 ? 's' : ''}</span>
    {/if}
    <span>{formatDate(comparable.date_mutation)}</span>
    <span>{comparable.distance < 1000 ? `${Math.round(comparable.distance)} m` : `${(comparable.distance / 1000).toFixed(1)} km`}</span>
  </div>
</button>
```

- [ ] **Step 3: Create ComparablesList component**

```svelte
<!-- src/lib/components/ComparablesList.svelte -->
<script lang="ts">
  import type { Comparable } from '$lib/types';
  import ComparableCard from './ComparableCard.svelte';

  let { comparables, selectedId = null, onSelect }: {
    comparables: Comparable[];
    selectedId?: string | null;
    onSelect: (comparable: Comparable) => void;
  } = $props();

  type SortKey = 'distance' | 'prix_m2' | 'date';
  let sortBy: SortKey = $state('distance');

  let sorted = $derived.by(() => {
    const copy = [...comparables];
    switch (sortBy) {
      case 'distance': return copy.sort((a, b) => a.distance - b.distance);
      case 'prix_m2': return copy.sort((a, b) => a.prix_m2 - b.prix_m2);
      case 'date': return copy.sort((a, b) => b.date_mutation.localeCompare(a.date_mutation));
    }
  });

  // Scroll selected card into view when selectedId changes (e.g., from map click)
  $effect(() => {
    if (selectedId) {
      const el = document.querySelector(`[data-mutation-id="${selectedId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
</script>

<div>
  <div class="flex gap-2 mb-4">
    {#each [
      { key: 'distance', label: 'Distance' },
      { key: 'prix_m2', label: 'Prix/m²' },
      { key: 'date', label: 'Date' },
    ] as { key, label } (key)}
      <button
        type="button"
        class="text-xs px-3 py-1.5 rounded-full transition {sortBy === key ? 'bg-navy text-white' : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}"
        onclick={() => sortBy = key as SortKey}
      >
        {label}
      </button>
    {/each}
  </div>

  <div class="space-y-2 max-h-[600px] overflow-y-auto">
    {#each sorted as comparable (comparable.id_mutation)}
      <div data-mutation-id={comparable.id_mutation}>
        <ComparableCard
          {comparable}
          isSelected={comparable.id_mutation === selectedId}
          onClick={() => onSelect(comparable)}
        />
      </div>
    {/each}
  </div>
</div>
```

- [ ] **Step 4: Create Results page (without map for now)**

```svelte
<!-- src/routes/estimate/+page.svelte -->
<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import PriceRange from '$lib/components/PriceRange.svelte';
  import ComparablesList from '$lib/components/ComparablesList.svelte';
  import type { Comparable } from '$lib/types';

  let { data } = $props();
  let selectedComparable: Comparable | null = $state(null);

  const radiusOptions = [500, 1000, 2000];

  function changeRadius(newRadius: number) {
    const params = new URLSearchParams($page.url.searchParams);
    params.set('radius', String(newRadius));
    goto(`/estimate?${params.toString()}`);
  }
</script>

<div class="max-w-6xl mx-auto px-6 py-8">
  <!-- Header -->
  <div class="flex items-start justify-between mb-8">
    <div>
      <h1 class="font-display text-2xl font-bold text-navy">{data.address}</h1>
      <p class="text-navy/50 text-sm mt-1">
        {data.propertyType}
        {#if data.surfaceM2} &middot; {data.surfaceM2} m²{/if}
      </p>
      <!-- Radius toggle -->
      <div class="flex gap-2 mt-2">
        {#each radiusOptions as r}
          <button
            type="button"
            class="text-xs px-3 py-1 rounded-full transition {data.radiusM === r ? 'bg-navy text-white' : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}"
            onclick={() => changeRadius(r)}
          >
            {r >= 1000 ? `${r / 1000} km` : `${r} m`}
          </button>
        {/each}
      </div>
    </div>
    <a href="/" class="text-sm text-sage hover:underline">Nouvelle estimation</a>
  </div>

  {#if data.isAlsaceMoselle}
    <div class="bg-orange-50 text-orange-700 text-sm px-4 py-3 rounded-lg mb-6">
      Donnees DVF potentiellement incompletes pour ce departement.
    </div>
  {/if}

  {#if data.dvfError}
    <div class="text-center py-20">
      <p class="text-xl text-navy/60">Service temporairement indisponible.</p>
      <p class="text-navy/40 mt-2">Reessayez dans quelques instants.</p>
      <a href="/" class="inline-block mt-6 text-sage hover:underline">Nouvelle estimation</a>
    </div>
  {:else if data.estimation}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Left: Map placeholder + Price -->
      <div class="lg:col-span-2 space-y-6">
        <PriceRange estimation={data.estimation} surfaceM2={data.surfaceM2} />

        <!-- Map will go here in Task 12 -->
        <div class="bg-navy/5 rounded-xl h-96 flex items-center justify-center text-navy/30">
          Carte (a venir)
        </div>
      </div>

      <!-- Right: Comparables list -->
      <div>
        <h2 class="font-display text-lg font-bold text-navy mb-4">
          {data.comparables.length} vente{data.comparables.length > 1 ? 's' : ''} comparable{data.comparables.length > 1 ? 's' : ''}
        </h2>
        <ComparablesList
          comparables={data.comparables}
          selectedId={selectedComparable?.id_mutation}
          onSelect={(c) => selectedComparable = c}
        />
      </div>
    </div>
  {:else}
    <div class="text-center py-20">
      <p class="text-xl text-navy/60">Aucune vente trouvee dans ce secteur.</p>
      <p class="text-navy/40 mt-2">Essayez un rayon plus large ou un autre type de bien.</p>
      <a href="/" class="inline-block mt-6 text-sage hover:underline">Nouvelle estimation</a>
    </div>
  {/if}
</div>
```

- [ ] **Step 5: Test full flow in browser**

Go to http://localhost:5173. Enter "15 rue cler paris", select Appartement, submit. Verify:
- Redirects to `/estimate?...`
- Price range displays
- Comparable cards display with correct data
- Sort buttons work
- "Carte (a venir)" placeholder shows

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/PriceRange.svelte src/lib/components/ComparableCard.svelte src/lib/components/ComparablesList.svelte src/routes/estimate/+page.svelte
git commit -m "feat: add results page with price estimation and comparables list"
```

---

## Chunk 4: Map + Proximity + Polish

### Task 12: Leaflet Map component

**Files:**
- Create: `src/lib/components/Map.svelte`
- Modify: `src/routes/estimate/+page.svelte`

- [ ] **Step 1: Create Map component**

```svelte
<!-- src/lib/components/Map.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Comparable } from '$lib/types';
  import type L from 'leaflet';

  let {
    lat,
    lon,
    radiusM,
    comparables,
    selectedId = null,
    onSelectComparable,
  }: {
    lat: number;
    lon: number;
    radiusM: number;
    comparables: Comparable[];
    selectedId?: string | null;
    onSelectComparable: (comparable: Comparable) => void;
  } = $props();

  let mapContainer: HTMLDivElement;
  let map: L.Map;
  let markers: Map<string, L.Marker> = new Map();
  let leaflet: typeof L;

  onMount(async () => {
    leaflet = await import('leaflet');
    map = leaflet.map(mapContainer).setView([lat, lon], 15);

    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Target marker (red)
    const targetIcon = leaflet.divIcon({
      className: '',
      html: `<div style="width:16px;height:16px;background:#dc2626;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    leaflet.marker([lat, lon], { icon: targetIcon }).addTo(map)
      .bindPopup('<b>Adresse recherchee</b>');

    // Radius circle
    leaflet.circle([lat, lon], {
      radius: radiusM,
      color: '#1a2744',
      fillColor: '#1a2744',
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '6 4',
    }).addTo(map);

    // Comparable markers (blue/navy)
    const compIcon = leaflet.divIcon({
      className: '',
      html: `<div style="width:12px;height:12px;background:#1a2744;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.2)"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    for (const c of comparables) {
      const marker = leaflet.marker([c.lat, c.lon], { icon: compIcon }).addTo(map);
      marker.bindPopup(
        `<b>${c.address}</b><br>${c.surface} m² &middot; ${Math.round(c.prix_m2).toLocaleString('fr-FR')} €/m²<br>${c.valeur_fonciere.toLocaleString('fr-FR')} € &middot; ${new Date(c.date_mutation).toLocaleDateString('fr-FR')}`
      );
      marker.on('click', () => onSelectComparable(c));
      markers.set(c.id_mutation, marker);
    }

    // Fit bounds to show all markers
    const allPoints: L.LatLngExpression[] = [[lat, lon], ...comparables.map(c => [c.lat, c.lon] as L.LatLngExpression)];
    if (allPoints.length > 1) {
      map.fitBounds(leaflet.latLngBounds(allPoints), { padding: [40, 40] });
    }

    return () => map.remove();
  });

  // React to selectedId changes — open popup
  $effect(() => {
    if (selectedId && markers.has(selectedId)) {
      const marker = markers.get(selectedId)!;
      map.panTo(marker.getLatLng());
      marker.openPopup();
    }
  });
</script>

<div bind:this={mapContainer} class="w-full h-96 rounded-xl z-0"></div>
```

- [ ] **Step 2: Wire Map into Results page**

Replace the map placeholder in `src/routes/estimate/+page.svelte`:

Replace the map placeholder `<div class="bg-navy/5 ...">Carte (a venir)</div>` with:

Add to `<script>` block:
```typescript
import { onMount } from 'svelte';
import Map from '$lib/components/Map.svelte';
let mounted = $state(false);
onMount(() => { mounted = true; });
```

Then in the template:
```svelte
{#if mounted}
  <Map
    lat={data.lat}
    lon={data.lon}
    radiusM={data.radiusM}
    comparables={data.comparables}
    selectedId={selectedComparable?.id_mutation}
    onSelectComparable={(c) => selectedComparable = c}
  />
{/if}
```

This guards against SSR (Leaflet requires `window`) using a clean `onMount` flag pattern.

- [ ] **Step 3: Test map in browser**

Navigate to an estimation result. Verify:
- Map renders with OpenStreetMap tiles
- Red marker at target address
- Blue markers for comparables
- Dashed radius circle
- Click marker → popup with details
- Click comparable card → map pans to marker

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/Map.svelte src/routes/estimate/+page.svelte
git commit -m "feat: add Leaflet map with comparable markers and interactions"
```

---

### Task 13: Proximity data preparation script

**Files:**
- Create: `scripts/prepare-data.ts`

- [ ] **Step 1: Implement data preparation script**

This script downloads BPE data from INSEE, parses it, and outputs JSON files indexed by department.

```typescript
// scripts/prepare-data.ts
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BPE_URL = 'https://www.insee.fr/fr/statistiques/fichier/8217537/bpe24_ensemble_xy_csv.zip';
const OUTPUT_DIR = join(process.cwd(), 'static', 'data', 'bpe');

// Category mapping
const CATEGORY_MAP: Record<string, string> = {
  A: 'services',
  B: 'shops',
  C: 'schools',
  D: 'health',
  E: 'transit',
  F: 'sports',
};

async function main() {
  console.log('Downloading BPE data...');
  // Note: Due to the ZIP format and INSEE redirect, this script may need
  // manual download. Place the CSV at scripts/bpe24_ensemble_xy.csv
  // then run this script.

  const csvPath = join(process.cwd(), 'scripts', 'bpe24_ensemble_xy.csv');
  if (!existsSync(csvPath)) {
    console.error(`CSV not found at ${csvPath}`);
    console.error('Download from INSEE and place the CSV here, then re-run.');
    process.exit(1);
  }

  const { createReadStream } = await import('fs');
  const { createInterface } = await import('readline');

  const rl = createInterface({ input: createReadStream(csvPath) });
  const byDept: Record<string, Array<{ lat: number; lon: number; type: string; category: string; name: string }>> = {};

  let header: string[] = [];
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) {
      header = line.split(';').map(h => h.trim().replace(/"/g, ''));
      continue;
    }

    const cols = line.split(';').map(c => c.trim().replace(/"/g, ''));
    const typeCode = cols[header.indexOf('TYPEQU')] ?? '';
    const dept = cols[header.indexOf('DEP')] ?? '';
    const latStr = cols[header.indexOf('LATITUDE')];
    const lonStr = cols[header.indexOf('LONGITUDE')];
    const libelle = cols[header.indexOf('LIBELLE')] ?? typeCode;

    if (!latStr || !lonStr || !dept) continue;

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) continue;

    const domainLetter = typeCode.charAt(0);
    const category = CATEGORY_MAP[domainLetter];
    if (!category) continue;

    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push({ lat, lon, type: typeCode, category, name: libelle });
  }

  // Write per-department JSON files
  mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const [dept, items] of Object.entries(byDept)) {
    const outPath = join(OUTPUT_DIR, `${dept}.json`);
    writeFileSync(outPath, JSON.stringify(items));
    console.log(`${dept}: ${items.length} items`);
  }

  console.log(`Done. ${Object.keys(byDept).length} departments written to ${OUTPUT_DIR}`);
}

main().catch(console.error);
```

- [ ] **Step 2: Add script to package.json**

Add to scripts in `package.json`:
```json
"prepare-data": "npx tsx scripts/prepare-data.ts"
```

- [ ] **Step 3: Commit (script only — data files generated separately)**

```bash
git add scripts/prepare-data.ts package.json
git commit -m "feat: add BPE data preparation script"
```

---

### Task 14: Proximity lookup module

**Files:**
- Create: `src/lib/api/proximity.ts`
- Test: `src/lib/api/proximity.test.ts`
- Create: `src/lib/components/ProximityBadges.svelte`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/api/proximity.test.ts
import { describe, it, expect, vi } from 'vitest';
import { lookupProximity } from './proximity';

// Mock fs for static file reading
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => JSON.stringify([
    { lat: 48.858, lon: 2.305, type: 'C101', category: 'schools', name: 'Ecole X' },
    { lat: 48.859, lon: 2.306, type: 'B201', category: 'shops', name: 'Boulangerie Y' },
    { lat: 49.000, lon: 3.000, type: 'D101', category: 'health', name: 'Dr Z' },
  ])),
  existsSync: vi.fn(() => true),
}));

describe('lookupProximity', () => {
  it('returns items within 1km grouped by category', () => {
    const result = lookupProximity('75', 48.858, 2.305, 1000);
    expect(result.schools.count).toBeGreaterThanOrEqual(1);
    expect(result.shops.count).toBeGreaterThanOrEqual(1);
    expect(result.health.count).toBe(0); // too far
  });

  it('returns closest distance per category', () => {
    const result = lookupProximity('75', 48.858, 2.305, 1000);
    expect(result.schools.closest_m).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/api/proximity.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement proximity lookup**

```typescript
// src/lib/api/proximity.ts
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
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

  // Replace Infinity with 0 for categories with no results
  for (const cat of CATEGORIES) {
    if (summary[cat].closest_m === Infinity) summary[cat].closest_m = 0;
  }

  return summary;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/api/proximity.test.ts
```
Expected: PASS

- [ ] **Step 5: Create ProximityBadges component**

```svelte
<!-- src/lib/components/ProximityBadges.svelte -->
<script lang="ts">
  import type { ProximitySummary } from '$lib/types';

  let { proximity }: { proximity: ProximitySummary } = $props();

  const badges = [
    { key: 'schools' as const, label: 'Ecoles', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
    { key: 'transit' as const, label: 'Transports', icon: 'M8 17h8M8 17v4h8v-4M8 17l-2-8h12l-2 8M6 9V5a2 2 0 012-2h8a2 2 0 012 2v4' },
    { key: 'shops' as const, label: 'Commerces', icon: 'M3 3h18v4H3V3zm0 4h18v14H3V7zm4 4h4v4H7v-4z' },
    { key: 'health' as const, label: 'Sante', icon: 'M12 4v16m8-8H4' },
    { key: 'sports' as const, label: 'Loisirs', icon: 'M5 3v18l7-3 7 3V3L12 6 5 3z' },
  ];
</script>

<div class="flex flex-wrap gap-3">
  {#each badges as { key, label }}
    {@const data = proximity[key]}
    {#if data.count > 0}
      <div class="flex items-center gap-2 bg-sage/10 text-sage px-3 py-1.5 rounded-full text-xs font-medium">
        <span>{data.count} {label}</span>
        <span class="text-sage/60">&lt; {data.closest_m < 1000 ? `${Math.round(data.closest_m)} m` : `${(data.closest_m / 1000).toFixed(1)} km`}</span>
      </div>
    {/if}
  {/each}
</div>
```

- [ ] **Step 6: Wire proximity into Results page**

Add proximity lookup to `src/routes/estimate/+page.server.ts` (add import and call after DVF fetch):

```typescript
import { lookupProximity } from '$lib/api/proximity';
// ... in the load function, after fetching comparables:
const proximity = lookupProximity(dept, lat, lon, 1000);
// ... add to return object:
// proximity,
```

Add ProximityBadges to `src/routes/estimate/+page.svelte` below the map:

```svelte
import ProximityBadges from '$lib/components/ProximityBadges.svelte';
<!-- After the map component -->
<ProximityBadges proximity={data.proximity} />
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/api/proximity.ts src/lib/api/proximity.test.ts src/lib/components/ProximityBadges.svelte src/routes/estimate/+page.server.ts src/routes/estimate/+page.svelte
git commit -m "feat: add proximity data lookup and badges"
```

---

### Task 15: Final polish and push

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```
Expected: All tests pass.

- [ ] **Step 2: Run type check**

```bash
npx svelte-check --tsconfig ./tsconfig.json
```
Expected: No errors.

- [ ] **Step 3: Test full flow manually**

1. Go to http://localhost:5173
2. Type "15 rue Cler, 75007 Paris" → autocomplete works
3. Select Appartement, surface 60m²
4. Click "Estimer"
5. Verify: price range, map with markers, comparable cards, proximity badges
6. Click a card → map pans. Click a marker → card highlights.
7. Test sort buttons (distance, prix/m², date)
8. Test without surface → shows price/m² only + prompt message

- [ ] **Step 4: Add .gitignore**

```
node_modules/
.svelte-kit/
build/
static/data/bpe/
static/data/transport/
scripts/bpe24_ensemble_xy.csv
```

- [ ] **Step 5: Commit and push**

```bash
git add -A
git commit -m "feat: EstimeIA demonstrator — complete MVP"
git push -u origin master
```

---

## Summary

| Task | What it builds | Key files |
|------|---------------|-----------|
| 1 | SvelteKit scaffold + design tokens | package.json, tailwind.config.js, app.css |
| 2 | Config constants | src/lib/config.ts |
| 3 | Haversine distance + radius filter | src/lib/utils/geo.ts |
| 4 | Weighted percentile estimation | src/lib/utils/estimation.ts, src/lib/types.ts |
| 5 | BAN geocoding client | src/lib/api/ban.ts |
| 6 | DVF API client with pagination | src/lib/api/dvf.ts |
| 7 | Geocode API proxy route | src/routes/api/geocode/+server.ts |
| 8 | Layout + Home page | src/routes/+layout.svelte, +page.svelte |
| 9 | Address autocomplete | src/lib/components/AddressSearch.svelte |
| 10 | Results server load | src/routes/estimate/+page.server.ts |
| 11 | Results page + components | PriceRange, ComparableCard, ComparablesList |
| 12 | Leaflet map | src/lib/components/Map.svelte |
| 13 | BPE data prep script | scripts/prepare-data.ts |
| 14 | Proximity lookup + badges | src/lib/api/proximity.ts, ProximityBadges |
| 15 | Polish, tests, push | .gitignore, final verification |
