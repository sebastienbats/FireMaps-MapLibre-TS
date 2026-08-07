import React, { useRef, useEffect, useState, useCallback } from 'react';
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

// ✅ Ordre de superposition des couches (du fond vers le dessus)
export const LAYER_ORDER = [
  'fire-heat',         // 1. Heatmap (fond)
  'cop-burned-layer',  // 2. Zones brûlées
  'cop-risk-layer',    // 3. Zones à risque
  'fire-points',       // 4. Points de feu
  'sdis-points',       // 5. Casernes SDIS
  'wind-lines',        // 6. Vent (au-dessus)
] as const;

const Map: React.FC<MapProps> = ({ fireData, burnedAreas, fireRisk, windData, sdisData }) => {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [styleVersion, setStyleVersion] = useState(0);

  // ✅ Popup unique global
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const { showFires, showBurnedAreas, showFireRisk, showWind, showSdis, windOpacity, darkMode } = useMapStore();

  // ✅ Fonction de popup unique (ferme le précédent avant d'ouvrir le nouveau)
  const openPopup = useCallback((lngLat: [number, number], html: string) => {
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    popupRef.current = new maplibregl.Popup({ offset: 15, closeButton: true })
      .setLngLat(lngLat)
      .setHTML(html)
      .addTo(map.current!);
  }, []);

  // Initialisation de la carte
  useEffect(() => {
    if (map.current || !container.current) return;

    map.current = new maplibregl.Map({
      container: container.current,
      style: darkMode
        ? import.meta.env.VITE_MAP_STYLE_DARK
        : import.meta.env.VITE_MAP_STYLE_LIGHT,
      center: [2.3522, 46.8566],
      zoom: 5.5,
      maxBounds: [[-10, 40], [12, 52]],
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.current.on('load', () => setLoaded(true));

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ P1 : Ré-ajouter les couches après changement de style
  useEffect(() => {
    if (!map.current || !loaded) return;

    const handleStyleLoad = () => {
      // Incrémenter la version pour forcer le re-rendu des couches
      setStyleVersion(v => v + 1);
    };

    map.current.on('style.load', handleStyleLoad);

    return () => {
      map.current?.off('style.load', handleStyleLoad);
    };
  }, [loaded]);

  // ✅ P1 : Changer le style (dark/light) sans perdre les couches
  useEffect(() => {
    if (!map.current || !loaded) return;

    const newStyle = darkMode
      ? import.meta.env.VITE_MAP_STYLE_DARK
      : import.meta.env.VITE_MAP_STYLE_LIGHT;

    map.current.setStyle(newStyle);
  }, [darkMode, loaded]);

  // ✅ Cleanup du popup au démontage
  useEffect(() => {
    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
  }, []);

  return (
    <div className="map-wrapper">
      <div ref={container} className="map-container" />

      {loaded && map.current && (
        <div key={styleVersion}>
          {showFires && fireData && (
            <FireLayer map={map.current} fireData={fireData} openPopup={openPopup} />
          )}
          {showBurnedAreas && burnedAreas && (
            <CopernicusLayer map={map.current} data={burnedAreas} type="burned" openPopup={openPopup} />
          )}
          {showFireRisk && fireRisk && (
            <CopernicusLayer map={map.current} data={fireRisk} type="risk" openPopup={openPopup} />
          )}
          {showSdis && sdisData && (
            <SdisLayer map={map.current} sdisData={sdisData} openPopup={openPopup} />
          )}
          {showWind && windData && (
            <WindLayer map={map.current} windData={windData} opacity={windOpacity} />
          )}
        </div>
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
