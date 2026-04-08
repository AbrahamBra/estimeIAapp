<script lang="ts">
  import type { PropertyCharacteristics } from '$lib/types';

  let {
    characteristics = $bindable(),
    propertyType,
  }: {
    characteristics: PropertyCharacteristics;
    propertyType: string;
  } = $props();

  type Criterion = {
    key: keyof PropertyCharacteristics;
    label: string;
    icon: string;
    options: { value: string; label: string }[];
  };

  const isAppartement = $derived(propertyType === 'Appartement');

  // Floor criteria only applies to apartments — a house is always ground level
  const floorCriterion: Criterion = {
    key: 'floor',
    label: 'Étage',
    icon: '🏢',
    options: [
      { value: 'rdc', label: 'RDC' },
      { value: '1-2', label: '1-2' },
      { value: '3-4', label: '3-4' },
      { value: '5+', label: '5+' },
      { value: 'last', label: 'Dernier' },
    ],
  };

  // Outdoor options differ by property type:
  // - Appartement: balcon, terrasse, loggia (no garden unless RDC, rare)
  // - Maison: terrasse, jardin (no balcon/loggia — those are apartment features)
  const outdoorAppartement = [
    { value: 'none', label: 'Aucun' },
    { value: 'balcony', label: 'Balcon' },
    { value: 'terrace', label: 'Terrasse' },
    { value: 'loggia', label: 'Loggia' },
  ];
  const outdoorMaison = [
    { value: 'none', label: 'Aucun' },
    { value: 'terrace', label: 'Terrasse' },
    { value: 'garden', label: 'Jardin' },
  ];

  const baseCriteria: Criterion[] = $derived([
    {
      key: 'outdoor' as keyof PropertyCharacteristics,
      label: 'Extérieur',
      icon: '🌿',
      options: isAppartement ? outdoorAppartement : outdoorMaison,
    },
    {
      key: 'view' as keyof PropertyCharacteristics,
      label: 'Vue',
      icon: '👁️',
      options: [
        { value: 'vis-a-vis', label: 'Vis-à-vis' },
        { value: 'street', label: 'Sur rue' },
        { value: 'clear', label: 'Dégagée' },
        { value: 'panoramic', label: 'Panoramique' },
      ],
    },
    {
      key: 'exposure' as keyof PropertyCharacteristics,
      label: 'Exposition',
      icon: '☀️',
      options: [
        { value: 'north', label: 'Nord' },
        { value: 'east-west', label: 'Est/Ouest' },
        { value: 'south', label: 'Sud' },
        { value: 'dual', label: 'Traversant' },
      ],
    },
    {
      key: 'condition' as keyof PropertyCharacteristics,
      label: 'État',
      icon: '🔧',
      options: [
        { value: 'to-renovate', label: 'À rénover' },
        { value: 'to-refresh', label: 'À rafraîchir' },
        { value: 'good', label: 'Bon état' },
        { value: 'like-new', label: 'Refait à neuf' },
      ],
    },
    {
      key: 'parking' as keyof PropertyCharacteristics,
      label: 'Parking',
      icon: '🚗',
      options: [
        { value: 'none', label: 'Aucun' },
        { value: 'outdoor', label: 'Extérieur' },
        { value: 'garage', label: 'Garage' },
        { value: 'box', label: 'Box fermé' },
      ],
    },
    {
      key: 'noise' as keyof PropertyCharacteristics,
      label: 'Calme',
      icon: '🔇',
      options: [
        { value: 'noisy', label: 'Bruyant' },
        { value: 'normal', label: 'Normal' },
        { value: 'quiet', label: 'Calme' },
        { value: 'very-quiet', label: 'Très calme' },
      ],
    },
  ]);

  // Merge criteria: floor only for apartments
  const criteria: Criterion[] = $derived(
    isAppartement ? [floorCriterion, ...baseCriteria] : baseCriteria
  );

  const showElevator = $derived(
    isAppartement && (characteristics.floor === '5+' || characteristics.floor === 'last')
  );

  const showPool = $derived(propertyType === 'Maison');

  // Reset type-specific characteristics when switching property type
  $effect(() => {
    if (!isAppartement) {
      characteristics.floor = null;
      characteristics.elevator = null;
      // Reset apartment-only outdoor values
      if (characteristics.outdoor === 'balcony' || characteristics.outdoor === 'loggia') {
        characteristics.outdoor = null;
      }
    } else {
      // Reset house-only outdoor values
      if (characteristics.outdoor === 'garden') {
        characteristics.outdoor = null;
      }
    }
  });

  function toggleChip(key: keyof PropertyCharacteristics, value: string) {
    if (characteristics[key] === value) {
      (characteristics as Record<string, unknown>)[key] = null;
    } else {
      (characteristics as Record<string, unknown>)[key] = value;
    }

    // Reset elevator when floor changes away from 5+/last
    if (key === 'floor' && value !== '5+' && value !== 'last') {
      characteristics.elevator = null;
    }
  }

  function toggleElevator(value: boolean) {
    characteristics.elevator = characteristics.elevator === value ? null : value;
  }

  function togglePool(value: boolean) {
    characteristics.pool = characteristics.pool === value ? null : value;
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
  {#each criteria as criterion, i (criterion.key)}
    <div class="py-4 {i < criteria.length - 1 ? 'border-b border-navy/5' : ''}">
      <p class="text-sm font-medium text-navy/70 mb-2.5">
        <span class="mr-1.5" aria-hidden="true">{criterion.icon}</span>{criterion.label}
      </p>
      <div class="flex flex-wrap gap-2">
        {#each criterion.options as option (option.value)}
          <button
            type="button"
            class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-[1.02]
              {characteristics[criterion.key] === option.value
                ? 'bg-navy text-white shadow-sm'
                : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}"
            onclick={() => toggleChip(criterion.key, option.value)}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>
  {/each}

  {#if showElevator}
    <div
      class="py-4 border-l-2 border-sage/40 pl-4"
      style="animation: fadeInUp 0.25s ease-out;"
    >
      <p class="text-sm font-medium text-navy/70 mb-2.5">
        <span class="mr-1.5" aria-hidden="true">🛗</span>Ascenseur
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-[1.02]
            {characteristics.elevator === true
              ? 'bg-navy text-white shadow-sm'
              : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}"
          onclick={() => toggleElevator(true)}
        >
          Oui
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-[1.02]
            {characteristics.elevator === false
              ? 'bg-navy text-white shadow-sm'
              : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}"
          onclick={() => toggleElevator(false)}
        >
          Non
        </button>
      </div>
    </div>
  {/if}

  {#if showPool}
    <div
      class="py-4"
      style="animation: fadeInUp 0.25s ease-out;"
    >
      <p class="text-sm font-medium text-navy/70 mb-2.5">
        <span class="mr-1.5" aria-hidden="true">🏊</span>Piscine
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-[1.02]
            {characteristics.pool === true
              ? 'bg-navy text-white shadow-sm'
              : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}"
          onclick={() => togglePool(true)}
        >
          Oui
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer hover:scale-[1.02]
            {characteristics.pool === false
              ? 'bg-navy text-white shadow-sm'
              : 'bg-navy/5 text-navy/60 hover:bg-navy/10'}"
          onclick={() => togglePool(false)}
        >
          Non
        </button>
      </div>
    </div>
  {/if}
</div>
