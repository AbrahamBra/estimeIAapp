import type {
  PropertyCharacteristics,
  CharacteristicsResult,
  CharacteristicsBreakdownItem,
} from '$lib/types';

export const COEFFICIENTS_VERSION = '2026-04-v1';

const FLOOR_COEFFICIENTS: Record<string, number> = {
  'rdc': 0.85,
  '1-2': 0.95,
  '3-4': 1.00,
};

const FLOOR_ELEVATOR: Record<string, { with: number; without: number }> = {
  '5+': { with: 1.08, without: 0.85 },
  'last': { with: 1.17, without: 0.90 },
};

const OUTDOOR_COEFFICIENTS: Record<string, number> = {
  'none': 1.00, 'balcony': 1.05, 'terrace': 1.10, 'garden': 1.12, 'loggia': 1.06,
};

const VIEW_COEFFICIENTS: Record<string, number> = {
  'vis-a-vis': 0.93, 'street': 0.97, 'clear': 1.07, 'panoramic': 1.15,
};

const EXPOSURE_COEFFICIENTS: Record<string, number> = {
  'north': 0.93, 'east-west': 1.00, 'south': 1.07, 'dual': 1.10,
};

const CONDITION_COEFFICIENTS: Record<string, number> = {
  'to-renovate': 0.70, 'to-refresh': 0.92, 'good': 1.00, 'like-new': 1.12,
};

const PARKING_COEFFICIENTS: Record<string, number> = {
  'none': 1.00, 'outdoor': 1.05, 'garage': 1.08, 'box': 1.10,
};

const NOISE_COEFFICIENTS: Record<string, number> = {
  'noisy': 0.88, 'normal': 1.00, 'quiet': 1.03, 'very-quiet': 1.05,
};

const POOL_COEFFICIENT = 1.17;

const FLOOR_LABELS: Record<string, string> = {
  'rdc': 'RDC (rez-de-chaussée)', '1-2': 'Étage 1-2', '3-4': 'Étage 3-4',
};
const OUTDOOR_LABELS: Record<string, string> = {
  'none': "Pas d'extérieur", 'balcony': 'Balcon', 'terrace': 'Terrasse', 'garden': 'Jardin privatif', 'loggia': 'Loggia',
};
const VIEW_LABELS: Record<string, string> = {
  'vis-a-vis': 'Vis-à-vis', 'street': 'Vue sur rue', 'clear': 'Vue dégagée', 'panoramic': 'Vue panoramique',
};
const EXPOSURE_LABELS: Record<string, string> = {
  'north': 'Exposition nord', 'east-west': 'Exposition est/ouest', 'south': 'Exposition sud', 'dual': 'Double exposition / traversant',
};
const CONDITION_LABELS: Record<string, string> = {
  'to-renovate': 'À rénover', 'to-refresh': 'À rafraîchir', 'good': 'Bon état', 'like-new': 'Refait à neuf',
};
const PARKING_LABELS: Record<string, string> = {
  'none': 'Pas de parking', 'outdoor': 'Place extérieure', 'garage': 'Garage', 'box': 'Box fermé',
};
const NOISE_LABELS: Record<string, string> = {
  'noisy': 'Bruyant', 'normal': 'Normal', 'quiet': 'Calme', 'very-quiet': 'Très calme',
};

function addEntry(
  breakdown: CharacteristicsBreakdownItem[],
  label: string,
  value: string,
  coefficient: number
): number {
  if (coefficient === 1.0) return 1.0;
  breakdown.push({ label, value, coefficient });
  return coefficient;
}

