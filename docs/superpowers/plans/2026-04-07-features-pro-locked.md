# Features Pro Verrouillées — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 blurred "Pro" feature sections with a waitlist modal to the estimate page, validating market demand before integrating Pappers API.

**Architecture:** Generic `LockedFeature` wrapper applies blur + overlay + CTA to any child content. A single shared `WaitlistModal` at page level collects leads via Google Sheets POST. Five mock components display static realistic data behind the blur.

**Tech Stack:** SvelteKit (Svelte 5 runes), Tailwind CSS, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-07-features-pro-locked-design.md`

**Spec deviations:**
- `address` is NOT passed to `LockedFeature` individually. Instead, a single shared `WaitlistModal` at page level receives `data.address` directly, avoiding prop drilling through 5 wrapper components.
- `LockedFeature` uses an `onunlock` callback prop (Svelte 5 idiomatic) instead of the spec's "custom event" mechanism.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/lib/types.ts` | Add Pro types (`ProFeature`, mock data interfaces) |
| Create | `src/lib/data/mock-pro.ts` | Static mock data for all 5 features |
| Create | `src/lib/components/WaitlistModal.svelte` | Lead capture modal with form + Google Sheets POST |
| Create | `src/lib/components/LockedFeature.svelte` | Generic blur wrapper + PRO badge + CTA |
| Create | `src/lib/components/MockPermits.svelte` | Mock building permits table + pressure gauge |
| Create | `src/lib/components/MockCadastre.svelte` | Mock cadastral data display |
| Create | `src/lib/components/MockUrbanisme.svelte` | Mock PLU/urbanisme rules |
| Create | `src/lib/components/MockProprietaires.svelte` | Mock owner info |
| Create | `src/lib/components/MockCopropriete.svelte` | Mock co-ownership info |
| Modify | `src/routes/estimate/+page.svelte` | Add Pro section after Environnement |

---

## Chunk 1: Types + Mock Data

### Task 1: Add TypeScript types for Pro features

**Files:**
- Modify: `src/lib/types.ts:130` (append after `CharacteristicsResult`)

- [ ] **Step 1: Add Pro types to types.ts**

Append at end of `src/lib/types.ts`:

```typescript
// === Pro Features (locked/mock) ===

export type ProFeature = 'permits' | 'cadastre' | 'urbanisme' | 'proprietaires' | 'copropriete';

export interface MockPermit {
  date: string;
  type: 'construction' | 'extension' | 'demolition' | 'amenagement';
  address: string;
  surface_m2: number;
}

export interface MockCadastreData {
  reference: string;
  surface_terrain: number;
  surface_batie: number;
  ratio: number;
}

export interface MockUrbanismeData {
  zone: string;
  zone_label: string;
  cos: number;
  emprise: number;
  hauteur_max: string;
  recul: string;
}

export interface MockProprietaireData {
  type: 'SCI' | 'personne_physique' | 'bailleur_social';
  nom: string;
  date_acquisition: string;
}

export interface MockCoproprieteData {
  lots: number;
  batiments: number;
  syndic: string;
  charges_moy_m2: number;
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd C:/Users/abrah/estimeia-app && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add Pro feature TypeScript types"
```

### Task 2: Create mock data file

**Files:**
- Create: `src/lib/data/mock-pro.ts`

- [ ] **Step 1: Create data directory and mock data file**

Create `src/lib/data/mock-pro.ts`:

```typescript
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
```

- [ ] **Step 2: Verify it compiles**

Run: `cd C:/Users/abrah/estimeia-app && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/mock-pro.ts
git commit -m "feat: add mock data for Pro features"
```

---

## Chunk 2: WaitlistModal + LockedFeature

### Task 3: Create WaitlistModal component

**Files:**
- Create: `src/lib/components/WaitlistModal.svelte`

- [ ] **Step 1: Create WaitlistModal.svelte**

