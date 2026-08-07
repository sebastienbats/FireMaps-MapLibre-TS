import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import type { SdisCollection } from '@types/index';
import { LAYER_ORDER } from './Map';

interface SdisLayerProps {
  map: maplibregl.Map;
  sdisData: SdisCollection;
  openPopup: (lngLat: [number, number], html: string) => void;
}

const SdisLayer: React.FC<SdisLayerProps> = ({ map, sdisData, openPopup }) => {
  const isInitialized = useRef(false);

  const handleClick = useCallback((e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
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
  }, [openPopup]);

  useEffect(() => {
    if (!map || !sdisData?.features?.length) return;

    const src = map.getSource('sdis') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(sdisData as GeoJSON.FeatureCollection);
    } else {
      map.addSource('sdis', { type: 'geojson', data: sdisData as GeoJSON.FeatureCollection });
    }

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

    const sdisIdx = LAYER_ORDER.indexOf('sdis-points');
    if (sdisIdx > 0 && sdisIdx < LAYER_ORDER.length - 1) {
      const beforeId = LAYER_ORDER[sdisIdx + 1];
      if (map.getLayer(beforeId)) {
        map.moveLayer('sdis-points', beforeId);
      }
    }

    if (!isInitialized.current) {
      map.on('click', 'sdis-points', handleClick as (e: maplibregl.MapMouseEvent) => void);
      isInitialized.current = true;
    }

    return () => {
      if (isInitialized.current) {
        map.off('click', 'sdis-points', handleClick as (e: maplibregl.MapMouseEvent) => void);
        isInitialized.current = false;
      }
      if (map.getLayer('sdis-points')) map.removeLayer('sdis-points');
      if (map.getSource('sdis')) map.removeSource('sdis');
    };
  }, [map, sdisData, handleClick]);

  return null;
};

export default SdisLayer;
