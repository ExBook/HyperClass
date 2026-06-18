import type { FeatureCollection, Feature, Geometry } from 'geojson';

export type FeatureProps = { id: string; name: string };
export type FeatureMap = FeatureCollection<Geometry, FeatureProps>;
export type FeatureOne = Feature<Geometry, FeatureProps>;

export type Usage = 'present' | 'practice';
export type Label = { id: string; text: string; targetFeatureId: string };
export type HitResult = { matched: boolean; featureId: string | null };
