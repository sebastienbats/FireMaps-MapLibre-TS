import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { FireLayerProps } from '@types/index';

const FireLayer: React.FC<FireLayerProps> = ({ map, fireData }) => {
  useEffect(() => {
    if (!map || !fireData?.features?.length) return;

    const src = map.getSource('fires') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(fireData as GeoJSON.FeatureCollection);
    else map.addSource('fires', { type: 'geojson', data: fireData as GeoJSON.FeatureCollection });

    if (!map.getLayer('fire-heat')) {
      map.addLayer({
        id: 'fire-heat', type: 'heatmap', source: 'fires', maxzoom: 12,
        paint: {
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 12, 3],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 12, 20],
          'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)', 0.2, 'rgba(0,255,255,0.3)', 0.4, 'rgba(0,255,0,0.4)',
            0.6, 'rgba(255,255,0,0.5)', 0.8, 'rgba(255,128,0,0.6)', 1, 'rgba(255,0,0,0.8)'],
          'heatmap-opacity': 0.8,
        },
      });
    }

    if (!map.getLayer('fire-points')) {
      map.addLayer({
        id: 'fire-points', type: 'circle', source: 'fires', minzoom: 7,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'frp'], 0, 3, 50, 8, 100, 12, 200, 18],
          'circle-color': ['case', ['>', ['get', 'frp'], 100], '#c0392b', ['>', ['get', 'frp'], 50], '#e74c3c', ['>', ['get', 'frp'], 20], '#f39c12', '#f1c40f'],
          'circle-stroke-color': '#fff', 'circle-stroke-width': 1, 'circle-opacity': 0.8,
        },
      });
    }

    const click = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }): void => {
      if (!e.features?.length) return;
      const p = e.features[0].properties as Record<string, unknown>;
      new maplibregl.Popup({ offset: 15 }).setLngLat(e.lngLat).setHTML(
        `<div style="padding:8px;max-width:250px"><h3 style="margin:0 0 8px;color:#e74c3c">🔥 Feu ${String(p.intensity ?? 'N/A')}</h3><p style="margin:4px 0"><b>FRP:</b> ${Number(p.frp ?? 0).toFixed(1)} MW</p><p style="margin:4px 0"><b>Confiance:</b> ${String(p.confidence ?? 'N/A')}%</p><p style="margin:4px 0"><b>Satellite:</b> ${String(p.satellite ?? 'N/A')}</p><p style="margin:4px 0"><b>Capteur:</b> ${String(p.instrument ?? 'N/A')}</p><p style="margin:4px 0"><b>Date:</b> ${String(p.acq_date ?? 'N/A')}</p><p style="margin:4px 0"><b>Source:</b> ${String(p.source ?? 'NASA FIRMS')}</p></div>`
      ).addTo(map);
    };

    map.on('click', 'fire-points', click as (e: maplibregl.MapMouseEvent) => void);
    return () => map.off('click', 'fire-points', click as (e: maplibregl.MapMouseEvent) => void);
  }, [map, fireData]);

  return null;
};

export default FireLayer;
