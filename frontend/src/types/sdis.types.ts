export type SdisTypeValue = 'principal' | 'secondaire';

export interface SdisProperties {
  readonly name: string;
  readonly department: string;
  readonly type: SdisTypeValue;
  readonly capacity: string;
  readonly contact: string;
  readonly source: string;
}

export interface SdisFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: SdisProperties;
}

export interface SdisCollection {
  type: 'FeatureCollection';
  features: SdisFeature[];
  metadata?: { source: string; count: number; generatedAt: string };
}