```svelte
<script lang="ts">
  import type { ProFeature } from '$lib/types';

  let {
    feature,
    address,
    open = $bindable(false),
    onclose,
  }: {
    feature: ProFeature;
    address: string;
    open: boolean;
    onclose: () => void;
  } = $props();

  let email = $state('');
  let agency = $state('');
  let status: 'idle' | 'submitting' | 'success' | 'error' = $state('idle');

  let dialogEl: HTMLDialogElement | undefined;

  const featureLabels: Record<ProFeature, string> = {
    permits: 'Permis de construire',
    cadastre: 'Données cadastrales',
    urbanisme: 'Urbanisme & PLU',
    proprietaires: 'Propriétaires',
    copropriete: 'Copropriété',
  };

  $effect(() => {
    if (open && dialogEl && !dialogEl.open) {
      dialogEl.showModal();
      requestAnimationFrame(() => {
        dialogEl?.querySelector<HTMLInputElement>('#waitlist-email')?.focus();
      });
    } else if (!open && dialogEl?.open) {
      dialogEl.close();
    }
  });

  function handleClose() {
    open = false;
    status = 'idle';
    email = '';
    agency = '';
    onclose();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === dialogEl) handleClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') handleClose();
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    status = 'submitting';

    const endpoint = import.meta.env.PUBLIC_WAITLIST_ENDPOINT as string | undefined;
    if (!endpoint) {
      // No endpoint configured — just show success for dev
      await new Promise(r => setTimeout(r, 500));
      status = 'success';
      return;
    }

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          agency: agency || null,
          feature,
          address,
          timestamp: new Date().toISOString(),
        }),
      });
      status = 'success';
    } catch {
      status = 'error';
    }
  }
</script>

{#if open}
  <dialog
    bind:this={dialogEl}
    class="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-navy/10 bg-white p-0 shadow-xl backdrop:bg-navy/30 backdrop:backdrop-blur-sm"
    aria-labelledby="waitlist-title"
    onclick={handleBackdropClick}
    onkeydown={handleKeydown}
  >
    <div class="p-6">
      {#if status === 'success'}
        <div class="text-center py-4">
          <div class="w-12 h-12 mx-auto mb-4 rounded-full bg-sage/10 flex items-center justify-center">
            <svg class="w-6 h-6 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="font-display text-lg font-bold text-navy mb-2">Merci !</h3>
          <p class="text-sm text-navy/50">Nous vous contacterons dès le lancement d'EstimeIA Pro.</p>
          <button
            type="button"
            class="mt-6 text-sm text-navy/40 hover:text-navy/60 transition"
            onclick={handleClose}
          >
            Fermer
          </button>
        </div>
      {:else}
        <div class="flex items-center justify-between mb-6">
          <h3 id="waitlist-title" class="font-display text-lg font-bold text-navy">
            Débloquer les données Pro
          </h3>
          <button
            type="button"
            class="text-navy/30 hover:text-navy/60 transition"
            onclick={handleClose}
            aria-label="Fermer"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <p class="text-sm text-navy/50 mb-1">
          Accédez aux <span class="font-medium text-navy">{featureLabels[feature]}</span> et bien plus avec EstimeIA Pro.
        </p>
        <p class="text-xs text-navy/30 mb-6">Rejoignez la liste d'attente — places limitées.</p>

        <form onsubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="waitlist-email" class="block text-xs font-medium text-navy/60 mb-1">Email professionnel *</label>
            <input
              id="waitlist-email"
              type="email"
              required
              bind:value={email}
              placeholder="vous@agence.fr"
              class="w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy placeholder:text-navy/25 focus:border-sage focus:ring-1 focus:ring-sage outline-none transition"
            />
          </div>
          <div>
            <label for="waitlist-agency" class="block text-xs font-medium text-navy/60 mb-1">Nom de l'agence</label>
            <input
              id="waitlist-agency"
              type="text"
              bind:value={agency}
              placeholder="Mon agence immobilière"
              class="w-full rounded-lg border border-navy/15 px-3 py-2.5 text-sm text-navy placeholder:text-navy/25 focus:border-sage focus:ring-1 focus:ring-sage outline-none transition"
            />
          </div>

          {#if status === 'error'}
            <p class="text-xs text-red-500">Une erreur est survenue, veuillez réessayer.</p>
          {/if}

          <button
            type="submit"
            disabled={status === 'submitting'}
            class="w-full rounded-lg bg-sage py-2.5 text-sm font-medium text-white hover:bg-sage/90 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {#if status === 'submitting'}
              <svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
              </svg>
              Envoi...
            {:else}
              Rejoindre la liste d'attente
            {/if}
          </button>
        </form>
      {/if}
    </div>
  </dialog>
{/if}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd C:/Users/abrah/estimeia-app && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/WaitlistModal.svelte
git commit -m "feat: add WaitlistModal component for Pro lead capture"
```

### Task 4: Create LockedFeature wrapper component

**Files:**
- Create: `src/lib/components/LockedFeature.svelte`

