import React, { useState } from 'react';
import LayerToggle from './LayerToggle';
import { useMapStore } from '@store/mapStore';
import { useFireData } from '@hooks/useFireData';
import { useBurnedAreas, useFireRisk } from '@hooks/useCopernicusData';
import { useSdisData } from '@hooks/useSdisData';
import './Controls.css';

const Controls: React.FC = () => {
  const {
    darkMode,
    showFires, toggleFires,
    showBurnedAreas, activateBurnedAreas,
    showFireRisk, activateFireRisk,
    showWind, toggleWind,
    showSdis, toggleSdis,
    windOpacity, setWindOpacity,
  } = useMapStore();

  const { data: fireData } = useFireData();
  const { data: burnedAreas } = useBurnedAreas();
  const { data: fireRisk } = useFireRisk();
  const { data: sdisData } = useSdisData();

  const [open, setOpen] = useState(true);

  return (
    <div className={`controls-panel ${open ? 'expanded' : ''} ${darkMode ? 'dark' : ''}`}>
      <div
        className="controls-header"
        onClick={() => setOpen(!open)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(!open);
          }
        }}
      >
        <span className="controls-title">⚙️ Sources de données</span>
        <span className="controls-toggle">{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div className="controls-content">
          <div className="control-section">
            <h3 className="section-title">🛰️ NASA FIRMS</h3>
            <LayerToggle
              label="Feux actifs (VIIRS + MODIS)"
              checked={showFires}
              onChange={toggleFires}
              count={fireData?.features?.length ?? 0}
              color="#e74c3c"
            />
          </div>

          {/* ✅ P3 : Exclusion mutuelle burned/risk */}
          <div className="control-section">
            <h3 className="section-title">🔥 Zones brûlées / Risque</h3>
            <LayerToggle
              label="Zones brûlées (BA_MODIS)"
              checked={showBurnedAreas}
              onChange={activateBurnedAreas}
              count={burnedAreas?.features?.length ?? 0}
              color="#8B4513"
              disabled={showFireRisk} // ✅ Désactivé si risk est actif
            />
            <LayerToggle
              label="Risque incendie (FWI)"
              checked={showFireRisk}
              onChange={activateFireRisk}
              count={fireRisk?.features?.length ?? 0}
              color="#FF4500"
              disabled={showBurnedAreas} // ✅ Désactivé si burned est actif
            />
            {showBurnedAreas && showFireRisk && (
              <p style={{ fontSize: '.7rem', opacity: .5, marginTop: 4 }}>
                ⚠️ Une seule couche peut être active à la fois
              </p>
            )}
          </div>

          <div className="control-section">
            <h3 className="section-title">🌤️ Météo (Open-Meteo)</h3>
            <LayerToggle
              label="Vent"
              checked={showWind}
              onChange={toggleWind}
              color="#2ecc71"
            />
            {showWind && (
              <div className="control-row slider-row">
                <label htmlFor="wind-opacity">Opacité du vent</label>
                <input
                  id="wind-opacity"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={windOpacity}
                  onChange={e => setWindOpacity(parseFloat(e.target.value))}
                />
                <span className="value-display">{Math.round(windOpacity * 100)}%</span>
              </div>
            )}
          </div>

          <div className="control-section">
            <h3 className="section-title">🚒 SDIS (OpenStreetMap)</h3>
            <LayerToggle
              label="Casernes de pompiers"
              checked={showSdis}
              onChange={toggleSdis}
              count={sdisData?.features?.length ?? 0}
              color="#3498db"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Controls;
