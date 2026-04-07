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

  let dialogEl: HTMLDialogElement | undefined = $state();

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