- [ ] **Step 1: Create LockedFeature.svelte**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ProFeature } from '$lib/types';

  let {
    title,
    teaser,
    feature,
    onunlock,
    children,
  }: {
    title: string;
    teaser: string;
    feature: ProFeature;
    onunlock: (feature: ProFeature) => void;
    children: Snippet;
  } = $props();
</script>

<div class="relative rounded-xl border border-navy/10 bg-white overflow-hidden shadow-sm">
  <!-- PRO badge -->
  <div class="absolute top-3 right-3 z-10">
    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
      style="background: linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.65 0.14 65)); color: white;"
    >
      <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
      PRO
    </span>
  </div>

  <!-- Blurred content -->
  <div class="p-5" aria-hidden="true">
    <div class="pointer-events-none select-none" style="filter: blur(6px);">
      {@render children()}
    </div>
  </div>

  <!-- Overlay with CTA -->
  <div class="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px]">
    <div class="text-center px-6">
      <!-- Lock icon -->
      <div class="w-10 h-10 mx-auto mb-3 rounded-full bg-navy/5 flex items-center justify-center">
        <svg class="w-5 h-5 text-navy/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>
      </div>
      <h4 class="font-display text-sm font-bold text-navy mb-1">{title}</h4>
      <p class="text-xs text-navy/40 mb-4 max-w-xs">{teaser}</p>
      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition hover:opacity-90"
        style="background: linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.65 0.14 65));"
        onclick={() => onunlock(feature)}
      >
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Débloquer avec EstimeIA Pro
      </button>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Verify it compiles**

Run: `cd C:/Users/abrah/estimeia-app && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/LockedFeature.svelte
git commit -m "feat: add LockedFeature blur wrapper component"
```

---

## Chunk 3: Five Mock Components

### Task 5: Create MockPermits component

**Files:**
- Create: `src/lib/components/MockPermits.svelte`

- [ ] **Step 1: Create MockPermits.svelte**

```svelte
<script lang="ts">
  import { mockPermits } from '$lib/data/mock-pro';

  const typeLabels: Record<string, string> = {
    construction: 'Construction neuve',
    extension: 'Extension',
    demolition: 'Démolition',
    amenagement: 'Aménagement',
  };

  const typeColors: Record<string, string> = {
    construction: 'oklch(0.58 0.14 155)',
    extension: 'oklch(0.55 0.12 250)',
    demolition: 'oklch(0.65 0.18 30)',
    amenagement: 'oklch(0.75 0.15 75)',
  };
</script>

<div>
  <p class="text-xs font-medium text-navy/50 mb-3">Permis de construire à proximité</p>

  <!-- Pressure indicator -->
  <div class="flex items-center gap-2 mb-4">
    <span class="text-xs text-navy/40">Pression immobilière</span>
    <div class="flex-1 h-2 rounded-full bg-navy/5 overflow-hidden max-w-[120px]">
      <div class="h-full rounded-full" style="width: 65%; background: oklch(0.75 0.15 75);"></div>
    </div>
    <span class="text-xs font-medium" style="color: oklch(0.75 0.15 75);">Moyenne</span>
  </div>

  <!-- Permits table -->
  <div class="space-y-2">
    {#each mockPermits as permit}
      <div class="flex items-center gap-3 text-xs">
        <span class="text-navy/30 w-20 shrink-0">{new Date(permit.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
        <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-white shrink-0" style="background: {typeColors[permit.type]};">{typeLabels[permit.type]}</span>
        <span class="text-navy/50 truncate">{permit.address}</span>
        <span class="text-navy/30 ml-auto shrink-0">{permit.surface_m2} m²</span>
      </div>
    {/each}
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/MockPermits.svelte
git commit -m "feat: add MockPermits component"
```

### Task 6: Create MockCadastre component

**Files:**
- Create: `src/lib/components/MockCadastre.svelte`

- [ ] **Step 1: Create MockCadastre.svelte**

