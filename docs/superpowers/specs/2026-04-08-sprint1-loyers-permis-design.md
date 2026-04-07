# Sprint 1 — Rendement Locatif + Permis Réels — Design Spec

**Date:** 2026-04-08
**Statut:** Validé

## Contexte

EstimeIA affiche actuellement des données mockées pour les permis de construire (verrouillées derrière un paywall Pro). Ce sprint intègre deux sources de données réelles gratuites via le Tabular API data.gouv.fr :
1. **Carte des Loyers 2025** — loyer médian/m² par commune → rendement locatif estimé
2. **SITADEL** — permis de construire réels par commune → pression immobilière

Les deux features sont **gratuites** (non verrouillées) pour enrichir l'estimation de base.

## Feature 1 : Rendement Locatif

### API Module `src/lib/api/loyers.ts`

Requête le Tabular API data.gouv.fr sur les ressources Carte des Loyers 2025 :
- Ressource **appartement** : `55b34088-0964-415f-9df7-d87dd98a09be`
- Ressource **maison** : `129f764d-b613-44e4-952c-5ff50a8c9b73`

**Logique :**
- Sélectionner la ressource selon `propertyType` (Appartement → app, Maison → maison)
- Filtrer par `INSEE_C` (code INSEE commune)
- Retourner 1 ligne avec : `loypredm2`, `lwr.IPm2`, `upr.IPm2`, `nbobs_com`

**Fonction :** `fetchRentEstimate(inseeCode: string, propertyType: 'Appartement' | 'Maison'): Promise<RentEstimate | null>`

**Retour :**
- `loyer_m2` : loyer médian prédit/m² (arrondi 2 décimales)
- `loyer_m2_low` / `loyer_m2_high` : intervalle de confiance
- `source_annonces` : nombre d'annonces observées (`nbobs_com`)

### Calcul rendement dans `+page.server.ts`

Après réception de `rentData` et `estimation` :
- `loyer_mensuel = loyer_m2 * surfaceM2` (si surface fournie, sinon null)
- `rendement_brut = ((loyer_m2 * 12) / estimation.median_per_m2) * 100` (retourne un pourcentage, ex: 4.5 = 4.5%)
- Pas de rendement net (impossible à calculer correctement sans valeur locative cadastrale — la taxe foncière dans communeCtx est un taux appliqué à la VLC, pas au prix du bien)

### Composant `RentEstimate.svelte`

Affiché dans la section **Environnement** (feature gratuite). Layout similaire à `CommuneContext.svelte` :

- Loyer estimé : `XX.XX €/m²/mois` avec intervalle [low — high]
- Loyer mensuel total : `X XXX €/mois` (si surface fournie)
- Rendement brut : jauge colorée + pourcentage
  - < 3% : rouge (faible)
  - 3-5% : ambre (correct)
  - > 5% : vert (bon)
  - > 8% : vert foncé (excellent)
- Fiabilité : basée sur `source_annonces` (< 50 → "Indicatif", 50-200 → "Fiable", > 200 → "Très fiable")
- Source : "Carte des loyers 2025 — Min. Transition écologique"

## Feature 2 : Permis de Construire Réels

### API Module `src/lib/api/permits.ts`

Requête le Tabular API sur la ressource SITADEL logements : `65a9e264-7a20-46a9-9d98-66becb817bc3`

**Logique :**
- Filtrer par `COMM` (code INSEE commune, 5 chiffres)
- Filtrer `ETAT_DAU` pour n'inclure que les permis autorisés/en cours/achevés (valeurs 4, 5, 6)
- Récupérer les permis des 2 dernières années (filtre `DATE_REELLE_AUTORISATION__greater=2024-04-01`)
- Paginer si nécessaire (max 200 résultats par page, max 3 pages)
- Agréger : total permis, total logements créés, répartition ind/col

**Fonction :** `fetchPermits(inseeCode: string): Promise<PermitsResult | null>`

**Champs extraits par permis :**
- `DATE_REELLE_AUTORISATION` → date
- `TYPE_DAU` → type (PC = Permis de Construire, DP = Déclaration Préalable)
- `NB_LGT_TOT_CREES` → nb logements
- `NB_LGT_IND_CREES` / `NB_LGT_COL_CREES` → répartition
- `SURF_HAB_CREEE` → surface habitable
- `ADR_LIBVOIE_TER` + `ADR_LOCALITE_TER` → adresse partielle

### Composant `PermitsBadge.svelte`

Remplace `MockPermits.svelte` dans la page. Le composant sort du wrapper `LockedFeature` et s'affiche dans la section **Environnement** (feature gratuite).

Layout similaire à `RiskBadges.svelte` (carte blanche, expandable au clic) :

**Vue compacte :**
- "Permis de construire" + badge pression (Faible/Moyenne/Forte)
- "X permis — Y logements autorisés"
- Chevron expand

**Vue développée (au clic) :**
- Répartition individuel/collectif (mini barres horizontales)
- Liste des 5 derniers permis : date, type (PC/DP badge), nb logements, surface
- Source : "SITADEL — SDES (Min. Transition écologique)"

**Indicateur de pression :**
- < 5 permis → Faible (vert)
- 5-20 permis → Moyenne (ambre)
- > 20 permis → Forte (rouge/corail)

