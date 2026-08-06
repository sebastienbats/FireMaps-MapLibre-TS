import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { CopernicusLayerProps } from '@types/index';

const CopernicusLayer: React.FC<CopernicusLayerProps> = ({ map, data, type }) => {
  useEffect(() => {
    if (!map || !data?.features?.length) return;
    const sid = `cop-${type}`, lid = `cop-${type}-layer`;

    const src = map.getSource(sid) as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(data as GeoJSON.FeatureCollection);
    else map.addSource(sid, { type: 'geojson', data: data as GeoJSON.FeatureCollection });

    if (!map.getLayer(lid)) {
      map.addLayer({
        id: lid, type: 'fill', source: sid,
        paint: {
          'fill-color': type === 'burned'
            ? ['case', ['==', ['get', 'severity'], 'critical'], '#8B0000', ['==', ['get', 'severity'], 'high'], '#B22222', '#DEB887']
            : ['case', ['==', ['get', 'riskLevel'], 'extrême'], '#FF0000', ['==', ['get', 'riskLevel'], 'élevé'], '#FF4500', '#FFFF00'],
          'fill-opacity': type === 'burned' ? 0.4 : 0.3,
          'fill-outline-color': type === 'burned' ? '#8B4513' : '#FF6347',
        },
      });
    }

    const click = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }): void => {
      if (!e.features?.length) return;
      const p = e.features[0].properties as Record<string, unknown>;
      new maplibregl.Popup({ offset: 15 }).setLngLat(e.lngLat).setHTML(
        `<div style="padding:8px"><h3 style="margin:0 0 8px;color:${type === 'burned' ? '#8B4513' : '#FF4500'}">${type === 'burned' ? '🔥 Zone brûlée' : '⚠️ Zone à risque'}</h3><p><b>Source:</b> ${String(p.source ?? 'Copernicus EMS')}</p><p><b>Produit:</b> ${String(p.product ?? type)}</p></div>`
      ).addTo(map);
    };

    map.on('click', lid, click as (e: maplibregl.MapMouseEvent) => void);
    return () => map.off('click', lid, click as (e: maplibregl.MapMouseEvent) => void);
  }, [map, data, type]);

  return null;
};

export default CopernicusLayer;
