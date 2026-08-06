export type Position = [number, number];
export type FireIntensityType = 'Faible' | 'Modérée' | 'Élevée' | 'Extrême';
export type FireIntensityClassType = 'low' | 'medium' | 'high' | 'extreme';
export type FireSensorType = 'VIIRS' | 'MODIS';

export interface FireProperties {
  readonly brightness: number;
  readonly frp: number;
  readonly confidence: number;
  readonly acq_date: string | null;
  readonly acq_time: string | null;
  readonly satellite: string;
  readonly instrument: FireSensorType;
  readonly daynight: 'D' | 'N';
  readonly intensity: FireIntensityType;
  readonly intensityClass: FireIntensityClassType;
  readonly source: 'NASA FIRMS';
}

export interface FireFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: Position };
  properties: FireProperties;
}

export interface FireCollection {
  type: 'FeatureCollection';
  features: FireFeature[];
  metadata?: { source: string; sensors: FireSensorType[]; count: number; generatedAt: string };
}

export interface FireApiResponse {
  data: FireCollection;
  metadata: { source: string; sensors: FireSensorType[]; days: number; count: number; timestamp: string };
}
