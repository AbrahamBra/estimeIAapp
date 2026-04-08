export const config = {
  DVF_RESOURCE_ID: 'd7933994-2c66-4131-a4da-cf7cd18040a4',
  DVF_API_BASE: 'https://tabular-api.data.gouv.fr/api/resources',
  BAN_API_BASE: 'https://api-adresse.data.gouv.fr',
  DEFAULT_RADIUS_M: 1000,
  MAX_DVF_PAGES: 5,
  MIN_COMPARABLES: 5,
  TARGET_COMPARABLES: 15,
  IQR_MULTIPLIER: 1.5,
  MIN_PRICE: 10_000,
  MIN_PRICE_M2: 500,
  MAX_PRICE_M2: 100_000,
  SURFACE_TOLERANCE: 0.3,
  ALSACE_MOSELLE_DEPTS: ['57', '67', '68'],
  COVID_START: '2020-03-01',
  COVID_END: '2021-06-30',
  LOYERS_APPART_RESOURCE_ID: '55b34088-0964-415f-9df7-d87dd98a09be',
  LOYERS_MAISON_RESOURCE_ID: '129f764d-b613-44e4-952c-5ff50a8c9b73',
  SITADEL_RESOURCE_ID: '65a9e264-7a20-46a9-9d98-66becb817bc3',
  RNIC_RESOURCE_ID: '3ea8e2c3-0038-464a-b17e-cd5c91f65ce2',

  // DPE price impact coefficients (source: Notaires de France 2024-2025)
  DPE_COEFFICIENTS: {
    'A': 1.06,
    'B': 1.03,
    'C': 1.00, // reference
    'D': 0.97,
    'E': 0.93,
    'F': 0.86,
    'G': 0.80,
  } as Record<string, number>,

  DPE_LABELS: {
    'A': 'DPE A : très performant (+6%)',
    'B': 'DPE B : performant (+3%)',
    'C': 'DPE C : référence',
    'D': 'DPE D : assez bon (-3%)',
    'E': 'DPE E : passoire partielle (-7%)',
    'F': 'DPE F : passoire thermique (-14%)',
    'G': 'DPE G : passoire thermique (-20%)',
  } as Record<string, string>,

  // Temporal price index (base 100 = 2025, approximation INSEE-Notaires France métropolitaine)
  TEMPORAL_INDEX: {
    2019: 0.88,
    2020: 0.91,
    2021: 0.97,
    2022: 1.02,
    2023: 0.99,
    2024: 0.97,
    2025: 1.00,
    2026: 1.01,
  } as Record<number, number>,

  // Surface elasticity: price/m² decreases for larger surfaces (log-linear)
  SURFACE_ELASTICITY_REF: 60, // reference surface in m²
  SURFACE_ELASTICITY_COEFF: -0.15, // elasticity coefficient (negative = larger = cheaper/m²)
} as const;