```svelte
<script lang="ts">
  import { mockCadastre } from '$lib/data/mock-pro';
</script>

<div>
  <p class="text-xs font-medium text-navy/50 mb-3">Données cadastrales</p>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <p class="text-xs text-navy/30">Référence parcelle</p>
      <p class="text-sm font-semibold text-navy">{mockCadastre.reference}</p>
    </div>
    <div>
      <p class="text-xs text-navy/30">Ratio terrain/bâti</p>
      <p class="text-sm font-semibold text-navy">{mockCadastre.ratio}x</p>
    </div>
    <div>
      <p class="text-xs text-navy/30">Surface terrain</p>
      <p class="text-sm font-semibold text-navy">{mockCadastre.surface_terrain} m²</p>
    </div>
    <div>
      <p class="text-xs text-navy/30">Surface bâtie</p>
      <p class="text-sm font-semibold text-navy">{mockCadastre.surface_batie} m²</p>
    </div>
  </div>

  <!-- Mini parcel sketch -->
  <div class="mt-4 flex items-center gap-3">
    <div class="w-16 h-12 rounded border-2 border-dashed border-sage/30 bg-sage/5 flex items-center justify-center">
      <div class="w-6 h-5 rounded-sm bg-sage/20 border border-sage/30"></div>
    </div>
    <p class="text-[10px] text-navy/25">Schéma indicatif de la parcelle</p>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/MockCadastre.svelte
git commit -m "feat: add MockCadastre component"
```

### Task 7: Create MockUrbanisme component

**Files:**
- Create: `src/lib/components/MockUrbanisme.svelte`

- [ ] **Step 1: Create MockUrbanisme.svelte**

```svelte
<script lang="ts">
  import { mockUrbanisme } from '$lib/data/mock-pro';
</script>

<div>
  <p class="text-xs font-medium text-navy/50 mb-3">Urbanisme & PLU</p>

  <div class="flex items-center gap-2 mb-4">
    <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-white" style="background: oklch(0.55 0.12 250);">
      {mockUrbanisme.zone}
    </span>
    <span class="text-sm text-navy/60">{mockUrbanisme.zone_label}</span>
  </div>

  <div class="grid grid-cols-2 gap-3">
    <div class="bg-navy/[0.02] rounded-lg p-2.5">
      <p class="text-[10px] text-navy/30">COS</p>
      <p class="text-sm font-semibold text-navy">{mockUrbanisme.cos}</p>
    </div>
    <div class="bg-navy/[0.02] rounded-lg p-2.5">
      <p class="text-[10px] text-navy/30">Emprise au sol</p>
      <p class="text-sm font-semibold text-navy">{mockUrbanisme.emprise}%</p>
    </div>
    <div class="bg-navy/[0.02] rounded-lg p-2.5">
      <p class="text-[10px] text-navy/30">Hauteur max</p>
      <p class="text-sm font-semibold text-navy">{mockUrbanisme.hauteur_max}</p>
    </div>
    <div class="bg-navy/[0.02] rounded-lg p-2.5">
      <p class="text-[10px] text-navy/30">Recul</p>
      <p class="text-sm font-semibold text-navy">{mockUrbanisme.recul}</p>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/MockUrbanisme.svelte
git commit -m "feat: add MockUrbanisme component"
```

### Task 8: Create MockProprietaires component

**Files:**
- Create: `src/lib/components/MockProprietaires.svelte`

- [ ] **Step 1: Create MockProprietaires.svelte**

```svelte
<script lang="ts">
  import { mockProprietaire } from '$lib/data/mock-pro';

  const typeLabels: Record<string, string> = {
    SCI: 'Société Civile Immobilière',
    personne_physique: 'Personne physique',
    bailleur_social: 'Bailleur social',
  };
</script>

<div>
  <p class="text-xs font-medium text-navy/50 mb-3">Propriétaire du bien</p>

  <div class="flex items-start gap-4">
    <div class="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center shrink-0">
      <svg class="w-5 h-5 text-navy/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div>
      <p class="text-xs text-navy/30">{typeLabels[mockProprietaire.type]}</p>
      <p class="text-sm font-semibold text-navy">{mockProprietaire.nom}</p>
      <p class="text-xs text-navy/30 mt-1">Acquisition : {mockProprietaire.date_acquisition}</p>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/MockProprietaires.svelte
git commit -m "feat: add MockProprietaires component"
```

### Task 9: Create MockCopropriete component

**Files:**
- Create: `src/lib/components/MockCopropriete.svelte`

- [ ] **Step 1: Create MockCopropriete.svelte**

```svelte
<script lang="ts">
  import { mockCopropriete } from '$lib/data/mock-pro';
</script>

<div>
  <p class="text-xs font-medium text-navy/50 mb-3">Copropriété</p>

  <div class="grid grid-cols-2 gap-4">
    <div>
      <p class="text-xs text-navy/30">Nombre de lots</p>
      <p class="text-sm font-semibold text-navy">{mockCopropriete.lots} lots</p>
    </div>
    <div>
      <p class="text-xs text-navy/30">Bâtiments</p>
      <p class="text-sm font-semibold text-navy">{mockCopropriete.batiments}</p>
    </div>
    <div>
      <p class="text-xs text-navy/30">Syndic</p>
      <p class="text-sm font-semibold text-navy">{mockCopropriete.syndic}</p>
    </div>
    <div>
      <p class="text-xs text-navy/30">Charges moy.</p>
      <p class="text-sm font-semibold text-navy">{mockCopropriete.charges_moy_m2} €/m²/an</p>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/MockCopropriete.svelte
git commit -m "feat: add MockCopropriete component"
```

