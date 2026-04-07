# Features Pro Verrouillées — Design Spec

**Date:** 2026-04-07
**Statut:** Validé

## Contexte

EstimeIA propose actuellement une estimation gratuite avec DVF, DPE, Géorisques, proximité et contexte commune. Pour convertir les utilisateurs en abonnés payants, on ajoute 5 features "Pro" affichées avec des données mockées floutées et un CTA waitlist. Aucune API externe (Pappers) n'est nécessaire pour cette phase — on valide la demande marché avant d'investir.

## Architecture

### Composant générique `LockedFeature.svelte`

Wrapper réutilisable pour toutes les features Pro :

- Affiche le contenu enfant en **flou CSS** (`filter: blur(6px)` + `pointer-events: none`)
- Overlay semi-transparent avec icône cadenas (SVG inline)
- Titre de la feature + phrase d'accroche (teaser) passés en props
- Badge "PRO" doré en haut à droite
- CTA "Débloquer avec EstimeIA Pro" qui ouvre `WaitlistModal`

**Props :**
- `title: string` — nom de la feature
- `teaser: string` — phrase d'accroche avec données fictives
- `feature: ProFeature` — identifiant typé de la feature (union type)
- `address: string` — adresse recherchée (passée au modal waitlist)

**State :** Un seul `WaitlistModal` partagé au niveau de la page estimate. Les `LockedFeature` émettent un event custom pour l'ouvrir avec le contexte (`feature` + `address`). La page gère l'état `showWaitlist` via `$state()`.

**Usage :**
```svelte
<LockedFeature title="Permis de construire" teaser="12 permis délivrés autour de ce bien" feature="permits">
  <MockPermits />
</LockedFeature>
```

### Modale Waitlist `WaitlistModal.svelte`

- S'ouvre au clic sur n'importe quel CTA Pro
- Champs : **email** (requis, validation HTML5 `type="email"`) + **nom d'agence** (optionnel)
- Bouton "Rejoindre la liste d'attente"
- États : `idle` → `submitting` (loading spinner) → `success` (message confirmation) | `error` (message retry)
- Message de confirmation : "Merci ! Nous vous contacterons dès le lancement d'EstimeIA Pro."
- Stocke le contexte : feature déclencheuse, adresse recherchée, timestamp

**Props :**
- `feature: ProFeature` — feature qui a déclenché l'ouverture
- `address: string` — adresse recherchée
- `open: boolean` — bindable, contrôle l'ouverture
- `onclose: () => void` — callback de fermeture

**Validation & erreurs :**
- Email validé via `type="email"` natif + `required`
- En cas d'erreur réseau : message "Une erreur est survenue, veuillez réessayer" + bouton retry
- Pas de prévention de doublon côté client (le Google Sheet gère)

