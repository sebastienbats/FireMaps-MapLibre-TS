import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface MapState {
  showFires: boolean;
  showBurnedAreas: boolean;
  showFireRisk: boolean;
  showWind: boolean;
  showSdis: boolean;
  windOpacity: number;
  darkMode: boolean;
  toggleFires: () => void;
  toggleBurnedAreas: () => void;
  toggleFireRisk: () => void;
  toggleWind: () => void;
  toggleSdis: () => void;
  setWindOpacity: (v: number) => void;
  toggleDarkMode: () => void;
}

export const useMapStore = create<MapState>()(
  devtools(
    persist(
      (set) => ({
        showFires: true,
        showBurnedAreas: true,
        showFireRisk: false,
        showWind: false,
        showSdis: true,
        windOpacity: 0.7,
        darkMode: true,
        toggleFires: () => set(s => ({ showFires: !s.showFires })),
        toggleBurnedAreas: () => set(s => ({ showBurnedAreas: !s.showBurnedAreas })),
        toggleFireRisk: () => set(s => ({ showFireRisk: !s.showFireRisk })),
        toggleWind: () => set(s => ({ showWind: !s.showWind })),
        toggleSdis: () => set(s => ({ showSdis: !s.showSdis })),
        setWindOpacity: (v) => set({ windOpacity: v }),
        toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),
      }),
      { name: 'firemaps-map', partialize: s => ({ darkMode: s.darkMode, windOpacity: s.windOpacity }) }
    ),
    { name: 'MapStore' }
  )
);
