import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import FireLayer from './FireLayer';
import CopernicusLayer from './CopernicusLayer';
import WindLayer from './WindLayer';
import SdisLayer from './SdisLayer';
import { useMapStore } from '@store/mapStore';
import type { FireCollection, BurnedAreaCollection, FireRiskCollection, WindCollection, SdisCollection } from '@types/index';
import './Map.css';

interface MapProps {
  fireData: FireCollection | null;
  burnedAreas: BurnedAreaCollection | null;
  fireRisk: FireRiskCollection | null;
  windData: WindCollection | null;
  sdisData: SdisCollection | null;
}

const Map: React.FC<MapProps> = ({ fireData, burnedAreas, fireRisk, windData, sdisData }) => {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { showFires, showBurnedAreas, showFireRisk, showWind, showSdis, windOpacity, darkMode } = useMapStore();

  useEffect(() => {
    if (map.current || !container.current) return;
    map.current = new maplibregl.Map({
      container: container.current,
      style: darkMode ? import.meta.env.VITE_MAP_STYLE_DARK : import.meta.env.VITE_MAP_STYLE_LIGHT,
      center: [2.3522, 46.8566], zoom: 5.5, maxBounds: [[-10, 40], [12, 52]],
    });
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    map.current.on('load', () => setLoaded(true));
    return () => { map.current?.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current || !loaded) return;
    map.current.setStyle(darkMode ? import.meta.env.VITE_MAP_STYLE_DARK : import.meta.env.VITE_MAP_STYLE_LIGHT);
  }, [darkMode, loaded]);

  return (
    <div className="map-wrapper">
      <div ref={container} className="map-container" />
      {loaded && map.current && (
        <>
          {showFires && fireData && <FireLayer map={map.current} fireData={fireData} />}
          {showBurnedAreas && burnedAreas && <CopernicusLayer map={map.current} data={burnedAreas} type="burned" />}
          {showFireRisk && fireRisk && <CopernicusLayer map={map.current} data={fireRisk} type="risk" />}
          {showWind && windData && <WindLayer map={map.current} windData={windData} opacity={windOpacity} />}
          {showSdis && sdisData && <SdisLayer map={map.current} sdisData={sdisData} />}
        </>
      )}
      <div className="map-info">
        <div className="info-item"><span>🔥 Feux:</span><span>{fireData?.features?.length ?? 0}</span></div>
        <div className="info-item"><span>🛰️ Copernicus:</span><span>{(burnedAreas?.features?.length ?? 0) + (fireRisk?.features?.length ?? 0)}</span></div>
        <div className="info-item"><span>🚒 SDIS:</span><span>{showSdis ? sdisData?.features?.length ?? 0 : 'Masqué'}</span></div>
        <div className="info-item"><span>🌬️ Vent:</span><span>{showWind ? 'Actif' : 'Inactif'}</span></div>
      </div>
    </div>
  );
};

export default Map;