**Accessibilité :**
- `role="dialog"` + `aria-labelledby` sur le titre
- Focus trap dans la modale (focus sur le premier input à l'ouverture, Tab cyclique)
- Fermeture via Escape ou clic hors modale
- Le contenu flouté derrière a `aria-hidden="true"`

**Stockage des leads :** POST vers un Google Form/Sheet endpoint (URL en variable d'environnement `PUBLIC_WAITLIST_ENDPOINT`). Données envoyées : email, nom agence, feature, adresse, timestamp.

## Les 5 Features Pro

### 1. Permis de construire (`MockPermits.svelte`)

Tableau de 3-4 permis fictifs :
- Date, type (construction neuve / extension / démolition), adresse partielle floutée, surface
- Mini indicateur "Pression immobilière" : jauge basse/moyenne/haute
- Teaser : *"X permis délivrés dans un rayon de 500m ces 2 dernières années"*

### 2. Cadastre (`MockCadastre.svelte`)

- Référence parcelle fictive (ex: AK 0142)
- Surface terrain, surface bâtie, ratio terrain/bâti
- Mini schéma simplifié de la parcelle (rectangle coloré)
- Teaser : *"Surface terrain : XXX m² — Ratio terrain/bâti : X.X"*

### 3. Urbanisme PLU (`MockUrbanisme.svelte`)

- Zone PLU fictive (ex: UA, UB, AU) avec description courte
- COS/emprise au sol
- Règles principales (hauteur max, recul)
- Teaser : *"Zone UA — Constructibilité et règles d'urbanisme"*

### 4. Propriétaires (`MockProprietaires.svelte`)

- Type de propriétaire (SCI / personne physique / bailleur social)
- Nom de la SCI flouté
- Date d'acquisition floutée
- Teaser : *"Propriétaire identifié — SCI ••••••"*

### 5. Copropriété (`MockCopropriete.svelte`)

- Nombre de lots, nombre de bâtiments
- Syndic (nom flouté)
- Charges annuelles moyennes
- Teaser : *"Copropriété de XX lots — Charges moyennes : XX€/m²/an"*

## Types TypeScript

Ajoutés dans `src/lib/types.ts` :

```typescript
export type ProFeature = 'permits' | 'cadastre' | 'urbanisme' | 'proprietaires' | 'copropriete';

export interface MockPermit {
  date: string;
  type: 'construction' | 'extension' | 'demolition' | 'amenagement';
  address: string;
  surface_m2: number;
}

export interface MockCadastreData {
  reference: string;       // ex: "AK 0142"
  surface_terrain: number; // m²
  surface_batie: number;   // m²
  ratio: number;           // terrain/bati
}

export interface MockUrbanismeData {
  zone: string;            // ex: "UA", "UB", "AU"
  zone_label: string;      // ex: "Zone urbaine dense"
  cos: number;             // coefficient d'occupation des sols
  emprise: number;         // % emprise au sol
  hauteur_max: string;     // ex: "R+4 (15m)"
  recul: string;           // ex: "5m minimum"
}

export interface MockProprietaireData {
  type: 'SCI' | 'personne_physique' | 'bailleur_social';
  nom: string;             // flouté: "SCI ••••••"
  date_acquisition: string;// floutée
}

export interface MockCoproprieteData {
  lots: number;
  batiments: number;
  syndic: string;          // flouté
  charges_moy_m2: number;  // €/m²/an
}
```

## Données Mockées

Fichier `src/lib/data/mock-pro.ts` contenant des valeurs statiques réalistes typées pour chaque feature. Les données sont fixes (pas random) pour un rendu cohérent.

## Placement dans la page

Les 5 blocs Pro s'affichent **après les sections gratuites existantes** (DPE, Risques, Proximité, Commune), dans une zone avec :
- Header "Données Pro" avec badge doré
- Séparateur visuel clair

Ordre d'affichage :
1. Permis de construire
2. Cadastre / terrain
3. Urbanisme PLU
4. Propriétaires
5. Copropriété

## Fichiers à créer/modifier

**Nouveaux fichiers :**
- `src/lib/components/LockedFeature.svelte`
- `src/lib/components/WaitlistModal.svelte`
- `src/lib/components/MockPermits.svelte`
- `src/lib/components/MockCadastre.svelte`
- `src/lib/components/MockUrbanisme.svelte`
- `src/lib/components/MockProprietaires.svelte`
- `src/lib/components/MockCopropriete.svelte`
- `src/lib/data/mock-pro.ts`

**Fichiers modifiés :**
- `src/routes/estimate/+page.svelte` — ajout de la section Pro après les sections existantes

## Responsive & Print

- **Mobile :** Les blocs Pro s'empilent en colonne unique (`grid-cols-1`), même layout que les sections existantes
- **Desktop :** Même grille que les badges existants
- **Print :** Les sections Pro sont masquées (`print:hidden`) — pas de valeur à imprimer des données floutées

## Hors scope

- Intégration API Pappers (Phase 2, après validation marché)
- Système de paiement Stripe
- Authentification / gestion de comptes
- Données réelles
- Analytics avancé (Phase 2 — pour le MVP, le Google Sheet suffit pour mesurer la demande)
