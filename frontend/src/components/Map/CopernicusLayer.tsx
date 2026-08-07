import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import type { BurnedAreaCollection, FireRiskCollection } from '@types/index';
import { LAYER_ORDER } from './Map';

interface CopernicusLayerProps {
  map: maplibregl.Map;
  data: BurnedAreaCollection | FireRiskCollection;
  type: 'burned' | 'risk';
  openPopup: (lngLat: [number, number], html: string) => void;
}

const CopernicusLayer: React.FC<CopernicusLayerProps> = ({ map, data, type, openPopup }) => {
  const sourceId = `cop-${type}`;
  const layerId = `cop-${type}-layer`;

  useEffect(() => {
    if (!map || !data?.features?.length) return;

    // ✅ Ajouter/mettre à jour la source
    const src = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(data as GeoJSON.FeatureCollection);
    } else {
      map.addSource(sourceId, { type: 'geojson', data: data as GeoJSON.FeatureCollection });
    }

    // ✅ Ajouter la couche si elle n'existe pas
    if (!map.getLayer(layerId)) {
      map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': type === 'burned'
            ? ['case', ['==', ['get', 'severity'], 'critical'], '#8B0000', ['==', ['get', 'severity'], 'high'], '#B22222', '#DEB887']
            : ['case', ['==', ['get', 'riskLevel'], 'extrême'], '#FF0000', ['==', ['get', 'riskLevel'], 'élevé'], '#FF4500', '#FFFF00'],
          'fill-opacity': type === 'burned' ? 0.4 : 0.3,
          'fill-outline-color': type === 'burned' ? '#8B4513' : '#FF6347',
        },
      });
    }

    // ✅ P1 : Réorganiser l'ordre des couches
    const layerIdx = LAYER_ORDER.indexOf(layerId as typeof LAYER_ORDER[number]);
    if (layerIdx > 0 && layerIdx < LAYER_ORDER.length - 1) {
      const beforeId = LAYER_ORDER[layerIdx + 1];
      if (map.getLayer(beforeId)) {
        map.moveLayer(layerId, beforeId);
      }
    }

    // ✅ P2 : Popup unique via openPopup
    const clickHandler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }): void => {
      if (!e.features?.length) return;
      const p = e.features[0].properties as Record<string, unknown>;
      
      openPopup(
        [e.lngLat.lng, e.lngLat.lat],
        `<div style="padding:8px;color:#1a1a2e">
          <h3 style="margin:0 0 8px;color:${type === 'burned' ? '#8B4513' : '#FF4500'}">
            ${type === 'burned' ? '🔥 Zone brûlée' : '⚠️ Zone à risque'}
          </h3>
          <p style="margin:4px 0"><b>Source:</b> ${String(p.source ?? 'N/A')}</p>
          ${type === 'burned'
            ? `<p style="margin:4px 0"><b>Sévérité:</b> ${String(p.severity ?? 'N/A')}</p>
               <p style="margin:4px 0"><b>Surface:</b> ${String(p.area_ha ?? 'N/A')} ha</p>`
            : `<p style="margin:4px 0"><b>Niveau:</b> ${String(p.riskLevel ?? 'N/A')}</p>`
          }
        </div>`
      );
    };

    map.on('click', layerId, clickHandler as (e: maplibregl.MapMouseEvent) => void);

    // ✅ P1 : Cleanup au démontage
    return () => {
      map.off('click', layerId, clickHandler as (e: maplibregl.MapMouseEvent) => void);
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, data, type, sourceId, layerId, openPopup]);

  return null;
};

export default CopernicusLayer;
