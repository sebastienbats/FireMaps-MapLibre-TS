import type { GeoJsonFeature, PointGeometry, GeoJsonFeatureCollection } from './geojson.types';

export type SdisTypeValue = 'principal' | 'secondaire';

export interface SdisProperties {
  readonly name: string;
  readonly department: string;
  readonly type: SdisTypeValue;
  readonly capacity: string;
  readonly contact: string;
  readonly source: 'SDIS';
}

export type SdisFeature = GeoJsonFeature<PointGeometry, SdisProperties>;

export interface SdisCollection extends GeoJsonFeatureCollection<SdisFeature> {
  metadata: {
    source: string;
    count: number;
    department?: string;
    generatedAt: string;
  };
}
