<script lang="ts">
  let {
    open = $bindable(false),
    onComplete,
  }: {
    open: boolean;
    onComplete: () => void;
  } = $props();

  interface AnalysisStep {
    title: string;
    subtitle: string;
    icon: string;
    delayMs: number;
  }

  const steps: AnalysisStep[] = [
    {
      title: 'Geocodage de l\'adresse',
      subtitle: 'API BAN — Base Adresse Nationale',
      icon: 'pin',
      delayMs: 300,
    },
    {
      title: 'Recherche des ventes DVF',
      subtitle: 'Demandes de Valeur Fonciere (DGFiP) — 5 dernieres annees',
      icon: 'database',
      delayMs: 600,
    },
    {
      title: 'Filtrage des comparables',
      subtitle: 'Exclusion des mutations atypiques (IQR), ventes Covid ponderees x0.5',
      icon: 'filter',
      delayMs: 900,
    },
    {
      title: 'Correction temporelle des prix',
      subtitle: 'Indexation INSEE-Notaires — base 2025, couverture 2014-2026',
      icon: 'clock',
      delayMs: 1200,
    },
    {
      title: 'Ajustement elasticite surface',
      subtitle: 'Modele log-lineaire prix/m\u00b2 vs surface reelle Carrez',
      icon: 'ruler',
      delayMs: 1500,
    },
    {
      title: 'Diagnostic de Performance Energetique',
      subtitle: 'ADEME — etiquette DPE dominante du quartier',
      icon: 'energy',
      delayMs: 1800,
    },
    {
      title: 'Correction DPE sur le prix',
      subtitle: 'Impact valorisation A (+6%) a decote G (-20%) — ref. Notaires de France',
      icon: 'adjust',
      delayMs: 2100,
    },
    {
      title: 'Calcul de la marge d\'erreur',
      subtitle: 'Validation croisee leave-one-out (MAPE) sur les comparables',
      icon: 'target',
      delayMs: 2400,
    },
    {
      title: 'Analyse des risques naturels',
      subtitle: 'Georisques — CatNat, inondations, seismes, mouvements de terrain',
      icon: 'shield',
      delayMs: 2700,
    },
    {
      title: 'Estimation du rendement locatif',
      subtitle: 'Carte des Loyers 2025 — rendement brut annuel, indice de fiabilite',
      icon: 'chart',
      delayMs: 3000,
    },
    {
      title: 'Permis de construire recents',
      subtitle: 'SITADEL — pression immobiliere communale, logements autorises',
      icon: 'building',
      delayMs: 3300,
    },
    {
      title: 'Donnees cadastrales',
      subtitle: 'IGN API Carto — reference parcellaire, surface terrain',
      icon: 'map',
      delayMs: 3500,
    },
    {
      title: 'Zonage PLU',
      subtitle: 'GPU — zone urbaine, constructibilite, document d\'urbanisme',
      icon: 'zone',
      delayMs: 3700,
    },
    {
      title: 'Verification copropriete',
      subtitle: 'RNIC — lots, syndic, periode de construction',
      icon: 'people',
      delayMs: 3900,
    },
    {
      title: 'Scoring de confiance',
      subtitle: '5 facteurs : volume, coherence, recence, proximite, DPE',
      icon: 'score',
      delayMs: 4100,
    },
  ];

  let currentStep = $state(-1);
  let navigationDone = $state(false);
  let finishing = $state(false);
  let completeCalled = false;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let startTime = 0;

  export function markNavigationDone() {
    navigationDone = true;
  }

  function completeOnce() {
    if (completeCalled) return;
    completeCalled = true;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    onComplete();
  }

  $effect(() => {
    if (!open) {
      // Reset state when overlay closes
      currentStep = -1;
      navigationDone = false;
      finishing = false;
      completeCalled = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      return;
    }

    // Overlay just opened — start the animation
    startTime = Date.now();

    intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Find which step should be active based on elapsed time
      let targetStep = -1;
      for (let i = 0; i < steps.length; i++) {
        if (elapsed >= steps[i].delayMs) {
          targetStep = i;
        }
      }

      if (targetStep > currentStep) {
        currentStep = targetStep;
      }

      // If navigation is done and we're near the end, fast-forward
      if (navigationDone && currentStep >= steps.length - 3) {
        finishing = true;
        currentStep = steps.length - 1;
        setTimeout(completeOnce, 600);
        return;
      }

      // If we've shown all steps and navigation is done, complete
      if (currentStep >= steps.length - 1 && navigationDone) {
        finishing = true;
        setTimeout(completeOnce, 400);
        return;
      }

      // Safety: if it's been >8s, force-complete
      if (elapsed > 8000) {
        finishing = true;
        setTimeout(completeOnce, 200);
        return;
      }
    }, 150);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };
  });

  const progressPct = $derived(
    steps.length > 0
      ? Math.min(((currentStep + 1) / steps.length) * 100, 100)
      : 0
  );
