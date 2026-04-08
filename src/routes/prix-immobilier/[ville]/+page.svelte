<script lang="ts">
  import PriceTrend from '$lib/components/PriceTrend.svelte';

  let { data } = $props();

  const commune = data.commune;
  const stats = data.stats;

  function formatPrice(n: number): string {
    return n.toLocaleString('fr-FR');
  }

  const currentYear = new Date().getFullYear();
  const pageTitle = commune
    ? `Prix immobilier à ${commune.nom} en ${currentYear}`
    : `Prix immobilier — ville non trouvée`;
</script>

<svelte:head>
  <title>{pageTitle} | EstimeIA</title>
  <meta name="description" content={commune
    ? `Découvrez les prix immobiliers à ${commune.nom} (${commune.departement.nom}). Prix médian au m² pour appartements et maisons, tendances et estimation gratuite.`
    : 'Prix immobilier en France — Estimation gratuite basée sur les données DVF.'
  } />
  {#if commune}
    <meta property="og:title" content={pageTitle} />
    <meta property="og:description" content={`Prix au m² à ${commune.nom} : appartements, maisons, tendances du marché immobilier. Données DVF officielles.`} />
    <link rel="canonical" href={`/prix-immobilier/${data.villeSlug}`} />
  {/if}
</svelte:head>

<div class="max-w-4xl mx-auto px-6 py-12">
  {#if commune}
    <!-- Hero -->
    <div class="mb-12">
      <p class="text-sm text-sage font-medium mb-2">Prix immobilier</p>
      <h1 class="font-display text-3xl md:text-4xl font-bold text-navy mb-3">
        Prix au m² à {commune.nom}
      </h1>
      <p class="text-navy/50">
        {commune.departement.nom} ({commune.departement.code}) &middot; {commune.region.nom}
        {#if commune.population}
          &middot; {commune.population.toLocaleString('fr-FR')} habitants
        {/if}
      </p>
    </div>

    {#if stats}
      <!-- Price cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {#if stats.medianPrixM2Appart}
          <div class="bg-white rounded-2xl border border-navy/10 p-6 shadow-sm">
            <p class="text-sm text-navy/40 mb-2">Appartements</p>
            <p class="font-mono text-3xl font-bold text-navy">
              {formatPrice(stats.medianPrixM2Appart)} <span class="text-lg text-navy/40">€/m²</span>
            </p>
            <p class="text-xs text-navy/30 mt-2">Prix médian au m² — données DVF</p>
          </div>
        {/if}
        {#if stats.medianPrixM2Maison}
          <div class="bg-white rounded-2xl border border-navy/10 p-6 shadow-sm">
            <p class="text-sm text-navy/40 mb-2">Maisons</p>
            <p class="font-mono text-3xl font-bold text-navy">
              {formatPrice(stats.medianPrixM2Maison)} <span class="text-lg text-navy/40">€/m²</span>
            </p>
            <p class="text-xs text-navy/30 mt-2">Prix médian au m² — données DVF</p>
          </div>
        {/if}
      </div>

      <!-- Trend chart -->
      {#if stats.trend.length > 1}
        <div class="mb-12">
          <h2 class="font-display text-xl font-bold text-navy mb-4">Évolution des prix</h2>
          <PriceTrend trend={stats.trend} />
        </div>
      {/if}

      <!-- Stats summary -->
      <div class="bg-navy/[0.02] rounded-2xl border border-navy/5 p-6 mb-12">
        <h2 class="font-display text-lg font-bold text-navy mb-4">En résumé</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p class="font-mono text-xl font-bold text-navy">{stats.totalSales}</p>
            <p class="text-xs text-navy/40 mt-1">Ventes récentes</p>
          </div>
          {#if stats.medianPrixM2Appart}
            <div>
              <p class="font-mono text-xl font-bold text-navy">{formatPrice(stats.medianPrixM2Appart)}</p>
              <p class="text-xs text-navy/40 mt-1">€/m² appart.</p>
            </div>
          {/if}
          {#if stats.medianPrixM2Maison}
            <div>
              <p class="font-mono text-xl font-bold text-navy">{formatPrice(stats.medianPrixM2Maison)}</p>
              <p class="text-xs text-navy/40 mt-1">€/m² maison</p>
            </div>
          {/if}
          <div>
            <p class="font-mono text-xl font-bold text-navy">{stats.trend.length}</p>
            <p class="text-xs text-navy/40 mt-1">Années de données</p>
          </div>
        </div>
      </div>
    {:else}
      <div class="text-center py-12">
        <p class="text-navy/40">Données indisponibles pour cette commune.</p>
      </div>
    {/if}

    <!-- CTA -->
    <div class="text-center bg-gradient-to-br from-sage/5 to-ivory rounded-2xl border border-sage/10 p-8">
      <h2 class="font-display text-xl font-bold text-navy mb-2">
        Estimez un bien à {commune.nom}
      </h2>
      <p class="text-navy/50 text-sm mb-6">
        Obtenez une estimation précise avec ventes comparables, DPE, proximité et rendement locatif.
      </p>
      <a
        href="/"
        class="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-medium text-sm hover:bg-sage/90 transition-all duration-300 shadow-sm hover:shadow-md"
      >
        Estimer gratuitement
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </div>

    <!-- SEO structured data -->
    {@html `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": pageTitle,
      "description": `Prix immobilier à ${commune.nom}. Prix médian au m² pour appartements et maisons.`,
      "url": `/prix-immobilier/${data.villeSlug}`,
      "about": {
        "@type": "Place",
        "name": commune.nom,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": commune.nom,
          "addressRegion": commune.region.nom,
          "addressCountry": "FR"
        }
      }
    })}</script>`}

  {:else}
    <div class="text-center py-20">
      <h1 class="font-display text-2xl font-bold text-navy mb-2">Ville non trouvée</h1>
      <p class="text-navy/40 mb-6">Nous n'avons pas trouvé de commune correspondant à « {data.villeSlug} ».</p>
      <a href="/" class="text-sage hover:underline">Retour à l'accueil</a>
    </div>
  {/if}
</div>
