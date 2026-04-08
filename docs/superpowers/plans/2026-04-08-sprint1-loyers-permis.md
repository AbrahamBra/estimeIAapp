# Sprint 1 — Loyers + Permis Réels — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Integrate Carte des Loyers 2025 (rent yield) and SITADEL (real building permits) into the estimate page as free features.

**Architecture:** Two new API modules fetch data via Tabular API data.gouv.fr. A shared INSEE utility resolves postcodes to commune codes. Two new components display rent yield and real permits in the Environnement section. MockPermits is removed from the Pro section.

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind CSS, TypeScript, Tabular API data.gouv.fr

**Spec:** `docs/superpowers/specs/2026-04-08-sprint1-loyers-permis-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/lib/config.ts` | Add resource IDs for loyers + SITADEL |
| Modify | `src/lib/types.ts` | Add RentEstimate, PermitRecord, PermitsResult; remove MockPermit; update ProFeature |
| Create | `src/lib/api/insee.ts` | Postcode → INSEE code resolution (arrondissement + main commune) |
| Modify | `src/lib/api/commune.ts` | Reuse functions from insee.ts |
| Create | `src/lib/api/loyers.ts` | Fetch rent estimate from Carte des Loyers |
| Create | `src/lib/api/permits.ts` | Fetch real permits from SITADEL |
| Create | `src/lib/components/RentEstimate.svelte` | Rent yield display |
| Create | `src/lib/components/PermitsBadge.svelte` | Real permits display |
| Modify | `src/routes/estimate/+page.server.ts` | Add loyers + permits fetch + yield calculation |
| Modify | `src/routes/estimate/+page.svelte` | Add new components, remove MockPermits from Pro |
| Delete | `src/lib/components/MockPermits.svelte` | Replaced by PermitsBadge |
| Modify | `src/lib/data/mock-pro.ts` | Remove mockPermits export |
