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
      html: `<div style="width:16px;height:16px;background:#dc2626;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    leaflet.marker([lat, lon], { icon: targetIcon }).addTo(map)
      .bindPopup('<b>Adresse recherchee</b>');

    // Radius circle
    leaflet.circle([lat, lon], {
      radius: radiusM,
      color: '#1a2744',
      fillColor: '#1a2744',
      fillOpacity: 0.05,
      weight: 1,
      dashArray: '6 4',
    }).addTo(map);

    // Comparable markers (navy)
    const compIcon = leaflet.divIcon({
      className: '',
      html: `<div style="width:12px;height:12px;background:#1a2744;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.2)"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    for (const c of comparables) {
      const marker = leaflet.marker([c.lat, c.lon], { icon: compIcon }).addTo(map);
      marker.bindPopup(
        `<b>${c.address}</b><br>${c.surface} m&sup2; &middot; ${Math.round(c.prix_m2).toLocaleString('fr-FR')} &euro;/m&sup2;<br>${c.valeur_fonciere.toLocaleString('fr-FR')} &euro; &middot; ${new Date(c.date_mutation).toLocaleDateString('fr-FR')}`
      );
      marker.on('click', () => onSelectComparable(c));
      markers.set(c.id_mutation, marker);
    }

    // Fit bounds to show all markers
    const allPoints: L.LatLngExpression[] = [[lat, lon], ...comparables.map(c => [c.lat, c.lon] as L.LatLngExpression)];
    if (allPoints.length > 1) {
      map.fitBounds(leaflet.latLngBounds(allPoints), { padding: [40, 40] });
    }

    return () => map.remove();
  });

  // React to selectedId changes
  $effect(() => {
    if (selectedId && markers.has(selectedId)) {
      const marker = markers.get(selectedId)!;
      map.panTo(marker.getLatLng());
      marker.openPopup();
    }
  });
</script>

<div bind:this={mapContainer} class="w-full h-96 rounded-xl z-0"></div>
