export type Position = [number, number];

export interface PointGeometry {
  type: 'Point';
  coordinates: Position;
}

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: Position[][];
}

export type GeoJsonGeometry = PointGeometry | PolygonGeometry;

export interface GeoJsonFeature<
  G extends GeoJsonGeometry = GeoJsonGeometry,
  P = Record<string, unknown>
> {
  type: 'Feature';
  geometry: G;
  properties: P;
}

export interface GeoJsonFeatureCollection<
  F extends GeoJsonFeature = GeoJsonFeature
> {
  type: 'FeatureCollection';
  features: F[];
  metadata?: Record<string, unknown>;
}

export interface BoundingBox {
  minLon: number;
  minLat: number;
  maxLon: number;
  maxLat: number;
}
