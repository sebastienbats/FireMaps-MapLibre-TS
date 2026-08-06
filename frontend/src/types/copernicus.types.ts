export type BurnSeverityType = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevelType = 'faible' | 'modéré' | 'élevé' | 'extrême';

export interface BurnedAreaProperties {
  readonly severity: BurnSeverityType;
  readonly area_ha?: number;
  readonly product: 'Burned Areas';
  readonly source: 'Copernicus EMS';
  [key: string]: unknown;
}

export interface BurnedAreaFeature {
  type: 'Feature';
  geometry: { type: 'Polygon'; coordinates: number[][][] };
  properties: BurnedAreaProperties;
}

export interface BurnedAreaCollection {
  type: 'FeatureCollection';
  features: BurnedAreaFeature[];
  metadata?: { source: string; product: string; count: number; generatedAt: string };
}

export interface FireRiskProperties {
  readonly riskLevel: RiskLevelType;
  readonly product: 'Fire Risk';
  readonly source: 'Copernicus EMS';
  [key: string]: unknown;
}

export interface FireRiskFeature {
  type: 'Feature';
  geometry: { type: 'Polygon'; coordinates: number[][][] };
  properties: FireRiskProperties;
}

export interface FireRiskCollection {
  type: 'FeatureCollection';
  features: FireRiskFeature[];
  metadata?: { source: string; product: string; count: number; generatedAt: string };
}
