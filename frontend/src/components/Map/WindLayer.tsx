import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { WindLayerProps } from '@types/index';

const WindLayer: React.FC<WindLayerProps> = ({ map, windData, opacity }) => {
  useEffect(() => {
    if (!map || !windData?.features?.length) return;

    const src = map.getSource('wind-data') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(windData as GeoJSON.FeatureCollection);
    else map.addSource('wind-data', { type: 'geojson', data: windData as GeoJSON.FeatureCollection });

    if (!map.getLayer('wind-lines')) {
      map.addLayer({
        id: 'wind-lines', type: 'line', source: 'wind-data',
        paint: {
          'line-color': ['interpolate', ['linear'], ['get', 'speed'], 0, '#3498db', 20, '#2ecc71', 40, '#f39c12', 60, '#e74c3c', 80, '#8e44ad'],
          'line-width': ['interpolate', ['linear'], ['get', 'speed'], 0, 1, 50, 2, 100, 3],
          'line-opacity': opacity,
        },
      });
    }

    return () => {
      if (map.getLayer('wind-lines')) map.removeLayer('wind-lines');
      if (map.getSource('wind-data')) map.removeSource('wind-data');
    };
  }, [map, windData, opacity]);

  return null;
};

export default WindLayer;
