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
