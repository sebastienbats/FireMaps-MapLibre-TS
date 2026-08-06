import React, { useCallback, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import Map from '@components/Map/Map';
import Controls from '@components/Controls/Controls';
import Alerts from '@components/Alerts/Alerts';
import FireChart from '@components/Charts/FireChart';
import { useFireData } from '@hooks/useFireData';
import { useBurnedAreas, useFireRisk } from '@hooks/useCopernicusData';
import { useWindData } from '@hooks/useMeteoData';
import { useSdisData } from '@hooks/useSdisData';
import { useMapStore } from '@store/mapStore';
import { useAlertStore } from '@store/alertStore';
import { exportApi } from '@services/api';
import { escapeCsvValue } from '@utils/csvUtils';
import type { FireFeature } from '@types/index';
import './App.css';

const App: React.FC = () => {
  const { darkMode, toggleDarkMode } = useMapStore();
  const generateAlerts = useAlertStore(s => s.generateAlerts);

  const { data: fireData, isLoading: fL, error: fE, dataUpdatedAt, refetch } = useFireData();
  const { data: burnedAreas, isLoading: bL } = useBurnedAreas();
  const { data: fireRisk, isLoading: rL } = useFireRisk();
  const { data: windData, isLoading: wL } = useWindData();
  const { data: sdisData, isLoading: sL } = useSdisData();

  useEffect(() => { if (fireData) generateAlerts(fireData, sdisData ?? null); }, [fireData, sdisData, generateAlerts]);

  const loading = fL || bL || rL || wL || sL;
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  const exportCSV = useCallback((): void => {
    if (!fireData?.features?.length) { toast.error('Aucune donnée'); return; }
    const h = ['latitude','longitude','brightness','frp','confidence','acq_date','satellite','instrument','intensity','source'];
    let csv = h.join(',') + '\n';
    fireData.features.forEach((f: FireFeature) => {
      const p = f.properties, c = f.geometry.coordinates;
      csv += [c[1],c[0],p.brightness,p.frp,p.confidence,p.acq_date,p.satellite,p.instrument,p.intensity,p.source].map(escapeCsvValue).join(',') + '\n';
    });
    const fn = `firemap_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    void exportApi.saveExport({ filename: fn, data: csv, format: 'csv' });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${fn}.csv`; a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Export CSV');
  }, [fireData]);

  const exportGeoJSON = useCallback((): void => {
    if (!fireData?.features?.length) { toast.error('Aucune donnée'); return; }
    const fn = `firemap_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    void exportApi.saveExport({ filename: fn, data: fireData as unknown as Record<string, unknown>, format: 'geojson' });
    const blob = new Blob([JSON.stringify(fireData, null, 2)], { type: 'application/geo+json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${fn}.geojson`; a.click();
    URL.revokeObjectURL(a.href);
    toast.success('Export GeoJSON');
  }, [fireData]);

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      <Toaster position="top-right" toastOptions={{ duration: 5000, style: { background: darkMode ? '#1a1a2e' : '#fff', color: darkMode ? '#fff' : '#000' } }} />
      <header className="app-header">
        <div className="header-left">
          <h1>🔥 FireMaps France</h1>
          <div className="header-subtitle">NASA FIRMS · Copernicus EMS · Météo-France · SDIS</div>
          {lastUpdate && <span className="last-update">MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}</span>}
        </div>
        <div className="header-right">
          <button className="icon-button" onClick={toggleDarkMode}>{darkMode ? '☀️' : '🌙'}</button>
          <button className="icon-button" onClick={() => void refetch()} disabled={loading}>🔄</button>
          <button className="export-button" onClick={exportCSV}>📊 CSV</button>
          <button className="export-button" onClick={exportGeoJSON}>🗺️ GeoJSON</button>
        </div>
      </header>
      <main className="app-main">
        <div className="sidebar">
          <Controls />
          <Alerts />
          <FireChart fireData={fireData ?? null} source="NASA FIRMS (VIIRS + MODIS)" />
        </div>
        <div className="map-container">
          {loading && <div className="loading-overlay">🔥 Chargement...</div>}
          {fE && <div className="error-overlay">⚠️ {fE instanceof Error ? fE.message : 'Erreur'}</div>}
          <Map fireData={fireData ?? null} burnedAreas={burnedAreas ?? null} fireRisk={fireRisk ?? null} windData={windData ?? null} sdisData={sdisData ?? null} />
        </div>
      </main>
    </div>
  );
};

export default App;
