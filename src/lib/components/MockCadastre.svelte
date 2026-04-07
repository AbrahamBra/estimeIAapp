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
