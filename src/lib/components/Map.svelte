<script lang="ts">
  import { onMount } from 'svelte';
  import type { Comparable } from '$lib/types';
  import type L from 'leaflet';

  let {
    lat,
    lon,
    radiusM,
    comparables,
    selectedId = null,
    onSelectComparable,
  }: {
    lat: number;
    lon: number;
    radiusM: number;
    comparables: Comparable[];
    selectedId?: string | null;
    onSelectComparable: (comparable: Comparable) => void;
  } = $props();

  let mapContainer: HTMLDivElement;
  let map: L.Map;
  let markers: Map<string, L.Marker> = new Map();
  let leaflet: typeof L;

  function computeTerciles(): { t1: number; t2: number } {
    const prices = comparables.map(c => c.prix_m2).sort((a, b) => a - b);
    return {
      t1: prices[Math.floor(prices.length / 3)] ?? 0,
      t2: prices[Math.floor(prices.length * 2 / 3)] ?? Infinity,
    };
  }

  function markerColor(prix_m2: number, t1: number, t2: number): string {
    if (prix_m2 <= t1) return '#4a9d6b';
    if (prix_m2 <= t2) return '#d4a029';
    return '#d45a5a';
  }

  function formatPrice(n: number): string {
    return Math.round(n).toLocaleString('fr-FR');
  }

  onMount(async () => {
    leaflet = await import('leaflet');
    map = leaflet.map(mapContainer).setView([lat, lon], 15);

    leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Target marker (red)
    const targetIcon = leaflet.divIcon({
      className: '',
      html: `<div style="width:18px;height:18px;background:#dc2626;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
    leaflet.marker([lat, lon], { icon: targetIcon }).addTo(map)
      .bindPopup('<b>Adresse recherchee</b>');

    // Radius circle
    leaflet.circle([lat, lon], {
      radius: radiusM,
      color: '#1a2744',
      fillColor: '#1a2744',
      fillOpacity: 0.04,
      weight: 1,
      dashArray: '6 4',
    }).addTo(map);

    // Color-coded comparable markers
    const { t1, t2 } = computeTerciles();

    for (const c of comparables) {
      const color = markerColor(c.prix_m2, t1, t2);
      const icon = leaflet.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.25);transition:transform 0.2s"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      const marker = leaflet.marker([c.lat, c.lon], { icon }).addTo(map);
      marker.bindPopup(
        `<div style="font-family:Inter,sans-serif;font-size:13px;line-height:1.4">
          <b>${c.address}</b><br>
          <span style="color:${color};font-weight:600">${formatPrice(c.prix_m2)} &euro;/m&sup2;</span><br>
          <span style="color:#666">${c.surface} m&sup2; &middot; ${c.valeur_fonciere.toLocaleString('fr-FR')} &euro;</span><br>
          <span style="color:#999">${new Date(c.date_mutation).toLocaleDateString('fr-FR')}</span>
        </div>`
      );
      marker.on('click', () => onSelectComparable(c));
      markers.set(c.id_mutation, marker);
    }

    // Legend
    const legend = new (leaflet.Control as any)({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = leaflet.DomUtil.create('div', '');
      div.style.cssText = 'background:white;padding:8px 10px;border-radius:8px;font-size:11px;line-height:1.6;box-shadow:0 1px 4px rgba(0,0,0,.15);font-family:Inter,sans-serif';
      div.innerHTML = `
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px"><div style="width:8px;height:8px;background:#4a9d6b;border-radius:50%"></div> &lt; ${formatPrice(t1)} &euro;/m&sup2;</div>
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px"><div style="width:8px;height:8px;background:#d4a029;border-radius:50%"></div> ${formatPrice(t1)}&ndash;${formatPrice(t2)}</div>
        <div style="display:flex;align-items:center;gap:5px"><div style="width:8px;height:8px;background:#d45a5a;border-radius:50%"></div> &gt; ${formatPrice(t2)} &euro;/m&sup2;</div>
      `;
      return div;
    };
    legend.addTo(map);

    // Fit bounds
    const allPoints: L.LatLngExpression[] = [[lat, lon], ...comparables.map(c => [c.lat, c.lon] as L.LatLngExpression)];
    if (allPoints.length > 1) {
      map.fitBounds(leaflet.latLngBounds(allPoints), { padding: [40, 40] });
    }

    return () => map.remove();
  });

  $effect(() => {
    if (selectedId && markers.has(selectedId)) {
      const marker = markers.get(selectedId)!;
      map.panTo(marker.getLatLng());
      marker.openPopup();
    }
  });
</script>

<div bind:this={mapContainer} class="w-full h-96 rounded-xl z-0 shadow-sm"></div>
