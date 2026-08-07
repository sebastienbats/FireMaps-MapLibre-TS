import type { GeoJsonFeature, PointGeometry, GeoJsonFeatureCollection } from './geojson.types';

export type FireIntensityType = 'Faible' | 'Modérée' | 'Élevée' | 'Extrême';
export type FireIntensityClassType = 'low' | 'medium' | 'high' | 'extreme';
export type FireSensorType = 'VIIRS' | 'MODIS';
export type DayNightType = 'D' | 'N';

export interface FireProperties {
  readonly brightness: number;
  readonly frp: number;
  readonly confidence: number;
  readonly acq_date: string | null;
  readonly acq_time: string | null;
  readonly satellite: string;
  readonly instrument: FireSensorType;
  readonly daynight: DayNightType;
  readonly intensity: FireIntensityType;
  readonly intensityClass: FireIntensityClassType;
  readonly source: string;
}

export type FireFeature = GeoJsonFeature<PointGeometry, FireProperties>;

export interface FireCollection extends GeoJsonFeatureCollection<FireFeature> {
  metadata: {
    source: string;
    sensors: FireSensorType[];
    count: number;
    generatedAt: string;
  };
}

export interface FireApiResponse {
  data: FireCollection;
  metadata: {
    source: string;
    sensors: FireSensorType[];
    days: number;
    count: number;
    timestamp: string;
  };
}

export interface FireHistoryFeature {
  coordinates: [number, number];
  frp: number;
  confidence: number;
  satellite: string;
  instrument: FireSensorType;
  intensity: FireIntensityType;
}

export interface IFireHistory {
  timestamp: Date;
  source: string;
  count: number;
  features: FireHistoryFeature[];
}

export interface FirmsCsvRecord {
  latitude: string;
  longitude: string;
  brightness: string;
  scan: string;
  track: string;
  satellite: string;
  instrument: string;
  confidence: string;
  version: string;
  bright_t31: string;
  frp: string;
  daynight: string;
  acq_date: string;
  acq_time: string;
}
