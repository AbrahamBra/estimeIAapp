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
  covid_period: boolean;
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
  confidence_score: number;
  confidence_factors: {
    count_score: number;
    cv_score: number;
    recency_score: number;
  };
}

export interface YearlyTrend {
  year: number;
  median_prix_m2: number;
  count: number;
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

export type DpeClass = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface DpeResult {
  count: number;
  dominant_dpe: DpeClass;
  dominant_ges: DpeClass;
  avg_conso_m2: number | null;
  avg_ges_m2: number | null;
  distribution: Record<string, number>;
}

export interface RiskResult {
  commune: string;
  risks: string[];
  catnat_count: number;
  catnat_types: Record<string, number>;
}

export interface CommuneContext {
  population: number | null;
  density: number | null;       // hab/km²
  taxe_fonciere: number | null; // taux global TFB %
  teom: number | null;          // taux TEOM %
  water_quality: 'conforme' | 'non_conforme' | null;
  water_analyses: number | null;
  water_conform_pct: number | null;
}

export interface PropertyCharacteristics {
  floor: 'rdc' | '1-2' | '3-4' | '5+' | 'last' | null;
  elevator: boolean | null;
  outdoor: 'none' | 'balcony' | 'terrace' | 'garden' | 'loggia' | null;
  view: 'vis-a-vis' | 'street' | 'clear' | 'panoramic' | null;
  exposure: 'north' | 'east-west' | 'south' | 'dual' | null;
  condition: 'to-renovate' | 'to-refresh' | 'good' | 'like-new' | null;
  parking: 'none' | 'outdoor' | 'garage' | 'box' | null;
  noise: 'noisy' | 'normal' | 'quiet' | 'very-quiet' | null;
  pool: boolean | null;
}

export interface CharacteristicsBreakdownItem {
  label: string;
  value: string;
  coefficient: number;
}

export interface CharacteristicsResult {
  coefficient: number;
  breakdown: CharacteristicsBreakdownItem[];
}

// === Pro Features (locked/mock) ===

export type ProFeature = 'proprietaires';

export interface RentEstimate {
  loyer_m2: number;
  loyer_m2_low: number;
  loyer_m2_high: number;
  loyer_mensuel: number | null;
  rendement_brut: number | null;
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

export interface MockProprietaireData {
  type: 'SCI' | 'personne_physique' | 'bailleur_social';
  nom: string;
  date_acquisition: string;
}

export interface CadastreResult {
  reference: string;
  reference_cadastrale: string;
  surface_terrain: number;
  code_insee: string;
  code_arr: string;
  section: string;
  numero: string;
}

export interface UrbanismeResult {
  typezone: string;
  libelle: string;
  libelong: string;
  destdomi: string | null;
  document: string;
}

export interface CoproprieteResult {
  nom: string;
  lots_total: number;
  lots_habitation: number;
  lots_stationnement: number;
  periode_construction: string;
  type_syndic: string | null;
}
