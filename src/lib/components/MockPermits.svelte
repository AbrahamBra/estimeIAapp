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
