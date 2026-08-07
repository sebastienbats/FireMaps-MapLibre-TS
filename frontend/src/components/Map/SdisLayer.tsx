import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { SdisCollection } from '@types/index';
import { LAYER_ORDER } from './Map';

interface SdisLayerProps {
  map: maplibregl.Map;
  sdisData: SdisCollection;
  openPopup: (lngLat: [number, number], html: string) => void;
}

// ✅ P2 : Couche vectorielle (pas de marqueurs HTML)
const SdisLayer: React.FC<SdisLayerProps> = ({ map, sdisData, openPopup }) => {
  useEffect(() => {
    if (!map || !sdisData?.features?.length) return;

    // ✅ Ajouter/mettre à jour la source
    const src = map.getSource('sdis') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(sdisData as GeoJSON.FeatureCollection);
    } else {
      map.addSource('sdis', { type: 'geojson', data: sdisData as GeoJSON.FeatureCollection });
    }

    // ✅ Couche circle vectorielle (remplace les marqueurs HTML)
    if (!map.getLayer('sdis-points')) {
      map.addLayer({
        id: 'sdis-points',
        type: 'circle',
        source: 'sdis',
        paint: {
          'circle-radius': [
            'case',
            ['==', ['get', 'type'], 'principal'], 8,
            6,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'type'], 'principal'], '#3498db',
            '#9b59b6',
          ],
          'circle-stroke-color': '#fff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.9,
        },
      });
    }

    // ✅ P1 : Réorganiser l'ordre des couches
    const sdisIdx = LAYER_ORDER.indexOf('sdis-points');
    if (sdisIdx > 0 && sdisIdx < LAYER_ORDER.length - 1) {
      const beforeId = LAYER_ORDER[sdisIdx + 1];
      if (map.getLayer(beforeId)) {
        map.moveLayer('sdis-points', beforeId);
      }
    }

    // ✅ P2 : Popup unique via openPopup
    const clickHandler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }): void => {
      if (!e.features?.length) return;
      const p = e.features[0].properties as Record<string, unknown>;
      
      openPopup(
        [e.lngLat.lng, e.lngLat.lat],
        `<div style="padding:8px;color:#1a1a2e">
          <h3 style="margin:0 0 8px;color:#3498db">🚒 ${String(p.name ?? 'Caserne')}</h3>
          <p style="margin:4px 0"><b>Département:</b> ${String(p.department ?? 'N/A')}</p>
          <p style="margin:4px 0"><b>Type:</b> ${String(p.type ?? 'N/A')}</p>
          <p style="margin:4px 0"><b>Capacité:</b> ${String(p.capacity ?? 'N/A')}</p>
          <p style="margin:4px 0"><b>Contact:</b> ${String(p.contact ?? 'N/A')}</p>
        </div>`
      );
    };

    map.on('click', 'sdis-points', clickHandler as (e: maplibregl.MapMouseEvent) => void);

    // ✅ P1 : Cleanup au démontage
    return () => {
      map.off('click', 'sdis-points', clickHandler as (e: maplibregl.MapMouseEvent) => void);
      if (map.getLayer('sdis-points')) map.removeLayer('sdis-points');
      if (map.getSource('sdis')) map.removeSource('sdis');
    };
  }, [map, sdisData, openPopup]);

  return null;
};

export default SdisLayer;
