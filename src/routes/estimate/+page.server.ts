import { error } from '@sveltejs/kit';
import { fetchDvfComparables } from '$lib/api/dvf';
import { computePriceRange } from '$lib/utils/estimation';
import { lookupProximity } from '$lib/api/proximity';
import { fetchDpeNearby } from '$lib/api/dpe';
import { fetchRisks } from '$lib/api/georisques';
import { fetchCommuneContext } from '$lib/api/commune';
import { fetchRentEstimate } from '$lib/api/loyers';
import { fetchPermits } from '$lib/api/permits';
import { fetchCadastre } from '$lib/api/cadastre';
import { fetchUrbanisme } from '$lib/api/urbanisme';
import { fetchCopropriete } from '$lib/api/copropriete';
import { postcodeToArrondissement, postcodeToMainCommune, postcodeToInsee } from '$lib/api/insee';
import { config } from '$lib/config';
import { parseCharacteristics, computeCharacteristicsCoefficient } from '$lib/config/coefficients';
import { applyCoefficient } from '$lib/utils/estimation';
import { isPappersConfigured, fetchProprietaire } from '$lib/api/pappers';
import type { ProprietaireResult } from '$lib/api/pappers';
import type { Comparable, YearlyTrend, DpeClass } from '$lib/types';
import type { PageServerLoad } from './$types';

function computeTrend(comparables: Comparable[]): YearlyTrend[] {
  const byYear = new Map<number, number[]>();
  for (const c of comparables) {
    const year = new Date(c.date_mutation).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(c.prix_m2);
  }

  return [...byYear.entries()]
    .map(([year, prices]) => {
      prices.sort((a, b) => a - b);
      const mid = Math.floor(prices.length / 2);
      const median = prices.length % 2 === 0
        ? (prices[mid - 1] + prices[mid]) / 2
        : prices[mid];
      return { year, median_prix_m2: Math.round(median), count: prices.length };
    })
    .sort((a, b) => a.year - b.year);
}

export const load: PageServerLoad = async ({ url }) => {
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lon = parseFloat(url.searchParams.get('lon') ?? '');
  const postcode = url.searchParams.get('postcode') ?? '';
  const address = url.searchParams.get('address') ?? '';
  const propertyType = (url.searchParams.get('type') ?? 'Appartement') as 'Appartement' | 'Maison';
  const surfaceParam = url.searchParams.get('surface');
  const surfaceM2 = surfaceParam ? parseFloat(surfaceParam) : null;
  const radiusParam = url.searchParams.get('radius');
  const radiusM = radiusParam ? parseInt(radiusParam) : config.DEFAULT_RADIUS_M;
  const roomsParam = url.searchParams.get('rooms');
  const rooms = roomsParam ? parseInt(roomsParam) : null;

  const characteristics = parseCharacteristics(url.searchParams);
  const hasCharacteristics = Object.values(characteristics).some(v => v !== null);
  const characteristicsResult = hasCharacteristics
    ? computeCharacteristicsCoefficient(characteristics, propertyType)
    : null;

  if (isNaN(lat) || isNaN(lon) || !postcode) {
    error(400, 'Parametres manquants: lat, lon, postcode');
  }

  const dept = postcode.substring(0, 2);
  const isAlsaceMoselle = (config.ALSACE_MOSELLE_DEPTS as readonly string[]).includes(dept);

  let comparables: Comparable[] = [];
  let dvfError = false;

  try {
    comparables = await fetchDvfComparables({
      postcode,
      propertyType,
      lat,
      lon,
      radiusM,
      surfaceM2,
      rooms,
    });
  } catch {
    dvfError = true;
  }

  // Resolve INSEE codes for loyers (arrondissement) and permits (main commune)
  const inseeArrondissement = postcodeToArrondissement(postcode);
  const inseeMainCommune = postcodeToMainCommune(postcode);

  // Fetch all external data in parallel (cadastre + urbanisme are independent)
  const [proximity, dpe, risks, communeCtx, rentData, permits, cadastre, urbanisme] = await Promise.all([
    Promise.resolve(lookupProximity(dept, lat, lon, 1000)),
    fetchDpeNearby(address, postcode),
    fetchRisks(postcode),
    fetchCommuneContext(postcode),
    fetchRentEstimate(inseeArrondissement, propertyType, surfaceM2, null), // compute yield after estimation
    fetchPermits(inseeMainCommune),
    fetchCadastre(lat, lon),
    fetchUrbanisme(lat, lon),
  ]);

  // Extract dominant DPE class for price adjustment
  // Only use DPE for price correction if data is reliable (3+ diagnostics)
  const dpeClass: DpeClass | null =
    dpe && dpe.fiabilite !== 'indicatif' ? dpe.dominant_dpe : null;

  // Compute estimation WITH temporal correction, surface elasticity, and DPE adjustment
  const baseEstimation = comparables.length > 0
    ? computePriceRange(
        comparables.map((c) => ({
          prix_m2: c.prix_m2,
          date_mutation: c.date_mutation,
          distance: c.distance,
          surface: c.surface,
        })),
        surfaceM2,
        {
          dpeClass,
          applyTemporal: true,
          applySurfaceElasticity: true,
        }
      )
    : null;

  // Apply characteristics coefficient on top
  const estimation = baseEstimation && characteristicsResult
    ? applyCoefficient(baseEstimation, characteristicsResult.coefficient)
    : baseEstimation;

  // Recompute rent yield with actual estimation price
  let rentEstimate = rentData;
  if (rentData && estimation) {
    // Update rendement_brut with actual estimated price
    if (rentData.loyer_mensuel && estimation.median_total) {
      rentEstimate = {
        ...rentData,
        rendement_brut: Math.round(((rentData.loyer_mensuel * 12) / estimation.median_total) * 10000) / 100,
      };
    }
  }

  const trend = computeTrend(comparables);

  // Copropriete depends on cadastre result (needs reference_cadastrale for RNIC lookup)
  const copropriete = cadastre?.reference_cadastrale
    ? await fetchCopropriete(cadastre.reference_cadastrale)
    : null;

  // Pappers: fetch proprietaire data if API is configured (Pro feature)
  let proprietaire: ProprietaireResult | null = null;
  const hasPappers = isPappersConfigured();
  if (hasPappers && copropriete?.nom) {
    // Try searching by copropriete name (often matches SCI names)
    proprietaire = await fetchProprietaire(copropriete.nom, postcode);
  }

  return {
    address,
    postcode,
    propertyType,
    surfaceM2,
    lat,
    lon,
    comparables,
    estimation,
    characteristics: hasCharacteristics ? characteristics : null,
    characteristicsResult,
    baseEstimation,
    trend,
    isAlsaceMoselle,
    radiusM,
    dvfError,
    proximity,
    dpe,
    risks,
    communeCtx,
    rentEstimate,
    permits,
    cadastre,
    urbanisme,
    copropriete,
    proprietaire,
    hasPappers,
  };
};
