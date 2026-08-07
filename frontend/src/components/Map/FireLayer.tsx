import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { FireCollection } from '@types/index';
import { LAYER_ORDER } from './Map';

interface FireLayerProps {
  map: maplibregl.Map;
  fireData: FireCollection;
  openPopup: (lngLat: [number, number], html: string) => void;
}

const FireLayer: React.FC<FireLayerProps> = ({ map, fireData, openPopup }) => {
  useEffect(() => {
    if (!map || !fireData?.features?.length) return;

    // ✅ Ajouter/mettre à jour la source
    const src = map.getSource('fires') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(fireData as GeoJSON.FeatureCollection);
    } else {
      map.addSource('fires', { type: 'geojson', data: fireData as GeoJSON.FeatureCollection });
    }

    // ✅ P2 : Heatmap visible uniquement aux zooms faibles (< 8)
    if (!map.getLayer('fire-heat')) {
      map.addLayer({
        id: 'fire-heat',
        type: 'heatmap',
        source: 'fires',
        maxzoom: 8, // ✅ Disparaît au zoom 8
        paint: {
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 8, 3],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 8, 20],
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)', 0.2, 'rgba(0,255,255,0.3)', 0.4, 'rgba(0,255,0,0.4)',
            0.6, 'rgba(255,255,0,0.5)', 0.8, 'rgba(255,128,0,0.6)', 1, 'rgba(255,0,0,0.8)'],
          'heatmap-opacity': 0.8,
        },
      });
    }

    // ✅ P2 : Points visibles uniquement aux zooms élevés (>= 7)
    if (!map.getLayer('fire-points')) {
      map.addLayer({
        id: 'fire-points',
        type: 'circle',
        source: 'fires',
        minzoom: 7, // ✅ Apparaît au zoom 7
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'frp'], 0, 3, 50, 8, 100, 12, 200, 18],
          'circle-color': ['case', ['>', ['get', 'frp'], 100], '#c0392b', ['>', ['get', 'frp'], 50], '#e74c3c', ['>', ['get', 'frp'], 20], '#f39c12', '#f1c40f'],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 1,
          'circle-opacity': 0.8,
        },
      });
    }

    // ✅ P1 : Réorganiser l'ordre des couches
    const heatIdx = LAYER_ORDER.indexOf('fire-heat');
    const pointsIdx = LAYER_ORDER.indexOf('fire-points');
    
    if (heatIdx > 0) {
      const beforeId = LAYER_ORDER[heatIdx + 1];
      if (map.getLayer(beforeId)) {
        map.moveLayer('fire-heat', beforeId);
      }
    }
    
    if (pointsIdx > 0) {
      const beforeId = LAYER_ORDER[pointsIdx + 1];
      if (map.getLayer(beforeId)) {
        map.moveLayer('fire-points', beforeId);
      }
    }

    // ✅ P2 : Popup unique via openPopup
    const clickHandler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }): void => {
      if (!e.features?.length) return;
      const p = e.features[0].properties as Record<string, unknown>;
      
      openPopup(
        [e.lngLat.lng, e.lngLat.lat],
        `<div style="padding:8px;max-width:250px;color:#1a1a2e">
          <h3 style="margin:0 0 8px;color:#e74c3c">🔥 Feu ${String(p.intensity ?? 'N/A')}</h3>
          <p style="margin:4px 0"><b>FRP:</b> ${Number(p.frp ?? 0).toFixed(1)} MW</p>
          <p style="margin:4px 0"><b>Confiance:</b> ${String(p.confidence ?? 'N/A')}%</p>
          <p style="margin:4px 0"><b>Satellite:</b> ${String(p.satellite ?? 'N/A')}</p>
          <p style="margin:4px 0"><b>Capteur:</b> ${String(p.instrument ?? 'N/A')}</p>
          <p style="margin:4px 0"><b>Date:</b> ${String(p.acq_date ?? 'N/A')}</p>
        </div>`
      );
    };

    map.on('click', 'fire-points', clickHandler as (e: maplibregl.MapMouseEvent) => void);

    // ✅ P1 : Cleanup au démontage
    return () => {
      map.off('click', 'fire-points', clickHandler as (e: maplibregl.MapMouseEvent) => void);
      if (map.getLayer('fire-heat')) map.removeLayer('fire-heat');
      if (map.getLayer('fire-points')) map.removeLayer('fire-points');
      if (map.getSource('fires')) map.removeSource('fires');
    };
  }, [map, fireData, openPopup]);

  return null;
};

export default FireLayer;
