# Sprint 2 — Cadastre + PLU + Copropriété Réels — Design Spec

**Date:** 2026-04-08
**Statut:** Validé

## Contexte

Sprint 1 a intégré les loyers et permis réels. Sprint 2 remplace les 3 derniers mocks Pro par des données réelles gratuites : cadastre (IGN), PLU (GPU/IGN), copropriété (RNIC/ANAH). Seul "Propriétaires" reste verrouillé (nécessite Pappers payant).

## Feature 1 : Cadastre

### API Module `src/lib/api/cadastre.ts`

Requête l'API Carto IGN :
```
GET https://apicarto.ign.fr/api/cadastre/parcelle?geom={"type":"Point","coordinates":[lon,lat]}&_limit=1
```

Pas de clé API requise. Retourne un GeoJSON FeatureCollection.

**Fonction :** `fetchCadastre(lat: number, lon: number): Promise<CadastreResult | null>`

**Champs extraits :**
- `section` + `numero` → référence parcelle (ex: "AE 0003")
- `contenance` → surface terrain en m²
- `code_insee` + `code_arr` + `section` + `numero` → référence cadastrale 14 chars pour RNIC

**Construction référence cadastrale 14 chars :**
Format RNIC : `{code_insee:5}{prefixe:3}{section:2}{numero:4}` = 14 chars.
- `code_insee` = `properties.code_insee` (toujours 5 chars, ex: "75056")
- `prefixe` = `properties.code_arr` (3 chars : "104" pour Paris 4e, "000" pour communes normales)
- `section` = `properties.section`.padStart(2, '0') — **IMPORTANT** : IGN peut retourner "K" au lieu de "0K", il faut padder à 2 chars
- `numero` = `properties.numero`.padStart(4, '0') — padder à 4 chars
Exemple Paris : `75056` + `104` + `AE` + `0003` = `75056104AE0003`
Exemple Colombes : `92025` + `000` + `AD` + `0145` = `92025000AD0145`

**Retour :**
```typescript
export interface CadastreResult {
  reference: string;           // "AE 0003"
  reference_cadastrale: string; // "75056104AE0003" (pour RNIC)
  surface_terrain: number;     // m²
  code_insee: string;
  code_arr: string;
  section: string;
  numero: string;
}
```

### Composant `CadastreBadge.svelte`

Affiché dans la section Environnement. Layout similaire à CommuneContext (grille d'items avec icônes) :
- Référence parcelle
- Surface terrain (m²)
- Ratio terrain/bâti (si surfaceM2 fournie) : `surface_terrain / surfaceM2`
- Source : "Cadastre — IGN/DGFiP"

## Feature 2 : Urbanisme PLU

### API Module `src/lib/api/urbanisme.ts`

Requête l'API Carto GPU :
```
GET https://apicarto.ign.fr/api/gpu/zone-urba?geom={"type":"Point","coordinates":[lon,lat]}
```

Pas de clé API requise. Retourne un GeoJSON FeatureCollection.

**Fonction :** `fetchUrbanisme(lat: number, lon: number): Promise<UrbanismeResult | null>`

**Champs extraits :**
- `typezone` → U (Urbain), AU (A Urbaniser), A (Agricole), N (Naturel)
- `libelle` → code court (ex: "US", "UA")
- `libelong` → description longue
- `destdomi` → destination dominante (si renseignée)
- `idurba` → identifiant du document d'urbanisme

**Retour :**
```typescript
export interface UrbanismeResult {
  typezone: string;
  libelle: string;
  libelong: string;
  destdomi: string | null;
  document: string;   // extrait de idurba (ex: "PLU Paris")
}
```

### Composant `UrbanismeBadge.svelte`

Layout expandable (même pattern que RiskBadges) :

Vue compacte :
- Badge coloré selon typezone (U=bleu, AU=ambre, A=vert, N=vert foncé)
- Libellé long
- Chevron expand

Vue développée :
- Type de zone avec description
- Code libellé
- Destination dominante si dispo
- Document d'urbanisme source
- Source : "GPU — Géoportail de l'Urbanisme (IGN)"

## Feature 3 : Copropriété

### API Module `src/lib/api/copropriete.ts`

Requête le Tabular API RNIC sur la ressource `3ea8e2c3-0038-464a-b17e-cd5c91f65ce2`, filtrée par référence cadastrale.

**Fonction :** `fetchCopropriete(referenceCadastrale: string): Promise<CoproprieteResult | null>`

**URL :** `GET ${config.DVF_API_BASE}/${config.RNIC_RESOURCE_ID}/data/?reference_cadastrale_1__exact=${referenceCadastrale}&page_size=1`

**Note data quality :** Beaucoup de copropriétés RNIC ont `reference_cadastrale_1` vide. Le lookup silencieusement échoue dans ces cas. Le composant ne s'affiche pas (comportement acceptable — pas de message d'erreur).