### Suppression du bloc Pro "Permis"

- Supprimer le `LockedFeature` + `MockPermits` de la section Pro dans `+page.svelte`
- `MockPermits.svelte` est supprimé (remplacé par `PermitsBadge.svelte`)
- La section Pro passe de 5 à 4 blocs (cadastre, urbanisme, propriétaires, copropriété)

## Résolution du code INSEE

### Utilitaire `src/lib/api/insee.ts`

Les deux APIs ont besoin du code INSEE, mais avec des conventions **différentes** pour Paris/Lyon/Marseille :
- **Carte des Loyers** : utilise les codes arrondissement (`75104` pour Paris 4e)
- **SITADEL** : utilise le code commune principal (`75056` pour tout Paris)

On extrait les fonctions existantes de `commune.ts` et on les regroupe ici :

**Fonctions :**
- `postcodeToArrondissement(postcode: string): string` — Paris `75004`→`75104`, Lyon `69003`→`69383`, Marseille `13005`→`13205`. Pour la Carte des Loyers et API Géo.
- `postcodeToMainCommune(postcode: string): string` — Paris `75XXX`→`75056`, Lyon `690XX`→`69123`, Marseille `130XX`→`13055`. Pour SITADEL, Hub'Eau, Fiscalité.
- `postcodeToInsee(postcode: string): Promise<string>` — Pour les communes normales : appel API Géo `/communes?codePostal=XXXXX&fields=code&limit=1`.

**Usage :**
- `loyers.ts` : `postcodeToArrondissement(postcode)` pour le filtre `INSEE_C`
- `permits.ts` : `postcodeToMainCommune(postcode)` pour le filtre `COMM`
- `commune.ts` : réutilise les fonctions depuis `insee.ts` au lieu de les définir localement

## Types TypeScript

Ajoutés dans `src/lib/types.ts` :

```typescript
export interface RentEstimate {
  loyer_m2: number;
  loyer_m2_low: number;
  loyer_m2_high: number;
  loyer_mensuel: number | null;
  rendement_brut: number | null;  // pourcentage (ex: 4.5 = 4.5%)
  source_annonces: number;
  fiabilite: 'indicatif' | 'fiable' | 'tres_fiable';
}

export interface PermitRecord {
  date: string;
  type_dau: 'PC' | 'DP';
  nb_logements: number;
  surface_hab: number;
  adresse: string;
}

export interface PermitsResult {
  total_permits: number;
  total_logements: number;
  individual_pct: number;
  collective_pct: number;
  pression: 'faible' | 'moyenne' | 'forte';
  permits: PermitRecord[];
}
```

## Modifications au flux de données `+page.server.ts`

1. Résoudre `inseeCode` via `postcodeToInsee(postcode)` (avant le Promise.all)
2. Ajouter au `Promise.all` existant :
   - `fetchRentEstimate(inseeCode, propertyType)`
   - `fetchPermits(inseeCode)`
3. Calculer rendement après réception des données
4. Ajouter au `return` : `rentEstimate`, `permits`

## Fichiers créés/modifiés

**Nouveaux :**
- `src/lib/api/loyers.ts` — fetch loyer médian par commune
- `src/lib/api/permits.ts` — fetch permis SITADEL par commune
- `src/lib/api/insee.ts` — résolution postcode → code INSEE
- `src/lib/components/RentEstimate.svelte` — affichage rendement locatif
- `src/lib/components/PermitsBadge.svelte` — affichage permis réels

**Modifiés :**
- `src/lib/types.ts` — ajout types RentEstimate, PermitRecord, PermitsResult
- `src/lib/api/commune.ts` — réutiliser `postcodeToInsee` depuis `insee.ts`
- `src/routes/estimate/+page.server.ts` — ajout fetch loyers + permis + calcul rendement
- `src/routes/estimate/+page.svelte` — ajout composants + suppression MockPermits du Pro

**Supprimés :**
- `src/lib/components/MockPermits.svelte` — remplacé par PermitsBadge
- `MockPermit` interface dans `types.ts` — plus utilisée
- `'permits'` dans le type `ProFeature` — plus verrouillé
- `mockPermits` dans `mock-pro.ts` — plus utilisé

**Config (`src/lib/config.ts`) — ajout des resource IDs :**
```typescript
LOYERS_APPART_RESOURCE_ID: '55b34088-0964-415f-9df7-d87dd98a09be',
LOYERS_MAISON_RESOURCE_ID: '129f764d-b613-44e4-952c-5ff50a8c9b73',
SITADEL_RESOURCE_ID: '65a9e264-7a20-46a9-9d98-66becb817bc3',
```

## Gestion d'erreurs

Même pattern que toutes les autres APIs du projet : `try/catch` → retourne `null`. Les composants n'affichent rien si données nulles. L'estimation principale n'est jamais impactée.

## Hors scope

- Rendement net précis (nécessiterait charges de copropriété, assurance, etc.)
- Géolocalisation des permis (SITADEL n'a pas de coordonnées fiables)
- Historique multi-années des loyers (une seule année disponible)
- Rendement net (nécessiterait la valeur locative cadastrale, non disponible en open data)
- Tests unitaires (hors scope sprint 1, à ajouter en sprint 2)
