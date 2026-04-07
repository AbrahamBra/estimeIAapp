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
