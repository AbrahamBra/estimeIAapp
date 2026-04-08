/**
 * Pappers API integration for property owner (propriétaire) lookup.
 *
 * Pappers provides French company data (SCI, SARL, etc.) from BODACC, INSEE, INPI.
 * API docs: https://www.pappers.fr/api/documentation
 *
 * Requires: PAPPERS_API_TOKEN environment variable (server-side only)
 * Free tier: 100 credits on signup with pro email
 * Pricing: ~0.01-0.05€ per request depending on plan
 */

import { env } from '$env/dynamic/private';

const PAPPERS_API_BASE = 'https://api.pappers.fr/v2';

export interface PappersEntreprise {
  siren: string;
  nom_entreprise: string;
  forme_juridique: string;
  date_creation: string;
  siege: {
    adresse_ligne_1: string;
    code_postal: string;
    ville: string;
  };
  dirigeants: PappersDirigeant[];
  beneficiaires_effectifs: PappersBeneficiaire[];
}

export interface PappersDirigeant {
  nom: string;
  prenom: string;
  qualite: string; // "Gérant", "Président", etc.
  date_de_naissance_formatee: string | null;
}

export interface PappersBeneficiaire {
  nom: string;
  prenom: string;
  nationalite: string;
  pourcentage_parts: number | null;
}

export interface ProprietaireResult {
  type: 'SCI' | 'personne_morale' | 'personne_physique' | 'bailleur_social' | 'inconnu';
  nom: string;
  forme_juridique: string | null;
  siren: string | null;
  date_creation: string | null;
  dirigeants: { nom: string; qualite: string }[];
  beneficiaires: { nom: string; parts_pct: number | null }[];
  siege_adresse: string | null;
}

function getApiToken(): string | null {
  return env.PAPPERS_API_TOKEN ?? null;
}

/**
 * Search Pappers for a company (SCI, etc.) by name and optional postal code.
 * Useful when we know the owner name from cadastral data.
 */
export async function searchEntreprise(
  query: string,
  codePostal?: string
): Promise<PappersEntreprise | null> {
  const token = getApiToken();
  if (!token) return null;

  try {
    const url = new URL(`${PAPPERS_API_BASE}/recherche`);
    url.searchParams.set('api_token', token);
    url.searchParams.set('q', query);
    url.searchParams.set('page', '1');
    url.searchParams.set('par_page', '1');
    if (codePostal) {
      url.searchParams.set('code_postal', codePostal);
    }

    const resp = await fetch(url.toString());
    if (!resp.ok) return null;

    const data = await resp.json();
    const results = data.resultats ?? [];
    if (results.length === 0) return null;

    const r = results[0];
    return {
      siren: r.siren ?? '',
      nom_entreprise: r.nom_entreprise ?? r.denomination ?? '',
      forme_juridique: r.forme_juridique ?? '',
      date_creation: r.date_creation ?? '',
      siege: {
        adresse_ligne_1: r.siege?.adresse_ligne_1 ?? '',
        code_postal: r.siege?.code_postal ?? '',
        ville: r.siege?.ville ?? '',
      },
      dirigeants: (r.representants ?? []).map((d: any) => ({
        nom: d.nom ?? '',
        prenom: d.prenom ?? '',
        qualite: d.qualite ?? '',
        date_de_naissance_formatee: d.date_de_naissance_formatee ?? null,
      })),
      beneficiaires_effectifs: (r.beneficiaires_effectifs ?? []).map((b: any) => ({
        nom: b.nom ?? '',
        prenom: b.prenom ?? '',
        nationalite: b.nationalite ?? '',
        pourcentage_parts: b.pourcentage_parts ?? null,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Get detailed company info by SIREN number.
 */
export async function getEntrepriseBySiren(
  siren: string
): Promise<PappersEntreprise | null> {
  const token = getApiToken();
  if (!token) return null;

  try {
    const url = new URL(`${PAPPERS_API_BASE}/entreprise`);
    url.searchParams.set('api_token', token);
    url.searchParams.set('siren', siren);

    const resp = await fetch(url.toString());
    if (!resp.ok) return null;

    const r = await resp.json();
    return {
      siren: r.siren ?? '',
      nom_entreprise: r.nom_entreprise ?? r.denomination ?? '',
      forme_juridique: r.forme_juridique ?? '',
      date_creation: r.date_creation ?? '',
      siege: {
        adresse_ligne_1: r.siege?.adresse_ligne_1 ?? '',
        code_postal: r.siege?.code_postal ?? '',
        ville: r.siege?.ville ?? '',
      },
      dirigeants: (r.representants ?? []).map((d: any) => ({
        nom: d.nom ?? '',
        prenom: d.prenom ?? '',
        qualite: d.qualite ?? '',
        date_de_naissance_formatee: d.date_de_naissance_formatee ?? null,
      })),
      beneficiaires_effectifs: (r.beneficiaires_effectifs ?? []).map((b: any) => ({
        nom: b.nom ?? '',
        prenom: b.prenom ?? '',
        nationalite: b.nationalite ?? '',
        pourcentage_parts: b.pourcentage_parts ?? null,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Detect owner type from forme_juridique string.
 */
function detectOwnerType(formeJuridique: string): ProprietaireResult['type'] {
  const fj = formeJuridique.toLowerCase();
  if (fj.includes('sci') || fj.includes('société civile immobilière')) return 'SCI';
  if (fj.includes('hlm') || fj.includes('office public') || fj.includes('opac') || fj.includes('habitat')) return 'bailleur_social';
  if (fj.includes('sa') || fj.includes('sas') || fj.includes('sarl') || fj.includes('eurl') || fj.includes('sci')) return 'personne_morale';
  return 'personne_morale';
}

/**
 * High-level: search for property owner and return structured result.
 * Called from +page.server.ts when PAPPERS_API_TOKEN is configured.
 */
export async function fetchProprietaire(
  ownerQuery: string,
  codePostal?: string
): Promise<ProprietaireResult | null> {
  const entreprise = await searchEntreprise(ownerQuery, codePostal);
  if (!entreprise) return null;

  return {
    type: detectOwnerType(entreprise.forme_juridique),
    nom: entreprise.nom_entreprise,
    forme_juridique: entreprise.forme_juridique,
    siren: entreprise.siren,
    date_creation: entreprise.date_creation,
    dirigeants: entreprise.dirigeants.map(d => ({
      nom: `${d.prenom} ${d.nom}`.trim(),
      qualite: d.qualite,
    })),
    beneficiaires: entreprise.beneficiaires_effectifs.map(b => ({
      nom: `${b.prenom} ${b.nom}`.trim(),
      parts_pct: b.pourcentage_parts,
    })),
    siege_adresse: [
      entreprise.siege.adresse_ligne_1,
      entreprise.siege.code_postal,
      entreprise.siege.ville,
    ].filter(Boolean).join(', '),
  };
}

/**
 * Check if Pappers API is configured (token available).
 */
export function isPappersConfigured(): boolean {
  return !!getApiToken();
}
