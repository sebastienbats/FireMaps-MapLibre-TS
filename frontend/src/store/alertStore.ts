import { create } from 'zustand';
import type { FireCollection, SdisCollection } from '@types/index';
import { calculateDistance } from '@utils/geoUtils';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  details: string;
  frp?: number;
}

interface AlertState {
  alerts: Alert[];
  isExpanded: boolean;
  generateAlerts: (fire: FireCollection | null, sdis: SdisCollection | null) => void;
  toggleExpanded: () => void;
  dismissAlert: (id: string) => void;
}

export const useAlertStore = create<AlertState>()((set) => ({
  alerts: [],
  isExpanded: true,

  generateAlerts: (fireData, sdisData) => {
    if (!fireData?.features?.length) { set({ alerts: [] }); return; }

    const alerts: Alert[] = [];

    fireData.features.filter(f => f.properties.frp > 100).slice(0, 5).forEach(f => {
      alerts.push({
        id: `ext-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        message: `🔥 Feu extrême (FRP: ${f.properties.frp.toFixed(1)} MW)`,
        severity: f.properties.frp > 200 ? 'critical' : 'high',
        timestamp: new Date().toISOString(),
        details: 'Puissance radiative très élevée',
        frp: f.properties.frp,
      });
    });

    if (sdisData?.features?.length) {
      fireData.features.forEach(f => {
        const [lon, lat] = f.geometry.coordinates;
        for (const s of sdisData.features) {
          const [sLon, sLat] = s.geometry.coordinates;
          const d = calculateDistance(lat, lon, sLat, sLon);
          if (d < 10 && f.properties.frp > 50) {
            alerts.push({
              id: `sdis-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              message: `🚒 Feu à ${d.toFixed(1)} km de ${s.properties.name}`,
              severity: 'medium',
              timestamp: new Date().toISOString(),
              details: `Caserne à ${d.toFixed(1)} km`,
            });
            break;
          }
        }
      });
    }

    const order: Record<AlertSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => order[a.severity] - order[b.severity]);
    set({ alerts });
  },

  toggleExpanded: () => set(s => ({ isExpanded: !s.isExpanded })),
  dismissAlert: (id) => set(s => ({ alerts: s.alerts.filter(a => a.id !== id) })),
}));
