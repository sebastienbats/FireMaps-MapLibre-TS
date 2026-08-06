import type { GeoJsonFeature, PointGeometry, GeoJsonFeatureCollection } from './geojson.types';

export interface WeatherData {
  readonly temperature: number | null;
  readonly humidity: number | null;
  readonly windSpeed: number | null;
  readonly windDirection: number | null;
  readonly precipitation: number | null;
  readonly pressure: number | null;
  readonly source: 'Météo-France';
  readonly timestamp: string;
}

export interface WindPointProperties {
  readonly speed: number;
  readonly direction: number;
  readonly gust?: number;
  readonly source: 'Météo-France';
}

export type WindPointFeature = GeoJsonFeature<PointGeometry, WindPointProperties>;

export interface WindCollection extends GeoJsonFeatureCollection<WindPointFeature> {
  metadata: {
    source: 'Météo-France';
    count: number;
    generatedAt: string;
  };
}

export interface MeteoFranceToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}
