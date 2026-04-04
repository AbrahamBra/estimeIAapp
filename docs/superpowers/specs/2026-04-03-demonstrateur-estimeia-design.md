# EstimeIA Demonstrator — Design Specification

**Date:** 2026-04-03
**Status:** Draft
**Project:** estimeia-app (separate from landing page in estimeIA/)

## 1. Purpose

Build a working demonstrator for EstimeIA that serves two goals:
1. **Technical validation** — confirm that open data sources (DVF, BAN, BPE) are sufficient to power automated real estate estimations across France
2. **Commercial demo** — a polished prototype to show real estate agents during sales meetings ("enter an address, see comparable sales instantly")

This is NOT the full SaaS product. No auth, no persistence, no billing, no learning system.

## 2. User Persona

**Independent real estate agent** (target: agencies of 2–15 agents) who currently spends ~3 hours per manual estimation. They want to see comparable recent sales near an address, with proximity context, in under 15 minutes.

## 3. User Flow

```
Agent enters address + property type + surface
        │
        ▼
BAN autocomplete resolves address → GPS coordinates
        │
        ▼
Server queries DVF Tabular API (same postal code, same property type, sales only)
        │
        ▼
Server filters results: radius (500m–2km), surface (±30%), date (2024–2025 priority)
        │
        ▼
Server computes price range: median €/m², standard deviation, weighted by distance + recency
        │
        ▼
Server looks up proximity data from pre-loaded BPE + transport datasets
        │
        ▼
Results page: map + comparable list + price range + proximity badges
```

## 4. Pages

### 4.1 Home Page (/)

Single-purpose: enter an address and get an estimation.

**Elements:**
- EstimeIA logo + tagline
- Address input with BAN autocomplete (debounce 300ms, min 3 chars)
- Property type selector: Appartement | Maison
- Surface input (m², optional — refines comparable filtering. Without it, only price/m² range is shown, no total price)
- "Estimer" button
- Footer with link back to landing page

### 4.2 Results Page (/estimate)

Two-column layout (desktop), stacked (mobile).

**Header bar:**
- Address searched
- Property type + surface
- Price range: "9 200 – 10 800 €/m²"
- Number of comparables found
- "Nouvelle estimation" link back to home

**Left column — Map (Leaflet + OpenStreetMap):**
- Target address: red marker
- DVF comparables: blue markers with price on hover
- Proximity points: colored icons by category (toggleable layers)
- Radius circle (adjustable: 500m / 1km / 2km)
- Click marker → scroll list to corresponding card, highlight with sage border. Click card → pan map to marker, open popup. List sort order is preserved during interactions.

**Right column — Comparable sales list:**
- Cards sorted by distance (default), toggleable by price/m², date, distance
- Each card: address, surface, rooms, price, price/m², date, distance from target
- Click card → pan map to marker

**Bottom section — Proximity summary:**
- Badges: schools (<500m), transit stops (<300m), shops, parks
- Count + closest distance per category

## 5. Architecture

### 5.1 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | SvelteKit | SSR + API routes, future SaaS foundation |
| Language | TypeScript (strict) | Type safety, better DX |
| Styling | Tailwind CSS | Design tokens from landing page (ivory/navy/sage) |
| Map | Leaflet + OpenStreetMap | Free, battle-tested, sufficient for demo |
| Deployment | Vercel | Zero-config SvelteKit hosting |

### 5.2 Project Structure

```
estimeia-app/
├── src/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── dvf.ts            # DVF Tabular API client
│   │   │   ├── ban.ts            # BAN geocoding client
│   │   │   └── proximity.ts      # BPE/transport lookup (pre-loaded data)
│   │   ├── utils/
│   │   │   ├── geo.ts            # Haversine distance, radius filtering
│   │   │   └── estimation.ts     # Median, std dev, price range calculation
│   │   └── components/
│   │       ├── AddressSearch.svelte
│   │       ├── Map.svelte
│   │       ├── ComparableCard.svelte
│   │       ├── ComparablesList.svelte
│   │       ├── PriceRange.svelte
│   │       └── ProximityBadges.svelte
│   ├── routes/
│   │   ├── +page.svelte          # Home (search form)
│   │   ├── +layout.svelte        # Shared layout (nav, footer)
│   │   ├── estimate/
│   │   │   ├── +page.svelte      # Results page
│   │   │   └── +page.server.ts   # Server load: DVF + proximity data
│   │   └── api/
│   │       └── geocode/+server.ts  # BAN autocomplete proxy
│   ├── app.css                   # Tailwind config + design tokens
│   └── app.html
├── static/
│   └── data/
│       ├── bpe/                  # Pre-processed BPE by department (JSON)
│       └── transport/            # Pre-processed transit stops (JSON)
├── scripts/
│   └── prepare-data.ts           # Downloads + transforms BPE/GTFS → JSON
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### 5.3 Data Flow

**BAN Autocomplete (real-time, client → server → BAN):**
```
Browser → GET /api/geocode?q=15+rue+cler → SvelteKit API route → api-adresse.data.gouv.fr → response
```
Debounced at 300ms. Returns top 5 suggestions with coordinates.

**DVF Query (on form submit, server-side):**
```
SvelteKit load function → GET tabular-api.data.gouv.fr/api/resources/d7933994-.../data/
  ?code_postal__exact=75007
  &type_local__exact=Appartement
  &nature_mutation__exact=Vente
  &date_mutation__sort=desc
  &page_size=200
