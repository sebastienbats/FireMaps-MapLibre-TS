import React, { useState } from 'react';
import LayerToggle from './LayerToggle';
import { useMapStore } from '@store/mapStore';
import { useFireData } from '@hooks/useFireData';
import { useBurnedAreas, useFireRisk } from '@hooks/useCopernicusData';
import { useSdisData } from '@hooks/useSdisData';
import './Controls.css';

const Controls: React.FC = () => {
  const { darkMode, showFires, toggleFires, showBurnedAreas, toggleBurnedAreas, showFireRisk, toggleFireRisk, showWind, toggleWind, showSdis, toggleSdis, windOpacity, setWindOpacity } = useMapStore();
  const { data: fireData } = useFireData();
  const { data: burnedAreas } = useBurnedAreas();
  const { data: fireRisk } = useFireRisk();
  const { data: sdisData } = useSdisData();
  const [open, setOpen] = useState(true);

  return (
    <div className={`controls-panel ${open ? 'expanded' : ''} ${darkMode ? 'dark' : ''}`}>
      <div className="controls-header" onClick={() => setOpen(!open)}>
        <span className="controls-title">⚙️ Sources de données</span>
        <span className="controls-toggle">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="controls-content">
          <div className="control-section">
            <h3 className="section-title">🛰️ NASA FIRMS</h3>
            <LayerToggle label="Feux actifs (VIIRS + MODIS)" checked={showFires} onChange={toggleFires} count={fireData?.features?.length ?? 0} color="#e74c3c" />
          </div>
          <div className="control-section">
            <h3 className="section-title">🛰️ Copernicus EMS</h3>
            <LayerToggle label="Zones brûlées" checked={showBurnedAreas} onChange={toggleBurnedAreas} count={burnedAreas?.features?.length ?? 0} color="#8B4513" />
            <LayerToggle label="Zones à risque" checked={showFireRisk} onChange={toggleFireRisk} count={fireRisk?.features?.length ?? 0} color="#FF4500" />
          </div>
          <div className="control-section">
            <h3 className="section-title">🌤️ Météo-France</h3>
            <LayerToggle label="Vent" checked={showWind} onChange={toggleWind} color="#2ecc71" />
            {showWind && (
              <div className="control-row slider-row">
                <label>Opacité</label>
                <input type="range" min="0.1" max="1" step="0.1" value={windOpacity} onChange={e => setWindOpacity(parseFloat(e.target.value))} />
                <span className="value-display">{Math.round(windOpacity * 100)}%</span>
              </div>
            )}
          </div>
          <div className="control-section">
            <h3 className="section-title">🚒 SDIS</h3>
            <LayerToggle label="Casernes" checked={showSdis} onChange={toggleSdis} count={sdisData?.features?.length ?? 0} color="#3498db" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls;