export function computeCharacteristicsCoefficient(
  chars: PropertyCharacteristics,
  propertyType: string
): CharacteristicsResult {
  const breakdown: CharacteristicsBreakdownItem[] = [];
  let product = 1.0;
  const isAppartement = propertyType === 'Appartement';

  // Floor & elevator: only applies to apartments (a house is always ground-level)
  if (isAppartement && chars.floor !== null) {
    if (chars.floor in FLOOR_ELEVATOR) {
      const elevatorEntry = FLOOR_ELEVATOR[chars.floor];
      const hasElevator = chars.elevator === true;
      const coeff = hasElevator ? elevatorEntry.with : elevatorEntry.without;
      const floorLabel = chars.floor === 'last' ? 'Dernier étage' : 'Étage 5+';
      const elevLabel = hasElevator ? 'avec ascenseur' : 'sans ascenseur';
      product *= addEntry(breakdown, `${floorLabel} ${elevLabel}`, chars.floor, coeff);
    } else {
      const coeff = FLOOR_COEFFICIENTS[chars.floor] ?? 1.0;
      const label = FLOOR_LABELS[chars.floor] ?? chars.floor;
      product *= addEntry(breakdown, label, chars.floor, coeff);
    }
  }

  if (chars.outdoor !== null) {
    const coeff = OUTDOOR_COEFFICIENTS[chars.outdoor] ?? 1.0;
    product *= addEntry(breakdown, OUTDOOR_LABELS[chars.outdoor] ?? chars.outdoor, chars.outdoor, coeff);
  }

  if (chars.view !== null) {
    const coeff = VIEW_COEFFICIENTS[chars.view] ?? 1.0;
    product *= addEntry(breakdown, VIEW_LABELS[chars.view] ?? chars.view, chars.view, coeff);
  }

  if (chars.exposure !== null) {
    const coeff = EXPOSURE_COEFFICIENTS[chars.exposure] ?? 1.0;
    product *= addEntry(breakdown, EXPOSURE_LABELS[chars.exposure] ?? chars.exposure, chars.exposure, coeff);
  }

  if (chars.condition !== null) {
    const coeff = CONDITION_COEFFICIENTS[chars.condition] ?? 1.0;
    product *= addEntry(breakdown, CONDITION_LABELS[chars.condition] ?? chars.condition, chars.condition, coeff);
  }

  if (chars.parking !== null) {
    const coeff = PARKING_COEFFICIENTS[chars.parking] ?? 1.0;
    product *= addEntry(breakdown, PARKING_LABELS[chars.parking] ?? chars.parking, chars.parking, coeff);
  }

  if (chars.noise !== null) {
    const coeff = NOISE_COEFFICIENTS[chars.noise] ?? 1.0;
    product *= addEntry(breakdown, NOISE_LABELS[chars.noise] ?? chars.noise, chars.noise, coeff);
  }

  if (chars.pool === true && propertyType === 'Maison') {
    product *= addEntry(breakdown, 'Piscine', 'true', POOL_COEFFICIENT);
  }

  const coefficient = Math.round(Math.max(0.65, Math.min(1.40, product)) * 1000) / 1000;
  return { coefficient, breakdown };
}

const VALID_FLOORS = ['rdc', '1-2', '3-4', '5+', 'last'];
const VALID_OUTDOOR = ['none', 'balcony', 'terrace', 'garden', 'loggia'];
const VALID_VIEW = ['vis-a-vis', 'street', 'clear', 'panoramic'];
const VALID_EXPOSURE = ['north', 'east-west', 'south', 'dual'];
const VALID_CONDITION = ['to-renovate', 'to-refresh', 'good', 'like-new'];
const VALID_PARKING = ['none', 'outdoor', 'garage', 'box'];
const VALID_NOISE = ['noisy', 'normal', 'quiet', 'very-quiet'];

function parseEnum<T extends string>(value: string | null, valid: string[]): T | null {
  if (value && valid.includes(value)) return value as T;
  return null;
}

function parseBool(value: string | null): boolean | null {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

export function parseCharacteristics(params: URLSearchParams): PropertyCharacteristics {
  return {
    floor: parseEnum(params.get('floor'), VALID_FLOORS),
    elevator: parseBool(params.get('elevator')),
    outdoor: parseEnum(params.get('outdoor'), VALID_OUTDOOR),
    view: parseEnum(params.get('view'), VALID_VIEW),
    exposure: parseEnum(params.get('exposure'), VALID_EXPOSURE),
    condition: parseEnum(params.get('condition'), VALID_CONDITION),
    parking: parseEnum(params.get('parking'), VALID_PARKING),
    noise: parseEnum(params.get('noise'), VALID_NOISE),
    pool: parseBool(params.get('pool')),
  };
}
