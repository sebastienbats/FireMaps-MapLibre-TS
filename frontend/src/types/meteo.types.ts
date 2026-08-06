export interface WindPointProperties {
  readonly speed: number;
  readonly direction: number;
  readonly gust?: number;
  readonly source: 'Météo-France';
}

export interface WindPointFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: WindPointProperties;
}

export interface WindCollection {
  type: 'FeatureCollection';
  features: WindPointFeature[];
  metadata?: { source: string; count: number; generatedAt: string };
}