Les valeurs `"non connu"` dans `type_syndic` sont normalisées en `null`.

**Champs extraits :**
- `nombre_total_lots` → nb lots total
- `nombre_lots_habitation` → nb lots habitation
- `nombre_lots_stationnement` → nb lots stationnement
- `periode_construction` → période (ex: "AVANT_1949")
- `type_syndic` → professionnel / bénévole / coopératif
- `nom_usage_copropriete` → nom de la copro

**Retour :**
```typescript
export interface CoproprieteResult {
  nom: string;
  lots_total: number;
  lots_habitation: number;
  lots_stationnement: number;
  periode_construction: string;
  type_syndic: string | null;
}
```

### Composant `CoproprieteBadge.svelte`

Layout similaire à CommuneContext (grille d'items) :
- Nom de la copro
- Nb lots (total / habitation / stationnement)
- Période de construction
- Type de syndic
- Source : "RNIC — ANAH"

Si la copro n'est pas trouvée (bien non en copropriété ou non immatriculé), le composant ne s'affiche pas.

## Types TypeScript

Ajoutés dans `src/lib/types.ts` :
- `CadastreResult`
- `UrbanismeResult`
- `CoproprieteResult`

Supprimés :
- `MockCadastreData`
- `MockUrbanismeData`
- `MockCoproprieteData`

`ProFeature` réduit à : `'proprietaires'` uniquement.

## Flux de données `+page.server.ts`

```
Promise.all existant:
  [proximity, dpe, risks, communeCtx, rentData, permits,
   cadastre,    ← AJOUTÉ (indépendant, par lat/lon)
   urbanisme]   ← AJOUTÉ (indépendant, par lat/lon)

// Séquentiel après cadastre
const copropriete = cadastre?.reference_cadastrale
  ? await fetchCopropriete(cadastre.reference_cadastrale)
  : null;
```

Ajout au `return` : `cadastre`, `urbanisme`, `copropriete`

## Placement dans la page

Dans la section Environnement, après les composants existants (DPE, Risks, Proximity, RentEstimate, PermitsBadge, CommuneContext), dans cet ordre :
1. `CadastreBadge` (si cadastre non null)
2. `UrbanismeBadge` (si urbanisme non null)
3. `CoproprieteBadge` (si copropriete non null)

## Section Pro réduite

La section "Données Pro" ne contient plus qu'un seul bloc : Propriétaires (MockProprietaires). Le layout passe de `grid-cols-2` à un bloc pleine largeur (`max-w-md mx-auto`) centré, avec le header "Données Pro" + badge PRO conservé.

`ProFeature` réduit à `'proprietaires'`. Default `waitlistFeature` mis à jour en conséquence.

## Config `src/lib/config.ts`

Ajout :
```typescript
RNIC_RESOURCE_ID: '3ea8e2c3-0038-464a-b17e-cd5c91f65ce2',
```

Les URLs des API Carto IGN sont constantes dans les modules respectifs (pas dans config, car ce sont des APIs externes avec une URL fixe, pas des resources data.gouv.fr).

## Fichiers créés/modifiés

**Nouveaux :**
- `src/lib/api/cadastre.ts`
- `src/lib/api/urbanisme.ts`
- `src/lib/api/copropriete.ts`
- `src/lib/components/CadastreBadge.svelte`
- `src/lib/components/UrbanismeBadge.svelte`
- `src/lib/components/CoproprieteBadge.svelte`

**Modifiés :**
- `src/lib/types.ts` — ajout CadastreResult, UrbanismeResult, CoproprieteResult; suppression Mock types; réduction ProFeature
- `src/lib/config.ts` — ajout RNIC_RESOURCE_ID
- `src/routes/estimate/+page.server.ts` — ajout fetch cadastre + urbanisme + copropriete
- `src/routes/estimate/+page.svelte` — ajout composants, suppression 3 mocks du Pro
- `src/lib/data/mock-pro.ts` — suppression mockCadastre, mockUrbanisme, mockCopropriete (ne garde que mockProprietaire)

**Supprimés :**
- `src/lib/components/MockCadastre.svelte`
- `src/lib/components/MockUrbanisme.svelte`
- `src/lib/components/MockCopropriete.svelte`

## Gestion d'erreurs

Même pattern : try/catch → null. Les composants ne s'affichent pas si données nulles. Les APIs IGN sont sans authentification et stables.

## Hors scope

- Affichage du polygone parcelle sur la carte Leaflet (Sprint 3)
- Prescriptions et servitudes d'urbanisme (trop détaillé pour le MVP)
- Historique des copropriétés
