import type {
  MockPermit,
  MockCadastreData,
  MockUrbanismeData,
  MockProprietaireData,
  MockCoproprieteData,
} from '$lib/types';

export const mockPermits: MockPermit[] = [
  { date: '2025-09-14', type: 'construction', address: '12 rue des ••••••', surface_m2: 185 },
  { date: '2025-06-03', type: 'extension', address: '8 avenue ••••••', surface_m2: 42 },
  { date: '2024-11-22', type: 'amenagement', address: '3 bd ••••••', surface_m2: 95 },
  { date: '2024-08-10', type: 'demolition', address: '17 rue ••••••', surface_m2: 120 },
];

export const mockCadastre: MockCadastreData = {
  reference: 'AK 0142',
  surface_terrain: 485,
  surface_batie: 142,
  ratio: 3.4,
};

export const mockUrbanisme: MockUrbanismeData = {
  zone: 'UA',
  zone_label: 'Zone urbaine dense',
  cos: 0.8,
  emprise: 60,
  hauteur_max: 'R+4 (15m)',
  recul: '5m minimum',
};

export const mockProprietaire: MockProprietaireData = {
  type: 'SCI',
  nom: 'SCI ••••••',
  date_acquisition: '••/••/2019',
};

export const mockCopropriete: MockCoproprieteData = {
  lots: 24,
  batiments: 2,
  syndic: 'Cabinet ••••••',
  charges_moy_m2: 32,
};