```
**Pagination strategy:** The Tabular API caps `page_size` at 200. For dense postal codes (e.g., Paris 75007 has 5,700+ apartment sales), a single page may not yield enough nearby comparables. Strategy:
1. Fetch page 1 (200 most recent sales in the postal code)
2. Apply Haversine radius filter server-side
3. If fewer than 5 comparables remain, fetch page 2 (next 200)
4. Repeat up to 5 pages max (1,000 records total)
5. Stop early as soon as 15+ comparables are within radius

This balances latency (each page ~500ms) with coverage. Worst case: 5 pages × 500ms = 2.5s for DVF alone, within the 5s target.

Then server-side filtering: Haversine distance ≤ radius, surface ±30%, sort by relevance.

**Proximity Lookup (on form submit, server-side):**
```
SvelteKit load function → reads static JSON files for target department
  → filters by Haversine distance from target coordinates
  → returns categorized results (schools, transit, shops, parks)
```

## 6. Data Sources

| Source | Endpoint | Data | Update Frequency |
|--------|----------|------|-----------------|
| DVF Géolocalisé | tabular-api.data.gouv.fr resource `d7933994-2c66-4131-a4da-cf7cd18040a4` | ~20M transactions (2020–2025), 41 columns, GPS coords included | ~Biannual |
| BAN Géocodage | api-adresse.data.gouv.fr/search/ | Address → GPS. Free, no API key, 97%+ accuracy | Continuous |
| BPE (INSEE) | Download CSV from insee.fr | Schools, shops, health, sports, services. Geolocalized. | Annual |
| Transport (GTFS) | transport.data.gouv.fr | All French transit stops | Varies by network |

### 6.1 DVF Fields Used

| Field | Usage |
|-------|-------|
| `latitude`, `longitude` | Map placement, distance calculation |
| `valeur_fonciere` | Sale price |
| `surface_reelle_bati` | Built surface (m²) |
| `nombre_pieces_principales` | Room count |
| `type_local` | Property type filter (Appartement/Maison) |
| `date_mutation` | Sale date, recency weighting |
| `adresse_numero`, `adresse_nom_voie` | Display address |
| `code_postal`, `nom_commune` | Geographic filtering |
| `nature_mutation` | Filter to "Vente" only |
| `lot1_surface_carrez` – `lot5_surface_carrez` | Carrez surface when available |

### 6.2 DVF Known Limitations

- No floor number, elevator, parking, condition — the 20–40% variance factors
- Some transactions have `valeur_fonciere = 0` or very low values (family transfers) — must filter
- Multi-lot transactions can inflate prices — need deduplication by `id_mutation`
- Surface can be null for some records — fallback to Carrez surfaces

## 7. Estimation Logic

**Step 1 — Filter comparables:**
- Same `code_postal` (API filter)
- Same `type_local` (API filter)
- `nature_mutation` = "Vente" (API filter)
- Haversine distance ≤ selected radius (server filter)
- Surface within ±30% of target if provided (server filter)
- `valeur_fonciere` > 10 000€ (exclude anomalies)
- Deduplicate by `id_mutation`: keep only the row where `type_local` matches the searched property type. If multiple rows match, keep the one with the largest `surface_reelle_bati`.

**Step 2 — Compute price/m²:**
- For each comparable: `prix_m2 = valeur_fonciere / surface_reelle_bati`
- Exclude outliers using unweighted statistics: remove values beyond 2 standard deviations from the unweighted mean. This runs before weighting because we want to remove data-quality anomalies (family transfers, clerical errors), not statistically rare-but-valid sales.

**Step 3 — Assign weights:**
- Weight by recency: 2025 sales × 1.0, 2024 × 0.8, 2023 × 0.5, older × 0.3
- Weight by distance: < 200m × 1.0, < 500m × 0.8, < 1km × 0.5, < 2km × 0.3
- Combined weight = recency_weight × distance_weight

**Step 4 — Weighted percentiles (used for central estimate and range):**

Algorithm for weighted percentile P (e.g., P=0.5 for median):
1. Sort comparables by `prix_m2` ascending
2. For each comparable i, compute cumulative weight: `C(i) = sum of weights from index 0 to i`
3. Normalize: `C_norm(i) = (C(i) - weight(i)/2) / total_weight`
4. The weighted P-th percentile is the `prix_m2` of the first comparable where `C_norm(i) >= P`
5. Linear interpolation between adjacent values for smoother results

**Step 5 — Price range:**
- Low estimate: weighted 25th percentile (P=0.25) × target surface
- Central estimate: weighted median (P=0.50) × target surface
- High estimate: weighted 75th percentile (P=0.75) × target surface

**When surface is not provided:** Display price/m² range only (low/central/high per m²) without total price. Prompt the user: "Ajoutez la surface pour obtenir une estimation en euros."

## 8. Pre-loaded Static Data (BPE + Transport)

**Preparation script (`scripts/prepare-data.ts`):**
1. Download BPE CSV from INSEE
2. Download GTFS stops from transport.data.gouv.fr
3. Transform into lightweight JSON indexed by department code
4. Each entry: `{ lat, lon, type, name }`
5. Output to `static/data/bpe/` and `static/data/transport/`

**Categories mapped (BPE 2024 codebook, ref: insee.fr/fr/statistiques/8217537):**

The BPE uses single-letter domain codes (A–F) with sub-codes. Mapping for EstimeIA:

| BPE Domain | Sub-codes (examples) | Category | Icon |
|------------|---------------------|----------|------|
| A (Services) | A206 (Banque), A208 (Bureau de poste) | Services | Building |
| B (Commerce) | B101 (Hypermarché), B201 (Boulangerie) | Shops/commerce | Shopping bag |
| C (Enseignement) | C101 (École maternelle), C104 (Collège), C301 (Lycée) | Education/schools | Graduation cap |
| D (Santé) | D101 (Médecin), D301 (Pharmacie) | Health | Medical cross |
| E (Transport) | E107 (Gare), E108 (Aéroport) | Transport | Bus/train |
| F (Sports/Loisirs) | F101 (Bassin de natation), F303 (Cinéma) | Sports/leisure | Park/tree |

The `prepare-data.ts` script must reference the exact BPE codebook for the year used. Sub-code selection will be refined during implementation based on relevance to real estate agents.

**Runtime:** load JSON for target department, filter by Haversine distance ≤ 1km from target.

## 9. Design Tokens (from Landing Page)

```css
/* Colors (oklch) */
--ivory: oklch(0.97 0.01 90);
--navy: oklch(0.25 0.06 230);
--sage: oklch(0.58 0.14 155);
--dark-navy: oklch(0.15 0.04 230);