---

## Chunk 4: Page Integration

### Task 10: Add Pro section to estimate page

**Files:**
- Modify: `src/routes/estimate/+page.svelte`

- [ ] **Step 1: Add imports**

At the top of the `<script>` block in `+page.svelte`, add after the line `import type { Comparable } from '$lib/types';`:

```typescript
  import LockedFeature from '$lib/components/LockedFeature.svelte';
  import WaitlistModal from '$lib/components/WaitlistModal.svelte';
  import MockPermits from '$lib/components/MockPermits.svelte';
  import MockCadastre from '$lib/components/MockCadastre.svelte';
  import MockUrbanisme from '$lib/components/MockUrbanisme.svelte';
  import MockProprietaires from '$lib/components/MockProprietaires.svelte';
  import MockCopropriete from '$lib/components/MockCopropriete.svelte';
  import type { ProFeature } from '$lib/types';
```

- [ ] **Step 2: Add waitlist state**

After the line `let excludeCovid = $state(false);`, add:

```typescript
  let showWaitlist = $state(false);
  let waitlistFeature: ProFeature = $state('permits');

  function openWaitlist(feature: ProFeature) {
    waitlistFeature = feature;
    showWaitlist = true;
  }
```

- [ ] **Step 3: Add Pro section to template**

Insert **after** the `</section>` closing tag that follows the `CommuneContext` component, and **before** the `<!-- Print footer -->` comment:

```svelte
    <!-- ===== SECTION: Données Pro ===== -->
    <section class="mb-12 print:hidden">
      <div class="flex items-center gap-2 mb-6">
        <div class="w-1.5 h-6 rounded-full" style="background: linear-gradient(180deg, oklch(0.75 0.12 85), oklch(0.65 0.14 65));"></div>
        <h2 class="font-display text-lg font-bold text-navy">Données Pro</h2>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-white"
          style="background: linear-gradient(135deg, oklch(0.75 0.12 85), oklch(0.65 0.14 65));"
        >PRO</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LockedFeature title="Permis de construire" teaser="4 permis délivrés dans un rayon de 500m ces 2 dernières années" feature="permits" onunlock={openWaitlist}>
          <MockPermits />
        </LockedFeature>

        <LockedFeature title="Données cadastrales" teaser="Surface terrain : 485 m² — Ratio terrain/bâti : 3.4" feature="cadastre" onunlock={openWaitlist}>
          <MockCadastre />
        </LockedFeature>

        <LockedFeature title="Urbanisme & PLU" teaser="Zone UA — Constructibilité et règles d'urbanisme" feature="urbanisme" onunlock={openWaitlist}>
          <MockUrbanisme />
        </LockedFeature>

        <LockedFeature title="Propriétaire" teaser="Propriétaire identifié — SCI ••••••" feature="proprietaires" onunlock={openWaitlist}>
          <MockProprietaires />
        </LockedFeature>

        <LockedFeature title="Copropriété" teaser="Copropriété de 24 lots — Charges moyennes : 32€/m²/an" feature="copropriete" onunlock={openWaitlist}>
          <MockCopropriete />
        </LockedFeature>
      </div>
    </section>

    <!-- Waitlist modal (shared) -->
    <WaitlistModal
      feature={waitlistFeature}
      address={data.address}
      bind:open={showWaitlist}
      onclose={() => showWaitlist = false}
    />
```

- [ ] **Step 4: Verify build**

Run: `cd C:/Users/abrah/estimeia-app && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Visual verification**

Run: `cd C:/Users/abrah/estimeia-app && npm run dev`
Navigate to an estimate page and verify:
- 5 Pro blocks appear after the Environnement section
- Content is blurred with lock overlay
- PRO badge visible on each card
- Click "Débloquer" opens the waitlist modal
- Modal form works (email validation, submit, success state)
- Sections hidden in print view
- Responsive: single column on mobile, 2 cols on desktop

- [ ] **Step 6: Commit**

```bash
git add src/routes/estimate/+page.svelte
git commit -m "feat: integrate Pro locked features section in estimate page"
```
