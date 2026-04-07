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
