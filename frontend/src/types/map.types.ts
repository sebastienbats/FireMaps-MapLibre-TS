import type { FireCollection } from './fire.types';
import type { BurnedAreaCollection, FireRiskCollection } from './copernicus.types';
import type { WindCollection } from './meteo.types';
import type { SdisCollection } from './sdis.types';

export interface FireLayerProps { map: maplibregl.Map; fireData: FireCollection; }
export interface CopernicusLayerProps { map: maplibregl.Map; data: BurnedAreaCollection | FireRiskCollection; type: 'burned' | 'risk'; }
export interface WindLayerProps { map: maplibregl.Map; windData: WindCollection; opacity: number; }
export interface SdisLayerProps { map: maplibregl.Map; sdisData: SdisCollection; }

export interface LayerToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  count?: number;
  color: string;
}

export interface FireChartProps {
  fireData: FireCollection | null;
  source: string;
}
