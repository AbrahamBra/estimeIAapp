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
