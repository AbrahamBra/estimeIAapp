<script lang="ts">
  let {
    open = $bindable(false),
    address,
    onexport,
  }: {
    open: boolean;
    address: string;
    onexport: (branding: { agentName: string; agencyName: string; phone: string; email: string; logoUrl: string }) => void;
  } = $props();

  let agentName = $state('');
  let agencyName = $state('');
  let phone = $state('');
  let email = $state('');
  let logoUrl = $state('');
  let dialogEl: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (open && dialogEl && !dialogEl.open) {
      dialogEl.showModal();
    } else if (!open && dialogEl?.open) {
      dialogEl.close();
    }
  });

  function handleExport() {
    onexport({ agentName, agencyName, phone, email, logoUrl });
    open = false;
  }

  function handleQuickExport() {
    onexport({ agentName: '', agencyName: '', phone: '', email: '', logoUrl: '' });
    open = false;
  }
</script>

<dialog
  bind:this={dialogEl}
  class="bg-transparent p-0 max-w-lg w-full backdrop:bg-navy/30 backdrop:backdrop-blur-sm"
  onclose={() => open = false}
>
  <div class="bg-white rounded-2xl shadow-lg p-6 md:p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h3 class="font-display text-lg font-bold text-navy">Export rapport PDF</h3>
        <p class="text-xs text-navy/40 mt-0.5">Personnalisez votre rapport d'estimation</p>
      </div>
      <button
        type="button"
        class="text-navy/30 hover:text-navy/60 transition-colors"
        onclick={() => open = false}
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Quick export (no branding) -->
    <button
      type="button"
      class="w-full mb-6 flex items-center gap-3 p-4 rounded-xl border border-navy/10 hover:border-sage/30 hover:bg-sage/5 transition-all duration-200 text-left"
      onclick={handleQuickExport}
    >
      <div class="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center shrink-0">
        <svg class="w-5 h-5 text-navy/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="6" y="14" width="12" height="8" rx="1"/>
        </svg>
      </div>
      <div>
        <p class="text-sm font-medium text-navy">Export rapide</p>
        <p class="text-xs text-navy/40">Rapport sans branding — impression directe</p>
      </div>
      <svg class="w-4 h-4 text-navy/20 ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <div class="relative mb-6">
      <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-navy/10"></div></div>
      <div class="relative flex justify-center text-xs"><span class="bg-white px-3 text-navy/30">ou personnalisez</span></div>
    </div>

    <!-- Branding form -->
    <form onsubmit={(e) => { e.preventDefault(); handleExport(); }} class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="agentName" class="text-xs font-medium text-navy/50 mb-1 block">Nom de l'agent</label>
          <input
            id="agentName"
            type="text"
            bind:value={agentName}
            placeholder="Jean Dupont"
            class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all"
          />
        </div>
        <div>
          <label for="agencyName" class="text-xs font-medium text-navy/50 mb-1 block">Agence</label>
          <input
            id="agencyName"
            type="text"
            bind:value={agencyName}
            placeholder="Immobilier Conseil"
            class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all"
          />
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="phone" class="text-xs font-medium text-navy/50 mb-1 block">Téléphone</label>
          <input
            id="phone"
            type="tel"
            bind:value={phone}
            placeholder="06 12 34 56 78"
            class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all"
          />
        </div>
        <div>
          <label for="email" class="text-xs font-medium text-navy/50 mb-1 block">Email</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="jean@agence.fr"
            class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all"
          />
        </div>
      </div>
      <div>
        <label for="logoUrl" class="text-xs font-medium text-navy/50 mb-1 block">URL du logo (optionnel)</label>
        <input
          id="logoUrl"
          type="url"
          bind:value={logoUrl}
          placeholder="https://monagence.fr/logo.png"
          class="w-full px-3 py-2 rounded-lg border border-navy/10 text-sm focus:ring-2 focus:ring-sage/30 focus:border-sage transition-all"
        />
      </div>

      <button
        type="submit"
        class="w-full mt-2 py-3 rounded-xl bg-sage text-white font-medium text-sm hover:bg-sage/90 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Générer le rapport brandé
      </button>
    </form>

    <p class="text-[10px] text-navy/20 text-center mt-4">
      Les informations sont utilisées uniquement pour le rapport PDF et ne sont pas stockées.
    </p>
  </div>
</dialog>
