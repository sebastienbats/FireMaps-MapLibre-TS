import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { WindCollection } from '@types/index';
import { LAYER_ORDER } from './Map';

interface WindLayerProps {
  map: maplibregl.Map;
  windData: WindCollection;
  opacity: number;
}

const WindLayer: React.FC<WindLayerProps> = ({ map, windData, opacity }) => {
  useEffect(() => {
    if (!map || !windData?.features?.length) return;

    // ✅ Ajouter/mettre à jour la source
    const src = map.getSource('wind-data') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(windData as GeoJSON.FeatureCollection);
    } else {
      map.addSource('wind-data', { type: 'geojson', data: windData as GeoJSON.FeatureCollection });
    }

    // ✅ Ajouter la couche si elle n'existe pas
    if (!map.getLayer('wind-lines')) {
      map.addLayer({
        id: 'wind-lines',
        type: 'line',
        source: 'wind-data',
        paint: {
          'line-color': ['interpolate', ['linear'], ['get', 'speed'], 0, '#3498db', 20, '#2ecc71', 40, '#f39c12', 60, '#e74c3c', 80, '#8e44ad'],
          'line-width': ['interpolate', ['linear'], ['get', 'speed'], 0, 1, 50, 2, 100, 3],
          'line-opacity': opacity,
        },
      });
    }

    // ✅ P1 : S'assurer que wind-lines est toujours au-dessus
    const windIdx = LAYER_ORDER.indexOf('wind-lines');
    if (windIdx === LAYER_ORDER.length - 1) {
      // wind-lines est le dernier, pas besoin de moveLayer
    }

    // ✅ P1 : Cleanup au démontage
    return () => {
      if (map.getLayer('wind-lines')) map.removeLayer('wind-lines');
      if (map.getSource('wind-data')) map.removeSource('wind-data');
    };
  }, [map, windData, opacity]);

  return null;
};

export default WindLayer;
