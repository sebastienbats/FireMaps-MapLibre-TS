import type { GeoJsonFeature, PointGeometry, GeoJsonFeatureCollection } from './geojson.types';

export interface WindPointProperties {
  readonly speed: number;
  readonly direction: number;
  readonly gust?: number;
  readonly source: string;
}

export type WindPointFeature = GeoJsonFeature<PointGeometry, WindPointProperties>;

export interface WindCollection extends GeoJsonFeatureCollection<WindPointFeature> {
  metadata: {
    source: string;
    count: number;
    generatedAt: string;
  };
}