/* Typography */
--font-display: 'Playfair Display', serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

Map markers and UI elements follow the same palette. Sage for proximity markers, navy for DVF comparables, red for target address.

## 9.1 Environment Configuration

No API keys required (all public APIs). Configurable values stored in `src/lib/config.ts`:

```typescript
export const config = {
  DVF_RESOURCE_ID: 'd7933994-2c66-4131-a4da-cf7cd18040a4',
  DVF_API_BASE: 'https://tabular-api.data.gouv.fr/api/resources',
  BAN_API_BASE: 'https://api-adresse.data.gouv.fr',
  DEFAULT_RADIUS_M: 1000,
  MAX_DVF_PAGES: 5,
  MIN_COMPARABLES: 5,
  TARGET_COMPARABLES: 15,
};
```

## 9.2 Caching

No caching for the demonstrator. BAN and DVF are public APIs with sufficient capacity for demo usage. Caching (per postal code, per address) deferred to SaaS phase.

## 10. Error Handling

| Scenario | Behavior |
|----------|----------|
| BAN returns no results | "Adresse non trouvée. Vérifiez l'orthographe." |
| DVF returns 0 comparables | "Aucune vente trouvée dans ce secteur. Essayez un rayon plus large." |
| DVF returns < 3 comparables | Show results but warn: "Estimation peu fiable (moins de 3 ventes)" |
| DVF API timeout/error | "Service temporairement indisponible. Réessayez." |
| Surface not provided | Skip surface filtering, show price/m² range only, prompt "Ajoutez la surface pour une estimation en euros" |
| Address in Alsace-Moselle (67, 68, 57) | Show results with warning: "Données DVF potentiellement incomplètes pour ce département" |

## 11. Out of Scope (Deferred to SaaS)

- User authentication and accounts
- Estimation history and persistence
- Learning system (agent corrections feeding back)
- PDF report export
- CRM integrations (Hector, Modelo)
- Urban planning projects data
- Payment / subscription management
- Multi-user / agency management
- Alsace-Moselle full support (DVF data exists since 2021 but may be incomplete — warning shown in UI)

## 12. Success Criteria

The demonstrator is successful when:
1. An agent can enter any French address and get comparable sales in < 5 seconds. For addresses with < 3 comparables (rural areas), the system gracefully degrades with a low-reliability warning.
2. The map displays DVF transactions and proximity data correctly
3. The price range is coherent with market reality (validated on 5+ known addresses)
4. The UI is polished enough to show in a commercial meeting
5. The codebase is structured to evolve into the SaaS product
