import type { GeoJsonFeature, PolygonGeometry, GeoJsonFeatureCollection } from './geojson.types';

export type BurnSeverityType = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevelType = 'faible' | 'modéré' | 'élevé' | 'extrême';

export interface BurnedAreaProperties {
  readonly severity: BurnSeverityType;
  readonly area_ha?: number;
  readonly acquisition_date?: string;
  readonly product: 'Burned Areas';
  readonly source: 'Copernicus EMS';
  [key: string]: unknown;
}

export type BurnedAreaFeature = GeoJsonFeature<PolygonGeometry, BurnedAreaProperties>;

export interface BurnedAreaCollection extends GeoJsonFeatureCollection<BurnedAreaFeature> {
  metadata: {
    source: 'Copernicus EMS';
    product: 'Burned Areas';
    count: number;
    generatedAt: string;
  };
}

export interface FireRiskProperties {
  readonly riskLevel: RiskLevelType;
  readonly risk_index?: number;
  readonly product: 'Fire Risk';
  readonly source: 'Copernicus EMS';
  [key: string]: unknown;
}

export type FireRiskFeature = GeoJsonFeature<PolygonGeometry, FireRiskProperties>;

export interface FireRiskCollection extends GeoJsonFeatureCollection<FireRiskFeature> {
  metadata: {
    source: 'Copernicus EMS';
    product: 'Fire Risk';
    count: number;
    generatedAt: string;
  };
}