</script>

{#if open}
  <div
    class="fixed inset-0 z-[100] flex items-center justify-center"
    style="animation: fadeIn 0.3s ease-out;"
  >
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-navy/60 backdrop-blur-sm"></div>

    <!-- Content -->
    <div class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden" style="animation: scaleIn 0.4s ease-out;">
      <!-- Header -->
      <div class="px-6 pt-6 pb-4 border-b border-navy/5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-sage to-sage/70 flex items-center justify-center">
            <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 3V21H21" stroke-linecap="round"/>
              <path d="M7 14L11 10L15 13L21 7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 class="font-display text-base font-bold text-navy">Analyse en cours</h2>
            <p class="text-xs text-navy/40">Croisement de 12 bases de donnees officielles</p>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="mt-4 h-1.5 rounded-full bg-navy/5 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-sage to-sage/80 transition-all duration-500 ease-out"
            style="width: {progressPct}%;"
          ></div>
        </div>
        <p class="text-[10px] text-navy/30 mt-1.5 text-right font-mono">{Math.round(progressPct)}%</p>
      </div>

      <!-- Steps timeline -->
      <div class="px-6 py-4 max-h-[50vh] overflow-y-auto" id="analysis-steps">
        <div class="space-y-0">
          {#each steps as step, i}
            {@const status = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'}
            <div
              class="flex items-start gap-3 py-2 transition-all duration-300
                {status === 'pending' ? 'opacity-20' : status === 'active' ? 'opacity-100' : 'opacity-70'}"
              style={status !== 'pending' ? `animation: fadeInLeft 0.3s ease-out ${Math.max(0, (i - currentStep + 1)) * 0.05}s both;` : ''}
            >
              <!-- Icon column -->
              <div class="shrink-0 mt-0.5">
                {#if status === 'done'}
                  <div class="w-5 h-5 rounded-full bg-sage/15 flex items-center justify-center">
                    <svg class="w-3 h-3 text-sage" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                {:else if status === 'active'}
                  <div class="w-5 h-5 rounded-full bg-navy/10 flex items-center justify-center">
                    <div class="w-2.5 h-2.5 rounded-full border-2 border-navy/40 border-t-transparent" style="animation: spin 0.8s linear infinite;"></div>
                  </div>
                {:else}
                  <div class="w-5 h-5 rounded-full bg-navy/5 flex items-center justify-center">
                    <div class="w-1.5 h-1.5 rounded-full bg-navy/15"></div>
                  </div>
                {/if}
              </div>

              <!-- Text column -->
              <div class="min-w-0 flex-1">
                <p class="text-xs font-medium leading-tight {status === 'active' ? 'text-navy' : status === 'done' ? 'text-navy/60' : 'text-navy/30'}">
                  {step.title}
                </p>
                {#if status === 'active' || status === 'done'}
                  <p class="text-[10px] leading-tight mt-0.5 {status === 'active' ? 'text-navy/40' : 'text-navy/25'}">
                    {step.subtitle}
                  </p>
                {/if}
              </div>

              <!-- Status indicator -->
              {#if status === 'done'}
                <span class="shrink-0 text-[9px] font-mono text-sage/60 mt-0.5">OK</span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3 border-t border-navy/5 bg-navy/[0.02]">
        <div class="flex items-center justify-between">
          <p class="text-[10px] text-navy/25">
            {#if finishing}
              Finalisation du rapport...
            {:else}
              Sources : DVF, ADEME, Georisques, INSEE, IGN, SITADEL, RNIC
            {/if}
          </p>
          {#if finishing}
            <div class="flex items-center gap-1.5">
              <div class="w-1.5 h-1.5 rounded-full bg-sage" style="animation: pulse-dot 1s ease-in-out infinite;"></div>
              <span class="text-[10px] text-sage font-medium">Pret</span>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.3); }
  }
</style>
