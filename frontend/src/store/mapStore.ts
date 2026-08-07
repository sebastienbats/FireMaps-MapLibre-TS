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

  // ✅ P3 : Exclusion mutuelle burned/risk
  activateBurnedAreas: () => void;
  activateFireRisk: () => void;
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

        toggleFires: () => set(s => ({ showFires: !s.showFires }), false, 'toggleFires'),

        // ✅ P3 : Exclusion mutuelle — activer burned désactive risk
        activateBurnedAreas: () =>
          set(
            s => ({
              showBurnedAreas: !s.showBurnedAreas,
              // Si on active burned, on désactive risk
              showFireRisk: s.showBurnedAreas ? s.showFireRisk : false,
            }),
            false,
            'activateBurnedAreas'
          ),

        // ✅ P3 : Exclusion mutuelle — activer risk désactive burned
        activateFireRisk: () =>
          set(
            s => ({
              showFireRisk: !s.showFireRisk,
              // Si on active risk, on désactive burned
              showBurnedAreas: s.showFireRisk ? s.showBurnedAreas : false,
            }),
            false,
            'activateFireRisk'
          ),

        toggleWind: () => set(s => ({ showWind: !s.showWind }), false, 'toggleWind'),
        toggleSdis: () => set(s => ({ showSdis: !s.showSdis }), false, 'toggleSdis'),
        setWindOpacity: (v) => set({ windOpacity: v }, false, 'setWindOpacity'),
        toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode }), false, 'toggleDarkMode'),
      }),
      {
        name: 'firemaps-map',
        partialize: s => ({ darkMode: s.darkMode, windOpacity: s.windOpacity }),
      }
    ),
    { name: 'MapStore' }
  )
);
